import React, { useState } from 'react';
import { HardHat, Upload, ShieldAlert, X, Camera } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const WorkerRepairModal = ({ isOpen, onClose, issue, onSuccess }) => {
  const { user, showToast } = useAuth();
  const [repairNotes, setRepairNotes] = useState('');
  const [materials, setMaterials] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !issue) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageBase64) {
      showToast('Please upload a genuine photograph showing the completed repair.', 'error');
      return;
    }
    if (!repairNotes.trim()) {
      showToast('Please describe the repair work conducted.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitRepair(issue.id, {
        worker_name: user.name || 'Municipal Road Crew',
        repair_notes: repairNotes,
        materials_used: materials,
        after_image_base64: imageBase64
      });

      showToast(res.message || 'Repair evidence submitted for AI verification!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showToast('Error submitting repair: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Submit Repair Evidence</h3>
              <p className="text-xs text-slate-600">Ticket: <span className="text-amber-800 font-mono font-bold">{issue.ticket_id}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guardrail Notice */}
        <div className="p-4 bg-amber-50/60 border-b border-amber-100 text-xs text-amber-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Civic Accountability Rule:</strong> Municipal workers cannot directly close a ticket. Submissions are processed by the OpenCV AI Fake-Fix Detector and validated through Community Ground-Truth Voting.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Photo Uploader */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Upload After Repair Photo
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-2xl p-4 text-center bg-slate-50">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-40 rounded-xl object-contain border border-slate-200 mx-auto shadow-sm"
                  />
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">Selected After-Repair Evidence</div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <Camera className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs text-slate-600">Click to upload photo evidence</span>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="worker-photo-upload"
              />
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <label
                  htmlFor="worker-photo-upload"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white cursor-pointer shadow-sm transition flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Choose Repair Photo</span>
                </label>
              </div>
            </div>
          </div>

          {/* Repair Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Repair Description & Method
            </label>
            <textarea
              required
              rows={2}
              value={repairNotes}
              onChange={(e) => setRepairNotes(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 p-3 text-xs text-slate-900 focus:outline-none"
              placeholder="Describe work completed, machinery utilized, and safety measures..."
            />
          </div>

          {/* Materials */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Materials & Specifications
            </label>
            <input
              type="text"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 p-2.5 text-xs text-slate-900 focus:outline-none"
              placeholder="e.g. Bitumen VG-30, crushed aggregate stone"
            />
          </div>

          {/* Action Buttons */}
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition"
            >
              <Upload className="w-4 h-4" />
              <span>{submitting ? 'Analyzing with CV...' : 'Submit for AI Verification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
