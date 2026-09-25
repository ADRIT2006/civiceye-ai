import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Toast = () => {
  const { toasts, removeToast } = useAuth();

  if (!toasts.length) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-200 bg-white text-emerald-950',
    warning: 'border-amber-200 bg-white text-amber-950',
    error: 'border-rose-200 bg-white text-rose-950',
    info: 'border-blue-200 bg-white text-blue-950'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-2xl border shadow-xl transition-all duration-300 transform translate-y-0 ${
            borders[toast.type] || borders.info
          }`}
        >
          <div className="flex items-start gap-3">
            {icons[toast.type] || icons.info}
            <div className="text-xs font-medium text-slate-800 leading-snug">{toast.message}</div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
