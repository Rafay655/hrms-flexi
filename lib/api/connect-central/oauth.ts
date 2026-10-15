/**
 * lib/api/connect-central/oauth.ts
 * ConnectCentral — OAuth / SSO Configuration API client.
 */

import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export type OAuthProvider =
  | "google"
  | "microsoft"
  | "okta"
  | "ldap"
  | "saml"
  | "custom";

export type OAuthConfig = {
  uuid: string;
  company_id: number;
  provider: OAuthProvider;
  display_name: string;
  client_id?: string;           // decrypted by EncryptedCast
  authorization_url: string;
  token_url: string;
  userinfo_url: string;
  redirect_uri: string;
  scopes?: string[];
  allowed_email_domains?: string[];
  ldap_host?: string;
  ldap_port?: number;
  ldap_bind_dn?: string;
  ldap_base_dn?: string;
  ldap_use_tls?: boolean;
  saml_idp_metadata_url?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  // client_secret intentionally omitted — server keeps it $hidden
};

/** Writable payload — mirrors StoreOAuthConfigRequest. Only provider +
 *  display_name are required; the server sets company_id. URLs are nullable
 *  (the backend rejects "" via the `url` rule — omit empties). Secrets are
 *  write-only and never returned. */
export type CreateOAuthConfigPayload = {
  provider: OAuthProvider;
  display_name: string;
  client_id?: string | null;
  client_secret?: string | null;
  authorization_url?: string | null;
  token_url?: string | null;
  userinfo_url?: string | null;
  redirect_uri?: string | null;
  scopes?: string[];
  allowed_email_domains?: string[];
  ldap_host?: string | null;
  ldap_port?: number | null;
  ldap_bind_dn?: string | null;
  ldap_bind_password?: string | null;
  ldap_base_dn?: string | null;
  ldap_use_tls?: boolean;
  saml_idp_metadata_url?: string | null;
  saml_idp_cert?: string | null;
  is_active?: boolean;
  is_default?: boolean;
};

export type UpdateOAuthConfigPayload = Partial<CreateOAuthConfigPayload>;

export type ConnectionTestResult = {
  success: boolean;
  message: string;
};

// ── API functions ─────────────────────────────────────────────────────────────

/** GET /api/v1/connect-central/oauth */
export async function getOAuthConfigs(): Promise<OAuthConfig[]> {
  const { data } = await api.get<{ success: boolean; data: OAuthConfig[] }>(
    "/connect-central/oauth"
  );
  return data.data;
}

/** POST /api/v1/connect-central/oauth */
export async function createOAuthConfig(
  payload: CreateOAuthConfigPayload
): Promise<OAuthConfig> {
  const { data } = await api.post<{ success: boolean; data: OAuthConfig }>(
    "/connect-central/oauth",
    payload
  );
  return data.data;
}

/** PUT /api/v1/connect-central/oauth/{uuid} */
export async function updateOAuthConfig(
  uuid: string,
  payload: UpdateOAuthConfigPayload
): Promise<OAuthConfig> {
  const { data } = await api.put<{ success: boolean; data: OAuthConfig }>(
    `/connect-central/oauth/${uuid}`,
    payload
  );
  return data.data;
}

/** DELETE /api/v1/connect-central/oauth/{uuid} */
export async function deleteOAuthConfig(uuid: string): Promise<void> {
  await api.delete(`/connect-central/oauth/${uuid}`);
}

/** POST /api/v1/connect-central/oauth/{uuid}/test */
export async function testOAuthConnection(
  uuid: string
): Promise<ConnectionTestResult> {
  const { data } = await api.post<{
    success: boolean;
    data: ConnectionTestResult;
  }>(`/connect-central/oauth/${uuid}/test`);
  return data.data;
}

/** POST /api/v1/connect-central/oauth/{uuid}/activate
 * Requires a successful testConnection() first (Redis-cached 300s). */
export async function activateOAuthConfig(uuid: string): Promise<OAuthConfig> {
  const { data } = await api.post<{ success: boolean; data: OAuthConfig }>(
    `/connect-central/oauth/${uuid}/activate`
  );
  return data.data;
}

/** POST /api/v1/connect-central/oauth/{uuid}/sync — LDAP only */
export async function syncLdap(uuid: string): Promise<{ queued: boolean }> {
  const { data } = await api.post<{ success: boolean; data: { queued: boolean } }>(
    `/connect-central/oauth/${uuid}/sync`
  );
  return data.data;
}

export type LdapSyncStatus = {
  /** idle = never run or finished; running = job in progress; completed = last run succeeded; failed = last run errored */
  status: "idle" | "running" | "completed" | "failed";
  started_at:    string | null;
  completed_at:  string | null;
  synced_users:  number;
  failed_users:  number;
  error_message: string | null;
};

/** GET /api/v1/connect-central/oauth/{uuid}/sync-status — LDAP only */
export async function syncStatusLdap(uuid: string): Promise<LdapSyncStatus> {
  // CC-D3: the backend returns { status, last_run_at, users_synced, error } —
  // map to the LdapSyncStatus shape the card reads (completed_at / synced_users /
  // error_message). CC-D7: the backend has no distinct success state (it returns
  // 'idle' when finished), so derive 'completed' when a run produced a timestamp
  // with no error — that makes the card's success branch reachable.
  const { data } = await api.get<{
    success: boolean;
    data: {
      status: "idle" | "running" | "failed";
      last_run_at: string | null;
      users_synced: number;
      error: string | null;
    };
  }>(`/connect-central/oauth/${uuid}/sync-status`);

  const d = data.data;
  return {
    status:
      d.status === "idle" && d.last_run_at && !d.error ? "completed" : d.status,
    started_at: null,
    completed_at: d.last_run_at,
    synced_users: d.users_synced ?? 0,
    failed_users: 0,
    error_message: d.error,
  };
}
