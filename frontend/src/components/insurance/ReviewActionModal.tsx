import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, CreditCard, X, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Claim } from '../../types';

interface Props {
  claim: Claim;
  isOpen: boolean;
  onClose: () => void;
  onSubmitAction: (payload: {
    action: string;
    reviewer_id: string;
    reviewer_name: string;
    comments: string;
    approved_amount?: number;
    rejection_reason?: string;
    requested_evidence?: string;
  }) => Promise<void>;
}

export const ReviewActionModal: React.FC<Props> = ({
  claim,
  isOpen,
  onClose,
  onSubmitAction
}) => {
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'request_evidence' | 'schedule_payment'>('approve');
  const [reviewerName, setReviewerName] = useState<string>('Ananya Sharma (Senior Agronomist)');
  const [reviewerId, setReviewerId] = useState<string>('REV-EMP-409');
  const [approvedAmount, setApprovedAmount] = useState<number>(claim.estimated_payout);
  const [comments, setComments] = useState<string>('Satellite NDVI drop and rainfall radar spikes conclusively corroborate flood inundation. Claim approved in accordance with PMFBY Kharif 2026 norms.');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [requestedEvidence, setRequestedEvidence] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (selectedAction === 'approve') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      await onSubmitAction({
        action: selectedAction,
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        comments: comments,
        approved_amount: selectedAction === 'approve' || selectedAction === 'schedule_payment' ? approvedAmount : undefined,
        rejection_reason: selectedAction === 'reject' ? rejectionReason : undefined,
        requested_evidence: selectedAction === 'request_evidence' ? requestedEvidence : undefined
      });

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Human Reviewer Adjudication Console
              </h3>
              <p className="text-xs text-slate-400">
                Claim: <span className="text-white font-mono">{claim.claim_number}</span> • Farmer: {claim.farmer.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Type Tabs */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedAction('approve');
                setComments('Satellite NDVI drop and rainfall radar spikes conclusively corroborate flood inundation. Claim approved in accordance with PMFBY Kharif 2026 norms.');
              }}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                selectedAction === 'approve'
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Approve</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedAction('reject');
                setComments('Adjudication decision: Claim rejected based on policy exclusion or contradictory evidence.');
              }}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                selectedAction === 'reject'
                  ? 'bg-red-600 border-red-400 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <XCircle className="w-5 h-5" />
              <span>Reject</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedAction('request_evidence');
                setComments('Reviewer requested supplementary evidentiary submission.');
              }}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                selectedAction === 'request_evidence'
                  ? 'bg-amber-600 border-amber-400 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <AlertCircle className="w-5 h-5" />
              <span>More Evidence</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedAction('schedule_payment');
                setComments('Direct DBT batch payout scheduled for approved claim.');
              }}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                selectedAction === 'schedule_payment'
                  ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Schedule DBT</span>
            </button>
          </div>

          {/* Conditional inputs */}
          {(selectedAction === 'approve' || selectedAction === 'schedule_payment') && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-2">
              <label className="text-xs font-semibold text-emerald-300 block">
                Approved Payout Amount (₹ INR)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">₹</span>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={e => setApprovedAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-4 py-2 text-lg font-bold text-emerald-400 font-mono outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-400 block">
                Recommended Indicative Baseline: ₹{claim.estimated_payout.toLocaleString('en-IN')} (Sum Insured Cap: ₹{claim.crop.sum_insured.toLocaleString('en-IN')})
              </span>
            </div>
          )}

          {selectedAction === 'reject' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-red-300 block">
                Mandatory Rejection Justification
              </label>
              <textarea
                required
                rows={2}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="State specific policy clause or contradictory satellite data..."
                className="w-full bg-slate-950 border border-red-500/50 rounded-xl p-3 text-white text-xs outline-none"
              />
            </div>
          )}

          {selectedAction === 'request_evidence' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-amber-300 block">
                Specific Evidence Requested from Farmer
              </label>
              <textarea
                required
                rows={2}
                value={requestedEvidence}
                onChange={e => setRequestedEvidence(e.target.value)}
                placeholder="E.g., Please upload close-up photos of root rot, or updated canal water discharge certificate..."
                className="w-full bg-slate-950 border border-amber-500/50 rounded-xl p-3 text-white text-xs outline-none"
              />
            </div>
          )}

          {/* Reviewer Comments */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Official Reviewer Comments & Audit Notes
            </label>
            <textarea
              rows={2}
              value={comments}
              onChange={e => setComments(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs outline-none"
            />
          </div>

          {/* Reviewer Identity */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Reviewer Name</label>
              <input
                type="text"
                value={reviewerName}
                onChange={e => setReviewerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Employee ID</label>
              <input
                type="text"
                value={reviewerId}
                onChange={e => setReviewerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition cursor-pointer"
            >
              {submitting ? 'Broadcasting Decision...' : 'Commit & Notify Farmer Instantly'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
