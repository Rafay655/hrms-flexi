"use client";
import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  Check,
  Info,
  Database,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Clock3,
  BadgeCheck,
  FileWarning,
} from "lucide-react";
import { AdjustmentForm } from "@/components/AdjustmentForm";
import { BulkAdjustmentUpload } from "@/components/BulkAdjustmentUpload";

type AdjustmentType =
  | "Bonus"
  | "Penalty"
  | "Reimbursement"
  | "Correction"
  | "Arrears";

type AdjustmentStatus = "Pending" | "Approved" | "Rejected" | "Processed";

interface AdjustmentRecord {
  id: string;
  empId: string;
  empName: string;
  type: AdjustmentType;
  amount: number;
  period: string;
  reason: string;
  status: AdjustmentStatus;
  requestedBy: string;
}

const DEFAULT_PER_PAGE = 10;

const TAB_OPTIONS: Array<"All" | AdjustmentStatus> = [
  "Pending",
  "Approved",
  "Rejected",
  "Processed",
  "All",
];

const TYPE_OPTIONS: Array<"All" | AdjustmentType> = [
  "All",
  "Bonus",
  "Penalty",
  "Reimbursement",
  "Correction",
  "Arrears",
];

const MOCK_ADJUSTMENTS: AdjustmentRecord[] = Array.from({ length: 30 }).map(
  (_, i) => {
    const types: AdjustmentType[] = [
      "Bonus",
      "Penalty",
      "Reimbursement",
      "Correction",
      "Arrears",
    ];

    const type = types[i % 5];
    const amount =
      type === "Penalty" ? -1 * (2000 + i * 500) : 5000 + i * 1000;

    return {
      id: `ADJ-2025-${99 - i}`,
      empId: `EMP-${1001 + i}`,
      empName: [
        "Arsalan Khan",
        "Saira Ahmed",
        "Umar Farooq",
        "Zainab Bibi",
        "Mustafa Kamal",
      ][i % 5],
      type,
      amount,
      period: "Jan 2025",
      reason:
        i % 3 === 0
          ? "Performance Achievement"
          : i % 3 === 1
          ? "Tax Correction"
          : "Fuel Reimbursement",
      status:
        i < 5
          ? "Pending"
          : i < 15
          ? "Approved"
          : i < 20
          ? "Rejected"
          : "Processed",
      requestedBy: "HR Admin",
    };
  }
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return val < 0 ? `-PKR ${formatted}` : `+PKR ${formatted}`;
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

const getTypeClasses = (type: AdjustmentType) => {
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

const getStatusClasses = (status: AdjustmentStatus) => {
  switch (status) {
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "Processed":
      return "bg-brand-100 text-brand-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

 const AdjustmentsList: React.FC = () => {
  const [adjustments, setAdjustments] =
    useState<AdjustmentRecord[]>(MOCK_ADJUSTMENTS);
  const [activeTab, setActiveTab] =
    useState<"All" | AdjustmentStatus>("Pending");
  const [selectedType, setSelectedType] =
    useState<"All" | AdjustmentType>("All");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const filteredAdjustments = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return adjustments.filter((adj) => {
      const matchesTab = activeTab === "All" || adj.status === activeTab;
      const matchesType = selectedType === "All" || adj.type === selectedType;
      const matchesSearch =
        !needle ||
        [
          adj.id,
          adj.empId,
          adj.empName,
          adj.type,
          adj.reason,
          adj.requestedBy,
          adj.status,
          adj.period,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      return matchesTab && matchesType && matchesSearch;
    });
  }, [adjustments, activeTab, selectedType, search]);

  const totalEntries = filteredAdjustments.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const paginatedAdjustments = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAdjustments.slice(start, start + perPage);
  }, [filteredAdjustments, currentPage, perPage]);

  const currentPageIds = paginatedAdjustments.map((item) => item.id);
  const allCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.has(id));

  const pendingCount = adjustments.filter((a) => a.status === "Pending").length;
  const approvedCount = adjustments.filter(
    (a) => a.status === "Approved"
  ).length;
  const processedCount = adjustments.filter(
    (a) => a.status === "Processed"
  ).length;
  const totalPositive = adjustments
    .filter((a) => a.amount > 0)
    .reduce((sum, a) => sum + a.amount, 0);
  const totalNegative = adjustments
    .filter((a) => a.amount < 0)
    .reduce((sum, a) => sum + Math.abs(a.amount), 0);

  const resetPage = () => setPage(1);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectCurrentPage = (checked: boolean) => {
    const next = new Set(selectedIds);

    if (checked) {
      currentPageIds.forEach((id) => next.add(id));
    } else {
      currentPageIds.forEach((id) => next.delete(id));
    }

    setSelectedIds(next);
  };

  const updateStatusForIds = (ids: string[], status: AdjustmentStatus) => {
    setAdjustments((prev) =>
      prev.map((adj) => (ids.includes(adj.id) ? { ...adj, status } : adj))
    );
  };

  const deleteByIds = (ids: string[]) => {
    setAdjustments((prev) => prev.filter((adj) => !ids.includes(adj.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleExport = () => {
    const headers = [
      "Sr",
      "Adjustment ID",
      "Employee ID",
      "Employee Name",
      "Type",
      "Amount",
      "Period",
      "Reason",
      "Status",
      "Requested By",
    ];

    const rows = filteredAdjustments.map((adj, index) => [
      index + 1,
      adj.id,
      adj.empId,
      adj.empName,
      adj.type,
      adj.amount,
      adj.period,
      adj.reason,
      adj.status,
      adj.requestedBy,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "payroll-adjustments.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAdjustment = (data: any) => {
    const nextId = `ADJ-2025-${String(200 + adjustments.length).padStart(
      3,
      "0"
    )}`;

    const amount = Number(data?.amount ?? 0);
    const type = (data?.type || "Bonus") as AdjustmentType;

    const newAdjustment: AdjustmentRecord = {
      id: nextId,
      empId: (data?.empId || `EMP-${2000 + adjustments.length + 1}`)
        .toString()
        .trim(),
      empName: (data?.empName || "New Employee").toString().trim(),
      type,
      amount: type === "Penalty" && amount > 0 ? -amount : amount,
      period: (data?.period || "Jan 2025").toString().trim(),
      reason: (data?.reason || "Manual payroll adjustment").toString().trim(),
      status: (data?.status || "Pending") as AdjustmentStatus,
      requestedBy: (data?.requestedBy || "HR Admin").toString().trim(),
    };

    setAdjustments((prev) => [newAdjustment, ...prev]);
    setIsFormOpen(false);
    setPage(1);
  };

  if (isBulkOpen) {
    return (
      <BulkAdjustmentUpload
        onComplete={() => setIsBulkOpen(false)}
        onCancel={() => setIsBulkOpen(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <Wallet className="h-5 w-5 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-brand-900">
                  Payroll Adjustments
                </h2>
                <p className="mt-0.5 text-sm text-brand-700">
                  Ad-hoc earnings, deductions, corrections, and period-based
                  payroll updates
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsBulkOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <Database className="h-4 w-4" />
                Bulk Upload
              </button>

              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <Plus className="h-4 w-4" />
                New Adjustment
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Pending
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">{pendingCount}</p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Clock3 className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Approved
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {approvedCount}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <BadgeCheck className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Earnings Impact
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  +PKR {totalPositive.toLocaleString()}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Deductions Impact
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  -PKR {totalNegative.toLocaleString()}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <FileWarning className="h-4 w-4 text-brand-800" />
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
                    resetPage();
                    setSelectedIds(new Set());
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
                  placeholder="Search employee, emp id, adjustment id..."
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
                    setSelectedType(e.target.value as "All" | AdjustmentType);
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

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex flex-col gap-3 border-b border-gray-200 bg-brand-800 px-6 py-3 text-white md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-semibold">
                  {selectedIds.size} selected
                </span>

                <button
                  onClick={() =>
                    updateStatusForIds(Array.from(selectedIds), "Approved")
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/15"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve Selected
                </button>

                <button
                  onClick={() =>
                    updateStatusForIds(Array.from(selectedIds), "Rejected")
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/15"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject Selected
                </button>

                <button
                  onClick={() => deleteByIds(Array.from(selectedIds))}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/15"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Selected
                </button>
              </div>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm font-medium text-white/80 transition hover:text-white"
              >
                Clear Selection
              </button>
            </div>
          )}

          {/* Stats Bar */}
          <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
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
              <span className="text-brand-700"> adjustments</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {pendingCount}
                </span>
                Pending
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {approvedCount}
                </span>
                Approved
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {processedCount}
                </span>
                Processed
              </div>
            </div>
          </div>

          {/* Export Row */}
          <div className="flex justify-end border-b border-gray-200 px-6 py-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1220px]">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    <input
                      type="checkbox"
                      checked={allCurrentPageSelected}
                      onChange={(e) => toggleSelectCurrentPage(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 accent-brand-800"
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Sr.
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Adjustment ID
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
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Period
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
                {paginatedAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                          <Wallet className="h-5 w-5 text-brand-800" />
                        </div>
                        <p className="text-sm font-semibold text-brand-900">
                          No adjustments found
                        </p>
                        <p className="text-sm text-brand-700">
                          Try changing your tab, type filter, or search value.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAdjustments.map((adj, index) => {
                    const rowNumber = (currentPage - 1) * perPage + index + 1;

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
                            checked={selectedIds.has(adj.id)}
                            onChange={() => toggleSelect(adj.id)}
                            className="h-4 w-4 rounded border-gray-300 accent-brand-800"
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

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-brand-800">
                            {adj.period}
                          </span>
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
                              Requested by {adj.requestedBy}
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
                            {adj.status === "Pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    updateStatusForIds([adj.id], "Approved")
                                  }
                                  className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4" />
                                  Approve
                                </button>

                                <button
                                  onClick={() =>
                                    updateStatusForIds([adj.id], "Rejected")
                                  }
                                  className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => deleteByIds([adj.id])}
                              className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          {paginatedAdjustments.length > 0 && (
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
                  else if (currentPage >= totalPages - 2)
                    pageNumber = totalPages - 4 + i;
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
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
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
                {" entries"}
              </div>
            </div>
          )}
        </div>

        {/* Audit Block */}
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
            <Info className="h-4 w-4 text-brand-800" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-brand-900">
              Adjustment Integrity Protocol
            </h4>
            <p className="mt-1 text-sm leading-6 text-brand-700">
              Processed adjustments are considered final for the completed cycle.
              Any change after processing should be handled through a reversal or
              correction entry in the next payroll period.
            </p>
          </div>
        </div>
      </div>

      <AdjustmentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveAdjustment}
      />
    </div>
  );
};

export default AdjustmentsList;