import React, { useState } from 'react';
import { ShieldCheck, Bell, Globe, Sparkles, CheckCircle2, AlertTriangle, FileText, LogOut, ArrowRightLeft, User, Building2 } from 'lucide-react';
import { NotificationItem, UserSession } from '../types';

interface Props {
  userSession: UserSession | null;
  onLogout: () => void;
  onSwitchRole: (newRole: 'farmer' | 'insurance') => void;
  language: 'en' | 'kn';
  onLanguageChange: (lang: 'en' | 'kn') => void;
  notifications: NotificationItem[];
}

export const Navbar: React.FC<Props> = ({
  userSession,
  onLogout,
  onSwitchRole,
  language,
  onLanguageChange,
  notifications
}) => {
  const [showNotifs, setShowNotifs] = useState<boolean>(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const role = userSession?.role || 'farmer';
  const userName = userSession?.user.name || (role === 'farmer' ? 'Ravi Kumar' : 'Ananya Sharma');
  const userIdentifier = role === 'farmer'
    ? (userSession?.user.mobile ? `+91 ${userSession.user.mobile}` : '+91 9876543210')
    : (userSession?.user.company_id || 'AGRI-INS-409');

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 text-white shadow-lg shadow-emerald-500/30 text-xl font-bold ring-2 ring-emerald-400/40 transform hover:scale-105 transition-transform">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-200 bg-clip-text text-transparent">
                Kisan<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Claim</span>
              </span>
              <span className="hidden md:inline-block text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                AI Geospatial Intelligence
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Evidence Twin & Insurance Claim Verification Platform
            </p>
          </div>
        </div>

        {/* Active Portal Badge & Judge Fast-Switcher */}
        <div className="flex items-center gap-2">
          {role === 'farmer' ? (
            <div className="flex items-center bg-gradient-to-r from-emerald-950/80 to-teal-950/60 border border-emerald-500/50 rounded-2xl px-3.5 py-1.5 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <div className="flex items-center gap-2">
                <span className="text-base">🌾</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{userName}</span>
                    <span className="text-[10px] font-mono text-emerald-200 bg-emerald-500/30 px-2 py-0.5 rounded-md font-semibold border border-emerald-400/40">
                      {userIdentifier}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-300 font-medium hidden lg:block">
                    {language === 'kn' ? 'ರೈತರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' : 'Farmer Dashboard (Active)'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center bg-gradient-to-r from-indigo-950/80 to-cyan-950/60 border border-cyan-500/50 rounded-2xl px-3.5 py-1.5 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <div className="flex items-center gap-2">
                <span className="text-base">🏢</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{userName}</span>
                    <span className="text-[10px] font-mono text-cyan-200 bg-cyan-500/30 px-2 py-0.5 rounded-md font-semibold border border-cyan-400/40">
                      {userIdentifier}
                    </span>
                  </div>
                  <div className="text-[10px] text-cyan-300 font-medium hidden lg:block">
                    {language === 'kn' ? 'ವಿಮಾ ಕಂಪನಿ ಕನ್ಸೋಲ್' : 'Insurance Console (Active)'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Judge Quick Portal Switcher */}
          <button
            onClick={() => onSwitchRole(role === 'farmer' ? 'insurance' : 'farmer')}
            className="px-3 py-1.5 bg-slate-900/90 hover:bg-gradient-to-r hover:from-emerald-950/70 hover:to-teal-950/70 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 hover:border-emerald-500/60 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-emerald-500/20"
            title={`Switch to ${role === 'farmer' ? 'Insurance Console' : 'Farmer Dashboard'}`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {role === 'farmer' ? 'Switch to Insurer' : 'Switch to Farmer'}
            </span>
          </button>
        </div>

        {/* Right Controls: Notifications, Language & Sign Out */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={() => onLanguageChange(language === 'en' ? 'kn' : 'en')}
            className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-850 text-cyan-300 hover:text-cyan-200 rounded-xl border border-cyan-500/30 hover:border-cyan-400/60 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Switch Language (English / ಕನ್ನಡ)"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 bg-slate-900/90 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 hover:border-amber-500/50 transition cursor-pointer relative shadow-sm"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-[9px] font-bold text-white shadow-md shadow-rose-500/50 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Live Push Notifications</span>
                  <span className="text-[10px] text-emerald-400 font-mono">WebSocket Active</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No notifications received yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 hover:bg-slate-850/80 transition text-xs">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{n.timestamp.slice(11, 16)}</span>
                        </div>
                        <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={onLogout}
            className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white rounded-xl border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
