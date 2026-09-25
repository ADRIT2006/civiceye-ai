import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Mail, Share2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export const Escalations = () => {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEscalations();
  }, []);

  const loadEscalations = async () => {
    try {
      const data = await api.getEscalations();
      setEscalations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <Flame className="w-5 h-5" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Statutory Escalation & Public Accountability Registry
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete transparent record of automated municipal grievance notices and public X bot broadcasts.
        </p>
      </div>

      {/* Escalation Cards in Light Theme */}
      <div className="space-y-4">
        {escalations.map((esc) => (
          <div
            key={esc.id}
            className="p-6 rounded-3xl bg-white border border-rose-200 shadow-sm space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                  {esc.ticket_id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                  Level {esc.level} Escalation
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(esc.sent_at).toLocaleString()}
                </span>
              </div>

              <Link
                to={`/issues/${esc.ticket_id}`}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <span>Inspect Grievance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              {/* Email Record in Light Theme */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-800 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Official Municipal Grievance Notice
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">{esc.status}</span>
                </div>
                <div className="text-slate-700 font-mono text-[11px]">
                  <strong>To:</strong> {esc.authority_name} ({esc.authority_email})
                </div>
                <div className="text-slate-900 font-bold">{esc.email_subject}</div>
                <pre className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-48">
                  {esc.email_body}
                </pre>
              </div>

              {/* Public X Post in Light Theme */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-800 flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-sky-600" />
                    Public Social Accountability Broadcast
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">@CivicEyeEscalate</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs shadow-sm space-y-2">
                  <p className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed">
                    {esc.x_post_text}
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>14 Retweets</span>
                    <span>42 Likes</span>
                    <span>Verified Factual Citizen Disclosure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
