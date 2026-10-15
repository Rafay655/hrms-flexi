"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Search,
  Download,
  Filter,
  ArrowRight,
  Loader2,
  Info,
  FileText,
  Eye,
  Upload,
  BarChart3,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useActivityExport,
  useAuditExportStatus,
} from "@/hooks/useAuditTrail";

/* ------------------------------------------------------------------ */
/*  API types                                                           */
/* ------------------------------------------------------------------ */

type ActivityLog = {
  id: number;
  user_id: number | null;
  user: { id: number; name: string; email: string } | null;
  module: string;
  action: string;
  record_count: number | null;
  file_name: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

/* ------------------------------------------------------------------ */
/*  Action labels — 17 activity event types                            */
/* ------------------------------------------------------------------ */

const ACTION_LABELS: Record<string, string> = {
  export_payroll:          "Exported Payroll",
  export_employees:        "Exported Employee List",
  export_leave_data:       "Exported Leave Data",
  export_attendance:       "Exported Attendance",
  download_payslip:        "Downloaded Payslip",
  download_document:       "Downloaded Document",
  download_audit_report:   "Downloaded Audit Report",
  view_salary_data:        "Viewed Salary Data",
  view_cnic_data:          "Viewed CNIC Data",
  view_bank_details:       "Viewed Bank Details",
  view_medical_data:       "Viewed Medical Data",
  bulk_import_employees:   "Bulk Imported Employees",
  bulk_import_leave:       "Bulk Imported Leave",
  bulk_update_salaries:    "Bulk Updated Salaries",
  run_payroll:             "Ran Payroll",
  generate_report:         "Generated Report",
  print_report:            "Printed Report",
};

/** Humanize any unknown action enum that isn't in the label map */
function getActionLabel(action: string): string {
  return (
    ACTION_LABELS[action] ??
    action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/* ------------------------------------------------------------------ */
/*  Action badge styling — grouped by type                             */
/* ------------------------------------------------------------------ */

function getActionBadgeClass(action: string): string {
  if (action.startsWith("export_"))
    return "bg-violet-50 text-violet-700 border-violet-100";
  if (action.startsWith("download_"))
    return "bg-blue-50 text-blue-700 border-blue-100";
  if (action.startsWith("view_"))
    return "bg-amber-50 text-amber-700 border-amber-100";
  if (action.startsWith("bulk_"))
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (action === "run_payroll")
    return "bg-pink-50 text-pink-700 border-pink-100";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

/* ------------------------------------------------------------------ */
/*  Module badge styling — colour-coded per module                     */
/* ------------------------------------------------------------------ */

const MODULE_BADGE: Record<string, string> = {
  "leave-ease":     "bg-emerald-100 text-emerald-700",
  "pay-edge":       "bg-violet-100 text-violet-700",
  "time-sync":      "bg-blue-100 text-blue-700",
  "people-hub":     "bg-brand-100 text-brand-700",
  "flexi-hq":       "bg-orange-100 text-orange-700",
  "connect-central":"bg-red-100 text-red-700",
  "flexi-meta":     "bg-gray-100 text-gray-600",
};

function getModuleBadgeClass(module: string): string {
  return MODULE_BADGE[module.toLowerCase()] ?? "bg-gray-100 text-gray-600";
}

function formatModuleLabel(module: string): string {
  const MAP: Record<string, string> = {
    "leave-ease":      "LeaveEase",
    "pay-edge":        "PayEdge",
    "time-sync":       "TimeSync",
    "people-hub":      "PeopleHub",
    "flexi-hq":        "FlexiHQ",
    "connect-central": "ConnectCentral",
    "flexi-meta":      "FlexiMeta",
  };
  return MAP[module.toLowerCase()] ?? module;
}

/* ------------------------------------------------------------------ */
/*  Filter options                                                      */
/* ------------------------------------------------------------------ */

const MODULE_OPTIONS = [
  { value: "",               label: "All Modules" },
  { value: "leave-ease",    label: "LeaveEase" },
  { value: "pay-edge",      label: "PayEdge" },
  { value: "time-sync",     label: "TimeSync" },
  { value: "people-hub",    label: "PeopleHub" },
  { value: "flexi-hq",      label: "FlexiHQ" },
  { value: "connect-central", label: "ConnectCentral" },
  { value: "flexi-meta",    label: "FlexiMeta" },
];

const ACTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All Actions" },
  ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label })),
];

/* ------------------------------------------------------------------ */
/*  Summary computation                                                 */
/* ------------------------------------------------------------------ */

type SummaryStats = {
  exports: number;
  downloads: number;
  pii_views: number;
  imports: number;
};

/**
 * Compute summary stats from the current page's rows.
 * The backend does not expose a dedicated /activity/summary endpoint;
 * counts reflect the current filtered page, not the full dataset.
 */
function computeSummary(rows: ActivityLog[]): SummaryStats {
  return {
    exports:   rows.filter((r) => r.action.startsWith("export_")).length,
    downloads: rows.filter((r) => r.action.startsWith("download_")).length,
    pii_views: rows.filter((r) => r.action.startsWith("view_")).length,
    imports:   rows.filter(
      (r) =>
        r.action.startsWith("bulk_") ||
        r.action === "run_payroll" ||
        r.action === "generate_report" ||
        r.action === "print_report"
    ).length,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1_000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getUserEmail(log: ActivityLog): string {
  if (log.user?.email) return log.user.email;
  const meta = log.metadata;
  if (typeof meta.email === "string") return meta.email;
  return "—";
}

function getUserName(log: ActivityLog): string {
  if (log.user?.name) return log.user.name;
  return "System";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ------------------------------------------------------------------ */
/*  API fetchers                                                        */
/* ------------------------------------------------------------------ */

type FetchParams = {
  page?: number;
  module?: string;
  // (action sits below; user_id replaces the old free-text `user` — AT-D7)
  action?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
};

async function fetchActivityLogs(params: FetchParams) {
  const clean: Record<string, string | number> = {};
  (Object.keys(params) as Array<keyof FetchParams>).forEach((k) => {
    const v = params[k];
    if (v !== undefined && v !== null && v !== "") clean[k] = v as string | number;
  });
  const { data } = await api.get<{
    success: boolean;
    data: ActivityLog[];
    message: string;
    meta: PaginationMeta;
  }>("/audit-trail/activity", { params: clean });
  return data;
}

// requestActivityExport and pollExportStatus moved to services/audit-trail.service.ts
// and hooks/useAuditTrail.ts — use useActivityExport() + useAuditExportStatus() instead.

/* ------------------------------------------------------------------ */
/*  Page component                                                      */
/* ------------------------------------------------------------------ */

export default function ActivityAuditLog() {
  /* ── filter state ──────────────────────────────────────────────── */
  const [moduleFilter,  setModuleFilter]  = useState("");
  const [actionFilter,  setActionFilter]  = useState("");
  const [userSearch,    setUserSearch]    = useState("");
  const [debouncedUser, setDebouncedUser] = useState("");
  const [fromDate,      setFromDate]      = useState("");
  const [toDate,        setToDate]        = useState("");
  const [page,          setPage]          = useState(1);

  /* ── export state ──────────────────────────────────────────────── */
  const [exportJobUuid, setExportJobUuid] = useState<string | null>(null);
  const { mutate: startExport, isPending: isExporting } = useActivityExport();
  const { data: exportStatus } = useAuditExportStatus(exportJobUuid);
  const isExportBusy = isExporting || !!exportJobUuid;

  /* ── debounce user search ───────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedUser(userSearch);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [userSearch]);

  /* ── reset page on filter change ───────────────────────────────── */
  useEffect(() => {
    setPage(1);
  }, [moduleFilter, actionFilter, fromDate, toDate]);

  const filters: FetchParams = {
    ...(moduleFilter  ? { module: moduleFilter }       : {}),
    ...(actionFilter  ? { action: actionFilter }       : {}),
    ...(debouncedUser ? { user_id: debouncedUser }     : {}),
    ...(fromDate      ? { date_from: fromDate }        : {}),
    ...(toDate        ? { date_to: toDate }            : {}),
    page,
  };

  /* ── Main query ─────────────────────────────────────────────────── */
  const { data: apiData, isLoading, isFetching } = useQuery({
    queryKey: ["audit-activity-logs", filters],
    queryFn: () => fetchActivityLogs(filters),
    placeholderData: (prev) => prev,
  });

  const rows: ActivityLog[] = apiData?.data ?? [];
  const meta: PaginationMeta = apiData?.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 0,
  };

  /* ── Summary — computed from current page rows ──────────────────── */
  const summary: SummaryStats = useMemo(
    () => computeSummary(rows),
    [rows]
  );

  /* ── Pagination window ──────────────────────────────────────────── */
  const pageCount = meta.last_page;
  const pageWindow = (() => {
    const half = 2;
    let start = Math.max(1, page - half);
    const end = Math.min(pageCount, start + 4);
    start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  /* ── Export — TanStack Query polling at 2 s ─────────────────────── */
  useEffect(() => {
    if (exportStatus?.status === "complete" && exportStatus.download_url) {
      toast.success("Export ready. Downloading…");
      const a = document.createElement("a");
      a.href = exportStatus.download_url;
      a.download = `activity-audit-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      setExportJobUuid(null); // stop polling
    } else if (exportStatus?.status === "failed") {
      toast.error(exportStatus.error_message ?? "Export failed. Please try again.");
      setExportJobUuid(null); // stop polling
    }
  }, [exportStatus]);

  const handleExportCSV = () => {
    if (isExportBusy) return;
    const exportParams = {
      ...(filters.module    ? { module: filters.module }       : {}),
      ...(filters.action    ? { action: filters.action }       : {}),
      ...(filters.user_id   ? { user_id: filters.user_id }     : {}),
      ...(filters.date_from ? { date_from: filters.date_from } : {}),
      ...(filters.date_to   ? { date_to: filters.date_to }     : {}),
    };
    startExport(exportParams, {
      onSuccess: (uuid) => setExportJobUuid(uuid),
    });
  };

  /* ── Filter helpers ─────────────────────────────────────────────── */
  function clearFilters() {
    setModuleFilter("");
    setActionFilter("");
    setUserSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Page header ────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Activity Audit Log
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Tracks who exported, downloaded, imported, and viewed
                  sensitive data across all modules.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExportBusy}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100 disabled:opacity-60"
            >
              {isExportBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isExportBusy ? "Exporting…" : "Export CSV"}
            </button>
          </div>

          {/* ── Summary cards ──────────────────────────────────────── */}
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                {
                  key: "exports" as keyof SummaryStats,
                  label: "Exports",
                  sub: "This page",
                  icon: <Download className="h-4 w-4" />,
                  iconBg: "bg-violet-600",
                },
                {
                  key: "downloads" as keyof SummaryStats,
                  label: "Downloads",
                  sub: "This page",
                  icon: <FileText className="h-4 w-4" />,
                  iconBg: "bg-blue-600",
                },
                {
                  key: "pii_views" as keyof SummaryStats,
                  label: "PII Views",
                  sub: "This page",
                  icon: <Eye className="h-4 w-4" />,
                  iconBg: "bg-amber-600",
                },
                {
                  key: "imports" as keyof SummaryStats,
                  label: "Imports & Runs",
                  sub: "This page",
                  icon: <Upload className="h-4 w-4" />,
                  iconBg: "bg-emerald-600",
                },
              ] as Array<{
                key: keyof SummaryStats;
                label: string;
                sub: string;
                icon: React.ReactNode;
                iconBg: string;
              }>
            ).map(({ key, label, sub, icon, iconBg }) => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg} text-white`}
                >
                  {icon}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    {label}
                  </div>
                  <div className="text-[10px] text-brand-700">{sub}</div>
                  <div className="mt-1 text-xl font-bold text-brand-900">
                    {isLoading ? (
                      <span className="inline-block h-5 w-8 animate-pulse rounded bg-gray-200" />
                    ) : (
                      summary[key].toLocaleString()
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 px-6 py-4">
            {/* Module select */}
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
            >
              {MODULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Action select */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* User ID filter — activity logs support only numeric user_id (AT-D7) */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                type="number"
                min={1}
                placeholder="User ID"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="h-10 w-44 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>

            {/* Date range */}
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
            />
            <ArrowRight className="h-4 w-4 shrink-0 text-brand-700" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
            />

            {/* Clear */}
            <button
              type="button"
              title="Clear all filters"
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-brand-800 transition hover:bg-brand-100"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          {/* Table header */}
          <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                <BarChart3 className="h-4 w-4" />
                Activity Events
                {isFetching && !isLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-700" />
                )}
              </h3>
              <p className="mt-1 text-sm text-brand-700">
                {isLoading ? (
                  "Loading…"
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-brand-900">
                      {rows.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-brand-900">
                      {meta.total.toLocaleString()}
                    </span>{" "}
                    activity records
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800 whitespace-nowrap">
                    Time
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    User
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Module
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Action
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800 whitespace-nowrap">
                    Records
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    File
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-brand-300/40 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-300" />
                      <div className="mt-3 text-sm text-brand-700">
                        Loading activity records…
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Info className="mx-auto h-8 w-8 text-brand-300" />
                      <div className="mt-3 text-sm font-semibold text-brand-900">
                        No user activity recorded for the selected period.
                      </div>
                      <div className="mt-1 text-sm text-brand-700">
                        Try adjusting the module, action, or date range filters.
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((log) => {
                    const actionLabel = getActionLabel(log.action);
                    const actionClass = getActionBadgeClass(log.action);
                    const moduleBadge = getModuleBadgeClass(log.module);
                    const moduleLabel = formatModuleLabel(log.module);
                    const userName  = getUserName(log);
                    const userEmail = getUserEmail(log);
                    const initials  = getInitials(userName);

                    return (
                      <tr
                        key={log.id}
                        className="transition-colors hover:bg-brand-100"
                      >
                        {/* Time */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-xs font-semibold text-brand-900 tabular-nums">
                            {formatRelativeTime(log.created_at)}
                          </div>
                          <div className="mt-0.5 text-[10px] text-brand-700">
                            {formatDateTime(log.created_at)}
                          </div>
                        </td>

                        {/* User */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-semibold text-brand-900">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="max-w-[120px] truncate text-sm font-semibold text-brand-900">
                                {userName}
                              </div>
                              <div className="mt-0.5 max-w-[120px] truncate font-mono text-[11px] text-brand-700">
                                {userEmail}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Module badge */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${moduleBadge}`}
                          >
                            {moduleLabel}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${actionClass}`}
                          >
                            {actionLabel}
                          </span>
                        </td>

                        {/* Record count */}
                        <td className="px-5 py-4">
                          {log.record_count != null ? (
                            <span className="text-sm font-semibold tabular-nums text-brand-900">
                              {log.record_count.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-xs text-brand-400">—</span>
                          )}
                        </td>

                        {/* File name */}
                        <td className="px-5 py-4">
                          {log.file_name ? (
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 shrink-0 text-brand-700" />
                              <span className="max-w-[140px] truncate font-mono text-[11px] text-brand-800">
                                {log.file_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-brand-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && (
            <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-brand-700">
                Page{" "}
                <span className="font-semibold text-brand-900">
                  {meta.current_page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-brand-900">
                  {pageCount}
                </span>
                {" · "}
                <span className="font-semibold text-brand-900">
                  {meta.total.toLocaleString()}
                </span>{" "}
                total records
              </div>

              {pageCount > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isFetching}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-semibold text-brand-800 transition hover:bg-brand-100 disabled:opacity-40"
                  >
                    ‹
                  </button>
                  {pageWindow.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold ${
                        page === p
                          ? "bg-brand-800 text-white"
                          : "border border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page >= pageCount || isFetching}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-semibold text-brand-800 transition hover:bg-brand-100 disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
