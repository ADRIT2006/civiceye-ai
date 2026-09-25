import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Camera, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  Crosshair, 
  Send, 
  Sparkles,
  PhoneCall,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Info,
  ArrowRight,
  Radio,
  X
} from 'lucide-react';
import { CivicLeafletMap } from '../components/CivicLeafletMap';
import { LocationSearchBox } from '../components/LocationSearchBox';
import { reverseGeocode } from '../services/osmGeocoding';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DuplicateModal } from '../components/DuplicateModal';
import { formatStatus } from '../utils/statusUtils';
 
export const ReportIssue = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, showToast, openEmergencyModal } = useAuth();

  const [category, setCategory] = useState('Pothole');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('5th Cross Road, Indiranagar');
  const [ward, setWard] = useState('Ward boundary data unavailable');
  const [position, setPosition] = useState([12.9716, 77.5946]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const watchIdRef = useRef(null);
  
  const [imageFile, setImageFile] = useState(null);
  const [imageBase64, setImageBase64] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submittedIssue, setSubmittedIssue] = useState(null);

  // Emergency questionnaire state
  const [inImmediateDanger, setInImmediateDanger] = useState(null); // null | 'yes' | 'no'
  const [showEmergencyAdvisory, setShowEmergencyAdvisory] = useState(false);

  // Duplicate Modal State
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [detectedZone, setDetectedZone] = useState('');

  // Check Copilot draft pre-fill or critical hazard URL params
  useEffect(() => {
    if (location.state?.draft) {
      const d = location.state.draft;
      if (d.category) setCategory(d.category);
      if (d.title) setTitle(d.title);
      if (d.description) setDescription(d.description);
      showToast('Applied AI Copilot draft suggestion!', 'info');
    }
    const params = new URLSearchParams(location.search);
    if (params.get('hazard') === 'critical') {
      setCategory('Electrical Hazard');
      setInImmediateDanger('yes');
      setShowEmergencyAdvisory(true);
    }
  }, [location.state, location.search]);

  // Automatic Ward Detection when map pin moves or GPS changes
  useEffect(() => {
    if (position && position[0] && position[1]) {
      api.detectWard(position[0], position[1])
        .then((res) => {
          if (res?.ward_name) {
            setWard(res.ward_name);
            setDetectedZone(res.zone || '');
          } else {
            setWard('Ward boundary data unavailable');
            setDetectedZone('');
          }
        })
        .catch(() => {
          setWard('Ward boundary data unavailable');
          setDetectedZone('');
        });
    }
  }, [position]);

  // Available BBMP Municipal Wards
  const wards = [
    'Ward 12 - Indiranagar',
    'Ward 04 - Koramangala',
    'Ward 08 - Jayanagar',
    'Ward 01 - Majestic',
    'Ward 06 - Basavanagudi',
    'Ward 10 - MG Road',
    'Ward 02 - Malleshwaram',
    'Ward 03 - Rajajinagar',
    'Ward 05 - BTM Layout',
    'Ward 07 - Whitefield',
    'Ward 09 - HSR Layout',
    'Ward 11 - Hebbal'
  ];

  // 10 Official Categories supported by backend priority engine
  const categories = [
    { name: 'Pothole', icon: '🕳️' },
    { name: 'Open Drain', icon: '⚠️', isCritical: true },
    { name: 'Broken Streetlight', icon: '💡' },
    { name: 'Garbage', icon: '🗑️' },
    { name: 'Water Leakage', icon: '💧' },
    { name: 'Road Damage', icon: '🚧' },
    { name: 'Electrical Hazard', icon: '⚡', isCritical: true },
    { name: 'Open Manhole', icon: '🕳️', isCritical: true },
    { name: 'Public Infrastructure', icon: '🏛️' },
    { name: 'Other', icon: '📍' }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      showToast('Please upload an issue photo (.jpg, .jpeg, .png, or .webp).', 'error');
      return;
    }

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      showToast('Image file size must be less than 15MB.', 'error');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Clean up watchPosition on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleToggleTrackLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'warning');
      return;
    }
    if (isTrackingLocation) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTrackingLocation(false);
      showToast('Stopped live location tracking.', 'info');
    } else {
      setIsTrackingLocation(true);
      showToast('Live device tracking active.', 'info');
      try {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            setCurrentLocation([lat, lon]);
          },
          (err) => {
            console.warn('watchPosition error:', err);
            setIsTrackingLocation(false);
            showToast('Unable to track location.', 'warning');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        watchIdRef.current = id;
      } catch (e) {
        console.warn('Failed to start watchPosition:', e);
        setIsTrackingLocation(false);
      }
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      showToast('Acquiring real location via browser Geolocation API...', 'info');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setPosition([lat, lon]);
          setCurrentLocation([lat, lon]);
          showToast(`Acquired real coordinates: ${lat.toFixed(5)}° N, ${lon.toFixed(5)}° E`, 'success');
          try {
            const detectedAddress = await reverseGeocode(lat, lon);
            if (detectedAddress) {
              setAddress(detectedAddress);
            } else {
              setAddress('Address unavailable');
            }
          } catch (e) {
            console.warn('Reverse geocode error:', e);
            setAddress('Address unavailable');
          }
          try {
            const res = await api.detectWard(lat, lon);
            if (res && res.ward_name) {
              setWard(res.ward_name);
            }
          } catch (err) {
            console.warn('Auto ward detection failed:', err);
          }
        },
        (err) => {
          console.warn('Geolocation error:', err);
          showToast('Unable to access your current location. You can select the location manually on the map.', 'warning');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      showToast('Geolocation is not supported by your browser.', 'warning');
    }
  };

  const handlePositionChange = async ([lat, lng]) => {
    setPosition([lat, lng]);
    try {
      const detectedAddress = await reverseGeocode(lat, lng);
      if (detectedAddress) {
        setAddress(detectedAddress);
      } else {
        setAddress('Address unavailable');
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
      setAddress('Address unavailable');
    }
    try {
      const res = await api.detectWard(lat, lng);
      if (res && res.ward_name) {
        setWard(res.ward_name);
      }
    } catch (err) {
      console.warn('Ward detection error:', err);
    }
  };

  const handleSelectLocation = async ({ lat, lon, displayName, address: addr }) => {
    setPosition([lat, lon]);
    const finalAddr = displayName || addr;
    if (finalAddr) {
      setAddress(finalAddr);
    }
    try {
      const res = await api.detectWard(lat, lon);
      if (res && res.ward_name) {
        setWard(res.ward_name);
      }
    } catch (err) {
      console.warn('Ward detection error:', err);
    }
  };

  const handleDangerSelect = (answer) => {
    setInImmediateDanger(answer);
    if (answer === 'yes') {
      setShowEmergencyAdvisory(true);
    } else {
      setShowEmergencyAdvisory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent accidental double-click

    // Strict validation before submission
    if (!imageFile && !imageBase64 && !imagePreview) {
      showToast('Please upload an issue photo.', 'error');
      return;
    }
    if (!category) {
      showToast('Please choose an issue category.', 'error');
      return;
    }
    if (!description || !description.trim()) {
      showToast('Please enter a description of the issue.', 'error');
      return;
    }
    if (!position || typeof position[0] !== 'number' || typeof position[1] !== 'number') {
      showToast('Please select the issue location.', 'error');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Run Smart Duplicate Check
      const dupRes = await api.checkDuplicate({
        category,
        latitude: position[0],
        longitude: position[1],
        image_base64: imageBase64,
        description
      }).catch(() => ({ is_possible_duplicate: false }));

      if (dupRes?.is_possible_duplicate && dupRes?.best_match) {
        setDuplicateMatch(dupRes.best_match);
        setIsDuplicateModalOpen(true);
        setLoading(false);
        return;
      }

      // Step 2: Proceed with real creation
      await proceedCreateNew();
    } catch (err) {
      showToast('Unable to submit the issue. Please try again. (' + err.message + ')', 'error');
      setLoading(false);
    }
  };

  const proceedCreateNew = async () => {
    setIsDuplicateModalOpen(false);
    setLoading(true);
    try {
      let photoUrl = '';
      if (imageFile) {
        try {
          const uploadRes = await api.uploadPhoto(imageFile);
          if (uploadRes?.photo_url) {
            photoUrl = uploadRes.photo_url;
          }
        } catch (uploadErr) {
          console.warn('Dedicated photo upload error, will pass image base64:', uploadErr);
        }
      }

      const isCritical = category === 'Electrical Hazard' || category === 'Open Manhole' || inImmediateDanger === 'yes';
      const payload = {
        category,
        title: title.trim() || `${category} reported at ${address}`,
        description: description.trim(),
        latitude: Number(position[0]),
        longitude: Number(position[1]),
        address: address.trim() || 'Selected Location',
        ward: ward && ward !== 'Ward boundary data unavailable' ? ward : null,
        reporter_name: user?.name || 'Citizen',
        photo_url: photoUrl || undefined,
        image_base64: imageBase64 || undefined,
        is_emergency: isCritical,
        hazard_type: isCritical ? category : null,
        severity: isCritical ? 'High' : 'Medium'
      };

      const res = await api.reportIssue(payload);
      setSubmittedIssue(res);
      showToast(`Complaint registered! Ticket ID: ${res.ticket_id}`, 'success');
    } catch (err) {
      showToast('Unable to submit the issue. Please try again. (' + (err.message || 'Server error') + ')', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMerge = async () => {
    setLoading(true);
    try {
      const res = await api.mergeDuplicate({
        target_issue_id: duplicateMatch.issue_id,
        reporter_name: user?.name || 'Citizen',
        description: description || 'Citizen confirmed duplicate grievance.',
        image_base64: imageBase64,
        latitude: position[0],
        longitude: position[1]
      });

      setIsDuplicateModalOpen(false);
      showToast(res.message || 'Merged with existing ticket', 'success');
      navigate(`/issues/${res.ticket_id}`);
    } catch (err) {
      showToast('Merge error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReportAnother = () => {
    setSubmittedIssue(null);
    setTitle('');
    setDescription('');
    setImageFile(null);
    setImageBase64('');
    setImagePreview(null);
    setCategory('Pothole');
    setInImmediateDanger(null);
    setShowEmergencyAdvisory(false);
  };

  if (submittedIssue) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 animate-fadeIn">
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Database Record Verified
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              Issue Reported Successfully
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your grievance has been officially registered in the municipal database.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Ticket</span>
              <span className="font-mono text-sm font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {submittedIssue.ticket_id}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Status</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {formatStatus(submittedIssue.status || 'REPORTED')}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Category</span>
              <span className="text-xs font-bold text-slate-800">
                {submittedIssue.category}
              </span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase pt-0.5">Location</span>
              <span className="text-xs font-semibold text-slate-800 text-right max-w-[240px]">
                {submittedIssue.address || `${submittedIssue.latitude?.toFixed(5)}° N, ${submittedIssue.longitude?.toFixed(5)}° E`}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(`/issues/${submittedIssue.ticket_id}`)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>VIEW REPORT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleReportAnother}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer"
            >
              REPORT ANOTHER ISSUE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Camera className="w-5 h-5" />
            </span>
            Report a Civic Grievance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            All complaints are geotagged, screened for duplicates, and tracked against statutory 48-hour SLAs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openEmergencyModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition animate-pulse"
          >
            <PhoneCall className="w-4 h-4" />
            <span>🚨 EMERGENCY HELP</span>
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        {/* Requirement #6: Emergency vs Civic Complaint Questionnaire */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Public Safety Check: Is anyone in immediate danger?</span>
            </label>
            <span className="text-[10px] text-slate-400">Emergency Protocol</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleDangerSelect('yes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                inImmediateDanger === 'yes'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700'
              }`}
            >
              <span>YES — Danger to life / safety</span>
            </button>
            <button
              type="button"
              onClick={() => handleDangerSelect('no')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                inImmediateDanger === 'no'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>NO — Standard civic issue</span>
            </button>
          </div>

          {/* If YES: Display Emergency Help Panel Immediately */}
          {showEmergencyAdvisory && (
            <div className="mt-3 p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs space-y-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-red-950 text-sm">
                    ⚠️ This may require immediate emergency assistance.
                  </div>
                  <p className="mt-0.5 leading-relaxed text-[11px] text-red-800">
                    If this involves a live electrical wire on road, major fire, dangerous open manhole with immediate risk, collapsed structure, major accident, or trapped persons, call emergency services immediately!
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-red-200">
                <a
                  href="tel:112"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>CALL EMERGENCY SERVICES (112)</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowEmergencyAdvisory(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-red-300 text-red-800 font-bold text-xs rounded-lg transition"
                >
                  CONTINUE REPORTING TO CIVICEYE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Category Pills */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
            1. Select Issue Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {categories.map((cat) => {
              const isSelected = category === cat.name;
              const isCritical = cat.isCritical;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold transition ${
                    isSelected
                      ? isCritical
                        ? 'bg-red-50 border-red-600 text-red-800 ring-2 ring-red-200 shadow-sm'
                        : 'bg-blue-50 border-blue-600 text-blue-800 shadow-sm'
                      : isCritical
                      ? 'bg-red-50/50 border-red-200 text-red-700 hover:bg-red-100'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              );
            })}
          </div>
          {category === 'CRITICAL PUBLIC HAZARD' && (
            <div className="mt-2 text-[11px] text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
              <strong>Critical Public Hazard:</strong> Examples include exposed electrical wires, collapsed road surface, dangerous open manhole, or structural damage. These reports receive highest initial priority.
            </div>
          )}
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
            2. Photo Evidence (Computer Vision Pre-Scan)
          </label>
          <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center bg-slate-50">
            {imagePreview ? (
              <div className="space-y-3">
                <img
                  src={imagePreview}
                  alt="Issue Preview"
                  className="max-h-52 mx-auto rounded-xl shadow-sm border border-slate-200 object-cover"
                />
                <div className="flex items-center justify-center gap-3">
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
                    <span>Change Photograph</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageBase64(''); }}
                    className="text-xs text-rose-600 font-semibold hover:underline"
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-xs text-slate-600">
                  <label className="cursor-pointer text-blue-600 font-bold hover:underline">
                    Upload a high-resolution photo
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <span> or drag and drop</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Used by OpenCV feature matching to detect existing duplicates in 100m radius
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Geolocation & Interactive Map */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Geolocation Pinpoint
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleTrackLocation}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                  isTrackingLocation
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="Track device position as GPS changes"
              >
                <Radio className={`w-3.5 h-3.5 ${isTrackingLocation ? 'animate-pulse text-emerald-600' : 'text-slate-500'}`} />
                <span>{isTrackingLocation ? 'Tracking Location' : 'Track My Location'}</span>
              </button>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                title="Use browser Geolocation API to acquire real GPS coordinates"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>USE MY CURRENT LOCATION</span>
              </button>
            </div>
          </div>

          {/* Location Search Box (Nominatim OpenStreetMap search) */}
          <LocationSearchBox
            onSelectLocation={handleSelectLocation}
            placeholder="Search location (e.g. Kalyani Railway Station, JIS College, Kolkata)..."
          />

          {/* Interactive Leaflet Map with Draggable Pin */}
          <CivicLeafletMap
            center={position}
            zoom={15}
            height="320px"
            className="border border-slate-300 rounded-2xl shadow-sm mb-3 overflow-hidden"
            draggableMarker={{
              position,
              onPositionChange: handlePositionChange,
              address,
            }}
            currentLocation={currentLocation}
            onMapClick={handlePositionChange}
            showLayerSwitcher={true}
            overlay={
              /* Pinned Coordinates & Address Badge on Map Click */
              <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[400] bg-white/95 backdrop-blur-md border border-slate-300 rounded-xl px-3.5 py-2 shadow-lg flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[#0f172a] truncate flex items-center gap-1">
                      <span>📍</span>
                      <span>{address || 'Location Pinned'}</span>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-[#0f172a] tracking-tight">
                      GPS Coordinates: {position[0]?.toFixed(5)}° N, {position[1]?.toFixed(5)}° E
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#0f172a] bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg flex-shrink-0 shadow-sm">
                  Click or drag pin
                </span>
              </div>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#0f172a] uppercase tracking-wider mb-1">
                Street Address / Landmark
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-[#0f172a] focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-[#0f172a] uppercase tracking-wider">
                  Municipal Ward
                </label>
                {ward === 'Ward boundary data unavailable' ? (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                    Ward boundary data unavailable
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-1">
                    <span>✨</span>
                    <span>Auto-Detected: {detectedZone}</span>
                  </span>
                )}
              </div>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-[#0f172a] focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {ward === 'Ward boundary data unavailable' && (
                  <option value="Ward boundary data unavailable">Ward boundary data unavailable</option>
                )}
                {ward && !wards.includes(ward) && ward !== 'Ward boundary data unavailable' && (
                  <option value={ward}>{ward}</option>
                )}
                {wards.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Issue Headline
            </label>
            <input
              type="text"
              placeholder="e.g. Deep pothole causing two-wheeler accidents..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Description & Context
            </label>
            <textarea
              rows={3}
              placeholder="Provide exact location context, duration of problem, or safety risks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Protected by CivicEye 48-Hour Statutory Grievance SLA
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Submitting issue...' : 'SUBMIT ISSUE'}</span>
          </button>
        </div>
      </form>

      {/* Smart Duplicate Modal */}
      <DuplicateModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        match={duplicateMatch}
        onConfirmMerge={handleConfirmMerge}
        onProceedSeparate={proceedCreateNew}
        onCreateNew={proceedCreateNew}
      />
    </div>
  );
};
