import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  ThumbsUp, 
  Clock, 
  Flame, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ScanLine, 
  Mail, 
  Share2, 
  HardHat, 
  Eye, 
  Layers, 
  Sparkles,
  ArrowRight,
  FileText,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CountdownTimer } from '../components/CountdownTimer';
import { CommunityVoteModal } from '../components/CommunityVoteModal';
import { WorkerRepairModal } from '../components/WorkerRepairModal';
import { SmartDispatchModal } from '../components/SmartDispatchModal';

export const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, currentRole, showToast, openEmergencyModal } = useAuth();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [viewMode, setViewMode] = useState('photos'); // 'photos' | 'heatmap'

  // Citizen Ground-Truth Verification State
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Modals
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [allWorkers, setAllWorkers] = useState([]);

  useEffect(() => {
    loadIssue();
  }, [id]);

  useEffect(() => {
    if (currentRole === 'admin') {
      api.getAdminWorkers().then((res) => setAllWorkers(res || [])).catch(() => []);
    }
  }, [currentRole]);

  const loadIssue = async () => {
    try {
      const data = await api.getIssueDetails(id);
      setIssue(data);
    } catch (err) {
      showToast('Error loading issue details: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (upvoting || !issue) return;
    setUpvoting(true);
    try {
      const res = await api.upvoteIssue(issue.id);
      setIssue((prev) => ({
        ...prev,
        upvotes: res.upvotes,
        priority_score: res.priority_score
      }));
      showToast('You added citizen support for this grievance!', 'success');
    } catch (err) {
      showToast('Upvote error: ' + err.message, 'error');
    } finally {
      setUpvoting(false);
    }
  };

  const handleCitizenVerify = async (isFixed) => {
    if (!issue) return;
    setVerifying(true);
    try {
      const res = await api.citizenVerify(issue.id, {
        verified: isFixed,
        reason: isFixed ? null : (rejectReason.trim() || 'Citizen reported issue still exists on site.'),
        citizen_name: user?.name || 'Citizen'
      });
      showToast(res.message || (isFixed ? 'Issue verified as fixed!' : 'Issue reopened for review.'), isFixed ? 'success' : 'warning');
      setShowRejectForm(false);
      setRejectReason('');
      await loadIssue();
    } catch (err) {
      showToast(err.message || 'Error processing verification', 'error');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Loading civic grievance record...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Grievance Record Not Found</h2>
        <Link to="/" className="text-xs text-blue-600 font-bold hover:underline">
          Return to Command Center
        </Link>
      </div>
    );
  }

  const ai = issue.latest_ai_verification;
  const comm = issue.community_verification;
  const esc = issue.latest_escalation;

  const totalCommVotes = (comm?.fixed_count || 0) + (comm?.broken_count || 0);
  const fixedPercent = totalCommVotes > 0 ? Math.round((comm.fixed_count / totalCommVotes) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-7 animate-fadeIn pb-24">
      {/* Back Link & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          {(issue.priority_level === 'Critical' || issue.is_emergency) && (
            <button
              onClick={openEmergencyModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-sm transition animate-pulse"
            >
              <span>🚨 EMERGENCY HELP</span>
            </button>
          )}

          {currentRole === 'worker' && (
            <button
              onClick={() => setIsRepairModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 shadow-sm transition"
            >
              <HardHat className="w-4 h-4" />
              <span>Submit After-Repair Evidence</span>
            </button>
          )}

          {currentRole === 'admin' && issue.status !== 'Resolved' && (
            <button
              onClick={() => setIsDispatchModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
            >
              <HardHat className="w-4 h-4" />
              <span>Smart Field Crew Dispatch</span>
            </button>
          )}

          <button
            onClick={handleUpvote}
            disabled={upvoting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 shadow-sm transition"
          >
            <ThumbsUp className="w-4 h-4 text-blue-600" />
            <span>Upvote Grievance ({issue.upvotes})</span>
          </button>
        </div>
      </div>

      {/* Main Header Card: Crisp White with Clear Hierarchy */}
      <div className="p-6 sm:p-8 rounded-3xl civic-panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-extrabold text-blue-800 bg-blue-50 px-3.5 py-1 rounded-xl border border-blue-200">
              {issue.ticket_id}
            </span>
            <StatusBadge status={issue.status} />
            <PriorityBadge level={issue.priority_level} score={issue.priority_score} />
          </div>

          <CountdownTimer
            deadline={issue.escalation_deadline}
            isResolved={issue.status === 'Resolved'}
            isEscalated={issue.status === 'Escalated'}
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
          {issue.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1 font-semibold text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            {issue.address} ({issue.ward})
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-blue-700 font-bold">
            <Users className="w-3.5 h-3.5" />
            Reported by {issue.report_count} Verified Citizens
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            Registered {new Date(issue.created_at).toLocaleDateString()}
          </span>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed pt-2 border-t border-slate-100">
          {issue.description}
        </p>

        {/* Assigned Worker Info if available */}
        {issue.assigned_worker_name && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <div className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-600" />
              <span>Assigned Field Crew: <strong className="text-slate-900">{issue.assigned_worker_name}</strong> ({issue.assigned_worker_department || 'Roads'})</span>
            </div>
            {issue.assigned_at && (
              <span className="text-[11px] font-mono text-slate-400">
                Assigned: {new Date(issue.assigned_at).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* CITIZEN REPAIR VERIFICATION CARD (Workflow Step 8, 9, 10) */}
      {(issue.status === 'AWAITING_CITIZEN_VERIFICATION' || issue.status === 'Awaiting Citizen Verification' || issue.status === 'Repair Submitted' || issue.status === 'Community Verification') && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border-2 border-blue-400 shadow-lg space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 block">
                  Ground-Truth Physical Verification Required
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Worker has marked {issue.ticket_id} as completed. Please verify whether the issue has been fixed.
                </h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-mono font-bold self-start sm:self-center">
              Citizen Action Required
            </span>
          </div>

          {issue.worker_completion_note && (
            <div className="p-4 rounded-2xl bg-white/90 border border-blue-200 text-xs text-slate-700 space-y-1 shadow-2xs">
              <span className="font-bold text-slate-900 block">Worker Field Note:</span>
              <p className="italic text-slate-800">"{issue.worker_completion_note}"</p>
            </div>
          )}

          {!showRejectForm ? (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                disabled={verifying}
                onClick={() => handleCitizenVerify(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ YES, ISSUE IS FIXED</span>
              </button>

              <button
                disabled={verifying}
                onClick={() => setShowRejectForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 text-xs font-bold border border-rose-200 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4 text-rose-600" />
                <span>✕ NO, ISSUE STILL EXISTS</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white border border-rose-200 space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                Please describe why the issue is not fixed (Optional note for municipal crew):
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Pothole is still partially open or patch has sunken..."
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-rose-400"
              />
              <div className="flex items-center gap-2">
                <button
                  disabled={verifying}
                  onClick={() => handleCitizenVerify(false)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  Confirm Reopen Request
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESOLVED CONFIRMATION BANNER */}
      {(issue.status === 'Resolved' || issue.status === 'RESOLVED') && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
            <div>
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span>ISSUE RESOLVED</span>
                {issue.citizen_verified && (
                  <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold uppercase">
                    Verified Fixed by Reporting Citizen
                  </span>
                )}
              </div>
              <p className="text-slate-700 text-xs mt-0.5">
                Physical repair completed on site, ground-truth verified, and audit trail sealed.
              </p>
            </div>
          </div>
          {currentRole === 'admin' && (
            <button
              onClick={() => navigate('/admin/reports')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition shrink-0 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Completion Report</span>
            </button>
          )}
        </div>
      )}

      {/* REOPENED WARNING BANNER */}
      {(issue.status === 'Reopened' || issue.status === 'REOPENED') && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-3 shadow-sm animate-fadeIn">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <div className="font-extrabold text-sm text-slate-900">
              REOPENED — CITIZEN REJECTED REPAIR
            </div>
            <p className="text-slate-700 text-xs mt-0.5">
              The reporting citizen confirmed this defect is still physically present. Reason: {issue.citizen_rejection_reason || 'Issue still exists.'}
            </p>
          </div>
        </div>
      )}

      {/* Suspicious Repair Warning Card: Clear, Professional, Non-aggressive */}
      {ai && (ai.verification_status === 'FAILED' || ai.suspicion_level === 'HIGH') && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3.5 shadow-sm animate-pulse">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <span>⚠️ Suspicious Repair Evidence</span>
              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold uppercase">
                Manual Review Required
              </span>
            </div>
            <p className="leading-relaxed text-slate-700">
              {ai.diagnostic_summary || 'The worker-uploaded photograph does not match the physical background keypoints of the original grievance site. RANSAC feature homography detected a mismatched environment. Ticket routed for manual municipal review and community verification.'}
            </p>
          </div>
        </div>
      )}

      {/* BEFORE | AFTER Side-by-Side Comparison (Flagship Screen) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BEFORE Photo */}
        <div className="p-5 rounded-3xl civic-panel space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              BEFORE PHOTO (Original Defect)
            </span>
            <span className="font-mono text-slate-400">Citizen Evidence</span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100 shadow-sm">
            <img
              src={issue.before_image_url}
              alt="Before Repair"
              className="w-full h-72 object-cover"
            />
          </div>
        </div>

        {/* AFTER Photo */}
        <div className="p-5 rounded-3xl civic-panel space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              AFTER PHOTO (Worker Evidence)
            </span>

            {ai?.heatmap_url && (
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[10px]">
                <button
                  onClick={() => setViewMode('photos')}
                  className={`px-2 py-0.5 rounded font-bold ${viewMode === 'photos' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
                >
                  Photo
                </button>
                <button
                  onClick={() => setViewMode('heatmap')}
                  className={`px-2 py-0.5 rounded font-bold ${viewMode === 'heatmap' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
                >
                  Thermal Diff Map
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100 shadow-sm">
            {issue.after_image_url ? (
              <img
                src={viewMode === 'heatmap' && ai?.heatmap_url ? ai.heatmap_url : issue.after_image_url}
                alt="After Repair"
                className="w-full h-72 object-cover"
              />
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Clock className="w-10 h-10 mb-2 text-slate-400 animate-pulse" />
                <p className="text-xs font-bold text-slate-700">Awaiting Municipal Repair Evidence</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Field maintenance crew has not yet submitted photographic completion evidence.
                </p>
                {currentRole === 'worker' && (
                  <button
                    onClick={() => setIsRepairModalOpen(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition"
                  >
                    Submit Repair Photo Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Verification Diagnostic Scores */}
      {ai && (
        <div className="p-6 sm:p-8 rounded-3xl civic-panel space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                <ScanLine className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  OpenCV AI Fake-Fix Verification Engine
                </h3>
                <p className="text-xs text-slate-500">
                  RANSAC feature homography, background edge invariance & physical defect delta
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Verification Status:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                ai.suspicion_level === 'HIGH'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : ai.suspicion_level === 'MEDIUM'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {ai.verification_status} ({ai.suspicion_level} Suspicion)
              </span>
            </div>
          </div>

          {/* Metric Meters in Clean Light Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs text-slate-700 mb-1.5 font-semibold">
                <span>Location Match</span>
                <span className="font-bold text-blue-700 font-mono">{ai.location_match_score}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${ai.location_match_score}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1.5 font-medium">Background structure similarity</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs text-slate-700 mb-1.5 font-semibold">
                <span>Scene Match (RANSAC)</span>
                <span className="font-bold text-purple-700 font-mono">{ai.scene_match_score}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${ai.scene_match_score}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1.5 font-medium">Keypoint inlier density</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs text-slate-700 mb-1.5 font-semibold">
                <span>Repair Confidence</span>
                <span className="font-bold text-emerald-700 font-mono">{ai.repair_confidence_score}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${ai.repair_confidence_score}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1.5 font-medium">Physical defect alteration delta</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700 leading-relaxed font-mono">
            <span className="text-blue-800 font-bold block mb-1">AI Diagnostic Assessment:</span>
            {ai.diagnostic_summary}
          </div>
        </div>
      )}

      {/* Community Verification Hub */}
      <div className="p-6 sm:p-8 rounded-3xl civic-panel space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Community Ground-Truth Verification</h3>
              <p className="text-xs text-slate-500">
                Neighborhood consensus decides ticket closure. Workers cannot self-resolve.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsVoteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Cast Ground-Truth Vote</span>
          </button>
        </div>

        {/* Voting Progress Bar */}
        <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-emerald-700">
              {comm?.fixed_count || 0} Verified Fixed ({fixedPercent}%)
            </span>
            <span className="text-rose-700">
              {comm?.broken_count || 0} Still Broken
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${fixedPercent}%` }}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${100 - fixedPercent}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 font-medium">
            <span>Total Community Votes: {totalCommVotes}</span>
            <span>Threshold for Permanent Closure: 75% Fixed Consensus</span>
          </div>
        </div>

        {/* Recent Votes Feed */}
        {comm?.recent_votes && comm.recent_votes.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Ground-Truth Verifier Comments
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {comm.recent_votes.map((vote, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{vote.citizen_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      vote.vote === 'FIXED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {vote.vote === 'FIXED' ? 'Verified Fixed' : 'Still Broken'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{vote.comments}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Escalation Communications (Email & X Bot Preview) */}
      {esc && (
        <div className="p-6 sm:p-8 rounded-3xl civic-panel space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Official Municipal Escalation & Public Accountability Broadcast
              </h3>
              <p className="text-xs text-slate-500">
                Triggered automatically due to statutory SLA expiration ({esc.authority_name})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Level 1: Official Municipal Grievance Email */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Official Grievance Email
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                  {esc.status === 'sent' ? 'Delivered via SMTP' : 'Queued for Dispatch'}
                </span>
              </div>

              <div className="text-xs space-y-1 font-mono text-slate-700 pt-2 border-t border-slate-200">
                <div><strong className="text-slate-900">To:</strong> {esc.authority_email}</div>
                <div><strong className="text-slate-900">Subject:</strong> {esc.email_subject}</div>
              </div>

              <pre className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-800 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-52">
                {esc.email_body}
              </pre>
            </div>

            {/* Level 2: Public X Accountability Bot Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Share2 className="w-4 h-4 text-sky-600" />
                  Public Accountability Post (X / Twitter)
                </span>
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-mono font-bold">
                  Broadcasted
                </span>
              </div>

              {/* Realistic Light Tweet Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    CE
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs">CivicEye Public Watch</span>
                      <span className="text-[11px] text-slate-400">@CivicEyeEscalate</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Factual Civic Accountability Bot</div>
                  </div>
                </div>

                <div className="text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed font-normal">
                  {esc.x_post_text}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="font-mono text-blue-700 font-bold">Public Escalation Broadcast</span>
                  <span>Factual Non-Abusive Disclosure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Chronological Audit Timeline */}
      <div className="p-6 sm:p-8 rounded-3xl civic-panel space-y-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Public Accountability Audit Trail & Timeline
        </h3>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {issue.audit_logs?.map((log, idx) => (
            <div key={idx} className="relative group">
              <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-900 text-sm">{log.action}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-blue-700 font-mono mt-0.5 font-semibold">
                Actor: {log.actor_name} ({log.actor_role})
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {log.details}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Community & Worker Modals */}
      <CommunityVoteModal
        isOpen={isVoteModalOpen}
        onClose={() => setIsVoteModalOpen(false)}
        issue={issue}
        onSuccess={loadIssue}
      />

      <WorkerRepairModal
        isOpen={isRepairModalOpen}
        onClose={() => setIsRepairModalOpen(false)}
        issue={issue}
        onSuccess={loadIssue}
      />

      {isDispatchModalOpen && (
        <SmartDispatchModal
          issue={issue}
          onClose={() => setIsDispatchModalOpen(false)}
          onSuccess={(res) => {
            showToast(`Work order ${issue.ticket_id} successfully assigned to ${res.worker_name}!`, 'success');
            setIsDispatchModalOpen(false);
            loadIssue();
          }}
          allWorkers={allWorkers}
        />
      )}
    </div>
  );
};
