import React, { useState } from 'react';
import { ShieldCheck, Phone, Building2, KeyRound, ArrowRight, UserPlus, HelpCircle, Sparkles, Globe, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { UserSession } from '../../types';
import { loginFarmer, registerFarmer, loginInsurance } from '../../services/api';

interface Props {
  onLoginSuccess: (session: UserSession) => void;
  language: 'en' | 'kn';
  onLanguageChange: (lang: 'en' | 'kn') => void;
}

export const AuthPage: React.FC<Props> = ({
  onLoginSuccess,
  language,
  onLanguageChange
}) => {
  const [activeTab, setActiveTab] = useState<'farmer' | 'insurance'>('farmer');

  // Farmer Form State
  const [farmerMobile, setFarmerMobile] = useState<string>('9876543210');
  const [farmerOtp, setFarmerOtp] = useState<string>('1234');
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  // Register Form State
  const [regName, setRegName] = useState<string>('');
  const [regMobile, setRegMobile] = useState<string>('');
  const [regState, setRegState] = useState<string>('Karnataka');
  const [regDistrict, setRegDistrict] = useState<string>('Bengaluru Rural');
  const [regVillage, setRegVillage] = useState<string>('Devanahalli');

  // Insurance Form State
  const [companyId, setCompanyId] = useState<string>('AGRI-INS-409');
  const [insurancePin, setInsurancePin] = useState<string>('claims2026');
  const [orgUnit, setOrgUnit] = useState<string>('Agriculture Insurance Co. of India (PMFBY Division)');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFarmerLogin = async (e?: React.FormEvent, customMobile?: string) => {
    if (e) e.preventDefault();
    const mob = customMobile || farmerMobile;
    if (!mob || mob.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const session = await loginFarmer(mob, farmerOtp);
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMsg(err.message || 'Farmer login failed. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleFarmerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regMobile.trim()) {
      setErrorMsg('Full Name and Mobile are mandatory.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const session = await registerFarmer({
        name: regName,
        mobile: regMobile,
        state: regState,
        district: regDistrict,
        village: regVillage
      });
      setShowRegisterModal(false);
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleInsuranceLogin = async (e?: React.FormEvent, customCompanyId?: string) => {
    if (e) e.preventDefault();
    const cid = customCompanyId || companyId;
    if (!cid.trim()) {
      setErrorMsg('Please enter your Company / Reviewer ID.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const session = await loginInsurance(cid, insurancePin);
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMsg(err.message || 'Insurance login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="p-4 sm:p-6 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-500/20 text-2xl font-bold">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white tracking-tight">
                Kisan<span className="text-emerald-400">Claim</span>
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                AI Satellite Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-400">National Crop Damage Evidence & Insurance Verification</p>
          </div>
        </div>

        {/* Language Switcher */}
        <button
          onClick={() => onLanguageChange(language === 'en' ? 'kn' : 'en')}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
        </button>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Dual Persona Switcher Tabs */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 mb-6 shadow-xl backdrop-blur-md">
            <button
              onClick={() => {
                setActiveTab('farmer');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'farmer'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-base">🌾</span>
              <span>{language === 'kn' ? 'ರೈತರ ಲಾಗಿನ್' : 'Farmer Login'}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('insurance');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'insurance'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-base">🏢</span>
              <span>{language === 'kn' ? 'ವಿಮಾ ಕಂಪನಿ' : 'Insurance Company'}</span>
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ================= FARMER LOGIN CARD ================= */}
          {activeTab === 'farmer' ? (
            <div className="bg-slate-900/90 rounded-3xl border border-emerald-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {language === 'kn' ? 'ರೈತರ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಲಾಗಿನ್' : 'Farmer Mobile Sign-In'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {language === 'kn' ? 'ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ ಪ್ರವೇಶಿಸಿ' : 'Enter your registered mobile number'}
                  </p>
                </div>
              </div>

              <form onSubmit={e => handleFarmerLogin(e)} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    {language === 'kn' ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ' : 'Mobile Number'}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs text-slate-400 font-bold border-r border-slate-700 pr-2">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={farmerMobile}
                      onChange={e => setFarmerMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-16 pr-4 py-2.5 text-sm text-white font-mono outline-none focus:border-emerald-500 tracking-wider"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      {language === 'kn' ? 'OTP / ಪಾಸ್‌ವರ್ಡ್' : 'OTP / Access PIN'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      {language === 'kn' ? 'ಸಹಾಯ ಬೇಕೇ?' : 'Forgot PIN?'}
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={farmerOtp}
                      onChange={e => setFarmerOtp(e.target.value)}
                      placeholder="1234"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'Verifying...' : language === 'kn' ? 'ಮುಂದುವರಿಯಿರಿ' : 'Log In to Farmer Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Demo Quick Logins for Judges */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2 text-center">
                  ⚡ 1-Click Demo Logins for Hackathon Judges
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFarmerMobile('9876543210');
                      handleFarmerLogin(undefined, '9876543210');
                    }}
                    className="w-full p-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <strong className="text-white block">🌱 Ravi Kumar (Real Flood-Affected Farmer)</strong>
                      <span className="text-[11px] text-emerald-400">Devanahalli • Verified Claim KSN-1025 (NDVI -62%, 142mm rain)</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded font-bold">
                      VERIFIED REAL
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFarmerMobile('9900112233');
                      handleFarmerLogin(undefined, '9900112233');
                    }}
                    className="w-full p-2 bg-red-950/60 hover:bg-red-900/60 border border-red-500/50 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer animate-pulse"
                  >
                    <div>
                      <strong className="text-red-200 block">🚨 Vikram Singh (Fraud Demo — Fake Images)</strong>
                      <span className="text-[11px] text-red-300">Hosakote • Spoofed GPS (14km), Dry Satellite (0.76 NDVI)</span>
                    </div>
                    <span className="text-[10px] font-mono text-red-300 bg-red-500/30 px-2 py-0.5 rounded font-bold border border-red-500/50">
                      FLAGGED FAKE
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFarmerMobile('9845123456');
                      handleFarmerLogin(undefined, '9845123456');
                    }}
                    className="w-full p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <strong className="text-slate-200 block">Suresh Patil (Belagavi — Sugarcane)</strong>
                      <span className="text-[11px] text-slate-400">Sugarcane Flood Claim KSN-1088 (Approved)</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">9845123456</span>
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(true)}
                    className="text-xs text-emerald-400 font-semibold hover:underline flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{language === 'kn' ? 'ಹೊಸ ರೈತರ ನೋಂದಣಿ' : 'New Farmer? Register Parcel & Profile'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================= INSURANCE COMPANY LOGIN CARD ================= */
            <div className="bg-slate-900/90 rounded-3xl border border-blue-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-blue-500/20 text-cyan-400 rounded-2xl border border-blue-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Insurance Adjudicator Sign-In
                  </h2>
                  <p className="text-xs text-slate-400">
                    Satellite Evidence & Claim Review Console
                  </p>
                </div>
              </div>

              <form onSubmit={e => handleInsuranceLogin(e)} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Insurance Company / Reviewer ID
                  </label>
                  <div className="relative flex items-center">
                    <Building2 className="absolute left-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={companyId}
                      onChange={e => setCompanyId(e.target.value)}
                      placeholder="AGRI-INS-409"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono uppercase outline-none focus:border-cyan-500 tracking-wider"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Organization Unit
                  </label>
                  <select
                    value={orgUnit}
                    onChange={e => setOrgUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-cyan-500"
                  >
                    <option value="Agriculture Insurance Co. of India (PMFBY Division)">Agriculture Insurance Co. of India (AIC - PMFBY Division)</option>
                    <option value="State Crop Loss Review & Risk Desk">State Crop Loss Review & Risk Desk</option>
                    <option value="National Geospatial Adjudication Hub">National Geospatial Adjudication Hub</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Security Access Code
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={insurancePin}
                      onChange={e => setInsurancePin(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'Authenticating...' : 'Access Reviewer Console'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Demo Quick Login for Judges */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2 text-center">
                  ⚡ 1-Click Demo Reviewer Access for Judges
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCompanyId('AGRI-INS-409');
                    handleInsuranceLogin(undefined, 'AGRI-INS-409');
                  }}
                  className="w-full p-2.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <strong className="text-white block">🏢 Lead Adjudicator: Ananya Sharma</strong>
                    <span className="text-[11px] text-cyan-300">Senior Agronomist • AIC Claims Desk</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-200 bg-cyan-500/20 px-2 py-0.5 rounded">
                    AGRI-INS-409
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ================= REGISTER MODAL ================= */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Register New Farmer Profile</h3>
            <p className="text-xs text-slate-400 mb-4">Create your farmer identity for PMFBY satellite verification</p>

            <form onSubmit={handleFarmerRegister} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={regMobile}
                  onChange={e => setRegMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876500000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">District</label>
                  <input
                    type="text"
                    value={regDistrict}
                    onChange={e => setRegDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Village</label>
                  <input
                    type="text"
                    value={regVillage}
                    onChange={e => setRegVillage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  {loading ? 'Creating...' : 'Register & Enter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= FORGOT PIN / HELP MODAL ================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Farmer PIN Assistance</h3>
            <p className="text-xs text-slate-400 mb-4">
              For this hackathon prototype, any default mobile uses test PIN <strong className="text-emerald-400 font-mono">1234</strong>.
            </p>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
            >
              Got it, Proceed to Login
            </button>
          </div>
        </div>
      )}

      {/* Bottom Footer */}
      <footer className="p-4 text-center text-xs text-slate-600 border-t border-slate-900">
        KisanClaim AI Geospatial Platform © 2026 • Powered by Sentinel-2 MSI, Open-Meteo & DIGIPIN
      </footer>
    </div>
  );
};
