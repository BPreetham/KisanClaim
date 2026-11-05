import React from 'react';
import { X, Printer, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { Claim } from '../../types';

interface Props {
  claim: Claim | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportViewerModal: React.FC<Props> = ({ claim, isOpen, onClose }) => {
  if (!isOpen || !claim) return null;

  const htmlUrl = `/api/claims/${claim.id}/report.html`;
  const pdfUrl = `/api/claims/${claim.id}/report.pdf`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  KisanClaim Verification Dossier
                </h3>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  {claim.claim_number}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Multi-Page Satellite & Meteorological Evidence Report
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Tab</span>
            </a>

            <a
              href={pdfUrl}
              download={`KisanClaim_${claim.claim_number}.pdf`}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Preview iFrame */}
        <div className="flex-1 bg-white">
          <iframe
            src={htmlUrl}
            title={`Report for ${claim.claim_number}`}
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
