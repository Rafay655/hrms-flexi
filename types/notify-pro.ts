// types/notify-pro.ts
// NotifyPro Module 1.5 — TypeScript types for inbox, notification, and preference APIs

export type NotificationCategory =
  | "approval"
  | "hr"
  | "payroll"
  | "leave"
  | "system"
  | "security";

/**
 * A single in-app notification as returned by GET /api/v1/notify-pro/inbox.
 */
export interface InAppNotification {
  uuid: string;
  title: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  category: NotificationCategory;
  action_url: string | null;
  created_at: string;
}

/**
 * Paginated inbox list response.
 */
export interface InboxResponse {
  data: InAppNotification[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Unread badge count response — GET /api/v1/notify-pro/inbox/unread-count.
 */
export interface UnreadCountResponse {
  data: {
    count: number;
  };
}

// ── Preferences ────────────────────────────────────────────────────────────────

/**
 * The five toggleable delivery channels for a notification type.
 * `in_app_enabled` is always true — it cannot be disabled (CHANNEL_INVARIANT).
 */
export type ChannelKey =
  | "email_enabled"
  | "sms_enabled"
  | "whatsapp_enabled"
  | "in_app_enabled"
  | "push_enabled";

/**
 * Per-user channel preferences for one notification template, including quiet hours.
 * `quiet_hours_*` are shared across all templates for the user — any row carries them.
 */
export interface ChannelPrefs {
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_timezone: string | null;
}

/**
 * One row from GET /api/v1/notify-pro/preferences — a single notification template
 * together with the user's current channel preferences for it.
 */
export interface NotificationPreferenceItem {
  template_key: string;
  name: string;
  preferences: ChannelPrefs;
}

/**
 * Response shape of GET /api/v1/notify-pro/preferences.
 * Keys are module slugs (e.g. "leave", "payroll", "auth").
 */
export type PrefsGrouped = Record<string, NotificationPreferenceItem[]>;

/**
 * Payload for PATCH /api/v1/notify-pro/preferences/quiet-hours.
 */
export interface QuietHoursPayload {
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_timezone: string;
}

/**
 * Template keys that bypass ALL user preference opt-outs unconditionally.
 * Source: NotificationDispatcher::MANDATORY_KEYS (CLAUDE.md §3.14).
 * These MUST remain locked in the Preferences UI.
 */
export const MANDATORY_TEMPLATE_KEYS = [
  "auth.account_locked",
  "auth.all_sessions_revoked",
  "auth.welcome_setup",
  "auth.password_reset_link",
] as const;

export type MandatoryTemplateKey = (typeof MANDATORY_TEMPLATE_KEYS)[number];

// ── Delivery log ───────────────────────────────────────────────────────────────

export type NotificationStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"
  | "bounced"
  | "skipped";

export type NotificationChannel =
  | "email"
  | "sms"
  | "whatsapp"
  | "in_app"
  | "push";

/**
 * One row from GET /api/v1/notify-pro/delivery-log.
 * PII masking is applied by the backend:
 *   email → "joh***@domain.com"  |  sms/wa → "***-XXXX"  |  in_app/push → null
 * Error messages for sms/wa have E.164 phone numbers stripped.
 */
export interface NotificationLogEntry {
  uuid: string;
  template_key: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipient_address: string | null;
  error_message: string | null;
  is_retry: boolean;
  created_at: string;
  user?: { id: number; name?: string; email?: string };
}

/** Query params for GET /api/v1/notify-pro/delivery-log. */
export interface DeliveryLogParams {
  page?: number;
  per_page?: number;
  status?: NotificationStatus | "";
  channel?: NotificationChannel | "";
  template_key?: string;
  date_from?: string;
  date_to?: string;
}

export interface DeliveryLogResponse {
  data: NotificationLogEntry[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Response shape of GET /api/v1/notify-pro/delivery-log/dashboard.
 * Backend caches this for 60 s.
 */
export interface DeliveryDashboard {
  sent_24h: number;
  failed_24h: number;
  in_app_unread_company: number;
  delivery_rate_7d: number;
  top_failed_templates: Array<{ template_key: string; failure_count: number }>;
}

/** Response from POST /api/v1/notify-pro/delivery-log/export. */
export interface ExportJob {
  job_uuid: string;
}

/** Response from GET /api/v1/notify-pro/delivery-log/export/{uuid}/status. */
export interface ExportJobStatus {
  status: "pending" | "processing" | "complete" | "failed";
  record_count: number | null;
  download_url: string | null;
  error_message: string | null;
  expires_at: string | null;
}

// ── Announcements ──────────────────────────────────────────────────────────────

export type ImportanceLevel = "normal" | "important" | "urgent";

export type AnnouncementStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "expired"
  | "retracted";

/** The three supported announcement delivery channels. in_app is always included. */
export type AnnouncementChannel = "in_app" | "email" | "whatsapp" | "push";

/**
 * A single announcement as returned by GET /api/v1/notify-pro/announcements.
 */
export interface Announcement {
  uuid: string;
  title: string;
  body: string;
  importance: ImportanceLevel;
  status: AnnouncementStatus;
  is_published: boolean;
  target_roles: string[] | null;   // null → all users
  channels: AnnouncementChannel[];
  publish_at: string | null;
  expires_at: string | null;
  reads_count: number;
  total_target_count: number;
  published_at: string | null;
  created_at: string;
  image_url?: string | null;
}

/** Paginated announcements list response. */
export interface AnnouncementsResponse {
  data: Announcement[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Write payload for POST /announcements and PUT /announcements/{uuid}.
 * target_roles = null → broadcast to all users.
 * channels must always include "in_app".
 */
export interface AnnouncementPayload {
  title: string;
  body: string;
  importance: ImportanceLevel;
  target_roles: string[] | null;
  channels: AnnouncementChannel[];
  publish_at: string | null;
  expires_at: string | null;
}

// ── WhatsApp configuration (NP-06) ──────────────────────────────────────────────

export type WhatsAppProvider = "meta" | "twilio" | "custom";

/**
 * WhatsApp config as returned by the API. access_token and webhook_verify_token are
 * write-only ($hidden on the model) and are NEVER present in a response.
 */
export interface WhatsAppConfig {
  uuid: string;
  company_id: number;
  provider: WhatsAppProvider;
  phone_number_id: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/**
 * Write payload for create (store) / update. Secrets are write-only; omit
 * access_token on update to keep the existing one. Rotating it deactivates the
 * config until a fresh successful test.
 */
export interface WhatsAppConfigPayload {
  provider?: WhatsAppProvider;
  phone_number_id?: string;
  access_token?: string;
  webhook_verify_token?: string | null;
  is_active?: boolean;
}

/** Result of POST /whatsapp-config/test. */
export interface WhatsAppTestResult {
  provider: string;
  is_active: boolean;
}
