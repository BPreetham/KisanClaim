import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2, Clock, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { Claim, StatsKPI } from '../../types';
import { ClaimQueueTable } from './ClaimQueueTable';
import { ClaimDetailPage } from './ClaimDetailPage';

interface Props {
  claims: Claim[];
  stats: StatsKPI | null;
  onOpenReport: (claim: Claim) => void;
  onRunAgents: (claimId: string) => Promise<void>;
  onSubmitReviewAction: (claimId: string, payload: any) => Promise<void>;
}

export const InsuranceDashboard: React.FC<Props> = ({
  claims,
  stats,
  onOpenReport,
  onRunAgents,
  onSubmitReviewAction
}) => {
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // If a claim is clicked, show its deep detail page
  if (selectedClaim) {
    const currentClaimData = claims.find(c => c.id === selectedClaim.id) || selectedClaim;
    return (
      <ClaimDetailPage
        claim={currentClaimData}
        onBack={() => setSelectedClaim(null)}
        onOpenReport={onOpenReport}
        onRunAgents={() => onRunAgents(currentClaimData.id)}
        onSubmitReviewAction={(payload) => onSubmitReviewAction(currentClaimData.id, payload)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl border border-slate-800 p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>National Crop Insurance Verification Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Insurance Adjudication & Evidence Intelligence Suite
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Multi-spectral Sentinel-2 satellite analysis, automated fraud geofencing, and AI multi-agent claim verification.
          </p>
        </div>

        <div className="text-right bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] uppercase font-bold text-slate-400 block">Total Pipeline Value</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            ₹{stats?.total_estimated_claim_value?.toLocaleString('en-IN') || '1,72,500'}
          </span>
          <span className="text-[10px] text-slate-500 block">Across 6 monitored districts</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Claims */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Total Claims</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl font-black text-white font-mono mt-1 block">
            {stats?.total_claims || claims.length}
          </span>
          <span className="text-[10px] text-slate-500">100% telemetry synced</span>
        </div>

        {/* Pending Verification */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-400">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
            {stats?.pending_verification || 3}
          </span>
          <span className="text-[10px] text-amber-500">Awaiting officer adjudication</span>
        </div>

        {/* AI Flagged / Additional Evidence */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-cyan-400">Approved Payouts</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-black text-cyan-400 font-mono mt-1 block">
            {stats?.approved_claims || 2}
          </span>
          <span className="text-[10px] text-cyan-500">Fast-tracked via AI Twin</span>
        </div>

        {/* Processing Velocity */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-400">Avg Settlement Speed</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
            {stats?.average_processing_time_hours || 14.5} hrs
          </span>
          <span className="text-[10px] text-emerald-500">Reduced from 45 days baseline</span>
        </div>
      </div>

      {/* Main Claim Queue Table */}
      <ClaimQueueTable claims={claims} onSelectClaim={(c) => setSelectedClaim(c)} />
    </div>
  );
};
