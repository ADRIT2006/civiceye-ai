import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Map, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Users, 
  Layers, 
  ScanLine, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Building2,
  CheckCircle
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CountdownTimer } from '../components/CountdownTimer';
import { CivicMapWidget } from '../components/CivicMapWidget';

export const Home = () => {
  const [issues, setIssues] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Pothole', 'Open Drain', 'Garbage', 'Broken Streetlight', 'Water Leakage', 'Road Damage'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [issuesRes, analyticsRes] = await Promise.all([
        api.getIssues(),
        api.getAnalytics()
      ]);
      setIssues(issuesRes);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = activeCategory === 'All'
    ? issues
    : issues.filter((i) => i.category.toLowerCase() === activeCategory.toLowerCase());

  const criticalIssues = issues.filter((i) => i.priority_level === 'Critical' || i.status === 'Escalated');

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Section: Subtle White -> Sky Blue -> Very Light Green Gradient */}
      <section className="relative pt-12 pb-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-sky-50/70 to-emerald-50/40 border-b border-slate-200/80 overflow-hidden">
        {/* Subtle decorative civic grid elements */}
        <div className="max-w-5xl mx-auto text-center space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider shadow-sm animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Next-Gen Smart City Grievance & Escalation Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            CivicEye AI
          </h1>

          <p className="text-xl sm:text-2xl text-blue-900 font-semibold max-w-2xl mx-auto">
            Turning Civic Complaints Into Public Accountability.
          </p>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-normal leading-relaxed">
            "See it. Report it. Track it. Fix it." <br />
            Powered by spatial duplicate detection, OpenCV fake-fix verification, and automated 48-hour statutory escalation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/report"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 transition transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Report an Issue</span>
            </Link>

            <Link
              to="/map"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm transition"
            >
              <Map className="w-5 h-5 text-blue-600" />
              <span>Explore Civic Map</span>
            </Link>
          </div>

          {/* Stepper Pill Strip */}
          <div className="pt-6">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-5 py-2.5 rounded-full bg-white/95 border border-slate-200 text-xs font-semibold shadow-sm text-slate-600">
              <span className="text-blue-700 font-bold">1. Report</span>
              <span className="text-slate-300">→</span>
              <span className="text-sky-700 font-bold">2. AI Deduplication</span>
              <span className="text-slate-300">→</span>
              <span className="text-blue-700 font-bold">3. Public Track</span>
              <span className="text-slate-300">→</span>
              <span className="text-rose-600 font-bold">4. 48h Escalate</span>
              <span className="text-slate-300">→</span>
              <span className="text-purple-700 font-bold">5. AI Fake-Fix Check</span>
              <span className="text-slate-300">→</span>
              <span className="text-emerald-600 font-bold">6. Resolve ✓</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Metric Cards: Distinctive Light Cards per Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {/* Card 1: Open Issues -> Blue Accent */}
          <div className="p-5 rounded-2xl bg-white border border-blue-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition">
            <div className="flex items-center justify-between text-blue-700 text-xs font-bold uppercase tracking-wider">
              <span>Open Issues</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">
              {analytics?.open_issues ?? 8}
            </div>
            <div className="text-[11px] text-blue-600 mt-1 font-semibold">Active in queue</div>
          </div>

          {/* Card 2: Resolved Issues -> Green Accent */}
          <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition">
            <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <span>Resolved</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-2">
              {analytics?.resolved_issues ?? 3}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 font-semibold">Ground-truth verified</div>
          </div>

          {/* Card 3: Escalated Issues -> Red Accent */}
          <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-sm relative overflow-hidden group hover:border-rose-300 transition">
            <div className="flex items-center justify-between text-rose-700 text-xs font-bold uppercase tracking-wider">
              <span>Escalated (48h)</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-rose-600 mt-2">
              {analytics?.escalated_issues ?? 3}
            </div>
            <div className="text-[11px] text-rose-700 mt-1 font-semibold">Statutory notice sent</div>
          </div>

          {/* Card 4: Citizens Participating -> Purple Accent */}
          <div className="p-5 rounded-2xl bg-white border border-purple-200 shadow-sm relative overflow-hidden group hover:border-purple-300 transition">
            <div className="flex items-center justify-between text-purple-700 text-xs font-bold uppercase tracking-wider">
              <span>Citizens Voiced</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-purple-900 mt-2">
              {analytics?.citizens_participating ?? 348}
            </div>
            <div className="text-[11px] text-purple-700 mt-1 font-semibold">Reports & upvotes merged</div>
          </div>

          {/* Card 5: Avg Resolution Time -> Orange Accent */}
          <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm relative overflow-hidden col-span-2 md:col-span-1 group hover:border-amber-300 transition">
            <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider">
              <span>Avg Resolution</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">
              {analytics?.average_resolution_hours ?? 28.5}h
            </div>
            <div className="text-[11px] text-amber-700 mt-1 font-semibold">Statutory SLA: 48h max</div>
          </div>
        </div>
      </section>

      {/* 3 Innovations: Clean White Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Core Civic Innovations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Engineered to eliminate municipal apathy and verify actual repairs with computer vision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Innovation 1 */}
          <div className="p-6 rounded-2xl civic-card group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-0.5">Smart Duplicate Detection</h3>
            <div className="text-blue-700 text-xs font-semibold mb-2">
              "50 reports. One powerful ticket."
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Spatial GPS clustering within 50m combined with OpenCV perceptual hashing merges duplicate complaints into a single master ticket, compounding public pressure rather than cluttering the database.
            </p>
          </div>

          {/* Innovation 2 */}
          <div className="p-6 rounded-2xl civic-card group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
              <ScanLine className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-0.5">AI Repair Verification</h3>
            <div className="text-purple-700 text-xs font-semibold mb-2">
              "Don't just close it. Prove it's fixed."
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When workers submit 'After Repair' photos, OpenCV RANSAC keypoint homography and background structure matching detect fake fixes and flag suspicious submissions for manual review.
            </p>
          </div>

          {/* Innovation 3 */}
          <div className="p-6 rounded-2xl civic-card group">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 group-hover:bg-rose-600 group-hover:text-white transition">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-0.5">Automated 48-Hour Escalation</h3>
            <div className="text-rose-700 text-xs font-semibold mb-2">
              "No response shouldn't mean no accountability."
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every complaint carries a strict statutory countdown clock. If unresolved at 48 hours, Level 1 triggers an official grievance notice to the Ward Executive Engineer; Level 2 broadcasts a public accountability post via the X bot.
            </p>
          </div>
        </div>
      </section>

      {/* Live Civic Operations Map Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Map className="w-5 h-5 text-blue-600" />
                Live Civic Operations Map
              </h3>
              <p className="text-xs text-slate-500">
                Pulsing pins indicate high-priority or escalated civic issues requiring urgent intervention.
              </p>
            </div>
            <Link
              to="/map"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Open Full-Screen GIS Map <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <CivicMapWidget issues={issues} height="420px" />
        </div>
      </section>

      {/* Critical & Escalated Complaints Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-600" />
              Critical & Escalated Complaints
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              High-impact grievances carrying strong neighborhood support or exceeded SLA windows.
            </p>
          </div>
          <Link
            to="/escalations"
            className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
          >
            View Escalation Registry <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {criticalIssues.slice(0, 6).map((issue) => (
            <Link
              key={issue.id}
              to={`/issues/${issue.ticket_id}`}
              className="p-5 rounded-2xl civic-card flex flex-col justify-between group"
            >
              <div>
                <div className="relative mb-3 rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={issue.before_image_url}
                    alt={issue.title}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <PriorityBadge level={issue.priority_level} score={issue.priority_score} />
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <StatusBadge status={issue.status} />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {issue.ticket_id}
                  </span>
                  <span className="text-[11px] text-slate-500">• {issue.ward}</span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {issue.title}
                </h4>

                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {issue.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    {issue.report_count} Citizens Voiced
                  </span>
                  <span className="text-slate-500 font-mono">
                    {issue.upvotes} Upvotes
                  </span>
                </div>

                <CountdownTimer
                  deadline={issue.escalation_deadline}
                  isResolved={issue.status === 'Resolved'}
                  isEscalated={issue.status === 'Escalated'}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Public Civic Registry Filter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Public Civic Grievance Registry</h3>
            <p className="text-xs text-slate-500 mt-0.5">Explore complaints across all municipal administrative wards</p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredIssues.slice(0, 8).map((issue) => (
            <Link
              key={issue.id}
              to={`/issues/${issue.ticket_id}`}
              className="p-4 rounded-2xl civic-card flex flex-col justify-between"
            >
              <div>
                <img
                  src={issue.before_image_url}
                  alt={issue.title}
                  className="w-full h-32 object-cover rounded-xl border border-slate-200 mb-2.5"
                />
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-xs font-bold text-blue-700">{issue.ticket_id}</span>
                  <StatusBadge status={issue.status} size="sm" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{issue.title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{issue.address}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="text-blue-700 font-semibold">{issue.report_count} reports</span>
                <span className="font-mono">{issue.priority_level}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
