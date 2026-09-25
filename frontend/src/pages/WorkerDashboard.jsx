import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HardHat, 
  Upload, 
  Clock, 
  MapPin, 
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  Map,
  Flame,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  PlusCircle,
  Send,
  X,
  Sparkles,
  Layers,
  ChevronRight,
  Bell
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CountdownTimer } from '../components/CountdownTimer';
import { WorkerRepairModal } from '../components/WorkerRepairModal';
import { CivicMapWidget } from '../components/CivicMapWidget';

export const WorkerDashboard = () => {
  const { user, showToast } = useAuth();
  const [stats, setStats] = useState({
    assigned_today: 0,
    critical_jobs: 0,
    in_progress: 0,
    awaiting_verification: 0,
    completed_this_week: 0,
  });
  const [issues, setIssues] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeNoteIssue, setActiveNoteIssue] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [loading, setLoading] = useState(true);

  const [workerProfile, setWorkerProfile] = useState(null);
  const [activeWorkerId, setActiveWorkerId] = useState(() => localStorage.getItem('civiceye_worker_id') || '14');

  useEffect(() => {
    loadWorkerData();
  }, [activeWorkerId]);

  const loadWorkerData = async () => {
    try {
      setLoading(true);
      const [statsData, issuesData, notifsData, profileData] = await Promise.all([
        api.getWorkerStats().catch(() => ({
          assigned_today: 0,
          critical_jobs: 0,
          in_progress: 0,
          awaiting_verification: 0,
          completed_this_week: 0,
        })),
        api.getAssignedIssues().catch(() => []),
        api.getRoleNotifications('worker').catch(() => []),
        api.getWorkerProfile().catch(() => null)
      ]);
      setStats(statsData);
      setIssues(issuesData);
      setNotifications(notifsData);
      if (profileData) {
        setWorkerProfile(profileData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchWorker = (id) => {
    localStorage.setItem('civiceye_worker_id', String(id));
    setActiveWorkerId(String(id));
  };

  const handleStartWork = async (issueId, ticketId) => {
    try {
      await api.startWorkOrder(issueId);
      showToast(`Work started on ${ticketId}. Crew logged on-site.`, 'success');
      loadWorkerData();
    } catch (err) {
      showToast(err.message || 'Failed to start work order', 'error');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !activeNoteIssue) return;
    try {
      setSubmittingNote(true);
      await api.addWorkNote(activeNoteIssue.id, noteText, user.name);
      showToast(`Field work note appended to ${activeNoteIssue.ticket_id}`, 'success');
      setNoteText('');
      setActiveNoteIssue(null);
      loadWorkerData();
    } catch (err) {
      showToast(err.message || 'Failed to submit work note', 'error');
    } finally {
      setSubmittingNote(false);
    }
  };

  const openSubmitModal = (issue) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
  };

  const priorityQueue = [...issues].sort((a, b) => b.priority_score - a.priority_score);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn pb-24">
      {/* Worker Header Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-amber-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center shadow-inner shrink-0">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/25 text-white text-[11px] font-black uppercase tracking-wider">
                Field Operations Workspace
              </span>
              <span className="text-xs text-amber-100 font-mono">
                {workerProfile?.worker_code || 'WRK-2026-014'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              {workerProfile?.name || user.name}
            </h1>
            <p className="text-xs text-amber-100 mt-0.5">
              {workerProfile?.department || user.department} • Assigned Ward: {workerProfile?.primary_ward || user.ward}
            </p>

            {/* Quick Crew Account Switcher for Demo / RBAC testing */}
            <div className="mt-2.5 flex items-center gap-1.5 text-xs">
              <span className="text-amber-200 text-[10px] font-bold uppercase tracking-wider">Active Crew:</span>
              <select
                value={activeWorkerId}
                onChange={(e) => handleSwitchWorker(e.target.value)}
                className="bg-black/25 text-white text-[11px] font-semibold rounded-lg px-2 py-0.5 border border-white/20 focus:outline-none cursor-pointer"
              >
                <option value="14" className="text-slate-800">Rakesh Das (WRK-014) — Drainage, Ward 06</option>
                <option value="2" className="text-slate-800">Rajesh Kumar (WRK-002) — Roads, Ward 12</option>
                <option value="18" className="text-slate-800">Shivakumar B. (WRK-018) — Drainage, Ward 18</option>
                <option value="5" className="text-slate-800">Manjunath Gowda (WRK-005) — Drainage, Ward 01</option>
              </select>
            </div>
          </div>
        </div>

        {/* Operational Guidelines Note */}
        <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/30 text-xs text-amber-50 max-w-sm">
          <div className="font-bold flex items-center gap-1.5 mb-1 text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            Statutory Protocol Notice
          </div>
          <p className="leading-relaxed text-[11px]">
            Maintenance crews cannot unilaterally mark tickets Resolved. After uploading repair photos, OpenCV will run homographic feature matching, followed by community/admin verification.
          </p>
        </div>
      </div>

      {/* 5 Worker Dashboard Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Assigned Today
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.assigned_today}</div>
          <p className="text-[11px] text-slate-500 mt-1">Active tickets in queue</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-red-200 bg-red-50/20 shadow-sm">
          <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Critical Jobs</span>
            <Flame className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="text-3xl font-black text-red-700">{stats.critical_jobs}</div>
          <p className="text-[11px] text-red-600 font-medium mt-1">High public impact</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-blue-200 bg-blue-50/20 shadow-sm">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">
            In Progress
          </div>
          <div className="text-3xl font-black text-blue-700">{stats.in_progress}</div>
          <p className="text-[11px] text-blue-600 font-medium mt-1">Crews on-site</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-purple-200 bg-purple-50/20 shadow-sm">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1">
            Awaiting Verification
          </div>
          <div className="text-3xl font-black text-purple-700">{stats.awaiting_verification}</div>
          <p className="text-[11px] text-purple-600 font-medium mt-1">Photos submitted</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-sm col-span-2 lg:col-span-1">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Completed This Week</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700">{stats.completed_this_week}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Verified fixes</p>
        </div>
      </div>

      {/* Visual Worker Workflow Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Standard Operating Procedure (SOP) Workflow
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">1. Assigned</span>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">2. Accepted</span>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">3. Work Started</span>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">4. Repair Completed</span>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">5. Upload After Photo</span>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200">6. AI Verification</span>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">7. Community/Admin Approval</span>
        </div>
      </div>

      {/* Map of Assigned Issues & Notifications Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Map of Assigned Issues */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Map className="w-4 h-4 text-amber-600" />
                Map of Assigned Field Operations
              </h2>
              <p className="text-xs text-slate-500">
                GPS dispatch markers for all active maintenance tickets
              </p>
            </div>
            <Link
              to="/map"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Open Full GIS Map <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-[320px] rounded-xl overflow-hidden border border-slate-100">
            <CivicMapWidget issues={issues} height="100%" />
          </div>
        </div>

        {/* Right 4 Cols: Recent Worker Notifications */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              Recent Field Alerts
            </h3>
            <span className="text-[10px] text-slate-400">{notifications.length} alerts</span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-800">{n.title}</span>
                    {n.ticket_id && (
                      <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-blue-700">
                        {n.ticket_id}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">{n.message}</p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No active operational alerts.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Assigned Jobs & Priority Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HardHat className="w-5 h-5 text-amber-600" />
              Today's Assigned Jobs & Priority Queue
            </h2>
            <p className="text-xs text-slate-500">
              Field work orders sorted by dynamic severity score and statutory SLA
            </p>
          </div>
          <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            {priorityQueue.length} Active Work Orders
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {priorityQueue.map((issue) => (
            <div
              key={issue.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {issue.ticket_id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge level={issue.priority_level} />
                    <StatusBadge status={issue.status} size="sm" />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{issue.title}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {issue.address}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <img
                    src={issue.before_image_url}
                    alt="Before"
                    className="w-full h-28 object-cover rounded-xl border border-slate-200"
                  />
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Priority Score</div>
                      <div className="font-black text-slate-800 text-base">{issue.priority_score}/100</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Public Pressure</div>
                      <div className="font-bold text-blue-700">{issue.report_count} citizen reports</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Resolution Clock:</span>
                  <CountdownTimer deadline={issue.escalation_deadline} status={issue.status} />
                </div>
              </div>

              {/* Comprehensive Worker Action Toolbar */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Field Actions:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {/* Action 1: Start Work */}
                  <button
                    onClick={() => handleStartWork(issue.id, issue.ticket_id)}
                    disabled={issue.status === 'In Progress' || issue.status === 'IN_PROGRESS' || issue.status === 'AWAITING_CITIZEN_VERIFICATION'}
                    className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 border transition ${
                      (issue.status === 'In Progress' || issue.status === 'IN_PROGRESS')
                        ? 'bg-blue-50 text-blue-700 border-blue-200 cursor-default'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 cursor-pointer'
                    }`}
                  >
                    <Play className="w-3 h-3 text-blue-600" />
                    <span>{(issue.status === 'In Progress' || issue.status === 'IN_PROGRESS') ? 'In Progress' : 'Start Work'}</span>
                  </button>

                  {/* Action 2: Add Work Note */}
                  <button
                    onClick={() => setActiveNoteIssue(issue)}
                    className="px-2.5 py-1.5 rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FileText className="w-3 h-3 text-slate-600" />
                    <span>Add Note</span>
                  </button>

                  {/* Action 3: Open Map */}
                  <Link
                    to="/map"
                    className="px-2.5 py-1.5 rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center justify-center gap-1.5 transition"
                  >
                    <Map className="w-3 h-3 text-amber-600" />
                    <span>Open Map</span>
                  </Link>

                  {/* Action 4: Upload Repair Evidence */}
                  <button
                    onClick={() => openSubmitModal(issue)}
                    className="col-span-2 sm:col-span-3 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>WORK DONE • SUBMIT REPAIR EVIDENCE</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Work Note Modal */}
      {activeNoteIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Add Operational Work Note
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Ticket: {activeNoteIssue.ticket_id}
                </p>
              </div>
              <button
                onClick={() => setActiveNoteIssue(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Material / Progress Log Note:
                </label>
                <textarea
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Bitumen applied, roller compacted surface. Waiting for cure time..."
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveNoteIssue(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNote}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingNote ? 'Saving...' : 'Save to Audit Log'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repair Evidence Upload Modal */}
      <WorkerRepairModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        issue={selectedIssue}
        onSuccess={loadWorkerData}
      />
    </div>
  );
};
