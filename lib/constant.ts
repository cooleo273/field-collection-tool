// src/lib/constants.ts

// API Configuration
export const API_BASE_PATH = '/api';
export const STATS_API_ENDPOINT = `${API_BASE_PATH}/stats`;

// API Actions
export enum ApiAction {
  GetProjectAdminDashboardStats = 'getProjectAdminDashboardStats',
  GetPromoterDashboardStats = 'getPromoterDashboardStats',
}

// Submission Statuses
export enum SubmissionStatus {
  Draft = 'draft',
  Submitted = 'submitted', // Often considered 'Pending' in UI
  Approved = 'approved',
  Rejected = 'rejected',
}

// UI Constants / Limits
export const RECENT_SUBMISSIONS_LIMIT = 5;
export const SUBMISSION_TREND_DAYS = 30;
export const TOP_CAMPAIGN_LIMIT = 10;

// Status Colors for Charts (Tailwind classes or hex codes)
export const STATUS_COLORS: Record<string, string> = {
  [SubmissionStatus.Submitted]: '#facc15', // yellow-400 (Pending)
  [SubmissionStatus.Approved]: '#22c55e', // green-500
  [SubmissionStatus.Rejected]: '#ef4444', // red-500
  [SubmissionStatus.Draft]: '#6b7280',    // gray-500
  other: '#3b82f6',                      // blue-500
};

// Chart Names/Labels
export const STATUS_DISTRIBUTION_NAMES: Record<string, string> = {
    [SubmissionStatus.Submitted]: 'Pending',
    [SubmissionStatus.Approved]: 'Approved',
    [SubmissionStatus.Rejected]: 'Rejected',
    [SubmissionStatus.Draft]: 'Draft',
    other: 'Other',
};