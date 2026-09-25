import React, { useState } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { searchLocation } from '../services/osmGeocoding';

/**
 * OpenStreetMap Nominatim Policy-Compliant Location Search Box
 * Triggers searches strictly upon Form Submit / Search Button / Enter key press.
 */
export const LocationSearchBox = ({ onSelectLocation, placeholder = 'Search location (e.g. Kalyani, Indiranagar, JIS College)...' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setIsOpen(true);

    try {
      const items = await searchLocation(query);
      setResults(items);
    } catch (err) {
      console.warn('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    setQuery(item.label);
    setIsOpen(false);
    if (onSelectLocation) {
      onSelectLocation({
        lat: item.lat,
        lon: item.lon,
        address: item.label,
        displayName: item.label,
      });
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHasSearched(false);
  };

  return (
    <div className="relative mb-3 z-30">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-blue-600" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (isOpen && !e.target.value) setIsOpen(false);
            }}
            placeholder={placeholder}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs transition"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </>
          )}
        </button>
      </form>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto z-50 animate-fadeIn divide-y divide-slate-100">
          {results.length > 0 ? (
            results.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left p-3 hover:bg-blue-50/70 transition flex items-start gap-2.5 group cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 group-hover:scale-110 transition" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                    {item.label}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {item.lat.toFixed(5)}° N, {item.lon.toFixed(5)}° E
                  </div>
                </div>
              </button>
            ))
          ) : hasSearched && !loading ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No matching locations found. Try searching with a landmark, area, or city name.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
