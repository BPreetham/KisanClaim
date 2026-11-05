import React, { useState } from 'react';
import { ShieldAlert, FileCheck, Satellite, Calculator, Award, ChevronDown, ChevronUp, Play, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Check, ArrowRight, Zap, Loader2, RotateCcw } from 'lucide-react';
import { AIAgentFinding, Claim } from '../../types';

interface Props {
  claim: Claim;
  onRunAgents: () => Promise<void>;
}

export const MultiAgentPanel: React.FC<Props> = ({ claim, onRunAgents }) => {
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  
  // Independent verification execution state for each agent: 'idle' | 'checking' | 'verified'
  const [agentStates, setAgentStates] = useState<Record<string, 'idle' | 'checking' | 'verified'>>(() => {
    const initial: Record<string, 'idle' | 'checking' | 'verified'> = {};
    claim.ai_agents.forEach(ag => {
      initial[ag.agent_id] = 'idle';
    });
    return initial;
  });

  const [activeStepText, setActiveStepText] = useState<Record<string, string>>({});
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);

  // Diagnostic steps for each agent while checking
  const agentDiagnosticSteps: Record<string, string[]> = {
    'ag-doc': [
      'Querying Bhoomi Cadastral Database...',
      'Matching Land Parcel ID & Survey Number...',
      'Validating 10-character DIGIPIN code...',
      'Land & Policy verification complete!'
    ],
    'ag-fraud': [
      'Extracting smartphone EXIF header metadata...',
      'Calculating distance offset from polygon centroid...',
      'Running image compression and tamper analysis...',
      'Forensic integrity scoring complete!'
    ],
    'ag-sat': [
      'Retrieving Sentinel-2 MSI multispectral bands...',
      'Computing pre-disaster vs post-disaster NDVI shift...',
      'Ingesting IMD gridded precipitation reanalysis...',
      'Satellite & radar cross-correlation complete!'
    ],
    'ag-damage': [
      'Applying PMFBY District Scale of Finance...',
      'Computing affected area ratio against sum insured...',
      'Benchmarking localized crop loss ceiling...',
      'Actuarial payout recommendation ready!'
    ],
    'ag-likelihood': [
      'Synthesizing multi-agent Bayesian weights...',
      'Cross-checking contradictory evidence flags...',
      'Generating explainable confidence rating...',
      'Consensus audit complete!'
    ]
  };

  const getAgentIcon = (role: string) => {
    if (role.includes('Fraud') || role.includes('Forensic')) return <ShieldAlert className="w-5 h-5 text-red-400" />;
    if (role.includes('Document') || role.includes('Registry')) return <FileCheck className="w-5 h-5 text-cyan-400" />;
    if (role.includes('Satellite') || role.includes('Spectral')) return <Satellite className="w-5 h-5 text-emerald-400" />;
    if (role.includes('Actuarial') || role.includes('Assessment')) return <Calculator className="w-5 h-5 text-amber-400" />;
    return <Award className="w-5 h-5 text-purple-400" />;
  };

  const toggleExpand = (id: string) => {
    setExpandedAgentId(expandedAgentId === id ? null : id);
  };

  // Run a single agent interactively
  const handleVerifyAgent = async (agentId: string) => {
    setAgentStates(prev => ({ ...prev, [agentId]: 'checking' }));
    
    // Animate diagnostic text steps
    const steps = agentDiagnosticSteps[agentId] || [
      'Analyzing sensor telemetry...',
      'Corroborating physical observations...',
      'Computing verification integrity score...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setActiveStepText(prev => ({ ...prev, [agentId]: steps[i] }));
      await new Promise(r => setTimeout(r, 350));
    }

    setAgentStates(prev => ({ ...prev, [agentId]: 'verified' }));
    // Auto expand to show findings
    setExpandedAgentId(agentId);
  };

  // Run all 5 agents in a sequential cascade
  const handleRunAllSequentially = async () => {
    setIsBatchRunning(true);
    for (const ag of claim.ai_agents) {
      await handleVerifyAgent(ag.agent_id);
      await new Promise(r => setTimeout(r, 200));
    }
    setIsBatchRunning(false);
  };

  // Reset all agents to idle state
  const handleResetAll = () => {
    const resetMap: Record<string, 'idle' | 'checking' | 'verified'> = {};
    claim.ai_agents.forEach(ag => {
      resetMap[ag.agent_id] = 'idle';
    });
    setAgentStates(resetMap);
    setExpandedAgentId(null);
  };

  const verifiedAgents = claim.ai_agents.filter(a => agentStates[a.agent_id] === 'verified');
  const verifiedCount = verifiedAgents.length;
  const passedCount = verifiedAgents.filter(a => a.status === 'passed').length;
  const flaggedCount = verifiedAgents.filter(a => a.status === 'flagged').length;

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl backdrop-blur-md">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Autonomous Verification Swarm
            </span>
            <span className="text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-mono">
              On-Demand Agent Audit
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            Multi-Agent AI Verification & Scoring Console
          </h3>
          <p className="text-xs text-slate-400">
            Submit each agent independently to compute and reveal live forensic scores, or execute the full swarm sequentially.
          </p>
        </div>

        {/* Master Control Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetAll}
            disabled={isBatchRunning || verifiedCount === 0}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            title="Reset verification states"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleRunAllSequentially}
            disabled={isBatchRunning || verifiedCount === claim.ai_agents.length}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Zap className={`w-3.5 h-3.5 ${isBatchRunning ? 'animate-bounce text-amber-200' : 'text-amber-300'}`} />
            <span>{isBatchRunning ? 'Running Swarm Audit...' : '⚡ Run All Agents Sequentially'}</span>
          </button>
        </div>
      </div>

      {/* Progress & Consensus Status Meter with Multi-Color Progress Bar */}
      <div className="my-4 p-4.5 bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-slate-950/90 rounded-2xl border border-slate-700/80 shadow-lg text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/15 text-cyan-300 rounded-xl border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">
                Swarm Audit Progress: <span className="text-cyan-400 font-mono">{verifiedCount} / {claim.ai_agents.length} Agents Executed</span>
              </div>
              <div className="text-[11px] text-slate-300/80 mt-0.5">
                {verifiedCount === 0 
                  ? 'Press "Submit & Check" on any agent card below to analyze evidence live.' 
                  : `${passedCount} passed integrity audit • ${flaggedCount > 0 ? `${flaggedCount} flagged anomalies` : 'Zero anomalies detected'}`}
              </div>
            </div>
          </div>

          {/* Live Swarm Likelihood Score (revealed when agents are checked) */}
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Consensus Confidence</span>
            {verifiedCount > 0 ? (
              <span className={`text-lg font-black font-mono ${flaggedCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {Math.round((verifiedAgents.reduce((acc, a) => acc + a.score, 0)) / verifiedCount)}%
                <span className="text-xs font-normal text-slate-400 ml-1">({flaggedCount > 0 ? 'High Risk' : 'High Confidence'})</span>
              </span>
            ) : (
              <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Awaiting Verification
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Vibrant Progress Bar */}
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 mt-3.5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
            style={{ width: `${(verifiedCount / claim.ai_agents.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Agents Card Grid with Individual Submit / Check Buttons */}
      <div className="space-y-3">
        {claim.ai_agents.map((ag) => {
          const state = agentStates[ag.agent_id] || 'idle';
          const isVerified = state === 'verified';
          const isChecking = state === 'checking';
          const isExpanded = expandedAgentId === ag.agent_id;
          const isPassed = ag.status === 'passed';

          return (
            <div
              key={ag.agent_id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isVerified
                  ? isPassed
                    ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-950/90 border-emerald-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.15)]'
                    : 'bg-gradient-to-r from-rose-950/40 via-slate-900/90 to-slate-950/90 border-rose-500/60 shadow-[0_4px_25px_rgba(244,63,94,0.25)]'
                  : isChecking
                  ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-slate-950/90 border-cyan-400/60 shadow-[0_4px_20px_rgba(6,182,212,0.3)] animate-pulse'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Header Row */}
              <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-[240px] flex-1">
                  <div className={`p-2.5 rounded-xl border ${
                    isVerified 
                      ? isPassed ? 'bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-rose-500/20 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                      : 'bg-slate-900 border-slate-800'
                  }`}>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{ag.agent_name}</span>
                      
                      {/* Status Badge */}
                      {isVerified ? (
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          isPassed
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                        }`}>
                          {ag.status}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {isChecking ? 'Auditing...' : 'Ready to Run'}
                        </span>
                      )}
                    </div>

                    {/* Diagnostic text while checking vs normal summary */}
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {isChecking ? (
                        <span className="text-cyan-400 font-mono flex items-center gap-1.5 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {activeStepText[ag.agent_id] || 'Analyzing evidence...'}
                        </span>
                      ) : isVerified ? (
                        ag.summary
                      ) : (
                        `Domain: ${ag.agent_role} • Press submit button to calculate verification score`
                      )}
                    </span>
                  </div>
                </div>

                {/* Score & Action Button Section */}
                <div className="flex items-center gap-4">
                  {/* Score Indicator */}
                  <div className="text-right min-w-[90px]">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      {isVerified ? 'Audit Score' : 'Status'}
                    </span>
                    {isVerified ? (
                      <span className={`text-lg font-black font-mono ${
                        isPassed ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {ag.score}<span className="text-xs text-slate-500">/100</span>
                      </span>
                    ) : isChecking ? (
                      <span className="text-sm font-mono text-cyan-300 flex items-center justify-end gap-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Calc...</span>
                      </span>
                    ) : (
                      <span className="text-sm font-mono text-slate-500">--- / 100</span>
                    )}
                  </div>

                  {/* SUBMIT / CHECK BUTTON FOR EVERY AGENT */}
                  <div>
                    {isVerified ? (
                      <button
                        type="button"
                        onClick={() => handleVerifyAgent(ag.agent_id)}
                        disabled={isBatchRunning}
                        className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white text-xs font-bold rounded-xl border border-cyan-500/30 hover:border-cyan-400 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                        title="Re-run this agent"
                      >
                        <RefreshCw className="w-3 h-3 text-cyan-400" />
                        <span>Re-Check</span>
                      </button>
                    ) : isChecking ? (
                      <button
                        disabled
                        className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-300 border border-cyan-400/60 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse"
                      >
                        <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                        <span>Checking...</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleVerifyAgent(ag.agent_id)}
                        disabled={isBatchRunning}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white text-xs font-black rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 cursor-pointer group"
                      >
                        <Play className="w-3 h-3 text-white fill-white group-hover:scale-110 transition-transform" />
                        <span>Submit & Check</span>
                      </button>
                    )}
                  </div>

                  {/* Expand / Collapse Button (active once verified) */}
                  {isVerified && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(ag.agent_id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Findings Section (shown after verification) */}
              {isVerified && isExpanded && (
                <div className="p-4 bg-slate-900/95 border-t border-slate-800/80 space-y-3 text-xs animate-fadeIn">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Agent Detailed Assessment
                    </span>
                    <p className="text-slate-200 leading-relaxed">{ag.explanation}</p>
                  </div>

                  {/* Supporting Evidence List */}
                  {ag.supporting_evidence.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                        ✓ Supporting Corroboration Points
                      </span>
                      <ul className="space-y-1">
                        {ag.supporting_evidence.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Contradicting / Variance points */}
                  {ag.contradicting_evidence.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block mb-1">
                        🚨 Anomalies & Contradictions Flagged
                      </span>
                      <ul className="space-y-1">
                        {ag.contradicting_evidence.map((c, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-red-200 font-semibold bg-red-950/40 p-2 rounded-lg border border-red-500/30">
                            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="text-cyan-300">
                      <strong>Recommended Adjudication Action:</strong> {ag.recommended_action}
                    </div>
                    <span className="text-slate-500 font-mono">
                      Agent ID: {ag.agent_id}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
