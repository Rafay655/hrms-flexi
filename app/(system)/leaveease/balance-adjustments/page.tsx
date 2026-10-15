"use client";

import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Eye,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Info,
  Clock,
  XCircle,
  Database,
  ShieldCheck,
  X,
  Briefcase,
} from "lucide-react";
import BalanceAdjustmentForm  from "@/components/leaveease/BalanceAdjustmentForm";

type AdjustmentType = "Credit" | "Debit";
type AdjustmentReason =
  | "Correction"
  | "Joining Bonus"
  | "Policy Change"
  | "Manual"
  | "Exception";
type AdjustmentStatus = "Applied" | "Pending" | "Rejected";

interface Adjustment {
  id: string;
  date: string;
  employee: string;
  avatar: string;
  leaveType: string;
  type: AdjustmentType;
  amount: number;
  reason: AdjustmentReason;
  adjustedBy: string;
  status: AdjustmentStatus;
  description: string;
}

const INITIAL_ADJUSTMENTS: Adjustment[] = Array.from({ length: 25 }, (_, i) => ({
  id: `ADJ-2025-${500 + i}`,
  date: "Feb 12, 2025",
  employee: ["Ahmed Khan", "Sara Ahmed", "Tariq Mehmood", "Amna Bilal", "Zoya Malik"][i % 5],
  avatar: ["AK", "SM", "TC", "AB", "ZM"][i % 5],
  leaveType: ["Annual Leave", "Casual Leave", "Sick Leave", "Comp-Off"][i % 4],
  type: i % 3 === 0 ? "Debit" : "Credit",
  amount: (i % 5) + 1,
  reason: ["Correction", "Joining Bonus", "Policy Change", "Manual", "Exception"][i % 5] as AdjustmentReason,
  adjustedBy: "Sarah Admin",
  status: i < 3 ? "Pending" : i === 4 ? "Rejected" : "Applied",
  description: "Manual correction for carry-forward mismatch from previous system.",
}));

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function BalanceAdjustmentsList() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>(INITIAL_ADJUSTMENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedAdjustment, setSelectedAdjustment] = useState<Adjustment | null>(null);

  const [page, setPage] = useState(1);
  const perPage = 10;

  const filteredData = useMemo(() => {
    return adjustments.filter((adj) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        adj.employee.toLowerCase().includes(q) ||
        adj.id.toLowerCase().includes(q) ||
        adj.leaveType.toLowerCase().includes(q) ||
        adj.adjustedBy.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" || adj.status === statusFilter;
      const matchesType = typeFilter === "All" || adj.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [adjustments, search, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, currentPage]);

  const totalCredits = useMemo(() => {
    return adjustments
      .filter((item) => item.type === "Credit" && item.status === "Applied")
      .reduce((sum, item) => sum + item.amount, 0);
  }, [adjustments]);

  const totalDebits = useMemo(() => {
    return adjustments
      .filter((item) => item.type === "Debit" && item.status === "Applied")
      .reduce((sum, item) => sum + item.amount, 0);
  }, [adjustments]);

  const pendingCount = useMemo(() => {
    return adjustments.filter((item) => item.status === "Pending").length;
  }, [adjustments]);

  const netDays = totalCredits - totalDebits;

  const showingFrom = filteredData.length === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const showingTo = Math.min(currentPage * perPage, filteredData.length);

  const getReasonBadge = (reason: AdjustmentReason) => {
    switch (reason) {
      case "Correction":
        return "bg-brand-100 text-brand-800 border-gray-200";
      case "Joining Bonus":
        return "bg-violet-50 text-violet-700 border-gray-200";
      case "Policy Change":
        return "bg-indigo-50 text-indigo-700 border-gray-200";
      case "Exception":
        return "bg-amber-50 text-amber-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusStyle = (status: AdjustmentStatus) => {
    switch (status) {
      case "Applied":
        return "bg-brand-700 text-white";
      case "Pending":
        return "bg-amber-500 text-white";
      case "Rejected":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const reverseEntry = (id: string) => {
    setAdjustments((prev) =>
      prev.map((adj) =>
        adj.id === id
          ? {
              ...adj,
              status: "Rejected",
              description: `Reversed entry. ${adj.description}`,
            }
          : adj
      )
    );
    setOpenMenuId(null);
  };

  const exportCsv = () => {
    const rows = [
      [
        "SR",
        "ID",
        "Date",
        "Employee",
        "Leave Type",
        "Type",
        "Amount",
        "Reason",
        "Adjusted By",
        "Status",
        "Description",
      ],
      ...filteredData.map((adj, index) => [
        index + 1,
        adj.id,
        adj.date,
        adj.employee,
        adj.leaveType,
        adj.type,
        adj.amount,
        adj.reason,
        adj.adjustedBy,
        adj.status,
        adj.description,
      ]),
    ];

    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "balance-adjustments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-900">
                Balance Adjustments
              </h1>
              <p className="mt-0.5 text-sm text-brand-700">
                Manual overrides and audit-trail adjustments for leave entitlements.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Export Excel
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

          {/* Stats */}
          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Adjustments This Month
                </p>
              </div>
              <p className="text-2xl font-bold text-brand-900">15</p>
              <p className="mt-1 text-[11px] text-brand-700">
                Across all leave types
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <Database className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Net Days Adjusted
                </p>
              </div>
              <p
                className={cn(
                  "text-2xl font-bold",
                  netDays >= 0 ? "text-emerald-600" : "text-red-600"
                )}
              >
                {netDays >= 0 ? "+" : ""}
                {netDays.toFixed(1)} <span className="text-sm">Days</span>
              </p>
              <p className="mt-1 text-[11px] text-brand-700">
                Total Credits - Debits
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-brand-900 p-5 text-white shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-white/80" />
                <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  Pending Approvals
                </p>
              </div>
              <p className="text-2xl font-bold text-white">
                {pendingCount} Requests
              </p>
              <p className="mt-1 text-[11px] text-white/70">
                Requires HR Head Review
              </p>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="space-y-4 border-b border-gray-200 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  placeholder="Search by employee, ID, leave type..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="All">All Types</option>
                  <option value="Credit">Credit Only</option>
                  <option value="Debit">Debit Only</option>
                </select>

                <select
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Applied">Applied</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm">
                <span className="text-brand-700">Showing </span>
                <span className="font-semibold text-brand-900">
                  {showingFrom}
                </span>
                <span className="text-brand-700"> to </span>
                <span className="font-semibold text-brand-900">
                  {showingTo}
                </span>
                <span className="text-brand-700"> of </span>
                <span className="font-semibold text-brand-900">
                  {filteredData.length}
                </span>
                <span className="text-brand-700"> records</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    SR
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    ID / Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Leave Type
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Reason Category
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Adjusted By
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Status
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Briefcase className="h-10 w-10 text-brand-300" />
                        <p className="text-sm font-semibold text-brand-900">
                          No balance adjustments found
                        </p>
                        <p className="text-sm text-brand-700">
                          Try changing your search or filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((adj, index) => {
                    const sr = (currentPage - 1) * perPage + index + 1;

                    return (
                      <tr key={adj.id} className="transition-colors hover:bg-brand-100">
                        <td className="px-5 py-3.5 text-sm font-semibold text-brand-900">
                          {sr}
                        </td>

                        <td className="px-5 py-3.5 text-sm">
                          <div>
                            <div className="font-mono font-semibold text-brand-900">
                              {adj.id}
                            </div>
                            <div className="text-[11px] text-brand-700">
                              {adj.date}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-xs font-bold text-white">
                              {adj.avatar}
                            </div>
                            <span className="font-semibold text-brand-900">
                              {adj.employee}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-sm text-brand-700">
                          {adj.leaveType}
                        </td>

                        <td className="px-5 py-3.5 text-center text-sm">
                          <div
                            className={cn(
                              "inline-flex items-center gap-1 font-semibold",
                              adj.type === "Credit" ? "text-emerald-600" : "text-red-600"
                            )}
                          >
                            {adj.type === "Credit" ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )}
                            {adj.type === "Credit" ? `+${adj.amount}` : `-${adj.amount}`}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-sm">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                              getReasonBadge(adj.reason)
                            )}
                          >
                            {adj.reason}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-sm text-brand-700">
                          {adj.adjustedBy}
                        </td>

                        <td className="px-5 py-3.5 text-center text-sm">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                              getStatusStyle(adj.status)
                            )}
                          >
                            {adj.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center text-sm">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() =>
                                setOpenMenuId(openMenuId === adj.id ? null : adj.id)
                              }
                              className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {openMenuId === adj.id && (
                              <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg">
                                <button
                                  onClick={() => {
                                    setSelectedAdjustment(adj);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </button>

                                {adj.status === "Applied" && (
                                  <button
                                    onClick={() => reverseEntry(adj.id)}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                    Reverse Entry
                                  </button>
                                )}

                                <div className="my-1 h-px bg-gray-200" />

                                <button
                                  onClick={() => {
                                    setSelectedAdjustment(adj);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                                >
                                  <Info className="h-4 w-4" />
                                  Audit Trail
                                </button>
                              </div>
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
          <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-brand-700">
              Showing <span className="font-semibold text-brand-900">{showingFrom}</span> to{" "}
              <span className="font-semibold text-brand-900">{showingTo}</span> of{" "}
              <span className="font-semibold text-brand-900">{filteredData.length}</span> records
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-200 bg-white p-2 text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      className={cn(
                        "h-9 w-9 rounded-lg text-sm font-medium transition",
                        currentPage === pageNumber
                          ? "bg-brand-800 text-white"
                          : "border border-gray-200 bg-white text-brand-700 hover:bg-brand-100"
                      )}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-200 bg-white p-2 text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 text-amber-700" />
            <div>
              <h5 className="text-sm font-semibold text-amber-900">
                Administrative Override Note
              </h5>
              <p className="mt-1 text-sm leading-6 text-amber-800/90">
                Balance adjustments should only be used for correcting system errors, processing joining bonuses, or applying legal policy changes. Every adjustment creates a mandatory entry in the Balance Ledger and is flagged in the monthly payroll audit.
              </p>
            </div>
          </div>
        </div>

        {/* Detail Drawer */}
        {selectedAdjustment && (
          <div className="fixed inset-0 z-[220] overflow-hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedAdjustment(null)}
            />
            <div className="absolute right-0 top-0 flex h-full w-full max-w-[620px] flex-col border-l border-gray-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                <div>
                  <h2 className="text-2xl font-bold text-brand-900">
                    Adjustment Detail
                  </h2>
                  <p className="mt-0.5 text-sm text-brand-700">
                    {selectedAdjustment.id}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedAdjustment(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-brand-700 transition hover:bg-brand-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Employee
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedAdjustment.employee}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Leave Type
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedAdjustment.leaveType}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Type
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-sm font-semibold",
                        selectedAdjustment.type === "Credit"
                          ? "text-emerald-600"
                          : "text-red-600"
                      )}
                    >
                      {selectedAdjustment.type}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Amount
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedAdjustment.amount} days
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Reason
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedAdjustment.reason}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedAdjustment.status}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Description
                  </p>
                  <p className="mt-1 text-sm leading-6 text-brand-900">
                    {selectedAdjustment.description}
                  </p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-4 w-4 text-amber-700" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        Audit Note
                      </p>
                      <p className="mt-1 text-sm leading-6 text-amber-800/90">
                        This manual balance adjustment should be reviewed alongside payroll and leave ledger records for complete traceability.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setSelectedAdjustment(null)}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <BalanceAdjustmentForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        />
      </div>
    </div>
  );
}