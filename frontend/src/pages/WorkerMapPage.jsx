import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, HardHat, ArrowRight, ShieldCheck, Navigation, ExternalLink } from 'lucide-react';
import { CivicLeafletMap } from '../components/CivicLeafletMap';
import { openExternalNavigation } from '../services/osmGeocoding';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';

export const WorkerMapPage = () => {
  const { user } = useAuth();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workerLocation, setWorkerLocation] = useState(null);

  useEffect(() => {
    loadMarkers();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setWorkerLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.warn('Worker location not available:', err),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const loadMarkers = async () => {
    try {
      setLoading(true);
      const data = await api.getWorkerMapMarkers();
      setMarkers(data || []);
    } catch (err) {
      console.error('[CivicEye Worker Map] Error loading work orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const defaultCenter = markers.length > 0 && markers[0].latitude && markers[0].longitude
    ? [markers[0].latitude, markers[0].longitude]
    : [12.9716, 77.5946];

  const handleNavigate = (lat, lng) => {
    openExternalNavigation(lat, lng);
  };

  return (
    <div className="h-[calc(100vh-105px)] flex flex-col lg:flex-row overflow-hidden bg-slate-50 animate-fadeIn">
      {/* Left Sidebar: Assigned Tasks */}
      <div className="w-full lg:w-96 bg-white border-r border-slate-200 flex flex-col h-full z-20 shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-orange-600" />
              <span>Assigned Field Work Orders</span>
            </h2>
            <span className="font-mono text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-full">
              {markers.length} Assigned
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Displaying only tasks assigned to {user?.name || 'Worker'}
          </p>
        </div>

        {/* Assigned Orders List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {markers.length > 0 ? (
            markers.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/20 block transition shadow-2xs group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {m.ticket_id}
                  </span>
                  <StatusBadge status={m.status} size="sm" />
                </div>

                <h4 className="text-xs font-bold text-slate-900 group-hover:text-orange-700 transition">
                  {m.title || m.category}
                </h4>

                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{m.address || m.ward || 'Location pinned'}</span>
                </div>

                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  GPS: {Number(m.latitude).toFixed(4)}°, {Number(m.longitude).toFixed(4)}°
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <PriorityBadge level={m.priority_level} />
                  <span className="text-[11px] font-semibold text-slate-500">
                    {m.category}
                  </span>
                </div>

                {/* Google Maps External Directions Action */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleNavigate(m.latitude, m.longitude)}
                    className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 border border-blue-200 transition shadow-2xs cursor-pointer"
                    title="Open live Google Maps turn-by-turn navigation"
                  >
                    <Navigation className="w-3 h-3 text-blue-600" />
                    <span>NAVIGATE WITH GOOGLE MAPS</span>
                  </button>
                  <Link
                    to={`/worker/issues/${m.ticket_id}`}
                    className="py-1.5 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1 shrink-0 shadow-2xs"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No active field work orders assigned at this moment.
            </div>
          )}
        </div>

        {/* Security Isolation Footer Note */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Worker security active. Other city complaints are strictly restricted.</span>
        </div>
      </div>

      {/* Leaflet Street & Satellite Map View */}
      <div className="flex-1 h-full relative min-h-0">
        <CivicLeafletMap
          center={defaultCenter}
          zoom={14}
          height="100%"
          className="h-full w-full rounded-none border-0 shadow-none"
          workerMarkers={markers}
          currentLocation={workerLocation}
          role="worker"
          showLayerSwitcher={true}
        />
      </div>
    </div>
  );
};
