import React, { useState } from 'react';
import { Users, ThumbsUp, ThumbsDown, X, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CommunityVoteModal = ({ isOpen, onClose, issue, onSuccess }) => {
  const { user, showToast } = useAuth();
  const [vote, setVote] = useState('FIXED');
  const [comments, setComments] = useState('');
  const [citizenName, setCitizenName] = useState(user.name || 'Priya Sharma');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.submitCommunityVote(issue.id, {
        citizen_name: citizenName,
        vote: vote,
        comments: comments || (vote === 'FIXED' ? 'Verified in person that repair is completed.' : 'Defect is still open.')
      });

      showToast(`Vote recorded! Current consensus: ${res.fixed_count} Fixed vs ${res.broken_count} Broken`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showToast('Error submitting vote: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Community Ground-Truth Verification</h3>
              <p className="text-xs text-slate-600">Cast neighborhood vote for <span className="font-mono text-blue-700 font-bold">{issue.ticket_id}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Voting Options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Does this civic issue appear physically resolved on site?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVote('FIXED')}
                className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 transition ${
                  vote === 'FIXED'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <ThumbsUp className={`w-6 h-6 ${vote === 'FIXED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-900">YES — Issue Fixed</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Physical repair is satisfactory</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVote('STILL_BROKEN')}
                className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 transition ${
                  vote === 'STILL_BROKEN'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-md shadow-rose-500/10'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <ThumbsDown className={`w-6 h-6 ${vote === 'STILL_BROKEN' ? 'text-rose-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-900">NO — Still Broken</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Defect remains or work was fake</div>
                </div>
              </button>
            </div>
          </div>

          {/* Citizen Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Your Name / Verified Resident Handle
            </label>
            <input
              type="text"
              required
              value={citizenName}
              onChange={(e) => setCitizenName(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 p-2.5 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Ground-Truth Observation Notes
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 p-3 text-xs text-slate-900 focus:outline-none"
              placeholder="e.g. Inspected in person at 4 PM. Pavement is completely smooth and open for traffic..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Recording Vote...' : 'Submit Verification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
