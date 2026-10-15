"use client";
import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Search,
  Filter,
  AlertCircle,
  Download,
  FileText,
  Info,
  Wallet,
  ShieldCheck,
  Clock3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type ApprovalTab = "Pending My Action" | "All Pending" | "Completed";
type ApprovalType = "Bonus" | "Penalty" | "Reimbursement" | "Correction" | "Arrears";
type ApprovalStatus = "Pending" | "Info Requested" | "Approved" | "Rejected";
type ApprovalQueue = "My Action" | "Other Queue";

interface ApprovalAdjustment {
  id: string;
  date: string;
  empId: string;
  empName: string;
  type: ApprovalType;
  amount: number;
  reason: string;
  requestedBy: string;
  category: string;
  currentSalary: number;
  status: ApprovalStatus;
  queue: ApprovalQueue;
  attachmentName: string;
}

const DEFAULT_PER_PAGE = 10;

const TYPE_OPTIONS: Array<"All" | ApprovalType> = [
  "All",
  "Bonus",
  "Penalty",
  "Reimbursement",
  "Correction",
  "Arrears",
];

const TAB_OPTIONS: ApprovalTab[] = [
  "Pending My Action",
  "All Pending",
  "Completed",
];

const MOCK_APPROVALS: ApprovalAdjustment[] = Array.from({ length: 18 }).map(
  (_, i) => ({
    id: `ADJ-REQ-${100 + i}`,
    date: `2025-01-${String(10 + (i % 8)).padStart(2, "0")}`,
    empId: `EMP-${1001 + i}`,
    empName: [
      "Arsalan Khan",
      "Saira Ahmed",
      "Umar Farooq",
      "Zainab Bibi",
      "Mustafa Kamal",
    ][i % 5],
    type:
      i % 5 === 0
        ? "Bonus"
        : i % 5 === 1
        ? "Penalty"
        : i % 5 === 2
        ? "Reimbursement"
        : i % 5 === 3
        ? "Correction"
        : "Arrears",
    amount: i % 5 === 1 ? -(2500 + i * 350) : 15000 + i * 1200,
    reason:
      i % 2 === 0
        ? "Exceeded annual sales target"
        : "Fuel claim for inter-city travel",
    requestedBy:
      i % 3 === 0
        ? "Ahmed Raza (Manager)"
        : i % 3 === 1
        ? "HR Admin"
        : "Department Head",
    category: i % 2 === 0 ? "Performance" : "Travel",
    currentSalary: 185000 + i * 2500,
    status:
      i < 8
        ? "Pending"
        : i < 10
        ? "Info Requested"
        : i < 15
        ? "Approved"
        : "Rejected",
    queue: i % 3 === 0 ? "Other Queue" : "My Action",
    attachmentName:
      i % 2 === 0 ? "Supporting_Doc.pdf" : "Expense_Claim.pdf",
  })
);

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatPKR = (val: number) => {
  const formatted = Math.abs(val).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `${val < 0 ? "-" : "+"}PKR ${formatted}`;
};

const escapeCsv = (value: string | number) => {
  const stringValue = String(value ?? "");
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const getTypeClasses = (type: ApprovalType) => {
  switch (type) {
    case "Bonus":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Penalty":
      return "bg-red-50 text-red-700 border-red-200";
    case "Reimbursement":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Correction":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "Arrears":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusClasses = (status: ApprovalStatus) => {
  switch (status) {
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Info Requested":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Rejected":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

 const AdjustmentApproval: React.FC = () => {
  const [approvals, setApprovals] =
    useState<ApprovalAdjustment[]>(MOCK_APPROVALS);
  const [activeTab, setActiveTab] =
    useState<ApprovalTab>("Pending My Action");
  const [selectedType, setSelectedType] =
    useState<"All" | ApprovalType>("All");
  const [search, setSearch] = useState("");
  const [selectedAdj, setSelectedAdj] = useState<ApprovalAdjustment | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const filteredApprovals = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return approvals.filter((adj) => {
      const matchesTab =
        activeTab === "Pending My Action"
          ? adj.status === "Pending" && adj.queue === "My Action"
          : activeTab === "All Pending"
          ? adj.status === "Pending" || adj.status === "Info Requested"
          : adj.status === "Approved" || adj.status === "Rejected";

      const matchesType =
        selectedType === "All" || adj.type === selectedType;

      const matchesSearch =
        !needle ||
        [
          adj.id,
          adj.empId,
          adj.empName,
          adj.type,
          adj.reason,
          adj.requestedBy,
          adj.category,
          adj.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      return matchesTab && matchesType && matchesSearch;
    });
  }, [approvals, activeTab, selectedType, search]);

  const totalEntries = filteredApprovals.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const paginatedApprovals = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredApprovals.slice(start, start + perPage);
  }, [filteredApprovals, currentPage, perPage]);

  const selectablePageIds = paginatedApprovals
    .filter((item) => item.status === "Pending")
    .map((item) => item.id);

  const allSelectableChecked =
    selectablePageIds.length > 0 &&
    selectablePageIds.every((id) => selectedIds.has(id));

  const myPendingCount = approvals.filter(
    (a) => a.status === "Pending" && a.queue === "My Action"
  ).length;

  const allPendingCount = approvals.filter(
    (a) => a.status === "Pending" || a.status === "Info Requested"
  ).length;

  const completedCount = approvals.filter(
    (a) => a.status === "Approved" || a.status === "Rejected"
  ).length;

  const pendingImpact = approvals
    .filter((a) => a.status === "Pending")
    .reduce((sum, a) => sum + a.amount, 0);

  const resetPage = () => setPage(1);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectCurrentPage = (checked: boolean) => {
    const next = new Set(selectedIds);

    if (checked) selectablePageIds.forEach((id) => next.add(id));
    else selectablePageIds.forEach((id) => next.delete(id));

    setSelectedIds(next);
  };

  const updateStatusForIds = (ids: string[], status: ApprovalStatus) => {
    setApprovals((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? { ...item, status } : item
      )
    );

    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });

    setSelectedAdj((prev) =>
      prev && ids.includes(prev.id) ? { ...prev, status } : prev
    );
  };

  const handleApprove = (id: string) => updateStatusForIds([id], "Approved");
  const handleReject = (id: string) => updateStatusForIds([id], "Rejected");
  const handleRequestInfo = (id: string) =>
    updateStatusForIds([id], "Info Requested");

  const handleExport = () => {
    const headers = [
      "Sr",
      "Request ID",
      "Date",
      "Employee ID",
      "Employee Name",
      "Type",
      "Amount",
      "Requested By",
      "Category",
      "Reason",
      "Status",
      "Queue",
    ];

    const rows = filteredApprovals.map((item, index) => [
      index + 1,
      item.id,
      item.date,
      item.empId,
      item.empName,
      item.type,
      item.amount,
      item.requestedBy,
      item.category,
      item.reason,
      item.status,
      item.queue,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "adjustment-approvals.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-brand-900">
                  Adjustment Approvals
                </h2>
                <p className="mt-0.5 text-sm text-brand-700">
                  Review and authorize ad-hoc payroll changes
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>

              {selectedIds.size > 0 && (
                <>
                  <button
                    onClick={() =>
                      updateStatusForIds(Array.from(selectedIds), "Approved")
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve {selectedIds.size} Selected
                  </button>

                  <button
                    onClick={() =>
                      updateStatusForIds(Array.from(selectedIds), "Rejected")
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Selected
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Pending My Action
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {myPendingCount}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Clock3 className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                All Pending
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {allPendingCount}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <HelpCircle className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Completed
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {completedCount}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Pending Impact
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {formatPKR(pendingImpact)}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Wallet className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Listing */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Tabs + Filters */}
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {TAB_OPTIONS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedIds(new Set());
                    resetPage();
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab
                      ? "bg-brand-800 text-white"
                      : "border border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  placeholder="Search employee, emp id, request id..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    resetPage();
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white">
                  <Filter className="h-4 w-4 text-brand-700" />
                </div>

                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value as "All" | ApprovalType);
                    resetPage();
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      Type: {type}
                    </option>
                  ))}
                </select>

                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    resetPage();
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm">
              <span className="text-brand-700">Showing </span>
              <span className="font-semibold text-brand-900">{showingFrom}</span>
              <span className="text-brand-700"> to </span>
              <span className="font-semibold text-brand-900">{showingTo}</span>
              <span className="text-brand-700"> of </span>
              <span className="font-semibold text-brand-900">{totalEntries}</span>
              <span className="text-brand-700"> approvals</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {myPendingCount}
                </span>
                My Queue
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {allPendingCount}
                </span>
                Pending
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {completedCount}
                </span>
                Completed
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px]">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    <input
                      type="checkbox"
                      checked={allSelectableChecked}
                      onChange={(e) => toggleSelectCurrentPage(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 accent-brand-800"
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Sr.
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Request ID
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Type
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Requested By
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Reason
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                          <ShieldCheck className="h-5 w-5 text-brand-800" />
                        </div>
                        <p className="text-sm font-semibold text-brand-900">
                          No approval requests found
                        </p>
                        <p className="text-sm text-brand-700">
                          Try changing your tab, type filter, or search.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedApprovals.map((adj, index) => {
                    const rowNumber = (currentPage - 1) * perPage + index + 1;
                    const isSelectable = adj.status === "Pending";

                    return (
                      <tr
                        key={adj.id}
                        className={`transition hover:bg-brand-100/60 ${
                          selectedIds.has(adj.id) ? "bg-brand-100/30" : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            disabled={!isSelectable}
                            checked={selectedIds.has(adj.id)}
                            onChange={() => toggleSelect(adj.id)}
                            className="h-4 w-4 rounded border-gray-300 accent-brand-800 disabled:opacity-40"
                          />
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-brand-900">
                          {rowNumber}
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-mono text-sm font-semibold text-brand-900">
                            {adj.id}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                              {getInitials(adj.empName)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-brand-900">
                                {adj.empName}
                              </p>
                              <p className="mt-0.5 text-xs text-brand-700">
                                {adj.empId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getTypeClasses(
                              adj.type
                            )}`}
                          >
                            {adj.type}
                          </span>
                        </td>

                        <td
                          className={`px-5 py-4 text-right text-sm font-semibold ${
                            adj.amount < 0 ? "text-red-700" : "text-emerald-700"
                          }`}
                        >
                          {formatPKR(adj.amount)}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-brand-900">
                            {adj.requestedBy}
                          </p>
                          <p className="mt-0.5 text-xs text-brand-700">
                            {adj.date}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="max-w-[240px]">
                            <p
                              className="truncate text-sm text-brand-800"
                              title={adj.reason}
                            >
                              {adj.reason}
                            </p>
                            <p className="mt-0.5 text-xs text-brand-700">
                              {adj.category}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              adj.status
                            )}`}
                          >
                            {adj.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedAdj(adj)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-800 transition hover:bg-brand-100"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {adj.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(adj.id)}
                                  className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Approve
                                </button>

                                <button
                                  onClick={() => handleReject(adj.id)}
                                  className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paginatedApprovals.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-brand-700">
                Page <span className="font-semibold text-brand-900">{currentPage}</span> of{" "}
                <span className="font-semibold text-brand-900">{totalPages}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage(1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber = 1;

                  if (totalPages <= 5) pageNumber = i + 1;
                  else if (currentPage <= 3) pageNumber = i + 1;
                  else if (currentPage >= totalPages - 2) pageNumber = totalPages - 4 + i;
                  else pageNumber = currentPage - 2 + i;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${
                        currentPage === pageNumber
                          ? "border-brand-800 bg-brand-800 text-white"
                          : "border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(totalPages)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>

              <div className="text-sm text-brand-700">
                <span className="font-semibold text-brand-900">{showingFrom}</span>
                {" – "}
                <span className="font-semibold text-brand-900">{showingTo}</span>
                {" of "}
                <span className="font-semibold text-brand-900">{totalEntries}</span>
                {" entries"}
              </div>
            </div>
          )}
        </div>

        {/* Info Block */}
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
            <Info className="h-4 w-4 text-brand-800" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-brand-900">
              Approval Control Note
            </h4>
            <p className="mt-1 text-sm leading-6 text-brand-700">
              Approved adjustments move forward for payroll processing. Rejected
              requests close the workflow, while request-info items remain pending
              for clarification and can be re-submitted later.
            </p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAdj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/30 px-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-brand-900">
                  Adjustment Inspection
                </h3>
                <p className="mt-0.5 text-sm text-brand-700">
                  Review financial context and approval impact
                </p>
              </div>

              <button
                onClick={() => setSelectedAdj(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
              <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-800">
                    {getInitials(selectedAdj.empName)}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-brand-900">
                      {selectedAdj.empName}
                    </h4>
                    <p className="mt-0.5 text-sm text-brand-700">
                      {selectedAdj.empId} • Jan 2025 Cycle
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getTypeClasses(
                    selectedAdj.type
                  )}`}
                >
                  {selectedAdj.type} Adjustment
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Financial Context
                  </h5>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">Current Salary</span>
                      <span className="font-semibold text-brand-900">
                        PKR {selectedAdj.currentSalary.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">Proposed Change</span>
                      <span
                        className={`font-semibold ${
                          selectedAdj.amount < 0
                            ? "text-red-700"
                            : "text-emerald-700"
                        }`}
                      >
                        {formatPKR(selectedAdj.amount)}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-brand-800">
                          Estimated New Payout
                        </span>
                        <span className="font-semibold text-brand-900">
                          PKR{" "}
                          {(
                            selectedAdj.currentSalary + selectedAdj.amount
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Justification
                  </h5>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-brand-100/30 p-4">
                    <p className="text-sm italic text-brand-900">
                      “{selectedAdj.reason}”
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
                    <FileText className="h-4 w-4 text-brand-800" />
                    <span className="text-sm font-medium text-brand-900">
                      {selectedAdj.attachmentName}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Requested By
                      </p>
                      <p className="mt-1 text-sm font-semibold text-brand-900">
                        {selectedAdj.requestedBy}
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Category
                      </p>
                      <p className="mt-1 text-sm font-semibold text-brand-900">
                        {selectedAdj.category}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                  <AlertCircle className="h-4 w-4 text-brand-800" />
                </div>
                <p className="text-sm leading-6 text-brand-700">
                  This adjustment may affect the employee’s payroll total and tax
                  calculation for the selected cycle. Final payroll computation
                  should refresh automatically after approval.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 border-t border-gray-200 bg-white px-6 py-4 sm:grid-cols-3">
              <button
                onClick={() => {
                  handleReject(selectedAdj.id);
                  setSelectedAdj(null);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>

              <button
                onClick={() => {
                  handleRequestInfo(selectedAdj.id);
                  setSelectedAdj(null);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <HelpCircle className="h-4 w-4" />
                Request Info
              </button>

              <button
                onClick={() => {
                  handleApprove(selectedAdj.id);
                  setSelectedAdj(null);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default AdjustmentApproval;