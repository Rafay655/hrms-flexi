

import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SecurityScore = {
  total: number;          // 0–100
  locked_penalty: number;
  mfa_penalty: number;
  suspicious_penalty: number;
};

export type SecurityOverview = {
  health_score: SecurityScore;
  locked_accounts: number;
  active_sessions: number;
  mfa_adoption_rate: number; // 0–1
  mfa_adoption_percent: number; // 0–100
  suspicious_sessions: number;
  total_users: number;
  active_oauth_configs: number;
  failed_logins_24h?: number; // cumulative unresolved failed-login counter
  generated_at: string; // ISO timestamp of when this snapshot was cached
};

export type SecurityEvent = {
  id: number;
  log_name: string;
  description: string | null;
  event: string | null;
  causer_type?: string;
  causer_id?: number;
  causer?: { name: string; email: string };
  properties?: Record<string, unknown>;
  created_at: string;
};

export type SecurityEventsResponse = {
  data: SecurityEvent[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type SecurityEventsParams = {
  page?: number;
  per_page?: number;
  event?: string;
};


export async function getSecurityOverview(): Promise<SecurityOverview> {
  const { data } = await api.get<{ success: boolean; data: SecurityOverview }>(
    "/connect-central/security-dashboard/overview"
  );
  return data.data;
}


export async function getSecurityEvents(
  params: SecurityEventsParams = {}
): Promise<SecurityEventsResponse> {
  const { data } = await api.get<SecurityEventsResponse>(
    "/connect-central/security-dashboard/events",
    { params }
  );
  return data;
}
