import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export const PriorityBadge = ({ level = 'Medium', score }) => {
  const configs = {
    'Critical': {
      border: 'border-rose-200 bg-rose-50 text-rose-700',
      icon: Zap,
      accent: 'text-rose-600'
    },
    'High': {
      border: 'border-orange-200 bg-orange-50 text-orange-700',
      icon: AlertOctagon,
      accent: 'text-orange-600'
    },
    'Medium': {
      border: 'border-amber-200 bg-amber-50 text-amber-700',
      icon: AlertTriangle,
      accent: 'text-amber-600'
    },
    'Low': {
      border: 'border-slate-200 bg-slate-100 text-slate-700',
      icon: ShieldCheck,
      accent: 'text-slate-500'
    }
  };

  const config = configs[level] || configs['Medium'];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${config.border}`}>
      <Icon className={`w-3.5 h-3.5 ${config.accent}`} />
      <span>{level}</span>
      {score !== undefined && (
        <span className="ml-1 px-1.5 py-0.2 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-700">
          {score}
        </span>
      )}
    </span>
  );
};
