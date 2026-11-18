"use client";

/**
 * app/(system)/flexi-import/page.tsx
 * FlexiImport — Dashboard
 *
 * Displays four KPI cards (imports / rows / failures / pending approval),
 * a Quick Start section for launching common import types, and a Recent
 * Imports table showing the last 5 batches with status badges and actions.
 *
 * Data source: GET /api/v1/flexi-import/dashboard
 * Query key  : ["flexi-import", "dashboard"]
 * Stale time : 60 seconds
 */

import React from "react";
import Link from "next/link";
import {
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  FileInput,
  ChevronRight,
  AlertTriangle,
  Download,
  Users,
  Building2,
  MapPin,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { normalizeImportDashboard, type ImportDashboardData as DashboardData } from "@/lib/flexi-import-dashboard";

// ── API types ─────────────────────────────────────────────────────────────────

type BatchStatus = string;

// ── Status badge ──────────────────────────────────────────────────────────────

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

function StatusBadge({ status }: { status: BatchStatus }) {
  const cfg: StatusCfg = STATUS_CONFIG[status] ?? {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}

// ── Quick-start import types ──────────────────────────────────────────────────

const IMPORT_TYPES = [
  {
    id: "employee",
    label: "Employee Import",
    description: "Add or update employee records in bulk",
    icon: Users,
    href: "/flexi-import/new?type=employee",
  },
  {
    id: "department",
    label: "Department Import",
    description: "Sync department and cost-centre structure",
    icon: Building2,
    href: "/flexi-import/new?type=department",
  },
  {
    id: "location",
    label: "Location Import",
    description: "Bulk-update company locations and branches",
    icon: MapPin,
    href: "/flexi-import/new?type=location",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── KPI Card skeleton ─────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 border border-border animate-pulse">
      <div className="h-3 w-36 bg-gray-200 rounded mb-3" />
      <div className="h-8 w-20 bg-gray-200 rounded" />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FlexiImportDashboard() {
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["flexi-import", "dashboard"],
    queryFn: () =>
      api.get("/flexi-import/dashboard").then((r) => { if (r.data.success === false) throw r.data; return normalizeImportDashboard(r.data.data); }),
    select: normalizeImportDashboard,
    staleTime: 60_000,
  });

  // Derived values — safe to reference in JSX without ternary nesting
  const totalImports   = data?.total_imports_month    ?? 0;
  const successfulRows = data?.successful_rows_month  ?? 0;
  const failedRows     = data?.failed_rows_month      ?? 0;
  const pendingCount   = data?.pending_approval_count ?? 0;
  const recentBatches  = data?.recent_batches         ?? [];

  const hasErrors  = failedRows  > 0;
  const hasPending = pendingCount > 0;

  return (
    <div className="space-y-8">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor bulk import activity and manage data ingestion for your
          organisation.
        </p>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <section aria-label="Import statistics">
        {isError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Failed to load dashboard data. Please refresh.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          ) : (
            <>
              {/* Imports this month */}
              <div className="bg-white rounded-xl p-5 border border-border border-l-4 border-l-blue-500">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Imports This Month
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {totalImports.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileInput className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Successful rows */}
              <div className="bg-white rounded-xl p-5 border border-border border-l-4 border-l-green-500">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Successful Rows
                    </p>
                    <p className="text-3xl font-bold mt-1 text-green-600">
                      {successfulRows.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Failed rows — red accent if >0, green if clean */}
              <div
                className={`bg-white rounded-xl p-5 border border-border border-l-4 ${
                  hasErrors ? "border-l-red-500" : "border-l-green-500"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Failed Rows
                    </p>
                    <p
                      className={`text-3xl font-bold mt-1 ${
                        hasErrors ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {failedRows.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      hasErrors ? "bg-red-50" : "bg-green-50"
                    }`}
                  >
                    <XCircle
                      className={`h-4 w-4 ${
                        hasErrors ? "text-red-600" : "text-green-600"
                      }`}
                    />
                  </div>
                </div>
                {hasErrors && (
                  <Link
                    href="/flexi-import/batches?status=failed"
                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium mt-2"
                  >
                    View failed <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>

              {/* Pending approval — amber accent if >0 */}
              <div
                className={`bg-white rounded-xl p-5 border border-border border-l-4 ${
                  hasPending ? "border-l-amber-500" : "border-l-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Pending Approval
                    </p>
                    <p
                      className={`text-3xl font-bold mt-1 ${
                        hasPending ? "text-amber-600" : "text-gray-400"
                      }`}
                    >
                      {pendingCount.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      hasPending ? "bg-amber-50" : "bg-gray-50"
                    }`}
                  >
                    <Clock
                      className={`h-4 w-4 ${
                        hasPending ? "text-amber-600" : "text-gray-400"
                      }`}
                    />
                  </div>
                </div>
                {hasPending && (
                  <Link
                    href="/flexi-import/batches?status=pending_approval"
                    className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium mt-2"
                  >
                    Review now <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Quick Start ────────────────────────────────────────────────────── */}
      <section aria-label="Quick start">
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold">Start a New Import</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Select an import type to begin uploading data.
              </p>
            </div>
            <Link
              href="/flexi-import/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--brand-500)" }}
            >
              <Upload className="h-3.5 w-3.5" />
              New Import
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {IMPORT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Link
                  key={type.id}
                  href={type.href}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-gray-300 hover:bg-gray-50/60 transition-colors group"
                >
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: "rgba(238,194,147,0.18)" }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: "var(--brand-500)" }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {type.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 self-center transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Recent Imports ─────────────────────────────────────────────────── */}
      <section aria-label="Recent imports">
        <div className="bg-white rounded-xl border border-border overflow-hidden">

          {/* Section header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Recent Imports</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Last 5 import batches
              </p>
            </div>
            <Link
              href="/flexi-import/batches"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="px-6 py-4 flex items-center gap-4 animate-pulse"
                >
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-5 w-24 bg-gray-200 rounded-full" />
                  <div className="h-4 w-12 bg-gray-200 rounded ml-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isError && !isLoading && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Unable to load recent imports.
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && recentBatches.length === 0 && (
            <div className="px-6 py-16 flex flex-col items-center text-center">
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(238,194,147,0.15)" }}
              >
                <Upload
                  className="h-5 w-5"
                  style={{ color: "var(--brand-500)" }}
                />
              </div>
              <p className="text-sm font-semibold text-foreground">
                No imports yet
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                Start your first bulk import to bring employee and organisation
                data into Flexi HRMS.
              </p>
              <Link
                href="/flexi-import/new"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--brand-500)" }}
              >
                <Upload className="h-3.5 w-3.5" />
                Start First Import
              </Link>
            </div>
          )}

          {/* Table */}
          {!isLoading && !isError && recentBatches.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50/60">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Import Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Rows
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                      Initiated By
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                      Date
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentBatches.map((batch) => (
                    <tr
                      key={batch.uuid}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        {batch.import_type}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={batch.status} />
                      </td>

                      <td className="px-4 py-4 text-right text-muted-foreground tabular-nums">
                        <span className="font-medium">
                          {batch.total_rows.toLocaleString()}
                        </span>
                        {batch.successful_rows !== null &&
                          batch.successful_rows > 0 && (
                            <span className="ml-1.5 text-green-600 text-xs">
                              +{batch.successful_rows.toLocaleString()}
                            </span>
                          )}
                        {batch.failed_rows !== null &&
                          batch.failed_rows > 0 && (
                            <span className="ml-0.5 text-red-500 text-xs">
                              −{batch.failed_rows.toLocaleString()}
                            </span>
                          )}
                      </td>

                      <td className="px-4 py-4 text-muted-foreground hidden md:table-cell">
                        {batch.initiated_by || "—"}
                      </td>

                      <td className="px-4 py-4 text-muted-foreground hidden sm:table-cell tabular-nums text-xs">
                        {formatDate(batch.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/flexi-import/batches/${batch.uuid}`}
                            className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                          >
                            View
                            <ChevronRight className="h-3 w-3" />
                          </Link>

                          {/* Error report — only shown when failures exist */}
                          {batch.failed_rows !== null &&
                            batch.failed_rows > 0 && (
                              <Link
                                href={`/flexi-import/batches/${batch.uuid}?tab=errors`}
                                className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                                title="View row-level validation errors"
                              >
                                <Download className="h-3 w-3" />
                                Errors
                              </Link>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
