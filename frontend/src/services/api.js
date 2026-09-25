const rawApiUrl = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").trim().replace(/\/+$/, '');
// Strip trailing /api if user or Netlify env variable provided it (prevents /api/api)
export const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.slice(0, -4) : rawApiUrl;
const API_BASE = `${API_URL}/api`;

const getHeaders = (extraHeaders = {}) => {
  const currentRole = localStorage.getItem('civiceye_role') || 'citizen';
  const workerId = currentRole === 'worker' ? (localStorage.getItem('civiceye_worker_id') || '14') : '';
  const userName = localStorage.getItem('civiceye_user_name') || 'Priya Sharma';
  return {
    'X-User-Role': currentRole,
    'X-User-Name': userName,
    ...(workerId ? { 'X-Worker-Id': String(workerId) } : {}),
    ...extraHeaders,
  };
};

/**
 * Universal API wrapper with granular status differentiation and network failure interception.
 */
const fetchWithHandling = async (endpoint, options = {}) => {
  // Normalize endpoint to prevent double /api if caller passes '/api/...'
  let cleanEndpoint = endpoint;
  if (cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.slice(4);
  } else if (cleanEndpoint.startsWith('api/')) {
    cleanEndpoint = cleanEndpoint.slice(3);
  } else if (cleanEndpoint === '/api' || cleanEndpoint === 'api') {
    cleanEndpoint = '';
  }

  let url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE}${cleanEndpoint.startsWith('/') ? '' : '/'}${cleanEndpoint}`;

  // Extra safety guarantee: deduplicate accidental /api/api in full URLs
  url = url.replace(/([^:])\/api\/api(\/|$)/g, '$1/api$2');

  let res;
  try {
    res = await fetch(url, options);
  } catch (netErr) {
    const errorMsg = `Unable to connect to CivicEye backend at ${API_URL}. Please verify FastAPI is running on port 8000.`;
    const err = new Error(errorMsg);
    err.name = 'BackendUnreachable';
    err.status = 0;
    err.isNetworkError = true;
    err.original = netErr;
    console.warn(`[CivicEye Network Error] ${url}:`, errorMsg);
    throw err;
  }

  if (!res.ok) {
    let errorDetail = '';
    try {
      const errJson = await res.json();
      if (Array.isArray(errJson.detail)) {
        errorDetail = errJson.detail.map(d => `${d.loc ? d.loc.slice(-1)[0] + ': ' : ''}${d.msg}`).join(', ');
      } else {
        errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
      }
    } catch {
      errorDetail = res.statusText || `HTTP ${res.status}`;
    }

    let descriptiveMsg = `Error (${res.status}): ${errorDetail}`;
    if (res.status === 400) {
      descriptiveMsg = errorDetail || 'Unable to submit the request. Please verify your input and try again.';
    } else if (res.status === 401) {
      descriptiveMsg = `401 Unauthorized: Session invalid or unauthenticated. (${errorDetail})`;
    } else if (res.status === 403) {
      descriptiveMsg = `403 Forbidden: You do not have permission to access this resource. (${errorDetail})`;
    } else if (res.status === 404) {
      descriptiveMsg = `404 Not Found: Requested resource was not found. (${errorDetail})`;
    } else if (res.status === 422) {
      descriptiveMsg = `422 Validation Error: ${errorDetail}`;
    } else if (res.status >= 500) {
      descriptiveMsg = `500 Server Error: Backend encountered an unexpected error. Please try again later.`;
    }

    const error = new Error(descriptiveMsg);
    error.status = res.status;
    error.detail = errorDetail;
    throw error;
  }

  return await res.json();
};

export const api = {
  // System Health
  getHealth: async () => {
    return await fetchWithHandling('/health', { headers: getHeaders() });
  },

  // Ward Detection
  detectWard: async (latitude, longitude) => {
    return await fetchWithHandling('/issues/detect-ward', {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ latitude, longitude }),
    });
  },

  // Issues
  getIssues: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== 'All') {
        query.append(key, val);
      }
    });
    return await fetchWithHandling(`/issues?${query.toString()}`, {
      headers: getHeaders(),
    });
  },

  getIssueDetails: async (ticketOrId) => {
    return await fetchWithHandling(`/issues/${ticketOrId}`, {
      headers: getHeaders(),
    });
  },

  reportIssue: async (data) => {
    return await fetchWithHandling('/issues', {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
  },

  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await fetchWithHandling('/issues/upload-photo', {
      method: 'POST',
      headers: getHeaders(), // Note: No Content-Type header so browser sets boundary multipart
      body: formData,
    });
  },

  getCitizenIssues: async () => {
    return await fetchWithHandling('/citizen/issues', {
      headers: getHeaders(),
    });
  },

  checkDuplicate: async (data) => {
    return await fetchWithHandling('/issues/check-duplicate', {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
  },

  mergeDuplicate: async (data) => {
    return await fetchWithHandling('/issues/merge-duplicate', {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
  },

  upvoteIssue: async (id) => {
    return await fetchWithHandling(`/issues/${id}/upvote`, {
      method: 'POST',
      headers: getHeaders(),
    });
  },

  getMapMarkers: async () => {
    return await fetchWithHandling('/issues/map/markers', {
      headers: getHeaders(),
    });
  },

  // Repairs & Community Verification
  submitRepair: async (id, data) => {
    return await fetchWithHandling(`/issues/${id}/repair`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
  },

  submitCommunityVote: async (id, data) => {
    return await fetchWithHandling(`/issues/${id}/community-vote`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
  },

  citizenVerify: async (id, data) => {
    return await fetchWithHandling(`/issues/${id}/citizen-verify`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
  },

  // Escalations
  getEscalations: async () => {
    return await fetchWithHandling('/escalations', {
      headers: getHeaders(),
    });
  },

  getMunicipalContacts: async () => {
    return await fetchWithHandling('/escalations/contacts', {
      headers: getHeaders(),
    });
  },

  // Worker APIs (RBAC: Worker or Admin)
  getWorkerStats: async () => {
    return await fetchWithHandling('/worker/stats', {
      headers: getHeaders(),
    });
  },

  getAssignedIssues: async () => {
    return await fetchWithHandling('/worker/assigned', {
      headers: getHeaders(),
    });
  },

  startWorkOrder: async (id) => {
    return await fetchWithHandling(`/worker/issues/${id}/start-work`, {
      method: 'POST',
      headers: getHeaders(),
    });
  },

  addWorkNote: async (id, note, workerName = 'Rajesh Kumar') => {
    return await fetchWithHandling(`/worker/issues/${id}/work-note`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ worker_name: workerName, note }),
    });
  },

  getWorkerIssueDetail: async (ticketOrId) => {
    return await fetchWithHandling(`/worker/issues/${ticketOrId}`, {
      headers: getHeaders(),
    });
  },

  getWorkerMapMarkers: async () => {
    return await fetchWithHandling('/worker/map/markers', {
      headers: getHeaders(),
    });
  },

  getWorkerHistory: async () => {
    return await fetchWithHandling('/worker/history', {
      headers: getHeaders(),
    });
  },

  getWorkerProfile: async () => {
    return await fetchWithHandling('/worker/profile', {
      headers: getHeaders(),
    });
  },

  // Admin Actions (RBAC: Admin Only)
  getAdminIssues: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'All') {
        query.append(k, v);
      }
    });
    const qs = query.toString();
    return await fetchWithHandling(`/admin/issues${qs ? `?${qs}` : ''}`, {
      headers: getHeaders(),
    });
  },

  getAdminWorkers: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== 'All') query.append(k, v);
    });
    return await fetchWithHandling(`/admin/workers?${query.toString()}`, {
      headers: getHeaders(),
    });
  },

  getWorkerDetail: async (id) => {
    return await fetchWithHandling(`/admin/workers/${id}`, {
      headers: getHeaders(),
    });
  },

  updateWorkerStatus: async (id, data) => {
    return await fetchWithHandling(`/admin/workers/${id}`, {
      method: 'PATCH',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
  },

  getAdminDashboardSummary: async () => {
    return await fetchWithHandling('/admin/dashboard-summary', {
      headers: getHeaders(),
    });
  },

  getRecommendedWorkers: async (issueId) => {
    return await fetchWithHandling(`/admin/issues/${issueId}/recommended-workers`, {
      headers: getHeaders(),
    });
  },

  getWardMapStats: async () => {
    return await fetchWithHandling('/admin/ward-map/stats', {
      headers: getHeaders(),
    });
  },

  getPublicWardGeojson: async () => {
    return await fetchWithHandling('/issues/wards/geojson', {
      headers: getHeaders(),
    });
  },

  getWardWorkload: async () => {
    return await fetchWithHandling('/admin/ward-workload', {
      headers: getHeaders(),
    });
  },

  // AI Report Generator APIs (Admin)
  getEligibleIssuesForReporting: async () => {
    return await fetchWithHandling('/admin/reports/eligible-issues', {
      headers: getHeaders(),
    });
  },

  generateIssueReport: async (ticketOrId) => {
    return await fetchWithHandling(`/admin/reports/generate/${ticketOrId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
  },

  getGeneratedReports: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== 'All') query.append(k, v);
    });
    return await fetchWithHandling(`/admin/reports?${query.toString()}`, {
      headers: getHeaders(),
    });
  },

  getSingleReport: async (reportId) => {
    return await fetchWithHandling(`/admin/reports/${reportId}`, {
      headers: getHeaders(),
    });
  },

  // Citizen Civic Credits
  getCitizenCredits: async () => {
    return await fetchWithHandling('/citizen/credits', {
      headers: getHeaders(),
    });
  },

  // AI Copilot APIs
  copilotChat: async (data) => {
    return await fetchWithHandling('/copilot/chat', {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
  },

  classifyDraft: async (text, language = 'en') => {
    return await fetchWithHandling('/copilot/classify-draft', {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ text, language }),
    });
  },

  generateRepairNote: async (rawNotes, ticketId, language = 'en') => {
    return await fetchWithHandling('/copilot/repair-note', {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ raw_notes: rawNotes, ticket_id: ticketId, language }),
    });
  },

  getAuditLogs: async () => {
    return await fetchWithHandling('/admin/audit-logs', {
      headers: getHeaders(),
    });
  },

  assignWorker: async (id, data) => {
    return await fetchWithHandling(`/admin/issues/${id}/assign`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
  },

  approveRepair: async (id, data) => {
    return await fetchWithHandling(`/admin/issues/${id}/approve-repair`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
  },

  rejectRepair: async (id, data) => {
    return await fetchWithHandling(`/admin/issues/${id}/reject-repair`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
  },

  reopenIssue: async (id, data) => {
    return await fetchWithHandling(`/admin/issues/${id}/reopen`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
  },

  adminEscalate: async (id) => {
    return await fetchWithHandling(`/admin/issues/${id}/escalate`, {
      method: 'POST',
      headers: getHeaders(),
    });
  },

  // Emergency APIs
  getEmergencyContacts: async () => {
    return await fetchWithHandling('/emergency/contacts', {
      headers: getHeaders(),
    });
  },

  getEmergencyIncidents: async () => {
    return await fetchWithHandling('/emergency/incidents', {
      headers: getHeaders(),
    });
  },

  getRoleNotifications: async (role) => {
    return await fetchWithHandling(`/emergency/notifications?role=${encodeURIComponent(role)}`, {
      headers: getHeaders(),
    });
  },

  markNotificationRead: async (id) => {
    return await fetchWithHandling(`/emergency/notifications/read/${id}`, {
      method: 'POST',
      headers: getHeaders(),
    });
  },

  // Analytics
  getAnalytics: async () => {
    return await fetchWithHandling('/analytics', {
      headers: getHeaders(),
    });
  },

  // Demo Controls
  resetDemoData: async () => {
    return await fetchWithHandling('/demo/reset', {
      method: 'POST',
      headers: getHeaders(),
    });
  },

  fastForwardTimer: async (ticketId) => {
    return await fetchWithHandling(`/demo/fast-forward-timer/${ticketId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
  },

  simulateFakeFix: async (ticketId) => {
    return await fetchWithHandling(`/demo/simulate-fake-fix/${ticketId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
  },

  simulateRealFix: async (ticketId) => {
    return await fetchWithHandling(`/demo/simulate-real-fix/${ticketId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
  }
};
