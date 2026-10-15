"use client";


import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Download,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Send,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type { RootState } from "@/store/store";
import type {
  DeliveryLogParams,
  NotificationChannel,
  NotificationLogEntry,
  NotificationStatus,
} from "@/types/notify-pro";
import {
  notifyProKeys,
  useDeliveryDashboard,
  useDeliveryLog,
  useExportDeliveryLog,
  useExportStatus,
  useRetryDelivery,
} from "@/hooks/useNotifyPro";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";

// ── Constants ─────────────────────────────────────────────────────────────────

const PER_PAGE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PER_PAGE = 10;

const STATUS_OPTIONS: Array<{ value: NotificationStatus | "all"; label: string }> = [
  { value: "all",       label: "All Statuses" },
  { value: "pending",   label: "Pending"      },
  { value: "sent",      label: "Sent"         },
  { value: "delivered", label: "Delivered"    },
  { value: "failed",    label: "Failed"       },
  { value: "bounced",   label: "Bounced"      },
  { value: "skipped",   label: "Skipped"      },
];

const CHANNEL_OPTIONS: Array<{ value: NotificationChannel | "all"; label: string }> = [
  { value: "all",       label: "All Channels" },
  { value: "email",     label: "Email"        },
  { value: "sms",       label: "SMS"          },
  { value: "whatsapp",  label: "WhatsApp"     },
  { value: "in_app",    label: "In-App"       },
  { value: "push",      label: "Push"         },
];

// ── Status badge config ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  NotificationStatus,
  { label: string; className: string }
> = {
  pending:   { label: "Pending",   className: "bg-slate-100 text-slate-600 border-slate-200"        },
  sent:      { label: "Sent",      className: "bg-blue-50 text-blue-700 border-blue-200"            },
  delivered: { label: "Delivered", className: "bg-emerald-50 text-emerald-700 border-emerald-200"   },
  failed:    { label: "Failed",    className: "bg-red-50 text-red-600 border-red-200"               },
  bounced:   { label: "Bounced",   className: "bg-orange-50 text-orange-700 border-orange-200"      },
  skipped:   { label: "Skipped",   className: "bg-slate-50 text-slate-400 border-slate-100"         },
};

// ── Channel badge config ──────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<
  NotificationChannel,
  { label: string; className: string }
> = {
  email:    { label: "Email",    className: "bg-blue-50 text-blue-700 border-blue-200"        },
  sms:      { label: "SMS",      className: "bg-teal-50 text-teal-700 border-teal-200"        },
  whatsapp: { label: "WhatsApp", className: "bg-emerald-50 text-emerald-700 border-emerald-200"},
  in_app:   { label: "In-App",   className: "bg-indigo-50 text-[#1E1B4B] border-indigo-100"  },
  push:     { label: "Push",     className: "bg-violet-50 text-violet-700 border-violet-200"  },
};

// ── Metric card helpers ───────────────────────────────────────────────────────

type MetricColor = "brand" | "red" | "green" | "amber";

const METRIC_COLOR: Record<
  MetricColor,
  { value: string; dot: string; ring: string; icon: string }
> = {
  brand: { value: "text-[#1E1B4B]", dot: "bg-indigo-500", ring: "ring-indigo-200/60", icon: "text-indigo-500" },
  red:   { value: "text-red-700",   dot: "bg-red-500",    ring: "ring-red-200/60",    icon: "text-red-500"   },
  green: { value: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200/60", icon: "text-emerald-500" },
  amber: { value: "text-amber-700", dot: "bg-amber-400",  ring: "ring-amber-200/60",  icon: "text-amber-500" },
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface MetricCardProps {
  Icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: MetricColor;
  loading?: boolean;
}

function MetricCard({ Icon, label, value, sub, color, loading }: MetricCardProps) {
  const c = METRIC_COLOR[color];
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-xl border bg-white px-4 py-3.5 ring-1 shadow-sm",
        c.ring,
      )}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50", c.icon)}>
        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-16 bg-slate-100" />
        ) : (
          <p className={cn("mt-0.5 text-xl font-bold tabular-nums", c.value)}>{value}</p>
        )}
        {sub && !loading && (
          <p className="mt-0.5 truncate text-[10px] text-slate-400">{sub}</p>
        )}
      </div>
      {/* Live pulse dot */}
      <span className="absolute right-3 top-3 flex h-2 w-2">
        <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-40", c.dot)} />
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", c.dot)} />
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: NotificationStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <Badge
      className={cn("border text-xs font-medium", cfg.className)}
      aria-label={`Status: ${cfg.label}`}
    >
      {cfg.label}
    </Badge>
  );
}

function ChannelBadge({ channel }: { channel: NotificationChannel }) {
  const cfg = CHANNEL_CONFIG[channel] ?? CHANNEL_CONFIG.email;
  return (
    <Badge className={cn("border text-xs font-medium", cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

/** 3-step export pipeline visual (Queued → Processing → Done). */
function ExportPipeline({
  status,
}: {
  status?: "pending" | "processing" | "complete" | "failed";
}) {
  const steps = [
    { key: "pending",    label: "Queued",     Icon: Clock       },
    { key: "processing", label: "Processing", Icon: Loader2     },
    { key: "complete",   label: "Done",       Icon: CheckCircle2},
  ] as const;

  return (
    <div
      className="flex items-center gap-1.5"
      role="progressbar"
      aria-label={`Export status: ${status ?? "pending"}`}
      aria-valuenow={
        status === "complete" ? 100 : status === "processing" ? 66 : 33
      }
      aria-valuemin={0}
      aria-valuemax={100}
    >
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
                  "h-3 w-3",
                  done    ? "text-emerald-500"
                  : active && key !== "pending" ? "animate-spin text-blue-500"
                  : active ? "text-blue-500"
                  : "text-slate-300",
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  done    ? "text-emerald-600"
                  : active ? "text-blue-600"
                  : "text-slate-400",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn("h-px w-5 shrink-0", done ? "bg-emerald-300" : "bg-slate-200")}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** Single delivery row. */
function LogRow({
  entry,
  canRetry,
  isRetrying,
  onRetry,
}: {
  entry: NotificationLogEntry;
  canRetry: boolean;
  isRetrying: boolean;
  onRetry: (uuid: string) => void;
}) {
  const isFailed = entry.status === "failed";
  const truncError =
    entry.error_message && entry.error_message.length > 70
      ? entry.error_message.slice(0, 70) + "…"
      : entry.error_message;

  return (
    <TableRow className={cn("group", isRetrying && "opacity-60")}>
      {/* Template key */}
      <TableCell className="px-4 py-3">
        <span
          className="max-w-[180px] truncate block font-mono text-[11px] text-slate-700"
          title={entry.template_key}
        >
          {entry.template_key}
        </span>
        {entry.is_retry && (
          <span className="mt-0.5 text-[9px] font-medium text-amber-500">
            retry
          </span>
        )}
      </TableCell>

      {/* Channel */}
      <TableCell className="px-4 py-3">
        <ChannelBadge channel={entry.channel} />
      </TableCell>

      {/* Status */}
      <TableCell className="px-4 py-3">
        <StatusBadge status={entry.status} />
      </TableCell>

      {/* Recipient (pre-masked by API) */}
      <TableCell className="px-4 py-3">
        <span className="font-mono text-xs text-slate-600">
          {entry.recipient_address ?? (
            <span className="text-slate-300">—</span>
          )}
        </span>
      </TableCell>

      {/* Error */}
      <TableCell className="max-w-[220px] px-4 py-3">
        {entry.error_message ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block cursor-default truncate text-xs text-red-600">
                {truncError}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="max-w-[300px] whitespace-pre-wrap text-xs"
            >
              {entry.error_message}
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </TableCell>

      {/* Sent at */}
      <TableCell className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default">
              {formatDistanceToNow(parseISO(entry.created_at), { addSuffix: true })}
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            {format(parseISO(entry.created_at), "MMM d, yyyy · h:mm:ss a")}
          </TooltipContent>
        </Tooltip>
      </TableCell>

      {/* Retry action */}
      <TableCell className="px-4 py-3 text-right">
        {isFailed && canRetry ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRetry(entry.uuid)}
            disabled={isRetrying}
            aria-label={`Retry ${entry.template_key}`}
            className="h-7 gap-1 px-2 text-xs text-slate-500 hover:text-[#1E1B4B] focus-visible:ring-2 focus-visible:ring-[#1E1B4B]"
          >
            {isRetrying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isRetrying ? "Retrying…" : "Retry"}
          </Button>
        ) : (
          <span className="text-xs text-slate-200">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

/** 6-row animated skeleton table. */
function TableSkeleton() {
  return (
    <div aria-label="Loading delivery log" className="divide-y divide-slate-50">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 px-4 py-3.5"
        >
          <Skeleton className="h-4 w-40 rounded bg-slate-100" />
          <Skeleton className="h-5 w-16 rounded-full bg-slate-100" />
          <Skeleton className="h-5 w-18 rounded-full bg-slate-100" />
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

/** Empty state — no rows matching current filters. */
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
        <FileText className="h-7 w-7 text-slate-300" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">
          {hasFilters ? "No results for these filters" : "No delivery records yet"}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {hasFilters
            ? "Adjust or clear your filters to see more entries."
            : "Notifications will appear here once they are dispatched."}
        </p>
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function getPageWindow(current: number, last: number): (number | "ellipsis")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages = new Set<number>([1, last, current, current - 1, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= last)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(p);
  });
  return result;
}

const PageIconButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, label, children }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-30"
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent side="top">{label}</TooltipContent>
  </Tooltip>
);

interface LogPaginationProps {
  page: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

const LogPagination: React.FC<LogPaginationProps> = ({
  page,
  lastPage,
  total,
  perPage,
  onPageChange,
}) => {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const pageWindow = useMemo(() => getPageWindow(page, lastPage), [page, lastPage]);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}</span>–
        <span className="font-medium text-slate-700">{to}</span> of{" "}
        <span className="font-medium text-slate-700">{total.toLocaleString()}</span> records
      </p>

      {lastPage > 1 && (
        <div className="flex items-center gap-1">
          <PageIconButton onClick={() => onPageChange(1)} disabled={page <= 1} label="First page">
            <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>
          <PageIconButton onClick={() => onPageChange(page - 1)} disabled={page <= 1} label="Previous page">
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>

          <div className="mx-1 flex items-center gap-1">
            {pageWindow.map((p, i) =>
              p === "ellipsis" ? (
                <span key={`e-${i}`} className="px-1.5 text-xs text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={cn(
                    "h-8 min-w-8 rounded-lg px-2.5 text-xs font-medium transition-colors",
                    p === page ? "bg-[#1E1B4B] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <PageIconButton onClick={() => onPageChange(page + 1)} disabled={page >= lastPage} label="Next page">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>
          <PageIconButton onClick={() => onPageChange(lastPage)} disabled={page >= lastPage} label="Last page">
            <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>
        </div>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DeliveryLogPage() {
  const router     = useRouter();
  const qc         = useQueryClient();
  const permissions = useSelector((s: RootState) => s.auth.permissions);

  // ── Permission gate ──────────────────────────────────────────────────────
  const canView  = permissions.includes("view-notification-log");
  const canRetry = permissions.includes("manage-notifications");

  useEffect(() => {
    if (!canView) {
      toast.error("You don't have permission to view the delivery log.");
      router.replace("/flexi-hq");
    }
  }, [canView, router]);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [statusFilter,    setStatusFilter   ] = useState<NotificationStatus | "">("");
  const [channelFilter,   setChannelFilter  ] = useState<NotificationChannel | "">("");
  const [templateFilter,  setTemplateFilter ] = useState("");
  const [page,            setPage           ] = useState(1);
  const [perPage,         setPerPage        ] = useState(DEFAULT_PER_PAGE);

  // Reset to page 1 whenever any filter changes
  useEffect(() => setPage(1), [statusFilter, channelFilter, templateFilter, perPage]);

  const params: DeliveryLogParams = {
    page,
    per_page: perPage,
    ...(statusFilter   ? { status:       statusFilter   } : {}),
    ...(channelFilter  ? { channel:      channelFilter  } : {}),
    ...(templateFilter ? { template_key: templateFilter } : {}),
  };

  const hasFilters = !!(statusFilter || channelFilter || templateFilter);
  const activeFilterCount = [statusFilter, channelFilter, templateFilter].filter(Boolean).length;

  // ── Export state ─────────────────────────────────────────────────────────
  const [exportJobUuid, setExportJobUuid] = useState<string | null>(null);

  // ── Data hooks ───────────────────────────────────────────────────────────
  const {
    data: dashboard,
    isLoading: dashLoading,
    isFetching: dashFetching,
    dataUpdatedAt,
  } = useDeliveryDashboard();

  const {
    data: logData,
    isLoading: logLoading,
    isFetching: logFetching,
  } = useDeliveryLog(params);

  const { data: exportStatus } = useExportStatus(exportJobUuid);

  const { mutate: retryOne, isPending: retryPending, variables: retryingUuid } =
    useRetryDelivery();

  const { mutate: startExport, isPending: exportStartPending } =
    useExportDeliveryLog();

  // ── Export side-effects ──────────────────────────────────────────────────
  // Notify on terminal export status
  const prevExportStatus = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!exportStatus || exportStatus.status === prevExportStatus.current) return;
    prevExportStatus.current = exportStatus.status;
    if (exportStatus.status === "complete") {
      toast.success(
        `Export ready — ${exportStatus.record_count?.toLocaleString() ?? "?"} rows. Click Download.`,
      );
    } else if (exportStatus.status === "failed") {
      toast.error("Export failed. Please try again.");
      setExportJobUuid(null);
    }
  }, [exportStatus?.status]);

  // ── Derived values ───────────────────────────────────────────────────────
  const entries = logData?.data ?? [];
  const meta    = logData?.meta;

  const isExporting =
    exportStartPending ||
    (!!exportJobUuid &&
      exportStatus?.status !== "complete" &&
      exportStatus?.status !== "failed");

  const exportComplete = exportStatus?.status === "complete";

  const lastUpdated = dataUpdatedAt
    ? `Updated ${format(new Date(dataUpdatedAt), "h:mm:ss a")}`
    : null;

  const rateColor = (pct: number): MetricColor =>
    pct >= 95 ? "green" : pct >= 85 ? "amber" : "red";

  if (!canView) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-[#1E1B4B]">Delivery Log</h1>
              {(logFetching && !logLoading) && (
                <Loader2
                  className="h-4 w-4 animate-spin text-slate-400"
                  aria-label="Refreshing…"
                />
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Complete notification delivery history for this company.
              {lastUpdated && (
                <span className="ml-2 text-xs text-slate-400">
                  {lastUpdated} · metrics refresh every 60 s
                </span>
              )}
            </p>
          </div>

          {/* Export + refresh actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                qc.invalidateQueries({ queryKey: notifyProKeys.dashboard() })
              }
              className="gap-1.5 rounded-xl text-xs"
              aria-label="Refresh metrics"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", dashFetching && "animate-spin")}
                aria-hidden="true"
              />
              Refresh
            </Button>

            {exportComplete && exportStatus?.download_url ? (
              <Button
                size="sm"
                className="gap-1.5 rounded-xl bg-emerald-600 text-xs text-white hover:bg-emerald-700 focus-visible:ring-emerald-500"
                onClick={() => window.open(exportStatus.download_url!, "_blank")}
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download CSV
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={isExporting}
                onClick={() =>
                  startExport(params, {
                    onSuccess: (jobUuid) => setExportJobUuid(jobUuid),
                  })
                }
                className="gap-1.5 rounded-xl text-xs"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    {exportStatus?.status === "processing"
                      ? "Processing…"
                      : "Queuing…"}
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Export CSV
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Export pipeline progress */}
        {isExporting && exportJobUuid && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5">
            <FileText className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
            <span className="text-xs font-medium text-blue-700">
              Preparing export
            </span>
            <ExportPipeline status={exportStatus?.status} />
          </div>
        )}

        {/* ── Metrics strip ───────────────────────────────────────────────── */}
        <section
          aria-label="Delivery metrics"
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <MetricCard
            Icon={Send}
            label="Sent (24 h)"
            value={dashLoading ? "—" : (dashboard?.sent_24h ?? 0).toLocaleString()}
            sub="Notifications dispatched"
            color="brand"
            loading={dashLoading}
          />
          <MetricCard
            Icon={AlertCircle}
            label="Failed (24 h)"
            value={dashLoading ? "—" : (dashboard?.failed_24h ?? 0).toLocaleString()}
            sub={
              !dashLoading && dashboard
                ? dashboard.failed_24h === 0
                  ? "All deliveries succeeded"
                  : `${dashboard.failed_24h} need attention`
                : undefined
            }
            color={
              dashLoading
                ? "brand"
                : dashboard?.failed_24h === 0
                  ? "green"
                  : "red"
            }
            loading={dashLoading}
          />
          <MetricCard
            Icon={TrendingUp}
            label="Delivery Rate (7 d)"
            value={dashLoading ? "—" : `${dashboard?.delivery_rate_7d ?? 100}%`}
            sub={
              !dashLoading && dashboard
                ? dashboard.delivery_rate_7d >= 95
                  ? "Excellent delivery health"
                  : dashboard.delivery_rate_7d >= 85
                    ? "Moderate — check failures"
                    : "Critical — investigate now"
                : undefined
            }
            color={dashLoading ? "brand" : rateColor(dashboard?.delivery_rate_7d ?? 100)}
            loading={dashLoading}
          />
        </section>

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        <section
          aria-label="Delivery log filters"
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
        >
          {/* Status */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <Filter className="h-3 w-3" aria-hidden="true" />
              Status
            </label>
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => setStatusFilter(v === "all" ? "" : (v as NotificationStatus))}
            >
              <SelectTrigger className="h-8 w-[144px] rounded-lg border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Channel */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <Filter className="h-3 w-3" aria-hidden="true" />
              Channel
            </label>
            <Select
              value={channelFilter || "all"}
              onValueChange={(v) => setChannelFilter(v === "all" ? "" : (v as NotificationChannel))}
            >
              <SelectTrigger className="h-8 w-[144px] rounded-lg border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template key search */}
          <div className="flex-1 space-y-1" style={{ minWidth: "160px", maxWidth: "300px" }}>
            <label
              htmlFor="dl-template"
              className="text-[10px] font-semibold uppercase tracking-wide text-slate-500"
            >
              Template key
            </label>
            <div className="relative">
              <input
                id="dl-template"
                type="text"
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
                placeholder="e.g. auth.login_otp"
                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#1E1B4B]/20"
              />
              {templateFilter && (
                <button
                  type="button"
                  onClick={() => setTemplateFilter("")}
                  aria-label="Clear template filter"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Per page */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Per page
            </label>
            <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
              <SelectTrigger className="h-8 w-[92px] rounded-lg border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PER_PAGE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear all */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("");
                setChannelFilter("");
                setTemplateFilter("");
              }}
              className="h-8 gap-1.5 rounded-lg text-xs text-slate-500 hover:text-[#1E1B4B]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear all
            </Button>
          )}

          {/* Active filter count */}
          {hasFilters && (
            <span className="ml-auto text-[10px] font-medium text-slate-400">
              {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
            </span>
          )}
        </section>

        {/* ── Log table ───────────────────────────────────────────────────── */}
        <section aria-label="Notification delivery records">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Table header bar */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <p className="text-xs font-semibold text-[#1E1B4B]">
                {meta
                  ? `${meta.total.toLocaleString()} record${meta.total !== 1 ? "s" : ""}`
                  : "Loading…"}
                {hasFilters && (
                  <span className="ml-1.5 font-normal text-slate-400">· filtered</span>
                )}
              </p>
            </div>

            {logLoading ? (
              <TableSkeleton />
            ) : entries.length === 0 ? (
              <EmptyState hasFilters={hasFilters} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    {(
                      [
                        "Template",
                        "Channel",
                        "Status",
                        "Recipient",
                        "Error",
                        "Sent At",
                        "", // retry column
                      ] as const
                    ).map((h, i) => (
                      <TableHead
                        key={i}
                        scope="col"
                        className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {entries.map((entry) => (
                    <LogRow
                      key={entry.uuid}
                      entry={entry}
                      canRetry={canRetry}
                      isRetrying={retryPending && retryingUuid === entry.uuid}
                      onRetry={(uuid) => retryOne(uuid)}
                    />
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {!logLoading && entries.length > 0 && meta && (
              <LogPagination
                page={meta.current_page ?? page}
                lastPage={meta.last_page ?? 1}
                total={meta.total ?? entries.length}
                perPage={meta.per_page ?? perPage}
                onPageChange={setPage}
              />
            )}
          </div>
        </section>

      </div>
    </TooltipProvider>
  );
}