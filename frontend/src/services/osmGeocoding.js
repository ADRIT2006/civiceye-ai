/**
 * OpenStreetMap & Nominatim Geocoding and Mapping Utilities for CivicEye AI
 * Zero Google API keys or billing required. 100% Free & Open-Source.
 */
import L from 'leaflet';

export const TILE_PROVIDERS = {
  street: {
    name: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
  },
};

// In-memory cache to prevent repeated reverse-geocoding calls
const reverseGeocodeCache = new Map();

/**
 * Reverse-geocode latitude and longitude into a human-readable street address using OSM Nominatim.
 * Strictly respects rate limits and caches results.
 */
export const reverseGeocode = async (lat, lon) => {
  const roundedLat = Number(lat).toFixed(5);
  const roundedLon = Number(lon).toFixed(5);
  const cacheKey = `${roundedLat},${roundedLon}`;

  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLon}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim error: ${res.status}`);
    }

    const data = await res.json();
    if (data && data.display_name) {
      const address = data.display_name;
      reverseGeocodeCache.set(cacheKey, address);
      return address;
    }
    return `Address unavailable (${roundedLat}°, ${roundedLon}°)`;
  } catch (err) {
    console.warn('[CivicEye OSM] Reverse geocoding fallback:', err);
    return `Address unavailable (${roundedLat}°, ${roundedLon}°)`;
  }
};

/**
 * Search location/landmarks using OSM Nominatim search API.
 * Uses submit-based querying to strictly avoid abusive keystroke requests.
 */
export const searchLocation = async (query) => {
  if (!query || !query.trim()) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim search error: ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((item) => ({
        label: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type || 'place',
      }));
    }
    return [];
  } catch (err) {
    console.warn('[CivicEye OSM] Search location error:', err);
    return [];
  }
};

/**
 * Open external Google Maps turn-by-turn navigation in a new tab without using Google Maps API.
 */
export const openExternalNavigation = (lat, lon) => {
  if (!lat || !lon) return;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat)},${encodeURIComponent(lon)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Creates Leaflet divIcon for the live/current device location (Blue pulsing radar).
 */
export const createCurrentLocationIcon = (isTracking = false) => {
  return L.divIcon({
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background: #3b82f6; opacity: 0.35; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 16px; height: 16px; border-radius: 9999px; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(37,99,235,0.6);"></div>
      </div>
    `,
    className: 'current-location-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

/**
 * Creates Leaflet divIcon for the draggable citizen issue reporting pin.
 */
export const createDraggablePinIcon = () => {
  return L.divIcon({
    html: `
      <div style="position: relative; width: 34px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 44" width="34" height="44">
          <defs>
            <filter id="pin-drop-shadow" x="-30%" y="-15%" width="160%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.35"/>
            </filter>
          </defs>
          <path d="M17 1 C8.1 1 1 8.1 1 17 C1 27 14.5 41.5 16.1 43 C16.6 43.5 17.4 43.5 17.9 43 C19.5 41.5 33 27 33 17 C33 8.1 25.9 1 17 1 Z" 
                fill="#2563eb" stroke="#ffffff" stroke-width="2.5" filter="url(#pin-drop-shadow)"/>
          <circle cx="17" cy="17" r="6" fill="#ffffff"/>
        </svg>
      </div>
    `,
    className: 'civic-draggable-pin',
    iconSize: [34, 44],
    iconAnchor: [17, 43],
    popupAnchor: [0, -40],
  });
};

/**
 * Creates Leaflet divIcon for issue markers styled according to status & priority.
 */
export const createStatusMarkerIcon = (status, priorityLevel) => {
  let color = '#2563eb'; // blue (REPORTED / OPEN)
  let pulse = false;
  const s = String(status || '').toUpperCase().replace(/\s+/g, '_');

  if (s === 'ESCALATED' || priorityLevel === 'Critical') {
    color = '#dc2626'; // red
    pulse = true;
  } else if (s === 'RESOLVED') {
    color = '#16a34a'; // green
  } else if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') {
    color = '#0284c7'; // cyan/blue
  } else if (s === 'ASSIGNED') {
    color = '#ea580c'; // orange
  } else if (s === 'UNDER_REVIEW' || s === 'COMMUNITY_VERIFICATION' || s === 'REPAIR_SUBMITTED') {
    color = '#d97706'; // amber
  } else if (s === 'REOPENED' || s === 'DISPUTED') {
    color = '#9333ea'; // purple
  }

  return L.divIcon({
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        ${pulse ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: ${color}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <div style="width: 28px; height: 28px; border-radius: 9999px; background: #ffffff; border: 3px solid ${color}; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
          <div style="width: 12px; height: 12px; border-radius: 9999px; background: ${color};"></div>
        </div>
      </div>
    `,
    className: 'civic-status-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

/**
 * Creates Leaflet divIcon for assigned maintenance workers.
 */
export const createWorkerMarkerIcon = () => {
  return L.divIcon({
    html: `
      <div style="width: 32px; height: 32px; border-radius: 9999px; background: #ea580c; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(234,88,12,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
        👷
      </div>
    `,
    className: 'worker-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};
