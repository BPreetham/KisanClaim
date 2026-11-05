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
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-600/25 text-xl font-bold">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">
                Kisan<span className="text-emerald-400">Claim</span>
              </span>
              <span className="hidden md:inline-block text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
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
            <div className="flex items-center bg-emerald-950/70 border border-emerald-500/40 rounded-2xl px-3 py-1.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm">🌾</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{userName}</span>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded font-semibold">
                      {userIdentifier}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-400/80 hidden lg:block">
                    {language === 'kn' ? 'ರೈತರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' : 'Farmer Dashboard (Active)'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center bg-blue-950/70 border border-blue-500/40 rounded-2xl px-3 py-1.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm">🏢</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{userName}</span>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-1.5 py-0.2 rounded font-semibold">
                      {userIdentifier}
                    </span>
                  </div>
                  <div className="text-[10px] text-cyan-400/80 hidden lg:block">
                    {language === 'kn' ? 'ವಿಮಾ ಕಂಪನಿ ಕನ್ಸೋಲ್' : 'Insurance Console (Active)'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Judge Quick Portal Switcher */}
          <button
            onClick={() => onSwitchRole(role === 'farmer' ? 'insurance' : 'farmer')}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
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
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Switch Language (English / ಕನ್ನಡ)"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 relative transition cursor-pointer"
              title="Real-Time Claim Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
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
