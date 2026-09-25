import React, { useState, useEffect, useMemo } from 'react';
import { 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  Polygon,
  useMap 
} from 'react-leaflet';
import { CivicMapContainer } from './CivicMapContainer';
import L from 'leaflet';
import { 
  HardHat, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Clock, 
  Check, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { WorkerAvatar } from './WorkerAvatar';

// Helper component to invalidate Leaflet map size on render & worker selection
const MapInvalidator = ({ selectedWorkerId }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (err) {
        console.warn('Map invalidateSize err:', err);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [map, selectedWorkerId]);
  return null;
};

// Helper component to auto-frame both Issue and Worker on the Leaflet map
const MapAutoFramer = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2 && bounds[0] && bounds[1]) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } catch (err) {
        console.warn('Map fitBounds err:', err);
      }
    }
  }, [bounds, map]);
  return null;
};

// Red marker for Issue location
const createIssueMarker = () => {
  const html = `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 40px; height: 40px; border-radius: 9999px; background: #ef4444; opacity: 0.25; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 28px; height: 28px; border-radius: 9999px; background: #ffffff; border: 3px solid #ef4444; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
        <div style="width: 10px; height: 10px; border-radius: 9999px; background: #ef4444;"></div>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-leaflet-issue-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Blue marker for Selected Worker base location
const createWorkerMarker = () => {
  const html = `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 38px; height: 38px; border-radius: 9999px; background: #2563eb; opacity: 0.25;"></div>
      <div style="width: 28px; height: 28px; border-radius: 9999px; background: #ffffff; border: 3px solid #2563eb; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
        <div style="width: 10px; height: 10px; border-radius: 9999px; background: #2563eb;"></div>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-leaflet-worker-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export const SmartDispatchModal = ({
  issue,
  onClose,
  onSuccess,
  allWorkers = [],
  onNavigateToIssue
}) => {
  if (!issue) return null;

  // Local state
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [recommendedWorkers, setRecommendedWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [currentAssignedWorker, setCurrentAssignedWorker] = useState(null);
  const [isReassignMode, setIsReassignMode] = useState(false);
  const [showAllWorkers, setShowAllWorkers] = useState(false);

  // Form options
  const [priority, setPriority] = useState(issue.priority_level || 'High');
  const [expectedCompletion, setExpectedCompletion] = useState('Within 24 Hours');
  const [instructions, setInstructions] = useState(
    'Inspect drain obstruction and clear blockage immediately. Upload before/after evidence after completion.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  // Full roster filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [wardFilter, setWardFilter] = useState('All');
  const [availFilter, setAvailFilter] = useState('All');
  const [sortBy, setSortBy] = useState('ai_match');

  // Wards GeoJSON for map polygon overlay
  const [wardPolygons, setWardPolygons] = useState([]);

  // 1. Fetch AI recommendations & issue details
  useEffect(() => {
    let isMounted = true;
    const loadRecommendations = async () => {
      try {
        setLoadingRecs(true);
        const res = await api.getRecommendedWorkers(issue.id);
        if (isMounted && res) {
          if (res.current_assigned_worker) {
            setCurrentAssignedWorker(res.current_assigned_worker);
          } else if (issue.assigned_worker_id) {
            const found = allWorkers.find(w => w.id === issue.assigned_worker_id);
            if (found) setCurrentAssignedWorker(found);
          }

          if (res.recommendations && res.recommendations.length > 0) {
            setRecommendedWorkers(res.recommendations);
            // Default selection to #1 recommendation
            setSelectedWorkerId(String(res.recommendations[0].worker_id));
          }
        }
      } catch (err) {
        console.warn('Recommendation API error, falling back locally:', err);
        // Fallback calculation locally without failing
        calculateLocalRecommendations();
      } finally {
        if (isMounted) setLoadingRecs(false);
      }
    };

    loadRecommendations();
    loadWardPolygons();

    return () => { isMounted = false; };
  }, [issue.id]);

  const loadWardPolygons = async () => {
    try {
      const data = await api.getPublicWardGeojson();
      if (data && data.features) {
        setWardPolygons(data.features);
      }
    } catch (e) {
      console.warn('Could not load ward polygons:', e);
    }
  };

  // Local fallback if backend recommendation endpoint is unreachable
  const calculateLocalRecommendations = () => {
    if (!allWorkers || allWorkers.length === 0) return;
    const isDrain = (issue.category || '').toLowerCase().includes('drain');
    const issueWard = (issue.ward || '').toLowerCase();

    const scored = allWorkers.map(w => {
      let score = 50;
      const adv = [];
      const dis = [];

      const isSameDept = isDrain && (w.department || '').toLowerCase().includes('drain');
      if (isSameDept) {
        score += 30;
        adv.push(`Specialized in ${w.department}`);
      } else {
        dis.push(`Different Department (${w.department})`);
      }

      const isSameWard = issueWard && (w.primary_ward || '').toLowerCase().includes('06');
      if (isSameWard) {
        score += 30;
        adv.push(`Assigned to ${w.primary_ward}`);
      } else {
        dis.push(`Primary Ward: ${w.primary_ward}`);
      }

      const dist = isSameWard ? 1.2 : 4.8;
      score += isSameWard ? 20 : 10;
      adv.push(`${dist} km from issue`);

      if (w.availability === 'Available') {
        score += 10;
        adv.push('Available Now');
      }

      const wl = w.current_workload || 0;
      score += Math.max(0, 10 - wl * 2);
      if (wl <= 1) adv.push(`Low Workload — ${wl} Active Job`);

      return {
        worker_id: w.id,
        worker_code: w.worker_code || `WRK-${w.id}`,
        name: w.name,
        department: w.department,
        specialization: w.specialization,
        primary_ward: w.primary_ward,
        availability: w.availability || 'Available',
        current_workload: wl,
        distance: `${dist} km away`,
        distance_km: dist,
        match_score: Math.min(96, score),
        reasons: [...adv.slice(0, 3), ...dis.slice(0, 1)],
        is_best_match: false,
        base_lat: 12.9475,
        base_lon: 77.5775
      };
    });

    scored.sort((a, b) => b.match_score - a.match_score);
    if (scored.length > 0) {
      scored[0].is_best_match = true;
      setSelectedWorkerId(String(scored[0].worker_id));
    }
    setRecommendedWorkers(scored.slice(0, 5));
  };

  // Find currently selected worker object
  const selectedWorker = useMemo(() => {
    if (!selectedWorkerId) return null;
    const inRecs = recommendedWorkers.find(r => String(r.worker_id) === String(selectedWorkerId));
    if (inRecs) return inRecs;
    const inAll = allWorkers.find(w => String(w.id) === String(selectedWorkerId));
    if (inAll) {
      return {
        worker_id: inAll.id,
        worker_code: inAll.worker_code || `WRK-${inAll.id}`,
        name: inAll.name,
        department: inAll.department,
        primary_ward: inAll.primary_ward,
        availability: inAll.availability,
        current_workload: inAll.current_workload || 0,
        distance: 'Approx. base distance',
        distance_km: 3.5,
        match_score: 65,
        reasons: [`Field crew member: ${inAll.department}`, `Base: ${inAll.primary_ward}`],
        estimated_response: '35 minutes (Estimated)',
        base_lat: 12.9475,
        base_lon: 77.5775
      };
    }
    return null;
  }, [selectedWorkerId, recommendedWorkers, allWorkers]);

  // Full worker roster filtering
  const filteredAllWorkers = useMemo(() => {
    return allWorkers.filter(w => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = (w.name || '').toLowerCase().includes(q);
        const matchesCode = (w.worker_code || '').toLowerCase().includes(q);
        const matchesDept = (w.department || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDept) return false;
      }
      if (deptFilter !== 'All' && w.department !== deptFilter) return false;
      if (wardFilter !== 'All' && !(w.primary_ward || '').includes(wardFilter)) return false;
      if (availFilter !== 'All' && w.availability !== availFilter) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'workload') return (a.current_workload || 0) - (b.current_workload || 0);
      if (sortBy === 'distance') {
        const aSame = (a.primary_ward || '').includes('06') ? 1 : 2;
        const bSame = (b.primary_ward || '').includes('06') ? 1 : 2;
        return aSame - bSame;
      }
      // default: active status first
      return (b.availability === 'Available' ? 1 : 0) - (a.availability === 'Available' ? 1 : 0);
    });
  }, [allWorkers, searchQuery, deptFilter, wardFilter, availFilter, sortBy]);

  // Handle assignment submission
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorker) return;

    try {
      setSubmitting(true);
      const payload = {
        worker_id: selectedWorker.worker_id,
        worker_name: selectedWorker.name,
        department: selectedWorker.department,
        priority: priority,
        expected_completion: expectedCompletion,
        instructions: instructions,
        assigned_by: 'Dr. Arvind Verma (Admin)'
      };

      const res = await api.assignWorker(issue.id, payload);

      setSuccessResult({
        ticket_id: issue.ticket_id,
        worker_name: selectedWorker.name,
        department: selectedWorker.department,
        ward: selectedWorker.primary_ward,
        priority: priority,
        expected_completion: expectedCompletion
      });

      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      console.error('Assignment failed:', err);
      alert('Failed to assign worker: ' + (err.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Map coordinates
  const issueCoords = [
    issue.latitude !== undefined && issue.latitude !== null ? issue.latitude : 12.9515,
    issue.longitude !== undefined && issue.longitude !== null ? issue.longitude : 77.5684
  ];

  const workerCoords = useMemo(() => {
    if (selectedWorker && selectedWorker.base_lat && selectedWorker.base_lon) {
      return [selectedWorker.base_lat, selectedWorker.base_lon];
    }
    // Default fallback to Basavanagudi base station
    return [12.9475, 77.5775];
  }, [selectedWorker]);

  const mapBounds = useMemo(() => {
    return [issueCoords, workerCoords];
  }, [issueCoords, workerCoords]);

  // Relevant ward polygon features
  const highlightedWards = useMemo(() => {
    if (!wardPolygons || wardPolygons.length === 0) return [];
    const issueWardNum = (issue.ward || '').toLowerCase();
    const workerWardNum = (selectedWorker?.primary_ward || '').toLowerCase();

    return wardPolygons.filter(f => {
      const name = (f.properties?.name || '').toLowerCase();
      const id = (f.properties?.id || '').toLowerCase();
      return name.includes('06') || name.includes('18') || 
             issueWardNum.includes(name) || workerWardNum.includes(name);
    });
  }, [wardPolygons, issue.ward, selectedWorker]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="dispatch-modal rounded-3xl shadow-2xl border border-slate-200 flex flex-col"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-orange-100 text-orange-600">
                <HardHat className="w-5 h-5" />
              </span>
              <h2 className="font-extrabold text-slate-900 text-lg tracking-tight">
                Smart Field Crew Dispatch
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600 font-medium">
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-blue-700">
                Ticket: {issue.ticket_id}
              </span>
              <span>•</span>
              <span>Category: <strong className="text-slate-800">{issue.category}</strong></span>
              <span>•</span>
              <span>Ward: <strong className="text-slate-800">{issue.ward}</strong></span>
              <span>•</span>
              <span>Priority: <strong className="text-rose-600">{issue.priority_level || 'High'}</strong></span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUCCESS CONFIRMATION VIEW */}
        {successResult ? (
          <div className="p-8 text-center space-y-6 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Operation Dispatched
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                WORKER ASSIGNED SUCCESSFULLY
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {successResult.ticket_id}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 max-w-md mx-auto text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Assigned To:</span>
                <span className="font-bold text-slate-900 text-sm">{successResult.worker_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-semibold text-slate-800">{successResult.department}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Primary Ward:</span>
                <span className="font-semibold text-slate-800">{successResult.ward}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Priority SLA:</span>
                <span className="font-bold text-rose-600">{successResult.priority}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Expected Resolution:</span>
                <span className="font-semibold text-slate-800">{successResult.expected_completion}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              {onNavigateToIssue && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToIssue(issue.id);
                  }}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>VIEW ISSUE</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                <span>CLOSE</span>
              </button>
            </div>
          </div>
        ) : (
          /* SCROLLABLE FORM BODY */
          <div className="dispatch-modal-body p-6 space-y-6 flex-1">
            {/* 1. DOUBLE ASSIGNMENT WARNING BANNER */}
            {currentAssignedWorker && (
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase font-extrabold tracking-wider text-amber-700">
                      CURRENTLY ASSIGNED TO
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {currentAssignedWorker.name}
                    </div>
                    <div className="text-xs text-amber-800">
                      {currentAssignedWorker.department} • {currentAssignedWorker.primary_ward || currentAssignedWorker.ward}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                  >
                    KEEP ASSIGNMENT
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReassignMode(true)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition"
                  >
                    REASSIGN WORKER
                  </button>
                </div>
              </div>
            )}

            {/* 2. AI RECOMMENDED PERSONNEL (TOP 5) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-purple-100 text-purple-700">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    AI RECOMMENDED PERSONNEL
                  </h3>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    Top {recommendedWorkers.length || 5}
                  </span>
                </div>

                {loadingRecs && (
                  <span className="text-[11px] text-purple-600 font-semibold flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Calculating 5-factor suitability...
                  </span>
                )}
              </div>

              {recommendedWorkers.length > 0 ? (
                <div className="space-y-2.5">
                  {recommendedWorkers.map((rec) => {
                    const isSelected = String(selectedWorkerId) === String(rec.worker_id);
                    const isAvailable = rec.availability === 'Available';
                    const isWorking = rec.availability === 'Working';

                    return (
                      <div
                        key={rec.worker_id}
                        onClick={() => setSelectedWorkerId(String(rec.worker_id))}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row items-start justify-between gap-3 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Worker Details */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <WorkerAvatar
                            worker={rec}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 mt-0.5"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900">
                                {rec.name}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {rec.worker_code}
                              </span>
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                                {rec.department}
                              </span>
                              <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                ⭐ AI Match {rec.match_score}%
                              </span>
                              {rec.is_best_match && (
                                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  ✨ BEST MATCH
                                </span>
                              )}
                            </div>

                            {/* Location & Workload Row */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1.5">
                              <span className="font-semibold text-slate-800 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                {rec.primary_ward}
                              </span>
                              <span>•</span>
                              <span className="font-bold text-blue-700">
                                📍 {rec.distance || '1.2 km away'}
                              </span>
                              <span>•</span>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                isAvailable
                                  ? 'text-emerald-700 bg-emerald-50'
                                  : isWorking
                                  ? 'text-amber-700 bg-amber-50'
                                  : 'text-rose-700 bg-rose-50'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isAvailable ? 'bg-emerald-500' : isWorking ? 'bg-amber-500' : 'bg-rose-500'
                                }`} />
                                {rec.availability}
                              </span>
                              <span>•</span>
                              <span className="text-slate-500 font-medium">
                                Active Backlog: <strong>{rec.current_workload} jobs</strong>
                              </span>
                            </div>

                            {/* Transparent AI Match Reasons */}
                            {rec.reasons && rec.reasons.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {rec.reasons.map((r, i) => {
                                  const isNeg = r.includes('⚠') || r.includes('Different') || r.includes('Primary Ward:') || r.includes('High Workload');
                                  return (
                                    <span
                                      key={i}
                                      className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                                        isNeg
                                          ? 'bg-amber-50/80 text-amber-800 border-amber-200'
                                          : 'bg-slate-50 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      {isNeg ? r : `✓ ${r}`}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Radio selection */}
                        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center mt-2 sm:mt-0">
                          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}>
                            {isSelected ? 'SELECTED' : 'SELECT'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                !loadingRecs && (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                    No specific automated recommendations generated. Choose from the roster below.
                  </p>
                )
              )}

              {/* VIEW MORE WORKERS TOGGLE */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAllWorkers(!showAllWorkers)}
                  className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-slate-400 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  <span>{showAllWorkers ? 'HIDE COMPLETE ROSTER' : 'VIEW ALL AVAILABLE WORKERS'}</span>
                  {showAllWorkers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* FULL ROSTER ACCORDION DRAWER */}
              {showAllWorkers && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Complete Municipal Worker Directory ({allWorkers.length} Personnel)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Manual Admin Override Filter
                    </span>
                  </div>

                  {/* Search & Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl p-1.5 text-slate-700 focus:outline-none"
                    >
                      <option value="All">All Departments</option>
                      <option value="Drainage">Drainage</option>
                      <option value="Road Maintenance">Road Maintenance</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Water Supply">Water Supply</option>
                      <option value="Sanitation">Sanitation</option>
                      <option value="Emergency Maintenance">Emergency Maintenance</option>
                    </select>

                    <select
                      value={availFilter}
                      onChange={(e) => setAvailFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl p-1.5 text-slate-700 focus:outline-none"
                    >
                      <option value="All">All Availability</option>
                      <option value="Available">Available</option>
                      <option value="Working">Working</option>
                      <option value="Off Duty">Off Duty</option>
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl p-1.5 text-slate-700 focus:outline-none"
                    >
                      <option value="ai_match">Sort: AI Match / Default</option>
                      <option value="distance">Sort: Distance (Proximity)</option>
                      <option value="workload">Sort: Workload (Lowest first)</option>
                    </select>
                  </div>

                  {/* Roster List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {filteredAllWorkers.length > 0 ? (
                      filteredAllWorkers.map((w) => {
                        const isSelected = String(selectedWorkerId) === String(w.id);
                        return (
                          <div
                            key={w.id}
                            onClick={() => setSelectedWorkerId(String(w.id))}
                            className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                              isSelected
                                ? 'bg-blue-50 border-blue-400 font-semibold text-blue-900'
                                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{w.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({w.worker_code})</span>
                              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                {w.department}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {w.primary_ward}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-500">
                                {w.current_workload || 0} jobs
                              </span>
                              <span className={`w-2 h-2 rounded-full ${
                                w.availability === 'Available' ? 'bg-emerald-500' : 'bg-amber-500'
                              }`} />
                              <input
                                type="radio"
                                name="manual_worker"
                                checked={isSelected}
                                onChange={() => setSelectedWorkerId(String(w.id))}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-xs text-slate-400 py-3">
                        No workers match your filter criteria.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. SELECTED WORKER SECTION */}
            {selectedWorker && (
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    SELECTED WORKER
                  </h4>
                  <span className="text-xs font-black text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                    Match: {selectedWorker.match_score || 94}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-blue-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Personnel</div>
                    <div className="font-extrabold text-slate-900 text-sm">{selectedWorker.name}</div>
                    <div className="text-slate-600 text-[11px]">{selectedWorker.department} Department</div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Station & Proximity</div>
                    <div className="font-bold text-slate-900">{selectedWorker.primary_ward || selectedWorker.ward}</div>
                    <div className="text-blue-700 font-bold text-[11px]">📍 {selectedWorker.distance || '1.2 km from Issue'}</div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Backlog & ETA</div>
                    <div className="font-bold text-slate-900">
                      Workload: {selectedWorker.current_workload || 1} Active {(selectedWorker.current_workload || 1) === 1 ? 'Job' : 'Jobs'}
                    </div>
                    <div className="text-emerald-700 font-semibold text-[11px]">
                      Est. Response: {selectedWorker.estimated_response || '25 minutes (Estimated)'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ISSUE & WORKER LOCATION MAP (STRICTLY CONTAINED & ISOLATED) */}
            <div className="dispatch-map-section space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  Issue &amp; Worker Location
                </h3>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-rose-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Issue Location
                  </span>
                  <span className="flex items-center gap-1 text-blue-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Worker Base
                  </span>
                </div>
              </div>

              {/* Leaflet map inside strict isolated clipping container */}
              <CivicMapContainer
                center={issueCoords}
                zoom={14}
                scrollWheelZoom={false}
                height="280px"
                className="dispatch-map-clip"
                resizeTrigger={selectedWorkerId}
              >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Ward polygons overlay */}
                  {highlightedWards.map((feature, idx) => {
                    const coords = feature.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
                    const isIssueWard = (feature.properties?.name || '').includes('06');
                    return (
                      <Polygon
                        key={idx}
                        positions={coords}
                        pathOptions={{
                          color: isIssueWard ? '#f59e0b' : '#3b82f6',
                          weight: 1.5,
                          fillColor: isIssueWard ? '#f59e0b' : '#3b82f6',
                          fillOpacity: 0.12,
                          dashArray: '4, 4'
                        }}
                      />
                    );
                  })}

                  {/* Issue Marker (Red) */}
                  <Marker position={issueCoords} icon={createIssueMarker()}>
                    <Popup className="civic-map-popup">
                      <div className="text-xs p-1 space-y-1">
                        <div className="font-extrabold text-rose-600">🚨 Issue: {issue.ticket_id}</div>
                        <div className="font-bold text-slate-800">{issue.category}</div>
                        <div className="text-slate-500">{issue.ward}</div>
                        <div className="text-[10px] text-slate-400">{issue.address}</div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Selected Worker Marker (Blue) */}
                  <Marker position={workerCoords} icon={createWorkerMarker()}>
                    <Popup className="civic-map-popup">
                      <div className="text-xs p-1 space-y-1">
                        <div className="font-extrabold text-blue-600">👷 {selectedWorker?.name || 'Maintenance Crew'}</div>
                        <div className="font-bold text-slate-800">{selectedWorker?.department || 'Drainage'}</div>
                        <div className="text-slate-500">Base Station: {selectedWorker?.primary_ward || issue.ward}</div>
                        <div className="text-[10px] text-emerald-600 font-bold">Status: {selectedWorker?.availability || 'Available'}</div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Connection Line between Worker and Issue */}
                  <Polyline
                    positions={[workerCoords, issueCoords]}
                    pathOptions={{
                      color: '#2563eb',
                      weight: 2.5,
                      dashArray: '6, 6',
                      opacity: 0.8
                    }}
                  />

                  {/* Invalidate size on mount and worker change */}
                  <MapInvalidator selectedWorkerId={selectedWorkerId} />

                  {/* Automatically zoom/fit to frame both markers */}
                  <MapAutoFramer bounds={mapBounds} />
              </CivicMapContainer>
            </div>

            {/* 5. ASSIGNMENT OPTIONS */}
            <form onSubmit={handleAssignSubmit} className="space-y-4 pt-2 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Priority Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Assignment Priority:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Normal', 'High', 'Urgent'].map((p) => {
                      const isPSelected = priority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-2 px-2 text-xs font-bold rounded-xl border transition text-center ${
                            isPSelected
                              ? p === 'Urgent'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                : p === 'High'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expected Completion */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Expected Completion:
                  </label>
                  <select
                    value={expectedCompletion}
                    onChange={(e) => setExpectedCompletion(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Today">Today (Immediate shift)</option>
                    <option value="Within 24 Hours">Within 24 Hours (Standard SLA)</option>
                    <option value="Within 48 Hours">Within 48 Hours (Statutory deadline)</option>
                    <option value="Custom">Custom Schedule</option>
                  </select>
                </div>
              </div>

              {/* Instructions / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Instructions / Field Notes:
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Inspect blocked drain and clear obstruction. Upload before/after evidence after completion."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-slate-300 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={!selectedWorkerId || submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>DISPATCHING...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isReassignMode ? 'CONFIRM REASSIGNMENT' : 'ASSIGN WORKER'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
