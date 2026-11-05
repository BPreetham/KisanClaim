import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthPage } from './components/auth/AuthPage';
import { FarmerDashboard } from './components/farmer/FarmerDashboard';
import { InsuranceDashboard } from './components/insurance/InsuranceDashboard';
import { ReportViewerModal } from './components/common/ReportViewerModal';
import {
  fetchClaims,
  fetchStats,
  fetchNotifications,
  createClaim,
  reRunAIAgents,
  submitReviewAction,
  subscribeToNotifications
} from './services/api';
import { Claim, NotificationItem, StatsKPI, UserSession } from './types';
import { Sparkles } from 'lucide-react';

export function App() {
  const [session, setSession] = useState<UserSession | null>(() => {
    // 1. Direct query param deep links for multi-laptop demos
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (roleParam === 'farmer') {
        return {
          role: 'farmer',
          token: 'kisan-token-9876543210',
          user: {
            id: 'farmer-ksn-1025',
            name: 'Ravi Kumar',
            mobile: '9876543210',
            state: 'Karnataka',
            district: 'Bengaluru Rural',
            village: 'Devanahalli'
          }
        };
      }
      if (roleParam === 'fraud' || roleParam === 'fakefarmer') {
        return {
          role: 'farmer',
          token: 'kisan-token-9900112233',
          user: {
            id: 'farmer-fake-9999',
            name: 'Vikram Singh (Fraud Demo)',
            mobile: '9900112233',
            state: 'Karnataka',
            district: 'Bengaluru Rural',
            village: 'Hosakote'
          }
        };
      }
      if (roleParam === 'insurance') {
        return {
          role: 'insurance',
          token: 'ins-token-AGRI-INS-409',
          user: {
            company_id: 'AGRI-INS-409',
            reviewer_id: 'REV-EMP-409',
            company_name: 'Agricultural Insurance Co. of India (PMFBY Hub)',
            name: 'Ananya Sharma',
            title: 'Senior Agronomist & Lead Adjudicator',
            department: 'Crop Intelligence & Satellite Claims Verification Unit'
          }
        };
      }
    }

    const saved = localStorage.getItem('kisanclaim_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState<StatsKPI | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [reportClaim, setReportClaim] = useState<Claim | null>(null);
  const [toastAlert, setToastAlert] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load telemetry data from backend
  const loadData = async () => {
    try {
      const [claimsData, statsData, notifsData] = await Promise.all([
        fetchClaims(),
        fetchStats(),
        fetchNotifications()
      ]);
      setClaims(claimsData);
      setStats(statsData);
      setNotifications(notifsData);
    } catch (err) {
      console.error('Failed to load claims telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // WebSocket subscription for live cross-dashboard updates
    const unsubscribe = subscribeToNotifications((msg: any) => {
      console.log('Real-Time WebSocket Message received:', msg);
      if (msg.event === 'claim_reviewed') {
        setToastAlert(`🔔 Claim ${msg.claim_number} updated: ${msg.new_status}!`);
        loadData();
      } else if (msg.event === 'claim_created') {
        setToastAlert(`🌱 New claim registered: ${msg.claim_number} (${msg.farmer_name})`);
        loadData();
      }
    });

    return () => unsubscribe();
  }, []);

  // Clear toast after 5s
  useEffect(() => {
    if (toastAlert) {
      const t = setTimeout(() => setToastAlert(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toastAlert]);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    localStorage.setItem('kisanclaim_session', JSON.stringify(newSession));
    setToastAlert(`Welcome, ${newSession.user.name}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('kisanclaim_session');
    setSession(null);
    setToastAlert('Signed out successfully.');
  };

  const handleSwitchRole = (newRole: 'farmer' | 'insurance') => {
    const switchedSession: UserSession = newRole === 'farmer'
      ? {
          role: 'farmer',
          token: 'demo-farmer-token',
          user: {
            id: 'farmer-ravi',
            name: 'Ravi Kumar',
            mobile: '9876543210',
            state: 'Karnataka',
            district: 'Bengaluru Rural',
            village: 'Devanahalli'
          }
        }
      : {
          role: 'insurance',
          token: 'demo-ins-token',
          user: {
            id: 'ins-ananya',
            name: 'Ananya Sharma',
            company_id: 'AGRI-INS-409',
            reviewer_id: 'REV-EMP-409',
            company_name: 'Agriculture Insurance Co. of India (PMFBY)',
            title: 'Senior Agronomist & Adjudicator'
          }
        };

    setSession(switchedSession);
    localStorage.setItem('kisanclaim_session', JSON.stringify(switchedSession));
    setToastAlert(`Switched to ${newRole === 'farmer' ? 'Farmer Dashboard' : 'Insurance Console'}`);
  };

  const handleNewClaimSubmit = async (payload: any) => {
    try {
      const newClaim = await createClaim(payload);
      setClaims(prev => [newClaim, ...prev]);
      setToastAlert(`Claim ${newClaim.claim_number} submitted and verified!`);
      const s = await fetchStats();
      setStats(s);
      return newClaim;
    } catch (err) {
      console.error('Claim submission failed', err);
      throw err;
    }
  };

  const handleRunAgents = async (claimId: string) => {
    try {
      await reRunAIAgents(claimId);
      const updated = await fetchClaims();
      setClaims(updated);
      setToastAlert('AI Multi-Agent Swarm analysis re-executed!');
    } catch (err) {
      console.error('Failed to re-run AI agents', err);
    }
  };

  const handleSubmitReviewAction = async (claimId: string, payload: any) => {
    try {
      const res = await submitReviewAction(claimId, payload);
      setToastAlert(`Decision committed: ${res.claim.current_status}`);
      const updated = await fetchClaims();
      setClaims(updated);
      const s = await fetchStats();
      setStats(s);
    } catch (err) {
      console.error('Review action failed', err);
    }
  };

  // If unauthenticated, render dedicated Login Page with Farmer (Mobile) & Insurance (Company ID) tabs
  if (!session) {
    return (
      <AuthPage
        onLoginSuccess={handleLoginSuccess}
        language={language}
        onLanguageChange={setLanguage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        userSession={session}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        language={language}
        onLanguageChange={setLanguage}
        notifications={notifications}
      />

      {/* Floating Live WebSocket Toast */}
      {toastAlert && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/60 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Real-Time Push Alert
            </div>
            <div className="text-sm font-semibold">{toastAlert}</div>
          </div>
        </div>
      )}

      {/* Main Content Area - Render Separate Dashboard based on role */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400 font-mono">
              Connecting to KisanClaim Geospatial Telemetry...
            </p>
          </div>
        ) : session.role === 'farmer' ? (
          <FarmerDashboard
            claims={claims}
            notifications={notifications}
            language={language}
            currentUser={session.user}
            onNewClaimSubmit={handleNewClaimSubmit}
            onOpenReport={setReportClaim}
          />
        ) : (
          <InsuranceDashboard
            claims={claims}
            stats={stats}
            onOpenReport={setReportClaim}
            onRunAgents={handleRunAgents}
            onSubmitReviewAction={handleSubmitReviewAction}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">KisanClaim</span>
            <span>•</span>
            <span>AI-Powered Crop Damage Evidence & Insurance Verification</span>
          </div>
          <div className="font-mono text-[11px] text-slate-600">
            ISRO Bhuvan • Sentinel-2 MSI • Open-Meteo • DIGIPIN
          </div>
        </div>
      </footer>

      {/* Report Viewer Modal */}
      <ReportViewerModal
        claim={reportClaim}
        isOpen={Boolean(reportClaim)}
        onClose={() => setReportClaim(null)}
      />
    </div>
  );
}

export default App;
