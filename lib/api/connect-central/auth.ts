/**
 * lib/api/connect-central/auth.ts
 * ConnectCentral — Two-Factor Authentication API client.
 *
 * All calls are relative to NEXT_PUBLIC_API_URL (which already includes /api/v1).
 * The Authorization, X-Company-ID and X-Session-UUID headers and the 403 toast are
 * handled by the shared `api` client interceptors (lib/api.ts); this module only
 * declares the 2FA API functions.
 */

import { api } from "@/lib/api";
import { AuthUser } from "@/store/authSlice";
// ── Response types ────────────────────────────────────────────────────────────

export type TwoFactorStatus = {
  enabled: boolean;
  confirmed: boolean;
  method: "totp" | "email" | null;
  recovery_codes_count: number;
};

// FIX: this previously declared { qr_uri: string; uuid: string } which did not
// match the actual backend response. Confirmed against the real API payload:
// { secret, qr_code_uri, totp_id }.
export type TotpSetupPayload = {
  secret: string;
  qr_code_uri: string;
  totp_id: string;
  qr_code_svg: string;
};

// FIX: previously { name: string; email: string } — the real /verify and
// /recovery payloads return the full user object (same shape as login), so
// this now matches AuthUser instead of a partial shape.
export type VerifyTotpPayload = {
  token: string;
  session_uuid: string;
  user: AuthUser;
};

export type RecoveryCodesPayload = {
  count: number;
  masks: string[]; // e.g. ["RECO****", "XYZW****"]
  plain_codes?: string[]; // only returned once on regenerate
};

// ── API functions ─────────────────────────────────────────────────────────────

/** GET /api/v1/connect-central/2fa/status */
export async function get2FAStatus(): Promise<TwoFactorStatus> {
  const { data } = await api.get<{ success: boolean; data: TwoFactorStatus }>(
    "/connect-central/2fa/status"
  );
  return data.data;
}

/** POST /api/v1/connect-central/2fa/setup — generate TOTP secret + QR URI */
export async function setup2FA(): Promise<TotpSetupPayload> {
  const { data } = await api.post<{ success: boolean; data: TotpSetupPayload }>(
    "/connect-central/2fa/setup"
  );
  return data.data;
}

export type Confirm2FAResponse = {
  recovery_codes: string[];
  token: string;
  user: AuthUser;
};

/** POST /api/v1/connect-central/2fa/confirm — confirm TOTP with a valid code
 *  (used during forced first-time 2FA setup, when `2fa_setup_required: true`). */
export async function confirm2FA(code: string): Promise<Confirm2FAResponse> {
  const { data } = await api.post<{
    success: boolean;
    data: Confirm2FAResponse;
  }>("/connect-central/2fa/confirm", { code });
  return data.data;
}

/** DELETE /api/v1/connect-central/2fa/disable — re-auth with the account password */
export async function disable2FA(password: string): Promise<void> {
  await api.delete("/connect-central/2fa/disable", { data: { password } });
}

/** GET /api/v1/connect-central/2fa/recovery-codes
 *  Backend returns { remaining_count, codes: [masked] }. Normalise to the card's
 *  shape { count, masks }; plain codes only ever exist on regenerate. */
export async function getRecoveryCodes(): Promise<RecoveryCodesPayload> {
  // CC-D4: backend returns { remaining_count, codes } (codes already masked) —
  // map to the {count, masks} shape the 2FA hub consumes.
  const { data } = await api.get<{
    success: boolean;
    data: { remaining_count: number; codes: string[] };
  }>("/connect-central/2fa/recovery-codes");
  return { count: data.data.remaining_count, masks: data.data.codes ?? [] };
}

/** POST /api/v1/connect-central/2fa/recovery-codes/regenerate — re-auth with the
 *  account password. Backend returns the fresh plain codes once as { codes, warning }. */
export async function regenerateRecoveryCodes(
  password: string
): Promise<RecoveryCodesPayload> {
  const { data } = await api.post<{
    success: boolean;
    data: { codes: string[]; warning?: string };
  }>("/connect-central/2fa/recovery-codes/regenerate", { password });
  const codes = data.data.codes ?? [];
  return { count: codes.length, masks: [], plain_codes: codes };
}

/** POST /api/v1/connect-central/2fa/verify — exchange the limited login token
 *  (5-minute window) for a full session token, using a TOTP code from the
 *  user's authenticator app. Used when `requires_2fa: true` on login. */
export async function verify2FACode(code: string): Promise<VerifyTotpPayload> {
  const { data } = await api.post<{ success: boolean; data: VerifyTotpPayload }>(
    "/auth/2fa/verify",
    { code }
  );
  return data.data;
}

/** POST /api/v1/auth/2fa/recovery — exchange the limited login token
 *  for a full session token using a 10-character backup recovery code, as a
 *  fallback when the user has no access to their authenticator app. */
export async function useRecoveryCode(
  recovery_code: string
): Promise<VerifyTotpPayload> {
  const { data } = await api.post<{ success: boolean; data: VerifyTotpPayload }>(
    "/auth/2fa/recovery",
    { recovery_code }
  );
  return data.data;
}