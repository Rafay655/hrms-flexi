// services/notify-pro.service.ts
// NotifyPro Module 1.5 — inbox, preferences, delivery log, announcements API client
//
// All paths are relative to NEXT_PUBLIC_API_URL (e.g. http://localhost:8000/api/v1).
// Routes map to:
//   GET    /api/v1/notify-pro/inbox                            → index
//   GET    /api/v1/notify-pro/inbox/unread-count              → unreadCount
//   PATCH  /api/v1/notify-pro/inbox/read-all                  → markAllRead
//   PATCH  /api/v1/notify-pro/inbox/{uuid}/read               → markRead
//   DELETE /api/v1/notify-pro/inbox/{uuid}                    → destroy
//   GET    /api/v1/notify-pro/preferences                      → getPreferences
//   PUT    /api/v1/notify-pro/preferences/{templateKey}        → updatePreference
//   DELETE /api/v1/notify-pro/preferences/{templateKey}        → resetPreference
//   PATCH  /api/v1/notify-pro/preferences/quiet-hours          → updateQuietHours
//   GET    /api/v1/notify-pro/announcements                    → index (manage-announcements)
//   POST   /api/v1/notify-pro/announcements                    → store
//   PUT    /api/v1/notify-pro/announcements/{uuid}             → update
//   DELETE /api/v1/notify-pro/announcements/{uuid}             → destroy
//   POST   /api/v1/notify-pro/announcements/{uuid}/publish     → publish
//   GET    /api/v1/notify-pro/announcements/active             → active (all roles)
//   PATCH  /api/v1/notify-pro/announcements/{uuid}/read        → markRead (all roles)
//   GET    /api/v1/notify-pro/whatsapp-config                  → index (manage-notifications)
//   POST   /api/v1/notify-pro/whatsapp-config                  → store
//   PUT    /api/v1/notify-pro/whatsapp-config                  → update
//   POST   /api/v1/notify-pro/whatsapp-config/test             → testConnection

import { api } from "@/lib/api";
import { isAxiosError } from "axios";
import type {
  InboxResponse,
  UnreadCountResponse,
  ChannelKey,
  PrefsGrouped,
  QuietHoursPayload,
  DeliveryLogParams,
  DeliveryLogResponse,
  DeliveryDashboard,
  ExportJob,
  ExportJobStatus,
  Announcement,
  AnnouncementStatus,
  AnnouncementsResponse,
  AnnouncementPayload,
  WhatsAppConfig,
  WhatsAppConfigPayload,
  WhatsAppTestResult,
} from "@/types/notify-pro";

const BASE = "/notify-pro";

/**
 * Derive the announcement lifecycle status (NP-D3) — the backend `Announcement`
 * payload never returns a `status` string, so compute it from the flags it does
 * return (is_published / publish_at / expires_at).
 */
function deriveAnnouncementStatus(a: Announcement): AnnouncementStatus {
  const now = Date.now();
  if (a.expires_at && new Date(a.expires_at).getTime() < now) return "expired";
  if (a.is_published) return "published";
  if (a.publish_at && new Date(a.publish_at).getTime() > now) return "scheduled";
  return "draft";
}

export const notifyProService = {
  /**
   * Returns the count of unread in-app notifications for the authenticated user.
   * Called by NotificationBell with a 30-second polling interval.
   */
  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get<UnreadCountResponse>(
      `${BASE}/inbox/unread-count`,
    );
    return data.data.count;
  },

  /**
   * Returns a paginated list of in-app notifications.
   * Pass `category` to filter by a specific tab ("approval" | "hr" | "payroll" | "system").
   */
  getInbox: async (params?: {
    page?: number;
    per_page?: number;
    category?: string;
  }): Promise<InboxResponse> => {
    const { data } = await api.get(`${BASE}/inbox`, { params });
    // Backend envelope is { success, data: [...], meta: {...} } — meta is a SIBLING
    // of data (not nested), so reconstruct the InboxResponse the page consumes.
    return { data: data.data, meta: data.meta } as InboxResponse;
  },

  /**
   * Marks a single notification as read (sets is_read = true).
   */
  markRead: async (uuid: string): Promise<void> => {
    await api.patch(`${BASE}/inbox/${uuid}/read`);
  },

  /**
   * Marks ALL unread notifications as read for the authenticated user.
   */
  markAllRead: async (): Promise<void> => {
    await api.patch(`${BASE}/inbox/read-all`);
  },

  /**
   * Hard-deletes a notification from the inbox (user-initiated dismiss).
   */
  deleteNotification: async (uuid: string): Promise<void> => {
    await api.delete(`${BASE}/inbox/${uuid}`);
  },

  // ── Preferences ─────────────────────────────────────────────────────────────

  /**
   * Returns per-user channel preferences grouped by module.
   * Keys are module slugs (e.g. "leave", "payroll", "auth").
   */
  getPreferences: async (): Promise<PrefsGrouped> => {
    const { data } = await api.get(`${BASE}/preferences`);
    return (data.data ?? {}) as PrefsGrouped;
  },

  /**
   * Updates channel preferences for a single notification template (partial).
   * Only the explicitly passed keys are changed; omitted channels are untouched.
   */
  updatePreference: async (
    templateKey: string,
    updates: Partial<Record<ChannelKey, boolean>>,
  ): Promise<void> => {
    await api.put(
      `${BASE}/preferences/${encodeURIComponent(templateKey)}`,
      updates,
    );
  },

  /**
   * Deletes the user's custom preference row for a template, restoring
   * the company default (equivalent to a preference reset).
   */
  resetPreference: async (templateKey: string): Promise<void> => {
    await api.delete(
      `${BASE}/preferences/${encodeURIComponent(templateKey)}`,
    );
  },

  /**
   * Applies global quiet-hours (DND) across all notification preferences.
   * The backend propagates start/end/timezone to every preference row for the user.
   */
  updateQuietHours: async (payload: QuietHoursPayload): Promise<void> => {
    await api.patch(`${BASE}/preferences/quiet-hours`, payload);
  },

  // ── Delivery log ─────────────────────────────────────────────────────────────

  /**
   * Paginated delivery log — all statuses, all channels.
   * Requires `view-notification-log` permission.
   * Backend applies PII masking before returning recipient_address.
   */
  getDeliveryLog: async (params: DeliveryLogParams = {}): Promise<DeliveryLogResponse> => {
    // Strip empty-string filter values so the API doesn't receive ?status=&channel=
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== "" && v !== undefined),
    );
    const { data } = await api.get(`${BASE}/delivery-log`, { params: cleaned });
    return {
      data: data.data as DeliveryLogResponse["data"],
      meta: data.meta as DeliveryLogResponse["meta"],
    };
  },

  /**
   * Dashboard KPI aggregates — sent 24h, failed 24h, delivery rate 7d,
   * company-wide unread in-app, and top 5 failing templates.
   * Backend caches this response for 60 s.
   */
  getDashboard: async (): Promise<DeliveryDashboard> => {
    const { data } = await api.get(`${BASE}/delivery-log/dashboard`);
    return data.data as DeliveryDashboard;
  },

  /**
   * Queues a single failed notification for immediate retry.
   * Returns 202 Accepted; the job is dispatched on the notifications queue.
   * Requires `manage-notifications` permission.
   */
  retryDelivery: async (uuid: string): Promise<void> => {
    await api.post(`${BASE}/delivery-log/${uuid}/retry`);
  },

  /**
   * Kicks off an async CSV export of the delivery log.
   * Returns the job UUID that should be polled via getExportStatus().
   * Requires `view-notification-log` permission.
   */
  exportDeliveryLog: async (filters: Partial<DeliveryLogParams> = {}): Promise<string> => {
    const cleaned = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "" && v !== undefined),
    );
    const { data } = await api.post(`${BASE}/delivery-log/export`, cleaned);
    return (data.data as ExportJob).job_uuid;
  },

  /**
   * Polls a single export job by UUID.
   * Caller should stop polling when status === "complete" | "failed".
   */
  getExportStatus: async (jobUuid: string): Promise<ExportJobStatus> => {
    const { data } = await api.get(
      `${BASE}/delivery-log/export/${jobUuid}/status`,
    );
    return data.data as ExportJobStatus;
  },

  // ── Announcements ─────────────────────────────────────────────────────────

  /**
   * Paginated admin announcement list (25/page).
   * Requires `manage-announcements` permission.
   */
  getAnnouncements: async (page = 1): Promise<AnnouncementsResponse> => {
    const { data } = await api.get(`${BASE}/announcements`, {
      params: { page, per_page: 25 },
    });
    // Envelope: { success, data: [...], meta: {...} } — meta is a sibling of data.
    // Backend never returns `status` (NP-D3) — derive it so the admin table renders
    // the correct lifecycle state instead of defaulting every row to "Draft".
    const rows: Announcement[] = (data.data ?? []).map((a: Announcement) => ({
      ...a,
      status: a.status ?? deriveAnnouncementStatus(a),
    }));
    return { data: rows, meta: data.meta } as AnnouncementsResponse;
  },

  /**
   * Creates a new announcement (saved as draft by default).
   * Requires `manage-announcements` permission.
   */
  createAnnouncement: async (payload: AnnouncementPayload): Promise<Announcement> => {
    const { data } = await api.post(`${BASE}/announcements`, payload);
    return (data.data ?? data) as Announcement;
  },

  /**
   * Updates an existing draft or scheduled announcement.
   * Requires `manage-announcements` permission.
   */
  updateAnnouncement: async ({
    uuid,
    payload,
  }: {
    uuid: string;
    payload: Partial<AnnouncementPayload>;
  }): Promise<Announcement> => {
    const { data } = await api.put(`${BASE}/announcements/${uuid}`, payload);
    return (data.data ?? data) as Announcement;
  },

  /**
   * Publishes an announcement — dispatches a queued fan-out job (202 Accepted).
   * Published announcements cannot be edited.
   * Requires `manage-announcements` permission.
   */
  publishAnnouncement: async (uuid: string): Promise<void> => {
    await api.post(`${BASE}/announcements/${uuid}/publish`);
  },

  /**
   * Soft-deletes (retracts) an announcement.
   * Retracted announcements are preserved for audit; cannot be recovered.
   * Requires `manage-announcements` permission.
   */
  deleteAnnouncement: async (uuid: string): Promise<void> => {
    await api.delete(`${BASE}/announcements/${uuid}`);
  },

  /**
   * Active, role-filtered announcements for the authenticated user — the source
   * for an in-app banner / feed. Any authenticated user.
   */
  getActiveAnnouncements: async (): Promise<Announcement[]> => {
    const { data } = await api.get(`${BASE}/announcements/active`);
    return (data.data ?? []) as Announcement[];
  },

  /**
   * Marks an active announcement as read/dismissed for the authenticated user.
   * Any authenticated user.
   */
  markAnnouncementRead: async (uuid: string): Promise<void> => {
    await api.patch(`${BASE}/announcements/${uuid}/read`);
  },

  // ── WhatsApp configuration (admin — manage-notifications) ───────────────────
  // Singleton per company. access_token is never returned by the API
  // (WhatsappConfiguration::$hidden). Typed loosely pending a dedicated admin UI.

  getWhatsAppConfig: async (): Promise<WhatsAppConfig | null> => {
    try {
      const { data } = await api.get(`${BASE}/whatsapp-config`);
      return (data.data ?? null) as WhatsAppConfig | null;
    } catch (err) {
      // 404 = no configuration created yet — a valid empty state, not an error.
      if (isAxiosError(err) && err.response?.status === 404) return null;
      throw err;
    }
  },

  saveWhatsAppConfig: async (
    payload: WhatsAppConfigPayload,
  ): Promise<WhatsAppConfig> => {
    const { data } = await api.post(`${BASE}/whatsapp-config`, payload);
    return (data.data ?? data) as WhatsAppConfig;
  },

  updateWhatsAppConfig: async (
    payload: WhatsAppConfigPayload,
  ): Promise<WhatsAppConfig> => {
    const { data } = await api.put(`${BASE}/whatsapp-config`, payload);
    return (data.data ?? data) as WhatsAppConfig;
  },

  testWhatsAppConnection: async (): Promise<WhatsAppTestResult> => {
    const { data } = await api.post(`${BASE}/whatsapp-config/test`);
    return (data.data ?? data) as WhatsAppTestResult;
  },

  // ── Device tokens ───────────────────────────────────────────────────────────
  // POST /device-tokens and DELETE /device-tokens/{uuid} are intentionally NOT
  // exposed in the web service: push device-token registration is a mobile-client
  // (Flutter) concern, not the web client. Documented as out-of-scope (NP-06).
};
