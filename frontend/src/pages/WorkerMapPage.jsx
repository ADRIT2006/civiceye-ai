import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, HardHat, ArrowRight, ShieldCheck, Flame, Layers } from 'lucide-react';
import { TileLayer, Marker, Popup } from 'react-leaflet';
import { CivicMapContainer } from '../components/CivicMapContainer';
import L from 'leaflet';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';

const workerPinIcon = L.divIcon({
  html: `<div style="width: 32px; height: 32px; border-radius: 9999px; background: #ea580c; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(234,88,12,0.4); display: flex; items-center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">👷</div>`,
  className: 'worker-pin',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

export const WorkerMapPage = () => {
  const { user } = useAuth();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarkers();
  }, []);

  const loadMarkers = async () => {
    try {
      setLoading(true);
      const data = await api.getWorkerMapMarkers();
      setMarkers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const defaultCenter = markers.length > 0
    ? [markers[0].latitude, markers[0].longitude]
    : [12.9716, 77.5946];

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
            Displaying only tasks assigned to {user.name}
          </p>
        </div>

        {/* Assigned Orders List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {markers.length > 0 ? (
            markers.map((m) => (
              <Link
                key={m.id}
                to={`/worker/issues/${m.ticket_id}`}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/20 block transition shadow-2xs group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {m.ticket_id}
                  </span>
                  <StatusBadge status={m.status} size="sm" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-orange-700 transition">
                  {m.title}
                </h4>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{m.address || m.ward}</span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <PriorityBadge level={m.priority_level} />
                  <span className="text-orange-700 font-bold flex items-center gap-1">
                    Open Ticket <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
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

      {/* Map View */}
      <div className="flex-1 h-full relative min-h-0">
        <CivicMapContainer
          center={defaultCenter}
          zoom={14}
          scrollWheelZoom={true}
          height="100%"
          className="h-full w-full rounded-none border-0 shadow-none"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((m) => (
            <Marker
              key={m.id}
              position={[m.latitude, m.longitude]}
              icon={workerPinIcon}
            >
              <Popup autoPan={false}>
                <div className="p-1 font-sans text-xs space-y-1">
                  <div className="font-mono font-bold text-blue-700">{m.ticket_id}</div>
                  <div className="font-extrabold text-slate-900">{m.title}</div>
                  <div className="text-slate-500 text-[11px]">{m.address}</div>
                  <div className="pt-1.5">
                    <Link
                      to={`/worker/issues/${m.ticket_id}`}
                      className="inline-block px-2.5 py-1 bg-orange-600 text-white rounded text-[11px] font-bold"
                    >
                      Open Work Order
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </CivicMapContainer>
      </div>
    </div>
  );
};
