import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PhoneCall, 
  AlertTriangle, 
  ShieldAlert, 
  Phone, 
  MapPin, 
  Zap, 
  LifeBuoy, 
  ArrowRight,
  Flame,
  Activity,
  HeartHandshake
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';

export const EmergencyPage = () => {
  const [contacts, setContacts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contactsData, incidentsData] = await Promise.all([
        api.getEmergencyContacts().catch(() => []),
        api.getEmergencyIncidents().catch(() => [])
      ]);
      setContacts(contactsData);
      setIncidents(incidentsData);
    } catch (err) {
      console.error('Failed to load emergency data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-red-600/15 border-2 border-red-500 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold tracking-wide uppercase backdrop-blur-sm">
            <ShieldAlert className="w-4 h-4 animate-pulse text-amber-300" />
            Statutory Emergency Assistance
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Emergency Help & Public Safety
          </h1>
          <p className="text-red-100 text-sm max-w-2xl leading-relaxed">
            If there is immediate danger to life, safety, or critical infrastructure, contact statutory first responders immediately. CivicEye is a civic governance platform and does not replace emergency dispatch services.
          </p>
        </div>

        {/* Immediate CTA Action */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <a
            href="tel:112"
            className="inline-flex items-center justify-center gap-2 bg-white text-red-700 font-black px-6 py-4 rounded-xl shadow-lg hover:bg-red-50 transition-all active:scale-95 text-base border-2 border-white/60"
          >
            <PhoneCall className="w-5 h-5 animate-bounce" />
            🚨 CALL 112
          </a>
          <Link
            to="/report?hazard=critical"
            className="inline-flex items-center justify-center gap-2 bg-red-800/80 hover:bg-red-800 text-white font-bold px-5 py-4 rounded-xl border border-white/30 backdrop-blur-sm transition-all text-sm"
          >
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            REPORT CRITICAL CIVIC HAZARD
          </Link>
        </div>
      </div>

      {/* Grid: Emergency Numbers Directory + Safety Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Emergency Directory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-600" />
              Emergency Contact Directory (India Jurisdiction)
            </h2>
            <span className="text-xs text-slate-500 font-medium">Configured in System DB</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.length > 0 ? (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`bg-white rounded-xl p-5 border ${
                    contact.is_primary
                      ? 'border-red-400 ring-2 ring-red-100 shadow-md'
                      : 'border-slate-200 shadow-sm'
                  } hover:shadow-md transition-shadow flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {contact.service_name}
                      </h3>
                      {contact.is_primary && (
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      {contact.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-2xl font-black font-mono text-slate-800">
                      {contact.phone_number}
                    </span>
                    <a
                      href={`tel:${contact.phone_number}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      CALL NOW
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                Loading statutory emergency directory...
              </div>
            )}
          </div>

          {/* Critical Civic Hazard Reporting Banner */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-amber-950 text-sm">
                  Report Critical Public Hazard
                </h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Notice an exposed live wire, deep collapsed manhole, or broken bridge? Report as <strong>CRITICAL PUBLIC HAZARD</strong> for immediate highest-priority dispatch.
                </p>
              </div>
            </div>
            <Link
              to="/report?hazard=critical"
              className="shrink-0 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              Report Hazard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Safety Advice & Protocol */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <LifeBuoy className="w-4 h-4 text-blue-600" />
              Immediate Public Safety Guidelines
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-red-50/70 rounded-lg border border-red-100">
                <div className="font-bold text-red-900 flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-red-600" />
                  Live Wire or Electrical Shock
                </div>
                <p className="text-red-800 leading-relaxed">
                  Keep at least 10 meters (33 feet) away. Do not touch water near downed lines. Call 112 and stay back to warn others.
                </p>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-100">
                <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
                  Open Manhole / Deep Trench
                </div>
                <p className="text-blue-800 leading-relaxed">
                  Place an improvised visible barrier (branch/cone) at a safe distance. Never enter or look closely into toxic sewer fumes.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-100">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                  Structural Damage / Gas Leak
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  Evacuate immediate perimeter. Do not use electrical switches or lighters if gas is smelled. Dial 101 (Fire & Disaster).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nearby Active Critical Incidents Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Active Critical Civic Incidents & Hazards
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live reports flagged as Critical public risk or emergency hazard
            </p>
          </div>
          <Link
            to="/map"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View on Live Map <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incidents.length > 0 ? (
            incidents.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {item.ticket_id}
                    </span>
                    <PriorityBadge level={item.priority_level} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{item.address || item.ward}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <StatusBadge status={item.status} />
                  <Link
                    to={`/issues/${item.ticket_id}`}
                    className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 py-6 text-center text-slate-400 text-xs">
              No critical public hazards currently reported.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
