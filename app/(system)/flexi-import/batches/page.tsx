"use client";

/**
 * app/(system)/flexi-import/batches/page.tsx
 * FlexiImport — Import History
 *
 * Paginated list of all import batches for the authenticated user's company.
 * 20 records per page.
 *
 * Filters (URL-param-aware — dashboard KPI links pre-populate via ?status=):
 *   - Import Type dropdown
 *   - Status dropdown (all 10 enum values)
 *   - Date range (from / to)
 *
 * Table columns:
 *   Import Type (coloured pill) | File Name (mono, ≤40 chars) | Status badge |
 *   Total Rows | ✓/✕ breakdown | Uploaded (relative) | Uploaded By | Actions
 *
 * Actions (3-dot menu per row):
 *   • View Details    → /flexi-import/batches/{uuid}
 *   • Download Error Report → GET /batches/{uuid}/error-report (blob download)
 *   • Rollback (only if is_rollbackable=true) → confirmation dialog → POST /rollback
 *
 * Accessibility:
 *   - All form controls have visible labels (sr-only where aesthetically necessary)
 *   - aria-live for fetching indicator
 *   - role="menu" / role="menuitem" on the 3-dot dropdown
 *   - aria-current="page" on active pagination button
 *   - Error region uses role="alert"
 */

import { showApiError } from "@/lib/error-toast";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  History,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  Upload,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type BatchStatus =
  | "pending"
  | "validating"
  | "validation_complete"
  | "pending_approval"
  | "approved"
  | "processing"
  | "completed"
  | "failed"
  | "rejected"
  | "rolled_back";

interface Batch {
  uuid: string;
  import_type: string;
  file_name: string;
  status: BatchStatus;
  total_rows: number;
  successful_rows: number | null;
  failed_rows: number | null;
  created_at: string;
  uploaded_by: string;
  is_rollbackable: boolean;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface BatchListResponse {
  data: Batch[];
  meta: PaginationMeta;
}

// ── Design constants ───────────────────────────────────────────────────────────

type StatusCfg = { label: string; bg: string; text: string };

const STATUS_CONFIG: Record<BatchStatus, StatusCfg> = {
  pending:             { label: "Pending",          bg: "bg-gray-100",   text: "text-gray-700"   },
  validating:          { label: "Validating",        bg: "bg-blue-100",   text: "text-blue-700"   },
  validation_complete: { label: "Validated",         bg: "bg-indigo-100", text: "text-indigo-700" },
  pending_approval:    { label: "Pending Approval",  bg: "bg-amber-100",  text: "text-amber-700"  },
  approved:            { label: "Approved",          bg: "bg-teal-100",   text: "text-teal-700"   },
  processing:          { label: "Processing",        bg: "bg-blue-100",   text: "text-blue-800"   },
  completed:           { label: "Completed",         bg: "bg-green-100",  text: "text-green-700"  },
  failed:              { label: "Failed",            bg: "bg-red-100",    text: "text-red-700"    },
  rejected:            { label: "Rejected",          bg: "bg-orange-100", text: "text-orange-700" },
  rolled_back:         { label: "Rolled Back",       bg: "bg-slate-100",  text: "text-slate-600"  },
};

const IMPORT_TYPE_CFG: Record<string, { label: string; bg: string; text: string }> = {
  employee:   { label: "Employees",   bg: "bg-blue-100",    text: "text-blue-700"    },
  flexi_meta: { label: "FlexiMeta",   bg: "bg-purple-100",  text: "text-purple-700"  },
  department: { label: "Departments", bg: "bg-teal-100",    text: "text-teal-700"    },
  location:   { label: "Locations",   bg: "bg-emerald-100", text: "text-emerald-700" },
};

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "",                    label: "All Statuses"    },
  { value: "pending",             label: "Pending"         },
  { value: "validating",          label: "Validating"      },
  { value: "validation_complete", label: "Validated"       },
  { value: "pending_approval",    label: "Pending Approval"},
  { value: "approved",            label: "Approved"        },
  { value: "processing",          label: "Processing"      },
  { value: "completed",           label: "Completed"       },
  { value: "failed",              label: "Failed"          },
  { value: "rejected",            label: "Rejected"        },
  { value: "rolled_back",         label: "Rolled Back"     },
];

const TERMINAL_STATUSES = new Set<BatchStatus>([
  "completed", "failed", "rejected", "rolled_back",
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1_000);
  if (secs < 60)  return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

/** Truncates long filenames preserving the extension. */
function truncateFileName(name: string, max = 40): string {
  if (name.length <= max) return name;
  const dot = name.lastIndexOf(".");
  const ext  = dot >= 0 ? name.slice(dot) : "";
  return name.slice(0, max - 1 - ext.length) + "…" + ext;
}

/** Humanises import_type for the rollback dialog copy. */
function humaniseType(type: string): string {
  return (IMPORT_TYPE_CFG[type]?.label ?? type).toLowerCase();
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BatchStatus }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status, bg: "bg-gray-100", text: "text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}

function ImportTypePill({ type }: { type: string }) {
  const cfg = IMPORT_TYPE_CFG[type] ?? {
    label: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    bg: "bg-gray-100", text: "text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}

/** Animated skeleton row while loading. */
function RowSkeleton({ cols }: { cols: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div
            className="h-4 rounded bg-gray-200"
            style={{ width: `${50 + ((i * 23) % 40)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Row actions 3-dot menu ────────────────────────────────────────────────────

interface RowMenuProps {
  batch: Batch;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onView: () => void;
  onDownload: () => void;
  onRollback: () => void;
}

function RowMenu({
  batch, open, onOpen, onClose, onView, onDownload, onRollback,
}: RowMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const hasErrors  = (batch.failed_rows ?? 0) > 0;
  const isTerminal = TERMINAL_STATUSES.has(batch.status);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={open ? onClose : onOpen}
        aria-label="Batch actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer",
          open
            ? "border border-border bg-gray-50 text-foreground"
            : "border border-transparent text-muted-foreground hover:border-border hover:bg-gray-50 hover:text-foreground"
        )}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-white shadow-lg"
        >
          {/* View Details */}
          <button
            type="button"
            role="menuitem"
            onClick={() => { onClose(); onView(); }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Eye className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
            View Details
          </button>

          {/* Download Error Report — only for terminal batches with failures */}
          {hasErrors && isTerminal && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { onClose(); onDownload(); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
              Download Error Report
            </button>
          )}

          {/* Rollback — only if is_rollbackable */}
          {batch.is_rollbackable && (
            <>
              <div className="mx-3 border-t border-border" role="separator" />
              <button
                type="button"
                role="menuitem"
                onClick={() => { onClose(); onRollback(); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
                Rollback Import
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ImportHistoryPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const queryClient  = useQueryClient();

  // Filters — pre-populated from URL params (dashboard "View failed" / "Review now" links)
  const [importTypeFilter, setImportTypeFilter] = useState(
    searchParams.get("import_type") ?? ""
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") ?? ""
  );
  const [fromDate, setFromDate] = useState(searchParams.get("from") ?? "");
  const [toDate,   setToDate]   = useState(searchParams.get("to")   ?? "");
  const [page, setPage]         = useState(1);

  // Row menu open state (one at a time)
  const [openMenuUuid, setOpenMenuUuid] = useState<string | null>(null);

  // Rollback dialog
  const [rollbackTarget, setRollbackTarget] = useState<Batch | null>(null);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [importTypeFilter, statusFilter, fromDate, toDate]);

  // ── Query params (strip empty strings) ───────────────────────────────────

  const queryParams = {
    ...(importTypeFilter ? { import_type: importTypeFilter } : {}),
    ...(statusFilter     ? { status: statusFilter }          : {}),
    ...(fromDate         ? { from: fromDate }                : {}),
    ...(toDate           ? { to: toDate }                    : {}),
    page,
    per_page: 20,
  };

  // ── Data query ───────────────────────────────────────────────────────────

  const { data, isLoading, isFetching, isError } = useQuery<BatchListResponse>({
    queryKey: ["flexi-import", "batches", queryParams],
    queryFn: () =>
      api
        .get("/flexi-import/batches", { params: queryParams })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const batches = data?.data ?? [];
  const meta: PaginationMeta = data?.meta ?? {
    current_page: 1, last_page: 1, per_page: 20, total: 0,
  };

  // ── Rollback mutation ─────────────────────────────────────────────────────

  const { mutate: rollback, isPending: isRollingBack } = useMutation({
    mutationFn: (uuid: string) =>
      api.post(`/flexi-import/batches/${uuid}/rollback`),
    onSuccess: () => {
      toast.success("Rollback queued. Records will be removed shortly.");
      setRollbackTarget(null);
      queryClient.invalidateQueries({ queryKey: ["flexi-import", "batches"] });
      queryClient.invalidateQueries({ queryKey: ["flexi-import", "dashboard"] });
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: "Rollback failed. Please try again." });
    },
  });

  // ── Error report download ─────────────────────────────────────────────────

  async function handleDownload(uuid: string) {
    try {
      const res = await api.get(`/flexi-import/batches/${uuid}/error-report`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `import-errors-${uuid.slice(0, 8)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (apiFailure) {
      showApiError(apiFailure, { fallbackMessage: "Failed to download error report. Please try again." });
    }
  }

  // ── Filter helpers ────────────────────────────────────────────────────────

  function clearFilters() {
    setImportTypeFilter("");
    setStatusFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  const hasActiveFilters = !!(importTypeFilter || statusFilter || fromDate || toDate);

  // ── Pagination window ─────────────────────────────────────────────────────

  const pageCount = meta.last_page;
  const pageWindow = (() => {
    let start = Math.max(1, page - 2);
    const end  = Math.min(pageCount, start + 4);
    start      = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="h-5 w-5 text-muted-foreground" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight">Import History</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            All bulk import batches for your organisation — 20 per page.
          </p>
        </div>
        <Link
          href="/flexi-import/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0 self-start"
          style={{ backgroundColor: "var(--brand-500)" }}
        >
          <Upload className="h-3.5 w-3.5" aria-hidden />
          New Import
        </Link>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <section aria-label="Filter import batches">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center gap-3">

            {/* Import Type */}
            <div>
              <label htmlFor="filter-type" className="sr-only">
                Filter by import type
              </label>
              <select
                id="filter-type"
                value={importTypeFilter}
                onChange={(e) => setImportTypeFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-ring cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="employees">Employees</option>
                <option value="flexi_meta_entities">FlexiMeta Reference Data</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="filter-status" className="sr-only">
                Filter by status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-ring cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-from" className="sr-only">
                From date
              </label>
              <input
                id="filter-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-ring cursor-pointer"
              />
              <ArrowRight
                className="h-4 w-4 text-muted-foreground shrink-0"
                aria-hidden
              />
              <label htmlFor="filter-to" className="sr-only">
                To date
              </label>
              <input
                id="filter-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-ring cursor-pointer"
              />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-border bg-white text-sm text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Filter className="h-3.5 w-3.5" aria-hidden />
                Clear
              </button>
            )}

            {/* Background-refetch indicator */}
            {isFetching && !isLoading && (
              <div
                className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground"
                aria-live="polite"
                aria-atomic="true"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Refreshing…
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <section aria-label="Import batch list">
        <div className="bg-white rounded-xl border border-border overflow-hidden">

          {/* Results count strip */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
              {isLoading ? (
                "Loading batches…"
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold text-foreground">{batches.length}</span>
                  {" "}of{" "}
                  <span className="font-semibold text-foreground">
                    {meta.total.toLocaleString()}
                  </span>
                  {" "}batch{meta.total !== 1 ? "es" : ""}
                  {hasActiveFilters && " (filtered)"}
                </>
              )}
            </p>
          </div>

          {/* Error banner */}
          {isError && (
            <div
              role="alert"
              className="flex items-center gap-2 px-6 py-4 text-sm text-destructive bg-red-50 border-b border-red-200"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              Failed to load import history. Please refresh the page.
            </div>
          )}

          {/* Scrollable table wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Import batches">
              <thead>
                <tr className="bg-gray-50/60 border-b border-border">
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    Import Type
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    File Name
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    ✓&nbsp;/&nbsp;✕
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell"
                  >
                    Uploaded
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell"
                  >
                    Uploaded By
                  </th>
                  <th
                    scope="col"
                    className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {/* Loading skeletons */}
                {isLoading &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <RowSkeleton key={i} cols={8} />
                  ))}

                {/* Empty state */}
                {!isLoading && !isError && batches.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16">
                      <div className="flex flex-col items-center text-center">
                        <div
                          className="h-12 w-12 rounded-full flex items-center justify-center mb-3"
                          style={{ backgroundColor: "rgba(238,194,147,0.15)" }}
                        >
                          <History
                            className="h-5 w-5"
                            style={{ color: "var(--brand-500)" }}
                            aria-hidden
                          />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {hasActiveFilters
                            ? "No imports match your filters."
                            : "No imports yet."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                          {hasActiveFilters
                            ? "Try adjusting your date range or status filter."
                            : "Start your first bulk import to see history here."}
                        </p>
                        {hasActiveFilters ? (
                          <button
                            type="button"
                            onClick={clearFilters}
                            className="mt-3 text-xs font-semibold underline underline-offset-2 text-foreground hover:text-muted-foreground transition-colors cursor-pointer"
                          >
                            Clear filters
                          </button>
                        ) : (
                          <Link
                            href="/flexi-import/new"
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: "var(--brand-500)" }}
                          >
                            <Upload className="h-3.5 w-3.5" aria-hidden />
                            Start First Import
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!isLoading &&
                  batches.map((batch) => (
                    <tr
                      key={batch.uuid}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Import Type */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <ImportTypePill type={batch.import_type} />
                      </td>

                      {/* File Name */}
                      <td className="px-4 py-4 max-w-[220px]">
                        <span
                          title={batch.file_name}
                          className="font-mono text-xs text-foreground truncate block"
                        >
                          {truncateFileName(batch.file_name)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={batch.status} />
                      </td>

                      {/* Total Rows */}
                      <td className="px-4 py-4 text-right tabular-nums font-medium text-foreground whitespace-nowrap">
                        {batch.total_rows.toLocaleString()}
                      </td>

                      {/* Successful / Failed breakdown */}
                      <td className="px-4 py-4 text-right tabular-nums whitespace-nowrap">
                        <span className="text-green-600 text-xs font-medium">
                          {batch.successful_rows !== null
                            ? `+${batch.successful_rows.toLocaleString()}`
                            : "—"}
                        </span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            (batch.failed_rows ?? 0) > 0
                              ? "text-red-500"
                              : "text-muted-foreground"
                          )}
                        >
                          {batch.failed_rows !== null
                            ? `-${batch.failed_rows.toLocaleString()}`
                            : "—"}
                        </span>
                      </td>

                      {/* Uploaded (relative time) */}
                      <td
                        className="px-4 py-4 text-muted-foreground text-xs tabular-nums hidden md:table-cell whitespace-nowrap"
                        title={formatDateTime(batch.created_at)}
                      >
                        {formatRelativeTime(batch.created_at)}
                      </td>

                      {/* Uploaded By */}
                      <td className="px-4 py-4 text-muted-foreground text-sm hidden lg:table-cell">
                        <span className="truncate block max-w-[140px]">
                          {batch.uploaded_by}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          <RowMenu
                            batch={batch}
                            open={openMenuUuid === batch.uuid}
                            onOpen={() => setOpenMenuUuid(batch.uuid)}
                            onClose={() => setOpenMenuUuid(null)}
                            onView={() =>
                              router.push(`/flexi-import/batches/${batch.uuid}`)
                            }
                            onDownload={() => handleDownload(batch.uuid)}
                            onRollback={() => setRollbackTarget(batch)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && pageCount > 1 && (
            <div className="flex flex-col gap-3 px-6 py-4 border-t border-border sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page{" "}
                <span className="font-semibold text-foreground">
                  {meta.current_page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">{pageCount}</span>
                {" · "}
                <span className="font-semibold text-foreground">
                  {meta.total.toLocaleString()}
                </span>{" "}
                total
              </p>

              <nav aria-label="Pagination">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isFetching}
                    aria-label="Previous page"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-foreground hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>

                  {pageWindow.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      aria-label={`Go to page ${p}`}
                      aria-current={page === p ? "page" : undefined}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                        page === p
                          ? "text-white"
                          : "border border-border bg-white text-foreground hover:bg-gray-50"
                      )}
                      style={
                        page === p
                          ? { backgroundColor: "var(--brand-500)" }
                          : {}
                      }
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page >= pageCount || isFetching}
                    aria-label="Next page"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-foreground hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </section>

      {/* ── Rollback confirmation dialog ─────────────────────────────── */}
      <Dialog
        open={!!rollbackTarget}
        onOpenChange={() => !isRollingBack && setRollbackTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
              Rollback Import?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1">
                {rollbackTarget && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This will remove{" "}
                    <strong className="text-foreground">
                      {(rollbackTarget.successful_rows ?? 0).toLocaleString()}
                    </strong>{" "}
                    <strong className="text-foreground">
                      {humaniseType(rollbackTarget.import_type)}
                    </strong>{" "}
                    records that were created by this import. This cannot be
                    undone. Affected employees will lose system access.
                  </p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          {rollbackTarget && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-xs text-red-700 leading-relaxed">
                <span className="font-semibold">File: </span>
                <span className="font-mono">{rollbackTarget.file_name}</span>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRollbackTarget(null)}
              disabled={isRollingBack}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isRollingBack}
              onClick={() => rollbackTarget && rollback(rollbackTarget.uuid)}
            >
              {isRollingBack ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
                  Rolling back…
                </>
              ) : (
                "Yes, Rollback"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
