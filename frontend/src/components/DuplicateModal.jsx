import React from 'react';
import { 
  GitMerge, 
  PlusCircle, 
  MapPin, 
  Layers, 
  CheckCircle, 
  Users,
  ShieldCheck,
  X,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

export const DuplicateModal = ({
  isOpen,
  onClose,
  match,
  onConfirmMerge,
  onProceedSeparate,
  onCreateNew,
  loading = false
}) => {
  const { t } = useTranslation();
  const handleSeparate = onProceedSeparate || onCreateNew;

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden">
        {/* Privacy-Preserving Header */}
        <div className="p-6 bg-gradient-to-r from-blue-50 via-sky-50 to-white border-b border-blue-100 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900">
                  {t('duplicateTitle') || 'Smart Duplicate Detection'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {match.confidence_score || 87}% Match
                </span>
              </div>
              <p className="text-xs font-semibold text-blue-900 mt-1">
                {t('existingIssueFound') || 'An existing issue may already have been reported at this location.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safe, Privacy-Compliant Information Card */}
        <div className="p-6 space-y-5">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Safe Public Information
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Citizen Privacy Protected
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Issue Category</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {match.category}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-[10px] text-slate-400 font-bold uppercase">{t('approximateArea') || 'Approximate Area'}</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {match.ward || 'Ward 12'}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Status</div>
                <div className="text-sm font-extrabold text-blue-700 mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>Already Reported</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-[10px] text-slate-400 font-bold uppercase">{t('citizenReportsCount') || 'Citizen Reports'}</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5 flex items-center gap-1 text-blue-700">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>{match.report_count || 14} Citizens Voiced</span>
                </div>
              </div>
            </div>

            {/* Strict GDPR / Privacy Guarantee Note */}
            <div className="pt-1 text-[11px] text-slate-500 leading-tight flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Personal details (name, phone, email, private address) are never disclosed.</span>
            </div>
          </div>

          {/* Call to Action Prompt */}
          <div className="text-center py-1">
            <div className="text-xs font-black uppercase tracking-wider text-slate-800">
              {t('isThisTheSameIssue') || 'IS THIS THE SAME ISSUE?'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supporting the existing grievance merges your voice (+5 Civic Credits) and triggers statutory 48h SLA escalation.
            </p>
          </div>

          {/* Decision Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              disabled={loading}
              onClick={onConfirmMerge}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition transform hover:-translate-y-0.5 active:scale-95"
            >
              <GitMerge className="w-4 h-4" />
              <span>{t('btnSupportExisting') || 'YES, SUPPORT EXISTING ISSUE'}</span>
            </button>

            <button
              disabled={loading}
              onClick={handleSeparate}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-slate-500" />
              <span>{t('btnReportSeparately') || 'NO, REPORT SEPARATELY'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
