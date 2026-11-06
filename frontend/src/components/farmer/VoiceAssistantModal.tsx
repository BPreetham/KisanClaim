import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  MapPin,
  Upload,
  Camera,
  Sparkles,
  X,
  ShieldAlert,
  Globe,
  ExternalLink,
  RefreshCw,
  Navigation,
  Edit3,
  AlertCircle,
  Maximize2,
  Trash2,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { encodeDigipin } from '../../utils/digipin';
import { generateDefaultParcelCoordinates } from '../../utils/geo';
import { LandPlotMapSelector } from './LandPlotMapSelector';
import {
  speakAloud,
  stopSpeaking,
  primeSpeechSynthesis,
  playChime,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  cleanSpokenName,
  spokenToDigits,
  startFieldVoiceRecognition,
  createFieldSpeechRecognizer
} from '../../utils/speech';
import { GeoCameraModal, GeoPhoto } from './GeoCameraModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
  language?: 'en' | 'kn';
}

export const VoiceAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onComplete,
  language = 'en'
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [lastParsedSummary, setLastParsedSummary] = useState<string>('');
  const [recErrorMsg, setRecErrorMsg] = useState<string | null>(null);

  // Live microphone audio wave level (0-100)
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);

  // Individual Field-by-Field Voice Input State for Step 1
  const [activeVoiceField, setActiveVoiceField] = useState<'farmerName' | 'mobile' | 'district' | 'village' | null>(null);
  const [isFieldListening, setIsFieldListening] = useState<boolean>(false);
  const [fieldInterimText, setFieldInterimText] = useState<string>('');
  const fieldRecRef = useRef<any>(null);
  const advanceTimerRef = useRef<any>(null);

  // Camera & Image Preview Modals
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState<any | null>(null);

  // Location Selector Options State: Satellite Plot Map (Default), Auto-Fetch GPS, or Manual Lat/Long
  const [locationMode, setLocationMode] = useState<'map' | 'autofetch' | 'manual'>('map');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string>('Select and adjust boundary points on satellite map, or use auto-fetch GPS');

  // Form State
  const [formData, setFormData] = useState({
    farmerName: 'Ravi Kumar',
    mobile: '9876543210',
    state: 'Karnataka',
    district: 'Bengaluru Rural',
    village: 'Devanahalli',
    surveyNumber: '125/2',
    landParcelId: 'KA-BLR-1025',
    digipin: '562C-8F29-KM',
    landAreaAcres: 2.5,
    latitude: 13.2456,
    longitude: 77.7123,
    polygonCoordinates: generateDefaultParcelCoordinates(13.2456, 77.7123),
    cropName: 'Ragi',
    variety: 'GPU-28',
    sowingDate: '2026-06-15',
    growthStage: 'Vegetative stage',
    insuredAreaAcres: 2.5,
    applicationNumber: 'PMFBY-2026-1025',
    disasterType: 'Flood',
    disasterDate: '2026-08-20',
    reportedCause: 'Heavy rainfall and localized runoff',
    damagePercentage: 70,
    description: 'My ragi field was submerged in water for two days due to heavy rainfall.',
    farmerLossEstimate: 18000,
    expectedClaim: 18000,
    photos: [
      {
        photo_url: '/static/sample_damaged_crop.jpg',
        photo_type: 'damaged_crop',
        timestamp: '2026-08-20T16:15:00',
        latitude: 13.2458,
        longitude: 77.7121,
        caption: 'Damaged ragi crop'
      },
      {
        photo_url: '/static/sample_flood_water.jpg',
        photo_type: 'waterlogging',
        timestamp: '2026-08-20T16:22:00',
        latitude: 13.2452,
        longitude: 77.7126,
        caption: 'Standing flood water in field'
      },
      {
        photo_url: '/static/sample_field_overview.jpg',
        photo_type: 'field_overview',
        timestamp: '2026-08-20T16:28:00',
        latitude: 13.2456,
        longitude: 77.7123,
        caption: 'Overall field boundary'
      }
    ]
  });

  const recognitionRef = useRef<any>(null);

  // Script Questions
  const questions = [
    {
      step: 1,
      title: language === 'kn' ? 'ರೈತರ ವಿವರಗಳು' : 'Step 1 — Farmer Identification',
      questionEn: 'Namaste! What is your full name, mobile number, and your village?',
      questionKn: 'ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು ನಿಮ್ಮ ಊರು ಯಾವುದು?',
      subtext: 'We ask only what is needed. Sensitive ID cards like Aadhaar are not required.'
    },
    {
      step: 2,
      title: language === 'kn' ? 'ಭೂಮಿ ಗುರುತಿಸುವಿಕೆ' : 'Step 2 — Land Identification & GPS Map',
      questionEn: 'What is your land survey number and approximate land area?',
      questionKn: 'ನಿಮ್ಮ ಭೂಮಿಯ ಸರ್ವೆ ಸಂಖ್ಯೆ ಮತ್ತು ವಿಸ್ತೀರ್ಣ ಎಷ್ಟು?',
      subtext: 'We automatically fetch your GPS latitude, longitude, and DIGIPIN code.'
    },
    {
      step: 3,
      title: language === 'kn' ? 'ಬೆಳೆ ವಿವರಗಳು' : 'Step 3 — Crop Details & Growth Stage',
      questionEn: 'Which crop did you grow, and what stage was the crop in when the disaster struck?',
      questionKn: 'ನೀವು ಯಾವ ಬೆಳೆ ಬೆಳೆದಿದ್ದೀರಿ, ಮತ್ತು ನಷ್ಟವಾದಾಗ ಬೆಳೆ ಯಾವ ಹಂತದಲ್ಲಿತ್ತು?',
      subtext: 'Select your crop and growth stage from the verified options.'
    },
    {
      step: 4,
      title: language === 'kn' ? 'ವಿಪತ್ತು ಮತ್ತು ನಷ್ಟ ವಿವರ' : 'Step 4 — Disaster Occurrence & Severity',
      questionEn: 'What disaster affected your crop, on which date, and approximately how much crop was damaged?',
      questionKn: 'ಯಾವ ನೈಸರ್ಗಿಕ ವಿಕೋಪ ಸಂಭವಿಸಿತು, ಯಾವ ದಿನಾಂಕದಂದು ಮತ್ತು ಶೇಕಡಾ ಎಷ್ಟು ಹಾನಿಯಾಗಿದೆ?',
      subtext: 'Describe what happened in your own words by voice or typing.'
    },
    {
      step: 5,
      title: language === 'kn' ? 'ಆರ್ಥಿಕ ನಷ್ಟ ಅಂದಾಜು' : 'Step 5 — Financial Loss Estimation',
      questionEn: 'Approximately how much money did you lose due to this crop damage?',
      questionKn: 'ಈ ಬೆಳೆ ಹಾನಿಯಿಂದ ನಿಮಗೆ ಅಂದಾಜು ಎಷ್ಟು ರೂಪಾಯಿ ನಷ್ಟವಾಗಿದೆ?',
      subtext: 'Enter your estimate in Indian Rupees. Official PMFBY rates will be benchmarked by AI.'
    },
    {
      step: 6,
      title: language === 'kn' ? 'ಛಾಯಾಚಿತ್ರ ಸಾಕ್ಷ್ಯಗಳು' : 'Step 6 — Photographic Evidence with Geo-Tags',
      questionEn: 'Please capture ground photographs of the damaged crop and field using your camera.',
      questionKn: 'ದಯವಿಟ್ಟು ಹಾನಿಗೊಳಗಾದ ಬೆಳೆ ಮತ್ತು ಹೊಲದ ಫೋಟೋಗಳನ್ನು ಕ್ಯಾಮೆರಾ ಮೂಲಕ ಸೆರೆಹಿಡಿಯಿರಿ.',
      subtext: 'Camera coordinates (GPS) and timestamp metadata are verified and stamped automatically.'
    }
  ];

  const currentQ = questions[currentStep - 1] || questions[0];

  // Sample voice answers per step for immediate testing & fallback
  const sampleAnswersForStep: Record<number, string[]> = {
    1: [
      'Ravi Kumar, 9876543210, Devanahalli',
      'Suresh Gowda, 9945012345, Ramanagara'
    ],
    2: [
      'Survey 125/2, marked 2.5 acres on satellite map',
      'Survey 125/2, 2.5 acres',
      'Survey 88/1, 3.2 acres'
    ],
    3: [
      'Ragi crop, vegetative stage',
      'Paddy crop, flowering stage',
      'Cotton crop, vegetative stage'
    ],
    4: [
      'Heavy flood, 70 percent damage, two days waterlogging',
      'Continuous rainfall, 60 percent crop loss'
    ],
    5: [
      '18000 rupees out-of-pocket loss',
      '25000 rupees total loss'
    ]
  };

  // Text to Speech
  const speakQuestion = (text: string) => {
    if (!voiceEnabled) return;
    speakAloud(text, {
      lang: language === 'kn' ? 'kn-IN' : 'en-IN',
      rate: 0.95,
      pitch: 1.0,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const toggleSpeakQuestion = () => {
    primeSpeechSynthesis();
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const qText = language === 'kn' ? currentQ.questionKn : currentQ.questionEn;
      speakQuestion(qText);
    }
  };

  // Auto-speak question on step change with debounce
  useEffect(() => {
    if (isOpen && voiceEnabled) {
      const qText = language === 'kn' ? currentQ.questionKn : currentQ.questionEn;
      const timer = setTimeout(() => {
        speakQuestion(qText);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStep, voiceEnabled, language]);

  // Stop speaking only when modal is closed
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      setIsSpeaking(false);
      stopFieldVoiceInput();
    }
  }, [isOpen]);

  // Stop field voice recognition helper
  const stopFieldVoiceInput = () => {
    stopSpeaking();
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (fieldRecRef.current) {
      try {
        if (fieldRecRef.current.abort) fieldRecRef.current.abort();
        else fieldRecRef.current.stop();
      } catch (e) {}
      fieldRecRef.current = null;
    }
    setIsFieldListening(false);
    setActiveVoiceField(null);
    setFieldInterimText('');
    setMicAudioLevel(0);
  };

  // Step 1: Sequential or single field-by-field voice input (Starts microphone immediately & streams into fields)
  const startFieldVoiceInput = (
    fieldName: 'farmerName' | 'mobile' | 'district' | 'village',
    autoAdvance = false
  ) => {
    primeSpeechSynthesis();
    stopSpeaking();
    if (fieldRecRef.current) {
      try { fieldRecRef.current.stop(); } catch (e) {}
      fieldRecRef.current = null;
    }

    setActiveVoiceField(fieldName);
    setIsFieldListening(true);
    setFieldInterimText('');
    playChime('start');

    const fieldPrompts: Record<string, { enPrompt: string; knPrompt: string; label: string }> = {
      farmerName: {
        enPrompt: 'Please tell me your full name.',
        knPrompt: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ತಿಳಿಸಿ.',
        label: 'Full Name'
      },
      mobile: {
        enPrompt: 'Please tell me your 10 digit mobile number.',
        knPrompt: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.',
        label: 'Mobile Number'
      },
      district: {
        enPrompt: 'Which district is your farm located in?',
        knPrompt: 'ನಿಮ್ಮ ಜಮೀನು ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿದೆ?',
        label: 'District'
      },
      village: {
        enPrompt: 'Please tell me your village name.',
        knPrompt: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಊರಿನ ಹೆಸರನ್ನು ತಿಳಿಸಿ.',
        label: 'Village'
      }
    };

    const promptObj = fieldPrompts[fieldName];
    const promptText = language === 'kn' ? promptObj.knPrompt : promptObj.enPrompt;

    // Concurrently play prompt audio without blocking speech recognition
    speakAloud(promptText, {
      lang: language === 'kn' ? 'kn-IN' : 'en-IN',
      suppressChime: true
    });

    const controller = startFieldVoiceRecognition({
      lang: language === 'kn' ? 'kn-IN' : 'en-IN',
      onStart: () => {
        setIsFieldListening(true);
        setRecErrorMsg(null);
      },
      onAudioLevel: (lvl) => {
        setMicAudioLevel(lvl);
      },
      onInterimText: (interim) => {
        setFieldInterimText(interim);
        if (fieldName === 'farmerName') {
          const cleaned = cleanSpokenName(interim);
          if (cleaned) setFormData(prev => ({ ...prev, farmerName: cleaned }));
        } else if (fieldName === 'mobile') {
          const digits = spokenToDigits(interim);
          if (digits) {
            setFormData(prev => ({ ...prev, mobile: digits.slice(0, 10) }));
            if (digits.length >= 10) {
              playChime('success');
              if (controller) controller.stop();
              if (autoAdvance) {
                setTimeout(() => startFieldVoiceInput('district', true), 700);
              } else {
                setActiveVoiceField(null);
                setIsFieldListening(false);
              }
            }
          }
        } else if (fieldName === 'district') {
          setFormData(prev => ({ ...prev, district: cleanSpokenName(interim) || interim }));
        } else if (fieldName === 'village') {
          setFormData(prev => ({ ...prev, village: cleanSpokenName(interim) || interim }));
        }
      },
      onFinalText: (finalText) => {
        setFieldInterimText('');
        playChime('success');

        if (fieldName === 'farmerName') {
          const cleaned = cleanSpokenName(finalText) || finalText;
          setFormData(prev => ({ ...prev, farmerName: cleaned }));
          setLastParsedSummary(`✓ Name typed: ${cleaned}`);
          if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
          if (autoAdvance) {
            advanceTimerRef.current = setTimeout(() => {
              if (controller) controller.stop();
              startFieldVoiceInput('mobile', true);
            }, 1400);
          } else {
            advanceTimerRef.current = setTimeout(() => {
              if (controller) controller.stop();
              setActiveVoiceField(null);
              setIsFieldListening(false);
            }, 1800);
          }
        } else if (fieldName === 'mobile') {
          const digits = spokenToDigits(finalText);
          const phone = digits.length >= 10 ? digits.slice(-10) : digits;
          setFormData(prev => ({ ...prev, mobile: phone }));
          setLastParsedSummary(`✓ Mobile typed: ${phone}`);
          if (controller) controller.stop();
          if (autoAdvance) {
            setTimeout(() => startFieldVoiceInput('district', true), 700);
          } else {
            setActiveVoiceField(null);
            setIsFieldListening(false);
          }
        } else if (fieldName === 'district') {
          const cleaned = cleanSpokenName(finalText) || finalText;
          setFormData(prev => ({ ...prev, district: cleaned }));
          setLastParsedSummary(`✓ District typed: ${cleaned}`);
          if (controller) controller.stop();
          if (autoAdvance) {
            setTimeout(() => startFieldVoiceInput('village', false), 700);
          } else {
            setActiveVoiceField(null);
            setIsFieldListening(false);
          }
        } else if (fieldName === 'village') {
          const cleaned = cleanSpokenName(finalText) || finalText;
          setFormData(prev => ({ ...prev, village: cleaned }));
          setLastParsedSummary(`✓ Village typed: ${cleaned}`);
          if (controller) controller.stop();
          setActiveVoiceField(null);
          setIsFieldListening(false);
          speakAloud(
            language === 'kn'
              ? 'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಗುರುತಿನ ವಿವರಗಳು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿವೆ.'
              : 'Thank you! Your identification details are recorded.',
            { lang: language === 'kn' ? 'kn-IN' : 'en-IN' }
          );
        }
      },
      onError: (err) => {
        console.warn('Field recognition error:', err);
        setIsFieldListening(false);
        if (err === 'not-allowed') {
          setRecErrorMsg('Microphone access denied. Please click any Quick Voice Answer below or type manually.');
        }
      },
      onEnd: () => {
        setIsFieldListening(false);
      }
    });

    fieldRecRef.current = controller;
  };

  // Handle Interactive Land Plot Selector Change
  const handlePlotChange = (data: {
    coords: [number, number][];
    areaAcres: number;
    centroidLat: number;
    centroidLon: number;
    digipin: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      polygonCoordinates: data.coords,
      landAreaAcres: data.areaAcres,
      latitude: data.centroidLat,
      longitude: data.centroidLon,
      digipin: data.digipin
    }));
    setLocationStatus(`✓ Plot Polygon & DIGIPIN Aligned: ${data.areaAcres} Acres • DIGIPIN: ${data.digipin}`);
  };

  // Handle GPS Auto-Fetch
  const handleAutoFetchLocation = () => {
    setIsLocating(true);
    setLocationStatus('Querying satellite GPS sensor from device...');
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lon = parseFloat(pos.coords.longitude.toFixed(4));
          const pin = encodeDigipin(lat, lon);
          const newCoords = generateDefaultParcelCoordinates(lat, lon);
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lon,
            digipin: pin,
            polygonCoordinates: newCoords
          }));
          setIsLocating(false);
          setLocationStatus(`✓ Device GPS Locked: ${lat}° N, ${lon}° E (DIGIPIN: ${pin})`);
        },
        () => {
          // Fallback to high-accuracy cadastral point
          const lat = 13.2456;
          const lon = 77.7123;
          const pin = encodeDigipin(lat, lon);
          const newCoords = generateDefaultParcelCoordinates(lat, lon);
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lon,
            digipin: pin,
            polygonCoordinates: newCoords
          }));
          setIsLocating(false);
          setLocationStatus(`✓ Cadastral Satellite GPS Locked: ${lat}° N, ${lon}° E (Devanahalli)`);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      const lat = 13.2456;
      const lon = 77.7123;
      const pin = encodeDigipin(lat, lon);
      const newCoords = generateDefaultParcelCoordinates(lat, lon);
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lon,
        digipin: pin,
        polygonCoordinates: newCoords
      }));
      setIsLocating(false);
      setLocationStatus(`✓ Default Cadastral GPS Locked: ${lat}° N, ${lon}° E`);
    }
  };

  // Handle Manual Coordinates Change with DIGIPIN auto-recalculation
  const handleManualCoordChange = (field: 'latitude' | 'longitude', val: number) => {
    const lat = field === 'latitude' ? val : formData.latitude;
    const lon = field === 'longitude' ? val : formData.longitude;
    const pin = encodeDigipin(lat, lon);
    const newCoords = generateDefaultParcelCoordinates(lat, lon);
    setFormData(prev => ({
      ...prev,
      [field]: val,
      digipin: pin,
      polygonCoordinates: newCoords
    }));
    setLocationStatus(`✓ Coordinates Updated: ${lat}° N, ${lon}° E (DIGIPIN: ${pin})`);
  };

  // Contextual Spoken Answer Parser across all steps
  const parseSpokenTextForStep = (text: string, step: number, isDirectSample = false) => {
    const clean = text.trim();
    if (!clean) return;

    setSpokenTranscript(clean);
    setRecErrorMsg(null);
    const parsedItems: string[] = [];

    if (step === 1) {
      // Step 1: Farmer Name, Mobile, Village
      const digitsOnly = clean.replace(/[^0-9]/g, '');
      if (digitsOnly.length >= 10) {
        const phone = digitsOnly.slice(-10);
        setFormData(prev => ({ ...prev, mobile: phone }));
        parsedItems.push(`Phone: ${phone}`);
      }

      const lower = clean.toLowerCase();
      if (lower.includes('devanahalli')) {
        setFormData(prev => ({ ...prev, village: 'Devanahalli', district: 'Bengaluru Rural' }));
        parsedItems.push('Village: Devanahalli');
      } else if (lower.includes('ramanagara')) {
        setFormData(prev => ({ ...prev, village: 'Ramanagara', district: 'Ramanagara' }));
        parsedItems.push('Village: Ramanagara');
      } else if (lower.includes('hosakote')) {
        setFormData(prev => ({ ...prev, village: 'Hosakote', district: 'Bengaluru Rural' }));
        parsedItems.push('Village: Hosakote');
      } else if (lower.includes('chikodi') || lower.includes('belagavi')) {
        setFormData(prev => ({ ...prev, village: 'Chikodi', district: 'Belagavi' }));
        parsedItems.push('Village: Chikodi');
      }

      let extractedName = clean
        .replace(/(?:my\s*name\s*is|i\s*am|this\s*is|namaste|farmer|mobile|number|phone|\d+)/gi, '')
        .replace(/(?:village|district|state)\s+[a-zA-Z]+/gi, '')
        .replace(/[,.-]/g, ' ')
        .trim();
      if (extractedName.length >= 3 && extractedName.length <= 40) {
        setFormData(prev => ({ ...prev, farmerName: extractedName }));
        parsedItems.push(`Name: ${extractedName}`);
      }
    } else if (step === 2) {
      // Step 2: Land Survey Number & Area
      const surveyMatch = clean.match(/(?:survey\s*(?:no\.?|number|#)?\s*)?([0-9]{1,4}\/[0-9a-zA-Z]{1,4})/i) ||
                          clean.match(/\b([0-9]{1,4}\/[0-9a-zA-Z]{1,4})\b/);
      if (surveyMatch) {
        setFormData(prev => ({ ...prev, surveyNumber: surveyMatch[1] }));
        parsedItems.push(`Survey #${surveyMatch[1]}`);
      }

      const areaMatch = clean.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:acres?|acre|ac)/i);
      if (areaMatch) {
        const acres = parseFloat(areaMatch[1]);
        if (acres > 0 && acres <= 100) {
          setFormData(prev => ({ ...prev, landAreaAcres: acres, insuredAreaAcres: acres }));
          parsedItems.push(`Area: ${acres} Acres`);
        }
      }
    } else if (step === 3) {
      // Step 3: Crop & Stage
      const crops = ['Ragi', 'Paddy', 'Cotton', 'Sugarcane', 'Wheat', 'Onion', 'Maize', 'Soybean'];
      for (const c of crops) {
        if (new RegExp(`\\b${c}\\b`, 'i').test(clean)) {
          setFormData(prev => ({ ...prev, cropName: c }));
          parsedItems.push(`Crop: ${c}`);
          break;
        }
      }

      const stages = ['Vegetative stage', 'Flowering stage', 'Maturity stage', 'Harvesting stage'];
      for (const s of stages) {
        const keyword = s.split(' ')[0].toLowerCase();
        if (clean.toLowerCase().includes(keyword)) {
          setFormData(prev => ({ ...prev, growthStage: s }));
          parsedItems.push(`Stage: ${s}`);
          break;
        }
      }
    } else if (step === 4) {
      // Step 4: Disaster & Severity
      const lower = clean.toLowerCase();
      if (lower.includes('flood') || lower.includes('waterlog') || lower.includes('submerg') || lower.includes('rain')) {
        setFormData(prev => ({ ...prev, disasterType: 'Flood' }));
        parsedItems.push('Disaster: Flood');
      } else if (lower.includes('drought') || lower.includes('dry')) {
        setFormData(prev => ({ ...prev, disasterType: 'Drought' }));
        parsedItems.push('Disaster: Drought');
      } else if (lower.includes('cyclone') || lower.includes('wind')) {
        setFormData(prev => ({ ...prev, disasterType: 'Cyclone' }));
        parsedItems.push('Disaster: Cyclone');
      }

      const pctMatch = clean.match(/([0-9]{1,3})\s*(?:percent|%|pct)/i);
      if (pctMatch) {
        const pct = Math.min(100, Math.max(10, parseInt(pctMatch[1], 10)));
        setFormData(prev => ({ ...prev, damagePercentage: pct }));
        parsedItems.push(`Damage: ${pct}%`);
      }

      setFormData(prev => ({ ...prev, description: clean }));
    } else if (step === 5) {
      // Step 5: Financial Loss Estimate
      const amtMatch = clean.match(/(?:rupees?|rs\.?|₹)?\s*([0-9]+(?:,[0-9]+)*)/i);
      if (amtMatch) {
        const rawNum = amtMatch[1].replace(/,/g, '');
        const loss = parseInt(rawNum, 10);
        if (loss > 0) {
          setFormData(prev => ({ ...prev, farmerLossEstimate: loss, expectedClaim: loss }));
          parsedItems.push(`Loss: ₹${loss.toLocaleString('en-IN')}`);
        }
      }
    }

    if (parsedItems.length > 0) {
      setLastParsedSummary(`✓ Understood: ${parsedItems.join(' • ')}`);
      playChime('success');
    } else {
      setLastParsedSummary(`Captured: "${clean.slice(0, 45)}..."`);
    }
  };

  // Quick Sample Answer Click
  const handleUseSampleAnswer = (sampleText: string) => {
    primeSpeechSynthesis();
    if (currentStep === 1) {
      const field = activeVoiceField || 'farmerName';
      if (field === 'farmerName') {
        setFormData(prev => ({ ...prev, farmerName: sampleText }));
        setLastParsedSummary(`✓ Name: ${sampleText}`);
        playChime('success');
      } else if (field === 'mobile') {
        const digits = spokenToDigits(sampleText) || sampleText.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, mobile: digits }));
        setLastParsedSummary(`✓ Mobile: ${digits}`);
        playChime('success');
      } else if (field === 'district') {
        setFormData(prev => ({ ...prev, district: sampleText }));
        setLastParsedSummary(`✓ District: ${sampleText}`);
        playChime('success');
      } else if (field === 'village') {
        setFormData(prev => ({ ...prev, village: sampleText }));
        setLastParsedSummary(`✓ Village: ${sampleText}`);
        playChime('success');
      }
    } else {
      parseSpokenTextForStep(sampleText, currentStep, true);
    }
  };

  const getActiveSampleAnswers = (): string[] => {
    if (currentStep === 1) {
      if (activeVoiceField === 'mobile') return ['9876543210', '9945012345', '8877665544'];
      if (activeVoiceField === 'district') return ['Bengaluru Rural', 'Ramanagara', 'Belagavi'];
      if (activeVoiceField === 'village') return ['Devanahalli', 'Channapatna', 'Chikodi'];
      return ['Ravi Kumar', 'Suresh Gowda', 'Basavaraj Patil'];
    }
    return sampleAnswersForStep[currentStep] || [];
  };

  // Add Photo Captured via Camera
  const handleAddCapturedPhoto = (newPhoto: GeoPhoto) => {
    setFormData(prev => ({
      ...prev,
      photos: [newPhoto, ...prev.photos]
    }));
    setLastParsedSummary(`✓ Photo Added: ${newPhoto.caption}`);
  };

  // Remove Photo
  const handleRemovePhoto = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Quick File Upload Geotagger
  const handleQuickFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || 1280;
        const height = img.naturalHeight || 720;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);

          // Burn official geotag
          const bannerHeight = Math.max(85, Math.floor(height * 0.16));
          const grad = ctx.createLinearGradient(0, height - bannerHeight, 0, height);
          grad.addColorStop(0, 'rgba(5, 10, 25, 0.88)');
          grad.addColorStop(1, 'rgba(2, 6, 18, 0.98)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = Math.max(2, Math.floor(height * 0.005));
          ctx.beginPath();
          ctx.moveTo(0, height - bannerHeight);
          ctx.lineTo(width, height - bannerHeight);
          ctx.stroke();

          const baseFontSize = Math.max(12, Math.floor(width * 0.022));
          ctx.fillStyle = '#34d399';
          ctx.font = `bold ${baseFontSize + 2}px monospace`;
          ctx.fillText(`📍 LAT: ${formData.latitude.toFixed(5)}°N   LON: ${formData.longitude.toFixed(5)}°E`, 20, height - bannerHeight + 14);

          ctx.font = `bold ${baseFontSize}px sans-serif`;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`SURVEY #${formData.surveyNumber}  |  DIGIPIN: ${formData.digipin}`, 20, height - bannerHeight + 14 + baseFontSize * 1.5);

          ctx.font = `normal ${baseFontSize - 1}px sans-serif`;
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`${formData.village}, ${formData.district} • ${new Date().toISOString().replace('T', ' ').slice(0, 19)} IST`, 20, height - bannerHeight + 14 + baseFontSize * 2.8);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#38bdf8';
          ctx.font = `bold ${baseFontSize + 1}px sans-serif`;
          ctx.fillText('✓ KISANCLAIM CADASTRAL GEOTAG', width - 20, height - bannerHeight + 14);

          const stampedUrl = canvas.toDataURL('image/jpeg', 0.92);
          const newPhoto: GeoPhoto = {
            photo_url: stampedUrl,
            photo_type: 'damaged_crop',
            timestamp: new Date().toISOString(),
            latitude: formData.latitude,
            longitude: formData.longitude,
            caption: `Uploaded Evidence - Survey ${formData.surveyNumber}`
          };
          handleAddCapturedPhoto(newPhoto);
          playChime('success');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Web Speech Recognition for Whole Steps (Continuous & robust)
  const toggleSpeechRecognition = () => {
    primeSpeechSynthesis();

    if (currentStep === 1) {
      if (isFieldListening) {
        stopFieldVoiceInput();
      } else {
        startFieldVoiceInput(activeVoiceField || 'farmerName', true);
      }
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      setMicAudioLevel(0);
      return;
    }

    setRecErrorMsg(null);
    setSpokenTranscript('');
    setIsListening(true);
    playChime('start');

    const controller = startFieldVoiceRecognition({
      lang: language === 'kn' ? 'kn-IN' : 'en-IN',
      onStart: () => {
        setIsListening(true);
        setRecErrorMsg(null);
      },
      onAudioLevel: (lvl) => {
        setMicAudioLevel(lvl);
      },
      onInterimText: (interim) => {
        setSpokenTranscript(interim);
      },
      onFinalText: (finalTrans) => {
        setSpokenTranscript(finalTrans);
        parseSpokenTextForStep(finalTrans, currentStep);
      },
      onError: (err) => {
        console.warn('Speech rec error:', err);
        setIsListening(false);
        setMicAudioLevel(0);
        setRecErrorMsg(typeof err === 'string' ? err : 'Unable to initialize microphone. Please click any Quick Voice Answer below.');
      },
      onEnd: () => {
        setIsListening(false);
        setMicAudioLevel(0);
      }
    });

    recognitionRef.current = controller;
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete claim report
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Top Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Animated Avatar */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md">
              <span className="text-xl">🤖</span>
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  KisanClaim Voice Assistant
                </h2>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  AI GUIDED MODE
                </span>
              </div>
              <p className="text-xs text-slate-400">Step {currentStep} of 6 • Natural voice guidance & live photo evidence</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                if (voiceEnabled) stopSpeaking();
              }}
              className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Toggle audio narration"
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-1.5 overflow-hidden border-b border-slate-800">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>

        {/* Question Bubble & Listen / Audio Waves Button */}
        <div className="p-4 sm:p-5 bg-slate-950/70 border-b border-slate-800 flex items-start gap-3 sm:gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex-1 shadow-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1 font-mono">
              {currentQ.title}
            </span>
            <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
              "{language === 'kn' ? currentQ.questionKn : currentQ.questionEn}"
            </p>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" /> {currentQ.subtext}
            </p>
          </div>

          {/* Repeat / Listen Question Button */}
          <button
            type="button"
            onClick={toggleSpeakQuestion}
            className={`px-3.5 py-3 rounded-2xl transition-all flex flex-col items-center justify-center gap-1.5 text-xs font-bold cursor-pointer shadow-md ${
              isSpeaking
                ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={isSpeaking ? 'Click to Stop Speaking' : 'Click to Listen to Question'}
          >
            {isSpeaking ? (
              <>
                <div className="flex items-center gap-1 h-4">
                  <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-4 bg-emerald-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-bounce" />
                </div>
                <span className="text-[10px] text-emerald-300 font-extrabold uppercase whitespace-nowrap font-mono">Speaking</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] text-slate-300 font-bold uppercase whitespace-nowrap">Listen</span>
              </>
            )}
          </button>
        </div>

        {/* Interactive Form Content Area based on Step */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* STEP 1: Farmer Identification */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Field-by-Field Guided Voice Bar */}
              <div className="p-3 bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900 border border-emerald-500/40 rounded-2xl flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl transition-all ${activeVoiceField ? 'bg-emerald-500 text-slate-950 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{language === 'kn' ? 'ಧ್ವನಿ ಮೂಲಕ ಕ್ಷೇತ್ರವಾರು ಭರ್ತಿ' : 'Field-by-Field Voice-to-Text Input'}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded-full font-mono font-bold">1-by-1</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono transition-all ${activeVoiceField === 'farmerName' ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-400'}`}>
                        1. Name
                      </span>
                      <span className="text-slate-600 text-[10px]">➔</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono transition-all ${activeVoiceField === 'mobile' ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-400'}`}>
                        2. Mobile
                      </span>
                      <span className="text-slate-600 text-[10px]">➔</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono transition-all ${activeVoiceField === 'district' ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-400'}`}>
                        3. District
                      </span>
                      <span className="text-slate-600 text-[10px]">➔</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono transition-all ${activeVoiceField === 'village' ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-400'}`}>
                        4. Village
                      </span>
                    </div>
                  </div>
                </div>

                {activeVoiceField ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-end gap-0.5 h-4 px-1.5 bg-slate-950/60 rounded-lg py-0.5">
                      {[0.4, 0.85, 1.0, 0.7, 0.45].map((scale, i) => (
                        <span
                          key={i}
                          className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                          style={{ height: `${Math.max(4, Math.round((Math.max(micAudioLevel, 25) / 100) * 16 * scale))}px` }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeVoiceField === 'farmerName') startFieldVoiceInput('mobile', true);
                        else if (activeVoiceField === 'mobile') startFieldVoiceInput('district', true);
                        else if (activeVoiceField === 'district') startFieldVoiceInput('village', false);
                        else stopFieldVoiceInput();
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={stopFieldVoiceInput}
                      className="px-2.5 py-1 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
                    >
                      Stop
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startFieldVoiceInput('farmerName', true)}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{language === 'kn' ? 'ಧ್ವನಿ ಆರಂಭಿಸಿ' : 'Start Voice Input (1-by-1)'}</span>
                  </button>
                )}
              </div>

              {/* Quick Spoken Test Chips for Step 1 */}
              <div className="p-2 bg-slate-950/60 border border-slate-800 rounded-xl mb-3 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-medium">Quick Spoken Samples:</span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      farmerName: 'Ravi Kumar',
                      mobile: '9876543210',
                      district: 'Bengaluru Rural',
                      village: 'Devanahalli'
                    }));
                    playChime('success');
                    setLastParsedSummary('✓ Typed: Ravi Kumar, 9876543210, Devanahalli');
                  }}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 text-[10px] rounded border border-slate-700 cursor-pointer"
                >
                  🗣️ "Ravi Kumar, 9876543210, Devanahalli"
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      farmerName: 'Suresh Gowda',
                      mobile: '9945012345',
                      district: 'Ramanagara',
                      village: 'Ramanagara'
                    }));
                    playChime('success');
                    setLastParsedSummary('✓ Typed: Suresh Gowda, 9945012345, Ramanagara');
                  }}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 text-[10px] rounded border border-slate-700 cursor-pointer"
                >
                  🗣️ "Suresh Gowda, Ramanagara"
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Field 1: Full Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Full Name</label>
                    <button
                      type="button"
                      onClick={() => startFieldVoiceInput('farmerName', false)}
                      className={`text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                        activeVoiceField === 'farmerName'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                          : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750'
                      }`}
                      title="Speak Name"
                    >
                      <Mic className="w-3 h-3" />
                      <span>{activeVoiceField === 'farmerName' ? 'Listening...' : 'Speak Name'}</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={formData.farmerName}
                      onChange={e => setFormData({ ...formData, farmerName: e.target.value })}
                      placeholder="e.g. Ravi Kumar"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-white text-sm outline-none pr-10 transition-all ${
                        activeVoiceField === 'farmerName'
                          ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-950/20'
                          : 'border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => startFieldVoiceInput('farmerName', false)}
                      className={`absolute right-2.5 p-1.5 rounded-lg transition ${
                        activeVoiceField === 'farmerName' ? 'text-emerald-300 bg-emerald-500/20 animate-pulse' : 'text-slate-400 hover:text-emerald-400'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                  {activeVoiceField === 'farmerName' && (
                    <p className="text-[11px] text-emerald-300 font-mono mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{isFieldListening ? (fieldInterimText ? `Typing: "${fieldInterimText}"` : 'Listening... Speak your full name now') : 'Speaking prompt...'}</span>
                    </p>
                  )}
                </div>

                {/* Field 2: Mobile Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Mobile Number</label>
                    <button
                      type="button"
                      onClick={() => startFieldVoiceInput('mobile', false)}
                      className={`text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                        activeVoiceField === 'mobile'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                          : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750'
                      }`}
                      title="Speak Mobile"
                    >
                      <Mic className="w-3 h-3" />
                      <span>{activeVoiceField === 'mobile' ? 'Listening...' : 'Speak Mobile'}</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="tel"
                      maxLength={10}
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                      placeholder="9876543210"
                      className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-white text-sm font-mono outline-none pr-10 transition-all ${
                        activeVoiceField === 'mobile'
                          ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-950/20'
                          : 'border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => startFieldVoiceInput('mobile', false)}
                      className={`absolute right-2.5 p-1.5 rounded-lg transition ${
                        activeVoiceField === 'mobile' ? 'text-emerald-300 bg-emerald-500/20 animate-pulse' : 'text-slate-400 hover:text-emerald-400'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                  {activeVoiceField === 'mobile' && (
                    <p className="text-[11px] text-emerald-300 font-mono mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{isFieldListening ? (fieldInterimText ? `Typing: "${fieldInterimText}"` : 'Listening... Speak 10-digit number') : 'Speaking prompt...'}</span>
                    </p>
                  )}
                </div>

                {/* Field: State */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Fields: District & Village */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">District & Village</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={formData.district}
                        onChange={e => setFormData({ ...formData, district: e.target.value })}
                        placeholder="District"
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-white text-sm outline-none pr-7 ${
                          activeVoiceField === 'district' ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-950/20' : 'border-slate-700'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => startFieldVoiceInput('district', false)}
                        title="Speak District"
                        className="absolute right-1.5 text-slate-400 hover:text-emerald-400 cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={formData.village}
                        onChange={e => setFormData({ ...formData, village: e.target.value })}
                        placeholder="Village"
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-white text-sm outline-none pr-7 ${
                          activeVoiceField === 'village' ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-950/20' : 'border-slate-700'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => startFieldVoiceInput('village', false)}
                        title="Speak Village"
                        className="absolute right-1.5 text-slate-400 hover:text-emerald-400 cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {(activeVoiceField === 'district' || activeVoiceField === 'village') && (
                    <p className="text-[11px] text-emerald-300 font-mono mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{isFieldListening ? (fieldInterimText ? `Typing: "${fieldInterimText}"` : `Listening for ${activeVoiceField}...`) : 'Speaking prompt...'}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Land Identification & GPS Auto-Fetch / Manual Mode */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Survey Number</label>
                  <input
                    type="text"
                    value={formData.surveyNumber}
                    onChange={e => setFormData({ ...formData, surveyNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Land Area (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.landAreaAcres}
                    onChange={e => setFormData({ ...formData, landAreaAcres: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">DIGIPIN (National Grid)</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.digipin}
                    className="w-full bg-slate-950/80 border border-cyan-500/40 rounded-xl px-3.5 py-2 text-cyan-300 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Location Mode Choice */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Parcel Geolocation & Land Plot Boundary Setup
                  </span>
                  
                  {/* Three Options Toggle Buttons */}
                  <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setLocationMode('map')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        locationMode === 'map'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Option 1: Satellite Plot Selector</span>
                      <span className="text-[9px] bg-emerald-400/30 text-emerald-100 px-1.5 py-0.2 rounded font-mono">
                        Interactive
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLocationMode('autofetch')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        locationMode === 'autofetch'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Option 2: Auto-Fetch GPS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLocationMode('manual')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        locationMode === 'manual'
                          ? 'bg-cyan-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Option 3: Enter Lat/Long</span>
                    </button>
                  </div>
                </div>

                {/* Sub-panel 1: Interactive Satellite Land Plot Selector */}
                {locationMode === 'map' && (
                  <div className="space-y-2">
                    <LandPlotMapSelector
                      initialCenterLat={formData.latitude}
                      initialCenterLon={formData.longitude}
                      initialCoords={formData.polygonCoordinates}
                      surveyNumber={formData.surveyNumber}
                      onPlotChange={handlePlotChange}
                    />
                  </div>
                )}

                {/* Sub-panel 2: Auto Fetch Location */}
                {locationMode === 'autofetch' && (
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Device & Cadastral GPS Synchronizer</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                          ACCURACY: ±3.2m
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {locationStatus}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAutoFetchLocation}
                      disabled={isLocating}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Locking Coordinates...' : 'Auto-Fetch Location Now'}</span>
                    </button>
                  </div>
                )}

                {/* Sub-panel 3: Manual Latitude & Longitude Input */}
                {locationMode === 'manual' && (
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-cyan-500/30 space-y-3">
                    <div className="text-xs text-cyan-300 font-medium">
                      Enter the geodetic centroid coordinates for your land parcel. DIGIPIN will be computed dynamically.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          Latitude (°N, e.g. 13.2456)
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={formData.latitude}
                          onChange={e => handleManualCoordChange('latitude', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          Longitude (°E, e.g. 77.7123)
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={formData.longitude}
                          onChange={e => handleManualCoordChange('longitude', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Crop Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Crop Sown</label>
                  <select
                    value={formData.cropName}
                    onChange={e => setFormData({ ...formData, cropName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
                  >
                    {['Ragi', 'Paddy', 'Cotton', 'Sugarcane', 'Wheat', 'Onion', 'Maize', 'Soybean'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Crop Variety</label>
                  <input
                    type="text"
                    value={formData.variety}
                    onChange={e => setFormData({ ...formData, variety: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Growth Stage at Loss</label>
                  <select
                    value={formData.growthStage}
                    onChange={e => setFormData({ ...formData, growthStage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
                  >
                    <option value="Vegetative stage">Vegetative stage (Active Tillering)</option>
                    <option value="Flowering stage">Flowering stage (Reproductive)</option>
                    <option value="Grain filling stage">Grain filling stage</option>
                    <option value="Maturity stage">Maturity stage</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Approximate Sowing Date</label>
                  <input
                    type="date"
                    value={formData.sowingDate}
                    onChange={e => setFormData({ ...formData, sowingDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Disaster Details */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Disaster Type</label>
                  <select
                    value={formData.disasterType}
                    onChange={e => setFormData({ ...formData, disasterType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                  >
                    <option value="Flood">Flood / Inundation</option>
                    <option value="Drought">Drought / Dry Spell</option>
                    <option value="Cyclone">Cyclone / Gale Wind</option>
                    <option value="Hailstorm">Hailstorm</option>
                    <option value="Pest Attack">Pest / Disease Attack</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Disaster Date</label>
                  <input
                    type="date"
                    value={formData.disasterDate}
                    onChange={e => setFormData({ ...formData, disasterDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Damage Percentage: <span className="text-emerald-400 font-bold font-mono">{formData.damagePercentage}%</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={formData.damagePercentage}
                    onChange={e => setFormData({ ...formData, damagePercentage: parseInt(e.target.value, 10) })}
                    className="w-full accent-emerald-500 cursor-pointer mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Farmer Narrative / Details</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Financial Loss */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
                <div className="text-xs text-emerald-400 font-semibold mb-1">Estimated Out-of-Pocket Crop Loss</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">₹</span>
                  <input
                    type="number"
                    value={formData.farmerLossEstimate}
                    onChange={e => setFormData({ ...formData, farmerLossEstimate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xl font-bold text-emerald-400 outline-none font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Transparent Loss Note: Official compensation is computed against the state scale of finance (₹10,000/acre) capped at the PMFBY Sum Insured.
                </p>
              </div>
            </div>
          )}

          {/* STEP 6: Photo Evidence with Live Geotag Camera */}
          {currentStep === 6 && (
            <div className="space-y-4">
              {/* Top Banner & Trigger Buttons */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
                      EXIF GEOTAG ENGINE
                    </span>
                    <span className="text-xs font-mono text-cyan-300">
                      📍 {formData.latitude.toFixed(4)}°N, {formData.longitude.toFixed(4)}°E
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">
                    Capture or Upload Ground Evidence Photos
                  </h4>
                  <p className="text-xs text-slate-300/80 mt-0.5">
                    Images captured through the website camera automatically burn verified GPS coordinates, DIGIPIN (<span className="font-mono text-cyan-300">{formData.digipin}</span>), and Survey #{formData.surveyNumber} into image pixels.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Website Camera Button */}
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    <span>📸 Open Website Camera</span>
                  </button>

                  {/* Upload file fallback button */}
                  <label className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer">
                    <Upload className="w-4 h-4 text-slate-300" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQuickFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Photos Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                  <span>Attached Evidence Photos ({formData.photos.length}):</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All Geo-Tags Synchronized
                  </span>
                </div>

                {formData.photos.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/80 rounded-2xl border border-dashed border-slate-800 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-white">No photos captured yet</div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Click "Open Website Camera" to take live photos of the damaged crop, flood water, or field boundary.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/25"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take First Photo Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {formData.photos.map((p, idx) => (
                      <div
                        key={idx}
                        className="group relative bg-slate-950 p-2.5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between"
                      >
                        <div className="relative overflow-hidden rounded-xl bg-black aspect-video mb-2">
                          <img
                            src={p.photo_url}
                            alt="Crop Evidence"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider border border-slate-700 font-mono">
                            {p.photo_type.replace('_', ' ')}
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedPreviewPhoto(p)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/85 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-slate-700"
                            title="View Full Size"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white block capitalize truncate">
                            {p.caption}
                          </span>
                          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono">
                            <span>✓ {p.latitude.toFixed(4)}°N, {p.longitude.toFixed(4)}°E</span>
                          </div>
                          <span className="text-[9px] text-slate-500 block font-mono">
                            {p.timestamp.replace('T', ' ').slice(0, 19)}
                          </span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-mono">
                            Survey #{formData.surveyNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Voice Answers Strip for Current Step */}
        {currentStep <= 5 && (sampleAnswersForStep[currentStep] || currentStep === 1) && (
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Voice Answers:
            </span>
            {getActiveSampleAnswers().map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleUseSampleAnswer(sample)}
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white border border-slate-800 whitespace-nowrap text-[11px] transition flex items-center gap-1.5 cursor-pointer shadow-sm group"
                title="Click to simulate speaking this answer"
              >
                <Mic className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>"{sample}"</span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom Action Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Microphone Button */}
            <button
              onClick={toggleSpeechRecognition}
              className={`px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 text-xs transition-all cursor-pointer ${
                (isListening || isFieldListening)
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50 ring-2 ring-red-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
              }`}
            >
              {(isListening || isFieldListening) ? (
                <>
                  <MicOff className="w-4 h-4 animate-bounce" />
                  <span>
                    {isFieldListening
                      ? `Listening: ${activeVoiceField === 'farmerName' ? 'Full Name' : activeVoiceField === 'mobile' ? 'Mobile' : activeVoiceField === 'district' ? 'District' : 'Village'}... (Click to Stop)`
                      : 'Listening... (Click to Stop)'}
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-white" />
                  <span>{currentStep === 1 ? 'Start Voice Input (1-by-1)' : 'Speak Answer'}</span>
                </>
              )}
            </button>

            {/* Recognized or Parsed Feedback */}
            {lastParsedSummary && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono font-medium shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate max-w-xs">{lastParsedSummary}</span>
              </div>
            )}

            {/* Error or Help Tip */}
            {recErrorMsg && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/70 border border-amber-500/40 rounded-xl text-amber-300 text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="truncate max-w-xs">{recErrorMsg}</span>
              </div>
            )}

            {/* Spoken Transcript Live Preview */}
            {!lastParsedSummary && spokenTranscript && (
              <span className="text-xs text-slate-300 italic truncate max-w-xs font-mono">
                "{spokenTranscript}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" /> Skip
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <span>{currentStep === 6 ? 'Submit Claim & Analyze' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Website Camera Capture Modal with Geotag Stamping */}
      {showCameraModal && (
        <GeoCameraModal
          isOpen={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onCapture={handleAddCapturedPhoto}
          surveyNumber={formData.surveyNumber}
          digipin={formData.digipin}
          latitude={formData.latitude}
          longitude={formData.longitude}
          village={formData.village}
          district={formData.district}
        />
      )}

      {/* Fullscreen Photo Evidence Inspector Modal */}
      {selectedPreviewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Geotagged Photo Inspection • {selectedPreviewPhoto.caption}</span>
              </div>
              <button
                onClick={() => setSelectedPreviewPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
              <img
                src={selectedPreviewPhoto.photo_url}
                alt="Inspected Evidence"
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 font-mono">
              <span className="text-emerald-400">
                📍 {selectedPreviewPhoto.latitude.toFixed(5)}°N, {selectedPreviewPhoto.longitude.toFixed(5)}°E
              </span>
              <span>
                {selectedPreviewPhoto.timestamp.replace('T', ' ')}
              </span>
              <span className="text-cyan-300 font-sans font-bold capitalize">
                Category: {selectedPreviewPhoto.photo_type.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
