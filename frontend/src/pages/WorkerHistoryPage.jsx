import React, { useEffect, useState } from 'react';
import { History, CheckCircle2, MapPin, ArrowLeft, Camera, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

export const WorkerHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getWorkerHistory();
      setHistoryItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fadeIn">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/worker/dashboard')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl">
          {historyItems.length} Completed Repairs
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-2">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <History className="w-6 h-6 text-amber-600" />
          <span>My Completed Repair History</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Permanent municipal audit trail of work orders successfully resolved and verified by {user.name}.
        </p>
      </div>

      <div className="space-y-4">
        {historyItems.length > 0 ? (
          historyItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-2 min-w-0 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                    {item.ticket_id}
                  </span>
                  <StatusBadge status={item.status} />
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Fix
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{item.address} • {item.ward}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Resolved: {new Date(item.resolved_at).toLocaleDateString()} at {new Date(item.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Photos Comparison */}
              <div className="flex items-center gap-3 shrink-0">
                {item.before_image_url && (
                  <div className="text-center">
                    <img
                      src={item.before_image_url}
                      alt="Before"
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-inner"
                    />
                    <div className="text-[9px] uppercase font-bold text-slate-400 mt-1">Before</div>
                  </div>
                )}
                {item.after_image_url && (
                  <div className="text-center">
                    <img
                      src={item.after_image_url}
                      alt="After"
                      className="w-20 h-20 rounded-xl object-cover border border-emerald-300 shadow-inner"
                    />
                    <div className="text-[9px] uppercase font-bold text-emerald-600 mt-1">Repaired</div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No completed repairs recorded in this billing cycle yet.
          </div>
        )}
      </div>
    </div>
  );
};
