import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  UserCheck, 
  HardHat, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle,
  Clock,
  Layers
} from 'lucide-react';
import { api, API_URL } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CountdownTimer } from '../components/CountdownTimer';
import { formatStatus } from '../utils/statusUtils';

export const AdminIssuesPage = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assignedFilter, setAssignedFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const categories = [
    'All',
    'Pothole',
    'Open Drain',
    'Broken Streetlight',
    'Garbage',
    'Water Leakage',
    'Road Damage',
    'Electrical Hazard',
    'Open Manhole',
    'Public Infrastructure',
    'Other'
  ];

  const statuses = [
    'All',
    'REPORTED',
    'ACKNOWLEDGED',
    'ASSIGNED',
    'IN_PROGRESS',
    'REPAIR_SUBMITTED',
    'UNDER_REVIEW',
    'RESOLVED',
    'REOPENED',
    'ESCALATED'
  ];

  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const assignmentOptions = ['All', 'Assigned', 'Unassigned'];

  useEffect(() => {
    loadIssues();
  }, [statusFilter, categoryFilter, priorityFilter, assignedFilter, dateFrom, dateTo]);

  const loadIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (priorityFilter !== 'All') params.priority = priorityFilter;
      if (assignedFilter !== 'All') params.assigned_state = assignedFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const data = await api.getAdminIssues(params);
      setIssues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load admin issues:', err);
      setError(err.message || 'Unable to fetch issues from backend database.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadIssues();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setPriorityFilter('All');
    setAssignedFilter('All');
    setDateFrom('');
    setDateTo('');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              All Civic Grievances &amp; Issues
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centrally monitor, filter, and review all citizen-submitted grievances directly from the SQLite database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadIssues}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/admin/dashboard"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            Command Center
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        {/* Top Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Ticket ID (e.g. CIV-2026-000001), Location, or Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
          >
            Search
          </button>
        </form>

        {/* Multi-Criteria Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-800"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>{st === 'All' ? 'All Statuses' : formatStatus(st)}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-800"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-800"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>
              ))}
            </select>
          </div>

          {/* Assignment State */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Assignment</label>
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-800"
            >
              {assignmentOptions.map((a) => (
                <option key={a} value={a}>{a === 'All' ? 'All (Assigned & Unassigned)' : a}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full p-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs text-slate-800"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full p-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs text-slate-800"
            />
          </div>
        </div>

        {/* Active Filters and Reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="font-semibold text-slate-700">
            Found <span className="text-indigo-600 font-extrabold">{issues.length}</span> matching civic issues in database
          </div>
          {(searchTerm || statusFilter !== 'All' || categoryFilter !== 'All' || priorityFilter !== 'All' || assignedFilter !== 'All' || dateFrom || dateTo) && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadIssues} className="font-bold underline text-amber-950">Retry</button>
        </div>
      )}

      {/* Content State */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Querying SQLite database...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-md mx-auto space-y-3">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Issues Found</h3>
          <p className="text-xs text-slate-500">
            No complaints match the current filter and search criteria in the database.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Issues Table / Cards */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Ticket ID</th>
                  <th className="py-3.5 px-4">Evidence</th>
                  <th className="py-3.5 px-4">Category &amp; Details</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Worker</th>
                  <th className="py-3.5 px-4">Reported</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50/70 transition">
                    {/* Ticket ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      <Link to={`/issues/${issue.ticket_id}`} className="hover:underline">
                        {issue.ticket_id}
                      </Link>
                    </td>

                    {/* Photo */}
                    <td className="py-3.5 px-4">
                      <img
                        src={getPhotoUrl(issue)}
                        alt={issue.title}
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-xs"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/uploads/before/pothole_main_before.jpg';
                        }}
                      />
                    </td>

                    {/* Category & Title */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">
                        {issue.title || `${issue.category} Complaint`}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {issue.description}
                      </div>
                      <span className="inline-block mt-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {issue.category}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 max-w-[180px]">
                      <div className="flex items-center gap-1 text-slate-800 font-semibold truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{issue.address}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {issue.latitude?.toFixed(4)}°, {issue.longitude?.toFixed(4)}°
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge level={issue.priority_level} score={issue.priority_score} size="sm" />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={issue.status} size="sm" />
                    </td>

                    {/* Assigned Worker */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {issue.assigned_worker_name ? (
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <HardHat className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{issue.assigned_worker_name}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Reported Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                      <div>{formatDate(issue.created_at)}</div>
                      <div className="text-[10px] text-slate-400">
                        {issue.report_count || 1} {issue.report_count === 1 ? 'report' : 'reports'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/issues/${issue.ticket_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
