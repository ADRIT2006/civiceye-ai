import React from 'react';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Users, 
  Wrench, 
  ShieldAlert,
  RotateCcw,
  Search
} from 'lucide-react';
import { formatStatus } from '../utils/statusUtils';

export const StatusBadge = ({ status, size = 'md' }) => {
  const formatted = formatStatus(status);

  const configs = {
    'Reported': {
      bg: 'bg-sky-50 border-sky-200 text-sky-700',
      dot: 'bg-sky-500',
      icon: Clock,
      label: 'Reported'
    },
    'Acknowledged': {
      bg: 'bg-blue-50 border-blue-200 text-blue-700',
      dot: 'bg-blue-500',
      icon: Clock,
      label: 'Acknowledged'
    },
    'Assigned': {
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      dot: 'bg-indigo-500 animate-pulse',
      icon: Wrench,
      label: 'Assigned'
    },
    'In Progress': {
      bg: 'bg-blue-50 border-blue-300 text-blue-800',
      dot: 'bg-blue-600 animate-pulse',
      icon: Wrench,
      label: 'In Progress'
    },
    'Repair Submitted': {
      bg: 'bg-purple-50 border-purple-200 text-purple-700',
      dot: 'bg-purple-500',
      icon: ShieldAlert,
      label: 'Repair Submitted'
    },
    'Under Review': {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      dot: 'bg-amber-500 animate-pulse',
      icon: Search,
      label: 'Under Review'
    },
    'Community Verification': {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      dot: 'bg-amber-500 animate-pulse',
      icon: Users,
      label: 'Community Voting'
    },
    'Awaiting Citizen Verification': {
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
      dot: 'bg-amber-500 animate-pulse',
      icon: Users,
      label: 'Awaiting Citizen Verification'
    },
    'Resolved': {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
      label: 'Resolved ✓'
    },
    'Reopened': {
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
      dot: 'bg-amber-600 animate-pulse',
      icon: RotateCcw,
      label: 'Reopened'
    },
    'Escalated': {
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      dot: 'bg-rose-500 animate-ping',
      icon: Flame,
      label: 'Escalated 48h'
    },
    'Disputed': {
      bg: 'bg-orange-50 border-orange-200 text-orange-800',
      dot: 'bg-orange-500 animate-pulse',
      icon: AlertCircle,
      label: 'Manual Review'
    }
  };

  const config = configs[formatted] || configs['Reported'];
  const IconComponent = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1' 
    : 'px-2.5 py-1 text-xs font-semibold gap-1.5';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${config.bg} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <IconComponent className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};
