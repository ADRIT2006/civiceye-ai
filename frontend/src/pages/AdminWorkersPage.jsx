import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  HardHat,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Briefcase,
  Star,
  ShieldCheck,
  Edit3,
  Phone,
  ExternalLink,
  Plus,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { WorkerAvatar } from '../components/WorkerAvatar';

export const AdminWorkersPage = () => {
  const { showToast } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedWard, setSelectedWard] = useState(searchParams.get('ward') || 'All');
  const [selectedAvailability, setSelectedAvailability] = useState('All');
  const [selectedWorkload, setSelectedWorkload] = useState('All');

  // Modal states for updating worker
  const [activeWorkerModal, setActiveWorkerModal] = useState(null);
  const [editWard, setEditWard] = useState('');
  const [editAvailability, setEditAvailability] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminWorkers();
      setWorkers(data || []);
    } catch (err) {
      console.error('Failed to load workers:', err);
      showToast('Failed to load municipal workers directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (worker) => {
    setActiveWorkerModal(worker);
    setEditWard(worker.primary_ward);
    setEditAvailability(worker.availability);
    setEditStatus(worker.status);
  };

  const handleSaveWorkerChanges = async () => {
    if (!activeWorkerModal) return;
    try {
      setUpdating(true);
      await api.updateWorkerStatus(activeWorkerModal.id, {
        primary_ward: editWard,
        availability: editAvailability,
        status: editStatus
      });

      showToast(`Worker ${activeWorkerModal.name} updated successfully.`, 'success');
      setActiveWorkerModal(null);
      await loadWorkers();
    } catch (err) {
      console.error(err);
      showToast('Failed to update worker profile', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Derive unique departments and wards for filter options
  const departments = ['All', ...new Set(workers.map((w) => w.department).filter(Boolean))];
  const wards = ['All', ...new Set(workers.map((w) => w.primary_ward).filter(Boolean))];
  const availabilities = ['All', 'Available', 'On Duty', 'Busy', 'On Leave'];

  const filteredWorkers = workers.filter((w) => {
    const matchesDept = selectedDept === 'All' || w.department === selectedDept;
    const matchesWard = selectedWard === 'All' || w.primary_ward.toLowerCase().includes(selectedWard.toLowerCase());
    const matchesAvail = selectedAvailability === 'All' || w.availability === selectedAvailability;
    
    let matchesWorkload = true;
    if (selectedWorkload === 'Light') matchesWorkload = w.current_workload <= 1;
    else if (selectedWorkload === 'Normal') matchesWorkload = w.current_workload === 2 || w.current_workload === 3;
    else if (selectedWorkload === 'Heavy') matchesWorkload = w.current_workload >= 4;

    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.worker_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.phone?.includes(searchQuery);

    return matchesDept && matchesWard && matchesAvail && matchesWorkload && matchesSearch;
  });

  // KPI Metrics
  const totalCount = workers.length;
  const onDutyCount = workers.filter((w) => w.availability === 'On Duty').length;
  const availableCount = workers.filter((w) => w.availability === 'Available').length;
  const busyCount = workers.filter((w) => w.current_workload >= 3).length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100 w-fit mb-2">
              <HardHat className="w-3.5 h-3.5" />
              <span>MUNICIPAL CREW OPERATIONS • 25+ FIELD WORKERS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Maintenance Personnel Directory
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Field crew rosters, department assignments, real-time workload balancing, and SLA compliance.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/admin/ward-map"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
            >
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Inspect Ward Map</span>
            </Link>
            <button
              onClick={loadWorkers}
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition shadow-2xs"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Metric Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Personnel</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
              <span className="text-[11px] text-slate-500">All 5 Departments</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">On Active Duty</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{onDutyCount}</p>
              <span className="text-[11px] text-emerald-600 font-bold">Field Ready</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available for Task</span>
              <p className="text-2xl font-black text-blue-600 mt-1">{availableCount}</p>
              <span className="text-[11px] text-blue-600 font-bold">Standby Pool</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">High Workload (&ge;3)</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{busyCount}</p>
              <span className="text-[11px] text-amber-600 font-bold">Needs Balancing</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Controls Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by worker name, WRK code, phone, or skill..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            {/* Department Filter */}
            <div className="w-full md:w-56">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="All">All Departments</option>
                {departments.filter((d) => d !== 'All').map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Ward Filter */}
            <div className="w-full md:w-56">
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="All">All Wards</option>
                {wards.filter((w) => w !== 'All').map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Filter */}
            <div className="w-full md:w-44">
              <select
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {availabilities.map((a) => (
                  <option key={a} value={a}>
                    {a === 'All' ? 'All Availabilities' : a}
                  </option>
                ))}
              </select>
            </div>

            {/* Workload Filter */}
            <div className="w-full md:w-40">
              <select
                value={selectedWorkload}
                onChange={(e) => setSelectedWorkload(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="All">All Workload</option>
                <option value="Light">Light (&le;1 ticket)</option>
                <option value="Normal">Normal (2-3 tickets)</option>
                <option value="Heavy">Heavy (&ge;4 tickets)</option>
              </select>
            </div>
          </div>

          {/* Quick Active Filter Pill Tags */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Showing <strong className="text-slate-900">{filteredWorkers.length}</strong> of {totalCount} registered personnel
            </span>
            {(selectedDept !== 'All' || selectedWard !== 'All' || selectedAvailability !== 'All' || selectedWorkload !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedDept('All');
                  setSelectedWard('All');
                  setSelectedAvailability('All');
                  setSelectedWorkload('All');
                  setSearchQuery('');
                }}
                className="text-blue-600 font-bold hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Worker Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkers.map((worker) => {
            const isHeavyLoad = worker.current_workload >= 4;
            const isOptimalLoad = worker.current_workload <= 2;

            return (
              <div
                key={worker.id}
                className="worker-card bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between group min-w-0"
              >
                <div>
                  {/* Top Row: Avatar, Name, Worker Code */}
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <WorkerAvatar
                        worker={worker}
                        className="w-12 h-12 rounded-2xl shrink-0 shadow-2xs"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition truncate">
                            {worker.name}
                          </h3>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          {worker.worker_code}
                        </span>
                      </div>
                    </div>

                    {/* Availability Tag */}
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${
                        worker.availability === 'Available'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : worker.availability === 'On Duty'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : worker.availability === 'Busy'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {worker.availability}
                    </span>
                  </div>

                  {/* Department & Specialization */}
                  <div className="mt-3.5 space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 truncate">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{worker.department}</span>
                    </div>
                    {worker.specialization && (
                      <div className="text-[11px] text-slate-500 pl-5 break-words" style={{ overflowWrap: 'anywhere' }}>
                        Specialty: <span className="font-medium text-slate-700">{worker.specialization}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Primary: <strong className="text-slate-800">{worker.primary_ward}</strong></span>
                    </div>
                  </div>

                  {/* Workload & Performance Metrics Box */}
                  <div className="mt-4 bg-slate-50 rounded-2xl p-3 border border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Active Tasks</span>
                      <span
                        className={`text-sm font-black ${
                          isHeavyLoad ? 'text-amber-600' : 'text-slate-900'
                        }`}
                      >
                        {worker.current_workload} Jobs
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Completed</span>
                      <span className="text-sm font-black text-emerald-600">
                        {worker.completed_jobs}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Rating</span>
                      <span className="text-sm font-black text-slate-900 flex items-center justify-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {worker.rating || 4.8}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{worker.phone || '+91 98450 12345'}</span>
                    </span>
                    <span className="flex items-center gap-1 font-bold text-emerald-700">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{worker.sla_compliance_pct || 96}% SLA</span>
                    </span>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(worker)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Manage Roster</span>
                  </button>
                  <Link
                    to={`/admin/dashboard?worker=${worker.id}`}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border border-blue-100"
                    title="View Assigned Issues"
                  >
                    <span>Tasks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredWorkers.length === 0 && !loading && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
            <HardHat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Workers Match Filters</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your department, ward, or workload filter criteria.
            </p>
            <button
              onClick={() => {
                setSelectedDept('All');
                setSelectedWard('All');
                setSelectedAvailability('All');
                setSelectedWorkload('All');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Edit Worker Modal */}
      {activeWorkerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <WorkerAvatar
                  worker={activeWorkerModal}
                  className="w-10 h-10 rounded-xl shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900 truncate">
                    Manage {activeWorkerModal.name}
                  </h3>
                  <span className="font-mono text-xs text-slate-500 font-bold block truncate">
                    {activeWorkerModal.worker_code} • {activeWorkerModal.department}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveWorkerModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Primary Ward Reassignment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Assigned Ward
                </label>
                <select
                  value={editWard}
                  onChange={(e) => setEditWard(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {wards.filter((w) => w !== 'All').map((ward) => (
                    <option key={ward} value={ward}>
                      {ward}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Reassigning primary ward shifts worker's proximity priority for new automated dispatch.
                </p>
              </div>

              {/* Availability Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Availability Status
                </label>
                <select
                  value={editAvailability}
                  onChange={(e) => setEditAvailability(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Available">Available (Standby Pool)</option>
                  <option value="On Duty">On Duty (Active Field Operations)</option>
                  <option value="Busy">Busy (At Max Capacity)</option>
                  <option value="On Leave">On Leave (Unavailable)</option>
                </select>
              </div>

              {/* Operational Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operational Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Active">Active Crew Member</option>
                  <option value="Inactive">Inactive / Suspended</option>
                  <option value="Training">In Training</option>
                </select>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveWorkerModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWorkerChanges}
                disabled={updating}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {updating ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
