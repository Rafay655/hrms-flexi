/**
 * hooks/useNotifyPro.ts
 * NotifyPro Module 1.5 — TanStack Query hooks.
 *
 * KEY BEHAVIOUR — 30-second badge polling:
 *   useUnreadCount() uses `refetchInterval: 30_000` so the notification bell
 *   badge (and the Inbox page header) stays current without a page refresh.
 *   Unlike the FlexiImport batch hook, the interval never stops — unread count
 *   is always relevant regardless of any "status".
 *
 * Optimistic updates:
 *   useMarkRead() and useDeleteNotification() patch the in-memory cache
 *   immediately so the UI feels instant, then reconcile with the server via
 *   onSettled invalidation. On error, the snapshot is restored.
 *
 *   useUpdatePreference() does the same for individual channel preference
 *   toggles. It intentionally does NOT show an error toast so callers can
 *   attach a retry action bound to the specific failed diff (not the full
 *   ChannelPrefs object — see NotificationRow.lastDiffRef in preferences/page).
 *
 * Do NOT add manual setInterval in page components — use these hooks.
 */

import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notifyProService } from '@/services/notify-pro.service';
import type {
  InboxResponse,
  ChannelKey,
  PrefsGrouped,
  QuietHoursPayload,
  DeliveryLogParams,
  DeliveryLogResponse,
  DeliveryDashboard,
  ExportJobStatus,
  Announcement,
  AnnouncementsResponse,
  AnnouncementPayload,
} from '@/types/notify-pro';

// ── Query key factory ──────────────────────────────────────────────────────────

export type InboxParams = {
  page?:     number;
  per_page?: number;
  category?: string;
};

export const notifyProKeys = {
  all:             ['notify-pro']                                                      as const,
  inbox:           ()                => [...notifyProKeys.all, 'inbox']                as const,
  inboxList:       (p: InboxParams)  => [...notifyProKeys.inbox(), p]                  as const,
  unreadCount:     ()                => [...notifyProKeys.all, 'unread-count']         as const,
  preferences:     ()                => [...notifyProKeys.all, 'preferences']          as const,
  deliveryLog:     ()                => [...notifyProKeys.all, 'delivery-log']         as const,
  deliveryLogList: (p: DeliveryLogParams) => [...notifyProKeys.deliveryLog(), p]       as const,
  dashboard:       ()                => [...notifyProKeys.all, 'dashboard']            as const,
  exportStatus:    (uuid: string | null) => [...notifyProKeys.all, 'export-status', uuid] as const,
  announcements:   ()                => [...notifyProKeys.all, 'announcements']        as const,
  announcementList:(page: number)    => [...notifyProKeys.announcements(), page]       as const,
};

// ── Queries ────────────────────────────────────────────────────────────────────

/**
 * Paginated inbox with optional category filter.
 * `placeholderData` keeps the previous page visible during refetches and
 * tab switches, preventing the list from flashing empty.
 * staleTime: 30 s reuses cached data so rapid tab navigation doesn't refetch.
 */
export function useInbox(params: InboxParams = {}) {
  return useQuery<InboxResponse>({
    queryKey:        notifyProKeys.inboxList(params),
    queryFn:         () => notifyProService.getInbox(params),
    placeholderData: (prev) => prev,
    staleTime:       30_000,
  });
}

/**
 * Unread notification count — polls every 30 s unconditionally.
 * staleTime: 0 ensures every interval fire triggers a real network request
 * rather than serving the cached value.
 */
export function useUnreadCount() {
  return useQuery<number>({
    queryKey:        notifyProKeys.unreadCount(),
    queryFn:         notifyProService.getUnreadCount,
    refetchInterval: 30_000,
    staleTime:       0,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

/**
 * Mark a single notification as read.
 *
 * Optimistic path:
 *   1. Cancel in-flight inbox queries.
 *   2. Snapshot all cached inbox pages (all categories, all page numbers).
 *   3. Flip `is_read = true` on the matching notification across all pages.
 *   4. On error → restore the snapshot.
 *   5. On settled → invalidate inbox + unread-count so server state wins.
 */
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => notifyProService.markRead(uuid),

    onMutate: async (uuid) => {
      await qc.cancelQueries({ queryKey: notifyProKeys.inbox() });
      const snapshot = qc.getQueriesData<InboxResponse>({
        queryKey: notifyProKeys.inbox(),
      });
      qc.setQueriesData<InboxResponse>({ queryKey: notifyProKeys.inbox() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((n) =>
            n.uuid === uuid
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n,
          ),
        };
      });
      return { snapshot };
    },

    onError: (_err, _uuid, ctx) => {
      ctx?.snapshot.forEach(([key, val]) => qc.setQueryData<InboxResponse>(key, val));
      showApiError(_err, { fallbackMessage: 'Failed to mark notification as read.' });
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: notifyProKeys.inbox() });
      qc.invalidateQueries({ queryKey: notifyProKeys.unreadCount() });
    },
  });
}

/**
 * Mark ALL unread notifications as read for the authenticated user.
 * No optimistic update — the change is broad; we just invalidate after success.
 */
export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notifyProService.markAllRead,
    onSuccess: () => {
      toast.success('All notifications marked as read.');
      qc.invalidateQueries({ queryKey: notifyProKeys.inbox() });
      qc.invalidateQueries({ queryKey: notifyProKeys.unreadCount() });
    },
    onError: (apiFailure) =>
      showApiError(apiFailure, { fallbackMessage: 'Failed to mark all as read. Please try again.' }),
  });
}

// ── Preferences ───────────────────────────────────────────────────────────────

/**
 * Per-user notification channel preferences, grouped by module.
 * 30-second stale time so rapid navigation doesn't cause waterfall refetches.
 * `placeholderData` prevents the preferences panel from flashing empty on
 * tab focus or route re-entry.
 */
export function usePreferences() {
  return useQuery<PrefsGrouped>({
    queryKey:        notifyProKeys.preferences(),
    queryFn:         notifyProService.getPreferences,
    staleTime:       30_000,
    placeholderData: (prev) => prev,
  });
}

/**
 * Update a single notification template's channel preferences.
 *
 * Optimistic path (cache-level — mirrors useMarkRead):
 *   1. Cancel in-flight preference queries.
 *   2. Snapshot the current grouped data.
 *   3. Patch the matching template's preferences across ALL module groups.
 *   4. On error → restore snapshot (component reverts local state via useEffect).
 *   5. On settled → invalidate so server state wins.
 *
 * NOTE: This hook intentionally does NOT show a toast on error.
 * Callers (NotificationRow) pass their own onError via the mutate() callback
 * so they can attach a retry action specific to the failed diff.
 */
export function useUpdatePreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateKey,
      updates,
    }: {
      templateKey: string;
      updates: Partial<Record<ChannelKey, boolean>>;
    }) => notifyProService.updatePreference(templateKey, updates),

    onMutate: async ({ templateKey, updates }) => {
      await qc.cancelQueries({ queryKey: notifyProKeys.preferences() });
      const snapshot = qc.getQueryData<PrefsGrouped>(notifyProKeys.preferences());
      qc.setQueryData<PrefsGrouped>(notifyProKeys.preferences(), (old) => {
        if (!old) return old;
        return Object.fromEntries(
          Object.entries(old).map(([mod, items]) => [
            mod,
            items.map((item) =>
              item.template_key === templateKey
                ? { ...item, preferences: { ...item.preferences, ...updates } }
                : item,
            ),
          ]),
        );
      });
      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined) {
        qc.setQueryData(notifyProKeys.preferences(), ctx.snapshot);
      }
      // No toast — callers handle user feedback with a retry action.
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: notifyProKeys.preferences() });
    },
  });
}

/**
 * Reset a single template to the company default by deleting the user's
 * custom preference row.
 * No optimistic update — the full re-fetch is fast and avoids guessing
 * what the company default looks like.
 */
export function useResetPreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateKey: string) =>
      notifyProService.resetPreference(templateKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifyProKeys.preferences() });
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Failed to reset notification preference.' }),
  });
}

/**
 * Save global quiet-hours (DND) for the authenticated user.
 * The backend propagates start / end / timezone to every preference row.
 * Invalidates preferences on success so the QuietHoursCard re-syncs.
 */
export function useUpdateQuietHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuietHoursPayload) =>
      notifyProService.updateQuietHours(payload),
    onSuccess: () => {
      toast.success('Quiet hours saved.');
      qc.invalidateQueries({ queryKey: notifyProKeys.preferences() });
    },
    onError: (apiFailure) =>
      showApiError(apiFailure, { fallbackMessage: 'Failed to save quiet hours. Please try again.' }),
  });
}

// ── Delivery log ──────────────────────────────────────────────────────────────

/**
 * Paginated delivery log — all statuses, all channels.
 * `placeholderData` keeps the table visible during filter/page changes.
 * staleTime: 30 s prevents re-fetch on rapid tab navigation.
 * Permission: `view-notification-log`.
 */
export function useDeliveryLog(params: DeliveryLogParams = {}) {
  return useQuery<DeliveryLogResponse>({
    queryKey:        notifyProKeys.deliveryLogList(params),
    queryFn:         () => notifyProService.getDeliveryLog(params),
    staleTime:       30_000,
    placeholderData: (prev) => prev,
  });
}

/**
 * Dashboard KPI aggregates — sent 24h, failed 24h, delivery rate 7d,
 * company-wide unread in-app, and top 5 failing templates.
 * Auto-refreshes every 60 s to match the backend cache TTL.
 * staleTime: 15 s allows a brief grace window before re-fetching.
 */
export function useDeliveryDashboard() {
  return useQuery<DeliveryDashboard>({
    queryKey:        notifyProKeys.dashboard(),
    queryFn:         notifyProService.getDashboard,
    staleTime:       15_000,
    refetchInterval: 60_000,
  });
}

/**
 * Retry a single failed notification delivery.
 * Returns 202 — the job is dispatched asynchronously.
 * Invalidates the delivery log list on success so the row status updates.
 * Permission: `manage-notifications`.
 */
export function useRetryDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => notifyProService.retryDelivery(uuid),
    onSuccess: () => {
      toast.success('Retry queued.');
      qc.invalidateQueries({ queryKey: notifyProKeys.deliveryLog() });
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Could not queue retry. Please try again.' }),
  });
}

/**
 * Start an async CSV export of the delivery log (with optional filters).
 * Returns the export job UUID which should be polled via useExportStatus().
 * The caller is responsible for storing the returned UUID in component state.
 * Permission: `view-notification-log`.
 */
export function useExportDeliveryLog() {
  return useMutation({
    mutationFn: (filters: Partial<DeliveryLogParams> = {}) =>
      notifyProService.exportDeliveryLog(filters),
    onSuccess: () => {
      toast.info('Export queued. We\'ll notify you when it\'s ready.');
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Failed to start export. Please try again.' }),
  });
}

/**
 * Poll a delivery log export job until it reaches a terminal state.
 *
 * Polling behaviour:
 *   • Polls every 3 s while status is `pending` or `processing`.
 *   • Stops automatically when status is `complete` or `failed`.
 *   • Disabled when `jobUuid` is null (no export in flight).
 *   • staleTime: 0 — every poll fires a real network request.
 */
export function useExportStatus(jobUuid: string | null) {
  return useQuery<ExportJobStatus>({
    queryKey: notifyProKeys.exportStatus(jobUuid),
    queryFn:  () => notifyProService.getExportStatus(jobUuid!),
    enabled:  !!jobUuid,
    staleTime: 0,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'complete' || s === 'failed' ? false : 3_000;
    },
  });
}

// ── Inbox mutations ────────────────────────────────────────────────────────────

/**
 * Hard-delete (dismiss) a single notification.
 *
 * Optimistic path mirrors useMarkRead: snapshot → filter notification out of
 * every cached page → restore on error → invalidate on settle.
 * Total count is decremented in the cached meta so the pagination info
 * stays consistent until the next server sync.
 */
export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => notifyProService.deleteNotification(uuid),

    onMutate: async (uuid) => {
      await qc.cancelQueries({ queryKey: notifyProKeys.inbox() });
      const snapshot = qc.getQueriesData<InboxResponse>({
        queryKey: notifyProKeys.inbox(),
      });
      qc.setQueriesData<InboxResponse>({ queryKey: notifyProKeys.inbox() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((n) => n.uuid !== uuid),
          meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
        };
      });
      return { snapshot };
    },

    onError: (_err, _uuid, ctx) => {
      ctx?.snapshot.forEach(([key, val]) => qc.setQueryData<InboxResponse>(key, val));
      showApiError(_err, { fallbackMessage: 'Failed to dismiss notification.' });
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: notifyProKeys.inbox() });
      qc.invalidateQueries({ queryKey: notifyProKeys.unreadCount() });
    },
  });
}

// ── Announcements ─────────────────────────────────────────────────────────────

/**
 * Paginated admin announcement list (25/page).
 * placeholderData keeps the previous page visible during page navigation.
 * staleTime: 30 s prevents re-fetch on rapid tab focus.
 * Permission: manage-announcements.
 */
export function useAnnouncements(page = 1) {
  return useQuery<AnnouncementsResponse>({
    queryKey:        notifyProKeys.announcementList(page),
    queryFn:         () => notifyProService.getAnnouncements(page),
    staleTime:       30_000,
    placeholderData: (prev) => prev,
  });
}

/**
 * Create a new announcement (saved as draft).
 * Shows a success toast; shows an error toast with the server message on failure.
 */
export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AnnouncementPayload) =>
      notifyProService.createAnnouncement(payload),
    onSuccess: () => {
      toast.success('Announcement saved as draft.');
      qc.invalidateQueries({ queryKey: notifyProKeys.announcements() });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Something went wrong. Please try again.';
      showApiError(err, { fallbackMessage: msg });
    },
  });
}

/**
 * Update an existing draft or scheduled announcement.
 * Shows a success toast; surfaces the server error message on failure.
 */
export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: Partial<AnnouncementPayload> }) =>
      notifyProService.updateAnnouncement({ uuid, payload }),
    onSuccess: () => {
      toast.success('Announcement updated.');
      qc.invalidateQueries({ queryKey: notifyProKeys.announcements() });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Something went wrong. Please try again.';
      showApiError(err, { fallbackMessage: msg });
    },
  });
}

/**
 * Publish an announcement — queued fan-out, returns 202 Accepted.
 * The caller drives user feedback via toast.promise(mutateAsync(uuid), { ... }).
 * onSettled invalidates the list so the status badge updates after the promise settles.
 *
 * NOTE: No onSuccess/onError toasts here — callers own that feedback layer
 * so they can include the announcement title in the message.
 */
export function usePublishAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => notifyProService.publishAnnouncement(uuid),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notifyProKeys.announcements() });
    },
  });
}

/**
 * Soft-delete (retract) an announcement.
 * variables tracks the active uuid so callers can derive per-row loading state:
 *   isArchiving={isArchiving && archivingUuid === ann.uuid}
 */
export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => notifyProService.deleteAnnouncement(uuid),
    onSuccess: () => {
      toast.success('Announcement archived.');
      qc.invalidateQueries({ queryKey: notifyProKeys.announcements() });
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Failed to archive announcement.' }),
  });
}
