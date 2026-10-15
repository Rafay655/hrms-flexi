/**
 * services/system-flex.service.ts
 * SystemFlex (Module 1.3) — centralized API client (TD2).
 *
 * Extracts the System Flex HTTP calls that were previously inline in the
 * VaultGuard / NotifyHub / AdminSuite / SystemHealth pages into one module,
 * matching the pattern used by the other modules' service files.
 *
 * All paths are relative to NEXT_PUBLIC_API_URL (which already includes /api/v1).
 * Never prefix a path with /v1 or api/ (enforced by the E4 prefix guard).
 *
 * SystemHealth + VaultGuard DTOs are fully typed here (self-contained, no page
 * coupling). AdminSuite (settings) and NotifyHub keep their domain types +
 * mapping in the page; this module owns only their transport.
 */
import { api } from "@/lib/api";

const BASE = "/system-flex";

// ── SystemHealth types ──────────────────────────────────────────────────────

export interface HealthData {
  queue_depth: number;
  failed_jobs_count: number;
  last_backup_at: string | null;
  last_backup_status: "success" | "failed" | "running" | "never" | null;
  db_response_ms: number;
  cache_status: "ok" | "miss" | "error";
}

export interface FailedJob {
  uuid: string;
  queue: string;
  display_name: string;
  failed_at: string;
  exception: string;
}

export interface ScheduledTask {
  name: string;
  expression: string;
  next_run: string | null;
}

// ── VaultGuard (backup) types ───────────────────────────────────────────────

export type BackupRunStatus = "success" | "failed" | "running" | null;

export interface BackupJob {
  uuid: string;
  name: string;
  is_active: boolean;
  backup_type: "db" | "full";
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  destination_disk: "local" | "s3" | "sftp" | "gcs";
  scheduled_at: string;
  retention_daily: number;
  retention_weekly: number;
  retention_monthly: number;
  last_run_at: string | null;
  last_status: BackupRunStatus;
  last_file_size_mb: number | null;
}

export interface BackupRun {
  uuid: string;
  status: "success" | "failed" | "running" | "pending";
  started_at: string;
  completed_at: string | null;
  file_size_mb: number | null;
  triggered_by: string;
  error_message: string | null;
}

export interface RunStatusResponse {
  uuid: string;
  status: "success" | "failed" | "running" | "pending";
  file_size_mb: number | null;
  error: string | null;
}

export interface BackupJobPayload {
  name: string;
  backup_type: "db" | "full";
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  destination_disk: "local" | "s3" | "sftp" | "gcs";
  scheduled_at: string;
  retention_daily: number;
  retention_weekly: number;
  retention_monthly: number;
  is_active: boolean;
}

// ── SystemHealth ────────────────────────────────────────────────────────────

export const getSystemHealth = async (): Promise<HealthData> => {
  const { data } = await api.get<{ data: HealthData }>(`${BASE}/health`);
  return data.data;
};

export const getFailedJobs = async (): Promise<FailedJob[]> => {
  // SF-D8: backend returns display_name/exception (raw failed_jobs payload),
  // not job_name/error. Map at the boundary so the table reads non-null strings.
  const { data } = await api.get<{
    data: Array<{
      uuid: string;
      queue: string;
      display_name: string | null;
      exception: string | null;
      failed_at: string;
    }>;
  }>(`${BASE}/queue/failed`);
  return data.data.map((j) => ({
    uuid: j.uuid,
    queue: j.queue,
    display_name: j.display_name ?? "(unknown job)",
    failed_at: j.failed_at,
    exception: j.exception ?? "",
  }));
};

export const getScheduledTasks = async (): Promise<ScheduledTask[]> => {
  const { data } = await api.get<{ data: ScheduledTask[] }>(
    `${BASE}/queue/scheduled`,
  );
  return data.data;
};

export const retryFailedJob = (uuid: string) =>
  api.post(`${BASE}/queue/failed/${uuid}/retry`);

/** Clear selected failed jobs (uuids in body) or ALL of them (no body). */
export const clearFailedJobs = (uuids?: string[]) =>
  uuids && uuids.length > 0
    ? api.delete(`${BASE}/queue/failed`, { data: { uuids } })
    : api.delete(`${BASE}/queue/failed`);

// ── VaultGuard (backup) ─────────────────────────────────────────────────────

export const getBackupJobs = async (): Promise<BackupJob[]> => {
  const { data } = await api.get<{ data: BackupJob[] }>(`${BASE}/backup/jobs`);
  return data.data;
};

export const createBackupJob = (values: BackupJobPayload) =>
  api.post(`${BASE}/backup/jobs`, values);

export const updateBackupJob = (uuid: string, values: BackupJobPayload) =>
  api.put(`${BASE}/backup/jobs/${uuid}`, values);

export const deleteBackupJob = (uuid: string) =>
  api.delete(`${BASE}/backup/jobs/${uuid}`);

export const getBackupRuns = async (uuid: string): Promise<BackupRun[]> => {
  // The backend exposes error_message (BackupRun model column); pass it through.
  const { data } = await api.get<{ data: BackupRun[] }>(
    `${BASE}/backup/jobs/${uuid}/runs`,
  );
  return data.data;
};

export const getBackupRunStatus = async (
  runUuid: string,
): Promise<RunStatusResponse> => {
  const { data } = await api.get<{ data: RunStatusResponse }>(
    `${BASE}/backup/runs/${runUuid}/status`,
  );
  return data.data;
};

export const runBackupJob = async (
  jobUuid: string,
): Promise<{ run_uuid: string }> => {
  const { data } = await api.post<{ data: { run_uuid: string } }>(
    `${BASE}/backup/jobs/${jobUuid}/run`,
  );
  return data.data;
};

// ── AdminSuite (settings) — transport only; the page owns flatten + domain types

/** Raw grouped settings map: { group: { "group.key": { value, label, ... } } }. */
export const getCompanySettingsGrouped = async (): Promise<
  Record<string, Record<string, unknown>>
> => {
  const { data } = await api.get<{
    data: Record<string, Record<string, unknown>>;
  }>(`${BASE}/settings/company`);
  return data.data;
};

export const updateCompanySetting = (key: string, value: unknown) =>
  api.put(`${BASE}/settings/company/${key}`, { value });

export const resetCompanySetting = (key: string) =>
  api.delete(`${BASE}/settings/company/${key}`);

/** Settings for a single domain group: { "group.key": { value, label, ... } }. */
export const getCompanySettingGroup = async (
  group: string,
): Promise<Record<string, unknown>> => {
  const { data } = await api.get<{ data: Record<string, unknown> }>(
    `${BASE}/settings/company/${group}`,
  );
  return data.data;
};

/** Platform-wide settings (super_admin only): { group: { "group.key": {...} } }. */
export const getSystemSettings = async (): Promise<
  Record<string, Record<string, unknown>>
> => {
  const { data } = await api.get<{
    data: Record<string, Record<string, unknown>>;
  }>(`${BASE}/settings/system`);
  return data.data;
};

/** Write a platform-wide setting override (super_admin only). */
export const updateSystemSetting = (key: string, value: unknown) =>
  api.put(`${BASE}/settings/system/${key}`, { value });

// ── NotifyHub (templates) — transport only; the page owns domain types

export interface NotifyTemplateUpdate {
  // template_key + channel are the upsert key the backend requires on every write
  // (NotifyHubController::templateRules + createOrUpdateTemplate). They are sourced
  // from the existing template, not edited by the user.
  template_key: string;
  channel: string;
  name: string;
  subject: string | null;
  body_html: string | null;
  body_text: string;
  is_active: boolean;
}

/** `queryString` is the already-encoded filter querystring (without the `?`). */
export const getNotifyTemplates = async (
  queryString = "",
): Promise<unknown[]> => {
  const suffix = queryString ? `?${queryString}` : "";
  const { data } = await api.get<{ data: unknown[] }>(
    `${BASE}/notify-hub/templates${suffix}`,
  );
  return data.data ?? [];
};

export const updateNotifyTemplate = async (
  uuid: string,
  body: NotifyTemplateUpdate,
): Promise<unknown> => {
  const { data } = await api.put(`${BASE}/notify-hub/templates/${uuid}`, body);
  return data.data;
};

export const testNotifyTemplate = (uuid: string, recipientEmail: string) =>
  api.post(`${BASE}/notify-hub/templates/${uuid}/test`, {
    recipient_email: recipientEmail,
  });

export const resetNotifyTemplate = async (uuid: string): Promise<unknown> => {
  const { data } = await api.post(`${BASE}/notify-hub/templates/${uuid}/reset`);
  return data.data;
};
// ── IntegrationHealth (SystemFlex Integrations) ──────────────────────────

export interface IntegrationHealth {
  mail: {
    status: string;
    mailer: string;
    host: string | null;
    port: string | null;
    username_configured: boolean;
    smtp_reachable: boolean;
    smtp_response_ms: number | null;
  };
  queue: {
    status: string;
    connection: string;
    pending_jobs: number;
    failed_jobs: number;
  };
  database: {
    status: string;
    connection: string;
    response_ms: number;
  };
  cache: {
    status: string;
    store: string;
  };
  storage: {
    status: string;
    default_disk: string;
  };
  ldap: {
    status: string;
    extension_loaded: boolean;
    configured_providers: number;
    active_providers: number;
    verification_level: string;
  };
  oauth: {
    status: string;
    configured_providers: number;
    active_providers: number;
    verification_level: string;
  };
  notify_pro: {
    status: string;
    templates: number;
    active_templates: number;
    pending_deliveries: number;
    failed_deliveries: number;
  };
}

export const getIntegrationHealth = async (): Promise<IntegrationHealth> => {
  const { data } = await api.get<{ data: IntegrationHealth }>(`${BASE}/integration-health`);
  return data.data;
};