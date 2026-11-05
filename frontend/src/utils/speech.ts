/**
 * KisanClaim Robust Web Speech API Wrapper
 * Solves Chromium garbage-collection bug, audio queue pausing, voice matching,
 * and markdown text cleaning for natural pronunciation.
 */

declare global {
  interface Window {
    _activeUtterance?: SpeechSynthesisUtterance | null;
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
 * Stop any ongoing speech playback
 */
export const stopSpeaking = (): void => {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
      window._activeUtterance = null;
    } catch (e) {
      console.warn('stopSpeaking failed:', e);
    }
  }
};

/**
 * Speaks text aloud with Indian English or preferred voice
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
  }
): (() => void) => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis not supported in this browser.');
    options?.onEnd?.();
    return () => {};
  }

  try {
    // Cancel any active speech
    window.speechSynthesis.cancel();

    // Chrome bugfix: resume if stuck in paused state
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const clean = cleanTextForSpeech(text);
    if (!clean) {
      options?.onEnd?.();
      return () => {};
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    const targetLang = options?.lang || 'en-IN';
    utterance.lang = targetLang;
    utterance.rate = options?.rate ?? 0.98;
    utterance.pitch = options?.pitch ?? 1.0;

    // Pick best voice
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const match =
        voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase()) ||
        voices.find(v => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india')) ||
        voices.find(v => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase())) ||
        voices.find(v => v.lang.toLowerCase().startsWith('en')) ||
        voices[0];

      if (match) {
        utterance.voice = match;
      }
    }

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      window._activeUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      window._activeUtterance = null;
      options?.onError?.(e);
      options?.onEnd?.();
    };

    // CRITICAL: Attach to window to prevent V8 garbage-collecting the utterance
    window._activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);

    return () => {
      stopSpeaking();
    };
  } catch (err) {
    console.warn('Failed to speak text:', err);
    options?.onError?.(err);
    options?.onEnd?.();
    return () => {};
  }
};
