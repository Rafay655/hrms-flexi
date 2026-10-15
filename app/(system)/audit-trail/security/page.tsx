"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  Search,
  Download,
  Filter,
  ArrowRight,
  Loader2,
  Info,
  X,
  Globe,
  Monitor,
  AlertTriangle,
  Lock,
  LogIn,
  LogOut,
  ChevronDown,
  Plus,
  Minus,
  KeyRound,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useSecurityExport,
  useAuditExportStatus,
} from "@/hooks/useAuditTrail";

/* ------------------------------------------------------------------ */
/*  API types                                                           */
/* ------------------------------------------------------------------ */

type RiskLevel = "critical" | "high" | "medium" | "low";

type SecurityLog = {
  id: number;
  batch_uuid: string | null;
  action: string;
  description: string | null;
  risk_level: RiskLevel;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  session_uuid: string | null;
  // AT-D5: role_changed / permission_changed carry their diff inline here.
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  user: { id: number; name: string; email: string } | null;
  email_attempted: string | null;
};

type SecuritySummary = {
  failed_logins: number;
  unique_ips: number;
  high_risk_events: number;
  locked_accounts: number;
  sessions_revoked: number;
};

type DiffEntry = {
  field: string;
  old_value: string | null;
  new_value: string | null;
};

type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

/* ------------------------------------------------------------------ */
/*  Config                                                              */
/* ------------------------------------------------------------------ */

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; badgeClass: string; dotClass: string }
> = {
  critical: {
    label: "Critical",
    badgeClass: "bg-red-100 text-red-800",
    dotClass: "bg-red-500",
  },
  high: {
    label: "High",
    badgeClass: "bg-orange-100 text-orange-800",
    dotClass: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    badgeClass: "bg-amber-100 text-amber-800",
    dotClass: "bg-amber-500",
  },
  low: {
    label: "Low",
    badgeClass: "bg-gray-100 text-gray-700",
    dotClass: "bg-gray-400",
  },
};

/** Actions that carry a business-audit diff (role / permission model changes) */
const DIFF_ACTIONS = new Set(["role_changed", "permission_changed"]);

const ACTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "",                   label: "All Actions" },
  { value: "login_failed",       label: "Login Failed" },
  { value: "login_success",      label: "Login Success" },
  { value: "logout",             label: "Logout" },
  { value: "role_changed",       label: "Role Changed" },
  { value: "permission_changed", label: "Permission Changed" },
  { value: "password_changed",   label: "Password Changed" },
  { value: "password_reset",     label: "Password Reset" },
  { value: "2fa_enabled",        label: "2FA Enabled" },
  { value: "2fa_disabled",       label: "2FA Disabled" },
  { value: "2fa_failed",         label: "2FA Failed" },
  { value: "session_revoked",    label: "Session Revoked" },
  { value: "session_expired",    label: "Session Expired" },
  { value: "account_locked",     label: "Account Locked" },
  { value: "account_unlocked",   label: "Account Unlocked" },
  { value: "oauth_login",        label: "OAuth Login" },
  { value: "oauth_failed",       label: "OAuth Failed" },
  { value: "ip_blocked",         label: "IP Blocked" },
];

const SUMMARY_DAYS_OPTIONS = [
  { value: "7",  label: "Last 7 Days" },
  { value: "14", label: "Last 14 Days" },
  { value: "30", label: "Last 30 Days" },
] as const;

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

/** Returns email or email_attempted or metadata.email — never null */
function getUserEmail(log: SecurityLog): string {
  if (log.user?.email) return log.user.email;
  if (log.email_attempted) return log.email_attempted;
  const meta = log.metadata;
  if (typeof meta.email === "string") return meta.email;
  return "—";
}

function getUserName(log: SecurityLog): string {
  if (log.user?.name) return log.user.name;
  return "Unknown User";
}

/** Parse a role value (JSON array or comma-separated string) → string[] */
function parseRoleArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* fall through */
  }
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function humanize(snake: string): string {
  return snake
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ------------------------------------------------------------------ */
/*  API fetchers                                                        */
/* ------------------------------------------------------------------ */

type FetchParams = {
  page?: number;
  action?: string;
  risk_level?: string;
  ip_address?: string;
  // AT-D7: backend security filter honors `search` (LIKE on ip_address + email_attempted),
  // not `user`. The "User / email" box maps here.
  search?: string;
  date_from?: string;
  date_to?: string;
};

async function fetchSecurityLogs(params: FetchParams) {
  const clean: Record<string, string | number> = {};
  (Object.keys(params) as Array<keyof FetchParams>).forEach((k) => {
    const v = params[k];
    if (v !== undefined && v !== null && v !== "") clean[k] = v as string | number;
  });
  const { data } = await api.get<{
    success: boolean;
    data: SecurityLog[];
    message: string;
    meta: PaginationMeta;
  }>("/audit-trail/security", { params: clean });
  return data;
}

async function fetchSummary(days: string): Promise<SecuritySummary> {
  const { data } = await api.get<{
    success: boolean;
    data: Record<string, number>;
  }>("/audit-trail/security/summary", { params: { days } });
  // Backend getSecuritySummary returns *_count / *_today keys (AT-D4) — map them
  // to the SecuritySummary shape the summary cards consume (only high_risk_events
  // already matched, so the other four always rendered 0).
  const d = data.data ?? {};
  return {
    failed_logins: d.failed_logins_count ?? 0,
    unique_ips: d.unique_ips_count ?? 0,
    high_risk_events: d.high_risk_events ?? 0,
    locked_accounts: d.locked_accounts_today ?? 0,
    sessions_revoked: d.sessions_revoked_today ?? 0,
  };
}

// AT-D5: the role/permission diff is read inline from the security row's
// old_value/new_value columns — there is no separate business-diff fetch for
// security events (security_logs carry no batch_uuid).

// requestSecurityExport and pollExportStatus moved to services/audit-trail.service.ts
// and hooks/useAuditTrail.ts — use useSecurityExport() + useAuditExportStatus() instead.

/* ------------------------------------------------------------------ */
/*  Role / Permission Diff Modal                                        */
/* ------------------------------------------------------------------ */

function RoleDiffModal({
  log,
  diff,
  isLoading,
  onClose,
}: {
  log: SecurityLog | null;
  diff: DiffEntry[];
  isLoading: boolean;
  onClose: () => void;
}) {
  if (!log) return null;

  // Try to find a roles / permissions field in the diff
  const rolesEntry = diff.find(
    (d) =>
      d.field.toLowerCase().includes("role") ||
      d.field.toLowerCase().includes("permission")
  );

  const oldRoles = parseRoleArray(rolesEntry?.old_value ?? null);
  const newRoles = parseRoleArray(rolesEntry?.new_value ?? null);
  const added   = newRoles.filter((r) => !oldRoles.includes(r));
  const removed = oldRoles.filter((r) => !newRoles.includes(r));

  const riskCfg = RISK_CONFIG[log.risk_level];

  return (
    <Dialog open={!!log} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border border-gray-200 bg-white p-0 overflow-hidden">

        {/* Header */}
        <div className="bg-brand-900 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
              <KeyRound className="h-4 w-4 opacity-80" />
              {humanize(log.action)}
            </DialogTitle>
          </DialogHeader>
          <p className="text-brand-300 text-xs mt-1">
            {getUserEmail(log)} · {formatDateTime(log.created_at)}
          </p>
        </div>

        {/* Meta strip */}
        <div className="flex flex-wrap items-center gap-4 px-6 py-3 border-b border-gray-200 bg-brand-100">
          <div className="flex items-center gap-2 text-xs text-brand-800">
            <Globe className="h-3.5 w-3.5 text-brand-700" />
            <span className="font-mono">{log.ip_address ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-brand-800">
            <Monitor className="h-3.5 w-3.5 text-brand-700" />
            <span>{log.device_type ?? "Unknown device"}</span>
          </div>
          {riskCfg && (
            <span
              className={`ml-auto text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${riskCfg.badgeClass}`}
            >
              {riskCfg.label}
            </span>
          )}
        </div>

        {/* Diff content */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-brand-700">
              <Loader2 className="h-8 w-8 mb-2 animate-spin opacity-40" />
              <p className="text-sm">Loading role changes…</p>
            </div>
          ) : diff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-brand-700">
              <Info className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No change data recorded for this event.</p>
            </div>
          ) : rolesEntry ? (
            /* ── Specialised role view ── */
            <div className="space-y-4">
              {/* Old roles */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Old Roles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {oldRoles.length > 0 ? (
                    oldRoles.map((r) => (
                      <span
                        key={r}
                        className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                      >
                        {r}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs italic text-brand-700">None</span>
                  )}
                </div>
              </div>

              {/* New roles */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  New Roles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {newRoles.length > 0 ? (
                    newRoles.map((r) => (
                      <span
                        key={r}
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          added.includes(r)
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs italic text-brand-700">None</span>
                  )}
                </div>
              </div>

              {/* Change summary */}
              {(added.length > 0 || removed.length > 0) && (
                <div className="rounded-lg border border-gray-200 bg-brand-100 px-4 py-3 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-800 mb-2">
                    Changed
                  </p>
                  {added.map((r) => (
                    <div key={r} className="flex items-center gap-2 text-xs text-emerald-700">
                      <Plus className="h-3 w-3 shrink-0" />
                      <span className="font-semibold">{r}</span>
                      <span className="text-emerald-600">added</span>
                    </div>
                  ))}
                  {removed.map((r) => (
                    <div key={r} className="flex items-center gap-2 text-xs text-red-700">
                      <Minus className="h-3 w-3 shrink-0" />
                      <span className="font-semibold">{r}</span>
                      <span className="text-red-600">removed</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── Generic field-level diff (permission_changed, etc.) ── */
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 mb-3">
                Field Changes ({diff.length})
              </p>
              {diff.map((entry, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[90px_1fr_16px_1fr] items-center gap-2 rounded-lg border border-gray-200 bg-brand-100 px-3 py-2.5"
                >
                  <span className="text-xs font-semibold text-brand-800 truncate">
                    {entry.field}
                  </span>
                  <span className="font-mono text-xs text-brand-600 line-through truncate bg-white rounded px-2 py-1 border border-gray-200">
                    {entry.old_value ?? "null"}
                  </span>
                  <ArrowRight className="h-3 w-3 text-brand-700 mx-auto" />
                  <span className="font-mono text-xs text-brand-900 font-medium truncate bg-white rounded px-2 py-1 border border-brand-700">
                    {entry.new_value ?? "null"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-4 flex justify-end">
          <Button
            size="sm"
            className="bg-brand-800 text-white hover:bg-brand-900 text-xs"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                      */
/* ------------------------------------------------------------------ */

export default function SecurityAuditLog() {
  /* ── filter state ──────────────────────────────────────────────── */
  const [actionFilter,    setActionFilter]    = useState("");
  const [riskFilter,      setRiskFilter]      = useState<RiskLevel[]>([]);
  const [ipSearch,        setIpSearch]        = useState("");
  const [userSearch,      setUserSearch]      = useState("");
  const [debouncedIp,     setDebouncedIp]     = useState("");
  const [debouncedUser,   setDebouncedUser]   = useState("");
  const [fromDate,        setFromDate]        = useState("");
  const [toDate,          setToDate]          = useState("");
  const [page,            setPage]            = useState(1);

  /* ── summary dropdown state ────────────────────────────────────── */
  const [summaryDays,     setSummaryDays]     = useState<string>("7");
  const [showSummaryMenu, setShowSummaryMenu] = useState(false);

  /* ── export state ──────────────────────────────────────────────── */
  const [exportJobUuid, setExportJobUuid] = useState<string | null>(null);
  const { mutate: startExport, isPending: isExporting } = useSecurityExport();
  const { data: exportStatus } = useAuditExportStatus(exportJobUuid);
  const isExportBusy = isExporting || !!exportJobUuid;

  /* ── diff modal state ──────────────────────────────────────────── */
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);

  /* ── debounce ip + user search ─────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedIp(ipSearch); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [ipSearch]);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedUser(userSearch); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [userSearch]);

  /* ── reset page on filter change ───────────────────────────────── */
  useEffect(() => {
    setPage(1);
  }, [actionFilter, riskFilter, fromDate, toDate]);

  const filters: FetchParams = {
    ...(actionFilter            ? { action: actionFilter }           : {}),
    ...(riskFilter.length > 0  ? { risk_level: riskFilter.join(",") }   : {}),
    ...(debouncedIp             ? { ip_address: debouncedIp }            : {}),
    ...(debouncedUser           ? { search: debouncedUser }              : {}),
    ...(fromDate                ? { date_from: fromDate }                : {}),
    ...(toDate                  ? { date_to: toDate }                    : {}),
    page,
  };

  /* ── Summary cards ─────────────────────────────────────────────── */
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["audit-security-summary", summaryDays],
    queryFn: () => fetchSummary(summaryDays),
    staleTime: 60_000,
  });

  /* ── Main log query ────────────────────────────────────────────── */
  const { data: apiData, isLoading, isFetching } = useQuery({
    queryKey: ["audit-security-logs", filters],
    queryFn: () => fetchSecurityLogs(filters),
    placeholderData: (prev) => prev,
  });

  const rows: SecurityLog[] = apiData?.data ?? [];
  const meta: PaginationMeta = apiData?.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 0,
  };

  /* ── Diff: security role/permission changes carry old/new on the row itself
       (security_logs.old_value / new_value) — derive a single entry, no fetch. */
  const diffEntries: DiffEntry[] =
    selectedLog && DIFF_ACTIONS.has(selectedLog.action)
      ? [{
          field: selectedLog.action === "permission_changed" ? "permission" : "role",
          old_value: selectedLog.old_value,
          new_value: selectedLog.new_value,
        }]
      : [];
  const isDiffLoading = false;

  /* ── Export — TanStack Query polling at 2 s ─────────────────────── */
  useEffect(() => {
    if (exportStatus?.status === "complete" && exportStatus.download_url) {
      toast.success("Export ready. Downloading…");
      const a = document.createElement("a");
      a.href = exportStatus.download_url;
      a.download = `security-audit-${format(new Date(), "yyyy-MM-dd")}.csv`;
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
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.risk_level ? { risk_level: filters.risk_level } : {}),
      ...(filters.ip_address ? { ip_address: filters.ip_address } : {}),
      ...(filters.search     ? { search: filters.search }         : {}),
      ...(filters.date_from  ? { date_from: filters.date_from }   : {}),
      ...(filters.date_to    ? { date_to: filters.date_to }       : {}),
    };
    startExport(exportParams, {
      onSuccess: (uuid) => setExportJobUuid(uuid),
    });
  };

  /* ── Helpers ────────────────────────────────────────────────────── */
  const pageCount = meta.last_page;
  const pageWindow = (() => {
    const half = 2;
    let start = Math.max(1, page - half);
    const end = Math.min(pageCount, start + 4);
    start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  function toggleRisk(level: RiskLevel) {
    setRiskFilter((prev) =>
      prev.includes(level) ? prev.filter((r) => r !== level) : [...prev, level]
    );
  }

  function clearFilters() {
    setActionFilter("");
    setRiskFilter([]);
    setIpSearch("");
    setUserSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  /* ── Tanstack table columns ─────────────────────────────────────── */
  const columns: ColumnDef<SecurityLog>[] = useMemo(
    () => [
      {
        id: "timestamp",
        header: "Time",
        cell: ({ row }) => {
          const riskCfg = RISK_CONFIG[row.original.risk_level];
          return (
            <div className="flex items-center gap-3">
              <div
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  riskCfg?.dotClass ?? "bg-gray-300"
                }`}
              />
              <div>
                <div className="text-xs font-semibold text-brand-900 tabular-nums">
                  {formatRelativeTime(row.original.created_at)}
                </div>
                <div className="mt-0.5 text-[10px] text-brand-700">
                  {formatDateTime(row.original.created_at)}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "user",
        header: "User",
        cell: ({ row }) => (
          <div>
            <div className="max-w-[140px] truncate text-sm font-semibold text-brand-900">
              {getUserName(row.original)}
            </div>
            <div className="mt-0.5 max-w-[140px] truncate font-mono text-[11px] text-brand-700">
              {getUserEmail(row.original)}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => {
          const et = row.original.action;
          const hasDiff = DIFF_ACTIONS.has(et);
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-brand-900">
                {humanize(et)}
              </span>
              {hasDiff && (
                <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-brand-700">
                  DIFF
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "risk_level",
        header: "Risk",
        cell: ({ row }) => {
          const cfg = RISK_CONFIG[row.original.risk_level];
          if (!cfg) return <span className="text-xs text-brand-700">—</span>;
          return (
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${cfg.badgeClass}`}
            >
              {cfg.label}
            </span>
          );
        },
      },
      {
        accessorKey: "ip_address",
        header: "IP Address",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-brand-800">
            {row.original.ip_address ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "device_type",
        header: "Device",
        cell: ({ row }) => (
          <span className="text-xs text-brand-700">
            {row.original.device_type ?? "—"}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Page header ────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Security Audit Log
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Full history of logins, role changes, session activity, and
                  threat indicators across the platform.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Export CSV with poll */}
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

              {/* Summary period dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSummaryMenu((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  Summary
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {showSummaryMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSummaryMenu(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                      {SUMMARY_DAYS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSummaryDays(opt.value);
                            setShowSummaryMenu(false);
                          }}
                          className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition hover:bg-brand-100 ${
                            summaryDays === opt.value
                              ? "font-semibold text-brand-900"
                              : "text-brand-800"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Summary cards ──────────────────────────────────────── */}
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 xl:grid-cols-5">
            {(
              [
                {
                  key: "failed_logins",
                  label: "Failed Logins",
                  icon: <LogIn className="h-4 w-4" />,
                  iconBg: "bg-red-600",
                },
                {
                  key: "unique_ips",
                  label: "Unique IPs",
                  icon: <Globe className="h-4 w-4" />,
                  iconBg: "bg-blue-600",
                },
                {
                  key: "high_risk_events",
                  label: "High Risk Events",
                  icon: <AlertTriangle className="h-4 w-4" />,
                  iconBg: "bg-orange-600",
                },
                {
                  key: "locked_accounts",
                  label: "Locked Accounts",
                  icon: <Lock className="h-4 w-4" />,
                  iconBg: "bg-amber-600",
                },
                {
                  key: "sessions_revoked",
                  label: "Sessions Revoked",
                  icon: <LogOut className="h-4 w-4" />,
                  iconBg: "bg-brand-800",
                },
              ] as Array<{
                key: keyof SecuritySummary;
                label: string;
                icon: React.ReactNode;
                iconBg: string;
              }>
            ).map(({ key, label, icon, iconBg }) => (
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
                  <div className="mt-1 text-xl font-bold text-brand-900">
                    {summaryLoading ? (
                      <span className="inline-block h-5 w-10 animate-pulse rounded bg-gray-200" />
                    ) : (
                      (summary?.[key] ?? 0).toLocaleString()
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-4 space-y-3">
            {/* Row 1: action, ip, user, dates, clear */}
            <div className="flex flex-wrap items-center gap-3">
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

              {/* IP search */}
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  placeholder="IP Address"
                  value={ipSearch}
                  onChange={(e) => setIpSearch(e.target.value)}
                  className="h-10 w-36 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                />
              </div>

              {/* User / email search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  placeholder="User / email"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="h-10 w-40 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
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

              {/* Clear all */}
              <button
                type="button"
                title="Clear all filters"
                onClick={clearFilters}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-brand-800 transition hover:bg-brand-100"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>

            {/* Row 2: risk level multi-toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="self-center text-xs font-semibold uppercase tracking-wider text-brand-700">
                Risk:
              </span>
              {(["critical", "high", "medium", "low"] as RiskLevel[]).map(
                (level) => {
                  const cfg = RISK_CONFIG[level];
                  const active = riskFilter.includes(level);
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleRisk(level)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? cfg.badgeClass +
                            " ring-1 ring-inset ring-current"
                          : "border border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          active ? cfg.dotClass : "bg-gray-300"
                        }`}
                      />
                      {cfg.label}
                      {active && <X className="h-3 w-3" />}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Table header */}
          <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                <Shield className="h-4 w-4" />
                Security Events
                {isFetching && !isLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-700" />
                )}
              </h3>
              <p className="mt-1 text-sm text-brand-700">
                {isLoading ? (
                  "Loading…"
                ) : (
                  <>
                    <span className="font-semibold text-brand-900">
                      {rows.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-brand-900">
                      {meta.total.toLocaleString()}
                    </span>{" "}
                    events · rows with{" "}
                    <span className="rounded bg-brand-100 px-1 text-[9px] font-bold uppercase text-brand-700">
                      DIFF
                    </span>{" "}
                    are clickable for role change detail
                  </>
                )}
              </p>
            </div>

            {riskFilter.length > 0 && (
              <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                {riskFilter.length} risk filter
                {riskFilter.length > 1 ? "s" : ""} active
              </span>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800 whitespace-nowrap"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody className="divide-y divide-brand-300/40 bg-white">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-5 py-16 text-center"
                    >
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-300" />
                      <div className="mt-3 text-sm text-brand-700">
                        Loading security events…
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-5 py-16 text-center"
                    >
                      <Info className="mx-auto h-8 w-8 text-brand-300" />
                      <div className="mt-3 text-sm font-semibold text-brand-900">
                        No security events found for the selected period.
                      </div>
                      <div className="mt-1 text-sm text-brand-700">
                        Try adjusting your filters or date range.
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const isDiffRow = DIFF_ACTIONS.has(
                      row.original.action
                    );
                    return (
                      <tr
                        key={row.id}
                        onClick={() =>
                          isDiffRow ? setSelectedLog(row.original) : undefined
                        }
                        className={`transition-colors hover:bg-brand-100 ${
                          isDiffRow
                            ? "cursor-pointer"
                            : "cursor-default"
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-5 py-4">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
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
                total events
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

      {/* ── Role/Permission Diff Modal ──────────────────────────────── */}
      <RoleDiffModal
        log={selectedLog}
        diff={diffEntries}
        isLoading={isDiffLoading}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
