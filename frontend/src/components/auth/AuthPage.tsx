import React, { useState, useRef } from 'react';
import { ShieldCheck, Phone, Building2, KeyRound, ArrowRight, UserPlus, HelpCircle, Sparkles, Globe, AlertCircle, CheckCircle2, Lock, MapPin, Crosshair, Navigation, ArrowLeft, Mic, MicOff, Volume2 } from 'lucide-react';
import { UserSession } from '../../types';
import { loginFarmer, registerFarmer, loginInsurance } from '../../services/api';
import { encodeDigipin } from '../../utils/digipin';
import {
  speakAloud,
  stopSpeaking,
  primeSpeechSynthesis,
  playChime,
  cleanSpokenName,
  spokenToDigits,
  startFieldVoiceRecognition,
  createFieldSpeechRecognizer
} from '../../utils/speech';

interface Props {
  onLoginSuccess: (session: UserSession) => void;
  language: 'en' | 'kn';
  onLanguageChange: (lang: 'en' | 'kn') => void;
}

export const AuthPage: React.FC<Props> = ({
  onLoginSuccess,
  language,
  onLanguageChange
}) => {
  const [activeTab, setActiveTab] = useState<'farmer' | 'insurance'>('farmer');

  // Farmer Form State
  const [farmerName, setFarmerName] = useState<string>('Ravi Kumar');
  const [farmerMobile, setFarmerMobile] = useState<string>('9876543210');
  const [farmerOtp, setFarmerOtp] = useState<string>('1234');
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  // Register Form State (2-Step Registration: 1. Identity, 2. Land Parcel & Satellite GPS)
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [regName, setRegName] = useState<string>('');
  const [regMobile, setRegMobile] = useState<string>('');
  const [regState, setRegState] = useState<string>('Karnataka');
  const [regDistrict, setRegDistrict] = useState<string>('Bengaluru Rural');
  const [regVillage, setRegVillage] = useState<string>('Devanahalli');
  const [regSurveyNumber, setRegSurveyNumber] = useState<string>('125/2');
  const [regLatitude, setRegLatitude] = useState<number>(13.2456);
  const [regLongitude, setRegLongitude] = useState<number>(77.7123);
  const [regAreaAcres, setRegAreaAcres] = useState<number>(2.5);

  // Insurance Form State
  const [companyId, setCompanyId] = useState<string>('AGRI-INS-409');
  const [insurancePin, setInsurancePin] = useState<string>('claims2026');
  const [orgUnit, setOrgUnit] = useState<string>('Agriculture Insurance Co. of India (PMFBY Division)');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live microphone audio wave level (0-100)
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);

  // Voice Input State for Farmer Login (Name & Mobile)
  const [loginActiveVoiceField, setLoginActiveVoiceField] = useState<'name' | 'mobile' | null>(null);
  const [loginVoiceInterim, setLoginVoiceInterim] = useState<string>('');
  const [voiceInputStatus, setVoiceInputStatus] = useState<string | null>(null);
  const loginRecRef = useRef<any>(null);

  // Registration Modal Field-by-Field Voice State
  const [regActiveVoiceField, setRegActiveVoiceField] = useState<'name' | 'mobile' | 'district' | 'village' | null>(null);
  const [isRegFieldListening, setIsRegFieldListening] = useState<boolean>(false);
  const [regVoiceInterim, setRegVoiceInterim] = useState<string>('');
  const regRecRef = useRef<any>(null);
  const advanceTimerRef = useRef<any>(null);

  // Stop any active Login Voice Input
  const stopLoginVoiceInput = () => {
    stopSpeaking();
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (loginRecRef.current) {
      try { loginRecRef.current.stop(); } catch (e) {}
      loginRecRef.current = null;
    }
    setLoginActiveVoiceField(null);
    setVoiceInputStatus(null);
    setLoginVoiceInterim('');
    setMicAudioLevel(0);
  };

  // Farmer Login Voice-to-Text Input (Starts mic immediately and enters speech into Name or Mobile box)
  const startLoginVoiceInput = (field: 'name' | 'mobile', autoAdvance = false) => {
    primeSpeechSynthesis();
    stopSpeaking();
    if (loginRecRef.current) {
      try { loginRecRef.current.stop(); } catch (e) {}
      loginRecRef.current = null;
    }

    setLoginActiveVoiceField(field);
    setLoginVoiceInterim('');
    setMicAudioLevel(20);
    playChime('start');

    const promptText = field === 'name'
      ? (language === 'kn' ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ತಿಳಿಸಿ.' : 'Please tell me your full name.')
      : (language === 'kn' ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.' : 'Please speak your 10-digit mobile number.');

    setVoiceInputStatus(
      field === 'name'
        ? (language === 'kn' ? '🎙️ ಆಲಿಸುತ್ತಿದೆ... ನಿಮ್ಮ ಹೆಸರು ಹೇಳಿ' : '🎙️ Listening... Speak your full name now')
        : (language === 'kn' ? '🎙️ ಆಲಿಸುತ್ತಿದೆ... ನಿಮ್ಮ 10 ಅಂಕಿಯ ಸಂಖ್ಯೆ ಹೇಳಿ' : '🎙️ Listening... Speak your 10-digit mobile')
    );

    // Asynchronously speak prompt without blocking speech recognition
    speakAloud(promptText, {
      lang: language === 'kn' ? 'kn-IN' : 'en-IN',
      suppressChime: true
    });

    const controller = startFieldVoiceRecognition({
      lang: language === 'kn' ? 'kn-IN' : 'en-IN',
      onStart: () => {
        setVoiceInputStatus(
          field === 'name'
            ? (language === 'kn' ? '🎙️ ಆಲಿಸುತ್ತಿದೆ... ನಿಮ್ಮ ಹೆಸರು ಹೇಳಿ' : '🎙️ Listening... Speak your full name now')
            : (language === 'kn' ? '🎙️ ಆಲಿಸುತ್ತಿದೆ... ಸಂಖ್ಯೆ ಹೇಳಿ' : '🎙️ Listening... Speak your 10-digit mobile')
        );
      },
      onAudioLevel: (lvl) => {
        setMicAudioLevel(lvl);
      },
      onInterimText: (interim) => {
        setLoginVoiceInterim(interim);
        if (field === 'name') {
          const cleaned = cleanSpokenName(interim);
          if (cleaned) {
            setFarmerName(cleaned);
            setVoiceInputStatus(`Listening: "${interim}" ➔ ${cleaned}`);
          }
        } else if (field === 'mobile') {
          const digits = spokenToDigits(interim);
          if (digits) {
            setFarmerMobile(digits.slice(0, 10));
            setVoiceInputStatus(`Listening: "${interim}" ➔ ${digits.slice(0, 10)}`);
            if (digits.length >= 10) {
              playChime('success');
              setVoiceInputStatus(`✓ Mobile: ${digits.slice(-10)}`);
              if (controller) controller.stop();
              setLoginActiveVoiceField(null);
              setMicAudioLevel(0);
            }
          }
        }
      },
      onFinalText: (finalText) => {
        setLoginVoiceInterim('');
        playChime('success');

        if (field === 'name') {
          const cleaned = cleanSpokenName(finalText) || finalText;
          setFarmerName(cleaned);
          setVoiceInputStatus(`✓ Name: ${cleaned}`);
          if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
          if (autoAdvance) {
            advanceTimerRef.current = setTimeout(() => {
              if (controller) controller.stop();
              startLoginVoiceInput('mobile', false);
            }, 1400);
          } else {
            advanceTimerRef.current = setTimeout(() => {
              if (controller) controller.stop();
              setLoginActiveVoiceField(null);
              setMicAudioLevel(0);
            }, 1800);
          }
        } else if (field === 'mobile') {
          const digits = spokenToDigits(finalText);
          const phone = digits.length >= 10 ? digits.slice(-10) : digits;
          setFarmerMobile(phone);
          setVoiceInputStatus(`✓ Mobile: ${phone}`);
          if (controller) controller.stop();
          setLoginActiveVoiceField(null);
          setMicAudioLevel(0);
        }
      },
      onError: (err) => {
        console.warn('Login voice error:', err);
        setVoiceInputStatus(typeof err === 'string' ? err : 'Speech error. Try clicking the quick test chip below.');
        setLoginActiveVoiceField(null);
        setMicAudioLevel(0);
      },
      onEnd: () => {
        setLoginActiveVoiceField(null);
        setMicAudioLevel(0);
      }
    });

    loginRecRef.current = controller;
  };

  // Backwards-compatible alias for mobile voice button
  const handleVoiceInputLoginMobile = () => {
    if (loginActiveVoiceField === 'mobile') {
      stopLoginVoiceInput();
    } else {
      startLoginVoiceInput('mobile', false);
    }
  };

  // Stop any active Registration Voice Input
  const stopRegVoiceInput = () => {
    stopSpeaking();
    if (regRecRef.current) {
      try { regRecRef.current.stop(); } catch (e) {}
      regRecRef.current = null;
    }
    setRegActiveVoiceField(null);
    setIsRegFieldListening(false);
    setRegVoiceInterim('');
    setMicAudioLevel(0);
  };

  // Step-by-Step Voice Input for Registration Form (Starts microphone immediately & streams into fields)
  const startRegFieldVoiceInput = (
    field: 'name' | 'mobile' | 'district' | 'village',
    autoAdvance = false
  ) => {
    primeSpeechSynthesis();
    stopSpeaking();
    if (regRecRef.current) {
      try { regRecRef.current.stop(); } catch (e) {}
      regRecRef.current = null;
    }

    setRegActiveVoiceField(field);
    setIsRegFieldListening(true);
    setRegVoiceInterim('');
    playChime('start');

    const prompts: Record<string, { en: string; kn: string }> = {
      name: {
        en: 'Please tell me your full name.',
        kn: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ತಿಳಿಸಿ.'
      },
      mobile: {
        en: 'Please speak your 10-digit mobile number.',
        kn: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.'
      },
      district: {
        en: 'Which district is your farm located in?',
        kn: 'ನಿಮ್ಮ ಜಮೀನು ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿದೆ?'
      },
      village: {
        en: 'Please tell me your village name.',
        kn: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಊರಿನ ಹೆಸರನ್ನು ತಿಳಿಸಿ.'
      }
    };

    const promptObj = prompts[field];
    const promptText = language === 'kn' ? promptObj.kn : promptObj.en;

    // Asynchronously play prompt audio without blocking speech recognition
    speakAloud(promptText, {
      lang: language === 'kn' ? 'kn-IN' : 'en-IN',
      suppressChime: true
    });

    const controller = startFieldVoiceRecognition({
      lang: language === 'kn' ? 'kn-IN' : 'en-IN',
      onStart: () => {
        setIsRegFieldListening(true);
      },
      onAudioLevel: (lvl) => {
        setMicAudioLevel(lvl);
      },
      onInterimText: (interim) => {
        setRegVoiceInterim(interim);
        if (field === 'name') {
          const cleaned = cleanSpokenName(interim);
          if (cleaned) setRegName(cleaned);
        } else if (field === 'mobile') {
          const digits = spokenToDigits(interim);
          if (digits) {
            setRegMobile(digits.slice(0, 10));
            if (digits.length >= 10) {
              playChime('success');
              if (controller) controller.stop();
              if (autoAdvance) {
                setTimeout(() => startRegFieldVoiceInput('district', true), 700);
              } else {
                setRegActiveVoiceField(null);
                setIsRegFieldListening(false);
              }
            }
          }
        } else if (field === 'district') {
          const cleaned = cleanSpokenName(interim) || interim;
          setRegDistrict(cleaned);
        } else if (field === 'village') {
          const cleaned = cleanSpokenName(interim) || interim;
          setRegVillage(cleaned);
        }
      },
      onFinalText: (finalText) => {
        setRegVoiceInterim('');
        playChime('success');

        if (field === 'name') {
          const cleaned = cleanSpokenName(finalText) || finalText;
          setRegName(cleaned);
          if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
          if (autoAdvance) {
            advanceTimerRef.current = setTimeout(() => {
              if (controller) controller.stop();
              startRegFieldVoiceInput('mobile', true);
            }, 1400);
          } else {
            advanceTimerRef.current = setTimeout(() => {
              if (controller) controller.stop();
              setRegActiveVoiceField(null);
              setIsRegFieldListening(false);
            }, 1800);
          }
        } else if (field === 'mobile') {
          const digits = spokenToDigits(finalText);
          const phone = digits.length >= 10 ? digits.slice(-10) : digits;
          setRegMobile(phone);
          if (controller) controller.stop();
          if (autoAdvance) {
            setTimeout(() => startRegFieldVoiceInput('district', true), 700);
          } else {
            setRegActiveVoiceField(null);
            setIsRegFieldListening(false);
          }
        } else if (field === 'district') {
          const cleaned = cleanSpokenName(finalText) || finalText;
          setRegDistrict(cleaned);
          if (controller) controller.stop();
          if (autoAdvance) {
            setTimeout(() => startRegFieldVoiceInput('village', false), 700);
          } else {
            setRegActiveVoiceField(null);
            setIsRegFieldListening(false);
          }
        } else if (field === 'village') {
          const cleaned = cleanSpokenName(finalText) || finalText;
          setRegVillage(cleaned);
          if (controller) controller.stop();
          setRegActiveVoiceField(null);
          setIsRegFieldListening(false);
          speakAloud(
            language === 'kn'
              ? 'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಗುರುತಿನ ವಿವರಗಳು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿವೆ.'
              : 'Thank you! Your identity details are recorded.',
            { lang: language === 'kn' ? 'kn-IN' : 'en-IN' }
          );
        }
      },
      onError: (err) => {
        console.warn('Registration voice error:', err);
        setIsRegFieldListening(false);
      },
      onEnd: () => {
        setIsRegFieldListening(false);
      }
    });

    regRecRef.current = controller;
  };

  const handleFarmerLogin = async (e?: React.FormEvent, customMobile?: string) => {
    if (e) e.preventDefault();
    const mob = customMobile || farmerMobile;
    if (!mob || mob.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const session = await loginFarmer(mob, farmerOtp, farmerName);
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMsg(err.message || 'Farmer login failed. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleFarmerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regMobile.trim()) {
      setErrorMsg('Full Name and Mobile are mandatory.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const session = await registerFarmer({
        name: regName,
        mobile: regMobile,
        state: regState,
        district: regDistrict,
        village: regVillage
      });
      setShowRegisterModal(false);
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleInsuranceLogin = async (e?: React.FormEvent, customCompanyId?: string) => {
    if (e) e.preventDefault();
    const cid = customCompanyId || companyId;
    if (!cid.trim()) {
      setErrorMsg('Please enter your Company / Reviewer ID.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const session = await loginInsurance(cid, insurancePin);
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMsg(err.message || 'Insurance login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="p-4 sm:p-6 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-500/20 text-2xl font-bold">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white tracking-tight">
                Kisan<span className="text-emerald-400">Claim</span>
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                AI Satellite Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-400">National Crop Damage Evidence & Insurance Verification</p>
          </div>
        </div>

        {/* Language Switcher */}
        <button
          onClick={() => onLanguageChange(language === 'en' ? 'kn' : 'en')}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
        </button>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Dual Persona Switcher Tabs */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 mb-6 shadow-xl backdrop-blur-md">
            <button
              onClick={() => {
                setActiveTab('farmer');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'farmer'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-base">🌾</span>
              <span>{language === 'kn' ? 'ರೈತರ ಲಾಗಿನ್' : 'Farmer Login'}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('insurance');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'insurance'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-base">🏢</span>
              <span>{language === 'kn' ? 'ವಿಮಾ ಕಂಪನಿ' : 'Insurance Company'}</span>
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ================= FARMER LOGIN CARD ================= */}
          {activeTab === 'farmer' ? (
            <div className="bg-slate-900/90 rounded-3xl border border-emerald-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {language === 'kn' ? 'ರೈತರ ಸೈನ್-ಇನ್ & ಗುರುತಿಸುವಿಕೆ' : 'Farmer Sign-In & Verification'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {language === 'kn' ? 'ಹೆಸರು ಮತ್ತು ಮೊಬೈಲ್ ಮೂಲಕ ಪ್ರವೇಶಿಸಿ' : 'Enter or speak your name & mobile number'}
                  </p>
                </div>
              </div>

              {/* Guided Voice Sign-In Banner */}
              <div className="p-3 bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900 border border-emerald-500/40 rounded-2xl flex items-center justify-between mb-4 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl transition-all ${loginActiveVoiceField ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{language === 'kn' ? 'ಧ್ವನಿ ಮೂಲಕ ಸ್ವಯಂ ಭರ್ತಿ' : 'Voice-to-Text Auto Fill'}</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold">1-by-1</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      {loginActiveVoiceField ? (
                        <div className="flex items-center gap-1.5 text-emerald-300 font-mono font-bold">
                          <div className="flex items-end gap-0.5 h-3">
                            {[0.4, 0.85, 1.0, 0.7, 0.45].map((scale, i) => (
                              <span
                                key={i}
                                className="w-0.5 bg-emerald-400 rounded-full transition-all duration-75"
                                style={{ height: `${Math.max(3, Math.round((Math.max(micAudioLevel, 25) / 100) * 12 * scale))}px` }}
                              />
                            ))}
                          </div>
                          <span>
                            {language === 'kn'
                              ? `ಆಲಿಸುತ್ತಿದೆ: ${loginActiveVoiceField === 'name' ? 'ಹೆಸರು' : 'ಮೊಬೈಲ್'}`
                              : `Listening: ${loginActiveVoiceField === 'name' ? 'FULL NAME' : 'MOBILE NUMBER'}`}
                          </span>
                        </div>
                      ) : (
                        <span>{language === 'kn' ? 'ಮೊದಲು ಹೆಸರು ಕೇಳಿ ಟೈಪ್ ಮಾಡುತ್ತದೆ, ನಂತರ ಮೊಬೈಲ್' : 'Asks Full Name ➔ Speaks Mobile'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {loginActiveVoiceField ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (loginActiveVoiceField === 'name') startLoginVoiceInput('mobile', false);
                        else stopLoginVoiceInput();
                      }}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={stopLoginVoiceInput}
                      className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Stop
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startLoginVoiceInput('name', true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{language === 'kn' ? 'ಧ್ವನಿ ಆರಂಭಿಸಿ' : 'Start Voice Fill'}</span>
                  </button>
                )}
              </div>

              <form onSubmit={e => handleFarmerLogin(e)} className="space-y-4">
                {/* Field 1: Farmer Full Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      {language === 'kn' ? 'ರೈತರ ಪೂರ್ಣ ಹೆಸರು' : 'Farmer Full Name'}
                    </label>
                    <button
                      type="button"
                      onClick={() => startLoginVoiceInput('name', false)}
                      className={`text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                        loginActiveVoiceField === 'name'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse font-extrabold'
                          : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750'
                      }`}
                      title="Speak full name"
                    >
                      <Mic className="w-3 h-3" />
                      <span>{loginActiveVoiceField === 'name' ? (language === 'kn' ? 'ಆಲಿಸುತ್ತಿದೆ...' : 'Listening...') : (language === 'kn' ? 'ಹೆಸರು ಹೇಳಿ' : 'Speak Name')}</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      value={farmerName}
                      onChange={e => setFarmerName(e.target.value)}
                      placeholder="e.g. Ravi Kumar"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-white outline-none pr-10 transition-all ${
                        loginActiveVoiceField === 'name'
                          ? 'border-emerald-400 ring-2 ring-emerald-500/30 bg-emerald-950/20'
                          : 'border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => startLoginVoiceInput('name', false)}
                      title="Click to speak your name"
                      className={`absolute right-2.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                        loginActiveVoiceField === 'name'
                          ? 'text-emerald-300 bg-emerald-500/20 animate-pulse'
                          : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                  {loginActiveVoiceField === 'name' && (
                    <div className="mt-1.5 p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-[11px] font-mono text-emerald-300">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>{loginVoiceInterim ? `Typing: "${loginVoiceInterim}"` : 'Listening... Speak your name clearly'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={stopLoginVoiceInput}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                      >
                        Done
                      </button>
                    </div>
                  )}

                  {/* 1-Click Spoken Test Chips for Name */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium">Quick Spoken Samples:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFarmerName('Ravi Kumar');
                        playChime('success');
                        setVoiceInputStatus('✓ Spoken Name: Ravi Kumar');
                      }}
                      className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-750 text-emerald-400 text-[10px] font-mono rounded-md border border-slate-700 hover:border-emerald-500/50 transition cursor-pointer"
                    >
                      🗣️ "Ravi Kumar"
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFarmerName('Ramesh Patil');
                        playChime('success');
                        setVoiceInputStatus('✓ Spoken Name: Ramesh Patil');
                      }}
                      className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-750 text-emerald-400 text-[10px] font-mono rounded-md border border-slate-700 hover:border-emerald-500/50 transition cursor-pointer"
                    >
                      🗣️ "Ramesh Patil"
                    </button>
                  </div>
                </div>

                {/* Field 2: Mobile Number */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      {language === 'kn' ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ' : 'Mobile Number'}
                    </label>
                    <button
                      type="button"
                      onClick={() => startLoginVoiceInput('mobile', false)}
                      className={`text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                        loginActiveVoiceField === 'mobile'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse font-extrabold'
                          : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750'
                      }`}
                      title="Speak mobile number"
                    >
                      <Mic className="w-3 h-3" />
                      <span>{loginActiveVoiceField === 'mobile' ? (language === 'kn' ? 'ಆಲಿಸುತ್ತಿದೆ...' : 'Listening...') : (language === 'kn' ? 'ಧ್ವನಿ ಮೂಲಕ ನಮೂದಿಸಿ' : 'Speak to Type')}</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs text-slate-400 font-bold border-r border-slate-700 pr-2">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={farmerMobile}
                      onChange={e => setFarmerMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className={`w-full bg-slate-950 border rounded-xl pl-16 pr-10 py-2.5 text-sm text-white font-mono outline-none tracking-wider transition-all ${
                        loginActiveVoiceField === 'mobile'
                          ? 'border-emerald-400 ring-2 ring-emerald-500/30 bg-emerald-950/20'
                          : 'border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => startLoginVoiceInput('mobile', false)}
                      title="Click to speak your mobile number"
                      className={`absolute right-2.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                        loginActiveVoiceField === 'mobile'
                          ? 'text-emerald-300 bg-emerald-500/20 animate-pulse'
                          : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                  {loginActiveVoiceField === 'mobile' && (
                    <div className="mt-2 p-2 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <div className="flex items-end gap-0.5 h-4 px-1">
                          {[0.4, 0.85, 1.0, 0.7, 0.45].map((scale, i) => (
                            <span
                              key={i}
                              className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                              style={{ height: `${Math.max(4, Math.round((Math.max(micAudioLevel, 25) / 100) * 16 * scale))}px` }}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-mono text-emerald-300 font-bold">
                          {loginVoiceInterim ? `Typing: "${loginVoiceInterim}"` : 'Listening... Speak digits now'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={stopLoginVoiceInput}
                        className="px-2 py-0.5 bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                      >
                        Stop
                      </button>
                    </div>
                  )}

                  {!loginActiveVoiceField && voiceInputStatus && (
                    <div className="mt-1.5 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5 animate-fadeIn">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{voiceInputStatus}</span>
                    </div>
                  )}

                  {/* 1-Click Spoken Test Chips for Mobile */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium">Quick Spoken Samples:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFarmerMobile('9876543210');
                        playChime('success');
                        setVoiceInputStatus('✓ Spoken: 9876543210');
                      }}
                      className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-750 text-emerald-400 text-[10px] font-mono rounded-md border border-slate-700 hover:border-emerald-500/50 transition cursor-pointer"
                    >
                      🗣️ "9876543210"
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFarmerMobile('9945012345');
                        playChime('success');
                        setVoiceInputStatus('✓ Spoken: 9945012345');
                      }}
                      className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-750 text-emerald-400 text-[10px] font-mono rounded-md border border-slate-700 hover:border-emerald-500/50 transition cursor-pointer"
                    >
                      🗣️ "9945012345"
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      {language === 'kn' ? 'OTP / ಪಾಸ್‌ವರ್ಡ್' : 'OTP / Access PIN'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      {language === 'kn' ? 'ಸಹಾಯ ಬೇಕೇ?' : 'Forgot PIN?'}
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={farmerOtp}
                      onChange={e => setFarmerOtp(e.target.value)}
                      placeholder="1234"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Cadastral GPS & Satellite Link Status */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-300 font-mono">
                      {farmerMobile === '9876543210'
                        ? 'Survey 125/2 • 13.2456°N, 77.7123°E'
                        : farmerMobile === '9845123456'
                        ? 'Survey 48/1A • 16.4312°N, 74.5982°E'
                        : farmerMobile === '9900112233'
                        ? 'Survey 88/2 • 13.0722°N, 77.7981°E'
                        : 'Survey 125/2 • 13.2456°N, 77.7123°E'}
                    </span>
                  </div>
                  <span className="text-cyan-300 font-mono font-bold">
                    {encodeDigipin(
                      farmerMobile === '9845123456' ? 16.4312 : farmerMobile === '9900112233' ? 13.0722 : 13.2456,
                      farmerMobile === '9845123456' ? 74.5982 : farmerMobile === '9900112233' ? 77.7981 : 77.7123
                    )}
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'Verifying...' : language === 'kn' ? 'ಮುಂದುವರಿಯಿರಿ' : 'Log In to Farmer Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Demo Quick Logins for Judges */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2 text-center">
                  ⚡ 1-Click Demo Logins for Hackathon Judges
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFarmerMobile('9876543210');
                      handleFarmerLogin(undefined, '9876543210');
                    }}
                    className="w-full p-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <strong className="text-white block">🌱 Ravi Kumar (Real Flood-Affected Farmer)</strong>
                      <span className="text-[11px] text-emerald-400">Devanahalli • Verified Claim KSN-1025 (NDVI -62%, 142mm rain)</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded font-bold">
                      VERIFIED REAL
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFarmerMobile('9900112233');
                      handleFarmerLogin(undefined, '9900112233');
                    }}
                    className="w-full p-2 bg-red-950/60 hover:bg-red-900/60 border border-red-500/50 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer animate-pulse"
                  >
                    <div>
                      <strong className="text-red-200 block">🚨 Vikram Singh (Fraud Demo — Fake Images)</strong>
                      <span className="text-[11px] text-red-300">Hosakote • Spoofed GPS (14km), Dry Satellite (0.76 NDVI)</span>
                    </div>
                    <span className="text-[10px] font-mono text-red-300 bg-red-500/30 px-2 py-0.5 rounded font-bold border border-red-500/50">
                      FLAGGED FAKE
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFarmerMobile('9845123456');
                      handleFarmerLogin(undefined, '9845123456');
                    }}
                    className="w-full p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <strong className="text-slate-200 block">Suresh Patil (Belagavi — Sugarcane)</strong>
                      <span className="text-[11px] text-slate-400">Sugarcane Flood Claim KSN-1088 (Approved)</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">9845123456</span>
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(true)}
                    className="text-xs text-emerald-400 font-semibold hover:underline flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{language === 'kn' ? 'ಹೊಸ ರೈತರ ನೋಂದಣಿ' : 'New Farmer? Register Parcel & Profile'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================= INSURANCE COMPANY LOGIN CARD ================= */
            <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-blue-500/20 text-cyan-400 rounded-2xl border border-blue-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Insurance Adjudicator Sign-In
                  </h2>
                  <p className="text-xs text-slate-400">
                    Satellite Evidence & Claim Review Console
                  </p>
                </div>
              </div>

              <form onSubmit={e => handleInsuranceLogin(e)} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Insurance Company / Reviewer ID
                  </label>
                  <div className="relative flex items-center">
                    <Building2 className="absolute left-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={companyId}
                      onChange={e => setCompanyId(e.target.value)}
                      placeholder="AGRI-INS-409"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono uppercase outline-none focus:border-cyan-500 tracking-wider"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Organization Unit
                  </label>
                  <select
                    value={orgUnit}
                    onChange={e => setOrgUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-cyan-500"
                  >
                    <option value="Agriculture Insurance Co. of India (PMFBY Division)">Agriculture Insurance Co. of India (AIC - PMFBY Division)</option>
                    <option value="State Crop Loss Review & Risk Desk">State Crop Loss Review & Risk Desk</option>
                    <option value="National Geospatial Adjudication Hub">National Geospatial Adjudication Hub</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Security Access Code
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={insurancePin}
                      onChange={e => setInsurancePin(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'Authenticating...' : 'Access Reviewer Console'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Demo Quick Login for Judges */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2 text-center">
                  ⚡ 1-Click Demo Reviewer Access for Judges
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCompanyId('AGRI-INS-409');
                    handleInsuranceLogin(undefined, 'AGRI-INS-409');
                  }}
                  className="w-full p-2.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <strong className="text-white block">🏢 Lead Adjudicator: Ananya Sharma</strong>
                    <span className="text-[11px] text-cyan-300">Senior Agronomist • AIC Claims Desk</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-200 bg-cyan-500/20 px-2 py-0.5 rounded">
                    AGRI-INS-409
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ================= REGISTER MODAL ================= */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white">Register New Farmer Profile</h3>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Step {regStep} of 2
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {regStep === 1
                ? 'Step 1: Farmer personal identity for PMFBY verification'
                : 'Step 2: Land parcel cadastral coordinates & satellite mapping'}
            </p>

            <form onSubmit={handleFarmerRegister} className="space-y-3 text-xs">
              {regStep === 1 ? (
                <>
                  {/* Guided Voice Fill Assistant Banner */}
                  <div className="p-3 bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900 border border-emerald-500/40 rounded-2xl flex items-center justify-between mb-3 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl transition-all ${regActiveVoiceField ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{language === 'kn' ? 'ಧ್ವನಿ ಮೂಲಕ ಫಾರ್ಮ್ ಭರ್ತಿ' : 'Voice-to-Text Auto Fill'}</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold">1-by-1</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          {regActiveVoiceField ? (
                            <div className="flex items-center gap-1.5 text-emerald-300 font-mono font-bold">
                              <div className="flex items-end gap-0.5 h-3">
                                {[0.4, 0.85, 1.0, 0.7, 0.45].map((scale, i) => (
                                  <span
                                    key={i}
                                    className="w-0.5 bg-emerald-400 rounded-full transition-all duration-75"
                                    style={{ height: `${Math.max(3, Math.round((Math.max(micAudioLevel, 25) / 100) * 12 * scale))}px` }}
                                  />
                                ))}
                              </div>
                              <span>
                                {language === 'kn'
                                  ? `ಆಲಿಸುತ್ತಿದೆ: ${regActiveVoiceField === 'name' ? 'ಹೆಸರು' : regActiveVoiceField === 'mobile' ? 'ಮೊಬೈಲ್' : regActiveVoiceField === 'district' ? 'ಜಿಲ್ಲೆ' : 'ಗ್ರಾಮ'}`
                                  : `Listening: ${regActiveVoiceField.toUpperCase()}`}
                              </span>
                            </div>
                          ) : (
                            <span>{language === 'kn' ? 'ಮೊದಲು ಹೆಸರು ಕೇಳಿ ಟೈಪ್ ಮಾಡುತ್ತದೆ, ನಂತರ ಮೊಬೈಲ್ & ಊರು' : 'Asks Name ➔ Mobile ➔ District ➔ Village'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {regActiveVoiceField ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (regActiveVoiceField === 'name') startRegFieldVoiceInput('mobile', true);
                            else if (regActiveVoiceField === 'mobile') startRegFieldVoiceInput('district', true);
                            else if (regActiveVoiceField === 'district') startRegFieldVoiceInput('village', false);
                            else stopRegVoiceInput();
                          }}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <span>Next</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={stopRegVoiceInput}
                          className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                        >
                          Stop
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startRegFieldVoiceInput('name', true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{language === 'kn' ? 'ಧ್ವನಿ ಆರಂಭಿಸಿ' : 'Start Voice Fill'}</span>
                      </button>
                    )}
                  </div>

                  {/* Quick Click-to-Speak Fill Chips */}
                  <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-xl mb-3 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium">Quick Spoken Samples:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRegName('Ramesh Patil');
                        setRegMobile('9876500000');
                        setRegDistrict('Bengaluru Rural');
                        setRegVillage('Devanahalli');
                        playChime('success');
                      }}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 text-[10px] rounded border border-slate-700 cursor-pointer"
                    >
                      🗣️ "Ramesh Patil, Devanahalli"
                    </button>
                  </div>

                  {/* Field 1: Full Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold">Full Name</label>
                      <button
                        type="button"
                        onClick={() => startRegFieldVoiceInput('name', false)}
                        className={`text-[10px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded transition cursor-pointer ${
                          regActiveVoiceField === 'name'
                            ? 'bg-emerald-500 text-slate-950 font-extrabold animate-pulse'
                            : 'text-emerald-400 hover:bg-slate-800'
                        }`}
                      >
                        <Mic className="w-3 h-3" />
                        <span>{regActiveVoiceField === 'name' ? 'Listening...' : 'Speak Name'}</span>
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        placeholder="e.g. Ramesh Patil"
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-white outline-none pr-9 transition-all ${
                          regActiveVoiceField === 'name'
                            ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-950/20'
                            : 'border-slate-700 focus:border-emerald-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => startRegFieldVoiceInput('name', false)}
                        className={`absolute right-2 p-1 rounded-lg transition ${
                          regActiveVoiceField === 'name' ? 'text-emerald-300 animate-pulse' : 'text-slate-400 hover:text-emerald-400'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {regActiveVoiceField === 'name' && (
                      <p className="text-[10px] text-emerald-300 font-mono mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>{isRegFieldListening ? (regVoiceInterim ? `Typing: "${regVoiceInterim}"` : 'Listening... Speak your name now') : 'Speaking prompt...'}</span>
                      </p>
                    )}
                  </div>

                  {/* Field 2: Mobile Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold">Mobile Number</label>
                      <button
                        type="button"
                        onClick={() => startRegFieldVoiceInput('mobile', false)}
                        className={`text-[10px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded transition cursor-pointer ${
                          regActiveVoiceField === 'mobile'
                            ? 'bg-emerald-500 text-slate-950 font-extrabold animate-pulse'
                            : 'text-emerald-400 hover:bg-slate-800'
                        }`}
                      >
                        <Mic className="w-3 h-3" />
                        <span>{regActiveVoiceField === 'mobile' ? 'Listening...' : 'Speak Mobile'}</span>
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={regMobile}
                        onChange={e => setRegMobile(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876500000"
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-white font-mono outline-none pr-9 transition-all ${
                          regActiveVoiceField === 'mobile'
                            ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-950/20'
                            : 'border-slate-700 focus:border-emerald-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => startRegFieldVoiceInput('mobile', false)}
                        className={`absolute right-2 p-1 rounded-lg transition ${
                          regActiveVoiceField === 'mobile' ? 'text-emerald-300 animate-pulse' : 'text-slate-400 hover:text-emerald-400'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {regActiveVoiceField === 'mobile' && (
                      <p className="text-[10px] text-emerald-300 font-mono mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>{isRegFieldListening ? (regVoiceInterim ? `Typing: "${regVoiceInterim}"` : 'Listening... Speak 10-digit number') : 'Speaking prompt...'}</span>
                      </p>
                    )}
                  </div>

                  {/* Field 3 & 4: District & Village */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-semibold">District</label>
                        <button
                          type="button"
                          onClick={() => startRegFieldVoiceInput('district', false)}
                          className={`text-[9px] font-bold p-0.5 rounded transition ${
                            regActiveVoiceField === 'district' ? 'text-emerald-300 font-extrabold animate-pulse' : 'text-slate-400 hover:text-emerald-400'
                          }`}
                          title="Speak District"
                        >
                          <Mic className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={regDistrict}
                          onChange={e => setRegDistrict(e.target.value)}
                          className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-white outline-none pr-7 transition-all ${
                            regActiveVoiceField === 'district'
                              ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-950/20'
                              : 'border-slate-700'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => startRegFieldVoiceInput('district', false)}
                          className="absolute right-1.5 text-slate-400 hover:text-emerald-400"
                        >
                          <Mic className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-semibold">Village</label>
                        <button
                          type="button"
                          onClick={() => startRegFieldVoiceInput('village', false)}
                          className={`text-[9px] font-bold p-0.5 rounded transition ${
                            regActiveVoiceField === 'village' ? 'text-emerald-300 font-extrabold animate-pulse' : 'text-slate-400 hover:text-emerald-400'
                          }`}
                          title="Speak Village"
                        >
                          <Mic className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={regVillage}
                          onChange={e => setRegVillage(e.target.value)}
                          className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-white outline-none pr-7 transition-all ${
                            regActiveVoiceField === 'village'
                              ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-950/20'
                              : 'border-slate-700'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => startRegFieldVoiceInput('village', false)}
                          className="absolute right-1.5 text-slate-400 hover:text-emerald-400"
                        >
                          <Mic className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowRegisterModal(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!regName.trim() || !regMobile.trim()) {
                          setErrorMsg('Full Name and Mobile are mandatory.');
                          return;
                        }
                        setErrorMsg(null);
                        setRegStep(2);
                      }}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Proceed to Step 2</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Survey Number</label>
                      <input
                        type="text"
                        value={regSurveyNumber}
                        onChange={e => setRegSurveyNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Land Area (Acres)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={regAreaAcres}
                        onChange={e => setRegAreaAcres(parseFloat(e.target.value) || 2.5)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Latitude (°N)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={regLatitude}
                        onChange={e => setRegLatitude(parseFloat(e.target.value) || 13.2456)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Longitude (°E)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={regLongitude}
                        onChange={e => setRegLongitude(parseFloat(e.target.value) || 77.7123)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Satellite DIGIPIN Match Badge */}
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">National DIGIPIN</span>
                      <span className="text-cyan-300 font-mono font-bold">{encodeDigipin(regLatitude, regLongitude)}</span>
                    </div>
                    <div className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>4m×4m National Postal Grid Cell Synced</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{loading ? 'Creating...' : 'Register & Enter'}</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ================= FORGOT PIN / HELP MODAL ================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Farmer PIN Assistance</h3>
            <p className="text-xs text-slate-400 mb-4">
              For this hackathon prototype, any default mobile uses test PIN <strong className="text-emerald-400 font-mono">1234</strong>.
            </p>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
            >
              Got it, Proceed to Login
            </button>
          </div>
        </div>
      )}

      {/* Bottom Footer */}
      <footer className="p-4 text-center text-xs text-slate-600 border-t border-slate-900">
        KisanClaim AI Geospatial Platform © 2026 • Powered by Sentinel-2 MSI, Open-Meteo & DIGIPIN
      </footer>
    </div>
  );
};
