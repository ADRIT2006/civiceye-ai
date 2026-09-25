import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardHat,
  TrendingUp,
  BarChart3,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Compass
} from 'lucide-react';
import { TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import { CivicMapContainer } from '../components/CivicMapContainer';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

// Helper component to center map on selected ward
const WardMapFocus = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 13, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

export const AdminWardMapPage = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [geojson, setGeojson] = useState(null);
  const [wardList, setWardList] = useState([]);
  const [workloadList, setWorkloadList] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [filterZone, setFilterZone] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([12.9650, 77.5950]);
  const [mapZoom, setMapZoom] = useState(12);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, workloadRes] = await Promise.all([
        api.getWardMapStats(),
        api.getWardWorkload()
      ]);

      if (statsRes && statsRes.geojson) {
        setGeojson(statsRes.geojson);
        setWardList(statsRes.ward_summary || []);
        if (statsRes.ward_summary && statsRes.ward_summary.length > 0) {
          setSelectedWard(statsRes.ward_summary[0]);
        }
      }
      if (workloadRes) {
        setWorkloadList(workloadRes);
      }
    } catch (err) {
      console.error('Failed to load ward map data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWard = (ward) => {
    setSelectedWard(ward);
    // Calculate centroid from geojson coordinates if available
    const feature = geojson?.features?.find((f) => f.properties.id === ward.ward_id || f.properties.id === ward.id);
    if (feature && feature.geometry && feature.geometry.coordinates[0]) {
      const coords = feature.geometry.coordinates[0];
      const avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
      const avgLng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
      setMapCenter([avgLat, avgLng]);
      setMapZoom(13.5);
    }
  };

  const zones = ['All', ...new Set(wardList.map((w) => w.zone).filter(Boolean))];

  const filteredWards = wardList.filter((w) => {
    const matchesZone = filterZone === 'All' || w.zone === filterZone;
    const matchesSearch =
      w.ward_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.ward_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesZone && matchesSearch;
  });

  // Summary Metrics
  const totalWards = wardList.length;
  const totalOpen = wardList.reduce((acc, w) => acc + (w.open_issues || 0), 0);
  const totalWorkers = wardList.reduce((acc, w) => acc + (w.workers_assigned || 0), 0);
  const understaffedCount = workloadList.filter((w) => w.status === 'Understaffed').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fadeIn">
      {/* Top Banner & KPI Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 w-fit mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>BBMP MUNICIPAL JURISDICTION • 20 WARDS</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Municipal Ward GeoJSON Intelligence
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Polygon boundary inspection, real-time workload balancing, and maintenance crew density mapping.
            </p>
          </div>

          {/* Quick Action Links */}
          <div className="flex items-center gap-2">
            <Link
              to="/admin/workers"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
            >
              <HardHat className="w-4 h-4 text-orange-600" />
              <span>Worker Directory</span>
            </Link>
            <Link
              to="/admin/reports"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Verifiable Reports</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Wards</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalWards || 20}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Open Issues</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                {wardList.reduce((sum, w) => sum + (w.open_issues || 0) + (w.in_progress || 0), 0)}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Crews</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalWorkers || 25}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Understaffed Zones</p>
              <p className="text-xl font-extrabold text-red-600 mt-0.5">{understaffedCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Map + Ward Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-250px)] min-h-[550px]">
        {/* Left Ward Selector & Workload Balance List */}
        <div className="w-full lg:w-96 bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ward name or ID..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {zones.map((zone) => (
                <button
                  key={zone}
                  onClick={() => setFilterZone(zone)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition ${
                    filterZone === zone
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>

          {/* Wards Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredWards.map((w) => {
              const isSelected = selectedWard?.ward_id === w.ward_id || selectedWard?.id === w.ward_id;
              const workload = workloadList.find((wl) => wl.ward_id === w.ward_id);

              return (
                <div
                  key={w.ward_id}
                  onClick={() => handleSelectWard(w)}
                  className={`p-3 rounded-2xl border cursor-pointer transition text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full border border-white shadow-2xs shrink-0"
                        style={{ backgroundColor: w.color || '#3b82f6' }}
                      />
                      <span className="font-bold text-xs text-slate-900">{w.ward_name}</span>
                    </div>
                    <span className="font-mono text-[10px] font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {w.ward_id}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Zone: <strong className="text-slate-700">{w.zone}</strong></span>
                    <span>Crews: <strong className="text-slate-700">{w.workers_assigned}</strong></span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-600 font-bold">{w.open_issues} Open</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-600 font-bold">{w.resolved} Solved</span>
                    </div>

                    {workload && (
                      <span
                        className={`font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          workload.status === 'Understaffed'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : workload.status === 'Balanced'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {workload.status} ({workload.issue_to_worker_ratio}x)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Understaffed Warning Footer */}
          <div className="p-3 bg-amber-50/80 border-t border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Workload Optimization Alert:</span> Wards with ratio &gt;3.0 require crew reassignments from low-load zones.
            </div>
          </div>
        </div>

        {/* Center/Right: Interactive Leaflet GeoJSON Map */}
        <div className="flex-1 relative flex flex-col bg-slate-100 min-h-0">
          <CivicMapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            height="100%"
            className="w-full h-full rounded-none border-0 shadow-none z-0"
            overlay={
              (!geojson?.features || geojson.features.length === 0) ? (
                <div className="absolute top-4 left-14 z-[400] bg-white/95 backdrop-blur-md border border-amber-300 rounded-xl px-3.5 py-2 shadow-md text-xs font-bold text-amber-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Ward boundary data unavailable</span>
                </div>
              ) : null
            }
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <WardMapFocus center={mapCenter} zoom={mapZoom} />

            {/* Render GeoJSON Polygons */}
            {geojson &&
              geojson.features &&
              geojson.features.map((feature) => {
                const props = feature.properties;
                // Coordinates in geojson are [lng, lat], leaflet needs [lat, lng]
                const leafletPositions = feature.geometry.coordinates[0].map((coord) => [coord[1], coord[0]]);
                const isSelected = selectedWard && (selectedWard.ward_id === props.id || selectedWard.id === props.id);

                return (
                  <Polygon
                    key={props.id}
                    positions={leafletPositions}
                    pathOptions={{
                      color: isSelected ? '#1d4ed8' : props.color || '#3b82f6',
                      fillColor: props.color || '#3b82f6',
                      fillOpacity: isSelected ? 0.45 : 0.22,
                      weight: isSelected ? 3.5 : 1.8,
                      dashArray: isSelected ? '4, 4' : undefined
                    }}
                    eventHandlers={{
                      click: () => {
                        handleSelectWard(props);
                      }
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px] text-slate-900">
                        <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                          <strong className="text-xs font-extrabold text-blue-700">{props.name}</strong>
                          <span className="text-[10px] font-mono bg-blue-50 text-blue-800 px-1 rounded">
                            {props.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mb-1">
                          Zone: <strong>{props.zone}</strong>
                        </p>
                        <div className="grid grid-cols-2 gap-1 text-[11px] my-1 bg-slate-50 p-1.5 rounded">
                          <div>Open: <strong className="text-amber-700">{props.open_issues ?? 0}</strong></div>
                          <div>Assigned: <strong className="text-slate-800">{props.workers_assigned ?? 0}</strong></div>
                          <div>Resolved: <strong className="text-emerald-700">{props.resolved ?? 0}</strong></div>
                          <div>Critical: <strong className="text-red-700">{props.critical_issues ?? 0}</strong></div>
                        </div>
                        <button
                          onClick={() => handleSelectWard(props)}
                          className="mt-2 w-full py-1 bg-blue-600 text-white rounded text-[11px] font-bold hover:bg-blue-700 transition"
                        >
                          View Ward Dashboard
                        </button>
                      </div>
                    </Popup>
                  </Polygon>
                );
              })}
          </CivicMapContainer>

          {/* Floating Ward Quick Inspection Card (Bottom Overlay) */}
          {selectedWard && (
            <div className="absolute bottom-5 right-5 left-5 md:left-auto md:w-[420px] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xl p-4 z-20 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div>
                  <span className="text-[10px] font-mono font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {selectedWard.ward_id || selectedWard.id}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                    {selectedWard.ward_name || selectedWard.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Zone</span>
                  <span className="text-xs font-bold text-slate-800">{selectedWard.zone}</span>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center my-3">
                <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block">TOTAL ISSUES</span>
                  <span className="text-base font-extrabold text-slate-900">{selectedWard.total_issues ?? 0}</span>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-2 rounded-xl">
                  <span className="text-[10px] text-amber-700 font-bold block">OPEN / ACTIVE</span>
                  <span className="text-base font-extrabold text-amber-800">{selectedWard.open_issues ?? 0}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl">
                  <span className="text-[10px] text-emerald-700 font-bold block">RESOLVED</span>
                  <span className="text-base font-extrabold text-emerald-800">{selectedWard.resolved ?? 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                <span className="flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5 text-orange-600" />
                  <span>Assigned Crews: <strong>{selectedWard.workers_assigned ?? 0} Personnel</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Avg SLA: <strong>{selectedWard.avg_resolution_hours ?? 28.5}h</strong></span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/workers?ward=${encodeURIComponent(selectedWard.ward_name || selectedWard.name)}`}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Inspect Crews in Ward</span>
                </Link>
                <Link
                  to={`/admin/dashboard?ward=${encodeURIComponent(selectedWard.ward_name || selectedWard.name)}`}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <span>Issues</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
