"use client";

/**
 * app/(system)/system-flex/health/page.tsx
 * SystemFlex — System Health Dashboard
 *
 * Three sections:
 *   1. KPI Cards  — queue depth, failed jobs, last backup, DB response
 *   2. Failed Jobs — selectable table with per-row retry + bulk actions
 *   3. Scheduled Tasks — read-only cron overview
 *
 * Auto-refresh: every 30 s (matches backend Redis cache TTL).
 * Countdown resets on each successful fetch via `dataUpdatedAt` from useQuery.
 *
 * API endpoints consumed:
 *   GET    /system-flex/health
 *   GET    /system-flex/queue/failed
 *   POST   /system-flex/queue/failed/:uuid/retry
 *   DELETE /system-flex/queue/failed          (super_admin / manage-queue)
 *   GET    /system-flex/queue/scheduled
 */

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";

import {
  getSystemHealth,
  getFailedJobs,
  getScheduledTasks,
  retryFailedJob,
  clearFailedJobs,
} from "@/services/system-flex.service";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { RootState } from "@/store/store";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HealthData {
  queue_depth: number;
  failed_jobs_count: number;
  last_backup_at: string | null;
  last_backup_status: "success" | "failed" | "running" | "never" | null;
  db_response_ms: number;
  cache_status: "ok" | "miss" | "error";
}

interface FailedJob {
  uuid: string;
  queue: string;
  display_name: string;
  failed_at: string;
  exception: string;
}

interface ScheduledTask {
  name: string;
  expression: string;
  next_run: string | null;
}

// ── Color helpers ─────────────────────────────────────────────────────────────

type HealthColor = "green" | "amber" | "red";

function queueDepthColor(depth: number): HealthColor {
  if (depth < 50) return "green";
  if (depth <= 200) return "amber";
  return "red";
}

function failedJobsColor(count: number): HealthColor {
  return count === 0 ? "green" : "red";
}

function backupColor(lastBackupAt: string | null): HealthColor {
  if (!lastBackupAt) return "red";
  const ageHours = (Date.now() - new Date(lastBackupAt).getTime()) / 3_600_000;
  if (ageHours < 24) return "green";
  if (ageHours <= 48) return "amber";
  return "red";
}

function dbColor(ms: number): HealthColor {
  if (ms < 100) return "green";
  if (ms <= 500) return "amber";
  return "red";
}

function formatAge(isoString: string | null): string {
  if (!isoString) return "Never";
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

// ── Color class maps ──────────────────────────────────────────────────────────

const COLOR: Record<
  HealthColor,
  { value: string; dot: string; ring: string; icon: string; badge: string }
> = {
  green: {
    value: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200 dark:ring-emerald-800/40",
    icon: "text-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50",
  },
  amber: {
    value: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-400",
    ring: "ring-amber-200 dark:ring-amber-800/40",
    icon: "text-amber-500",
    badge:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
  },
  red: {
    value: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
    ring: "ring-red-200 dark:ring-red-800/40",
    icon: "text-red-500",
    badge:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50",
  },
};

// ── KpiCard ───────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subText?: React.ReactNode;
  color: HealthColor;
  onClick?: () => void;
  isLoading?: boolean;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  subText,
  color,
  onClick,
  isLoading,
}: KpiCardProps) {
  const c = COLOR[color];

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => (e.key === "Enter" || e.key === " ") && onClick()
          : undefined
      }
      aria-label={onClick ? `${label}: ${value} — scroll to details` : undefined}
      className={cn(
        "relative rounded-xl border bg-background p-5 ring-1 transition-all duration-200",
        c.ring,
        onClick &&
          "cursor-pointer hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      {/* Pulsing status dot */}
      <span className="absolute top-4 right-4 flex h-2.5 w-2.5">
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-50",
            c.dot
          )}
        />
        <span
          className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", c.dot)}
        />
      </span>

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted",
            c.icon
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>

          {isLoading ? (
            <Skeleton className="mt-1.5 h-7 w-24" />
          ) : (
            <p className={cn("mt-0.5 text-2xl font-bold tabular-nums", c.value)}>
              {value}
            </p>
          )}

          {subText && (
            <div className="mt-1.5">
              {isLoading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <span className="text-xs text-muted-foreground">{subText}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Click hint when card is interactive */}
      {onClick && !isLoading && (
        <p className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground/70">
          <ChevronDown className="h-3 w-3" />
          Click to view details below
        </p>
      )}
    </div>
  );
}

// ── HealthPage ────────────────────────────────────────────────────────────────

export default function HealthPage() {
  const queryClient = useQueryClient();
  const permissions = useSelector((s: RootState) => s.auth.permissions);
  const roles = useSelector((s: RootState) => s.auth.roles);
  // SF-D11: the failed-jobs list + retry require manage-queue.
  const canManageQueue = permissions.includes("manage-queue");
  // SF-D10: Clear-All is super_admin-only on the backend (manage-queue AND the
  // super_admin role). Gating on manage-queue alone showed it_admin a button that
  // always 403'd.
  const canClearAll = canManageQueue && roles.includes("super_admin");

  // ── Refs for scroll-to behaviour ────────────────────────────────────────────
  const failedSectionRef = useRef<HTMLDivElement>(null);

  // ── Selection state ──────────────────────────────────────────────────────────
  const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set());
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  // ── Data queries ─────────────────────────────────────────────────────────────
  const {
    data: health,
    isLoading: healthLoading,
    isFetching: healthFetching,
    dataUpdatedAt: healthUpdatedAt,
  } = useQuery<HealthData>({
    queryKey: ["system-flex", "health"],
    queryFn: getSystemHealth,
    refetchInterval: 30_000,
  });

  const {
    data: failedJobs,
    isLoading: failedLoading,
    isFetching: failedFetching,
  } = useQuery<FailedJob[]>({
    queryKey: ["system-flex", "queue", "failed"],
    queryFn: getFailedJobs,
    // SF-D11: only fetch when the user can see failed jobs (manage-queue); otherwise
    // the request 403s and the table renders a misleading empty "No failed jobs".
    enabled: canManageQueue,
    refetchInterval: 30_000,
  });

  const { data: scheduledTasks, isLoading: scheduledLoading } = useQuery<
    ScheduledTask[]
  >({
    queryKey: ["system-flex", "queue", "scheduled"],
    queryFn: getScheduledTasks,
    staleTime: 60_000,
  });

  // ── Auto-refresh countdown (resets on each successful health fetch) ──────────
  const [countdownSecs, setCountdownSecs] = useState(30);

  useEffect(() => {
    if (!healthUpdatedAt) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - healthUpdatedAt) / 1000);
      setCountdownSecs(Math.max(0, 30 - elapsed));
    }, 1_000);
    return () => clearInterval(interval);
  }, [healthUpdatedAt]);

  const isRefreshing =
    (healthFetching || failedFetching) && !(healthLoading || failedLoading);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const invalidateHealth = () => {
    queryClient.invalidateQueries({ queryKey: ["system-flex", "health"] });
    queryClient.invalidateQueries({
      queryKey: ["system-flex", "queue", "failed"],
    });
  };

  // Retry single job
  const retryOneMutation = useMutation({
    mutationFn: (uuid: string) => retryFailedJob(uuid),
    onSuccess: () => {
      invalidateHealth();
      toast.success("Job queued for retry");
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Retry failed — check logs for details" }),
  });

  // Retry selected jobs (parallel)
  const retrySelectedMutation = useMutation({
    mutationFn: () =>
      Promise.all(
        Array.from(selectedUuids).map((uuid) => retryFailedJob(uuid))
      ),
    onSuccess: () => {
      setSelectedUuids(new Set());
      invalidateHealth();
      toast.success(
        `${selectedUuids.size} job${selectedUuids.size > 1 ? "s" : ""} queued for retry`
      );
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Some retries failed — check the failed jobs list" }),
  });

  // Clear selected jobs (sends UUIDs in request body)
  const clearSelectedMutation = useMutation({
    mutationFn: () => clearFailedJobs(Array.from(selectedUuids)),
    onSuccess: () => {
      setSelectedUuids(new Set());
      invalidateHealth();
      toast.success("Selected jobs removed from the failed queue");
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to clear selected jobs" }),
  });

  // Clear ALL failed jobs (super_admin / manage-queue permission)
  const clearAllMutation = useMutation({
    mutationFn: () => clearFailedJobs(),
    onSuccess: () => {
      setSelectedUuids(new Set());
      setShowClearAllDialog(false);
      invalidateHealth();
      toast.success("All failed jobs cleared");
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to clear all jobs" }),
  });

  // ── Derived selection state ──────────────────────────────────────────────────
  const jobs = failedJobs ?? [];
  const allSelected = jobs.length > 0 && selectedUuids.size === jobs.length;
  const someSelected = selectedUuids.size > 0 && selectedUuids.size < jobs.length;
  const anySelected = selectedUuids.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedUuids(new Set());
    } else {
      setSelectedUuids(new Set(jobs.map((j) => j.uuid)));
    }
  };

  const toggleOne = (uuid: string) => {
    setSelectedUuids((prev) => {
      const next = new Set(prev);
      next.has(uuid) ? next.delete(uuid) : next.add(uuid);
      return next;
    });
  };

  // ── KPI values ───────────────────────────────────────────────────────────────
  const kpiColor = useMemo(
    () => ({
      queue: queueDepthColor(health?.queue_depth ?? 0),
      failed: failedJobsColor(health?.failed_jobs_count ?? 0),
      backup: backupColor(health?.last_backup_at ?? null),
      db: dbColor(health?.db_response_ms ?? 0),
    }),
    [health]
  );

  const backupSubText = health ? (
    <span className="flex items-center gap-1.5">
      Status:
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] py-0 px-1.5",
          health.last_backup_status === "success"
            ? COLOR.green.badge
            : health.last_backup_status === "failed"
              ? COLOR.red.badge
              : "bg-muted text-muted-foreground"
        )}
      >
        {health.last_backup_status ?? "Unknown"}
      </Badge>
    </span>
  ) : null;

  const dbSubText = health ? (
    <span className="flex items-center gap-1.5">
      Cache:
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] py-0 px-1.5",
          health.cache_status === "ok" ? COLOR.green.badge : COLOR.amber.badge
        )}
      >
        {health.cache_status}
      </Badge>
    </span>
  ) : null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">System Health</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time view of queue depth, failed jobs, backup status, and
            database performance.
          </p>
        </div>

        {/* Refresh indicator */}
        <div className="flex items-center gap-2 shrink-0 pt-1">
          {isRefreshing ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Refreshing…
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Refreshes in {countdownSecs}s
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => {
              queryClient.invalidateQueries({
                queryKey: ["system-flex", "health"],
              });
              queryClient.invalidateQueries({
                queryKey: ["system-flex", "queue", "failed"],
              });
            }}
            aria-label="Refresh health data now"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Section 1: KPI Cards ─────────────────────────────────────────────── */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">
          Key Performance Indicators
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            icon={Activity}
            label="Pending Jobs"
            value={health?.queue_depth?.toLocaleString() ?? "—"}
            color={kpiColor.queue}
            isLoading={healthLoading}
          />

          <KpiCard
            icon={AlertCircle}
            label="Failed Jobs"
            value={health?.failed_jobs_count?.toLocaleString() ?? "—"}
            color={kpiColor.failed}
            isLoading={healthLoading}
            onClick={() =>
              failedSectionRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          />

          <KpiCard
            icon={Database}
            label="Last Backup"
            value={formatAge(health?.last_backup_at ?? null)}
            subText={backupSubText}
            color={kpiColor.backup}
            isLoading={healthLoading}
          />

          <KpiCard
            icon={Zap}
            label="DB Response"
            value={
              health?.db_response_ms !== undefined
                ? `${health.db_response_ms} ms`
                : "—"
            }
            subText={dbSubText}
            color={kpiColor.db}
            isLoading={healthLoading}
          />
        </div>
      </section>

      {/* ── Section 2: Failed Jobs ───────────────────────────────────────────── */}
      <section
        ref={failedSectionRef}
        aria-labelledby="failed-jobs-heading"
        className="scroll-mt-4"
      >
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          {/* Table header row */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <AlertCircle
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <h2
                id="failed-jobs-heading"
                className="text-sm font-semibold text-foreground"
              >
                Failed Jobs
              </h2>
              {!failedLoading && jobs.length > 0 && (
                <Badge
                  variant="outline"
                  className={cn("text-[10px] py-0 px-1.5", COLOR.red.badge)}
                >
                  {jobs.length}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Bulk action bar — visible only when rows are selected */}
              {anySelected && (
                <div
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-1.5"
                  role="toolbar"
                  aria-label="Bulk actions for selected jobs"
                >
                  <span className="text-xs text-muted-foreground mr-1">
                    {selectedUuids.size} selected
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    disabled={
                      retrySelectedMutation.isPending ||
                      clearSelectedMutation.isPending
                    }
                    onClick={() => retrySelectedMutation.mutate()}
                  >
                    {retrySelectedMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3 w-3" />
                    )}
                    Retry Selected
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                    disabled={
                      clearSelectedMutation.isPending ||
                      retrySelectedMutation.isPending
                    }
                    onClick={() => clearSelectedMutation.mutate()}
                  >
                    {clearSelectedMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Clear Selected
                  </Button>
                </div>
              )}

              {/* Clear All — super_admin only */}
              {canClearAll && jobs.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
                  onClick={() => setShowClearAllDialog(true)}
                  disabled={clearAllMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All Failed Jobs
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          {failedLoading ? (
            <div className="px-6 divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3.5">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-7 w-14 rounded-md" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              {!canManageQueue ? (
                /* SF-D11: distinguish "no permission" from "queue is clean" so the
                   list isn't a misleading empty state for users without manage-queue. */
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30">
                    <AlertCircle
                      className="h-7 w-7 text-amber-500"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Failed jobs are restricted
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      You need the <code>manage-queue</code> permission to view and
                      retry failed jobs.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                    <ShieldCheck
                      className="h-7 w-7 text-emerald-500"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      No failed jobs
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      All systems healthy. The queue is running cleanly.
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 pl-6">
                    <Checkbox
                      checked={
                        allSelected ? true : someSelected ? "indeterminate" : false
                      }
                      onCheckedChange={toggleAll}
                      aria-label={
                        allSelected ? "Deselect all jobs" : "Select all jobs"
                      }
                    />
                  </TableHead>
                  <TableHead className="w-28">Queue</TableHead>
                  <TableHead>Job Name</TableHead>
                  <TableHead className="w-36">Failed At</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="w-20 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {jobs.map((job) => {
                  const isSelected = selectedUuids.has(job.uuid);
                  const isRetrying =
                    retryOneMutation.isPending &&
                    retryOneMutation.variables === job.uuid;

                  return (
                    <TableRow
                      key={job.uuid}
                      data-state={isSelected ? "selected" : undefined}
                      className={cn(isSelected && "bg-muted/50")}
                    >
                      <TableCell className="pl-6">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(job.uuid)}
                          aria-label={`Select job ${job.display_name}`}
                        />
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs font-mono font-medium"
                        >
                          {job.queue}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm font-medium font-mono">
                          {job.display_name}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span
                          className="text-xs text-muted-foreground"
                          title={job.failed_at}
                        >
                          {formatAge(job.failed_at)}
                        </span>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <span
                          className="block truncate text-xs text-muted-foreground font-mono"
                          title={job.exception}
                        >
                          {job.exception.length > 100
                            ? `${job.exception.slice(0, 100)}…`
                            : job.exception}
                        </span>
                      </TableCell>

                      <TableCell className="pr-6 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          disabled={isRetrying || retryOneMutation.isPending}
                          onClick={() => retryOneMutation.mutate(job.uuid)}
                          aria-label={`Retry job ${job.display_name}`}
                        >
                          {isRetrying ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          Retry
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      {/* ── Section 3: Scheduled Tasks ───────────────────────────────────────── */}
      <section aria-labelledby="scheduled-heading">
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-muted/30">
            <Clock
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <h2
              id="scheduled-heading"
              className="text-sm font-semibold text-foreground"
            >
              Scheduled Tasks
            </h2>
            <span className="text-xs text-muted-foreground ml-1">(read-only)</span>
          </div>

          {scheduledLoading ? (
            <div className="px-6 divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 py-3.5">
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : !scheduledTasks || scheduledTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 px-6 text-center">
              <Clock
                className="h-8 w-8 text-muted-foreground/40"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">
                No scheduled tasks configured.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Task</TableHead>
                  <TableHead className="w-40">Expression</TableHead>
                  <TableHead className="w-48 pr-6">Next Run</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {scheduledTasks.map((task, idx) => (
                  <TableRow
                    key={`${task.name}-${task.expression}-${idx}`}
                    className="hover:bg-muted/30"
                  >
                    <TableCell className="pl-6">
                      <span className="text-sm font-mono text-foreground">
                        {task.name}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-mono text-xs text-muted-foreground"
                      >
                        {task.expression}
                      </Badge>
                    </TableCell>

                    <TableCell className="pr-6">
                      <span className="text-xs text-muted-foreground">
                        {task.next_run
                          ? formatAge(task.next_run)
                          : "Not scheduled"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      {/* ── Clear All confirm dialog ─────────────────────────────────────────── */}
      <AlertDialog
        open={showClearAllDialog}
        onOpenChange={(open) => {
          if (!open && !clearAllMutation.isPending) setShowClearAllDialog(false);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle />
            </AlertDialogMedia>
            <AlertDialogTitle>Clear all failed jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              <span className="font-medium text-foreground">
                all {jobs.length} failed job
                {jobs.length !== 1 ? "s" : ""}
              </span>{" "}
              from the queue. You will not be able to retry them afterwards.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearAllMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={clearAllMutation.isPending}
              onClick={() => clearAllMutation.mutate()}
            >
              {clearAllMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Clear all failed jobs"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
