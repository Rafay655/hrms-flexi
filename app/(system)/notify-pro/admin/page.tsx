"use client";


import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  Send,
  AlertCircle,
  Bell,
  TrendingUp,
  RefreshCw,
  Download,
  ExternalLink,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardData {
  sent_24h: number;
  failed_24h: number;
  in_app_unread_company: number;
  delivery_rate_7d: number;
  top_failed_templates: Array<{ template_key: string; failure_count: number }>;
}

type ChannelType = "email" | "sms" | "whatsapp" | "in_app" | "push";

interface NotificationLogEntry {
  uuid: string;
  template_key: string;
  channel: ChannelType;
  status: "pending" | "sent" | "delivered" | "failed" | "bounced" | "skipped";
  recipient_address: string | null;
  error_message: string | null;
  created_at: string;
  user?: { id: number; name?: string };
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface LogResponse {
  data: NotificationLogEntry[];
  meta: PaginationMeta;
}

interface ExportJobStatus {
  status: "pending" | "processing" | "complete" | "failed";
  record_count: number | null;
  download_url: string | null;
  error_message: string | null;
  expires_at: string | null;
}

// ── Color primitives ──────────────────────────────────────────────────────────

type StatusColor = "green" | "amber" | "red" | "blue" | "brand";

const COLOR: Record<
  StatusColor,
  { value: string; dot: string; ring: string; icon: string; label: string }
> = {
  green: {
    value: "text-emerald-700",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
    icon: "text-emerald-500",
    label: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  amber: {
    value: "text-amber-700",
    dot: "bg-amber-400",
    ring: "ring-amber-200",
    icon: "text-amber-500",
    label: "bg-amber-50 text-amber-700 border-amber-200",
  },
  red: {
    value: "text-red-700",
    dot: "bg-red-500",
    ring: "ring-red-200",
    icon: "text-red-500",
    label: "bg-red-50 text-red-600 border-red-200",
  },
  blue: {
    value: "text-blue-700",
    dot: "bg-blue-400",
    ring: "ring-blue-200",
    icon: "text-blue-500",
    label: "bg-blue-50 text-blue-700 border-blue-200",
  },
  brand: {
    value: "text-[#1E1B4B]",
    dot: "bg-indigo-500",
    ring: "ring-indigo-200",
    icon: "text-indigo-500",
    label: "bg-indigo-50 text-[#1E1B4B] border-indigo-100",
  },
};

// ── Derived color helpers ─────────────────────────────────────────────────────

const failedColor = (n: number): StatusColor => (n === 0 ? "green" : "red");

const rateColor = (pct: number): StatusColor => {
  if (pct >= 95) return "green";
  if (pct >= 85) return "amber";
  return "red";
};

const CHANNEL_META: Record<
  ChannelType,
  { label: string; className: string }
> = {
  in_app: {
    label: "In-App",
    className: "bg-indigo-50 text-[#1E1B4B] border-indigo-100",
  },
  email: {
    label: "Email",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  sms: {
    label: "SMS",
    className: "bg-teal-50 text-teal-700 border-teal-200",
  },
  whatsapp: {
    label: "WhatsApp",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  push: {
    label: "Push",
    className: "bg-violet-50 text-violet-700 border-violet-200",
  },
};

// ── API helpers ───────────────────────────────────────────────────────────────

const fetchDashboard = async (): Promise<DashboardData> => {
  const { data } = await api.get("/notify-pro/delivery-log/dashboard");
  return data.data as DashboardData;
};

const fetchFailedLogs = async (
  page: number,
  templateKey: string | null,
): Promise<LogResponse> => {
  const { data } = await api.get("/notify-pro/delivery-log", {
    params: {
      status: "failed",
      page,
      per_page: 25,
      ...(templateKey ? { template_key: templateKey } : {}),
    },
  });
  return { data: data.data as NotificationLogEntry[], meta: data.meta as PaginationMeta };
};

const fetchExportStatus = async (uuid: string): Promise<ExportJobStatus> => {
  const { data } = await api.get(
    `/notify-pro/delivery-log/export/${uuid}/status`,
  );
  return data.data as ExportJobStatus;
};

// ── KpiCard ───────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subText?: string;
  color: StatusColor;
  isLoading?: boolean;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  subText,
  color,
  isLoading,
}: KpiCardProps) {
  const c = COLOR[color];

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-white p-5 ring-1 shadow-sm transition-all duration-200",
        c.ring,
      )}
    >
      {/* Live pulsing dot */}
      <span className="absolute top-4 right-4 flex h-2.5 w-2.5">
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-40",
            c.dot,
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            c.dot,
          )}
        />
      </span>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50",
            c.icon,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>

          {isLoading ? (
            <Skeleton className="mt-1.5 h-8 w-20 bg-slate-200" />
          ) : (
            <p
              className={cn(
                "mt-0.5 text-2xl font-bold tabular-nums",
                c.value,
              )}
            >
              {value}
            </p>
          )}

          {subText && (
            <p className="mt-1 text-xs text-slate-400">
              {isLoading ? <Skeleton className="h-3 w-24 bg-slate-100" /> : subText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ChannelBadge ──────────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: ChannelType }) {
  const meta = CHANNEL_META[channel] ?? CHANNEL_META.email;
  return (
    <Badge
      className={cn("border text-xs font-medium", meta.className)}
    >
      {meta.label}
    </Badge>
  );
}

// ── TemplateKeyChip ───────────────────────────────────────────────────────────

function TemplateKeyChip({
  value,
  onClick,
}: {
  value: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={value}
      className={cn(
        "max-w-[200px] truncate rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-700 transition-colors",
        onClick &&
          "cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 hover:text-[#1E1B4B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B]",
      )}
    >
      {value}
    </button>
  );
}

// ── AdminPage ─────────────────────────────────────────────────────────────────

export default function NotifyProAdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const permissions = useSelector((s: RootState) => s.auth.permissions);

  // ── State ──────────────────────────────────────────────────────────────────
  const [failedPage, setFailedPage] = useState(1);
  const [templateFilter, setTemplateFilter] = useState<string | null>(null);
  const [retryingUuids, setRetryingUuids] = useState<Set<string>>(new Set());
  const [exportJobUuid, setExportJobUuid] = useState<string | null>(null);

  // ── Permission gate ────────────────────────────────────────────────────────
  const hasPermission = permissions.includes("view-notification-log");
  const canRetry = permissions.includes("manage-notifications");

  useEffect(() => {
    if (!hasPermission) {
      toast.error("You don't have permission to view the notification log.");
      router.replace("/flexi-hq");
    }
  }, [hasPermission, router]);

  // ── Dashboard query (60 s auto-refresh) ───────────────────────────────────
  const {
    data: dashboard,
    isLoading: dashLoading,
    isFetching: dashFetching,
    dataUpdatedAt,
  } = useQuery<DashboardData>({
    queryKey: ["notify-pro", "dashboard"],
    queryFn: fetchDashboard,
    enabled: hasPermission,
    refetchInterval: 60_000,
    staleTime: 15_000,
  });

  // ── Failed logs query ──────────────────────────────────────────────────────
  const { data: failedLogs, isLoading: logsLoading } = useQuery<LogResponse>({
    queryKey: ["notify-pro", "delivery-log", "failed", failedPage, templateFilter],
    queryFn: () => fetchFailedLogs(failedPage, templateFilter),
    enabled: hasPermission,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  // ── Export status polling ──────────────────────────────────────────────────
  const { data: exportStatus } = useQuery<ExportJobStatus>({
    queryKey: ["notify-pro", "export-status", exportJobUuid],
    queryFn: () => fetchExportStatus(exportJobUuid!),
    enabled: !!exportJobUuid,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "complete" || s === "failed" ? false : 3_000;
    },
    staleTime: 0,
  });

  // Handle export status transitions
  useEffect(() => {
    if (!exportStatus) return;
    if (exportStatus.status === "complete") {
      toast.success(
        `Export ready — ${exportStatus.record_count?.toLocaleString() ?? "?"} rows. Click Download.`,
      );
    } else if (exportStatus.status === "failed") {
      toast.error("Export failed. Please try again.");
      setExportJobUuid(null);
    }
  }, [exportStatus?.status]);

  // ── Single retry mutation ──────────────────────────────────────────────────
  const retryMutation = useMutation({
    mutationFn: (uuid: string) =>
      api.post(`/notify-pro/delivery-log/${uuid}/retry`).then((r) => r.data),
    onMutate: (uuid) => {
      setRetryingUuids((prev) => new Set(prev).add(uuid));
    },
    onSuccess: (_, uuid) => {
      toast.success("Retry queued.");
      setRetryingUuids((prev) => {
        const s = new Set(prev);
        s.delete(uuid);
        return s;
      });
      queryClient.invalidateQueries({
        queryKey: ["notify-pro", "delivery-log", "failed"],
      });
    },
    onError: (_, uuid) => {
      showApiError(_, { fallbackMessage: "Could not queue retry. Please try again." });
      setRetryingUuids((prev) => {
        const s = new Set(prev);
        s.delete(uuid);
        return s;
      });
    },
  });

  // ── Export mutation ────────────────────────────────────────────────────────
  const exportMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/notify-pro/delivery-log/export");
      return data.data.job_uuid as string;
    },
    onSuccess: (uuid) => {
      setExportJobUuid(uuid);
      toast.info("Export queued. Polling for completion…");
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: "Failed to start export. Please try again." });
    },
  });

  // ── Derived values ─────────────────────────────────────────────────────────
  const failedCount = dashboard?.failed_24h ?? 0;
  const deliveryRate = dashboard?.delivery_rate_7d ?? 100;
  const topTemplates = dashboard?.top_failed_templates ?? [];
  const maxFailureCount = Math.max(
    1,
    ...topTemplates.map((t) => t.failure_count),
  );

  const logs = failedLogs?.data ?? [];
  const meta = failedLogs?.meta;

  const lastUpdated = dataUpdatedAt
    ? `Updated ${format(new Date(dataUpdatedAt), "h:mm:ss a")}`
    : null;

  const isExporting =
    exportMutation.isPending ||
    (!!exportJobUuid &&
      exportStatus?.status !== "complete" &&
      exportStatus?.status !== "failed");

  const exportComplete = exportStatus?.status === "complete";

  if (!hasPermission) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Page Header ── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-[#1E1B4B]">
                Notification Health
              </h1>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                Admin
              </span>
              {dashFetching && !dashLoading && (
                <Loader2
                  className="h-4 w-4 animate-spin text-slate-400"
                  aria-label="Refreshing…"
                />
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Delivery metrics and failed notification log for this company.
              {lastUpdated && (
                <span className="ml-2 text-xs text-slate-400">
                  {lastUpdated} · refreshes every 60 s
                </span>
              )}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["notify-pro", "dashboard"],
              })
            }
            className="mt-3 gap-2 text-xs sm:mt-0"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh now
          </Button>
        </div>

        {/* ── Section 1: KPI Cards ── */}
        <section aria-label="Key performance indicators">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              icon={Send}
              label="Sent (24 h)"
              value={
                dashLoading
                  ? "—"
                  : (dashboard?.sent_24h ?? 0).toLocaleString()
              }
              subText="Notifications delivered"
              color="brand"
              isLoading={dashLoading}
            />

            <KpiCard
              icon={AlertCircle}
              label="Failed (24 h)"
              value={
                dashLoading ? "—" : failedCount.toLocaleString()
              }
              subText={
                failedCount === 0
                  ? "All deliveries succeeded"
                  : `${failedCount} need attention`
              }
              color={failedColor(failedCount)}
              isLoading={dashLoading}
            />

            <KpiCard
              icon={TrendingUp}
              label="Delivery Rate (7 d)"
              value={dashLoading ? "—" : `${deliveryRate}%`}
              subText={
                deliveryRate >= 95
                  ? "Excellent delivery health"
                  : deliveryRate >= 85
                    ? "Moderate — check failures"
                    : "Critical — investigate now"
              }
              color={rateColor(deliveryRate)}
              isLoading={dashLoading}
            />

            <KpiCard
              icon={Bell}
              label="Unread In-App"
              value={
                dashLoading
                  ? "—"
                  : (
                      dashboard?.in_app_unread_company ?? 0
                    ).toLocaleString()
              }
              subText="Company-wide unread count"
              color="blue"
              isLoading={dashLoading}
            />
          </div>
        </section>

        {/* ── Sections 2 + 3 side by side on xl ── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* ── Section 2: Failed Deliveries Table (wider) ── */}
          <section
            className="xl:col-span-2"
            aria-label="Failed deliveries"
          >
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Table header */}
              <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#1E1B4B]">
                    Failed Deliveries
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {meta
                      ? `${meta.total.toLocaleString()} total failed`
                      : "Showing recent failures"}
                    {templateFilter && (
                      <span className="ml-1 text-amber-600">
                        · filtered by template
                      </span>
                    )}
                  </p>
                </div>

                {/* Active filter chip */}
                {templateFilter && (
                  <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1">
                    <Filter
                      className="h-3 w-3 text-amber-600"
                      aria-hidden="true"
                    />
                    <span className="font-mono text-xs text-amber-700 truncate max-w-[150px]">
                      {templateFilter}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateFilter(null);
                        setFailedPage(1);
                      }}
                      aria-label="Clear template filter"
                      className="rounded-full text-amber-500 hover:text-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              {/* Table */}
              {logsLoading ? (
                <FailedTableSkeleton />
              ) : logs.length === 0 ? (
                <FailedEmptyState hasFilter={!!templateFilter} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Template
                      </TableHead>
                      <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Channel
                      </TableHead>
                      <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Recipient
                      </TableHead>
                      <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Error
                      </TableHead>
                      <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Failed At
                      </TableHead>
                      {canRetry && (
                        <TableHead className="px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Actions
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const isRetrying = retryingUuids.has(log.uuid);
                      const truncatedError =
                        log.error_message && log.error_message.length > 80
                          ? log.error_message.slice(0, 80) + "…"
                          : log.error_message;

                      return (
                        <TableRow
                          key={log.uuid}
                          className={cn(
                            "group",
                            isRetrying && "opacity-60",
                          )}
                        >
                          {/* Template key */}
                          <TableCell className="px-4 py-3">
                            <TemplateKeyChip
                              value={log.template_key}
                              onClick={() => {
                                setTemplateFilter(log.template_key);
                                setFailedPage(1);
                              }}
                            />
                          </TableCell>

                          {/* Channel */}
                          <TableCell className="px-4 py-3">
                            <ChannelBadge channel={log.channel} />
                          </TableCell>

                          {/* Recipient (masked) */}
                          <TableCell className="px-4 py-3">
                            <span className="font-mono text-xs text-slate-600">
                              {log.recipient_address ?? (
                                <span className="text-slate-300">—</span>
                              )}
                            </span>
                          </TableCell>

                          {/* Error message */}
                          <TableCell className="max-w-[200px] px-4 py-3">
                            {log.error_message ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block cursor-default truncate text-xs text-red-600">
                                    {truncatedError}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs whitespace-pre-wrap text-xs">
                                  {log.error_message}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </TableCell>

                          {/* Failed at */}
                          <TableCell className="px-4 py-3 text-xs text-slate-500">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-default">
                                  {formatDistanceToNow(
                                    parseISO(log.created_at),
                                    { addSuffix: true },
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {format(
                                  parseISO(log.created_at),
                                  "MMM d, yyyy · h:mm:ss a",
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>

                          {/* Retry */}
                          {canRetry && (
                            <TableCell className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  retryMutation.mutate(log.uuid)
                                }
                                disabled={isRetrying}
                                aria-label={`Retry notification ${log.uuid}`}
                                className="h-7 gap-1.5 px-2 text-xs text-slate-500 hover:text-[#1E1B4B]"
                              >
                                {isRetrying ? (
                                  <Loader2
                                    className="h-3.5 w-3.5 animate-spin"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <RotateCcw
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  />
                                )}
                                {isRetrying ? "Retrying…" : "Retry"}
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                  <p className="text-xs text-slate-500">
                    Page {meta.current_page} of {meta.last_page} &middot;{" "}
                    {meta.total.toLocaleString()} total
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={failedPage <= 1}
                      onClick={() => setFailedPage((p) => p - 1)}
                      className="h-7 gap-1 text-xs"
                    >
                      <ChevronLeft
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={failedPage >= meta.last_page}
                      onClick={() => setFailedPage((p) => p + 1)}
                      className="h-7 gap-1 text-xs"
                    >
                      Next
                      <ChevronRight
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Section 3: Top Failing Templates (narrower) ── */}
          <section aria-label="Top failing templates">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-[#1E1B4B]">
                  Top Failing Templates
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Last 7 days · click to filter the log
                </p>
              </div>

              <div className="space-y-1 px-5 py-4">
                {dashLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-1.5 py-2">
                      <Skeleton className="h-3.5 w-3/4 bg-slate-100" />
                      <Skeleton className="h-2 w-full bg-slate-100" />
                    </div>
                  ))
                ) : topTemplates.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <CheckCircle2
                      className="h-8 w-8 text-emerald-400"
                      aria-hidden="true"
                    />
                    <p className="text-xs text-slate-500">
                      No template failures in the last 7 days.
                    </p>
                  </div>
                ) : (
                  topTemplates.map((t) => {
                    const pct = Math.round(
                      (t.failure_count / maxFailureCount) * 100,
                    );
                    const isActive = templateFilter === t.template_key;

                    return (
                      <button
                        key={t.template_key}
                        type="button"
                        onClick={() => {
                          setTemplateFilter(
                            isActive ? null : t.template_key,
                          );
                          setFailedPage(1);
                        }}
                        aria-pressed={isActive}
                        className={cn(
                          "group w-full rounded-lg px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B]",
                          isActive
                            ? "bg-amber-50 ring-1 ring-amber-300"
                            : "hover:bg-slate-50",
                        )}
                      >
                        {/* Template key + count */}
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "truncate font-mono text-[11px]",
                              isActive ? "text-amber-700" : "text-slate-700",
                            )}
                            title={t.template_key}
                          >
                            {t.template_key}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 text-xs font-semibold tabular-nums",
                              isActive ? "text-amber-600" : "text-red-600",
                            )}
                          >
                            {t.failure_count.toLocaleString()}
                          </span>
                        </div>

                        {/* Horizontal bar */}
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              isActive ? "bg-amber-400" : "bg-red-400",
                            )}
                            style={{ width: `${pct}%` }}
                            role="progressbar"
                            aria-valuenow={t.failure_count}
                            aria-valuemax={maxFailureCount}
                            aria-label={`${t.template_key}: ${t.failure_count} failures`}
                          />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ── Section 4: Quick Actions ── */}
        <section aria-label="Quick actions">
          <h2 className="mb-3 text-sm font-semibold text-[#1E1B4B]">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Retry All Failed */}
            <QuickActionCard
              icon={Zap}
              title="Retry All Failed"
              description="Re-queue every failed notification from the last 24 h."
              action={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="gap-2 text-xs cursor-not-allowed opacity-60"
                      >
                        <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                        Coming Soon
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Bulk retry endpoint not yet implemented on this server.
                  </TooltipContent>
                </Tooltip>
              }
              accentColor="amber"
            />

            {/* Export Delivery Log */}
            <QuickActionCard
              icon={Download}
              title="Export Delivery Log"
              description="Download a CSV of all notification delivery records."
              action={
                exportComplete && exportStatus?.download_url ? (
                  <Button
                    size="sm"
                    className="gap-2 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                    onClick={() =>
                      window.open(exportStatus.download_url!, "_blank")
                    }
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Download CSV
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isExporting || !canRetry}
                    onClick={() => exportMutation.mutate()}
                    className="gap-2 text-xs"
                  >
                    {isExporting ? (
                      <>
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin"
                          aria-hidden="true"
                        />
                        {exportStatus?.status === "processing"
                          ? "Processing…"
                          : "Queuing…"}
                      </>
                    ) : (
                      <>
                        <Download
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        Export Log
                      </>
                    )}
                  </Button>
                )
              }
              accentColor="blue"
              extra={
                isExporting && exportJobUuid ? (
                  <ExportProgress status={exportStatus?.status} />
                ) : undefined
              }
            />

            {/* View Full Log */}
            <QuickActionCard
              icon={FileText}
              title="View Full Log"
              description="Browse the complete paginated notification log with filters."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/notify-pro/log")}
                  className="gap-2 text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  View Log
                </Button>
              }
              accentColor="brand"
            />
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}

// ── QuickActionCard ───────────────────────────────────────────────────────────

const ACCENT_STYLE: Record<string, string> = {
  amber: "border-amber-200 bg-amber-50/40",
  blue: "border-blue-200 bg-blue-50/40",
  brand: "border-indigo-200 bg-indigo-50/40",
};

interface QuickActionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action: React.ReactNode;
  accentColor: "amber" | "blue" | "brand";
  extra?: React.ReactNode;
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  action,
  accentColor,
  extra,
}: QuickActionCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-5",
        ACCENT_STYLE[accentColor],
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white bg-white shadow-sm">
          <Icon className="h-4 w-4 text-slate-600" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {action}
        {extra}
      </div>
    </div>
  );
}

// ── ExportProgress ────────────────────────────────────────────────────────────

function ExportProgress({
  status,
}: {
  status?: ExportJobStatus["status"];
}) {
  const steps: Array<{
    key: ExportJobStatus["status"];
    label: string;
    Icon: React.ElementType;
  }> = [
    { key: "pending", label: "Queued", Icon: Clock },
    { key: "processing", label: "Processing", Icon: Loader2 },
    { key: "complete", label: "Done", Icon: CheckCircle2 },
  ];

  return (
    <div className="flex items-center gap-2">
      {steps.map(({ key, label, Icon }, i) => {
        const active = status === key;
        const done =
          (key === "pending" && (status === "processing" || status === "complete")) ||
          (key === "processing" && status === "complete");

        return (
          <React.Fragment key={key}>
            <div className="flex items-center gap-1">
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  done
                    ? "text-emerald-500"
                    : active
                      ? "text-blue-500 animate-spin"
                      : "text-slate-300",
                  active && key === "pending" && "animate-none",
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  done
                    ? "text-emerald-600"
                    : active
                      ? "text-blue-600"
                      : "text-slate-400",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 min-w-[12px]",
                  done ? "bg-emerald-300" : "bg-slate-200",
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── FailedTableSkeleton ───────────────────────────────────────────────────────

function FailedTableSkeleton() {
  return (
    <div
      aria-label="Loading failed deliveries"
      className="divide-y divide-slate-50"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 px-4 py-3.5"
        >
          <Skeleton className="h-5 w-36 rounded-md bg-slate-100" />
          <Skeleton className="h-5 w-16 rounded-full bg-slate-100" />
          <Skeleton className="h-4 w-28 rounded bg-slate-100" />
          <div className="flex-1">
            <Skeleton className="h-4 w-full rounded bg-slate-100" />
          </div>
          <Skeleton className="h-4 w-16 rounded bg-slate-100" />
          <Skeleton className="h-7 w-14 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

// ── FailedEmptyState ──────────────────────────────────────────────────────────

function FailedEmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
        <CheckCircle2
          className="h-7 w-7 text-emerald-400"
          aria-hidden="true"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">
          {hasFilter ? "No failures for this template" : "No failed deliveries"}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {hasFilter
            ? "Try clearing the filter to see all failures."
            : "All recent notifications delivered successfully."}
        </p>
      </div>
    </div>
  );
}
