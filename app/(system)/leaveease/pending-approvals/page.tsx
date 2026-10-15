"use client";

import React, { Fragment, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  Timer,
  FileText,
  LayoutGrid,
  Table as TableIcon,
  Search,
  MoreVertical,
  ChevronRight,
  AlertTriangle,
  History,
  Check,
  Zap,
  Users,
  RefreshCw,
  Eye,
  ChevronsLeft,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ChevronsRight,
} from "lucide-react";
import { EmployeeLink } from "@/components/shared/EmployeeLink";

type RequestType = "REGULARIZATION" | "OT" | "SWAP";
type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

interface ApprovalRequest {
  id: string;
  type: RequestType;
  employee: string;
  avatar: string;
  date: string;
  details: string;
  secondaryDetails?: string;
  reason: string;
  slaHours: number;
  status: RequestStatus;
}

const DEFAULT_PER_PAGE = 6;

const INITIAL_REQUESTS: ApprovalRequest[] = [
  {
    id: "REQ-101",
    type: "REGULARIZATION",
    employee: "Ahmed Khan",
    avatar: "AK",
    date: "2026-01-08",
    details: "Missing Out Punch",
    secondaryDetails: "Proposed: 6:30 PM",
    reason: "Internet outage at home during remote shift exit.",
    slaHours: 4,
    status: "PENDING",
  },
  {
    id: "REQ-102",
    type: "OT",
    employee: "Sara Ahmed",
    avatar: "SA",
    date: "2026-01-09",
    details: "2.5 OT Hours",
    reason: "Critical project deadline for Q1 release.",
    slaHours: 18,
    status: "PENDING",
  },
  {
    id: "REQ-103",
    type: "SWAP",
    employee: "Ali ↔ Fatima",
    avatar: "SW",
    date: "2026-01-15",
    details: "Morning ↔ Evening",
    reason: "Medical appointment for parent.",
    slaHours: 48,
    status: "PENDING",
  },
  {
    id: "REQ-104",
    type: "REGULARIZATION",
    employee: "Junaid Waqar",
    avatar: "JW",
    date: "2026-01-07",
    details: "Forgotten In-Punch",
    secondaryDetails: "Proposed: 9:00 AM",
    reason: "Badge reader was malfunctioning.",
    slaHours: 2,
    status: "PENDING",
  },
  {
    id: "REQ-105",
    type: "OT",
    employee: "Muhammad Lodhi",
    avatar: "ML",
    date: "2026-01-10",
    details: "4.0 OT Hours",
    reason: "Server maintenance window overflow.",
    slaHours: 24,
    status: "PENDING",
  },
  {
    id: "REQ-106",
    type: "SWAP",
    employee: "Elena ↔ Priya",
    avatar: "SW",
    date: "2026-01-12",
    details: "General ↔ Night",
    reason: "Family event attendance.",
    slaHours: 36,
    status: "PENDING",
  },
  {
    id: "REQ-107",
    type: "OT",
    employee: "Usman Tariq",
    avatar: "UT",
    date: "2026-01-16",
    details: "3.0 OT Hours",
    reason: "Production issue resolution after hours.",
    slaHours: 6,
    status: "PENDING",
  },
  {
    id: "REQ-108",
    type: "REGULARIZATION",
    employee: "Ayesha Noor",
    avatar: "AN",
    date: "2026-01-16",
    details: "Late Arrival Adjustment",
    secondaryDetails: "Requested In: 9:25 AM",
    reason: "Transport issue due to road blockage.",
    slaHours: 30,
    status: "PENDING",
  },
];

function formatDisplayDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTypeLabel(type: RequestType) {
  switch (type) {
    case "REGULARIZATION":
      return "Regularization";
    case "OT":
      return "Overtime";
    case "SWAP":
      return "Shift Swap";
    default:
      return type;
  }
}

function getTypeIcon(type: RequestType) {
  switch (type) {
    case "REGULARIZATION":
      return <History className="h-4 w-4 text-brand-800" />;
    case "OT":
      return <Clock className="h-4 w-4 text-brand-800" />;
    case "SWAP":
      return <ArrowRightLeft className="h-4 w-4 text-brand-800" />;
    default:
      return <FileText className="h-4 w-4 text-brand-800" />;
  }
}

function getSlaTone(hours: number) {
  if (hours < 6) {
    return {
      wrap: "border-red-200 bg-red-50 text-red-700",
      dot: "bg-red-500",
      text: "Critical",
    };
  }

  if (hours < 24) {
    return {
      wrap: "border-amber-200 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
      text: "Attention",
    };
  }

  return {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    text: "Healthy",
  };
}

function getStatusBadge(status: RequestStatus) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Approved
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800">
      <Timer className="h-3.5 w-3.5" />
      Pending
    </span>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = "default",
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  tone?: "default" | "danger" | "success";
}) {
  const toneMap = {
    default: {
      card: "bg-white border-gray-200",
      iconWrap: "bg-brand-800 text-white",
      title: "text-brand-700",
      value: "text-brand-900",
    },
    danger: {
      card: "bg-white border-gray-200",
      iconWrap: "bg-red-600 text-white",
      title: "text-brand-700",
      value: "text-red-600",
    },
    success: {
      card: "bg-white border-gray-200",
      iconWrap: "bg-emerald-600 text-white",
      title: "text-brand-700",
      value: "text-emerald-700",
    },
  } as const;

  const style = toneMap[tone];

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${style.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${style.title}`}>
            {title}
          </p>
          <p className={`mt-2 text-2xl font-bold ${style.value}`}>{value}</p>
          <p className="mt-1 text-sm text-brand-700">{subtitle}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.iconWrap}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function ManagerPendingApprovals() {
  const [viewMode, setViewMode] = useState<"Cards" | "Table">("Cards");
  const [typeFilter, setTypeFilter] = useState<"All" | RequestType>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | RequestStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<ApprovalRequest[]>(INITIAL_REQUESTS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return requests.filter((req) => {
      const matchesType = typeFilter === "All" || req.type === typeFilter;
      const matchesStatus = statusFilter === "All" || req.status === statusFilter;
      const matchesSearch =
        !keyword ||
        req.id.toLowerCase().includes(keyword) ||
        req.employee.toLowerCase().includes(keyword) ||
        req.details.toLowerCase().includes(keyword) ||
        req.reason.toLowerCase().includes(keyword) ||
        getTypeLabel(req.type).toLowerCase().includes(keyword);

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter, typeFilter]);

  const pendingRequests = useMemo(
    () => requests.filter((req) => req.status === "PENDING"),
    [requests]
  );

  const stats = useMemo(() => {
    const pending = requests.filter((req) => req.status === "PENDING").length;
    const overdue = requests.filter((req) => req.status === "PENDING" && req.slaHours < 6).length;
    const approvedToday = requests.filter((req) => req.status === "APPROVED").length;

    return {
      pending,
      overdue,
      approvedToday,
    };
  }, [requests]);

  const totalEntries = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + perPage);
  const showingFrom = totalEntries > 0 ? startIndex + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(startIndex + perPage, totalEntries) : 0;

  const allPageSelected =
    paginatedRequests.length > 0 &&
    paginatedRequests.every((req) => req.status === "PENDING" && selectedIds.includes(req.id));

  const toggleSelectAllPage = () => {
    const selectablePageIds = paginatedRequests
      .filter((req) => req.status === "PENDING")
      .map((req) => req.id);

    if (selectablePageIds.length === 0) return;

    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !selectablePageIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...selectablePageIds])));
  };

  const toggleRowSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAction = (id: string, action: "APPROVE" | "REJECT") => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id
          ? { ...req, status: action === "APPROVE" ? "APPROVED" : "REJECTED" }
          : req
      )
    );
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;

    setRequests((prev) =>
      prev.map((req) =>
        selectedIds.includes(req.id) ? { ...req, status: "APPROVED" } : req
      )
    );
    setSelectedIds([]);
  };

  const handleReset = () => {
    setViewMode("Cards");
    setTypeFilter("All");
    setStatusFilter("PENDING");
    setSearch("");
    setSelectedIds([]);
    setExpandedId(null);
    setPage(1);
    setPerPage(DEFAULT_PER_PAGE);
  };

  React.useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter, perPage]);

  React.useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => requests.some((req) => req.id === id && req.status === "PENDING"))
    );
  }, [requests]);

  React.useEffect(() => {
    if (expandedId && !filteredRequests.some((req) => req.id === expandedId)) {
      setExpandedId(null);
    }
  }, [expandedId, filteredRequests]);

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Pending Approvals</h1>
            <p className="mt-1 text-sm text-brand-700">
              Review and act on attendance-related requests across your team.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
              {(["Cards", "Table"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                    viewMode === mode
                      ? "bg-brand-800 text-white"
                      : "text-brand-700 hover:bg-brand-100"
                  }`}
                >
                  {mode === "Cards" ? (
                    <LayoutGrid className="h-4 w-4" />
                  ) : (
                    <TableIcon className="h-4 w-4" />
                  )}
                  {mode}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>

            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={selectedIds.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Bulk Approve
              {selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Pending"
            value={stats.pending}
            subtitle="Requests awaiting manager action"
            icon={<FileText className="h-5 w-5" />}
          />
          <StatCard
            title="Critical SLA"
            value={stats.overdue}
            subtitle="Pending requests below 6 hours"
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="danger"
          />
          <StatCard
            title="Approved"
            value={stats.approvedToday}
            subtitle="Approved in current session"
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="success"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by request ID, employee, summary, reason..."
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition placeholder:text-brand-400 focus:border-brand-800"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as "All" | RequestType)}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                >
                  <option value="All">All Types</option>
                  <option value="REGULARIZATION">Regularization</option>
                  <option value="OT">Overtime</option>
                  <option value="SWAP">Shift Swap</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "All" | RequestStatus)}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                >
                  <option value="All">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                <select
                  value={String(perPage)}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                >
                  {[6, 12, 24, 48].map((size) => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-brand-700">
                Showing <span className="font-semibold text-brand-900">{showingFrom}</span> to{" "}
                <span className="font-semibold text-brand-900">{showingTo}</span> of{" "}
                <span className="font-semibold text-brand-900">{totalEntries}</span> entries
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-700">
                <span>
                  <span className="font-semibold text-brand-900">{pendingRequests.length}</span> Pending
                </span>
                <span className="h-3 w-px bg-brand-200" />
                <span>
                  <span className="font-semibold text-brand-900">{stats.overdue}</span> Critical SLA
                </span>
                <span className="h-3 w-px bg-brand-200" />
                <span>
                  <span className="font-semibold text-brand-900">{selectedIds.length}</span> Selected
                </span>
              </div>
            </div>
          </div>

          {viewMode === "Cards" ? (
            <div className="p-4">
              {paginatedRequests.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-brand-900">No approval requests found</h3>
                  <p className="mt-1 text-sm text-brand-700">
                    Try changing the filters or search keywords.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedRequests.map((req) => {
                    const slaTone = getSlaTone(req.slaHours);
                    const isExpanded = expandedId === req.id;
                    const isSelected = selectedIds.includes(req.id);

                    return (
                      <div
                        key={req.id}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
                              {getTypeIcon(req.type)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                                {getTypeLabel(req.type)}
                              </p>
                              <p className="text-[11px] text-brand-700">{req.id}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {req.status === "PENDING" ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleRowSelection(req.id)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800"
                              />
                            ) : null}
                            <button
                              type="button"
                              className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4 p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-sm font-bold text-white">
                              {req.avatar}
                            </div>
                            <div>
                              {req.employee.includes("↔") ? (
                                <h3 className="text-sm font-semibold text-brand-900">{req.employee}</h3>
                              ) : (
                                <EmployeeLink
                                  employeeId={req.id}
                                  employeeName={req.employee}
                                  className="text-sm font-semibold text-brand-900"
                                />
                              )}
                              <p className="mt-0.5 text-[11px] text-brand-700">{formatDisplayDate(req.date)}</p>
                            </div>
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                              <Zap className="h-4 w-4 text-brand-700" />
                              {req.details}
                            </p>
                            {req.secondaryDetails ? (
                              <p className="mt-1 text-[11px] font-medium text-brand-700">{req.secondaryDetails}</p>
                            ) : null}
                            <p className="mt-2 text-sm leading-6 text-brand-700">{req.reason}</p>
                          </div>

                          <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${slaTone.wrap}`}>
                            <div className="flex items-center gap-2">
                              <Timer className="h-4 w-4" />
                              <span className="text-xs font-semibold uppercase tracking-wider">
                                SLA {req.slaHours}h
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold">{slaTone.text}</span>
                              <span className={`h-2 w-2 rounded-full ${slaTone.dot}`} />
                            </div>
                          </div>

                          <div>{getStatusBadge(req.status)}</div>

                          {isExpanded ? (
                            <div className="rounded-xl border border-gray-200 bg-brand-50/40 p-4">
                              <div className="grid gap-3 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-brand-700">Request Type</span>
                                  <span className="font-semibold text-brand-900">{getTypeLabel(req.type)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-brand-700">Summary</span>
                                  <span className="font-semibold text-brand-900">{req.details}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-brand-700">Date</span>
                                  <span className="font-semibold text-brand-900">{formatDisplayDate(req.date)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-brand-700">Remaining SLA</span>
                                  <span className="font-semibold text-brand-900">{req.slaHours} hours</span>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2 border-t border-gray-200 bg-white px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : req.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                          >
                            <Eye className="h-4 w-4" />
                            {isExpanded ? "Hide" : "View"}
                          </button>

                          {req.status === "PENDING" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAction(req.id, "APPROVE")}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAction(req.id, "REJECT")}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </button>
                            </>
                          ) : (
                            <div className="flex-1">{getStatusBadge(req.status)}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px]">
                <thead className="border-b border-gray-200 bg-white">
                  <tr>
                    <th className="px-5 py-3 text-left">
                      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-brand-800">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectAllPage}
                          className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800"
                        />
                        <span>Select</span>
                      </div>
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Request Type
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Employee
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Date
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Summary
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                      SLA Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="mx-auto flex max-w-md flex-col items-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <h3 className="mt-4 text-sm font-semibold text-brand-900">
                            No approval requests found
                          </h3>
                          <p className="mt-1 text-sm text-brand-700">
                            Try changing the filters or search keywords.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((req) => {
                      const isExpanded = expandedId === req.id;
                      const isSelected = selectedIds.includes(req.id);
                      const slaTone = getSlaTone(req.slaHours);

                      return (
                        <Fragment key={req.id}>
                          <tr className={`transition hover:bg-brand-100 ${isExpanded ? "bg-brand-50" : ""}`}>
                            <td className="px-5 py-4">
                              {req.status === "PENDING" ? (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleRowSelection(req.id)}
                                  className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800"
                                />
                              ) : null}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
                                  {getTypeIcon(req.type)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-brand-900">{getTypeLabel(req.type)}</p>
                                  <p className="text-[11px] text-brand-700">{req.id}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-[11px] font-bold text-white">
                                  {req.avatar}
                                </div>
                                <span className="text-sm font-semibold text-brand-900">{req.employee}</span>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-sm text-brand-700">
                              {formatDisplayDate(req.date)}
                            </td>

                            <td className="px-5 py-4">
                              <div className="max-w-[280px]">
                                <p className="truncate text-sm font-semibold text-brand-900">{req.details}</p>
                                <p className="mt-0.5 truncate text-[11px] text-brand-700">{req.reason}</p>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-center">
                              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${slaTone.wrap}`}>
                                <span className={`h-2 w-2 rounded-full ${slaTone.dot}`} />
                                <span className="text-[11px] font-semibold uppercase tracking-wider">
                                  {req.slaHours}h left
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4">{getStatusBadge(req.status)}</td>

                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>

                                {req.status === "PENDING" ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleAction(req.id, "APPROVE")}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-600 hover:text-white"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAction(req.id, "REJECT")}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </td>
                          </tr>

                          {isExpanded ? (
                            <tr className="bg-brand-50/40">
                              <td colSpan={8} className="px-5 py-5">
                                <div className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
                                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                                      Request Details
                                    </h4>
                                    <div className="mt-4 space-y-3">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-brand-700">Employee</span>
                                        <span className="font-semibold text-brand-900">{req.employee}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-brand-700">Request Type</span>
                                        <span className="font-semibold text-brand-900">{getTypeLabel(req.type)}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-brand-700">Date</span>
                                        <span className="font-semibold text-brand-900">{formatDisplayDate(req.date)}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-brand-700">Summary</span>
                                        <span className="font-semibold text-brand-900">{req.details}</span>
                                      </div>
                                      {req.secondaryDetails ? (
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="text-brand-700">Additional</span>
                                          <span className="font-semibold text-brand-900">{req.secondaryDetails}</span>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                                      Manager Notes
                                    </h4>
                                    <p className="mt-4 text-sm leading-6 text-brand-700">{req.reason}</p>

                                    <div className={`mt-4 rounded-lg border px-3 py-2 ${slaTone.wrap}`}>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold">Remaining SLA</span>
                                        <span className="text-sm font-semibold">{req.slaHours} hours</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalEntries > 0 ? (
            <div className="border-t border-gray-200 px-5 py-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-brand-700">
                  Page <span className="font-semibold text-brand-900">{currentPage}</span> of{" "}
                  <span className="font-semibold text-brand-900">{totalPages}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage(1)}
                    disabled={currentPage === 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    let pageNumber: number;

                    if (totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${
                          currentPage === pageNumber
                            ? "border-brand-800 bg-brand-800 text-white"
                            : "border-gray-200 text-brand-800 hover:bg-brand-100"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-sm text-brand-700">
                  <span className="font-semibold text-brand-900">{showingFrom}</span> –{" "}
                  <span className="font-semibold text-brand-900">{showingTo}</span> of{" "}
                  <span className="font-semibold text-brand-900">{totalEntries}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}