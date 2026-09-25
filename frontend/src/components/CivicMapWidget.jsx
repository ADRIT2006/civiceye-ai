import React, { useEffect, useState } from 'react';
import { CivicLeafletMap } from './CivicLeafletMap';
import { api } from '../services/api';

/**
 * Reusable CivicEye Leaflet Map Widget
 * Equipped with Street (OpenStreetMap) and Satellite (Esri World Imagery) basemap toggles.
 * Shared across CivicMap, AdminDashboard, WorkerDashboard, and Home.
 */
export const CivicMapWidget = ({
  issues = [],
  center = [12.9716, 77.5946],
  zoom = 13,
  height = '500px',
  initialShowWards = true,
  role = 'citizen',
  className = '',
  showLayerSwitcher = true,
}) => {
  const [wardGeojson, setWardGeojson] = useState(null);
  const [showWards, setShowWards] = useState(initialShowWards);

  useEffect(() => {
    loadWardBoundaries();
  }, []);

  const loadWardBoundaries = async () => {
    try {
      const data = await api.getPublicWardGeojson();
      if (data && data.features) {
        setWardGeojson(data);
      }
    } catch (err) {
      console.warn('[CivicEye Leaflet Widget] Failed to load public ward geojson:', err);
    }
  };

  return (
    <CivicLeafletMap
      center={center}
      zoom={zoom}
      height={height}
      issues={issues}
      geojson={wardGeojson}
      showWards={showWards}
      onToggleWards={() => setShowWards(!showWards)}
      wardCount={wardGeojson?.features?.length || 0}
      role={role}
      className={className}
      showLayerSwitcher={showLayerSwitcher}
    />
  );
};
