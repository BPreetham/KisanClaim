import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, ChevronRight, Eye, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Claim } from '../../types';

interface Props {
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
}

export const ClaimQueueTable: React.FC<Props> = ({ claims, onSelectClaim }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cropFilter, setCropFilter] = useState<string>('all');
  const [disasterFilter, setDisasterFilter] = useState<string>('all');

  const filteredClaims = claims.filter(c => {
    if (statusFilter !== 'all' && c.current_status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (cropFilter !== 'all' && c.crop.crop_name.toLowerCase() !== cropFilter.toLowerCase()) return false;
    if (disasterFilter !== 'all' && c.disaster.disaster_type.toLowerCase() !== disasterFilter.toLowerCase()) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const match = (
        c.claim_number.toLowerCase().includes(s) ||
        c.farmer.name.toLowerCase().includes(s) ||
        c.farmer.district.toLowerCase().includes(s) ||
        c.land.survey_number.toLowerCase().includes(s) ||
        c.crop.crop_name.toLowerCase().includes(s)
      );
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Payment Scheduled':
      case 'Paid':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Additional Evidence Required':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Severe':
        return 'text-red-400 font-bold';
      case 'High':
        return 'text-amber-400 font-semibold';
      case 'Moderate':
        return 'text-yellow-400';
      default:
        return 'text-emerald-400';
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl backdrop-blur-md">
      {/* Table Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search claim ID, farmer, survey #, or district..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Additional Evidence Required">Additional Evidence Required</option>
            <option value="Payment Scheduled">Payment Scheduled</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={cropFilter}
            onChange={e => setCropFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 outline-none"
          >
            <option value="all">All Crops</option>
            <option value="Ragi">Ragi</option>
            <option value="Paddy">Paddy</option>
            <option value="Sugarcane">Sugarcane</option>
            <option value="Onion">Onion</option>
            <option value="Cotton">Cotton</option>
            <option value="Wheat">Wheat</option>
          </select>

          <select
            value={disasterFilter}
            onChange={e => setDisasterFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 outline-none"
          >
            <option value="all">All Disasters</option>
            <option value="Flood">Flood</option>
            <option value="Heavy rainfall">Heavy rainfall</option>
            <option value="Drought">Drought</option>
            <option value="Hailstorm">Hailstorm</option>
            <option value="Pest attack">Pest attack</option>
          </select>
        </div>
      </div>

      {/* Claims Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Claim ID</th>
              <th className="py-3 px-4">Farmer & Village</th>
              <th className="py-3 px-4">Crop</th>
              <th className="py-3 px-4">Peril & Date</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Estimated Payout</th>
              <th className="py-3 px-4">Adjudication Status</th>
              <th className="py-3 px-4 text-right">Review Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-medium">
            {filteredClaims.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No insurance claims match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredClaims.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectClaim(c)}
                  className="hover:bg-slate-800/60 transition cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                    {c.claim_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white group-hover:text-cyan-300 transition">
                      {c.farmer.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {c.farmer.village}, {c.farmer.district}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-200">
                    {c.crop.crop_name}
                    <span className="text-[10px] text-slate-500 block">({c.land.area_acres} ac)</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-white font-semibold">{c.disaster.disaster_type}</span>
                    <span className="text-[10px] text-slate-500 block">{c.disaster.disaster_date}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={getSeverityBadge(c.estimated_damage_severity)}>
                      {c.estimated_damage_severity} ({c.disaster.damage_percentage_reported}%)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="text-emerald-400 font-bold">{c.evidence_confidence_score}%</span>
                    <span className="text-[10px] text-slate-500 block">{c.indicative_likelihood_score}% likelihood</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    ₹{c.estimated_payout.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(c.current_status)}`}>
                      {c.current_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="px-3 py-1.5 bg-slate-800 group-hover:bg-cyan-600 text-slate-300 group-hover:text-white rounded-lg transition font-semibold text-xs flex items-center gap-1 ml-auto">
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
