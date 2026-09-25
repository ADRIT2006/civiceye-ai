import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  MapPin, 
  Menu, 
  ChevronDown, 
  UserCheck, 
  HardHat, 
  ShieldCheck, 
  Check, 
  PhoneCall,
  AlertOctagon,
  Sparkles,
  Info,
  Globe,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { api } from '../services/api';

export const Header = ({ onOpenSidebar }) => {
  const navigate = useNavigate();
  const { language, changeLanguage, t } = useTranslation();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const { 
    currentRole, 
    user, 
    switchRole, 
    openEmergencyModal, 
    notifications, 
    unreadCount, 
    markNotificationRead 
  } = useAuth();
  
  const [selectedWard, setSelectedWard] = useState('All Wards (Citywide)');
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [isRetrying, setIsRetrying] = useState(false);

  const checkBackendHealth = async () => {
    setIsRetrying(true);
    try {
      const res = await api.getHealth();
      if (res && (res.status === 'ok' || res.status === 'healthy')) {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    // Periodic gentle health poll every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const wards = [
    'All Wards (Citywide)',
    'Ward 12 - Indiranagar',
    'Ward 04 - Koramangala',
    'Ward 08 - Jayanagar',
    'Ward 01 - Majestic',
    'Ward 06 - Basavanagudi',
    'Ward 10 - MG Road'
  ];

  const getViewingAsLabel = () => {
    if (currentRole === 'worker') return 'Viewing as Municipal Worker';
    if (currentRole === 'admin') return 'Viewing as Admin';
    return 'Viewing as Citizen';
  };

  const handleRoleSelect = (newRole) => {
    switchRole(newRole, navigate);
    setRoleMenuOpen(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      {/* Left: Mobile Toggle & Ward Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Location / Ward Selector */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer pr-2"
          >
            {wards.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        {/* Backend Connection Status Indicator */}
        <div className="hidden md:flex items-center">
          {backendStatus === 'online' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>● System Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>● Backend Offline</span>
              <button 
                onClick={checkBackendHealth} 
                disabled={isRetrying}
                className="ml-1 text-[10px] px-2 py-0.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                title="Retry connecting to CivicEye backend"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>Retrying...</span>
                  </>
                ) : (
                  <span>RETRY CONNECTION</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Universal Civic Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search tickets (e.g. CIV-2026-0001, pothole, street)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition shadow-inner"
          />
        </div>
      </div>

      {/* Right: Language Selector, Emergency Button, Notifications, Role Switcher, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Language Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition shadow-2xs"
            title="Select Language / ভাষা নির্বাচন / भाषा चुनें"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline font-mono uppercase text-[11px]">{language === 'bn' ? 'বাংলা' : language === 'hi' ? 'हिन्दी' : 'EN'}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {langMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-44 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50 animate-fadeIn text-xs"
              onMouseLeave={() => setLangMenuOpen(false)}
            >
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                Language / ভাষা / भाषा
              </div>
              <button
                onClick={() => { changeLanguage('en'); setLangMenuOpen(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-semibold transition ${
                  language === 'en' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>English</span>
                {language === 'en' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
              <button
                onClick={() => { changeLanguage('bn'); setLangMenuOpen(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-semibold transition ${
                  language === 'bn' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>বাংলা (Bengali)</span>
                {language === 'bn' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
              <button
                onClick={() => { changeLanguage('hi'); setLangMenuOpen(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between font-semibold transition ${
                  language === 'hi' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>हिन्दी (Hindi)</span>
                {language === 'hi' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            </div>
          )}
        </div>

        {/* Prominent Emergency Button */}
        <button
          onClick={openEmergencyModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-sm shadow-red-500/20 transition animate-pulse"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">EMERGENCY</span>
          <span>112</span>
        </button>

        {/* Role-Specific Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center absolute -top-0.5 -right-0.5 border border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div 
              className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50 animate-fadeIn text-xs"
              onMouseLeave={() => setNotificationsOpen(false)}
            >
              <div className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-600" />
                  {currentRole.toUpperCase()} Alerts & Updates
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {notifications.length} received
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer ${
                        notif.is_read 
                          ? 'bg-slate-50 border-slate-100 text-slate-600' 
                          : 'bg-blue-50/70 border-blue-100 text-blue-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          {!notif.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                          {notif.title}
                        </div>
                        {notif.ticket_id && (
                          <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {notif.ticket_id}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] leading-relaxed text-slate-600">
                        {notif.message}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-slate-400 text-xs">
                    No new alerts for this workspace.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active Role Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs text-blue-900 transition font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold">{getViewingAsLabel()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
          </button>

          {roleMenuOpen && (
            <div 
              className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 animate-fadeIn"
              onMouseLeave={() => setRoleMenuOpen(false)}
            >
              <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  ACTIVE ROLE &amp; WORKSPACE (RBAC)
                </div>
                <div className="text-[11px] text-slate-500">
                  Switch workspace role to view authorized portal functions.
                </div>
              </div>
              
              <button
                onClick={() => handleRoleSelect('citizen')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition ${
                  currentRole === 'citizen' ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-bold">Citizen Portal</div>
                    <div className="text-[10px] text-slate-500">Priya Sharma • Resident Workspace</div>
                  </div>
                </div>
                {currentRole === 'citizen' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>

              <button
                onClick={() => handleRoleSelect('worker')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition ${
                  currentRole === 'worker' ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <HardHat className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="font-bold">Field Crew Ops</div>
                    <div className="text-[10px] text-slate-500">Rajesh Kumar • Maintenance Lead</div>
                  </div>
                </div>
                {currentRole === 'worker' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>

              <button
                onClick={() => handleRoleSelect('admin')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition ${
                  currentRole === 'admin' ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="font-bold">Command Center (Admin)</div>
                    <div className="text-[10px] text-slate-500">Dr. Arvind Verma • Municipal Authority</div>
                  </div>
                </div>
                {currentRole === 'admin' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full border border-blue-300 object-cover shadow-sm"
          />
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">{user.name}</div>
            <div className="text-[10px] text-slate-500 leading-none">{user.department || user.ward}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
