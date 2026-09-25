import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  HardHat, 
  ShieldAlert, 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Camera, 
  FileText, 
  CheckCircle2, 
  Play, 
  Sparkles,
  AlertTriangle,
  FileCheck2,
  Lock,
  Navigation
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { WorkerRepairModal } from '../components/WorkerRepairModal';

export const WorkerIssueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, showToast } = useAuth();

  const [issue, setIssue] = useState(null);
  const [forbiddenError, setForbiddenError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [workNote, setWorkNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  useEffect(() => {
    loadIssue();
  }, [id]);

  const loadIssue = async () => {
    try {
      setLoading(true);
      setForbiddenError(false);
      const data = await api.getWorkerIssueDetail(id);
      setIssue(data);
    } catch (err) {
      if (err.status === 403 || err.message?.includes('403')) {
        setForbiddenError(true);
      } else {
        showToast(err.message || 'Error loading work order', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = async () => {
    if (!issue) return;
    try {
      await api.startWorkOrder(issue.id);
      showToast(`Work started on ${issue.ticket_id}. Status transitioned to In Progress.`, 'success');
      loadIssue();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddWorkNote = async (e) => {
    e.preventDefault();
    if (!workNote.trim() || !issue) return;
    try {
      setNoteLoading(true);
      await api.addWorkNote(issue.id, workNote, user.name);
      showToast(`Work note recorded for ${issue.ticket_id}`, 'success');
      setWorkNote('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setNoteLoading(false);
    }
  };

  // 403 FORBIDDEN SCREEN ENFORCEMENT
  if (forbiddenError) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 animate-fadeIn">
        <div className="bg-white rounded-3xl border-2 border-rose-200 p-8 sm:p-10 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-mono font-bold">
              HTTP 403 FORBIDDEN
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              403 — This issue is not assigned to you.
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Under municipal operational protocol, maintenance personnel are strictly restricted to tickets specifically assigned to their worker ID. Complaint <strong>{id}</strong> is assigned to another crew lead or remains unassigned.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1">
            <div className="font-bold text-slate-800">Operational Boundaries:</div>
            <div>• Authenticated Worker: <strong>{user.name}</strong> ({user.department})</div>
            <div>• Assigned Work Orders: <strong>Authorized tasks available in Worker Dashboard</strong></div>
            <div>• Security Action: Attempt logged in system audit trail.</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/worker/dashboard')}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Return to My Assigned Issues
            </button>
            <button
              onClick={() => navigate('/worker/map')}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition"
            >
              View My Navigation Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !issue) {
    return (
      <div className="py-20 text-center text-slate-500 animate-pulse text-xs">
        Loading assigned work order details...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/worker/dashboard')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assigned Issues</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5">
            <HardHat className="w-3.5 h-3.5 text-amber-600" />
            <span>Assigned to You</span>
          </span>
        </div>
      </div>

      {/* Hero Issue Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
              {issue.ticket_id}
            </span>
            <StatusBadge status={issue.status} />
            <PriorityBadge level={issue.priority_level} />
          </div>

          <div className="text-xs font-mono text-slate-500">
            Created: {new Date(issue.created_at).toLocaleDateString()}
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {issue.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            {issue.description}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Category</div>
            <div className="font-bold text-slate-900 mt-0.5">{issue.category}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Location</div>
            <div className="font-bold text-slate-900 mt-0.5 truncate">{issue.address}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Municipal Ward</div>
            <div className="font-bold text-blue-700 mt-0.5">{issue.ward}</div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
          {issue.status !== 'In Progress' && issue.status !== 'Resolved' && (
            <button
              onClick={handleStartWork}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition active:scale-95"
            >
              <Play className="w-4 h-4" />
              <span>Start On-Site Work</span>
            </button>
          )}

          <button
            onClick={() => setRepairModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Submit Repair Evidence</span>
          </button>

          <Link
            to="/worker/copilot"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask Worker Copilot</span>
          </Link>

          {issue.latitude && issue.longitude && (
            <button
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${issue.latitude},${issue.longitude}`, '_blank', 'noopener,noreferrer')}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 shadow-xs transition active:scale-95 cursor-pointer"
              title="Open Google Maps turn-by-turn directions"
            >
              <Navigation className="w-4 h-4 text-amber-600" />
              <span>Navigate with Google Maps</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Photographic Ground Truth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Before Photo */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-slate-500" />
              Before Repair (Citizen Evidence)
            </span>
            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
              Original Inspection
            </span>
          </div>

          <img
            src={issue.before_image_url}
            alt="Before repair"
            className="w-full h-56 object-cover rounded-2xl border border-slate-200 shadow-inner"
          />
        </div>

        {/* After Photo or Upload Prompt */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              After Repair (Remediation Evidence)
            </span>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              OpenCV RANSAC Match
            </span>
          </div>

          {issue.after_image_url ? (
            <img
              src={issue.after_image_url}
              alt="After repair"
              className="w-full h-56 object-cover rounded-2xl border border-slate-200 shadow-inner"
            />
          ) : (
            <div className="h-56 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-2">
              <Camera className="w-8 h-8 text-slate-400" />
              <p className="text-xs text-slate-500 max-w-xs">
                No After-repair photo submitted yet. Capture completed work from the same camera angle.
              </p>
              <button
                onClick={() => setRepairModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                Upload Photo Evidence
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Field Operation Work Notes Log */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Append Field Operations Log Note</span>
        </h3>

        <form onSubmit={handleAddWorkNote} className="space-y-3">
          <textarea
            value={workNote}
            onChange={(e) => setWorkNote(e.target.value)}
            rows={3}
            placeholder="e.g. Cleared debris, applied 60/70 hot mix asphalt, compacted surface using mechanical roller..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:border-blue-500 shadow-inner"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!workNote.trim() || noteLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition"
            >
              {noteLoading ? 'Saving...' : 'Record Work Note'}
            </button>
          </div>
        </form>
      </div>

      {/* Repair Upload Modal */}
      <WorkerRepairModal
        isOpen={repairModalOpen}
        onClose={() => setRepairModalOpen(false)}
        issue={issue}
        onSuccess={() => {
          setRepairModalOpen(false);
          loadIssue();
        }}
      />
    </div>
  );
};
