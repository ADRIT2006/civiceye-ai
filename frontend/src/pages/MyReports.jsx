import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, PlusCircle, Clock, MapPin, Users, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { api, API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CountdownTimer } from '../components/CountdownTimer';

export const MyReports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMyReports();
  }, [user]);

  const loadMyReports = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch only issues for authenticated/current citizen
      const data = await api.getCitizenIssues();
      setIssues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load citizen reports:', err);
      setError(err.message || 'Unable to fetch your reports. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (issue) => {
    const url = issue.before_image_url || issue.photo_url || issue.photo;
    if (!url) return '/uploads/before/pothole_main_before.jpg';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_URL.replace(/\/+$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              My Civic Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Grievances filed or tracked by <strong className="text-slate-800">{user?.name || 'Citizen'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadMyReports}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            title="Refresh reports"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/report"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report New Grievance</span>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadMyReports}
            className="font-bold underline text-amber-900 hover:text-amber-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Fetching verified citizen reports from database...</p>
        </div>
      ) : issues.length === 0 ? (
        /* Empty state */
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Reports Filed Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              You haven't reported any civic issues yet. Spot a pothole, open drain, or broken light in your neighborhood?
            </p>
          </div>
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report an Issue</span>
          </Link>
        </div>
      ) : (
        /* Reports Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => navigate(`/issues/${issue.ticket_id}`)}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group space-y-4"
            >
              <div>
                {/* Header: Ticket ID & Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 group-hover:bg-blue-100 transition">
                      {issue.ticket_id}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {issue.category}
                    </span>
                  </div>
                  <StatusBadge status={issue.status} size="sm" />
                </div>

                {/* Short Description / Title */}
                <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition">
                  {issue.title || `${issue.category} reported at ${issue.address}`}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                  {issue.description}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{issue.address}</span>
                </p>

                {/* Photo & Priority Panel */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={getPhotoUrl(issue)}
                      alt={issue.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/uploads/before/pothole_main_before.jpg';
                      }}
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 flex flex-col justify-center">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Priority</div>
                      <div className="font-bold text-slate-800">
                        <PriorityBadge level={issue.priority_level} score={issue.priority_score} size="sm" />
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Citizen Voice</div>
                      <div className="font-bold text-blue-700 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{issue.report_count || 1} Reported</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Reported Date</div>
                      <div className="text-slate-600 font-medium">
                        {formatDate(issue.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <CountdownTimer
                  deadline={issue.escalation_due_at || issue.escalation_deadline}
                  isResolved={issue.status === 'Resolved' || issue.status === 'RESOLVED'}
                  isEscalated={issue.status === 'Escalated' || issue.status === 'ESCALATED'}
                />

                <span className="flex items-center gap-1 font-bold text-blue-600 group-hover:text-blue-800">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
