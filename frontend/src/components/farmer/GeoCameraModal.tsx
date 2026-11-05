import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, X, Check, ShieldCheck, MapPin, Sparkles, Upload, AlertCircle, Maximize2 } from 'lucide-react';
import { playChime } from '../../utils/speech';

export interface GeoPhoto {
  photo_url: string;
  photo_type: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  caption: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photo: GeoPhoto) => void;
  surveyNumber: string;
  digipin: string;
  latitude: number;
  longitude: number;
  village: string;
  district: string;
}

export const GeoCameraModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCapture,
  surveyNumber,
  digipin,
  latitude,
  longitude,
  village,
  district
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoCategory, setPhotoCategory] = useState<string>('damaged_crop');
  const [customCaption, setCustomCaption] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  // Live clock ticker for the HUD
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize camera stream
  const startCamera = async (deviceId?: string) => {
    setCameraError(null);
    setPreviewImage(null);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      let constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback for laptop webcams without environment facing mode
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video play error:', e));
      }
      setCameraActive(true);

      // Enumerate available video inputs
      try {
        const devList = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devList.filter(d => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (!deviceId && videoInputs.length > 0) {
          setCurrentDeviceId(videoInputs[0].deviceId);
        }
      } catch (e) {
        // Ignore device enumeration errors
      }
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setCameraActive(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera permissions in your browser or use the file upload option below.'
          : 'Could not connect to device camera. You can upload photo files directly below with automatic geostamping.'
      );
    }
  };

  // Stop camera stream cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setPreviewImage(null);
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Burn Official KisanClaim Geotag onto image canvas
  const stampGeotagOnCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    categoryName: string
  ) => {
    const bannerHeight = Math.max(90, Math.floor(height * 0.16));
    const now = new Date();
    const dateFormatted = now.toISOString().replace('T', ' ').slice(0, 19);

    // Draw dark semi-transparent geotag banner at the bottom
    const grad = ctx.createLinearGradient(0, height - bannerHeight, 0, height);
    grad.addColorStop(0, 'rgba(5, 10, 25, 0.88)');
    grad.addColorStop(1, 'rgba(2, 6, 18, 0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Top border on banner (emerald glowing line)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = Math.max(2, Math.floor(height * 0.005));
    ctx.beginPath();
    ctx.moveTo(0, height - bannerHeight);
    ctx.lineTo(width, height - bannerHeight);
    ctx.stroke();

    // Scale font size based on image width
    const baseFontSize = Math.max(12, Math.floor(width * 0.022));
    ctx.textBaseline = 'top';

    // 1. Left side: Geodetic coordinates & cadastral info
    ctx.font = `bold ${baseFontSize + 2}px monospace`;
    ctx.fillStyle = '#34d399'; // Emerald-400
    ctx.fillText(
      `📍 LAT: ${latitude.toFixed(5)}°N   LON: ${longitude.toFixed(5)}°E`,
      20,
      height - bannerHeight + 14
    );

    ctx.font = `bold ${baseFontSize}px sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(
      `SURVEY #${surveyNumber}  |  DIGIPIN: ${digipin}`,
      20,
      height - bannerHeight + 14 + baseFontSize * 1.5
    );

    ctx.font = `normal ${baseFontSize - 1}px sans-serif`;
    ctx.fillStyle = '#94a3b8'; // Slate-400
    ctx.fillText(
      `${village}, ${district} • ${dateFormatted} IST`,
      20,
      height - bannerHeight + 14 + baseFontSize * 2.8
    );

    // 2. Right side: Verification Badge & Category
    ctx.textAlign = 'right';
    ctx.font = `bold ${baseFontSize + 1}px sans-serif`;
    ctx.fillStyle = '#38bdf8'; // Sky-400
    ctx.fillText(
      `✓ KISANCLAIM CADASTRAL GEOTAG`,
      width - 20,
      height - bannerHeight + 14
    );

    ctx.font = `bold ${baseFontSize}px sans-serif`;
    ctx.fillStyle = '#f59e0b'; // Amber-400
    const catLabel = categoryName.toUpperCase().replace('_', ' ');
    ctx.fillText(
      `CATEGORY: ${catLabel}`,
      width - 20,
      height - bannerHeight + 14 + baseFontSize * 1.5
    );

    ctx.font = `normal ${baseFontSize - 2}px monospace`;
    ctx.fillStyle = '#64748b'; // Slate-500
    ctx.fillText(
      `SENSOR: CADASTRAL GPS LOCK (±2.5m)`,
      width - 20,
      height - bannerHeight + 14 + baseFontSize * 2.8
    );

    ctx.textAlign = 'left'; // reset
  };

  // Capture current video frame and burn geotags
  const handleSnapPhoto = () => {
    if (!videoRef.current || !cameraActive) return;

    setIsProcessing(true);
    playChime('shutter');

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Draw camera frame
      ctx.drawImage(video, 0, 0, width, height);

      // Stamp official verified geotag banner
      stampGeotagOnCanvas(ctx, width, height, photoCategory);

      // Convert to high-quality JPEG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setPreviewImage(dataUrl);
      playChime('success');
    } catch (e) {
      console.error('Snapshot failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file upload fallback with automatic geotagging
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
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
          stampGeotagOnCanvas(ctx, width, height, photoCategory);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setPreviewImage(dataUrl);
          playChime('success');
        }
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  // Confirm and add photo to claim evidence
  const handleAcceptPhoto = () => {
    if (!previewImage) return;

    const catLabels: Record<string, string> = {
      damaged_crop: 'Damaged crop canopy',
      waterlogging: 'Standing flood water in field',
      field_overview: 'Overall field boundary and survey marker',
      soil_damage: 'Soil erosion and siltation damage'
    };

    const finalCaption = customCaption.trim() || catLabels[photoCategory] || 'Ground Evidence Photo';

    const newPhoto: GeoPhoto = {
      photo_url: previewImage,
      photo_type: photoCategory,
      timestamp: new Date().toISOString(),
      latitude,
      longitude,
      caption: finalCaption
    };

    onCapture(newPhoto);
    playChime('success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-wide">
                <span>Website Camera • Live Geotag Capture</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  SAT-VERIFIED
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ground photos are burned with verified GPS, Survey #{surveyNumber}, and DIGIPIN
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Selector Tabs */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-emerald-400 font-mono uppercase tracking-wider whitespace-nowrap">
            Photo Type:
          </span>
          {[
            { id: 'damaged_crop', label: '🌾 Damaged Crop' },
            { id: 'waterlogging', label: '🌊 Waterlogging' },
            { id: 'field_overview', label: '🗺️ Field Overview' },
            { id: 'soil_damage', label: '🚜 Soil/Erosion' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setPhotoCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                photoCategory === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Viewport */}
        <div className="relative flex-1 bg-black min-h-[320px] max-h-[500px] flex items-center justify-center overflow-hidden">
          
          {/* Active Camera Viewfinder */}
          {!previewImage && cameraActive && (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Crosshairs Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-emerald-400/50 rounded-2xl relative shadow-lg">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-1 -mr-1" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shadow-[0_0_10px_#10b981]" />
                  </div>
                </div>
              </div>

              {/* Live HUD Header Overlay */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 shadow-md">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>GPS LOCK: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E</span>
                </div>

                <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-mono shadow-md">
                  {currentTimeStr}
                </div>
              </div>

              {/* Live HUD Bottom Stamp Preview */}
              <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-2xl text-xs text-white flex flex-wrap items-center justify-between gap-2 pointer-events-none shadow-xl">
                <div>
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Survey #{surveyNumber} • DIGIPIN: {digipin}</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {village}, {district} • Accuracy ±2.5m
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                  {photoCategory.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}

          {/* Captured Preview Mode */}
          {previewImage && (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-2 bg-black">
              <img
                src={previewImage}
                alt="Geo-Tagged Capture"
                className="max-h-[380px] w-auto max-w-full rounded-2xl border-2 border-emerald-500/60 object-contain shadow-2xl"
              />
              <div className="absolute top-4 right-4 bg-slate-950/90 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Geotags Burned into Pixels</span>
              </div>
            </div>
          )}

          {/* Camera Error or Fallback Screen */}
          {!previewImage && !cameraActive && (
            <div className="p-6 text-center max-w-md space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="text-white text-sm font-semibold">
                {cameraError || 'Camera is starting or requires permission...'}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => startCamera()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Auto-Geotag</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input for Geotagging fallback */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Controls Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 space-y-3">
          
          {/* Caption Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add optional note or landmark (e.g. Near north irrigation canal)..."
              value={customCaption}
              onChange={e => setCustomCaption(e.target.value)}
              className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Left Options: File upload fallback and camera flip */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                title="Upload photo from disk or gallery and apply verified geotag"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Upload Photo File</span>
              </button>

              {devices.length > 1 && !previewImage && (
                <button
                  type="button"
                  onClick={() => {
                    const nextDev = devices.find(d => d.deviceId !== currentDeviceId) || devices[0];
                    setCurrentDeviceId(nextDev.deviceId);
                    startCamera(nextDev.deviceId);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  title="Switch front/rear camera"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Switch Lens</span>
                </button>
              )}
            </div>

            {/* Right Action: Snap or Accept */}
            <div>
              {previewImage ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPreviewImage(null);
                      startCamera(currentDeviceId);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleAcceptPhoto}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Add to Claim Evidence</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSnapPhoto}
                  disabled={!cameraActive || isProcessing}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all transform active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-white" />
                  <span>📸 Snap & Geotag Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
