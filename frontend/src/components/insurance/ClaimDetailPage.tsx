import React, { useState } from 'react';
import { ArrowLeft, FileText, CheckCircle2, ShieldCheck, MapPin, Calendar, Clock, AlertTriangle, Layers, User, Sparkles, MessageSquare, Bot } from 'lucide-react';
import { Claim } from '../../types';
import { GeospatialTwinViewer } from '../farmer/GeospatialTwinViewer';
import { MultiAgentPanel } from './MultiAgentPanel';
import { AICopilotChat } from './AICopilotChat';
import { EvidenceGraph } from './EvidenceGraph';
import { ReviewActionModal } from './ReviewActionModal';

interface Props {
  claim: Claim;
  onBack: () => void;
  onOpenReport: (claim: Claim) => void;
  onRunAgents: () => Promise<void>;
  onSubmitReviewAction: (payload: any) => Promise<void>;
}

export const ClaimDetailPage: React.FC<Props> = ({
  claim,
  onBack,
  onOpenReport,
  onRunAgents,
  onSubmitReviewAction
}) => {
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'twin' | 'agents' | 'graph' | 'copilot'>('twin');
  const [expandedPhoto, setExpandedPhoto] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Banner */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            title="Return to Queue"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                {claim.claim_number}
              </span>
              <span className="text-xs text-slate-400">
                Filed on {claim.created_at.slice(0, 10)}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              {claim.farmer.name} • {claim.crop.crop_name} Claim Adjudication
            </h1>
            <p className="text-xs text-slate-400">
              {claim.farmer.village}, {claim.farmer.district}, {claim.farmer.state} • Land Parcel: {claim.land.land_parcel_id} (Survey {claim.land.survey_number})
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onOpenReport(claim)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>View Full Report</span>
          </button>

          <button
            onClick={() => setShowReviewModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Adjudicate / Review Decision</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Farmer Declared Loss</span>
          <span className="text-xl font-black text-white font-mono mt-1 block">
            ₹{claim.farmer_reported_loss.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500">Out of pocket estimate</span>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Indicative Payout</span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
            ₹{claim.estimated_payout.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-500">Scale of finance capped</span>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Evidence Confidence</span>
          <span className="text-xl font-black text-cyan-400 font-mono mt-1 block">
            {claim.evidence_confidence_score}%
          </span>
          <span className="text-[10px] text-cyan-400">Sentinel & radar coherence</span>
        </div>

        <div className={`bg-slate-900 rounded-2xl border p-4 ${
          claim.current_status === 'Flagged Fraud' ? 'border-red-500/60 bg-red-950/30' : 'border-slate-800'
        }`}>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Status</span>
          <span className={`text-sm font-black uppercase mt-1 block ${
            claim.current_status === 'Flagged Fraud' ? 'text-red-400 animate-pulse' : 'text-amber-400'
          }`}>
            {claim.current_status}
          </span>
          <span className="text-[10px] text-slate-500">
            {claim.current_status === 'Flagged Fraud' ? '🚨 Intercepted by AI Swarm' : 'Human adjudication pending'}
          </span>
        </div>
      </div>

      {/* Detail Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('twin')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'twin'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Geospatial Evidence Twin</span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'agents'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Verification Agents ({claim.ai_agents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('graph')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'graph'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <span>🌐</span>
          <span>Explainable Evidence Graph</span>
        </button>

        <button
          onClick={() => setActiveTab('copilot')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'copilot'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Reviewer Copilot</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'twin' && (
        <div className="space-y-6">
          <GeospatialTwinViewer claim={claim} />

          {/* Meteorological and Ground Truth Gallery Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Meteorological Profile */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🌧️</span>
                  <span>Open-Meteo & IMD Rainfall Radar</span>
                </h4>
                <span className="text-[10px] text-red-400 font-mono font-bold bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-500/30">
                  {claim.weather.anomaly_ratio}x Normal August
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Peak Precipitation (Disaster Day)</span>
                  <span className="text-white font-mono font-bold">{claim.weather.rainfall_disaster_day_mm} mm</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">7-Day Cumulative Runoff</span>
                  <span className="text-white font-mono font-bold">{claim.weather.rainfall_7day_cumulative_mm} mm</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Soil Saturation Threshold</span>
                  <span className="text-cyan-400 font-mono font-bold">{claim.weather.soil_saturation_pct}% (Supersaturated)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Meteorological Corroboration</span>
                  <span className={`font-bold ${
                    claim.weather.rainfall_disaster_day_mm < 5.0 && claim.disaster.damage_percentage_reported > 30.0
                      ? 'text-red-400'
                      : 'text-emerald-400'
                  }`}>
                    {claim.weather.rainfall_disaster_day_mm < 5.0 && claim.disaster.damage_percentage_reported > 30.0
                      ? '🚨 Contradiction: Dry Week (1.2 mm)'
                      : 'Conclusive Extreme Weather'}
                  </span>
                </div>
              </div>
            </div>

            {/* Farmer Photos Evidence Gallery */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📸</span>
                  <span>Geotagged Farmer Evidence Photos</span>
                </h4>
                {claim.photos.some(p => !p.metadata_verified) ? (
                  <span className="text-[10px] text-red-400 font-mono font-bold bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/50 animate-pulse">
                    🚨 EXIF Spoofed / Geofence Breach
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    ✓ EXIF Validated
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {claim.photos.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => setExpandedPhoto(p)}
                    className="bg-slate-950 rounded-xl p-2 border border-slate-800 text-center hover:border-emerald-500/60 cursor-pointer transition transform hover:scale-[1.02]"
                    title="Click to view full forensic photograph"
                  >
                    <img src={p.photo_url} alt="Photo" className="w-full h-24 object-cover rounded-lg mb-1.5" />
                    <span className="text-[10px] text-slate-300 font-semibold block capitalize truncate">{p.photo_type.replace('_', ' ')}</span>
                    <span className="text-[9px] text-emerald-400 font-mono block">✓ {p.latitude.toFixed(4)}°N (Click to zoom)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'agents' && (
        <MultiAgentPanel claim={claim} onRunAgents={onRunAgents} />
      )}

      {activeTab === 'graph' && (
        <EvidenceGraph claim={claim} />
      )}

      {activeTab === 'copilot' && (
        <AICopilotChat claim={claim} />
      )}

      {/* Enlarged Forensic Photo Viewer Modal */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-base">📸</span>
                <span className="font-bold text-white capitalize">{expandedPhoto.photo_type.replace('_', ' ')}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  GPS & EXIF MATCHED
                </span>
              </div>
              <button
                onClick={() => setExpandedPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-800 mb-3 bg-black">
              <img
                src={expandedPhoto.photo_url}
                alt="Enlarged forensic photo"
                className="w-full max-h-[460px] object-contain"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{expandedPhoto.caption}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Centroid: {expandedPhoto.latitude.toFixed(4)}°N, {expandedPhoto.longitude.toFixed(4)}°E • Timestamp: {expandedPhoto.timestamp.replace('T', ' ')}
                </p>
              </div>
              <button
                onClick={() => setExpandedPhoto(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviewer Action Modal */}
      <ReviewActionModal
        claim={claim}
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmitAction={onSubmitReviewAction}
      />
    </div>
  );
};
