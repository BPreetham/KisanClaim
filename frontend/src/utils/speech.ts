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
