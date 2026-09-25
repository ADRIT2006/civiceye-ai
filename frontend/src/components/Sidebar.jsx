import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Map, 
  FileText, 
  Flame, 
  Users, 
  BarChart3, 
  ShieldCheck,
  Eye,
  X,
  Briefcase,
  AlertOctagon,
  PhoneCall,
  CheckCircle2,
  HardHat,
  Bell,
  UserCheck,
  Building2,
  Clock,
  History,
  FileCheck2,
  Sparkles,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { currentRole, openEmergencyModal, user } = useAuth();
  const { t } = useTranslation();

  // Role-specific navigation definitions strictly fulfilling:
  // Citizen → only report/map + AI Copilot (+ credits & personal reports)
  // Worker → only assigned issues + AI Copilot
  // Admin → Command Center, AI Report Generator, Ward Map, Workers, etc.
  const citizenItems = [
    { name: t('navReportIssue') || 'Report an Issue', path: '/report', icon: PlusCircle },
    { name: t('navCivicMap') || 'Civic Map', path: '/map', icon: Map },
    { name: t('navAiCopilot') || 'AI Copilot', path: '/citizen/copilot', icon: Sparkles },
    { name: t('navMyCredits') || 'Civic Credit Points', path: '/citizen/credits', icon: Award },
    { name: t('navMyReports') || 'My Reports', path: '/citizen/my-reports', icon: FileText },
  ];

  const workerItems = [
    { name: t('navAssignedIssues') || 'Assigned Issues', path: '/worker/dashboard', icon: HardHat },
    { name: 'Worker AI Copilot', path: '/worker/copilot', icon: Sparkles },
  ];

  const adminItems = [
    { name: t('navCommandCenter') || 'Command Center', path: '/admin/dashboard', icon: ShieldCheck },
    { name: t('navAiReportGenerator') || 'AI Report Generator', path: '/admin/reports', icon: FileCheck2 },
    { name: t('navWardMap') || 'Ward Map', path: '/admin/ward-map', icon: Map },
    { name: t('navWorkers') || 'Workers & Assignment', path: '/admin/workers', icon: Briefcase },
    { name: t('navAllComplaints') || 'All Issues', path: '/admin/complaints', icon: FileText },
    { name: t('navEscalations') || 'Escalations', path: '/escalations', icon: Flame },
    { name: t('navAnalytics') || 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  let menuItems = citizenItems;
  let workspaceTitle = 'Citizen Workspace';
  let roleBadge = 'Resident';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  if (currentRole === 'worker') {
    menuItems = workerItems;
    workspaceTitle = 'Maintenance Crew Workspace';
    roleBadge = 'Field Ops';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (currentRole === 'admin') {
    menuItems = adminItems;
    workspaceTitle = 'Command Center Workspace';
    roleBadge = 'Authority';
    badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-slate-900/30 z-30 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200 z-40 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <NavLink to={user.dashboardPath} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                <span>CivicEye</span>
                <span className="text-blue-600 font-mono text-[10px] px-1 py-0.2 rounded bg-blue-50 border border-blue-200 font-bold">AI</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Civic Accountability
              </div>
            </div>
          </NavLink>

          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Role Header Badge */}
        <div className="px-4 pt-3 pb-1">
          <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="text-[11px] font-bold text-slate-700 truncate">
              {workspaceTitle}
            </div>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${badgeColor}`}>
              {roleBadge}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isEmergencyItem = item.isEmergency;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isEmergencyItem
                      ? 'text-red-700 hover:bg-red-50 font-bold'
                      : isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 ${
                      isEmergencyItem 
                        ? 'text-red-600 animate-pulse' 
                        : isActive 
                        ? 'text-blue-600' 
                        : 'text-slate-400'
                    }`} />
                    <span className="truncate">{item.name}</span>
                    {isEmergencyItem && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-red-600 animate-ping" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Emergency Quick Trigger in Sidebar */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={openEmergencyModal}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98"
          >
            <PhoneCall className="w-4 h-4 text-red-600" />
            <span>🚨 EMERGENCY HELP</span>
          </button>
        </div>

        {/* Municipal Transparency Seal Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px]">CivicEye Public Grid</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Connected to 48h resolution charters & OpenCV anti-fraud verification.
          </p>
        </div>
      </aside>
    </>
  );
};
