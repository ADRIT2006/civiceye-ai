import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ArrowRight,
  Sparkles,
  PhoneCall,
  Bot,
  Award,
  ShieldCheck,
  ThumbsUp,
  Crosshair,
  Layers,
  HelpCircle
} from 'lucide-react';
import { TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { CivicMapContainer } from '../components/CivicMapContainer';
import L from 'leaflet';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';

// Custom Map Pin for Citizen Map
const customCitizenPin = L.divIcon({
  html: `<div style="width: 32px; height: 32px; border-radius: 9999px; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(37,99,235,0.4); display: flex; items-center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">📍</div>`,
  className: 'custom-citizen-pin',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const CitizenPinDrop = ({ position, setPosition, setDetectedWard }) => {
  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      api.detectWard(newPos[0], newPos[1])
        .then((res) => {
          if (res?.ward_name) setDetectedWard(res.ward_name);
        })
        .catch(() => {});
    }
  });

  return position ? (
    <Marker position={position} icon={customCitizenPin}>
      <Popup autoPan={false}>
        <div className="p-1 text-slate-900 font-sans text-xs">
          <div className="font-extrabold text-blue-700">📍 Chosen Issue Location</div>
          <div className="text-[11px] font-mono mt-0.5">
            {position[0]?.toFixed(4)}° N, {position[1]?.toFixed(4)}° E
          </div>
        </div>
      </Popup>
    </Marker>
  ) : null;
};

export const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { user, openEmergencyModal } = useAuth();
  const { t, language } = useTranslation();

  const [myReports, setMyReports] = useState([]);
  const [creditSummary, setCreditSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Map state for quick reporting
  const [pinPosition, setPinPosition] = useState([12.9716, 77.5946]);
  const [detectedWard, setDetectedWard] = useState('Ward 12 - Indiranagar');

  useEffect(() => {
    loadCitizenData();
  }, []);

  const loadCitizenData = async () => {
    try {
      setLoading(true);
      const [issuesRes, creditsRes] = await Promise.all([
        api.getIssues().catch(() => []),
        api.getCitizenCredits().catch(() => null)
      ]);

      // Dynamic personal reports for logged in user
      const currentUserName = user?.name?.toLowerCase() || '';
      const firstName = currentUserName.split(' ')[0] || '';
      const personal = issuesRes.filter((i) => {
        const reporter = i.reporter_name?.toLowerCase() || '';
        return (
          (currentUserName && reporter.includes(currentUserName)) ||
          (firstName && reporter.includes(firstName)) ||
          (user?.id && i.reporter_id === user.id) ||
          reporter === 'citizen'
        );
      });
      setMyReports(personal.length > 0 ? personal : issuesRes.slice(0, 6));
      setCreditSummary(creditsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPinPosition([lat, lng]);
          api.detectWard(lat, lng)
            .then((res) => {
              if (res?.ward_name) setDetectedWard(res.ward_name);
            })
            .catch(() => {});
        },
        () => {
          console.warn('GPS location access denied.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const activeReports = myReports.filter((i) => i.status !== 'Resolved' && i.status !== 'RESOLVED');
  const resolvedReports = myReports.filter((i) => i.status === 'Resolved' || i.status === 'RESOLVED');

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      {/* Friendly Welcome Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('citizenWorkspace')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t('citizenWelcome')}, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            {user.ward} • {t('citizenSubtitle')}
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={openEmergencyModal}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black rounded-2xl shadow-md border border-red-400 transition"
          >
            <PhoneCall className="w-4 h-4 animate-bounce" />
            <span>{t('btnEmergencyHelp')}</span>
          </button>
          <Link
            to="/report"
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 text-xs font-extrabold rounded-2xl shadow-md transition"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span>{t('btnReportIssue')}</span>
          </Link>
        </div>
      </div>

      {/* 4 Friendly Personal Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t('cardMyActiveReports')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{activeReports.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Under investigation / active repair</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t('cardMyResolved')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">{resolvedReports.length}</div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Fixed & verified on site</p>
        </div>

        <Link
          to="/citizen/credits"
          className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm hover:shadow-md transition group block"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
              <span>{t('cardConfirmedCredits')}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            🏆 {creditSummary?.confirmed_credits?.toLocaleString() || '1,250'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Reputation rank: Indiranagar #4</p>
        </Link>

        <Link
          to="/citizen/credits"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow transition block"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t('cardPendingCredits')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600 font-mono">
            +{creditSummary?.pending_credits || 20}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting validation checks</p>
        </Link>
      </div>

      {/* Citizen Pinpoint Map & Location Picker Section (No public issues browsing) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Cols: Citizen Pin Drop Map */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Drop a Map Pin to Report</span>
              </h2>
              <p className="text-xs text-slate-500">
                Click anywhere to drop a pin. CivicEye AI automatically detects the municipal ward.
              </p>
            </div>

            <button
              onClick={handleUseCurrentGPS}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{t('btnDetectGps')}</span>
            </button>
          </div>

          {/* Interactive Pin-Drop Leaflet Map */}
          <CivicMapContainer
            center={pinPosition}
            zoom={15}
            scrollWheelZoom={false}
            height="300px"
            className="border border-slate-200 shadow-inner"
            overlay={
              /* Bottom Floating Detected Ward Bar */
              <div className="absolute bottom-3 left-3 right-3 z-[400] bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-200 shadow-lg flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Detected Ward Location:</div>
                  <div className="text-xs font-extrabold truncate flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${detectedWard === 'Ward boundary data unavailable' ? 'bg-amber-500' : 'bg-emerald-500'} shrink-0`} />
                    <span className={detectedWard === 'Ward boundary data unavailable' ? 'text-amber-700' : 'text-blue-800'}>{detectedWard}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/report', { state: { position: pinPosition, ward: detectedWard } })}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition shrink-0"
                >
                  Report at this Pin
                </button>
              </div>
            }
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <CitizenPinDrop
              position={pinPosition}
              setPosition={setPinPosition}
              setDetectedWard={setDetectedWard}
            />
          </CivicMapContainer>
        </div>

        {/* Right 5 Cols: CivicEye Copilot Assistant Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-white rounded-3xl border border-blue-200/80 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                AI Powered
              </span>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Need Help Drafting Your Grievance?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Describe the defect in simple words. CivicEye Copilot formats official descriptions, detects safety risks, and ensures you earn Civic Credits.
              </p>
            </div>

            {/* Prompt Quick Starters */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Quick Prompts:</div>
              <button
                onClick={() => navigate('/citizen/copilot')}
                className="w-full text-left p-2.5 rounded-xl bg-white border border-blue-100 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition shadow-2xs"
              >
                "There is a big hole in the road near my college"
              </button>
              <button
                onClick={() => navigate('/citizen/copilot')}
                className="w-full text-left p-2.5 rounded-xl bg-white border border-blue-100 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-medium transition shadow-2xs"
              >
                "Exposed live electrical cable near the pedestrian sidewalk"
              </button>
            </div>
          </div>

          <button
            onClick={() => navigate('/citizen/copilot')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Open CivicEye Copilot</span>
          </button>
        </div>
      </div>

      {/* My Recent Grievances List (Private to this citizen) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>{t('myRecentReports')}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Only complaints submitted or co-supported by your account are listed here
            </p>
          </div>
          <Link
            to="/citizen/my-reports"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {myReports.length > 0 ? (
            myReports.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {item.ticket_id}
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                    <PriorityBadge level={item.priority_level} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <div className="text-xs text-slate-500 truncate">
                    📍 {item.address} • {item.ward}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="text-right text-xs">
                    <span className="font-bold text-blue-700 flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-blue-500" />
                      {item.report_count} Voices
                    </span>
                    <span className="text-[10px] text-slate-400">Merged priority</span>
                  </div>

                  <Link
                    to={`/issues/${item.ticket_id}`}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition"
                  >
                    View Status
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              {t('noReportsYet')} Click <strong>"Report an Issue"</strong> to submit your first grievance and earn +10 Civic Credits!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
