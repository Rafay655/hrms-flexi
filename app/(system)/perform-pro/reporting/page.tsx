"use client";

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileDown,
  Fingerprint,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { performProService } from "@/services/performpro";
import type {
  PerformProReportDatasetRow,
  PerformProReportExport,
  PerformProReportExportStatus,
  PerformProReportScope,
} from "@/types/performpro";
import { ReportSchedulingPanel } from "./_components/report-scheduling-panel";

const scopeRanks: Record<PerformProReportScope, number> = {
  SELF: 1,
  TEAM: 2,
  COMPANY: 3,
};

const scopeCopy: Record<PerformProReportScope, string> = {
  SELF: "My performance",
  TEAM: "My team",
  COMPANY: "Company",
};

const exportStyles: Record<PerformProReportExportStatus, string> = {
  QUEUED: "bg-slate-100 text-slate-700 ring-slate-200",
  PROCESSING: "bg-sky-50 text-sky-800 ring-sky-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  FAILED: "bg-rose-50 text-rose-800 ring-rose-200",
  EXPIRED: "bg-amber-50 text-amber-800 ring-amber-200",
};

const metricCatalog: Array<{
  key: string;
  label: string;
  suffix?: string;
  icon: LucideIcon;
}> = [
  { key: "participants", label: "People in scope", icon: UsersRound },
  { key: "goals", label: "Goals", icon: Target },
  { key: "goal_progress_pct", label: "Goal progress", suffix: "%", icon: BarChart3 },
  { key: "review_completion_pct", label: "Review completion", suffix: "%", icon: CheckCircle2 },
  { key: "average_final_score", label: "Average outcome", icon: Sparkles },
  { key: "development_plans", label: "Development plans", icon: CalendarRange },
];

const sectionCatalog: Array<{ key: string; label: string; description: string }> = [
  { key: "goal_status", label: "Goal delivery", description: "Goals by current delivery state" },
  { key: "review_status", label: "Review execution", description: "Self and manager review task completion" },
  { key: "feedback_roster_status", label: "360 feedback", description: "Reviewer roster workflow coverage" },
  { key: "outcome_release_status", label: "Outcome release", description: "Visibility and release readiness" },
  { key: "rating_distribution", label: "Rating distribution", description: "Final performance rating mix" },
  { key: "development_health", label: "Development health", description: "Individual development plan health" },
  { key: "pip_health", label: "Improvement plan health", description: "Active PIP progress health" },
  { key: "compensation_item_status", label: "Compensation readiness", description: "Recommendation and approval coverage" },
  { key: "compensation_sync_status", label: "PayEdge synchronization", description: "Approved revision delivery state" },
  { key: "compensation_financials", label: "Compensation financials", description: "Sensitive aggregated pay values" },
];

function apiMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string; error?: { message?: string } }>(error)) {
    return error.response?.data?.error?.message
      ?? error.response?.data?.message
      ?? fallback;
  }
  return fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatValue(value: number, financial = false) {
  return new Intl.NumberFormat(undefined, {
    notation: financial ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(value);
}

function shortHash(value: string) {
  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}

function ExportStatus({ status }: { status: PerformProReportExportStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${exportStyles[status]}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function DistributionCard({
  label,
  description,
  rows,
  financial,
}: {
  label: string;
  description: string;
  rows: PerformProReportDatasetRow[];
  financial: boolean;
}) {
  const max = Math.max(...rows.map((row) => row.count ?? row.value ?? 0), 1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-950">{label}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No records were captured for this section.
        </p>
      ) : (
        <div className="space-y-4" role="list" aria-label={label}>
          {rows.map((row) => {
            const value = row.count ?? row.value ?? 0;
            return (
              <div key={row.label} role="listitem">
                <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                  <span className="truncate font-medium text-slate-700">
                    {row.label.replaceAll("_", " ")}
                  </span>
                  <span className="tabular-nums font-semibold text-slate-950">
                    {formatValue(value, financial)}
                  </span>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label={`${row.label}: ${value}`}
                  aria-valuemin={0}
                  aria-valuemax={max}
                  aria-valuenow={value}
                >
                  <div
                    className={`h-full rounded-full ${financial ? "bg-amber-500" : "bg-blue-600"}`}
                    style={{ width: `${Math.max((value / max) * 100, value > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function PerformanceReportingPage() {
  const queryClient = useQueryClient();
  const [cycleUuid, setCycleUuid] = useState("");
  const [scope, setScope] = useState<PerformProReportScope>("SELF");
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [selectedSnapshotUuid, setSelectedSnapshotUuid] = useState<string | null>(null);
  const [activeExportUuid, setActiveExportUuid] = useState<string | null>(null);

  const contextQuery = useQuery({
    queryKey: ["performpro", "reporting"],
    queryFn: performProService.reportingContext,
  });
  const reporting = contextQuery.data;
  const effectiveCycleUuid = cycleUuid || reporting?.cycles[0]?.uuid || "";
  const allowedScopes = (["SELF", "TEAM", "COMPANY"] as PerformProReportScope[])
    .filter((candidate) => scopeRanks[candidate] <= scopeRanks[
      reporting?.capabilities.maximum_scope ?? "SELF"
    ]);
  const effectiveScope = allowedScopes.includes(scope)
    ? scope
    : (allowedScopes.at(-1) ?? "SELF");
  const effectiveSnapshotUuid = selectedSnapshotUuid
    ?? reporting?.snapshots[0]?.uuid
    ?? null;

  const snapshotQuery = useQuery({
    queryKey: ["performpro", "reporting", "snapshot", effectiveSnapshotUuid],
    queryFn: () => performProService.reportSnapshot(effectiveSnapshotUuid!),
    enabled: Boolean(effectiveSnapshotUuid),
  });
  const snapshot = snapshotQuery.data ?? null;

  const activeExportQuery = useQuery({
    queryKey: ["performpro", "reporting", "export", activeExportUuid],
    queryFn: () => performProService.reportExport(activeExportUuid!),
    enabled: Boolean(activeExportUuid),
    refetchInterval: (query) => {
      const status = (query.state.data as PerformProReportExport | undefined)?.status;
      return status === "QUEUED" || status === "PROCESSING" ? 2500 : false;
    },
  });
  const activeExport = activeExportQuery.data ?? null;

  const createMutation = useMutation({
    mutationFn: performProService.createReportSnapshot,
    onSuccess: async (created) => {
      setSelectedSnapshotUuid(created.uuid);
      queryClient.setQueryData(
        ["performpro", "reporting", "snapshot", created.uuid],
        created,
      );
      await queryClient.invalidateQueries({ queryKey: ["performpro", "reporting"] });
      toast.success("Frozen performance report created.");
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The report snapshot could not be created.") }),
  });

  const exportMutation = useMutation({
    mutationFn: performProService.requestReportExport,
    onSuccess: async (requested) => {
      setActiveExportUuid(requested.uuid);
      queryClient.setQueryData(
        ["performpro", "reporting", "export", requested.uuid],
        requested,
      );
      await queryClient.invalidateQueries({ queryKey: ["performpro", "reporting"] });
      toast.success("Private CSV export queued.");
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The export could not be queued.") }),
  });

  const downloadMutation = useMutation({
    mutationFn: performProService.downloadReportExport,
    onSuccess: () => toast.success("The controlled report download has started."),
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The report could not be downloaded.") }),
  });

  const visibleSections = useMemo(() => {
    if (!snapshot) return [];
    return sectionCatalog
      .filter((section) => snapshot.datasets[section.key] !== undefined)
      .map((section) => ({
        ...section,
        rows: snapshot.datasets[section.key] ?? [],
      }));
  }, [snapshot]);

  const exports = useMemo(() => {
    const current = reporting?.exports ?? [];
    if (!activeExport) return current;
    return [
      activeExport,
      ...current.filter((candidate) => candidate.uuid !== activeExport.uuid),
    ];
  }, [activeExport, reporting?.exports]);

  if (contextQuery.isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => <Skeleton key={item} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (contextQuery.isError) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <h1 className="font-semibold text-rose-950">Performance reporting is unavailable</h1>
          <p className="mt-2 text-sm text-rose-800">
            {apiMessage(contextQuery.error, "The reporting context could not be loaded.")}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => contextQuery.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-200">
              <ShieldCheck className="h-4 w-4" />
              Role-scoped analytics and controlled evidence
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Performance reporting
            </h1>
            <p className="mt-2 text-sm leading-6 text-blue-100">
              Freeze a point-in-time view across goals, reviews, 360 feedback,
              outcomes, development, improvement plans, and compensation.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1.5 text-xs font-medium text-blue-100">
              Cycle
              <select
                value={effectiveCycleUuid}
                onChange={(event) => setCycleUuid(event.target.value)}
                className="h-10 min-w-52 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                {reporting?.cycles.map((cycle) => (
                  <option key={cycle.uuid} value={cycle.uuid} className="text-slate-950">
                    {cycle.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-blue-100">
              Scope
              <select
                value={effectiveScope}
                onChange={(event) => setScope(event.target.value as PerformProReportScope)}
                className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                {allowedScopes.map((candidate) => (
                  <option key={candidate} value={candidate} className="text-slate-950">
                    {scopeCopy[candidate]}
                  </option>
                ))}
              </select>
            </label>
            <Button
              className="self-end bg-amber-400 text-slate-950 hover:bg-amber-300"
              disabled={!effectiveCycleUuid || createMutation.isPending}
              onClick={() => createMutation.mutate({
                cycleUuid: effectiveCycleUuid,
                scope: effectiveScope,
                includeSensitive: includeSensitive && Boolean(reporting?.capabilities.can_include_sensitive),
              })}
            >
              {createMutation.isPending
                ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                : <FileCheck2 className="mr-2 h-4 w-4" />}
              Freeze report
            </Button>
          </div>
        </div>
        {reporting?.capabilities.can_include_sensitive && (
          <label className="mt-5 inline-flex cursor-pointer items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={includeSensitive}
              onChange={(event) => setIncludeSensitive(event.target.checked)}
              className="h-4 w-4 rounded border-white/30 text-amber-500 focus:ring-amber-400"
            />
            <LockKeyhole className="h-4 w-4 text-amber-300" />
            Include sensitive aggregated compensation fields
          </label>
        )}
      </header>

      {!snapshot && !snapshotQuery.isLoading ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <FileCheck2 className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-4 font-semibold text-slate-950">Create the first frozen report</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            Choose a cycle and authorized scope above. The source counts, timestamps,
            filters, and report contents will be sealed with immutable hashes.
          </p>
        </section>
      ) : snapshotQuery.isLoading ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : snapshot ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-950">{snapshot.cycle_name}</h2>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-200">
                    {scopeCopy[snapshot.scope]}
                  </span>
                  {snapshot.sensitive_fields_included && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                      Sensitive aggregates
                    </span>
                  )}
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  Frozen {formatDate(snapshot.captured_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={!reporting?.capabilities.can_export || exportMutation.isPending}
                  onClick={() => exportMutation.mutate(snapshot.uuid)}
                >
                  {exportMutation.isPending
                    ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    : <FileDown className="mr-2 h-4 w-4" />}
                  Export frozen CSV
                </Button>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 sm:flex-row sm:items-center">
              <Fingerprint className="h-4 w-4 shrink-0 text-blue-600" />
              <span>Snapshot evidence</span>
              <code className="break-all font-mono text-slate-800">
                {shortHash(snapshot.snapshot_hash)}
              </code>
              <span className="sm:ml-auto">
                {Object.keys(snapshot.source_versions).length} source ledgers sealed
              </span>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6" aria-label="Report headline metrics">
            {metricCatalog.map(({ key, label, suffix, icon: Icon }) => (
              <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">{label}</span>
                  <Icon className="h-4 w-4 text-blue-600" />
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">
                  {formatValue(snapshot.metrics[key] ?? 0)}{suffix}
                </p>
              </div>
            ))}
          </section>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {visibleSections.map((section) => (
              <DistributionCard
                key={section.key}
                label={section.label}
                description={section.description}
                rows={section.rows}
                financial={section.key === "compensation_financials"}
              />
            ))}
          </div>
        </>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-950">Frozen report history</h2>
            <p className="mt-1 text-sm text-slate-500">Immutable point-in-time views you created</p>
          </div>
          <div className="divide-y divide-slate-100">
            {reporting?.snapshots.length ? reporting.snapshots.map((item) => (
              <button
                key={item.uuid}
                type="button"
                onClick={() => setSelectedSnapshotUuid(item.uuid)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
              >
                <FileCheck2 className="h-5 w-5 shrink-0 text-blue-600" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">{item.cycle_name}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {scopeCopy[item.scope]} · {formatDate(item.captured_at)}
                  </span>
                </span>
                <code className="hidden text-xs text-slate-500 sm:block">{shortHash(item.snapshot_hash)}</code>
              </button>
            )) : (
              <p className="px-5 py-10 text-center text-sm text-slate-500">No frozen reports yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-950">Controlled exports</h2>
            <p className="mt-1 text-sm text-slate-500">Private files with an immutable access timeline</p>
          </div>
          <div className="divide-y divide-slate-100">
            {exports.length ? exports.map((item) => (
              <div key={item.uuid} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <FileDown className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{item.file_name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.scope} · {item.row_count} rows · requested {formatDate(item.requested_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <ExportStatus status={item.status} />
                  {item.status === "COMPLETED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={downloadMutation.isPending}
                      onClick={() => downloadMutation.mutate(item)}
                      aria-label={`Download ${item.file_name}`}
                    >
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  )}
                </div>
              </div>
            )) : (
              <p className="px-5 py-10 text-center text-sm text-slate-500">No report exports requested.</p>
            )}
          </div>
        </div>
      </section>

      <ReportSchedulingPanel />
    </div>
  );
}
