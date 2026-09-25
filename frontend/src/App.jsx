import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { EmergencyModal } from './components/EmergencyModal';
import { CitizenFloatingCopilot } from './components/CitizenFloatingCopilot';

// Citizen Pages
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ReportIssue } from './pages/ReportIssue';
import { MyReports } from './pages/MyReports';
import { CitizenCreditsPage } from './pages/CitizenCreditsPage';
import { CitizenCopilotPage } from './pages/CitizenCopilotPage';

// Worker Pages
import { WorkerDashboard } from './pages/WorkerDashboard';
import { WorkerIssueDetailPage } from './pages/WorkerIssueDetailPage';
import { WorkerMapPage } from './pages/WorkerMapPage';
import { WorkerHistoryPage } from './pages/WorkerHistoryPage';
import { WorkerCopilotPage } from './pages/WorkerCopilotPage';

// Admin Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminReportsPage } from './pages/AdminReportsPage';
import { AdminWardMapPage } from './pages/AdminWardMapPage';
import { AdminWorkersPage } from './pages/AdminWorkersPage';
import { AdminIssuesPage } from './pages/AdminIssuesPage';

// Shared & System Pages
import { Home } from './pages/Home';
import { CivicMap } from './pages/CivicMap';
import { CommunityVerificationPage } from './pages/CommunityVerificationPage';
import { IssueDetails } from './pages/IssueDetails';
import { Analytics } from './pages/Analytics';
import { Escalations } from './pages/Escalations';
import { EmergencyPage } from './pages/EmergencyPage';
import { Profile } from './pages/Profile';

import { Eye } from 'lucide-react';

// Protected Route Guard Component
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { currentRole, user } = useAuth();

  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to={user.dashboardPath || '/citizen/dashboard'} replace />;
  }
  return children;
};

// Role-aware root redirector
const RootRedirector = () => {
  const { currentRole } = useAuth();
  if (currentRole === 'worker') {
    return <Navigate to="/worker/dashboard" replace />;
  }
  if (currentRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <CitizenDashboard />;
};

function AppContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { emergencyModalOpen, closeEmergencyModal } = useAuth();

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-blue-600 selection:text-white">
      {/* Light Dynamic Role Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Layout Body (Shifted on Desktop for Sidebar) */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        {/* White Top Header with Role Switcher & Language Switcher & Emergency Call */}
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Main Routed Content */}
        <main className="flex-1 min-w-0" key={refreshKey}>
          <Routes>
            {/* Root / Default */}
            <Route path="/" element={<RootRedirector />} />

            {/* 1. Citizen Routes (Reporting-Only: No general issue browsing) */}
            <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/report-issue" element={<ReportIssue />} />
            <Route path="/citizen/report" element={<ReportIssue />} />
            <Route path="/citizen/my-reports" element={<MyReports />} />
            <Route path="/my-reports" element={<MyReports />} />
            <Route path="/citizen/credits" element={<CitizenCreditsPage />} />
            <Route path="/citizen/copilot" element={<CitizenCopilotPage />} />
            <Route path="/community-verification" element={<CommunityVerificationPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/notifications" element={<EmergencyPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/issues/:id" element={<IssueDetails />} />

            {/* Citizen Map: Full interactive ward-divided map with status filters and pin-dropping */}
            <Route path="/map" element={<CivicMap />} />
            <Route path="/citizen/map" element={<CivicMap />} />
            <Route path="/citizen/nearby" element={<CivicMap />} />

            {/* 2. Worker Routes (Protected: worker, admin) */}
            <Route
              path="/worker/*"
              element={
                <ProtectedRoute allowedRoles={['worker', 'admin']}>
                  <Routes>
                    <Route path="dashboard" element={<WorkerDashboard />} />
                    <Route path="assigned" element={<WorkerDashboard />} />
                    <Route path="priority" element={<WorkerDashboard />} />
                    <Route path="issues/:id" element={<WorkerIssueDetailPage />} />
                    <Route path="map" element={<WorkerMapPage />} />
                    <Route path="history" element={<WorkerHistoryPage />} />
                    <Route path="copilot" element={<WorkerCopilotPage />} />
                    <Route path="submit-repair" element={<WorkerDashboard />} />
                    <Route path="emergency-assignments" element={<EmergencyPage />} />
                    <Route path="*" element={<Navigate to="/worker/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker"
              element={
                <ProtectedRoute allowedRoles={['worker', 'admin']}>
                  <Navigate to="/worker/dashboard" replace />
                </ProtectedRoute>
              }
            />

            {/* 3. Admin Routes (Protected: admin only) */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="reports" element={<AdminReportsPage />} />
                    <Route path="ward-map" element={<AdminWardMapPage />} />
                    <Route path="workers" element={<AdminWorkersPage />} />
                    <Route path="complaints" element={<AdminIssuesPage />} />
                    <Route path="map" element={<CivicMap />} />
                    <Route path="assignments" element={<AdminDashboard />} />
                    <Route path="ai-review" element={<AdminDashboard />} />
                    <Route path="emergency-incidents" element={<EmergencyPage />} />
                    <Route path="contacts" element={<AdminDashboard />} />
                    <Route path="audit-logs" element={<AdminDashboard />} />
                    <Route path="settings" element={<AdminDashboard />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              }
            />

            {/* Shared Public Analytics & Escalations */}
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/escalations" element={<Escalations />} />

            {/* Catch-All Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Floating Citizen AI Copilot Trigger */}
        <CitizenFloatingCopilot />

        {/* Global Emergency Help Modal */}
        <EmergencyModal
          isOpen={emergencyModalOpen}
          onClose={closeEmergencyModal}
        />

        {/* Toast Notification Container */}
        <Toast />

        {/* Clean Light Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-800">CivicEye AI</span>
              <span>— Civic Issue Escalation &amp; Public Accountability Platform</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-blue-700 font-bold font-mono">
                RBAC Workspaces • OpenCV CV Engine • 48h SLA • Multi-Lingual (EN/বাংলা/हिन्दी)
              </span>
              <span className="text-slate-400">Bright Civic-Tech Light Theme</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}
