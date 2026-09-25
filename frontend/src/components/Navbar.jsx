import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Eye, 
  Map, 
  PlusCircle, 
  Flame, 
  BarChart3, 
  ShieldCheck, 
  HardHat, 
  UserCheck, 
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const location = useLocation();
  const { currentRole, user, switchRole } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Command Center', path: '/', icon: LayoutDashboard },
    { name: 'Report Issue', path: '/report', icon: PlusCircle, highlight: true },
    { name: 'Civic Map', path: '/map', icon: Map },
    { name: 'Escalations', path: '/escalations', icon: Flame },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Worker Portal', path: '/worker', icon: HardHat },
    { name: 'Admin Hub', path: '/admin', icon: ShieldCheck },
  ];

  return (
    <nav className="bg-slate-900/90 border-b border-slate-800 sticky top-[41px] z-30 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Eye className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  <span>CivicEye</span>
                  <span className="text-teal-400 font-mono text-xs px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/30">AI</span>
                </div>
                <div className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                  Public Accountability Platform
                </div>
              </div>
            </Link>

            {/* Nav Items */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                        : link.highlight
                        ? 'bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-md shadow-teal-600/30 ml-1'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : ''}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Section: Role Switcher & User Pill */}
          <div className="flex items-center gap-3">
            {/* Quick Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400">Role:</span>
                <span className="font-semibold text-white capitalize">{currentRole}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-fadeIn"
                  onMouseLeave={() => setRoleMenuOpen(false)}
                >
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 tracking-wider">
                    Switch Demo Persona
                  </div>
                  
                  <button
                    onClick={() => { switchRole('citizen'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs transition ${
                      currentRole === 'citizen' ? 'bg-teal-500/20 text-teal-300 font-semibold' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-medium">Citizen (Priya Sharma)</div>
                      <div className="text-[10px] text-slate-400">Resident & Level 3 Verifier</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { switchRole('worker'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs transition ${
                      currentRole === 'worker' ? 'bg-teal-500/20 text-teal-300 font-semibold' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <HardHat className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-medium">Municipal Worker (Rajesh K.)</div>
                      <div className="text-[10px] text-slate-400">Road Maintenance Crew Lead</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { switchRole('admin'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs transition ${
                      currentRole === 'admin' ? 'bg-teal-500/20 text-teal-300 font-semibold' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-rose-400" />
                    <div>
                      <div className="font-medium">Admin (Dr. Arvind Verma)</div>
                      <div className="text-[10px] text-slate-400">Municipal Commissioner (IAS)</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-teal-500/40 object-cover"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-white leading-tight">{user.name}</div>
                <div className="text-[10px] text-teal-400 font-mono leading-none">{user.department || user.ward}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
