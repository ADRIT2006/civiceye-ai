import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const CountdownTimer = ({ deadline, isResolved = false, isEscalated = false }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!deadline) return;

    const calculate = () => {
      const target = new Date(deadline).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, expired: false });
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (isResolved) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span className="font-semibold">Resolved within SLA</span>
      </div>
    );
  }

  if (timeLeft.expired || isEscalated) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 animate-pulse font-medium">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        <span className="font-bold">48h SLA Expired — Escalated</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-mono">
      <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '8s' }} />
      <span className="font-semibold">
        {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s remaining
      </span>
    </div>
  );
};
