import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  RotateCcw, 
  FileSearch, 
  ShieldAlert, 
  CheckCircle2, 
  Flame,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DemoControlBar = ({ onActionTriggered }) => {
  const navigate = useNavigate();
  const { showToast } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      await api.resetDemoData();
      showToast('Demo database successfully reset and seeded!', 'success');
      if (onActionTriggered) onActionTriggered();
      navigate('/');
    } catch (err) {
      showToast('Error resetting demo: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFastForward = async () => {
    setLoading(true);
    try {
      await api.fastForwardTimer('CIV-2026-0007');
      showToast('48h SLA Expired! Level 1 email and public X bot escalation dispatched.', 'warning');
      if (onActionTriggered) onActionTriggered();
      navigate('/issues/CIV-2026-0007');
    } catch (err) {
      showToast('Error accelerating timer: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateFakeFix = async () => {
    setLoading(true);
    try {
      await api.simulateFakeFix('CIV-2026-0007');
      showToast('Worker uploaded indoor floor photo. AI CV Detector flagged Suspicious Repair Evidence!', 'error');
      if (onActionTriggered) onActionTriggered();
      navigate('/issues/CIV-2026-0007');
    } catch (err) {
      showToast('Error simulating fake fix: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateRealFix = async () => {
    setLoading(true);
    try {
      await api.simulateRealFix('CIV-2026-0007');
      showToast('Worker submitted genuine asphalt patch. AI Verified (89% Scene Match) -> Sent to Community Voting!', 'success');
      if (onActionTriggered) onActionTriggered();
      navigate('/issues/CIV-2026-0007');
    } catch (err) {
      showToast('Error simulating real fix: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border-b border-blue-200 px-4 py-2 sticky top-0 z-50 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Badge */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[11px] shadow-sm uppercase tracking-wide">
            <Sparkles className="w-3 h-3" />
            Hackathon Live Demo Bar
          </span>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 underline underline-offset-2 ml-1"
          >
            <Info className="w-3.5 h-3.5" />
            3-Min Demo Script
          </button>
        </div>

        {/* 1-Click Action Buttons for Judges */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/issues/CIV-2026-0007')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-blue-700 font-semibold border border-blue-200 shadow-sm transition"
          >
            <FileSearch className="w-3.5 h-3.5 text-blue-600" />
            Showcase: CIV-2026-0007 (57 Reports)
          </button>

          <button
            disabled={loading}
            onClick={handleFastForward}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold border border-rose-200 shadow-sm transition"
            title="Accelerate 48h timer to zero to trigger automated escalation email and X post"
          >
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            Simulate Timer Expiry (Escalate)
          </button>

          <button
            disabled={loading}
            onClick={handleSimulateFakeFix}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold border border-amber-200 shadow-sm transition"
            title="Simulate worker uploading a mismatched photo (AI flags scene mismatch)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Test AI Fake-Fix Detector
          </button>

          <button
            disabled={loading}
            onClick={handleSimulateRealFix}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 shadow-sm transition"
            title="Simulate worker uploading genuine repair photo"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Simulate Genuine Repair
          </button>

          <button
            disabled={loading}
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-sm transition"
            title="Reset to fresh demo dataset"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Collapsible 3-Minute Demonstration Guide */}
      {showGuide && (
        <div className="max-w-7xl mx-auto mt-2 p-3 rounded-xl bg-white border border-blue-200 shadow-card text-slate-700 text-xs animate-fadeIn">
          <div className="flex items-center justify-between font-bold text-blue-800 mb-2">
            <span>Official 3-Minute Hackathon Demonstration Script:</span>
            <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px] leading-relaxed">
            <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
              <span className="font-bold text-blue-700 block mb-1">1. Report & Duplicate Check</span>
              Go to "Report Issue", click "Demo: Test Duplicate Trigger". System warns with 85% duplicate confidence and merges into CIV-2026-0007 (+1 voice).
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100">
              <span className="font-bold text-rose-700 block mb-1">2. 48h SLA Escalation</span>
              Open CIV-2026-0007. Show live ticking countdown. Click "Simulate Timer Expiry" to trigger the official municipal email and public X accountability broadcast!
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              <span className="font-bold text-amber-800 block mb-1">3. AI Fake-Fix Detector</span>
              Click "Test AI Fake-Fix Detector". Worker uploads indoor floor. OpenCV evaluates RANSAC keypoint homography, detects 12% match, flags Suspicious Evidence!
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="font-bold text-emerald-800 block mb-1">4. Community Ground-Truth</span>
              Citizens cast ground-truth votes or admin inspects side-by-side evidence in Admin Hub to officially resolve the ticket with an audit trail!
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
