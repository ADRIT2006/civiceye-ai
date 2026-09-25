/**
 * CivicEye AI — Standardized Status Utility & Formatter
 * Strictly maps backend uppercase status codes to human-readable labels.
 */

export const STATUS_MAP = {
  'REPORTED': 'Reported',
  'ACKNOWLEDGED': 'Acknowledged',
  'ASSIGNED': 'Assigned',
  'IN_PROGRESS': 'In Progress',
  'REPAIR_SUBMITTED': 'Repair Submitted',
  'UNDER_REVIEW': 'Under Review',
  'COMMUNITY_VERIFICATION': 'Community Verification',
  'AWAITING_CITIZEN_VERIFICATION': 'Awaiting Citizen Verification',
  'RESOLVED': 'Resolved',
  'REOPENED': 'Reopened',
  'ESCALATED': 'Escalated',
  'DISPUTED': 'Disputed'
};

/**
 * Converts any raw backend or legacy status string into a clean, canonical human-readable label.
 * Example: REPAIR_SUBMITTED -> "Repair Submitted"
 */
export const formatStatus = (rawStatus) => {
  if (!rawStatus) return 'Reported';
  const normalized = String(rawStatus).trim().toUpperCase().replace(/\s+/g, '_');
  return STATUS_MAP[normalized] || rawStatus;
};

/**
 * Returns canonical uppercase backend status code for filtering/API payloads.
 * Example: "In Progress" -> "IN_PROGRESS"
 */
export const toBackendStatus = (displayStatus) => {
  if (!displayStatus || displayStatus === 'All') return displayStatus;
  return String(displayStatus).trim().toUpperCase().replace(/\s+/g, '_');
};
