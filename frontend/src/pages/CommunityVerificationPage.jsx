import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckCircle2, AlertCircle, ThumbsUp, MapPin, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CommunityVoteModal } from '../components/CommunityVoteModal';

export const CommunityVerificationPage = () => {
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunityIssues();
  }, []);

  const loadCommunityIssues = async () => {
    try {
      const data = await api.getIssues();
      const filtered = data.filter((i) => i.status === 'Community Verification' || i.status === 'Disputed');
      setIssues(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVote = (issue) => {
    setSelectedIssue(issue);
    setIsVoteModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Users className="w-5 h-5" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Community Ground-Truth Verification Hub
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Municipal workers cannot self-resolve tickets. Neighborhood ground-truth voting validates completed repairs before permanent ticket closure.
        </p>
      </div>

      {/* Explainer Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Neighborhood Consensus Charter</h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              When a repair passes initial OpenCV CV analysis, it enters Community Verification. 
              A minimum 75% 'Fixed' consensus permanently closes the ticket. If citizens vote 'Still Broken', the ticket routes to Disputed.
            </p>
          </div>
        </div>
      </div>

      {/* Issue Cards Awaiting Verification */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Repairs Awaiting Ground-Truth Inspection ({issues.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="p-6 rounded-2xl civic-card space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {issue.ticket_id}
                  </span>
                  <StatusBadge status={issue.status} size="sm" />
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{issue.title}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {issue.address}
                </p>

                {/* Before & After Preview */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <span className="text-[10px] font-bold text-rose-600 uppercase block mb-1">Before Defect</span>
                    <img
                      src={issue.before_image_url}
                      alt="Before"
                      className="w-full h-32 object-cover rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase block mb-1">Worker After Evidence</span>
                    <img
                      src={issue.after_image_url || issue.before_image_url}
                      alt="After"
                      className="w-full h-32 object-cover rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <Link
                  to={`/issues/${issue.ticket_id}`}
                  className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1"
                >
                  <span>Full AI Diagnostic</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => handleOpenVote(issue)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Cast Verification Vote</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CommunityVoteModal
        isOpen={isVoteModalOpen}
        onClose={() => setIsVoteModalOpen(false)}
        issue={selectedIssue}
        onSuccess={loadCommunityIssues}
      />
    </div>
  );
};
