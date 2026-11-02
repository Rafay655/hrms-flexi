"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Download,
  ClipboardList,
  Shield,
  Activity,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Loader2,
  Info,
  Lock,
  BarChart3,
  ChevronDown,
  Filter,
  Globe,
  Layers,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  useSecurityExport,
  useActivityExport,
  useBusinessExport,
  useAuditExportStatus,
} from "@/hooks/useAuditTrail";

/* ------------------------------------------------------------------ */
/*  API types                                                           */
/* ------------------------------------------------------------------ */

type DashboardKpis = {
  // Keys mirror AuditTrailController::dashboard() exactly.
  business_events_today: number;
  security_events_today: number;
  activity_actions_today: number;
  high_risk_events_last_7_days: number;
};

type RiskLevel = "critical" | "high" | "medium" | "low";

type TimelineItem = {
  // AT-D1: composite "{stream}-{rawId}" — raw ids collide across the three streams.
  id: string;
  stream: "business" | "security" | "activity";
  event_type: string;
  description: string | null;
  causer_name: string | null;
  causer_id: number | null;
  ip_address: string | null;
  module: string | null;
  risk_level: RiskLevel | null;
  created_at: string;
  subject_type: string | null;
  subject_id: number | null;
  properties: Record<string, unknown>;
};

type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

/* ------------------------------------------------------------------ */
/*  Stream + risk config                                                */
/* ------------------------------------------------------------------ */

type Stream = "all" | "business" | "security" | "activity";

type RiskConfig = { label: string; badgeClass: string; dotClass: string };

const RISK_CONFIG: Record<RiskLevel, RiskConfig> = {
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

const STREAM_DOT: Record<Stream, string> = {
  all:      "bg-brand-500",
  business: "bg-brand-600",
  security: "bg-red-500",
  activity: "bg-emerald-500",
};

const STREAM_ICON: Record<Stream, React.ReactNode> = {
  all:      <Layers className="h-4 w-4" />,
  business: <ClipboardList className="h-4 w-4" />,
  security: <Lock className="h-4 w-4" />,
  activity: <BarChart3 className="h-4 w-4" />,
};

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

function getRowDotClass(item: TimelineItem): string {
  if (item.risk_level && RISK_CONFIG[item.risk_level]) {
    return RISK_CONFIG[item.risk_level].dotClass;
  }
  return STREAM_DOT[item.stream] ?? "bg-gray-400";
}

function getModuleAuditHref(item: TimelineItem): string {
  if (item.stream === "security") return "/audit-trail/security";
  if (item.stream === "activity") return "/audit-trail/activity";
  // business — route to the module-specific audit page
  switch (item.module) {
    case "leave-ease":  return "/leave-ease/audit-logs";
    case "pay-edge":    return "/pay-edge/audit-logs";
    case "time-sync":   return "/time-sync/audit-logs";
    default:            return "#";
  }
}

function getActorLabel(item: TimelineItem): string {
  if (item.causer_name) return item.causer_name;
  if (item.causer_id) return `User #${item.causer_id}`;
  return "System";
}

/* ------------------------------------------------------------------ */
/*  API fetchers                                                        */
/* ------------------------------------------------------------------ */

async function fetchDashboardKpis(): Promise<DashboardKpis> {
  const { data } = await api.get<{ success: boolean; data: DashboardKpis }>(
    "/audit-trail/dashboard"
  );
  return data.data;
}

type TimelineFetchParams = {
  stream?: Stream;
  date_from?: string;
  date_to?: string;
  user_id?: string;
  module?: string;
  page?: number;
};

/*
 * AT-D1: GET /audit-trail (combinedFeed) returns the recent events GROUPED by
 * stream — { security: [...], activity: [...], business: [...] } — each a raw
 * model list with a different shape, unpaginated, and ignoring all filters. The
 * timeline expects ONE flat, sorted, filtered, paginated list, so we normalize +
 * merge + sort + filter + page CLIENT-SIDE here. (Full per-stream history lives
 * on the dedicated /audit-trail/security and /audit-trail/activity pages.)
 */
type CombinedFeedResponse = {
  security?: Array<{
    id: number;
    action: string;
    risk_level: RiskLevel | null;
    user_id: number | null;
    ip_address: string | null;
    created_at: string;
  }>;
  activity?: Array<{
    id: number;
    module: string | null;
    action: string;
    user_id: number | null;
    created_at: string;
  }>;
  business?: Array<{
    id: number;
    description: string | null;
    event: string | null;
    subject_type: string | null;
    subject_id: number | null;
    causer_id: number | null;
    properties: Record<string, unknown> | null;
    created_at: string;
  }>;
};

const PER_PAGE = 25;

function mapCombinedFeed(grouped: CombinedFeedResponse): TimelineItem[] {
  const security = (grouped.security ?? []).map(
    (r): TimelineItem => ({
      id: `security-${r.id}`,
      stream: "security",
      event_type: r.action,
      description: null,
      causer_name: null,
      causer_id: r.user_id ?? null,
      ip_address: r.ip_address ?? null,
      module: "connect-central",
      risk_level: r.risk_level ?? null,
      created_at: r.created_at,
      subject_type: null,
      subject_id: null,
      properties: {},
    })
  );

  const activity = (grouped.activity ?? []).map(
    (r): TimelineItem => ({
      id: `activity-${r.id}`,
      stream: "activity",
      event_type: r.action,
      description: null,
      causer_name: null,
      causer_id: r.user_id ?? null,
      ip_address: null,
      module: r.module ?? null,
      risk_level: null,
      created_at: r.created_at,
      subject_type: null,
      subject_id: null,
      properties: {},
    })
  );

  const business = (grouped.business ?? []).map((r): TimelineItem => {
    const props = r.properties ?? {};
    return {
      id: `business-${r.id}`,
      stream: "business",
      event_type: r.event ?? r.description ?? "updated",
      description: r.description ?? null,
      causer_name: null,
      causer_id: r.causer_id ?? null,
      ip_address: typeof props.ip_address === "string" ? props.ip_address : null,
      module: typeof props.module === "string" ? props.module : null,
      risk_level: null,
      created_at: r.created_at,
      subject_type: r.subject_type ?? null,
      subject_id: r.subject_id ?? null,
      properties: props,
    };
  });

  return [...security, ...activity, ...business];
}

function applyTimelineFilters(
  items: TimelineItem[],
  params: TimelineFetchParams
): TimelineItem[] {
  let out = items;
  if (params.stream && params.stream !== "all") {
    out = out.filter((i) => i.stream === params.stream);
  }
  if (params.module) {
    out = out.filter((i) => i.module === params.module);
  }
  if (params.user_id) {
    const uid = Number(params.user_id);
    if (!Number.isNaN(uid)) out = out.filter((i) => i.causer_id === uid);
  }
  if (params.date_from) {
    const from = new Date(params.date_from).getTime();
    out = out.filter((i) => new Date(i.created_at).getTime() >= from);
  }
  if (params.date_to) {
    const to = new Date(params.date_to).getTime() + 86_400_000; // inclusive end-of-day
    out = out.filter((i) => new Date(i.created_at).getTime() <= to);
  }
  return out;
}

async function fetchTimeline(
  params: TimelineFetchParams
): Promise<{ data: TimelineItem[]; meta: PaginationMeta }> {
  const { data } = await api.get<{ success: boolean; data: CombinedFeedResponse }>(
    "/audit-trail"
  );

  const merged = applyTimelineFilters(
    mapCombinedFeed(data.data ?? {}),
    params
  ).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const total = merged.length;
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));
  const current = Math.min(Math.max(1, params.page ?? 1), lastPage);
  const start = (current - 1) * PER_PAGE;

  return {
    data: merged.slice(start, start + PER_PAGE),
    meta: { current_page: current, last_page: lastPage, per_page: PER_PAGE, total },
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function AuditTrailPage() {
  return <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading audit trail…</div>}><AuditTrailDashboard /></Suspense>;
}
function AuditTrailDashboard() {
  const searchParams = useSearchParams();
  const [stream, setStream] = useState<Stream>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [selectedModule, setSelectedModule] = useState(() => searchParams.get("module") || "");
  const [page, setPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [stream, fromDate, toDate, userIdInput, selectedModule]);

  /* ── KPI cards ─────────────────────────────────────────────────── */
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ["audit-dashboard-kpis"],
    queryFn: fetchDashboardKpis,
    staleTime: 60_000,
  });

  /* ── CSV export (async: trigger → poll → download) ─────────────── */
  const [exportJobUuid, setExportJobUuid] = useState<string | null>(null);
  const securityExport = useSecurityExport();
  const activityExport = useActivityExport();
  const businessExport = useBusinessExport();
  const { data: exportStatus } = useAuditExportStatus(exportJobUuid);

  useEffect(() => {
    if (exportStatus?.status === "complete" && exportStatus.download_url) {
      toast.success("Export ready. Downloading…");
      const a = document.createElement("a");
      a.href = exportStatus.download_url;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setExportJobUuid(null); // stop polling
    } else if (exportStatus?.status === "failed") {
      toast.error(exportStatus.error_message ?? "Export failed.");
      setExportJobUuid(null);
    }
  }, [exportStatus]);

  const onExportSuccess = (uuid: string) => setExportJobUuid(uuid);

  /* ── Unified timeline ──────────────────────────────────────────── */
  const timelineFilters: TimelineFetchParams = {
    stream,
    ...(fromDate ? { date_from: fromDate } : {}),
    ...(toDate ? { date_to: toDate } : {}),
    ...(userIdInput ? { user_id: userIdInput } : {}),
    ...(selectedModule ? { module: selectedModule } : {}),
    page,
  };

  const {
    data: timelineData,
    isLoading: tlLoading,
    isFetching: tlFetching,
  } = useQuery({
    queryKey: ["audit-timeline", timelineFilters],
    queryFn: () => fetchTimeline(timelineFilters),
    placeholderData: (prev) => prev,
  });

  const rows: TimelineItem[] = timelineData?.data ?? [];
  const meta: PaginationMeta = timelineData?.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 0,
  };

  const pageCount = meta.last_page;
  const pageWindow = (() => {
    const half = 2;
    let start = Math.max(1, page - half);
    const end = Math.min(pageCount, start + 4);
    start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  function clearFilters() {
    setStream("all");
    setFromDate("");
    setToDate("");
    setUserIdInput("");
    setSelectedModule("");
    setPage(1);
  }

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Page header ──────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">Audit Trail</h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Unified view of all business, security, and activity audit events across the platform.
                </p>
              </div>
            </div>

            {/* Export dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {showExportMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    {[
                      { label: "Business Events CSV", run: () => businessExport.mutate({}, { onSuccess: onExportSuccess }) },
                      { label: "Security Events CSV", run: () => securityExport.mutate({}, { onSuccess: onExportSuccess }) },
                      { label: "Activity Events CSV", run: () => activityExport.mutate({}, { onSuccess: onExportSuccess }) },
                    ].map(({ label, run }) => (
                      <button
                        key={label}
                        type="button"
                        disabled={!!exportJobUuid}
                        onClick={() => {
                          run();
                          setShowExportMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5 text-brand-700" />
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── KPI cards ──────────────────────────────────────────── */}
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">

            {/* Business Events Today */}
            <Link
              href="/audit-trail/security"
              className="group flex items-start gap-4 rounded-lg border border-gray-200 border-l-4 border-l-brand-700 bg-white p-4 transition hover:bg-brand-100"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-800 text-white">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Business Events
                </div>
                <div className="mt-0.5 text-[11px] text-brand-700">Today</div>
                <div className="mt-2 text-2xl font-bold text-brand-900">
                  {kpiLoading ? (
                    <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-200" />
                  ) : (
                    (kpis?.business_events_today ?? 0).toLocaleString()
                  )}
                </div>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 shrink-0 self-center text-brand-400 opacity-0 transition group-hover:opacity-100" />
            </Link>

            {/* Security Events Today */}
            <Link
              href="/audit-trail/security"
              className="group flex items-start gap-4 rounded-lg border border-gray-200 border-l-4 border-l-red-400 bg-white p-4 transition hover:bg-brand-100"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Security Events
                </div>
                <div className="mt-0.5 text-[11px] text-brand-700">Today</div>
                <div className="mt-2 text-2xl font-bold text-brand-900">
                  {kpiLoading ? (
                    <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-200" />
                  ) : (
                    (kpis?.security_events_today ?? 0).toLocaleString()
                  )}
                </div>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 shrink-0 self-center text-brand-400 opacity-0 transition group-hover:opacity-100" />
            </Link>

            {/* Activity Actions Today */}
            <Link
              href="/audit-trail/activity"
              className="group flex items-start gap-4 rounded-lg border border-gray-200 border-l-4 border-l-emerald-400 bg-white p-4 transition hover:bg-brand-100"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Activity Actions
                </div>
                <div className="mt-0.5 text-[11px] text-brand-700">Today</div>
                <div className="mt-2 text-2xl font-bold text-brand-900">
                  {kpiLoading ? (
                    <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-200" />
                  ) : (
                    (kpis?.activity_actions_today ?? 0).toLocaleString()
                  )}
                </div>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 shrink-0 self-center text-brand-400 opacity-0 transition group-hover:opacity-100" />
            </Link>

            {/* High Risk Events — Last 7 Days */}
            <Link
              href="/time-sync/anomalies-audit"
              className="group flex items-start gap-4 rounded-lg border border-gray-200 border-l-4 border-l-amber-400 bg-white p-4 transition hover:bg-brand-100"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  High Risk Events
                </div>
                <div className="mt-0.5 text-[11px] text-brand-700">Last 7 Days</div>
                <div className="mt-2 text-2xl font-bold text-brand-900">
                  {kpiLoading ? (
                    <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-200" />
                  ) : (
                    (kpis?.high_risk_events_last_7_days ?? 0).toLocaleString()
                  )}
                </div>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 shrink-0 self-center text-brand-400 opacity-0 transition group-hover:opacity-100" />
            </Link>

          </div>
        </div>

        {/* ── Unified timeline ─────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          {/* Timeline header */}
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                  <Activity className="h-4 w-4" />
                  Unified Timeline
                  {tlFetching && !tlLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-700" />
                  )}
                </h2>
                <p className="mt-1 text-sm text-brand-700">
                  {tlLoading ? (
                    "Loading…"
                  ) : (
                    <>
                      Showing{" "}
                      <span className="font-semibold text-brand-900">{rows.length}</span> of{" "}
                      <span className="font-semibold text-brand-900">
                        {meta.total.toLocaleString()}
                      </span>{" "}
                      events
                    </>
                  )}
                </p>
              </div>

              {/* Stream toggle pills */}
              <div className="flex flex-wrap gap-2">
                {(["all", "business", "security", "activity"] as Stream[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStream(s)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium capitalize transition ${
                      stream === s
                        ? "bg-brand-800 text-white"
                        : "border border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
                    }`}
                  >
                    {STREAM_ICON[s]}
                    {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">

              {/* User ID */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="number"
                  min={1}
                  placeholder="User ID"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  className="h-10 w-28 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
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

              {/* Module select */}
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              >
                {MODULE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Clear filters */}
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

          {/* Timeline rows */}
          <div className="divide-y divide-gray-100">
            {tlLoading ? (
              <div className="px-6 py-16 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-300" />
                <div className="mt-3 text-sm text-brand-700">Loading audit events…</div>
              </div>
            ) : rows.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Info className="mx-auto h-8 w-8 text-brand-300" />
                <div className="mt-3 text-sm font-semibold text-brand-900">
                  No audit activity found for the selected period.
                </div>
                <div className="mt-1 text-sm text-brand-700">
                  Try adjusting the stream, date range, or user filter.
                </div>
              </div>
            ) : (
              rows.map((item) => {
                const dotClass = getRowDotClass(item);
                const rowHref = getModuleAuditHref(item);
                const riskCfg = item.risk_level ? RISK_CONFIG[item.risk_level] : null;
                const streamIcon = STREAM_ICON[item.stream] ?? STREAM_ICON.business;

                return (
                  <Link
                    key={item.id}
                    href={rowHref}
                    className="flex items-center gap-4 px-6 py-4 transition hover:bg-brand-100"
                  >
                    {/* Risk / stream dot */}
                    <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} />

                    {/* Stream icon badge */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                      {streamIcon}
                    </div>

                    {/* Event info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-brand-900">
                          {item.event_type}
                        </span>

                        {/* Risk badge */}
                        {riskCfg && (
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${riskCfg.badgeClass}`}
                          >
                            {riskCfg.label}
                          </span>
                        )}

                        {/* Module tag */}
                        {item.module && (
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                            {item.module}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-brand-700">
                        {item.ip_address && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {item.ip_address}
                          </span>
                        )}
                        <span>{getActorLabel(item)}</span>
                        {item.description && (
                          <span className="max-w-xs truncate">{item.description}</span>
                        )}
                      </div>
                    </div>

                    {/* Relative time */}
                    <div className="shrink-0 text-right">
                      <div className="text-xs tabular-nums text-brand-700">
                        {formatRelativeTime(item.created_at)}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-brand-400" />
                  </Link>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {!tlLoading && (
            <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-brand-700">
                Page{" "}
                <span className="font-semibold text-brand-900">{meta.current_page}</span> of{" "}
                <span className="font-semibold text-brand-900">{pageCount}</span>
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
                    disabled={page <= 1 || tlFetching}
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
                    disabled={page >= pageCount || tlFetching}
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
