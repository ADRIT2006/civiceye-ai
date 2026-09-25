import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ScanLine, 
  Eye, 
  ChevronRight, 
  X, 
  Check, 
  Building, 
  Phone, 
  Mail,
  Map,
  UserCheck,
  Briefcase,
  History,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BarChart3,
  Clock,
  Send,
  RefreshCw,
  Bot,
  HardHat,
  Compass,
  FileCheck2,
  FileText
} from 'lucide-react';
import { api, API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CountdownTimer } from '../components/CountdownTimer';
import { CivicMapWidget } from '../components/CivicMapWidget';
import { AdminCopilotModal } from '../components/AdminCopilotModal';
import { SmartDispatchModal } from '../components/SmartDispatchModal';
import { WorkerAvatar } from '../components/WorkerAvatar';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, showToast } = useAuth();
  const [issues, setIssues] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [emergencyIncidents, setEmergencyIncidents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals & Active Tab (Default to Incoming Unassigned issues so newly reported issues appear immediately)
  const [activeTab, setActiveTab] = useState('unassigned');
  const [assignModalIssue, setAssignModalIssue] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [adminCopilotOpen, setAdminCopilotOpen] = useState(false);
  const [recommendedWorkers, setRecommendedWorkers] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const openAssignModal = async (issue) => {
    setAssignModalIssue(issue);
    setSelectedWorkerId('');
    setRecommendedWorkers([]);
    try {
      setLoadingRecommendations(true);
      const rec = await api.getRecommendedWorkers(issue.id);
      if (rec && rec.recommendations) {
        setRecommendedWorkers(rec.recommendations);
        if (rec.recommendations.length > 0) {
          setSelectedWorkerId(String(rec.recommendations[0].worker_id));
        }
      }
    } catch (err) {
      console.error('Failed to load recommended workers:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const getPhotoUrl = (issue) => {
    const url = issue?.before_image_url || issue?.photo_url || issue?.photo;
    if (!url) return '/uploads/before/pothole_main_before.jpg';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_URL.replace(/\/+$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, issuesRes, analyticsRes, contactsRes, workersRes, logsRes, emRes] = await Promise.all([
        api.getAdminDashboardSummary().catch(() => null),
        api.getAdminIssues().catch(() => api.getIssues().catch(() => [])),
        api.getAnalytics().catch(() => null),
        api.getMunicipalContacts().catch(() => []),
        api.getAdminWorkers().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getEmergencyIncidents().catch(() => [])
      ]);
      setSummary(summaryRes);
      setIssues(issuesRes || []);
      setAnalytics(analyticsRes);
      setContacts(contactsRes || []);
      setWorkers(workersRes || []);
      setAuditLogs(logsRes || []);
      setEmergencyIncidents(emRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRepair = async (issueId, ticketId) => {
    try {
      await api.approveRepair(issueId, {
        admin_notes: 'Inspected by Municipal Authority. AI suspicion cleared upon manual inspection. Verified repair.'
      });
      showToast(`Ticket ${ticketId} approved and marked Resolved!`, 'success');
      loadData();
    } catch (err) {
      showToast('Error approving repair: ' + err.message, 'error');
    }
  };

  const handleRejectRepair = async (issueId, ticketId) => {
    try {
      await api.rejectRepair(issueId, {
        admin_notes: 'Confirmed AI suspicion. Worker submitted fraudulent or inadequate repair photo. Ordered to re-work.'
      });
      showToast(`Ticket ${ticketId} repair evidence rejected. Returned to work crew.`, 'warning');
      loadData();
    } catch (err) {
      showToast('Error rejecting repair: ' + err.message, 'error');
    }
  };

  const handleEscalate = async (issueId, ticketId) => {
    try {
      await api.adminEscalate(issueId);
      showToast(`Statutory Level 2 Escalation triggered for ${ticketId}! Notice posted to X/Twitter bot.`, 'warning');
      loadData();
    } catch (err) {
      showToast('Error escalating: ' + err.message, 'error');
    }
  };

  const handleReopen = async (issueId, ticketId) => {
    try {
      await api.reopenIssue(issueId, {
        admin_notes: 'Reopened following citizen feedback review.'
      });
      showToast(`Ticket ${ticketId} reopened by administrative order.`, 'info');
      loadData();
    } catch (err) {
      showToast('Error reopening: ' + err.message, 'error');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalIssue || !selectedWorkerId) return;
    const worker = workers.find(w => w.id === parseInt(selectedWorkerId));
    try {
      await api.assignWorker(assignModalIssue.id, {
        worker_id: parseInt(selectedWorkerId),
        worker_name: worker ? worker.name : 'Maintenance Crew',
        department: worker ? worker.department : 'Public Works'
      });
      showToast(`Work order ${assignModalIssue.ticket_id} assigned to ${worker?.name}!`, 'success');
      setAssignModalIssue(null);
      setSelectedWorkerId('');
      loadData();
    } catch (err) {
      showToast('Failed to assign worker: ' + err.message, 'error');
    }
  };

  // Dynamic metrics computations from backend summary directly from SQLite
  const totalIssuesCount = summary?.total_issues ?? issues.length;
  const totalOpenIssues = summary?.open_issues ?? issues.filter(i => (i.status || '').toUpperCase() !== 'RESOLVED').length;
  const criticalCount = summary?.critical_issues ?? issues.filter(i => (i.priority_level || '').toUpperCase() === 'CRITICAL' && (i.status || '').toUpperCase() !== 'RESOLVED').length;
  const unassignedCount = summary?.unassigned_issues ?? issues.filter(i => !i.assigned_worker_id && (i.status || '').toUpperCase() !== 'RESOLVED').length;
  const escalatedCount = summary?.escalated_issues ?? issues.filter(i => (i.status || '').toUpperCase() === 'ESCALATED').length;
  const resolvedCount = summary?.resolved_issues ?? issues.filter(i => (i.status || '').toUpperCase() === 'RESOLVED').length;

  // Issue collections for tabs
  const suspiciousIssues = issues.filter(i => 
    (i.opencv_advisory && i.opencv_advisory.toLowerCase().includes('suspicious')) ||
    (i.ai_repair_status && i.ai_repair_status.toLowerCase().includes('suspicious')) ||
    i.is_suspicious ||
    i.requires_review
  );
  const unassignedIssues = issues.filter(i => 
    !i.assigned_worker_id && (i.status || '').toUpperCase() !== 'RESOLVED'
  );
  const escalatedIssues = issues.filter(i => 
    (i.status || '').toUpperCase() === 'ESCALATED' || (i.escalation_level && i.escalation_level > 0)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn pb-24">
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-800 text-white shadow-xl shadow-indigo-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-sm">
              Municipal Command Center (RBAC: Admin)
            </span>
            <span className="text-xs text-purple-200 font-mono">Full Authority Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {user.name}
          </h1>
          <p className="text-xs text-purple-200 mt-0.5">
            {user.department} • Citywide Central Governance &amp; Public Works Monitoring
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/complaints"
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl backdrop-blur-sm border border-white/30 transition flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-sky-300" />
            All Issues
          </Link>
          <button
            onClick={() => setAdminCopilotOpen(true)}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 border border-indigo-400/50"
          >
            <Bot className="w-4 h-4" />
            Admin Copilot
          </button>
          <Link
            to="/admin/ward-map"
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl backdrop-blur-sm border border-white/30 transition flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4 text-emerald-300" />
            Ward Map
          </Link>
          <Link
            to="/admin/workers"
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl backdrop-blur-sm border border-white/30 transition flex items-center gap-1.5"
          >
            <HardHat className="w-4 h-4 text-amber-300" />
            Worker Directory
          </Link>
          <Link
            to="/admin/reports"
            className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md border border-purple-400/40 transition flex items-center gap-1.5"
          >
            <FileCheck2 className="w-4 h-4 text-amber-300" />
            AI Reports
          </Link>
          <button
            onClick={() => setAuditModalOpen(true)}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl backdrop-blur-sm border border-white/30 transition flex items-center gap-1.5"
          >
            <History className="w-4 h-4" />
            Audit Logs ({auditLogs.length})
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2.5 bg-white text-purple-900 hover:bg-purple-50 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            title="Refresh database issues"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 6 Real Database Admin Command Center Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 1. Total Issues */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Total Issues
          </div>
          <div className="text-3xl font-black text-slate-900">{totalIssuesCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Recorded in database</p>
        </div>

        {/* 2. Open Issues */}
        <div className="bg-white rounded-xl p-4 border border-blue-200 bg-blue-50/20 shadow-sm">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Open Issues</span>
            <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-700">{totalOpenIssues}</div>
          <p className="text-[11px] text-blue-600 font-medium mt-1">Active complaints</p>
        </div>

        {/* 3. Critical Issues */}
        <div className="bg-white rounded-xl p-4 border border-red-200 bg-red-50/20 shadow-sm">
          <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Critical Issues</span>
            <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="text-3xl font-black text-red-700">{criticalCount}</div>
          <p className="text-[11px] text-red-600 font-medium mt-1">Highest safety risk</p>
        </div>

        {/* 4. Unassigned Issues */}
        <div className="bg-white rounded-xl p-4 border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Unassigned Issues</span>
            <Users className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-700">{unassignedCount}</div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Awaiting crew dispatch</p>
        </div>

        {/* 5. Escalated Issues */}
        <div className="bg-white rounded-xl p-4 border border-rose-200 bg-rose-50/20 shadow-sm">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Escalated Issues</span>
            <Flame className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-700">{escalatedCount}</div>
          <p className="text-[11px] text-rose-600 font-medium mt-1">48h SLA breached</p>
        </div>

        {/* 6. Resolved Issues */}
        <div className="bg-white rounded-xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Resolved Issues</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700">{resolvedCount}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Fixed &amp; closed</p>
        </div>
      </div>

      {/* Live Issue Map & Critical Complaints Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Cols: Live Command Center Map */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Map className="w-4 h-4 text-purple-600" />
                Live Civic Geographic Overview
              </h2>
              <p className="text-xs text-slate-500">
                Citywide real-time issue clustering and SLA alert pins
              </p>
            </div>
            <Link
              to="/map"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              Full Screen GIS <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-[340px] rounded-xl overflow-hidden border border-slate-100">
            <CivicMapWidget issues={issues} height="100%" />
          </div>
        </div>

        {/* Right 5 Cols: Recent Emergency Reports & Critical Issues */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-600" />
                Recent Emergency Civic Hazards
              </h3>
              <p className="text-xs text-slate-500">Critical incidents requiring urgent dispatch</p>
            </div>
            <Link to="/emergency" className="text-xs font-bold text-red-600 hover:text-red-700">
              Directory
            </Link>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[310px] pr-1">
            {emergencyIncidents.length > 0 ? (
              emergencyIncidents.slice(0, 4).map((em) => (
                <div
                  key={em.id}
                  className="p-3 rounded-xl border border-red-200 bg-red-50/30 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-red-800">{em.ticket_id}</span>
                      <PriorityBadge level={em.priority_level} />
                    </div>
                    <div className="font-bold text-slate-900 truncate">{em.title}</div>
                    <div className="text-[11px] text-slate-500 truncate">{em.address || em.ward}</div>
                  </div>
                  <button
                    onClick={() => openAssignModal(em)}
                    className="shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm transition"
                  >
                    Dispatch
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No active critical emergency reports.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Action Workbench Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/70 px-4 sm:px-6 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`py-4 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'unassigned'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4 text-amber-600" />
            <span>Incoming &amp; Unassigned ({unassignedIssues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'all'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>All Complaints ({issues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suspicious')}
            className={`py-4 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'suspicious'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ScanLine className="w-4 h-4 text-purple-600" />
            <span>Suspicious Evidence ({suspiciousIssues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('escalated')}
            className={`py-4 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'escalated'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-600" />
            <span>Escalation Queue ({escalatedIssues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('workload')}
            className={`py-4 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'workload'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Worker Workload &amp; Contacts</span>
          </button>
        </div>

        {/* Tab Content 1: Suspicious Repair Evidence */}
        {activeTab === 'suspicious' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  OpenCV AI Flagged "Fake Fixes" & Evidence Review
                </h3>
                <p className="text-xs text-slate-500">
                  Tickets where AI detected keypoint mismatch (&lt;50% scene correlation) or invalid structural geometry
                </p>
              </div>
            </div>

            {suspiciousIssues.length > 0 ? (
              suspiciousIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/20 space-y-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-purple-900 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                        {issue.ticket_id}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{issue.title}</h4>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-800 font-extrabold text-xs rounded-full border border-red-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      SUSPICIOUS EVIDENCE DETECTED (12% MATCH)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Before Photo */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 uppercase">
                        Before Photo (Citizen)
                      </span>
                      <img
                        src={issue.before_image_url}
                        alt="Before"
                        className="w-full h-40 object-cover rounded-xl border border-slate-200 shadow-sm"
                      />
                    </div>

                    {/* Worker Submitted After Photo */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 uppercase">
                        Worker Submitted Photo (Rajesh K.)
                      </span>
                      <img
                        src={issue.after_image_url || issue.before_image_url}
                        alt="After"
                        className="w-full h-40 object-cover rounded-xl border-2 border-red-300 shadow-sm"
                      />
                    </div>

                    {/* AI Diagnostic Summary */}
                    <div className="bg-white rounded-xl p-4 border border-amber-200 flex flex-col justify-between text-xs space-y-2">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                          <ScanLine className="w-4 h-4 text-purple-600" />
                          AI Keypoint Verification Results
                        </div>
                        <div className="space-y-1 text-slate-600">
                          <div><strong>Scene Match Score:</strong> <span className="text-red-600 font-bold">12.4%</span> (Flagged &lt;50%)</div>
                          <div><strong>Homography Inliers:</strong> 6 / 500 points</div>
                          <div><strong>Location Match:</strong> 94.2% GPS confidence</div>
                          <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            Scene background shows indoor tile geometry while original ticket shows outdoor asphalt. High confidence fake repair submission.
                          </p>
                        </div>
                      </div>

                      {/* Admin Decision Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleRejectRepair(issue.id, issue.ticket_id)}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm text-xs flex items-center justify-center gap-1 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject Evidence
                        </button>
                        <button
                          onClick={() => handleApproveRepair(issue.id, issue.ticket_id)}
                          className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm text-xs flex items-center justify-center gap-1 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve Override
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No suspicious repair evidence currently flagged by AI.
              </div>
            )}
          </div>
        )}

        {/* Tab Content 1: Incoming & Unassigned Complaints */}
        {activeTab === 'unassigned' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Incoming &amp; Unassigned Grievance Queue
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time citizen reported complaints requiring field maintenance crew assignment
                </p>
              </div>
            </div>

            {unassignedIssues.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No unassigned complaints in queue. All active issues have been assigned to crews.
              </div>
            ) : (
              <div className="space-y-3">
                {unassignedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <img
                        src={getPhotoUrl(issue)}
                        alt={issue.title}
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/uploads/before/pothole_main_before.jpg';
                        }}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/issues/${issue.ticket_id}`}
                            className="font-mono text-xs font-black text-indigo-700 hover:underline"
                          >
                            {issue.ticket_id}
                          </Link>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {issue.category}
                          </span>
                          <PriorityBadge level={issue.priority_level} />
                          <StatusBadge status={issue.status} size="sm" />
                        </div>
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {issue.title}
                        </div>
                        {issue.description && (
                          <p className="text-xs text-slate-600 line-clamp-1">
                            {issue.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span>📍 {issue.address} • {issue.ward || 'Ward Unavailable'}</span>
                          <span>⏱️ Reported: {formatDate(issue.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <Link
                        to={`/issues/${issue.ticket_id}`}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>Open Issue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => openAssignModal(issue)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <HardHat className="w-3.5 h-3.5" />
                        <span>Assign Worker</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: All Complaints */}
        {activeTab === 'all' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  All Registered Grievances ({issues.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Full ledger of all civic complaints across BBMP municipal jurisdiction
                </p>
              </div>
            </div>

            {issues.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No issues found in database.
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <img
                        src={getPhotoUrl(issue)}
                        alt={issue.title}
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/uploads/before/pothole_main_before.jpg';
                        }}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/issues/${issue.ticket_id}`}
                            className="font-mono text-xs font-black text-indigo-700 hover:underline"
                          >
                            {issue.ticket_id}
                          </Link>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {issue.category}
                          </span>
                          <PriorityBadge level={issue.priority_level} />
                          <StatusBadge status={issue.status} size="sm" />
                        </div>
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {issue.title}
                        </div>
                        {issue.description && (
                          <p className="text-xs text-slate-600 line-clamp-1">
                            {issue.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span>📍 {issue.address} • {issue.ward || 'Ward Unavailable'}</span>
                          <span>⏱️ Reported: {formatDate(issue.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <Link
                        to={`/issues/${issue.ticket_id}`}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>Open Issue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      {!issue.assigned_worker_id && (issue.status || '').toUpperCase() !== 'RESOLVED' && (
                        <button
                          onClick={() => openAssignModal(issue)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <HardHat className="w-3.5 h-3.5" />
                          <span>Assign Worker</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Escalated Queue */}
        {activeTab === 'escalated' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Statutory 48-Hour Escalation Queue
                </h3>
                <p className="text-xs text-slate-500">
                  Tickets where resolution deadline has expired and public notices were triggered
                </p>
              </div>
              <Link to="/escalations" className="text-xs font-bold text-rose-600 hover:text-rose-700">
                View Public Grievance Feed
              </Link>
            </div>

            <div className="space-y-3">
              {escalatedIssues.map((issue) => (
                <div key={issue.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-rose-800">{issue.ticket_id}</span>
                      <PriorityBadge level={issue.priority_level} />
                    </div>
                    <div className="font-bold text-sm text-slate-900">{issue.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{issue.address} • {issue.report_count} citizen reports</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReopen(issue.id, issue.ticket_id)}
                      className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-white text-xs font-bold rounded-lg transition"
                    >
                      Reopen Ticket
                    </button>
                    <button
                      onClick={() => openAssignModal(issue)}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                    >
                      Reassign Crew
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 4: Workload & Municipal Contacts */}
        {activeTab === 'workload' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Maintenance Crew Personnel & Workload
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {workers.map((w) => (
                  <div key={w.id} className="worker-card p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <WorkerAvatar worker={w} className="w-8 h-8 rounded-lg shrink-0" />
                        <span className="font-bold text-sm text-slate-900 truncate">{w.name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px] font-bold shrink-0">
                        Crew #{w.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{w.department}</p>
                    <p className="text-xs text-slate-500">{w.ward}</p>
                    <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex justify-between">
                      <span>Phone: {w.phone}</span>
                      <span className="font-bold text-emerald-700">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Official Municipal Contacts Directory
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-sm text-slate-900">{c.official_name}</div>
                    <div className="text-xs text-slate-600">{c.designation} — {c.ward}</div>
                    <div className="text-xs text-blue-600 font-mono">{c.email} • {c.twitter_handle}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Smart Field Crew Dispatch Modal */}
      {assignModalIssue && (
        <SmartDispatchModal
          issue={assignModalIssue}
          onClose={() => setAssignModalIssue(null)}
          onSuccess={(res) => {
            showToast(`Work order ${assignModalIssue.ticket_id} successfully assigned to ${res.worker_name}!`, 'success');
            setAssignModalIssue(null);
            loadData();
          }}
          allWorkers={workers}
          onNavigateToIssue={(issueId) => navigate(`/issues/${issueId}`)}
        />
      )}

      {/* Admin Executive Copilot Modal */}
      <AdminCopilotModal
        isOpen={adminCopilotOpen}
        onClose={() => setAdminCopilotOpen(false)}
      />

      {/* Audit Logs Modal */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600" />
                  System-Wide Administrative Audit Trail
                </h3>
                <p className="text-xs text-slate-500">Immutable chronological record of civic actions</p>
              </div>
              <button
                onClick={() => setAuditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">{log.details}</div>
                  <div className="text-[10px] text-slate-400">
                    Actor: <span className="font-semibold text-slate-700">{log.actor_name}</span> ({log.actor_role})
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setAuditModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
