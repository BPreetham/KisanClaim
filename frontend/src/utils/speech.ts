/**
 * KisanClaim Robust Web Speech & Audio Utility
 * Solves:
 * 1. Chromium speech cancel/speak race conditions with asynchronous microtask decoupling
 * 2. Missing regional voices (fallback from kn-IN -> en-IN/hi-IN -> default)
 * 3. Garbage collection of active utterances in V8 engine
 * 4. Audio autoplay policies via audio unlocking / priming
 * 5. Web Audio synthesis chime for guaranteed auditory feedback
 */

declare global {
  interface Window {
    _activeUtterances?: SpeechSynthesisUtterance[];
    _speechHeartbeat?: number | null;
    _audioContextInstance?: AudioContext | null;
  }
}

/**
 * Clean markdown markup and format numbers/symbols for natural speech reading
 */
export const cleanTextForSpeech = (rawText: string): string => {
  return rawText
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold **text**
    .replace(/\*(.*?)\*/g, '$1')     // Italic *text*
    .replace(/`([^`]+)`/g, '$1')     // Inline code `code`
    .replace(/#{1,6}\s+/g, '')       // Headings #
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links [text](url)
    .replace(/₹\s*([0-9]+)/g, '$1 rupees') // ₹ symbol
    .replace(/\bNDVI\b/g, 'N D V I') // Spell out acronyms nicely
    .replace(/\bPMFBY\b/g, 'P M F B Y')
    .replace(/\bGPS\b/g, 'G P S')
    .replace(/\bEXIF\b/g, 'E X I F')
    .replace(/\bMSI\b/g, 'M S I')
    .replace(/\bDIGIPIN\b/g, 'Digi Pin')
    .replace(/([0-9]+)\/([0-9]+)/g, '$1 by $2') // e.g. 125/2 -> 125 by 2
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Checks if Speech Synthesis is available
 */
export const isSpeechSynthesisSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

/**
 * Checks if Speech Recognition is available
 */
export const isSpeechRecognitionSupported = (): boolean => {
  return typeof window !== 'undefined' && 
    (Boolean((window as any).SpeechRecognition) || Boolean((window as any).webkitSpeechRecognition));
};

/**
 * Web Audio API gentle notification chime
 * Guarantees audio playback feedback even if system voices are loading or muted
 */
export const playChime = (type: 'start' | 'success' | 'shutter' = 'start'): void => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!window._audioContextInstance || window._audioContextInstance.state === 'closed') {
      window._audioContextInstance = new AudioContextClass();
    }
    const ctx = window._audioContextInstance;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === 'shutter') {
      // Camera mechanical shutter click effect
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
      return;
    }

    if (type === 'success') {
      // Pleasant two-tone chime (high E -> high G)
      const freqs = [659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.25);
      });
      return;
    }

    // Default 'start' gentle chime (523Hz -> 659Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    // Non-critical if audio context is blocked
    console.debug('playChime notice:', e);
  }
};

/**
 * Prime speech synthesis on user interaction to satisfy browser autoplay policies
 */
export const primeSpeechSynthesis = (): void => {
  if (!isSpeechSynthesisSupported()) return;
  try {
    playChime('start');
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (e) {
    console.debug('primeSpeechSynthesis:', e);
  }
};

/**
 * Stop any ongoing speech playback cleanly
 */
export const stopSpeaking = (): void => {
  if (isSpeechSynthesisSupported()) {
    try {
      if (window._speechHeartbeat) {
        clearInterval(window._speechHeartbeat);
        window._speechHeartbeat = null;
      }
      window.speechSynthesis.cancel();
      window._activeUtterances = [];
    } catch (e) {
      console.warn('stopSpeaking failed:', e);
    }
  }
};

/**
 * Find the optimal voice available on the device
 */
export const pickBestVoice = (targetLang: string): SpeechSynthesisVoice | null => {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (voices.length === 0) return null;

  const tl = targetLang.toLowerCase();

  // 1. Exact match (e.g. kn-IN or en-IN)
  let voice = voices.find(v => v.lang.toLowerCase() === tl);
  if (voice) return voice;

  // 2. If target is Kannada (kn or kn-IN) and no direct Kannada voice exists,
  // find Indian English or Hindi as natural Indian regional pronunciation
  if (tl.startsWith('kn')) {
    voice = voices.find(v => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india')) ||
            voices.find(v => v.lang.toLowerCase().includes('hi-in') || v.lang.toLowerCase().startsWith('hi')) ||
            voices.find(v => v.lang.toLowerCase().startsWith('en'));
    if (voice) return voice;
  }

  // 3. Indian English / Indian voice
  voice = voices.find(v => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india'));
  if (voice) return voice;

  // 4. Any English voice
  voice = voices.find(v => v.lang.toLowerCase().startsWith('en'));
  if (voice) return voice;

  // 5. Default voice
  return voices.find(v => v.default) || voices[0] || null;
};

/**
 * Speaks text aloud with robust retry, voice selection, and Chromium bug fixes
 */
export const speakAloud = (
  text: string,
  options?: {
    lang?: string;
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
    suppressChime?: boolean;
  }
): (() => void) => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis not supported in this browser.');
    options?.onEnd?.();
    return () => {};
  }

  try {
    // Play light prompt chime for auditory confirmation
    if (!options?.suppressChime) {
      playChime('start');
    }

    // Cancel existing speech
    window.speechSynthesis.cancel();
    if (window._speechHeartbeat) {
      clearInterval(window._speechHeartbeat);
      window._speechHeartbeat = null;
    }

    const clean = cleanTextForSpeech(text);
    if (!clean) {
      options?.onEnd?.();
      return () => {};
    }

    if (!window._activeUtterances) {
      window._activeUtterances = [];
    }

    // CRITICAL CHROMIUM BUG FIX:
    // Window.speechSynthesis.cancel() takes ~30-50ms to flush its internal queue.
    // If speak() is called synchronously in the exact same tick, it gets wiped out!
    const timerId = setTimeout(() => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(clean);
        const requestedLang = options?.lang || 'en-IN';
        utterance.rate = options?.rate ?? 0.96;
        utterance.pitch = options?.pitch ?? 1.0;

        const bestVoice = pickBestVoice(requestedLang);
        if (bestVoice) {
          utterance.voice = bestVoice;
          // Important: Align utterance.lang with voice language to prevent synthesis rejection
          utterance.lang = bestVoice.lang;
        } else {
          utterance.lang = requestedLang.startsWith('kn') ? 'en-IN' : requestedLang;
        }

        utterance.onstart = () => {
          options?.onStart?.();

          // Heartbeat to prevent Chrome from pausing after 14 seconds
          if (window._speechHeartbeat) clearInterval(window._speechHeartbeat);
          window._speechHeartbeat = window.setInterval(() => {
            if (!window.speechSynthesis.speaking) {
              if (window._speechHeartbeat) clearInterval(window._speechHeartbeat);
              return;
            }
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }, 9000);
        };

        utterance.onend = () => {
          if (window._speechHeartbeat) {
            clearInterval(window._speechHeartbeat);
            window._speechHeartbeat = null;
          }
          if (window._activeUtterances) {
            window._activeUtterances = window._activeUtterances.filter(u => u !== utterance);
          }
          options?.onEnd?.();
        };

        utterance.onerror = (e: any) => {
          // Ignore canceled or interrupted which are user-triggered
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            console.warn('SpeechSynthesis error:', e);
            options?.onError?.(e);
          }
          if (window._speechHeartbeat) {
            clearInterval(window._speechHeartbeat);
            window._speechHeartbeat = null;
          }
          if (window._activeUtterances) {
            window._activeUtterances = window._activeUtterances.filter(u => u !== utterance);
          }
          options?.onEnd?.();
        };

        // Retain reference in window array to stop V8 GC
        if (!window._activeUtterances) {
          window._activeUtterances = [];
        }
        window._activeUtterances.push(utterance);
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Error during speak execution:', err);
        options?.onError?.(err);
        options?.onEnd?.();
      }
    }, 60);

    return () => {
      clearTimeout(timerId);
      stopSpeaking();
    };
  } catch (err) {
    console.warn('Failed to speak text:', err);
    options?.onError?.(err);
    options?.onEnd?.();
    return () => {};
  }
};

/**
 * Cleans spoken name text by stripping filler prefixes and formatting title case
 */
export const cleanSpokenName = (spoken: string): string => {
  if (!spoken) return '';
  const stripped = spoken
    .replace(/(?:my\s*name\s*is|i\s*am|this\s*is|nanna\s*hesaru|hesaru|farmer|namaste|hello|ನನ್ನ\s*ಹೆಸರು|ಹೆಸರು|ನಮಸ್ತೆ|ರೈತ)\s*/gi, '')
    .replace(/[,.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!stripped) return spoken.trim();

  return stripped
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

/**
 * Converts spoken number words (e.g. "nine eight seven...") to numeric digits
 */
export const spokenToDigits = (spoken: string): string => {
  const wordMap: Record<string, string> = {
    zero: '0', one: '1', two: '2', three: '3', four: '4',
    five: '5', six: '6', seven: '7', eight: '8', nine: '9',
    oh: '0',
    'ಸೊನ್ನೆ': '0', 'ಒಂದು': '1', 'ಎರಡು': '2', 'ಮೂರು': '3', 'ನಾಲ್ಕು': '4',
    'ಐದು': '5', 'ಆರು': '6', 'ಏಳು': '7', 'ಎಂಟು': '8', 'ಒಂಬತ್ತು': '9'
  };
  let text = spoken.toLowerCase();
  for (const [w, d] of Object.entries(wordMap)) {
    text = text.split(w).join(d);
  }
  return text.replace(/\D/g, '');
};

export interface FieldVoiceListenerOptions {
  lang?: string;
  onInterimText?: (text: string) => void;
  onFinalText?: (text: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onAudioLevel?: (level: number) => void;
}

export interface VoiceSessionController {
  stop: () => void;
  isListening: () => boolean;
}

/**
 * Robust, continuous speech recognition controller with:
 * 1. Automatic getUserMedia mic unlock
 * 2. Live Web Audio API volume measurement for visualizer
 * 3. Continuous recognition with auto-reconnection on unexpected drop
 * 4. Streaming interim transcription directly into fields
 * 5. Multi-language resilience (en-IN -> en-US -> browser default)
 */
export const startFieldVoiceRecognition = (options: FieldVoiceListenerOptions): VoiceSessionController | null => {
  if (typeof window === 'undefined') return null;

  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRec) {
    options.onError?.('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    return null;
  }

  let active = true;
  let micStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let animationFrameId: number | null = null;
  let recInstance: any = null;

  // 1. Request microphone & start Web Audio volume level analyzer
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      if (!active) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      micStream = stream;

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContext = new AudioContextClass();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const reportLevel = () => {
            if (!active) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const level = Math.min(100, Math.round((avg / 128) * 100));
            options.onAudioLevel?.(level);
            animationFrameId = requestAnimationFrame(reportLevel);
          };
          reportLevel();
        }
      } catch (e) {
        console.debug('Audio analyser setup:', e);
      }
    }).catch((err) => {
      console.warn('Microphone permission check:', err);
    });
  }

  // 2. Initialize continuous speech recognizer
  const initRecognizer = (langCode: string) => {
    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = langCode;

      rec.onstart = () => {
        playChime('start');
        options.onStart?.();
      };

      rec.onresult = (evt: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = 0; i < evt.results.length; ++i) {
          const trans = evt.results[i][0]?.transcript || '';
          if (evt.results[i].isFinal) {
            finalText += (finalText ? ' ' : '') + trans;
          } else {
            interimText += (interimText ? ' ' : '') + trans;
          }
        }

        const combined = (finalText + (interimText ? ' ' + interimText : '')).trim();
        if (combined) {
          options.onInterimText?.(combined);
        }
        if (finalText.trim()) {
          options.onFinalText?.(finalText.trim());
        }
      };

      rec.onerror = (evt: any) => {
        console.warn('Speech recognition error event:', evt.error);
        if (evt.error === 'no-speech') {
          // Ignore silence timeouts - do not abort while user is active
          return;
        }
        if (evt.error === 'network' && langCode !== 'en-US') {
          // Fallback from regional to standard en-US
          console.info('Switching speech language to fallback en-US');
          try { rec.abort(); } catch (e) {}
          if (active) {
            setTimeout(() => {
              if (active) initRecognizer('en-US');
            }, 150);
          }
          return;
        }
        if (evt.error === 'not-allowed') {
          options.onError?.('Microphone permission denied. Please allow microphone access in browser settings.');
          active = false;
        }
      };

      rec.onend = () => {
        // Automatically restart if session is still active (handles Chrome unexpected drops)
        if (active) {
          setTimeout(() => {
            if (active) {
              try {
                initRecognizer(langCode);
              } catch (e) {
                console.debug('Speech rec restart:', e);
              }
            }
          }, 120);
        } else {
          options.onEnd?.();
        }
      };

      rec.start();
      recInstance = rec;
    } catch (err) {
      console.warn('Error starting speech recognition:', err);
      options.onError?.(err);
    }
  };

  const initialLang = options.lang || (typeof navigator !== 'undefined' ? navigator.language : 'en-IN') || 'en-IN';
  initRecognizer(initialLang);

  return {
    stop: () => {
      active = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (micStream) {
        micStream.getTracks().forEach(t => t.stop());
        micStream = null;
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
        audioContext = null;
      }
      if (recInstance) {
        try {
          if (recInstance.abort) recInstance.abort();
          else recInstance.stop();
        } catch (e) {}
        recInstance = null;
      }
      options.onEnd?.();
    },
    isListening: () => active
  };
};

/**
 * Backward compatibility alias for single-shot field recognition
 */
export const createFieldSpeechRecognizer = (options: FieldVoiceListenerOptions): any => {
  return startFieldVoiceRecognition(options);
};

