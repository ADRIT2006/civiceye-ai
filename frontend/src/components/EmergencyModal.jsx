import React, { useState, useEffect } from 'react';
import { PhoneCall, AlertTriangle, X, ShieldAlert, Phone, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_CONTACTS = [
  { id: 1, service_name: 'Emergency Response Support System (ERSS)', phone_number: '112', description: 'Unified national emergency response helpline', category: 'emergency', is_primary: true },
  { id: 2, service_name: 'Police Control Room', phone_number: '100', description: 'Immediate law enforcement and civic security', category: 'police', is_primary: false },
  { id: 3, service_name: 'Fire & Rescue Services', phone_number: '101', description: 'Fire hazards, collapse, and heavy rescue', category: 'fire', is_primary: false },
  { id: 4, service_name: 'Ambulance & Medical Emergency', phone_number: '102', description: 'Critical trauma and emergency ambulance dispatch', category: 'medical', is_primary: false },
  { id: 5, service_name: 'Women Helpline', phone_number: '1091', description: '24x7 safety assistance & crisis support for women', category: 'helpline', is_primary: false },
  { id: 6, service_name: 'Child Helpline', phone_number: '1098', description: '24-hour national emergency child protection', category: 'helpline', is_primary: false },
];

export const EmergencyModal = ({ isOpen, onClose, onContinueCivicReport }) => {
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await api.getEmergencyContacts();
      if (data && data.length > 0) {
        setContacts(data);
      }
    } catch (err) {
      console.warn('Using default emergency directory fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-500 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Urgent Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-6 py-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                🚨 Need Immediate Help?
              </h2>
              <p className="text-red-100 text-xs mt-0.5">
                Statutory Emergency Services Coordination
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-3.5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-900 leading-relaxed">
            <span className="font-bold">Life Safety Advisory:</span> If there is immediate danger to life or safety, contact the appropriate emergency service below. CivicEye complaint reporting is for infrastructure maintenance and is <span className="font-semibold underline">not a replacement for 911/112 emergency services</span>.
          </div>
        </div>

        {/* Primary 112 Call Banner */}
        <div className="p-6 pb-2">
          <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-red-500/20">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-red-100 mb-1">
                National Emergency Response
              </div>
              <div className="text-2xl font-black tracking-tight">
                ERSS Helpline — 112
              </div>
              <p className="text-xs text-red-100 mt-1">
                Single unified dial for Police, Fire, Ambulance & Disaster Response
              </p>
            </div>
            <a
              href="tel:112"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-red-700 font-extrabold px-6 py-3.5 rounded-xl shadow-md hover:bg-red-50 transition-transform active:scale-95 text-base"
            >
              <PhoneCall className="w-5 h-5 animate-bounce" />
              CALL 112 NOW
            </a>
          </div>
        </div>

        {/* Emergency Contact Directory */}
        <div className="px-6 py-3 overflow-y-auto flex-1 divide-y divide-slate-100">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Jurisdiction Emergency Service Directory (Configured)
          </div>
          {contacts.map((contact) => (
            <div key={contact.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-800 truncate">
                    {contact.service_name}
                  </span>
                  {contact.is_primary && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {contact.description}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  {contact.phone_number}
                </span>
                <a
                  href={`tel:${contact.phone_number}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            Emergency calls connect directly through your device telephone service.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onContinueCivicReport && (
              <button
                onClick={onContinueCivicReport}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition-colors"
              >
                Continue Reporting to CivicEye
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
