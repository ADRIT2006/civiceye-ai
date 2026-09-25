import React, { useEffect, useState } from 'react';
import { 
  Filter, 
  MapPin, 
  Users, 
  Search, 
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { CivicMapWidget } from '../components/CivicMapWidget';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';

export const CivicMap = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedWard, setSelectedWard] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [showResolved, setShowResolved] = useState(true);
  const [search, setSearch] = useState('');

  const categories = ['All', 'Pothole', 'Open Drain', 'Garbage', 'Broken Streetlight', 'Water Leakage', 'Road Damage'];
  const statuses = ['All', 'Reported', 'In Progress', 'Community Verification', 'Resolved', 'Escalated', 'Disputed'];
  const wards = ['All', 'Ward 12 - Indiranagar', 'Ward 04 - Koramangala', 'Ward 08 - Jayanagar', 'Ward 01 - Majestic', 'Ward 06 - Basavanagudi', 'Ward 10 - MG Road'];
  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  useEffect(() => {
    loadIssues();
  }, [selectedCategory, selectedStatus, selectedWard, selectedPriority, showResolved, search]);

  const loadIssues = async () => {
    try {
      const data = await api.getIssues({
        category: selectedCategory,
        status: selectedStatus,
        ward: selectedWard,
        priority: selectedPriority,
        include_resolved: showResolved,
        search
      });
      setIssues(data);
    } catch (err) {
      console.error('Error fetching map issues:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-105px)] flex flex-col lg:flex-row overflow-hidden bg-slate-50">
      {/* Left Filter & Issues Sidebar */}
      <div className="w-full lg:w-96 bg-white border-r border-slate-200 flex flex-col h-full z-20 shadow-sm">
        {/* Search & Header */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              GIS Civic Map Explorer
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
              {issues.length} Issues
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket, road, ward..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition shadow-inner"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-100 space-y-3 text-xs bg-slate-50/60">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-600 block mb-1 font-bold">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-800 font-medium focus:border-blue-500 cursor-pointer shadow-sm"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-bold">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-800 font-medium focus:border-blue-500 cursor-pointer shadow-sm"
              >
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-600 block mb-1 font-bold">Ward</label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-800 font-medium focus:border-blue-500 cursor-pointer shadow-sm"
              >
                {wards.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-bold">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-200 p-2 text-slate-800 font-medium focus:border-blue-500 cursor-pointer shadow-sm"
              >
                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span>Show Resolved Issues</span>
            </label>
          </div>
        </div>

        {/* Scrollable Issues List in Sidebar */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              to={`/issues/${issue.ticket_id}`}
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm block transition group"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{issue.ticket_id}</span>
                <StatusBadge status={issue.status} size="sm" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {issue.title}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">📍 {issue.address}</p>
              
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span className="text-blue-700 font-bold">{issue.report_count} citizens</span>
                <span className="font-mono">{issue.priority_level} Priority</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Right Leaflet Full Map View (Light) */}
      <div className="flex-1 h-full relative">
        <CivicMapWidget issues={issues} height="100%" />
      </div>
    </div>
  );
};
