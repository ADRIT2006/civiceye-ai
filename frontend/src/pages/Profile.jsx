import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  HardHat, 
  Award, 
  CheckCircle2, 
  Key,
  Building
} from 'lucide-react';

export const Profile = () => {
  const { user, currentRole } = useAuth();

  const getRolePermissions = () => {
    if (currentRole === 'admin') {
      return [
        'Full administrative override authority',
        'Direct maintenance crew worker assignment',
        'AI keypoint verification review and approve/reject',
        'Statutory 48h SLA escalation manual dispatch',
        'Full system audit log access',
        'Emergency response coordination'
      ];
    }
    if (currentRole === 'worker') {
      return [
        'View assigned field work orders',
        'Start physical on-site work and log start time',
        'Append material and progress work notes',
        'Submit before/after repair evidence photographs',
        'Open navigation map for job locations',
        'Cannot unilaterally close own work tickets (SOP)'
      ];
    }
    return [
      'Submit new civic grievance reports with geotagged photo',
      'Track real-time status of personal complaints',
      'Receive duplicate detection screening and merge reports',
      'Vote in community repair verifications',
      'Upvote local infrastructure issues in ward',
      'Access emergency statutory helpline directory'
    ];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn pb-24">
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-100 pb-6 text-center sm:text-left">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-24 h-24 rounded-2xl object-cover border-4 border-blue-100 shadow-md"
          />
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-slate-900">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider font-mono">
                {user.role}
              </span>
            </div>
            <p className="text-sm font-semibold text-blue-600">{user.title}</p>
            <p className="text-xs text-slate-500">{user.department || user.ward}</p>
          </div>
        </div>

        {/* Contact & Jurisdiction Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              Official Email
            </div>
            <div className="text-xs font-semibold text-slate-800 font-mono">{user.email}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              Assigned Ward Jurisdiction
            </div>
            <div className="text-xs font-semibold text-slate-800">{user.ward || 'Citywide'}</div>
          </div>
        </div>

        {/* RBAC Permissions Box */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-purple-600" />
            Active Role Access & Permissions (RBAC Enforcement)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {getRolePermissions().map((perm, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{perm}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
