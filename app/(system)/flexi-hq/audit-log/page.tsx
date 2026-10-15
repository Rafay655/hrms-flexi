// app/flexi-hq/audit-log/page.tsx
"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DownloadIcon,
  SearchIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  RefreshCw,
  Eye,
  Clock,
  User,
  ShieldCheck,
  Filter,
  Calendar,
  Activity,
  X,
  RotateCcw,
} from "lucide-react";



import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type AuditCauser = {
  id: number;
  name: string;
  email: string;
};

type AuditLogApiItem = {
  id: number;
  log_name: string | null;
  event: string | null;
  description: string | null;
  subject_type: string | null;
  subject_id: number | null;
  causer: AuditCauser | null;
  changes_count: number;
  created_at: string;
};

type AuditPagination = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
};

type AuditLogApiResponse = {
  success: boolean;
  message: string;
  data: {
    data: AuditLogApiItem[];
    pagination: AuditPagination;
  };
};

type AuditChangeDetail = {
  field: string;
  old_value: string | number | boolean | null;
  new_value: string | number | boolean | null;
};

type AuditLogDetail = {
  id: number;
  log_name: string | null;
  event: string | null;
  description: string | null;
  subject_type: string | null;
  subject_id: number | null;
  causer: AuditCauser | null;
  changes: AuditChangeDetail[];
  properties: {
    model?: string;
    model_id?: number | null;
    attributes?: Record<string, any>;
    old?: Record<string, any>;
    company_id?: number | null;
    ip_address?: string | null;
    user_agent?: string | null;
    [key: string]: any;
  } | null;
  created_at: string;
};

type AuditLogDetailResponse = {
  success: boolean;
  message: string;
  data: AuditLogDetail;
};

type AuditLogRow = AuditLogApiItem & {
  sr: number;
};

type FilterState = {
  search: string;
  subject_type: string;
  date_from: string;
  date_to: string;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const DEFAULT_PER_PAGE = 10;

const SUBJECT_OPTIONS = [
  { label: "Employee", value: "Employee" },
  { label: "User", value: "User" },
  { label: "Company", value: "Company" },
  { label: "Department", value: "Department" },
  { label: "Designation", value: "Designation" },
  { label: "Onboard Setting Field", value: "OnboardSettingField" },
  { label: "Onboard Setting Step", value: "OnboardSettingStep" },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function getInitials(name?: string | null) {
  if (!name) return "NA";

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeEvent(event?: string | null, description?: string | null) {
  if (event) return event.toUpperCase();

  const text = description?.toLowerCase() ?? "";

  if (text.includes("login") || text.includes("logged in")) return "LOGIN";
  if (text.includes("created")) return "CREATED";
  if (text.includes("updated")) return "UPDATED";
  if (text.includes("deleted")) return "DELETED";

  return "SYSTEM";
}

function getActionBadge(action: string) {
  switch (action.toUpperCase()) {
    case "CREATED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "UPDATED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "DELETED":
      return "border-red-200 bg-red-50 text-red-700";
    case "LOGIN":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-gray-200 bg-white text-gray-700";
  }
}

function getActionDot(action: string) {
  switch (action.toUpperCase()) {
    case "CREATED":
      return "bg-emerald-500";
    case "UPDATED":
      return "bg-blue-500";
    case "DELETED":
      return "bg-red-500";
    case "LOGIN":
      return "bg-slate-500";
    default:
      return "bg-gray-400";
  }
}

function cleanSubjectType(subjectType?: string | null) {
  if (!subjectType) return "—";

  const parts = subjectType.split("\\");
  return parts[parts.length - 1] || subjectType;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function buildQuery(params: {
  page: number;
  perPage: number;
  filters: FilterState;
}) {
  const query = new URLSearchParams();

  query.set("page", String(params.page));
  query.set("per_page", String(params.perPage));

  if (params.filters.search.trim()) {
    query.set("search", params.filters.search.trim());
  }

  if (params.filters.subject_type.trim()) {
    query.set("subject_type", params.filters.subject_type.trim());
  }

  if (params.filters.date_from.trim()) {
    query.set("date_from", params.filters.date_from.trim());
  }

  if (params.filters.date_to.trim()) {
    query.set("date_to", params.filters.date_to.trim());
  }

  return query.toString();
}

/* -------------------------------------------------------------------------- */
/* White Fancy Details Modal                                                   */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Redesigned AuditDetailsModal                                               */
/* -------------------------------------------------------------------------- */

function AuditDetailsModal({
  log,
  open,
  onClose,
}: {
  log: AuditLogRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<AuditLogDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchDetail = async (id: number) => {
    try {
      setIsLoadingDetail(true);
      const response = await api.get<AuditLogDetailResponse>(`/audit-log/${id}`);
      setDetail(response.data?.data ?? null);
    } catch (error: any) {
      showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Failed to load audit detail." });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (open && log?.id) {
      setDetail(null);
      fetchDetail(log.id);
    }
  }, [open, log?.id]);

  if (!log) return null;

  const activeLog = detail ?? log;
  const action = normalizeEvent(activeLog.event, activeLog.description);
  const changes = detail?.changes ?? [];

  const actionConfig: Record<string, { bg: string; text: string; dot: string; ring: string }> = {
    CREATED: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      ring: "ring-emerald-200",
    },
    UPDATED: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
      ring: "ring-blue-200",
    },
    DELETED: {
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
      ring: "ring-red-200",
    },
    LOGIN: {
      bg: "bg-slate-100",
      text: "text-slate-600",
      dot: "bg-slate-400",
      ring: "ring-slate-200",
    },
    SYSTEM: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      dot: "bg-gray-400",
      ring: "ring-gray-200",
    },
  };

  const cfg = actionConfig[action] ?? actionConfig.SYSTEM;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl min-w-5xl  overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl">

        {/* ── Header ── */}
        <div className="relative overflow-hidden bg-slate-950 px-7 py-6">
          {/* decorative grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <Activity className="h-5 w-5 text-white" />
              </div>

              <div>
                <DialogTitle className="text-lg font-bold tracking-tight text-white">
                  Audit Log Detail
                </DialogTitle>
                <p className="mt-0.5 text-sm text-slate-400">
                  Full activity trail · Log #{activeLog.id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                {action}
              </span>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-h-[68vh] overflow-y-auto bg-slate-50">
          {isLoadingDetail ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-500">Loading audit details…</p>
            </div>
          ) : (
            <div className="space-y-4 p-6">

              {/* ── 4-up stat row ── */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Log ID", value: `#${activeLog.id}` },
                  { label: "Log Name", value: activeLog.log_name || "—" },
                  { label: "Subject", value: cleanSubjectType(activeLog.subject_type) },
                  { label: "Changes", value: String(changes.length) },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1.5 truncate text-sm font-bold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* ── Activity summary ── */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Activity Summary
                  </p>
                </div>

                <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  {[
                    {
                      icon: <Activity className="h-3.5 w-3.5 text-slate-400" />,
                      label: "Description",
                      value: activeLog.description || "—",
                    },
                    {
                      icon: <Clock className="h-3.5 w-3.5 text-slate-400" />,
                      label: "Timestamp",
                      value: activeLog.created_at,
                    },
                    {
                      icon: <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />,
                      label: "Subject ID",
                      value: activeLog.subject_id != null ? String(activeLog.subject_id) : "—",
                    },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3 px-5 py-4">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100">
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          {label}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Changed By ── */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Changed By
                  </p>
                </div>

                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white ring-2 ring-offset-2 ring-slate-200">
                    {getInitials(activeLog.causer?.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      {activeLog.causer?.name ?? "System"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {activeLog.causer?.email ?? "No email available"}
                    </p>
                  </div>

                  <div className="hidden text-right sm:block">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      User ID
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-700">
                      {activeLog.causer?.id ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Field Changes ── */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Field Changes
                  </p>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {changes.length} {changes.length === 1 ? "field" : "fields"}
                  </span>
                </div>

                {changes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                      <ShieldCheck className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No field changes recorded</p>
                    <p className="text-xs text-slate-400">This may be a login or system event.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {changes.map((change, index) => (
                      <div key={`${change.field}-${index}`} className="px-5 py-4">
                        {/* Field name pill */}
                        <div className="mb-3 flex items-center gap-2">
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
                            {change.field}
                          </span>
                        </div>

                        {/* Old → New diff */}
                        <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-2">
                          {/* Old */}
                          <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400">
                              Before
                            </p>
                            <p className="break-all font-mono text-xs leading-relaxed text-red-700">
                              {formatValue(change.old_value)}
                            </p>
                          </div>

                          {/* Arrow */}
                          <div className="flex items-center justify-center">
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                          </div>

                          {/* New */}
                          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                              After
                            </p>
                            <p className="break-all font-mono text-xs leading-relaxed text-emerald-700">
                              {formatValue(change.new_value)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Request Metadata ── */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Request Metadata
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-px bg-gray-100 sm:grid-cols-2">
                  {[
                    { label: "IP Address", value: detail?.properties?.ip_address ?? "—" },
                    { label: "Company ID", value: formatValue(detail?.properties?.company_id) },
                    { label: "Model ID", value: formatValue(detail?.properties?.model_id) },
                    {
                      label: "Model",
                      value: detail?.properties?.model ?? cleanSubjectType(activeLog.subject_type),
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white px-5 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {label}
                      </p>
                      <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-800">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* User Agent — full width */}
                <div className="border-t border-gray-100 px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    User Agent
                  </p>
                  <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-800">
                    {detail?.properties?.user_agent ?? "—"}
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
          <p className="text-xs text-slate-400">
            Log recorded at{" "}
            <span className="font-semibold text-slate-600">{activeLog.created_at}</span>
          </p>

          <Button
            type="button"
            onClick={onClose}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            Close
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogApiItem[]>([]);
  const [pagination, setPagination] = useState<AuditPagination>({
    total: 0,
    per_page: DEFAULT_PER_PAGE,
    current_page: 1,
    last_page: 1,
  });

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const [draftFilters, setDraftFilters] = useState<FilterState>({
    search: "",
    subject_type: "",
    date_from: "",
    date_to: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    search: "",
    subject_type: "",
    date_from: "",
    date_to: "",
  });

  const [isFetching, setIsFetching] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const hasFilters = Boolean(
    appliedFilters.search ||
      appliedFilters.subject_type ||
      appliedFilters.date_from ||
      appliedFilters.date_to
  );

  const currentPage = pagination.current_page || page;
  const totalPages = Math.max(1, pagination.last_page || 1);
  const totalEntries = pagination.total || 0;
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const rows: AuditLogRow[] = useMemo(() => {
    const start = (currentPage - 1) * perPage;

    return logs.map((log, index) => ({
      ...log,
      sr: start + index + 1,
    }));
  }, [logs, currentPage, perPage]);

  const fetchAuditLogs = async () => {
    try {
      setIsFetching(true);

      const query = buildQuery({
        page,
        perPage,
        filters: appliedFilters,
      });

      const response = await api.get<AuditLogApiResponse>(`/audit-log?${query}`);

      setLogs(response.data?.data?.data ?? []);
      setPagination(
        response.data?.data?.pagination ?? {
          total: 0,
          per_page: perPage,
          current_page: page,
          last_page: 1,
        }
      );
    } catch (error: any) {
      showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Failed to load audit logs." });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, appliedFilters]);

  useEffect(() => {
    setPage(1);
  }, [perPage]);

  const updateDraftFilter = (key: keyof FilterState, value: string) => {
    setDraftFilters((previous) => ({
      ...previous,
      [key]: value === "__all__" ? "" : value,
    }));
  };

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(draftFilters);
  };

  const clearFilters = () => {
    const emptyFilters: FilterState = {
      search: "",
      subject_type: "",
      date_from: "",
      date_to: "",
    };

    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  const handleRefresh = () => {
    fetchAuditLogs();
  };

  const handleExportCSV = () => {
    const headers = [
      "Sr",
      "Description",
      "Event",
      "Log Name",
      "Subject Type",
      "Subject ID",
      "Changed By",
      "Changed By Email",
      "Changes Count",
      "Created At",
    ];

    const csvRows = rows.map((log) => [
      log.sr,
      log.description ?? "",
      normalizeEvent(log.event, log.description),
      log.log_name ?? "",
      cleanSubjectType(log.subject_type),
      log.subject_id ?? "",
      log.causer?.name ?? "",
      log.causer?.email ?? "",
      log.changes_count,
      log.created_at,
    ]);

    const csv = [headers, ...csvRows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const file = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const columns: ColumnDef<AuditLogRow>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "Sr.",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-brand-900">
            {row.original.sr}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Activity",
        cell: ({ row }) => {
          const action = normalizeEvent(
            row.original.event,
            row.original.description
          );

          return (
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${getActionDot(
                  action
                )}`}
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-brand-900">
                  {row.original.description || "—"}
                </p>
                <p className="mt-0.5 truncate text-xs text-brand-700">
                  {row.original.log_name || "system"} · #{row.original.id}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "event",
        header: "Event",
        cell: ({ row }) => {
          const action = normalizeEvent(
            row.original.event,
            row.original.description
          );

          return (
            <Badge
              variant="outline"
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${getActionBadge(
                action
              )}`}
            >
              {action}
            </Badge>
          );
        },
      },
      {
        accessorKey: "subject_type",
        header: "Subject",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-brand-900">
              {cleanSubjectType(row.original.subject_type)}
            </p>
            <p className="text-xs text-brand-600">
              ID: {row.original.subject_id ?? "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "causer",
        header: "Changed By",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-brand-100 text-[10px] font-bold text-brand-900">
              {getInitials(row.original.causer?.name)}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-brand-900">
                {row.original.causer?.name ?? "System"}
              </p>
              <p className="truncate text-xs text-brand-700">
                {row.original.causer?.email ?? "—"}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Timestamp",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-brand-700">
            <Clock className="h-3.5 w-3.5 text-brand-500" />
            {row.original.created_at}
          </div>
        ),
      },
      {
        accessorKey: "changes_count",
        header: () => <div className="text-center">Changes</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.changes_count > 0 ? (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-2 text-[10px] font-bold text-blue-700">
                {row.original.changes_count}
              </span>
            ) : (
              <span className="text-sm text-brand-300">—</span>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">View</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-800 hover:bg-brand-100 hover:text-brand-900"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedLog(row.original);
                setModalOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  return (
    <div className="min-h-screen bg-white p-3">
      <Card className="border border-gray-200 bg-white shadow-sm">
       <CardHeader className="border-b border-gray-200">
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
        <Activity className="h-5 w-5 text-white" />
      </div>

      <div>
        <CardTitle className="text-2xl font-bold text-brand-900">
          Audit Log
        </CardTitle>
        <p className="text-sm text-brand-700 mt-0.5">
          {totalEntries.toLocaleString()} records · system-wide event history
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="gap-2 border-gray-200 text-brand-800 hover:bg-brand-100"
        onClick={handleRefresh}
        disabled={isFetching}
      >
        {isFetching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Refresh
      </Button>

      <Button
        variant="outline"
        className={`gap-2 border-gray-200 text-brand-800 hover:bg-brand-100 ${
          showFilters ? "bg-brand-100" : ""
        }`}
        onClick={() => setShowFilters((value) => !value)}
      >
        <Filter className="h-4 w-4" />
        Filters
        {hasFilters && (
          <span className="ml-1 h-2 w-2 rounded-full bg-brand-800" />
        )}
      </Button>

      <Button
        variant="outline"
        className="gap-2 border-gray-200 text-brand-800 hover:bg-brand-100"
        onClick={handleExportCSV}
        disabled={rows.length === 0}
      >
        <DownloadIcon className="h-4 w-4" />
        Export CSV
      </Button>
    </div>
  </div>
</CardHeader>
        <CardContent className="space-y-4 bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />

              <Input
                placeholder="Search employee, activity, user..."
                value={draftFilters.search}
                onChange={(event) =>
                  updateDraftFilter("search", event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
                className="border-gray-200 bg-white pl-10 text-brand-900 focus:border-brand-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-brand-700">Show</span>

              <Select
                value={perPage.toString()}
                onValueChange={(value) => {
                  setPerPage(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-20 border-gray-200 bg-white text-brand-800">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {[10, 25, 50, 100].map((item) => (
                    <SelectItem key={item} value={item.toString()}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-sm text-brand-700">entries</span>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-4 rounded-xl border border-gray-200 bg-brand-100 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Select
                  value={draftFilters.subject_type || "__all__"}
                  onValueChange={(value) =>
                    updateDraftFilter("subject_type", value)
                  }
                >
                  <SelectTrigger className="w-full border-gray-200 bg-white text-brand-800">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="__all__">All Subjects</SelectItem>
                    {SUBJECT_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <Input
                    type="date"
                    className="border-gray-200 bg-white pl-9 text-brand-800"
                    value={draftFilters.date_from}
                    onChange={(event) =>
                      updateDraftFilter("date_from", event.target.value)
                    }
                  />
                </div>

                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <Input
                    type="date"
                    className="border-gray-200 bg-white pl-9 text-brand-800"
                    value={draftFilters.date_to}
                    onChange={(event) =>
                      updateDraftFilter("date_to", event.target.value)
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1 bg-brand-800 text-white hover:bg-brand-900"
                    onClick={applyFilters}
                    disabled={isFetching}
                  >
                    {isFetching ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Filter className="mr-2 h-4 w-4" />
                    )}
                    Apply
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-200 bg-white text-brand-800 hover:bg-brand-200"
                    onClick={clearFilters}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {hasFilters && (
                <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3">
                  <span className="text-xs font-medium text-brand-700">
                    Active:
                  </span>

                  {appliedFilters.search && (
                    <Badge
                      variant="outline"
                      className="bg-white text-xs text-brand-800"
                    >
                      Search: {appliedFilters.search}
                    </Badge>
                  )}

                  {appliedFilters.subject_type && (
                    <Badge
                      variant="outline"
                      className="bg-white text-xs text-brand-800"
                    >
                      Subject: {appliedFilters.subject_type}
                    </Badge>
                  )}

                  {appliedFilters.date_from && (
                    <Badge
                      variant="outline"
                      className="bg-white text-xs text-brand-800"
                    >
                      From: {appliedFilters.date_from}
                    </Badge>
                  )}

                  {appliedFilters.date_to && (
                    <Badge
                      variant="outline"
                      className="bg-white text-xs text-brand-800"
                    >
                      To: {appliedFilters.date_to}
                    </Badge>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-brand-700 hover:bg-brand-200"
                    onClick={clearFilters}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
            <div className="text-sm">
              <span className="text-brand-700">Showing </span>
              <span className="font-semibold text-brand-900">
                {showingFrom.toLocaleString()}
              </span>
              <span className="text-brand-700"> to </span>
              <span className="font-semibold text-brand-900">
                {showingTo.toLocaleString()}
              </span>
              <span className="text-brand-700"> of </span>
              <span className="font-semibold text-brand-900">
                {totalEntries.toLocaleString()}
              </span>
              <span className="text-brand-700"> entries</span>
            </div>

            {isFetching && (
              <Badge
                variant="outline"
                className="w-fit gap-1 bg-white text-xs text-brand-800"
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating...
              </Badge>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-brand-100">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="cursor-pointer px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800 transition hover:bg-brand-200"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getIsSorted() === "asc" && (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                            {header.column.getIsSorted() === "desc" && (
                              <ChevronLeft className="h-3.5 w-3.5" />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody className="divide-y divide-brand-300/50 bg-white">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ShieldCheck className="h-10 w-10 text-brand-300" />
                          <p className="font-medium text-brand-800">
                            No audit records found
                          </p>
                          <p className="text-sm text-brand-600">
                            Try adjusting your search or filters
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer transition hover:bg-brand-100"
                        onClick={() => {
                          setSelectedLog(row.original);
                          setModalOpen(true);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-5 py-3.5 text-sm"
                            onClick={(event) => {
                              if (
                                (event.target as HTMLElement).closest("button")
                              ) {
                                event.stopPropagation();
                              }
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {rows.length > 0 && (
              <div className="border-t border-gray-200 bg-white px-5 py-4">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                  <div className="text-sm text-brand-700">
                    Page{" "}
                    <span className="font-semibold text-brand-900">
                      {currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-brand-900">
                      {totalPages}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={currentPage === 1 || isFetching}
                      className="border-gray-200 bg-white text-brand-800 hover:bg-brand-200"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      disabled={currentPage === 1 || isFetching}
                      className="border-gray-200 bg-white text-brand-800 hover:bg-brand-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="mx-1 flex items-center space-x-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, index) => {
                          let itemPage: number;

                          if (totalPages <= 5) {
                            itemPage = index + 1;
                          } else if (currentPage <= 3) {
                            itemPage = index + 1;
                          } else if (currentPage >= totalPages - 2) {
                            itemPage = totalPages - 4 + index;
                          } else {
                            itemPage = currentPage - 2 + index;
                          }

                          return (
                            <Button
                              key={itemPage}
                              variant={
                                currentPage === itemPage
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setPage(itemPage)}
                              disabled={isFetching}
                              className={
                                currentPage === itemPage
                                  ? "bg-brand-800 text-white hover:bg-brand-900"
                                  : "border-gray-200 bg-white text-brand-800 hover:bg-brand-200"
                              }
                            >
                              {itemPage}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((value) => Math.min(totalPages, value + 1))
                      }
                      disabled={currentPage === totalPages || isFetching}
                      className="border-gray-200 bg-white text-brand-800 hover:bg-brand-200"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={currentPage === totalPages || isFetching}
                      className="border-gray-200 bg-white text-brand-800 hover:bg-brand-200"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-brand-700">
                    <span className="font-semibold text-brand-900">
                      {showingFrom.toLocaleString()}
                    </span>
                    {" – "}
                    <span className="font-semibold text-brand-900">
                      {showingTo.toLocaleString()}
                    </span>
                    {" of "}
                    <span className="font-semibold text-brand-900">
                      {totalEntries.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AuditDetailsModal
        log={selectedLog}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}