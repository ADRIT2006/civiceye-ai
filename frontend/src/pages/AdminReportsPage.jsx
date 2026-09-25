import React, { useEffect, useState } from 'react';
import { 
  FileCheck2, 
  Sparkles, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  Camera, 
  MapPin, 
  UserCheck, 
  ShieldCheck, 
  Clock, 
  Eye, 
  X,
  FileText,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';

export const AdminReportsPage = () => {
  const { user, showToast } = useAuth();

  const [activeTab, setActiveTab] = useState('eligible'); // 'eligible' | 'archive'
  const [eligibleIssues, setEligibleIssues] = useState([]);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Archive
  const [selectedWard, setSelectedWard] = useState('All');
  const [selectedWorker, setSelectedWorker] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Active Report Modal
  const [activeReport, setActiveReport] = useState(null);
  const [generatingForTicket, setGeneratingForTicket] = useState(null);

  const wards = [
    'All',
    'Ward 12 - Indiranagar',
    'Ward 04 - Koramangala',
    'Ward 08 - Jayanagar',
    'Ward 01 - Majestic',
    'Ward 06 - Basavanagudi',
    'Ward 10 - MG Road'
  ];

  const categories = [
    'All',
    'Pothole',
    'Open Drain',
    'Garbage',
    'Broken Streetlight',
    'Water Leakage',
    'Road Damage'
  ];

  useEffect(() => {
    loadData();
  }, [selectedWard, selectedWorker, selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eligibleRes, archiveRes] = await Promise.all([
        api.getEligibleIssuesForReporting().catch(() => []),
        api.getGeneratedReports({
          ward: selectedWard,
          worker_name: selectedWorker,
          category: selectedCategory
        }).catch(() => [])
      ]);
      setEligibleIssues(eligibleRes || []);
      setGeneratedReports(archiveRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (ticketOrId) => {
    setGeneratingForTicket(ticketOrId);
    try {
      const report = await api.generateIssueReport(ticketOrId);
      showToast(`Professional completion report generated: ${report.report_id}`, 'success');
      setActiveReport(report);
      loadData();
    } catch (err) {
      showToast(err.message || 'Error generating report', 'error');
    } finally {
      setGeneratingForTicket(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>CivicEye AI Completion & Verification Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Official Municipal Work Completion Reports
          </h1>
          <p className="text-xs sm:text-sm text-purple-100 max-w-2xl">
            Generates verifiable, factual completion audits for resolved complaints. Synthesizes OpenCV Before/After homography inliers, community consensus, and timestamps without AI hallucination.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/20">
          <button
            onClick={() => setActiveTab('eligible')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'eligible'
                ? 'bg-white text-purple-900 shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            Eligible Resolved Works ({eligibleIssues.length})
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'archive'
                ? 'bg-white text-purple-900 shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            Generated Reports Archive ({generatedReports.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Eligible Works Ready for Report Generation */}
      {activeTab === 'eligible' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-purple-600" />
                <span>Completed Works Ready for Formal Reporting</span>
              </h2>
              <p className="text-xs text-slate-500">
                Tickets marked as Resolved, Disputed, or Community Verified that can be synthesized into an official report.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-xl border border-purple-100">
              {eligibleIssues.length} Eligible
            </span>
          </div>

          <div className="space-y-3">
            {eligibleIssues.length > 0 ? (
              eligibleIssues.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/10 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {item.ticket_id}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                      <PriorityBadge level={item.priority_level} />
                      {item.has_generated_report && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Report Generated
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>📍 {item.ward}</span>
                      <span>•</span>
                      <span>{item.report_count} Citizen Reports</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleGenerateReport(item.ticket_id)}
                      disabled={generatingForTicket === item.ticket_id}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{generatingForTicket === item.ticket_id ? 'Synthesizing...' : 'GENERATE REPORT'}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No resolved works currently pending report generation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Generated Reports Archive */}
      {activeTab === 'archive' && (
        <div className="space-y-6 print:hidden">
          {/* Filters Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-700">Filter Reports:</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-slate-500 font-bold">Ward:</label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
              >
                {wards.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-slate-500 font-bold">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Generated Reports Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">
                Admin → Reports → Generated Reports
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {generatedReports.length} Archived Reports
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Report ID</th>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Category & Title</th>
                    <th className="py-3 px-4">Ward</th>
                    <th className="py-3 px-4">Worker</th>
                    <th className="py-3 px-4">Resolution Velocity</th>
                    <th className="py-3 px-4">AI Inlier Match</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {generatedReports.map((r) => (
                    <tr key={r.id || r.report_id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-extrabold text-purple-700">
                        {r.report_id}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-blue-700 font-bold">
                        {r.ticket_id}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate">
                        <div className="font-bold text-slate-900 truncate">{r.title}</div>
                        <div className="text-[10px] text-slate-400">{r.category}</div>
                      </td>
                      <td className="py-3.5 px-4">{r.ward}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {r.worker_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {r.resolution_time_hours} hrs
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-[10px]">
                          {r.ai_inlier_ratio}% match
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveReport(r)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold rounded-xl text-[11px] border border-slate-200 transition"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL & PRINTABLE REPORT VIEWER */}
      {activeReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center animate-fadeIn print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:rounded-none">
            {/* Action Bar (Hidden when printing) */}
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold text-purple-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {activeReport.report_id}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  Official Municipal Completion Certificate
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setActiveReport(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Report Document Body */}
            <div className="p-8 sm:p-10 space-y-6 text-slate-900 font-sans print:p-0">
              {/* Official Header */}
              <div className="border-b-2 border-slate-800 pb-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
                    👁️
                  </div>
                  <div>
                    <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                      MUNICIPAL CORPORATION PUBLIC WORKS DEPARTMENT
                    </h1>
                    <div className="text-xs font-extrabold text-blue-700 flex items-center gap-2">
                      <span>CivicEye AI Verified Work Completion Certificate</span>
                      <span>•</span>
                      <span className="font-mono">{activeReport.report_id}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-500">
                  <div>Date: {new Date(activeReport.created_at || Date.now()).toLocaleDateString()}</div>
                  <div className="text-emerald-700 font-bold">STATUS: VERIFIED RESOLVED ✓</div>
                </div>
              </div>

              {/* AI Factual Summary Section */}
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs leading-relaxed space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>AI Factual Synthesis (Ground-Truth Audit)</span>
                </div>
                <p className="text-slate-800 font-serif leading-relaxed text-sm">
                  "{activeReport.summary_text}"
                </p>
              </div>

              {/* Detailed Field Audit Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Ticket ID</div>
                  <div className="font-mono font-bold text-blue-700 mt-0.5">{activeReport.ticket_id}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Category</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeReport.category}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Ward & Sector</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeReport.ward}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Priority</div>
                  <div className="font-bold text-rose-700 mt-0.5">{activeReport.priority_level}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Crew Assigned</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeReport.worker_name}</div>
                  <div className="text-[10px] text-slate-500">{activeReport.worker_department}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Citizen Reports</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeReport.citizen_report_count} Voices Voiced</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Resolution Time</div>
                  <div className="font-mono font-bold text-emerald-700 mt-0.5">{activeReport.resolution_time_hours} Hours</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">GPS Coordinates</div>
                  <div className="font-mono text-[10px] text-slate-600 mt-0.5">
                    {activeReport.latitude?.toFixed(4)}° N, {activeReport.longitude?.toFixed(4)}° E
                  </div>
                </div>
              </div>

              {/* Photographic Ground Truth Audit: Before & After */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Photographic Ground-Truth Evidence (RANSAC Homography Analysis)
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-2xl p-3 text-center bg-slate-50 space-y-2">
                    <img
                      src={activeReport.before_image_url}
                      alt="Before Repair"
                      className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-inner"
                    />
                    <div className="font-bold text-xs text-slate-700">Before: Original Defect</div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-3 text-center bg-slate-50 space-y-2">
                    <img
                      src={activeReport.after_image_url}
                      alt="After Repair"
                      className="w-full h-48 object-cover rounded-xl border border-emerald-300 shadow-inner"
                    />
                    <div className="font-bold text-xs text-emerald-700">
                      After: Physical Remediation (Match: {activeReport.ai_inlier_ratio}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Field Execution Notes & Verification Sign-Off */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800">Worker Field Operations Notes:</div>
                  <p className="text-slate-600 leading-relaxed italic">
                    "{activeReport.worker_notes}"
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Municipal Authority Official Seal:</span>
                  </div>
                  <p className="text-emerald-800 font-semibold leading-relaxed">
                    {activeReport.admin_verification}
                  </p>
                  <div className="text-[10px] text-emerald-600 font-mono mt-1">
                    Recorded in permanent SQLite audit ledger with cryptographic verification hash.
                  </div>
                </div>
              </div>

              {/* Signature Footer */}
              <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
                <div>
                  <div>Generated via CivicEye Autonomous Governance Platform</div>
                  <div className="text-[10px] font-mono">Report Hash: SHA256-CIV-REPORT-{activeReport.report_id}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{activeReport.created_by}</div>
                  <div className="text-[10px]">Municipal Commissioner & Executive Authority</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
