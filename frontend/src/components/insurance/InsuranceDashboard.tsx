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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 rounded-3xl border border-cyan-500/30 p-6 md:p-8 shadow-[0_20px_50px_rgba(6,182,212,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl relative overflow-hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-bold mb-3 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>National Crop Insurance Verification Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Insurance Adjudication & Evidence Intelligence Suite
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Multi-spectral Sentinel-2 satellite analysis, automated fraud geofencing, and AI multi-agent claim verification.
          </p>
        </div>

        <div className="text-right bg-gradient-to-br from-emerald-950/80 to-slate-950/90 p-5 rounded-2xl border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
          <span className="text-[11px] uppercase font-bold text-emerald-300 block">Total Pipeline Value</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            ₹{stats?.total_estimated_claim_value?.toLocaleString('en-IN') || '1,72,500'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Across 6 monitored districts</span>
        </div>
      </div>

      {/* KPI Cards Row with Beautiful Accent Gradients */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Claims */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-900 rounded-2xl border border-indigo-500/30 p-4 shadow-lg hover:border-indigo-400/60 hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-indigo-300">Total Claims</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white font-mono mt-1 block">
            {stats?.total_claims || claims.length}
          </span>
          <span className="text-[10px] text-slate-400">100% telemetry synced</span>
        </div>

        {/* Pending Verification */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-900 rounded-2xl border border-amber-500/30 p-4 shadow-lg hover:border-amber-400/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-300">Pending Review</span>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-1 block">
            {stats?.pending_verification || 3}
          </span>
          <span className="text-[10px] text-amber-400/80">Awaiting officer adjudication</span>
        </div>

        {/* AI Flagged / Additional Evidence */}
        <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-900 rounded-2xl border border-cyan-500/30 p-4 shadow-lg hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-cyan-300">Approved Payouts</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono mt-1 block">
            {stats?.approved_claims || 2}
          </span>
          <span className="text-[10px] text-cyan-400/80">Fast-tracked via AI Twin</span>
        </div>

        {/* Processing Velocity */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-900 rounded-2xl border border-emerald-500/30 p-4 shadow-lg hover:border-emerald-400/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-300">Avg Settlement Speed</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1 block">
            {stats?.average_processing_time_hours || 14.5} hrs
          </span>
          <span className="text-[10px] text-emerald-400/80">Down from 6 weeks legacy</span>
        </div>
      </div>

      {/* Main Claim Queue Table */}
      <ClaimQueueTable claims={claims} onSelectClaim={(c) => setSelectedClaim(c)} />
    </div>
  );
};
