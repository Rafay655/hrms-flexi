// services/audit-trail.service.ts
// Audit Trail Module 1.2 — export API client
//
// All paths are relative to NEXT_PUBLIC_API_URL (e.g. http://localhost:8000/api/v1).
// Routes used here:
//   POST /api/v1/audit-trail/security/export          → requestSecurityExport
//   POST /api/v1/audit-trail/activity/export          → requestActivityExport
//   POST /api/v1/audit-trail/business/export          → requestBusinessExport
//   GET  /api/v1/audit-trail/exports/{uuid}/status    → getExportStatus
//
// Other audit-trail endpoints (combined feed, security list, security summary,
// business diff, etc.) are called inline via `api` in their page components until
// a full service layer migration is scheduled.

import { api } from "@/lib/api";

const BASE = "/audit-trail";

// ── Shared types ──────────────────────────────────────────────────────────────

/**
 * Status shape returned by GET /audit-trail/exports/{uuid}/status.
 * Terminal states: "complete" | "failed" — polling stops on either.
 */
export interface AuditExportStatus {
  status: "pending" | "processing" | "complete" | "failed";
  record_count: number | null;
  download_url: string | null;
  error_message: string | null;
  expires_at: string | null;
}

// ── Security export params ────────────────────────────────────────────────────

/**
 * Filter params for POST /audit-trail/security/export.
 * Mirrors the filter bar state on the Security Audit Log page.
 * `page` is intentionally excluded — exports always cover all matching rows.
 */
export interface SecurityExportParams {
  event_type?: string;
  risk_level?: string;   // comma-joined for multi-select, e.g. "high,critical"
  ip_address?: string;
  user?: string;
  date_from?: string;
  date_to?: string;
}

// ── Activity export params ────────────────────────────────────────────────────

/**
 * Filter params for POST /audit-trail/activity/export.
 * Mirrors the filter bar state on the Activity Audit Log page.
 */
export interface ActivityExportParams {
  module?: string;
  action?: string;
  user?: string;
  date_from?: string;
  date_to?: string;
}

// ── Business export params ────────────────────────────────────────────────────

/**
 * Filter params for POST /audit-trail/business/export.
 * Mirrors the filter options on the Business (model-mutation) audit view.
 */
export interface BusinessExportParams {
  subject_type?: string;
  user?: string;
  date_from?: string;
  date_to?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Strips undefined/empty-string values from a params object so the API
 * doesn't receive spurious ?event_type=&risk_level= query strings.
 */
function stripEmpty(
  params: Record<string, string | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
  ) as Record<string, string>;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const auditTrailService = {
  /**
   * Kicks off an async CSV export of the security audit log.
   * Returns the export job UUID, which should be polled via getExportStatus().
   * Requires `export-audit-logs` permission.
   * Backend returns 202 Accepted — the export job is dispatched on the `audit` queue.
   */
  requestSecurityExport: async (params: SecurityExportParams): Promise<string> => {
    const { data } = await api.post<{
      success: boolean;
      data: { export_uuid: string };
    }>(`${BASE}/security/export`, stripEmpty(params as Record<string, string | undefined>));
    return data.data.export_uuid;
  },

  /**
   * Kicks off an async CSV export of the activity audit log.
   * Returns the export job UUID.
   * Requires `export-audit-logs` permission.
   */
  requestActivityExport: async (params: ActivityExportParams): Promise<string> => {
    const { data } = await api.post<{
      success: boolean;
      data: { export_uuid: string };
    }>(`${BASE}/activity/export`, stripEmpty(params as Record<string, string | undefined>));
    return data.data.export_uuid;
  },

  /**
   * Kicks off an async CSV export of the business (model-mutation) audit log.
   * Returns the export job UUID.
   * Requires `export-audit-logs` permission.
   */
  requestBusinessExport: async (params: BusinessExportParams): Promise<string> => {
    const { data } = await api.post<{
      success: boolean;
      data: { export_uuid: string };
    }>(`${BASE}/business/export`, stripEmpty(params as Record<string, string | undefined>));
    return data.data.export_uuid;
  },

  /**
   * Polls a single export job by UUID.
   * Caller should stop polling when status === "complete" | "failed".
   * Shared by security, activity, and business export jobs.
   */
  getExportStatus: async (uuid: string): Promise<AuditExportStatus> => {
    const { data } = await api.get<{
      success: boolean;
      data: AuditExportStatus;
    }>(`${BASE}/exports/${uuid}/status`);
    return data.data;
  },
};
