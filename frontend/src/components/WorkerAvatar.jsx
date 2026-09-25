import React, { useState } from 'react';

/**
 * WorkerAvatar component
 * 
 * Safely renders a worker profile avatar image.
 * - If image fails to load, returns 404, or is invalid: falls back to initials badge.
 * - NEVER renders the raw image URL as text in the DOM.
 */
export const WorkerAvatar = ({
  worker,
  src: propSrc,
  name: propName,
  className = "w-12 h-12 rounded-2xl",
  fallbackClassName = ""
}) => {
  const [imageError, setImageError] = useState(false);

  const name = propName || worker?.name || 'Worker';
  const rawSrc = propSrc !== undefined 
    ? propSrc 
    : (worker?.avatar || worker?.profile_image || worker?.profileImage || worker?.photo || worker?.image_url);

  // Compute initials (e.g., "Rakesh Kumar" -> "RK", "Rajesh" -> "RA")
  const getInitials = (str) => {
    if (!str || typeof str !== 'string') return 'W';
    const parts = str.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'W';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  // Check if rawSrc is a valid URL string
  const isUrl = typeof rawSrc === 'string' && (
    rawSrc.startsWith('http://') || 
    rawSrc.startsWith('https://') || 
    rawSrc.startsWith('/') || 
    rawSrc.startsWith('data:image/')
  );

  // If not a URL or image failed to load, show initials avatar
  if (!isUrl || imageError) {
    return (
      <div 
        className={`${className} ${fallbackClassName} bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold flex items-center justify-center select-none shadow-2xs`}
        title={name}
      >
        <span className="text-xs sm:text-sm tracking-wider font-mono font-bold leading-none">
          {initials}
        </span>
      </div>
    );
  }

  return (
    <img
      src={rawSrc}
      alt={`${name} profile`}
      onError={() => setImageError(true)}
      className={`${className} object-cover select-none`}
    />
  );
};
