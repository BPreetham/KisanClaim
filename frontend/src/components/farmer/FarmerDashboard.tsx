import React, { useState } from 'react';
import { Mic, FilePlus, Layers, FileText, CheckCircle2, Clock, AlertTriangle, ArrowRight, ShieldCheck, MapPin, Eye, Bell, Sparkles, ArrowLeft, RefreshCw, PhoneCall, HelpCircle, Calendar, Check, ExternalLink } from 'lucide-react';
import { Claim, NotificationItem } from '../../types';
import { GeospatialTwinViewer } from './GeospatialTwinViewer';
import { VoiceAssistantModal } from './VoiceAssistantModal';
import { EvidenceAnalysisProgress } from './EvidenceAnalysisProgress';

interface Props {
  claims: Claim[];
  notifications: NotificationItem[];
  language: 'en' | 'kn';
  currentUser?: any;
  onNewClaimSubmit: (data: any) => Promise<any>;
  onOpenReport: (claim: Claim) => void;
}

export const FarmerDashboard: React.FC<Props> = ({
  claims,
  notifications,
  language,
  currentUser,
  onNewClaimSubmit,
  onOpenReport
}) => {
  // Navigation View State: 'welcome' (default on login) or 'dossier'
  const [viewMode, setViewMode] = useState<'welcome' | 'dossier'>('welcome');
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [showAnalysisScreen, setShowAnalysisScreen] = useState<boolean>(false);
  const [newlyCreatedClaim, setNewlyCreatedClaim] = useState<Claim | null>(null);

  const farmerName = currentUser?.name || 'Ravi Kumar';
  
  // Match claim for logged in farmer by mobile or first name, fallback to Ravi's or first claim
  const matchedClaim = claims.find(c => 
    (currentUser?.mobile && c.farmer.mobile === currentUser.mobile) ||
    (currentUser?.name && c.farmer.name.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0])) ||
    c.farmer.name.includes('Ravi')
  ) || claims[0];

  const activeClaim = newlyCreatedClaim || matchedClaim;

  const handleVoiceAssistantComplete = async (formData: any) => {
    setShowVoiceModal(false);
    setShowAnalysisScreen(true);
    
    try {
      const created = await onNewClaimSubmit({
        farmer_name: formData.farmerName,
        mobile: formData.mobile,
        state: formData.state,
        district: formData.district,
        village: formData.village,
        survey_number: formData.surveyNumber,
        land_area_acres: formData.landAreaAcres,
        latitude: formData.latitude,
        longitude: formData.longitude,
        crop_name: formData.cropName,
        variety: formData.variety,
        sowing_date: formData.sowingDate,
        growth_stage: formData.growthStage,
        disaster_type: formData.disasterType,
        disaster_date: formData.disasterDate,
        reported_cause: formData.reportedCause,
        damage_percentage: formData.damagePercentage,
        farmer_loss_estimate: formData.farmerLossEstimate,
        description: formData.description,
        photos: formData.photos
      });

      if (created) {
        setNewlyCreatedClaim(created);
      }
    } catch (e) {
      console.error('Error submitting claim:', e);
    }
  };

  const handleAnalysisComplete = () => {
    setShowAnalysisScreen(false);
    // Direct directly to Active Claim Dossier & Geospatial Evidence Twin
    setViewMode('dossier');
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* VIEW 1: WELCOME PAGE (Default on Farmer Login)                 */}
      {/* ============================================================== */}
      {viewMode === 'welcome' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/30 p-6 md:p-8 shadow-2xl">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {language === 'kn' ? 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಫಸಲ್ ಬಿಮಾ ಯೋಜನೆ ಬೆಂಬಲಿತ' : 'PMFBY Kharif 2026 AI Support Portal'}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                {language === 'kn' ? `ಸ್ವಾಗತ, ${farmerName}.` : `Welcome, ${farmerName}!`}
              </h1>
              <p className="text-sm md:text-base text-emerald-100/90 mt-2 leading-relaxed">
                {language === 'kn'
                  ? 'ನೈಸರ್ಗಿಕ ವಿಕೋಪದಿಂದ ಉಂಟಾದ ಬೆಳೆ ಹಾನಿಯನ್ನು ವರದಿ ಮಾಡಿ. ಉಪಗ್ರಹ ಸಾಕ್ಷ್ಯಗಳೊಂದಿಗೆ ತ್ವರಿತವಾಗಿ ಪರಿಹಾರ ಪಡೆಯಿರಿ.'
                  : 'Report crop damage after natural disasters, automatically collect Sentinel-2 satellite and IMD weather radar evidence, and fast-track your PMFBY compensation.'}
              </p>

              {/* PRIMARY PROMINENT CALL-TO-ACTION: REPORT CROP DAMAGE USING AI */}
              <div className="mt-6">
                <button
                  onClick={() => setShowVoiceModal(true)}
                  className="w-full p-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold shadow-2xl shadow-emerald-500/30 flex items-center justify-between gap-4 transition-all transform hover:-translate-y-0.5 text-left cursor-pointer group border border-emerald-300/40"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-white/20 rounded-2xl group-hover:scale-105 transition-transform shadow-inner">
                      <Mic className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="text-lg md:text-xl font-extrabold flex items-center gap-2">
                        <span>{language === 'kn' ? '🌾 AI ಮೂಲಕ ಬೆಳೆ ಹಾನಿ ವರದಿ ಮಾಡಿ' : '🌾 Report Crop Damage Using AI'}</span>
                        <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                      </div>
                      <div className="text-xs md:text-sm text-emerald-50 font-normal mt-0.5">
                        {language === 'kn'
                          ? 'ಧ್ವನಿ ಅಥವಾ ಫಾರ್ಮ್ • ಆಟೋ ಜಿಪಿಎಸ್ ಅಥವಾ ಹಸ್ತಚಾಲಿತ ಸ್ಥಳ • ಉಪಗ್ರಹ ಸ್ಕ್ಯಾನ್'
                          : 'Interactive voice or form • Auto-fetch GPS or manual Lat/Long • Sentinel-2 satellite scan'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-700/60 group-hover:bg-emerald-600/70 px-4 py-2 rounded-xl text-xs font-bold transition">
                    <span>{language === 'kn' ? 'ಪ್ರಾರಂಭಿಸಿ' : 'Start Report'}</span>
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>

            {/* Background decorative crop silhouette */}
            <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none text-9xl select-none">
              🌾
            </div>
          </div>

          {/* SECONDARY CARD: EXISTING ACTIVE CLAIM DOSSIER (IF AVAILABLE) */}
          {activeClaim && (
            <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                      Existing Claim On Record
                    </span>
                    <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                      {activeClaim.claim_number}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {activeClaim.crop.crop_name} • {activeClaim.disaster.disaster_type} ({activeClaim.disaster.damage_percentage_reported}% Loss)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Survey #{activeClaim.land.survey_number} • DIGIPIN: <span className="font-mono text-cyan-300">{activeClaim.land.digipin}</span> • Submitted: {activeClaim.created_at.slice(0, 10)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs ${
                    activeClaim.current_status === 'Approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : activeClaim.current_status === 'Flagged Fraud' || activeClaim.current_status === 'Rejected'
                      ? 'bg-red-500/30 text-red-200 border border-red-500/60 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {activeClaim.current_status === 'Approved' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : activeClaim.current_status === 'Flagged Fraud' || activeClaim.current_status === 'Rejected' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    {activeClaim.current_status}
                  </span>

                  <button
                    onClick={() => setViewMode('dossier')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>View Active Dossier & Twin</span>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3-STEP EXPLAINER CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-3">
                1
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Report with AI in 60s</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Use your device GPS or enter manual Latitude & Longitude coordinates. Speak or type your crop loss details.
              </p>
            </div>

            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg mb-3">
                2
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Autonomous Satellite Audit</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sentinel-2 multispectral satellites analyze your parcel's NDVI vegetation loss and IMD weather radar cross-checks rainfall.
              </p>
            </div>

            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg mb-3">
                3
              </div>
              <h4 className="text-sm font-bold text-white mb-1">72-Hour Fast-Track Settlement</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated multi-agent verified evidence dossier is sent directly to insurance adjudicators for rapid compensation.
              </p>
            </div>
          </div>

          {/* PMFBY & Support Information Card */}
          <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 text-emerald-400 rounded-xl">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-slate-200 block">Kisan Claim Support Helpline</strong>
                <span>Toll-Free: 1800-180-1551 • PMFBY Kharif Season 2026</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 font-mono">
                Centroid: {activeClaim?.land.latitude}°N, {activeClaim?.land.longitude}°E
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: ACTIVE CLAIM DOSSIER & GEOSPATIAL TWIN                */}
      {/* ============================================================== */}
      {viewMode === 'dossier' && activeClaim && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Dossier Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-md">
            <button
              onClick={() => setViewMode('welcome')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Back to Farmer Home</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVoiceModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Report Another Crop Damage Using AI</span>
              </button>
            </div>
          </div>

          {/* Primary Claim Status Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Active Claim Dossier
                  </span>
                  <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                    {activeClaim.claim_number}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {activeClaim.crop.crop_name} • {activeClaim.disaster.disaster_type} Damage
                </h2>
                <p className="text-xs text-slate-400">
                  Submitted on {activeClaim.created_at.slice(0, 10)} • Land Parcel: {activeClaim.land.land_parcel_id} (Survey {activeClaim.land.survey_number})
                </p>
              </div>

              {/* Current Status Badge */}
              <div className="text-right">
                <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs ${
                  activeClaim.current_status === 'Approved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : activeClaim.current_status === 'Flagged Fraud' || activeClaim.current_status === 'Rejected'
                    ? 'bg-red-500/30 text-red-200 border border-red-500/60 animate-pulse'
                    : activeClaim.current_status === 'Payment Scheduled'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : activeClaim.current_status === 'Additional Evidence Required'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {activeClaim.current_status === 'Approved' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : activeClaim.current_status === 'Flagged Fraud' || activeClaim.current_status === 'Rejected' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  {activeClaim.current_status}
                </span>
              </div>
            </div>

            {/* Reviewer Feedback Alert Banner (if reviewed) */}
            {activeClaim.reviewer_comments && (
              <div className={`mt-4 p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                activeClaim.current_status === 'Approved'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : activeClaim.current_status === 'Flagged Fraud' || activeClaim.current_status === 'Rejected'
                  ? 'bg-red-950/80 border-red-500/60 text-red-200'
                  : activeClaim.current_status === 'Additional Evidence Required'
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300'
              }`}>
                {activeClaim.current_status === 'Flagged Fraud' || activeClaim.current_status === 'Rejected' ? (
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className={`font-bold mb-0.5 ${activeClaim.current_status === 'Flagged Fraud' ? 'text-red-300' : 'text-white'}`}>
                    {activeClaim.current_status === 'Flagged Fraud' ? '🚨 Fraud Investigation Decision' : `Insurance Reviewer Decision by ${activeClaim.reviewer_name || 'Senior Claims Officer'}`}
                  </div>
                  <div>"{activeClaim.reviewer_comments}"</div>
                  {activeClaim.approved_amount ? (
                    <div className="mt-2 text-sm font-black text-emerald-400">
                      Approved Settlement Payout: ₹{activeClaim.approved_amount.toLocaleString('en-IN')}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Farmer Loss</span>
                <span className="text-base font-bold text-white font-mono">₹{activeClaim.farmer_reported_loss.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Indicative Claim</span>
                <span className="text-base font-bold text-emerald-400 font-mono">₹{activeClaim.estimated_payout.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Evidence Confidence</span>
                <span className="text-base font-bold text-cyan-400 font-mono">{activeClaim.evidence_confidence_score}%</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Damage Severity</span>
                <span className="text-base font-bold text-red-400 font-mono">{activeClaim.estimated_damage_severity} ({activeClaim.disaster.damage_percentage_reported}%)</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>DIGIPIN: <strong className="text-cyan-300 font-mono">{activeClaim.land.digipin}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenReport(activeClaim)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>View & Print Claim Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Geospatial Evidence Twin Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🌾</span>
                <span>Your Land Parcel Geospatial Evidence Twin</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Sentinel-2 MSI Multi-Band Imagery
              </span>
            </div>

            <GeospatialTwinViewer claim={activeClaim} />
          </div>
        </div>
      )}

      {/* Voice / Interactive Assistant Modal */}
      <VoiceAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onComplete={handleVoiceAssistantComplete}
        language={language}
      />

      {/* Automatic Analysis Animation Screen */}
      {showAnalysisScreen && (
        <EvidenceAnalysisProgress
          onComplete={handleAnalysisComplete}
        />
      )}
    </div>
  );
};
