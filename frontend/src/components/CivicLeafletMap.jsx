import React, { useState, useEffect } from 'react';
import { TileLayer, Marker, Popup, Polygon, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { CivicMapContainer } from './CivicMapContainer';
import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Layers, Navigation, ArrowRight, ExternalLink } from 'lucide-react';
import {
  TILE_PROVIDERS,
  createCurrentLocationIcon,
  createDraggablePinIcon,
  createStatusMarkerIcon,
  createWorkerMarkerIcon,
  openExternalNavigation,
} from '../services/osmGeocoding';

/**
 * Re-centers map dynamically whenever center or zoom changes
 */
const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
      try {
        map.setView(center, zoom || map.getZoom());
      } catch (e) {
        // ignore if unmounted
      }
    }
  }, [center?.[0], center?.[1], zoom, map]);
  return null;
};

/**
 * Handles map click events
 */
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
};

/**
 * Universal Leaflet Map Component for CivicEye AI
 * Zero Google API keys or billing required.
 * Features:
 * - Street / Satellite map layer switcher (OpenStreetMap & Esri World Imagery)
 * - Live Current Location Marker (Blue pulsing radar)
 * - Draggable Issue Marker
 * - Multi-Issue Markers with status-coded pins & rich popups
 * - Municipal Ward GeoJSON Polygons Overlay
 * - External Google Maps Navigation button (No API key needed)
 */
export const CivicLeafletMap = ({
  center = [12.9716, 77.5946],
  zoom = 13,
  height = '500px',
  className = '',
  issues = [],
  workerMarkers = [],
  draggableMarker = null, // { position: [lat, lon], onPositionChange: fn, address: str }
  currentLocation = null, // [lat, lon]
  onMapClick = null,
  geojson = null,
  selectedWard = null,
  onSelectWard = null,
  showWards = false,
  onToggleWards = null,
  wardCount = 0,
  overlay = null,
  role = 'citizen', // 'citizen' | 'admin' | 'worker'
  showLayerSwitcher = true,
  initialLayer = 'street', // 'street' | 'satellite'
}) => {
  const [activeLayer, setActiveLayer] = useState(initialLayer);
  const provider = TILE_PROVIDERS[activeLayer] || TILE_PROVIDERS.street;

  // Normalize center
  const normalizedCenter = Array.isArray(center) && center.length >= 2
    ? [Number(center[0]) || 12.9716, Number(center[1]) || 77.5946]
    : [12.9716, 77.5946];

  return (
    <CivicMapContainer
      center={normalizedCenter}
      zoom={zoom}
      scrollWheelZoom={true}
      height={height}
      className={`relative ${className}`}
      overlay={
        <>
          {/* Street / Satellite Layer Switcher */}
          {showLayerSwitcher && (
            <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-slate-200 flex items-center gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveLayer('street')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  activeLayer === 'street'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Switch to OpenStreetMap Standard View"
              >
                <span>🗺️</span>
                <span>Street</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLayer('satellite')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  activeLayer === 'satellite'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Switch to Esri Aerial / Satellite Imagery Basemap"
              >
                <span>🛰️</span>
                <span>Satellite</span>
              </button>
            </div>
          )}

          {/* Ward Boundaries Toggle Button (if supported) */}
          {onToggleWards && (
            <div className="absolute top-3 right-3 z-[400]">
              <button
                type="button"
                onClick={onToggleWards}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition backdrop-blur-md border cursor-pointer ${
                  showWards
                    ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
                    : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="Toggle Municipal Ward Boundaries"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Wards {wardCount > 0 ? `(${wardCount})` : ''}</span>
              </button>
            </div>
          )}

          {/* Custom Injected Overlay (e.g. coordinates badge) */}
          {overlay}
        </>
      }
    >
      {/* Active Basemap Layer (Street or Satellite) */}
      <TileLayer
        key={activeLayer}
        url={provider.url}
        attribution={provider.attribution}
        maxZoom={provider.maxZoom}
        subdomains={provider.subdomains || 'abc'}
      />

      <MapRecenter center={normalizedCenter} zoom={zoom} />
      <MapClickHandler onMapClick={onMapClick} />

      {/* 1. Live Device Current Location Marker */}
      {currentLocation && typeof currentLocation[0] === 'number' && (
        <Marker position={currentLocation} icon={createCurrentLocationIcon()}>
          <Popup autoPan={false}>
            <div className="p-1 text-xs font-sans text-slate-800">
              <div className="font-extrabold text-blue-600">📍 You Are Here</div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                {currentLocation[0].toFixed(5)}° N, {currentLocation[1].toFixed(5)}° E
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Live GPS Device Location
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* 2. Draggable Issue Pin (for Report Issue) */}
      {draggableMarker && draggableMarker.position && (
        <Marker
          position={draggableMarker.position}
          icon={createDraggablePinIcon()}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const latlng = e.target.getLatLng();
              if (draggableMarker.onPositionChange) {
                draggableMarker.onPositionChange([latlng.lat, latlng.lng]);
              }
            },
          }}
        >
          <Popup autoPan={false}>
            <div className="p-1 text-xs font-sans text-slate-800 max-w-[220px]">
              <div className="font-extrabold text-blue-700">📍 Issue Location (Draggable)</div>
              <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                {draggableMarker.position[0]?.toFixed(5)}° N, {draggableMarker.position[1]?.toFixed(5)}° E
              </div>
              {draggableMarker.address && (
                <div className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                  {draggableMarker.address}
                </div>
              )}
              <div className="text-[10px] text-blue-600 font-bold mt-1">
                Drag pin or click map to move
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* 3. Issue Markers (CivicMap & Admin) */}
      {issues.map((issue) => {
        const lat = Number(issue.latitude);
        const lon = Number(issue.longitude);
        if (isNaN(lat) || isNaN(lon)) return null;

        const inspectUrl = `/issues/${issue.ticket_id}`;

        return (
          <Marker
            key={issue.id || issue.ticket_id}
            position={[lat, lon]}
            icon={createStatusMarkerIcon(issue.status, issue.priority_level)}
          >
            <Popup autoPan={false}>
              <div className="p-1 font-sans text-xs text-slate-900 max-w-[260px] space-y-1.5">
                <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-100">
                  <span className="font-mono text-[11px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    {issue.ticket_id}
                  </span>
                  <StatusBadge status={issue.status} size="sm" />
                </div>

                <div className="font-bold text-xs text-slate-900 line-clamp-1">
                  {issue.title || issue.category}
                </div>

                {issue.category && (
                  <div className="text-[11px] font-semibold text-blue-800">
                    Category: {issue.category}
                  </div>
                )}

                {issue.description && (
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {issue.description}
                  </p>
                )}

                <div className="text-[11px] text-slate-500 truncate">
                  📍 {issue.address || issue.ward || 'Location pinned'}
                </div>

                {(issue.assigned_worker || issue.assigned_worker_name) && (
                  <div className="text-[11px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                    <span>👷</span>
                    <span>Assigned: {issue.assigned_worker || issue.assigned_worker_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <PriorityBadge level={issue.priority_level} size="sm" />
                  <span>{issue.report_count || 1} report(s)</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to={inspectUrl}
                    className="inline-flex items-center gap-1 font-bold text-[11px] text-blue-600 hover:text-blue-800"
                  >
                    <span>Inspect Issue</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => openExternalNavigation(lat, lon)}
                    className="inline-flex items-center gap-1 font-bold text-[10px] text-orange-600 hover:text-orange-800 cursor-pointer"
                    title="Open in Google Maps for navigation"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Navigate</span>
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* 4. Worker Work Orders (WorkerMapPage) */}
      {workerMarkers.map((item) => {
        const lat = Number(item.latitude);
        const lon = Number(item.longitude);
        if (isNaN(lat) || isNaN(lon)) return null;

        return (
          <Marker
            key={item.id || item.ticket_id}
            position={[lat, lon]}
            icon={createWorkerMarkerIcon()}
          >
            <Popup autoPan={false}>
              <div className="p-1 font-sans text-xs text-slate-900 max-w-[240px] space-y-1.5">
                <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-100">
                  <span className="font-mono text-[11px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    {item.ticket_id}
                  </span>
                  <StatusBadge status={item.status} size="sm" />
                </div>

                <div className="font-bold text-xs text-slate-900">{item.title || item.category}</div>
                {item.category && (
                  <div className="text-[11px] font-semibold text-blue-800">
                    Category: {item.category}
                  </div>
                )}
                <div className="text-[11px] text-slate-500">
                  📍 {item.address || item.ward || 'Location pinned'}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <PriorityBadge level={item.priority_level} size="sm" />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/worker/issues/${item.ticket_id}`}
                    className="px-2.5 py-1 bg-orange-600 text-white rounded text-[11px] font-bold hover:bg-orange-700 transition"
                  >
                    Inspect
                  </Link>

                  <button
                    type="button"
                    onClick={() => openExternalNavigation(lat, lon)}
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-[11px] font-extrabold border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3 text-blue-600" />
                    <span>NAVIGATE →</span>
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* 5. Municipal Ward Boundaries GeoJSON Polygons */}
      {showWards && geojson && geojson.features && geojson.features.map((feature, idx) => {
        const props = feature.properties || {};
        const coords = feature.geometry?.coordinates?.[0]?.map((c) => [c[1], c[0]]);
        if (!coords) return null;

        const isSelected = selectedWard && (selectedWard.ward_id === props.id || selectedWard.id === props.id);

        return (
          <Polygon
            key={props.id || idx}
            positions={coords}
            pathOptions={{
              color: isSelected ? '#1d4ed8' : props.color || '#3b82f6',
              fillColor: props.color || '#3b82f6',
              fillOpacity: isSelected ? 0.45 : 0.2,
              weight: isSelected ? 3 : 1.5,
              dashArray: isSelected ? '4, 4' : undefined,
            }}
            eventHandlers={{
              click: () => {
                if (onSelectWard) onSelectWard(props);
              },
            }}
          >
            <Tooltip sticky>
              <div className="text-xs font-bold text-slate-900">
                {props.name || props.ward_name || props.id}
              </div>
            </Tooltip>
          </Polygon>
        );
      })}
    </CivicMapContainer>
  );
};
