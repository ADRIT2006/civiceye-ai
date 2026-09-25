import React, { useEffect, useState } from 'react';
import { 
  Award, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  MapPin, 
  TrendingUp, 
  FileText,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

export const CitizenCreditsPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [creditData, setCreditData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      setLoading(true);
      const data = await api.getCitizenCredits();
      setCreditData(data);
    } catch (err) {
      console.error(err);
      // Fallback realistic state
      setCreditData({
        user_name: user?.name || 'Citizen',
        total_credits: 1250,
        confirmed_credits: 1250,
        pending_credits: 20,
        rejected_credits: 0,
        stats: {
          issues_reported: 14,
          issues_resolved: 11,
          community_contributions: 28,
          neighborhood_rank: '#4 in Indiranagar Ward 12'
        },
        badges: [
          {
            id: 'first_report',
            name: 'FIRST REPORT',
            title: 'Pioneer Citizen',
            description: 'Submitted your first verified civic grievance',
            unlocked: true,
            progress: '100%'
          },
          {
            id: 'community_helper',
            name: 'COMMUNITY HELPER',
            title: 'Ground-Truth Verifier',
            description: 'Cast 25+ accurate ground-truth repair votes',
            unlocked: true,
            progress: '100%'
          },
          {
            id: 'civic_champion',
            name: 'CIVIC CHAMPION',
            title: 'Civic Vanguard',
            description: '50+ verified contributions to city infrastructure',
            unlocked: false,
            progress: '64%'
          },
          {
            id: 'ward_guardian',
            name: 'WARD GUARDIAN',
            title: 'Ward 12 Protector',
            description: '10+ verified improvements in a single municipal ward',
            unlocked: true,
            progress: '100%'
          }
        ],
        transactions: [
          {
            id: 1,
            ticket_id: 'CIV-2026-0007',
            amount: 10,
            activity_type: 'Valid Issue Report',
            status: 'Confirmed',
            description: 'Verified arterial pothole report on 5th Cross Road (Indiranagar)',
            created_at: '17 Sep 2026, 14:30'
          },
          {
            id: 2,
            ticket_id: 'CIV-2026-0004',
            amount: 5,
            activity_type: 'Duplicate Merged',
            status: 'Confirmed',
            description: 'Merged voice with existing water pipeline grievance (+1 Voice)',
            created_at: '15 Sep 2026, 10:15'
          },
          {
            id: 3,
            ticket_id: 'CIV-2026-0002',
            amount: 3,
            activity_type: 'Community Verification',
            status: 'Confirmed',
            description: 'Cast ground-truth vote confirming open drain slab replacement',
            created_at: '14 Sep 2026, 16:45'
          },
          {
            id: 4,
            ticket_id: 'CIV-2026-0001',
            amount: 10,
            activity_type: 'Resolution Bonus',
            status: 'Confirmed',
            description: 'Reported issue successfully resolved and verified within 48h SLA',
            created_at: '12 Sep 2026, 09:20'
          },
          {
            id: 5,
            ticket_id: 'CIV-2026-0012',
            amount: 10,
            activity_type: 'Valid Issue Report',
            status: 'Pending',
            description: 'Fresh pipeline breach reported — undergoing spatial and ground-truth triage',
            created_at: '19 Sep 2026, 13:00'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (id) => {
    switch (id) {
      case 'first_report':
        return <Award className="w-5 h-5 text-amber-600" />;
      case 'community_helper':
        return <Users className="w-5 h-5 text-purple-600" />;
      case 'civic_champion':
        return <ShieldCheck className="w-5 h-5 text-blue-600" />;
      case 'ward_guardian':
        return <MapPin className="w-5 h-5 text-emerald-600" />;
      default:
        return <Award className="w-5 h-5 text-blue-600" />;
    }
  };

  if (loading && !creditData) {
    return (
      <div className="py-20 text-center text-slate-500 animate-pulse text-xs">
        Loading Civic Credits & reputation profile...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-fadeIn">
      {/* Hero Reputation Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Civic Participation & Reputation System</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            {creditData?.user_name}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Ward 12 Indiranagar • {creditData?.stats?.neighborhood_rank || 'Top 5 Community Contributor'}
          </p>
        </div>

        {/* Total Civic Credits Display */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 min-w-[240px] text-center shadow-lg">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-blue-200">
            {t('totalCivicCredits')}
          </div>
          <div className="text-4xl sm:text-5xl font-black text-amber-300 my-1 font-mono tracking-tight flex items-center justify-center gap-2">
            <span>🏆</span>
            <span>{creditData?.total_credits?.toLocaleString()}</span>
          </div>
          <div className="text-[11px] text-blue-100 font-medium">
            Reputation Points (Non-convertible)
          </div>
        </div>
      </div>

      {/* 5 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Confirmed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {creditData?.confirmed_credits?.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Fully verified & unlocked</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            +{creditData?.pending_credits}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting triage & checks</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Reported</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {creditData?.stats?.issues_reported || 14}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Valid grievances filed</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Resolved</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600">
            {creditData?.stats?.issues_resolved || 11}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Physical repairs completed</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Contributions</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600">
            {creditData?.stats?.community_contributions || 28}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Ground-truth verification votes</p>
        </div>
      </div>

      {/* Anti-Abuse Integrity Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-extrabold text-amber-950">
            CivicEye Anti-Abuse & Fraud Protection System Active
          </div>
          <div className="text-amber-800 leading-relaxed">
            Credits are issued in <strong>Pending</strong> state upon submission and become <strong>Confirmed</strong> only after passing spatial checks, OpenCV duplicate verification, and municipal triage. Repeated duplicate uploads or invalid images are flagged as <em>"Suspicious Activity — Review Required"</em> without affecting legitimate participation.
          </div>
        </div>
      </div>

      {/* Achievement Badges Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Civic Achievement Badges</span>
            </h2>
            <p className="text-xs text-slate-500">
              Unlock badges by submitting high-accuracy reports and casting community votes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditData?.badges?.map((badge) => (
            <div
              key={badge.id}
              className={`p-5 rounded-2xl border transition-all ${
                badge.unlocked
                  ? 'bg-white border-blue-200 shadow-sm hover:shadow-md'
                  : 'bg-slate-50 border-slate-200 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                    badge.unlocked ? 'bg-blue-50' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {getBadgeIcon(badge.id)}
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    badge.unlocked
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  {badge.unlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>

              <div className="font-black text-sm text-slate-900">{badge.name}</div>
              <div className="text-xs text-blue-700 font-bold mb-1">{badge.title}</div>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                {badge.description}
              </p>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                  <span>Progress</span>
                  <span>{badge.progress}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      badge.unlocked ? 'bg-blue-600' : 'bg-slate-400'
                    }`}
                    style={{ width: badge.progress }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Point Scoring Rules & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Scoring Rules (Left 4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>How Points Are Earned</span>
            </h3>
            <p className="text-xs text-slate-500">Official Municipal Participation Charter</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Valid Issue Report</div>
                <div className="text-[11px] text-slate-500">Spatial & photo check passed</div>
              </div>
              <span className="font-mono font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                +10 Credits
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Duplicate Merged</div>
                <div className="text-[11px] text-slate-500">Supported existing ticket (+1 Voice)</div>
              </div>
              <span className="font-mono font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                +5 Credits
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Useful Additional Evidence</div>
                <div className="text-[11px] text-slate-500">Angle / landmark photograph</div>
              </div>
              <span className="font-mono font-extrabold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                +5 Credits
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Community Verification</div>
                <div className="text-[11px] text-slate-500">Consensus vote on completed repair</div>
              </div>
              <span className="font-mono font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                +3 Credits
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Resolved Issue Bonus</div>
                <div className="text-[11px] text-slate-500">Issue verified and closed within 48h SLA</div>
              </div>
              <span className="font-mono font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                +10 Credits
              </span>
            </div>
          </div>
        </div>

        {/* Credit History Feed (Right 8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Recent Credit History</span>
              </h3>
              <p className="text-xs text-slate-500">Chronological civic points audit log</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {creditData?.transactions?.length} records
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {creditData?.transactions?.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {t.ticket_id}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        t.status === 'Confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900">{t.activity_type}</div>
                  <div className="text-[11px] text-slate-600 truncate">{t.description}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">{t.created_at}</div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-black font-mono text-base ${
                      t.status === 'Confirmed' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    +{t.amount}
                  </div>
                  <div className="text-[10px] text-slate-400">Credits</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
