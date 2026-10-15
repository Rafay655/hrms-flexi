/**
 * lib/api/connect-central/policies.ts
 * ConnectCentral — Session Policy and Password Policy API client.
 */

import { api } from "@/lib/api";

// ── Session Policy types ──────────────────────────────────────────────────────

export type SessionPolicy = {
  // Backend SessionPolicyResource keys records by uuid (not id) — required to
  // build the PUT /session-policies/{uuid} path (CC-D1).
  uuid: string;
  company_id?: number | null;
  role?: string | null;
  session_timeout_minutes: number;
  absolute_timeout_minutes?: number | null;
  max_concurrent_sessions: number;
  require_mfa: boolean;
  enforce_single_device: boolean;
  require_2fa_on_new_device?: boolean;
  enforce_ip_whitelist: boolean;
  allowed_ip_ranges?: string[] | null;
  allowed_countries?: string[] | null;
  effective_from?: string | null;
  is_active: boolean;
  is_system_default?: boolean;
};

export type UpdateSessionPolicyPayload = Omit<
  SessionPolicy,
  "uuid" | "company_id" | "is_system_default"
>;

// ── Password Policy types ─────────────────────────────────────────────────────

export type PasswordPolicy = {
  id?: number;
  company_id?: number | null;
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
  history_count: number;
  expiry_days: number;
  min_age_days: number;
  max_failed_attempts: number;
  lockout_duration_minutes: number;
  max_login_attempts_per_minute: number;
  is_active: boolean;
  updated_at?: string;
};

export type UpdatePasswordPolicyPayload = Omit<
  PasswordPolicy,
  "id" | "company_id" | "updated_at"
>;

// ── Session Policy API ────────────────────────────────────────────────────────

/** GET /api/v1/connect-central/session-policies */
export async function getSessionPolicies(): Promise<SessionPolicy[]> {
  const { data } = await api.get<{ success: boolean; data: SessionPolicy[] }>(
    "/connect-central/session-policies"
  );
  return data.data;
}

/**
 * PUT /api/v1/connect-central/session-policies/{uuid}
 * The backend update route is keyed by the policy uuid (plural prefix).
 */
export async function updateSessionPolicy(
  uuid: string,
  payload: UpdateSessionPolicyPayload
): Promise<SessionPolicy> {
  const { data } = await api.put<{ success: boolean; data: SessionPolicy }>(
    `/connect-central/session-policies/${uuid}`,
    payload
  );
  return data.data;
}

// ── Password Policy API ───────────────────────────────────────────────────────

/** GET /api/v1/connect-central/password-policy */
export async function getPasswordPolicy(): Promise<PasswordPolicy> {
  const { data } = await api.get<{ success: boolean; data: PasswordPolicy }>(
    "/connect-central/password-policy"
  );
  return data.data;
}

/** PUT /api/v1/connect-central/password-policy */
export async function updatePasswordPolicy(
  payload: UpdatePasswordPolicyPayload
): Promise<PasswordPolicy> {
  const { data } = await api.put<{ success: boolean; data: PasswordPolicy }>(
    "/connect-central/password-policy",
    payload
  );
  return data.data;
}
