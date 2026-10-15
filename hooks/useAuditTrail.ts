/**
 * hooks/useAuditTrail.ts
 * Audit Trail Module 1.2 — TanStack Query hooks for the CSV export pipeline.
 *
 * KEY BEHAVIOUR — export polling at 2 s:
 *   useAuditExportStatus() polls every 2 s while status is "pending" or
 *   "processing", then stops automatically when status reaches "complete"
 *   or "failed". This replaces the manual setInterval / pollRef pattern
 *   that was in security/page.tsx and activity/page.tsx.
 *
 * How to consume in a page component:
 *
 *   const [exportJobUuid, setExportJobUuid] = useState<string | null>(null);
 *   const { mutate: startExport, isPending: isExporting } = useSecurityExport();
 *   const { data: exportStatus } = useAuditExportStatus(exportJobUuid);
 *
 *   const isExportBusy = isExporting || !!exportJobUuid;
 *
 *   // Trigger browser download when the export job completes:
 *   useEffect(() => {
 *     if (exportStatus?.status === "complete" && exportStatus.download_url) {
 *       toast.success("Export ready. Downloading…");
 *       triggerDownload(exportStatus.download_url, `security-audit-${today}.csv`);
 *       setExportJobUuid(null); // stop polling
 *     } else if (exportStatus?.status === "failed") {
 *       toast.error(exportStatus.error_message ?? "Export failed.");
 *       setExportJobUuid(null); // stop polling
 *     }
 *   }, [exportStatus]);
 *
 *   const handleExportCSV = () => {
 *     startExport(filters, { onSuccess: (uuid) => setExportJobUuid(uuid) });
 *   };
 *
 * Do NOT add manual setInterval in page components — use these hooks.
 */

import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  auditTrailService,
  type AuditExportStatus,
  type SecurityExportParams,
  type ActivityExportParams,
  type BusinessExportParams,
} from "@/services/audit-trail.service";

// ── Query key factory ─────────────────────────────────────────────────────────

export const auditTrailKeys = {
  all:          ["audit-trail"]                                                        as const,
  exportStatus: (uuid: string | null) => [...auditTrailKeys.all, "export-status", uuid] as const,
};

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Kick off an async CSV export of the security audit log (with current filters).
 *
 * Returns the job UUID via the mutation's `data` value — store it in local state
 * and pass it to useAuditExportStatus() to begin polling:
 *
 *   startExport(filters, { onSuccess: (uuid) => setExportJobUuid(uuid) });
 *
 * NOTE: The hook's own onSuccess shows an "Export queued" info toast.
 * The caller should NOT add a second success toast — attach only onSuccess for
 * the UUID side-effect, not for user messaging.
 *
 * Requires `export-audit-logs` permission.
 */
export function useSecurityExport() {
  return useMutation({
    mutationFn: (params: SecurityExportParams) =>
      auditTrailService.requestSecurityExport(params),
    onSuccess: () => {
      toast.info("Export queued. We'll notify you when it's ready.");
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to start export. Please try again." }),
  });
}

/**
 * Kick off an async CSV export of the activity audit log (with current filters).
 * Same contract as useSecurityExport() — see its JSDoc.
 * Requires `export-audit-logs` permission.
 */
export function useActivityExport() {
  return useMutation({
    mutationFn: (params: ActivityExportParams) =>
      auditTrailService.requestActivityExport(params),
    onSuccess: () => {
      toast.info("Export queued. We'll notify you when it's ready.");
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to start export. Please try again." }),
  });
}

/**
 * Kick off an async CSV export of the business audit log (with current filters).
 * Same contract as useSecurityExport() — see its JSDoc.
 * Requires `export-audit-logs` permission.
 */
export function useBusinessExport() {
  return useMutation({
    mutationFn: (params: BusinessExportParams) =>
      auditTrailService.requestBusinessExport(params),
    onSuccess: () => {
      toast.info("Export queued. We'll notify you when it's ready.");
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to start export. Please try again." }),
  });
}

// ── Status poller ─────────────────────────────────────────────────────────────

/**
 * Poll a single audit export job until it reaches a terminal state.
 *
 * Polling behaviour:
 *   • Fires every 2 s while status is "pending" or "processing".
 *   • Stops automatically when status is "complete" or "failed" (refetchInterval
 *     returns false — TanStack Query stops the interval without a cleanup call).
 *   • Disabled entirely when jobUuid is null (no export in flight).
 *   • staleTime: 0 ensures every interval tick performs a real network request
 *     rather than serving the cached value.
 *
 * The download side-effect and toasts live in the consuming component via
 * useEffect — see the module-level JSDoc for the recommended usage pattern.
 */
export function useAuditExportStatus(jobUuid: string | null) {
  return useQuery<AuditExportStatus>({
    queryKey:        auditTrailKeys.exportStatus(jobUuid),
    queryFn:         () => auditTrailService.getExportStatus(jobUuid!),
    enabled:         !!jobUuid,
    staleTime:       0,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "complete" || s === "failed" ? false : 2_000;
    },
  });
}
