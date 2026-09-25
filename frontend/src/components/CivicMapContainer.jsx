import React, { useEffect } from 'react';
import { MapContainer, useMap } from 'react-leaflet';

/**
 * Reusable resize & invalidate handler component for Leaflet maps
 */
export const MapResizeHandler = ({ onResizeTrigger }) => {
  const map = useMap();

  useEffect(() => {
    // Initial size invalidation after mount
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (err) {
        console.warn('Map resize error:', err);
      }
    }, 150);

    // Watch container resizing with ResizeObserver
    let observer;
    try {
      const container = map.getContainer();
      if (container && typeof window !== 'undefined' && window.ResizeObserver) {
        observer = new ResizeObserver(() => {
          try {
            map.invalidateSize();
          } catch (e) {
            // ignore
          }
        });
        observer.observe(container);
      }
    } catch (e) {
      // ignore
    }

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [map, onResizeTrigger]);

  return null;
};

/**
 * Global CivicEye Map Container Shell
 * Enforces strict containment boundaries for all Leaflet maps across the platform.
 */
export const CivicMapContainer = ({
  children,
  overlay,
  height,
  className = '',
  style = {},
  resizeTrigger,
  ...mapProps
}) => {
  const shellStyle = {
    ...(height ? { height, '--map-height': typeof height === 'number' ? `${height}px` : height } : {}),
    ...style
  };

  return (
    <div className={`civic-map-shell ${className}`} style={shellStyle}>
      <MapContainer
        className="civic-leaflet-map"
        {...mapProps}
      >
        <MapResizeHandler onResizeTrigger={resizeTrigger} />
        {children}
      </MapContainer>
      {overlay}
    </div>
  );
};
