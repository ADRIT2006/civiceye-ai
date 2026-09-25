import React, { useEffect, useState } from 'react';
import { TileLayer, Marker, Popup, Polygon, Tooltip } from 'react-leaflet';
import { CivicMapContainer } from './CivicMapContainer';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { CountdownTimer } from './CountdownTimer';
import { Users, ThumbsUp, ArrowRight, Layers, Compass } from 'lucide-react';
import { api } from '../services/api';

// Custom SVG map marker generator for Light Theme
const createCustomMarker = (status, priorityLevel) => {
  let color = '#0284c7'; // Sky / blue
  let pulse = false;

  if (status === 'Escalated') {
    color = '#e11d48'; // Rose/Red
    pulse = true;
  } else if (status === 'Resolved') {
    color = '#059669'; // Emerald
  } else if (status === 'In Progress') {
    color = '#2563eb'; // Royal Blue
  } else if (status === 'Community Verification') {
    color = '#d97706'; // Amber / Orange
  } else if (status === 'Disputed') {
    color = '#ea580c'; // Orange
  }

  const isCritical = priorityLevel === 'Critical';

  const html = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      ${pulse || isCritical ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: ${color}; opacity: 0.25; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
      <div style="width: 30px; height: 30px; border-radius: 9999px; background: #ffffff; border: 3px solid ${color}; box-shadow: 0 4px 10px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center;">
        <div style="width: 12px; height: 12px; border-radius: 9999px; background: ${color};"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-leaflet-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

export const CivicMapWidget = ({
  issues = [],
  center = [12.9716, 77.5946],
  zoom = 13,
  height = '500px',
  initialShowWards = true
}) => {
  const [wardFeatures, setWardFeatures] = useState([]);
  const [showWards, setShowWards] = useState(initialShowWards);

  useEffect(() => {
    loadWardBoundaries();
  }, []);

  const loadWardBoundaries = async () => {
    try {
      const data = await api.getPublicWardGeojson();
      if (data && data.features) {
        setWardFeatures(data.features);
      }
    } catch (err) {
      console.warn('Failed to load public ward geojson:', err);
    }
  };

  return (
    <CivicMapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      height={height}
      className="border border-slate-200 shadow-sm"
      overlay={
        /* Floating Ward Layer Toggle Control */
        <div className="absolute top-3 right-3 z-[400]">
          <button
            type="button"
            onClick={() => setShowWards(!showWards)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition backdrop-blur-md border ${
              showWards
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
                : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Ward Boundary Polygons (20 Divisions)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Wards {wardFeatures.length > 0 ? `(${wardFeatures.length})` : '(Unavailable)'}</span>
          </button>
          {showWards && wardFeatures.length === 0 && (
            <div className="mt-1 bg-white/95 backdrop-blur-md border border-amber-300 rounded-xl px-2.5 py-1 shadow-md text-[10px] font-bold text-amber-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>Ward boundary data unavailable</span>
            </div>
          )}
        </div>
      }
    >
        {/* OpenStreetMap Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Municipal Ward Boundaries Polygons */}
        {showWards && wardFeatures.map((feat) => {
          const props = feat.properties;
          const coords = feat.geometry?.coordinates?.[0] || [];
          // Leaflet expects [lat, lng], GeoJSON provides [lng, lat]
          const positions = coords.map((c) => [c[1], c[0]]);

          const wardIssuesCount = issues.filter(
            (i) => i.ward && (i.ward.toLowerCase().includes(props.name.toLowerCase()) || i.ward.toLowerCase().includes(props.id.toLowerCase()))
          ).length;

          return (
            <Polygon
              key={props.id}
              positions={positions}
              pathOptions={{
                color: props.color || '#3b82f6',
                fillColor: props.color || '#3b82f6',
                fillOpacity: 0.15,
                weight: 2,
                dashArray: '4, 4'
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-sans">
                  <div className="font-extrabold text-blue-800 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-blue-600" />
                    <span>{props.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {props.id} • {props.zone}
                  </div>
                  <div className="text-[10px] font-bold text-slate-700 mt-0.5">
                    {wardIssuesCount} Active Issues
                  </div>
                </div>
              </Tooltip>

              <Popup>
                <div className="p-1 min-w-[180px] font-sans text-xs">
                  <div className="flex items-center justify-between border-b pb-1 mb-1">
                    <strong className="font-extrabold text-blue-700">{props.name}</strong>
                    <span className="font-mono text-[10px] bg-blue-50 text-blue-800 px-1 rounded font-bold">
                      {props.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Jurisdiction: <strong>{props.zone}</strong>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-700 bg-slate-50 p-1 rounded border border-slate-200">
                    Issues in this ward: <strong>{wardIssuesCount}</strong>
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* Issue Pins */}
        {issues.map((issue) => {
          if (!issue.latitude || !issue.longitude) return null;
          const markerIcon = createCustomMarker(issue.status, issue.priority_level);

          return (
            <Marker
              key={issue.id}
              position={[issue.latitude, issue.longitude]}
              icon={markerIcon}
            >
              <Popup className="civic-map-popup">
                <div className="w-64 p-1 text-[#0f172a]">
                  <img
                    src={issue.before_image_url}
                    alt={issue.title}
                    className="w-full h-28 object-cover rounded-xl border border-slate-200 mb-2.5 shadow-sm"
                  />
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-xs font-extrabold text-[#0f172a] bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded">
                      {issue.ticket_id}
                    </span>
                    <StatusBadge status={issue.status} size="sm" />
                  </div>
                  <h4 className="text-xs font-extrabold text-[#0f172a] leading-snug line-clamp-2">
                    {issue.title}
                  </h4>
                  <p className="text-[11px] font-bold text-[#0f172a] mt-1 line-clamp-1 flex items-center gap-1">
                    <span>📍</span> {issue.address}
                  </p>

                  <div className="my-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-[#0f172a] font-bold">
                      <Users className="w-3.5 h-3.5 text-[#0f172a]" />
                      {issue.report_count} reports
                    </span>
                    <span className="flex items-center gap-1 text-[#0f172a] font-bold">
                      <ThumbsUp className="w-3.5 h-3.5 text-[#0f172a]" />
                      {issue.upvotes}
                    </span>
                  </div>

                  <div className="mb-2">
                    <CountdownTimer
                      deadline={issue.escalation_deadline}
                      isResolved={issue.status === 'Resolved'}
                      isEscalated={issue.status === 'Escalated'}
                    />
                  </div>

                  <Link
                    to={`/issues/${issue.ticket_id}`}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
                  >
                    <span>Inspect Issue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </CivicMapContainer>
  );
};
