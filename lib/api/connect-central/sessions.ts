/**
 * lib/api/connect-central/sessions.ts
 * ConnectCentral — Session management API client.
 *
 * Covers: own sessions, company-wide session listing, and revocation.
 */

import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DeviceType = "web" | "mobile" | "api" | "cli";

export type RevocationReason =
  | "logout"
  | "admin_revoke"
  | "token_expired"
  | "password_changed"
  | "account_locked"
  | "suspicious_activity"
  | "policy_violation"
  | "device_limit_exceeded"
  | "mfa_reset"
  | "account_deactivated";

export type UserSession = {
  uuid: string;
  user_id?: number;
  user?: { name: string; email: string };
  company_id: number;
  device_type: DeviceType;
  ip_address: string;
  user_agent?: string;
  is_active: boolean;
  last_activity_at: string;
  revoked_at?: string;
  revocation_reason?: RevocationReason;
  created_at: string;
};

export type CompanySessionFilters = {
  device_type?: DeviceType;
  page?: number;
  per_page?: number;
};

export type BulkRevokePayload = {
  session_uuids: string[];
};

export type BulkRevokeResult = {
  revoked_count: number;
};

// ── Own sessions ──────────────────────────────────────────────────────────────

/** Shape returned by GET /connect-central/sessions/active (SessionResource + is_current/can_revoke). */
export type OwnSession = {
  uuid: string;
  device_type: DeviceType;
  device_name: string | null;
  ip_address: string;
  location_city: string | null;
  location_country: string | null;
  last_activity_at: string;
  created_at: string;
  is_current: boolean;
  can_revoke: boolean;
};

/** GET /api/v1/connect-central/sessions/active — own active sessions */
export async function getMyActiveSessions(): Promise<OwnSession[]> {
  const { data } = await api.get<{ success: boolean; data: OwnSession[] }>(
    "/connect-central/sessions/active"
  );
  return data.data;
}

/** DELETE /api/v1/connect-central/sessions/{uuid} — revoke one of own sessions */
export async function revokeMySession(uuid: string): Promise<void> {
  await api.delete(`/connect-central/sessions/${uuid}`);
}

/** DELETE /api/v1/connect-central/sessions/revoke-all — revoke all own sessions except current */
export async function revokeAllMySessions(): Promise<void> {
  await api.delete("/connect-central/sessions/revoke-all");
}

// ── Company sessions (admin) ──────────────────────────────────────────────────

/** Shape returned by GET /connect-central/company-sessions (CompanySessionResource). */
export type CompanySession = {
  uuid: string;
  user: { id: number; name: string; email: string; initials: string; role: string };
  device_type: DeviceType;
  ip_address: string;
  location_city: string | null;
  location_country: string | null;
  last_activity_at: string;
  created_at: string;
  risk_score: "low" | "medium" | "high";
};

/** GET /api/v1/connect-central/company-sessions — company-wide active sessions */
export async function getCompanySessions(
  filters: CompanySessionFilters = {}
): Promise<CompanySession[]> {
  // CompanySessionController::index() returns
  // success(CompanySessionResource::collection($paginator)). Because ApiResponse wraps
  // the value as-is, a paginated resource collection nests under data.data as
  // { data: [...], links, meta }. The consumer page expects a flat CompanySession[]
  // (it maps over the result), so extract the array here; tolerate a plain array too
  // in case the envelope shape changes.
  const { data } = await api.get("/connect-central/company-sessions", {
    params: filters,
  });
  const payload = data.data ?? {};
  return Array.isArray(payload) ? payload : payload.data ?? [];
}

/** POST /api/v1/connect-central/company-sessions/revoke — bulk revoke */
export async function bulkRevokeSessions(
  payload: BulkRevokePayload
): Promise<BulkRevokeResult> {
  const { data } = await api.post<{ success: boolean; data: BulkRevokeResult }>(
    "/connect-central/company-sessions/revoke",
    payload
  );
  return data.data;
}
