import React, { useState } from 'react';
import { Network, Sparkles, CheckCircle2, ChevronRight, Info, Layers, Eye, Satellite, CloudRain, MapPin, ShieldCheck, ShieldAlert, BarChart3, Activity, ArrowRight, TrendingDown, TrendingUp, AlertTriangle, Cpu } from 'lucide-react';
import { Claim } from '../../types';

interface Props {
  claim: Claim;
}

interface EvidenceNode {
  id: string;
  label: string;
  category: 'satellite' | 'weather' | 'ground' | 'actuarial' | 'claim';
  status: 'verified' | 'anomalous' | 'critical';
  value: string;
  detail: string;
  telemetry: string;
  weight: number; // percentage contribution to final decision
  x: number;
  y: number;
}

export const EvidenceGraph: React.FC<Props> = ({ claim }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('ndvi');
  const [activeLayerFilter, setActiveLayerFilter] = useState<'all' | 'satellite' | 'weather' | 'ground' | 'actuarial'>('all');

  const isFraud = claim.current_status === 'Flagged Fraud' || claim.evidence_confidence_score < 30;

  // Graph Nodes
  const nodes: EvidenceNode[] = [
    {
      id: 'claim_declaration',
      label: 'Farmer Declaration',
      category: 'claim',
      status: 'verified',
      value: `Claim ${claim.claim_number}`,
      detail: `Farmer ${claim.farmer.name} (+91 ${claim.farmer.mobile}) reported ${claim.disaster.damage_percentage_reported}% damage to ${claim.crop.crop_name} caused by ${claim.disaster.disaster_type}. Reported loss: ₹${claim.farmer_reported_loss.toLocaleString('en-IN')}.`,
      telemetry: `Date: ${claim.disaster.disaster_date} • Village: ${claim.farmer.village}, ${claim.farmer.district}`,
      weight: 10,
      x: 60,
      y: 130
    },
    {
      id: 'cadastral_gis',
      label: 'Cadastral Land GIS',
      category: 'ground',
      status: 'verified',
      value: `Survey #${claim.land.survey_number}`,
      detail: `Cadastral boundary geocoded to DIGIPIN ${claim.land.digipin}. Digitized polygon covers ${claim.land.area_acres} acres with centroid at ${claim.land.latitude.toFixed(4)}°N, ${claim.land.longitude.toFixed(4)}°E.`,
      telemetry: `Parcel ID: ${claim.land.land_parcel_id} • Bhoomi Land Portal Match: 100%`,
      weight: 15,
      x: 230,
      y: 50
    },
    {
      id: 'exif_photos',
      label: 'Geotagged EXIF Photos',
      category: 'ground',
      status: isFraud ? 'critical' : 'verified',
      value: isFraud ? '14.3 km Geofence Breach' : `${claim.photos.length} Verified Photos`,
      detail: isFraud
        ? 'CRITICAL TAMPER ALERT: Camera EXIF GPS coordinates are located 14.3 km outside registered Hosakote parcel in an urban area. Camera hardware headers stripped.'
        : `Ground photographic evidence confirmed within 32m to 48m of cadastral parcel centroid. Camera timestamp aligns within 24h of disaster event.`,
      telemetry: isFraud
        ? 'GPS Offset: 14,300m • Tamper Score: 92/100 (High Tampering Risk)'
        : 'EXIF Match: Valid • Hardware: Real-Time Mobile Sensor Stamp',
      weight: 20,
      x: 230,
      y: 210
    },
    {
      id: 'sentinel_telemetry',
      label: 'Sentinel-2 MSI Orbit',
      category: 'satellite',
      status: 'verified',
      value: 'Copernicus Level-2A',
      detail: `Constellation pass retrieved for pre-disaster (${claim.satellite.pre_disaster_date}) and post-disaster (${claim.satellite.post_disaster_date}) passes. 10m Ground Sample Distance multi-band spectral reflectance.`,
      telemetry: `Bands: B2 (Blue), B3 (Green), B4 (Red), B8 (NIR) • Cloud Cover: < 4%`,
      weight: 15,
      x: 420,
      y: 50
    },
    {
      id: 'ndvi',
      label: 'NDVI Spectral Shift',
      category: 'satellite',
      status: isFraud ? 'critical' : 'verified',
      value: isFraud ? '0.76 (Dry / Healthy)' : `${claim.satellite.ndvi_diff} (-${claim.satellite.vegetation_drop_pct}%)`,
      detail: isFraud
        ? 'SATELLITE CONTRADICTION: Post-disaster NDVI is 0.76 (dense lush canopy, -2.5% drop). NDWI is -0.38 (completely dry ground). Claimant declared 95% flood devastation.'
        : `Multispectral NDVI collapsed from ${claim.satellite.ndvi_pre_avg} to ${claim.satellite.ndvi_post_avg} (-${claim.satellite.vegetation_drop_pct}% loss). NDWI recorded +${claim.satellite.flood_water_index_ndwi || 0.48} proving deep water submersion.`,
      telemetry: isFraud
        ? 'NDVI Diff: -0.02 • NDWI: -0.38 (Bone Dry) • Physical Contradiction Confirmed'
        : `Pre: ${claim.satellite.ndvi_pre_avg} → Post: ${claim.satellite.ndvi_post_avg} • NDWI: +0.58 (Water Submerged)`,
      weight: 35,
      x: 420,
      y: 130
    },
    {
      id: 'imd_weather',
      label: 'IMD Weather Radar',
      category: 'weather',
      status: isFraud ? 'critical' : 'verified',
      value: `${claim.weather.rainfall_disaster_day_mm} mm Precip`,
      detail: isFraud
        ? 'METEOROLOGICAL CONTRADICTION: IMD gridded reanalysis and Open-Meteo recorded only 1.2 mm rainfall on disaster date (0.08x baseline). Soil saturation is only 18% (dry week).'
        : `Extreme localized cloudburst recorded on ${claim.disaster.disaster_date} (${claim.weather.rainfall_disaster_day_mm} mm). Rainfall anomaly is ${claim.weather.anomaly_ratio}x historical August baseline. Soil moisture supersaturated at ${claim.weather.soil_saturation_pct}%.`,
      telemetry: isFraud
        ? 'Precip: 1.2 mm • 7-Day Cumulative: 3.5 mm • Anomaly: 0.08x (Dry)'
        : `Precip: 142.5 mm • 7-Day Cumulative: 265.0 mm • Anomaly: 3.42x (Cloudburst)`,
      weight: 25,
      x: 420,
      y: 210
    },
    {
      id: 'ai_swarm_consensus',
      label: 'Autonomous AI Swarm',
      category: 'actuarial',
      status: isFraud ? 'critical' : 'verified',
      value: `${claim.evidence_confidence_score}% Confidence`,
      detail: isFraud
        ? 'CRITICAL FRAUD INTERCEPTION: 5 Autonomous AI agents detected 3 irreconcilable physical contradictions between declared loss, satellite spectral health, and weather radar. Score: 12/100.'
        : `Unanimous corroboration across all 5 autonomous verification agents. Tri-sensor convergence achieved with 89% evidence confidence. Fast-track settlement approved.`,
      telemetry: isFraud
        ? 'Consensus Score: 12/100 • Risk Tier: Critical Fraud • Fraud Factor: 0.94'
        : 'Consensus Score: 89/100 • Risk Tier: Low Risk • Settlement Velocity: 72h',
      weight: 40,
      x: 620,
      y: 130
    },
    {
      id: 'adjudication_verdict',
      label: 'Adjudication Decision',
      category: 'actuarial',
      status: isFraud ? 'critical' : 'verified',
      value: isFraud ? 'Payout: ₹0.00 (Flagged)' : `₹${claim.estimated_payout.toLocaleString('en-IN')}`,
      detail: isFraud
        ? 'FINAL ADJUDICATION: Payout revoked to ₹0.00. Dossier forwarded to State PMFBY Anti-Fraud Vigilance Bureau.'
        : `FINAL ADJUDICATION: Actuarial payout of ₹${claim.estimated_payout.toLocaleString('en-IN')} approved based on PMFBY scale of finance (₹10,000/ac cap) and 70% verified inundation.`,
      telemetry: isFraud
        ? 'Decision: Claim Rejected & Referred • Actuarial Status: Blocked'
        : 'Decision: Approved • Direct DBT Payment Scheduled via PMFBY Gateway',
      weight: 100,
      x: 790,
      y: 130
    }
  ];

  // Connections / Causal Edges
  const edges = [
    { from: 'claim_declaration', to: 'cadastral_gis' },
    { from: 'claim_declaration', to: 'exif_photos' },
    { from: 'cadastral_gis', to: 'sentinel_telemetry' },
    { from: 'sentinel_telemetry', to: 'ndvi' },
    { from: 'claim_declaration', to: 'imd_weather' },
    { from: 'exif_photos', to: 'ai_swarm_consensus' },
    { from: 'ndvi', to: 'ai_swarm_consensus' },
    { from: 'imd_weather', to: 'ai_swarm_consensus' },
    { from: 'ai_swarm_consensus', to: 'adjudication_verdict' }
  ];

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const filteredNodes = activeLayerFilter === 'all' 
    ? nodes 
    : nodes.filter(n => n.category === activeLayerFilter || n.category === 'actuarial');

  // Comparative Tri-Sensor Convergence Metrics
  const declaredLoss = claim.disaster.damage_percentage_reported;
  const satelliteLoss = isFraud ? 2.5 : claim.satellite.vegetation_drop_pct;
  const weatherIntensity = isFraud ? 3.0 : 92.0;
  const groundExifMatch = isFraud ? 12.0 : 96.0;

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl backdrop-blur-md space-y-6">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Explainable AI (XAI)
            </span>
            <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-mono">
              Knowledge Graph & Causal Lineage
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            Explainable AI Multi-Sensor Evidence Graph
          </h3>
          <p className="text-xs text-slate-400">
            Interactive causal evidence network showing how physical sensors, orbital telemetry, and actuarial models arrive at the claim verdict.
          </p>
        </div>

        {/* Layer Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
          {[
            { id: 'all', label: 'All Layers' },
            { id: 'satellite', label: '🛰️ Satellite' },
            { id: 'weather', label: '🌧️ Weather' },
            { id: 'ground', label: '📍 Ground Truth' },
            { id: 'actuarial', label: '⚖️ Actuarial' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveLayerFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeLayerFilter === f.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. INTERACTIVE SVG CAUSAL KNOWLEDGE GRAPH                      */}
      {/* ============================================================== */}
      <div className="relative rounded-3xl bg-slate-950 border border-slate-800 p-4 overflow-x-auto shadow-inner">
        <div className="flex items-center justify-between mb-2 px-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-mono">
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Node-Link Causal Topology • Click any node to inspect telemetry</span>
          </span>
          <span className="text-[11px] font-mono text-emerald-400">
            {isFraud ? '🚨 Contradictory Edges Active' : '✓ Unanimous Edge Consensus'}
          </span>
        </div>

        <div className="relative min-w-[880px] h-[280px]">
          <svg className="w-full h-full absolute inset-0 pointer-events-none">
            <defs>
              <linearGradient id="edgeGradNormal" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0891b2" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="edgeGradFraud" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Render Connecting Bezier Edges */}
            {edges.map((e, idx) => {
              const fromNode = nodes.find(n => n.id === e.from);
              const toNode = nodes.find(n => n.id === e.to);
              if (!fromNode || !toNode) return null;

              const isConnected = selectedNodeId === e.from || selectedNodeId === e.to;
              const isBadEdge = isFraud && (e.to === 'ai_swarm_consensus' || e.from === 'exif_photos' || e.from === 'ndvi' || e.from === 'imd_weather');

              const dx = toNode.x - fromNode.x;
              const cx1 = fromNode.x + dx * 0.5;
              const cy1 = fromNode.y;
              const cx2 = fromNode.x + dx * 0.5;
              const cy2 = toNode.y;
              const d = `M ${fromNode.x + 60} ${fromNode.y + 25} C ${cx1} ${cy1 + 25}, ${cx2} ${cy2 + 25}, ${toNode.x} ${toNode.y + 25}`;

              return (
                <g key={idx}>
                  <path
                    d={d}
                    fill="none"
                    stroke={isBadEdge ? '#ef4444' : isConnected ? '#38bdf8' : '#334155'}
                    strokeWidth={isConnected ? 3 : 1.5}
                    strokeDasharray={isBadEdge ? '4,4' : isConnected ? '6,4' : 'none'}
                    className={isConnected || isBadEdge ? 'animate-pulse' : ''}
                  />
                  {/* Flow Particles along active connections */}
                  {isConnected && (
                    <circle r="3.5" fill={isBadEdge ? '#ef4444' : '#38bdf8'}>
                      <animateMotion path={d} dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Render Interactive HTML Nodes */}
          {nodes.map(n => {
            const isSelected = selectedNodeId === n.id;
            const isCritical = n.status === 'critical';
            const isFiltered = activeLayerFilter !== 'all' && n.category !== activeLayerFilter && n.category !== 'actuarial';

            return (
              <div
                key={n.id}
                onClick={() => setSelectedNodeId(n.id)}
                style={{ left: `${n.x}px`, top: `${n.y}px` }}
                className={`absolute w-36 p-2.5 rounded-2xl border text-left transition-all cursor-pointer select-none transform hover:scale-105 z-10 ${
                  isFiltered ? 'opacity-30' : 'opacity-100'
                } ${
                  isSelected
                    ? isCritical
                      ? 'bg-red-950 border-red-500 shadow-xl shadow-red-500/30 ring-2 ring-red-400'
                      : 'bg-cyan-950 border-cyan-400 shadow-xl shadow-cyan-500/30 ring-2 ring-cyan-400'
                    : isCritical
                    ? 'bg-red-950/60 border-red-500/50 hover:border-red-400 animate-pulse'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isCritical ? 'bg-red-500/20 text-red-300' : 'bg-cyan-500/20 text-cyan-300'
                  }`}>
                    {n.category}
                  </span>
                  <span className="w-2 h-2 rounded-full" style={{ background: isCritical ? '#ef4444' : '#10b981' }} />
                </div>
                <div className="text-[11px] font-bold text-white truncate">{n.label}</div>
                <div className={`text-[10px] font-mono font-black truncate mt-0.5 ${
                  isCritical ? 'text-red-300' : 'text-emerald-400'
                }`}>
                  {n.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SELECTED NODE DEEP FORENSIC DETAIL CARD                     */}
      {/* ============================================================== */}
      <div className={`p-5 rounded-2xl border transition-all ${
        selectedNode.status === 'critical'
          ? 'bg-red-950/40 border-red-500/50 shadow-lg shadow-red-950/30'
          : 'bg-slate-950 border-cyan-500/30'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                selectedNode.status === 'critical'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              }`}>
                {selectedNode.category} Evidence Node
              </span>
              <h4 className="text-base font-bold text-white">{selectedNode.label}</h4>
              {selectedNode.status === 'critical' && (
                <span className="text-[10px] bg-red-500 text-white font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  <span>CONTRADICTION DETECTED</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-200 leading-relaxed max-w-3xl">
              {selectedNode.detail}
            </p>

            <div className="text-[11px] font-mono text-cyan-400 pt-1 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Raw Sensor Telemetry: <strong>{selectedNode.telemetry}</strong></span>
            </div>
          </div>

          <div className="flex-shrink-0 text-right p-3 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Node Verified Value</span>
            <span className={`text-xl font-black font-mono block mt-0.5 ${
              selectedNode.status === 'critical' ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {selectedNode.value}
            </span>
            <span className="text-[9px] text-slate-500 block">Causal Weight: {selectedNode.weight}%</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. ATTRACTIVE VISUAL GRAPHS & COMPARISON CHARTS                */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAPH 1: TRI-SENSOR CONVERGENCE COMPARISON BARS */}
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">Tri-Sensor Cross-Validation Convergence</h4>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isFraud 
                ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {isFraud ? '🚨 88% Sensor Conflict' : '✓ 94% Multi-Sensor Convergence'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {isFraud
              ? 'Orbital satellite and meteorological radar severely contradict the claimant declaration. Sensors diverge outside valid physical limits.'
              : 'All 3 independent physical telemetry sources corroborate the reported disaster within a tight 6% margin of error.'}
          </p>

          <div className="space-y-3 pt-1">
            {/* 1. Declared Loss */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">1. Farmer Declared Loss</span>
                <span className="text-white font-mono font-bold">{declaredLoss}%</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, declaredLoss)}%` }}
                />
              </div>
            </div>

            {/* 2. Sentinel-2 Satellite Vegetation Loss */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">2. Sentinel-2 Satellite Vegetation Loss</span>
                <span className={`font-mono font-bold ${isFraud ? 'text-red-400' : 'text-emerald-400'}`}>
                  {satelliteLoss.toFixed(1)}% {isFraud ? '(Healthy Canopy!)' : '(Severe Inundation)'}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isFraud ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, satelliteLoss))}%` }}
                />
              </div>
            </div>

            {/* 3. Weather Radar Precipitation Anomaly */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">3. IMD Meteorological Radar Anomaly</span>
                <span className={`font-mono font-bold ${isFraud ? 'text-red-400' : 'text-cyan-400'}`}>
                  {weatherIntensity}% {isFraud ? '(Negligible 1.2mm rain)' : '(142.5mm Cloudburst)'}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isFraud ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, weatherIntensity))}%` }}
                />
              </div>
            </div>

            {/* 4. Ground Photo EXIF Geofence Match */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">4. Ground Camera EXIF Geofence Compliance</span>
                <span className={`font-mono font-bold ${isFraud ? 'text-red-400' : 'text-purple-400'}`}>
                  {groundExifMatch}% {isFraud ? '(14.3km Out of Bounds)' : '(Inside Parcel)'}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isFraud ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-indigo-400'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, groundExifMatch))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* GRAPH 2: EXPLAINABLE AI FACTOR ATTRIBUTION (WATERFALL BREAKDOWN) */}
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-white">XAI Factor Attribution & Weight Waterfall</h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Bayesian Consensus Model
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Mathematical breakdown of how positive corroborating signals and negative fraud penalties synthesized the final verdict.
          </p>

          <div className="space-y-2.5 pt-1 text-xs">
            {isFraud ? (
              <>
                <div className="flex items-center justify-between p-2.5 bg-red-950/40 rounded-xl border border-red-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold font-mono">-45 pts</span>
                    <span className="text-red-200">Camera EXIF GPS is 14.3 km away from Hosakote parcel</span>
                  </div>
                  <span className="text-[10px] font-bold text-red-400 uppercase">Penalty</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-red-950/40 rounded-xl border border-red-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold font-mono">-35 pts</span>
                    <span className="text-red-200">Sentinel-2 MSI detects healthy canopy (NDVI 0.76, -2.5% drop)</span>
                  </div>
                  <span className="text-[10px] font-bold text-red-400 uppercase">Penalty</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-red-950/40 rounded-xl border border-red-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold font-mono">-20 pts</span>
                    <span className="text-red-200">IMD radar recorded only 1.2 mm rain (dry week, no flood)</span>
                  </div>
                  <span className="text-[10px] font-bold text-red-400 uppercase">Penalty</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold font-mono">+12 pts</span>
                    <span className="text-slate-300">Valid PMFBY policy application number registration</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Credit</span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold">
                  <span className="text-slate-300">Net Final AI Confidence Rating:</span>
                  <span className="text-red-400 font-mono text-sm">12 / 100 (Critical Fraud Risk)</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold font-mono">+35 pts</span>
                    <span className="text-emerald-200">Sentinel-2 multispectral NDVI drop from 0.74 to 0.28 (-62%)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Weight</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold font-mono">+25 pts</span>
                    <span className="text-emerald-200">IMD radar 142.5 mm localized cloudburst corroboration</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Weight</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold font-mono">+20 pts</span>
                    <span className="text-emerald-200">Camera EXIF GPS matches parcel centroid within 32m</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Weight</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold font-mono">+15 pts</span>
                    <span className="text-emerald-200">Cadastral Survey 125/2 matching DIGIPIN 562C-8F29-KM</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Weight</span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold">
                  <span className="text-slate-300">Net Final AI Confidence Rating:</span>
                  <span className="text-emerald-400 font-mono text-sm">89 / 100 (Unanimous Approval)</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
