"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Search,
  PauseCircle,
  Clock,
  CheckCircle2,
  BarChart3,
  Info,
  AlertCircle,
  X,
  Check,
  Wallet,
  RotateCcw,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface RecoveryRecord {
  id: string;
  empId: string;
  empName: string;
  type: string;
  emi: number;
  outstanding: number;
  remainingInst: number;
  status: "Scheduled" | "Deferred" | "Recovered";
}

const DEFAULT_PER_PAGE = 10;

const PERIODS = [
  "January 2025",
  "February 2025",
  "March 2025",
  "April 2025",
  "May 2025",
  "June 2025",
];

const MOCK_RECOVERIES: RecoveryRecord[] = Array.from({ length: 45 }).map(
  (_, i) => ({
    id: `L-2025-${500 - i}`,
    empId: `EMP-${1001 + i}`,
    empName: [
      "Arsalan Khan",
      "Saira Ahmed",
      "Umar Farooq",
      "Zainab Bibi",
      "Mustafa Kamal",
    ][i % 5],
    type:
      i % 4 === 0
        ? "Car Loan"
        : i % 4 === 1
          ? "Salary Advance"
          : i % 4 === 2
            ? "Personal Loan"
            : "Emergency Loan",
    emi: [15000, 25000, 5000, 45000][i % 4],
    outstanding: 150000 + i * 10000,
    remainingInst: 5 + (i % 12),
    status: i === 3 ? "Deferred" : i < 2 ? "Recovered" : "Scheduled",
  }),
);
const formatPKR = (val: number) => `PKR ${val.toLocaleString()}`;
const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const getStatusClasses = (status: RecoveryRecord["status"]) => {
  switch (status) {
    case "Scheduled":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Deferred":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "Recovered":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
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
const RecoverySchedule: React.FC = () => {
  const [recoveries, setRecoveries] =
    useState<RecoveryRecord[]>(MOCK_RECOVERIES);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | RecoveryRecord["status"]
  >("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [deferModalEmp, setDeferModalEmp] = useState<RecoveryRecord | null>(
    null,
  );
  const [deferReason, setDeferReason] = useState("Financial Hardship");
  const selectedPeriod = PERIODS[selectedPeriodIndex];

  const filteredRecoveries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return recoveries.filter((rec) => {
      const matchesSearch =
        !needle ||
        [rec.id, rec.empId, rec.empName, rec.type, rec.status]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      const matchesStatus =
        statusFilter === "All" || rec.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [recoveries, search, statusFilter]);

  const totalEntries = filteredRecoveries.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;
  const paginatedRecoveries = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredRecoveries.slice(start, start + perPage);
  }, [filteredRecoveries, currentPage, perPage]);
  const totalLoans = recoveries.length;
  const recoveryAmount = recoveries
    .filter((rec) => rec.status === "Scheduled")
    .reduce((sum, rec) => sum + rec.emi, 0);
  const closingSoon = recoveries.filter(
    (rec) => rec.status === "Scheduled" && rec.remainingInst <= 1,
  ).length;
  const scheduledCount = recoveries.filter(
    (rec) => rec.status === "Scheduled",
  ).length;
  const deferredCount = recoveries.filter(
    (rec) => rec.status === "Deferred",
  ).length;
  const recoveredCount = recoveries.filter(
    (rec) => rec.status === "Recovered",
  ).length;
  const roadmapData = useMemo(() => {
    const base = Math.max(recoveryAmount, 1);
    return PERIODS.map((month, index) => {
      const factor = [1, 1.04, 1.02, 0.93, 0.9, 0.84][index] ?? 1;
      const amount = Math.round(base * factor);
      const perc = Math.max(
        65,
        Math.min(100, Math.round((amount / base) * 100)),
      );
      return { month, amount, perc };
    });
  }, [recoveryAmount]);
  const resetPage = () => setPage(1);
  const handleExport = () => {
    const headers = [
      "Sr",
      "Loan ID",
      "Employee ID",
      "Employee Name",
      "Loan Type",
      "EMI",
      "Outstanding",
      "Remaining Installments",
      "Status",
      "Period",
    ];
    const rows = filteredRecoveries.map((rec, index) => [
      index + 1,
      rec.id,
      rec.empId,
      rec.empName,
      rec.type,
      rec.emi,
      rec.outstanding,
      rec.remainingInst,
      rec.status,
      selectedPeriod,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `recovery-schedule-${selectedPeriod.toLowerCase().replace(/\s+/g, "-")}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const handleConfirmDeferral = () => {
    if (!deferModalEmp) return;
    setRecoveries((prev) =>
      prev.map((rec) =>
        rec.id === deferModalEmp.id
          ? { ...rec, status: "Deferred", remainingInst: rec.remainingInst + 1 }
          : rec,
      ),
    );
    setDeferModalEmp(null);
    setDeferReason("Financial Hardship");
  };
  const handleMarkRecovered = (id: string) => {
    setRecoveries((prev) =>
      prev.map((rec) => {
        if (rec.id !== id || rec.status !== "Scheduled") return rec;
        const nextRemaining = Math.max(rec.remainingInst - 1, 0);
        const nextOutstanding = Math.max(rec.outstanding - rec.emi, 0);
        return {
          ...rec,
          status: "Recovered",
          remainingInst: nextRemaining,
          outstanding: nextRemaining === 0 ? 0 : nextOutstanding,
        };
      }),
    );
  };
  const handleReinstate = (id: string) => {
    setRecoveries((prev) =>
      prev.map((rec) =>
        rec.id === id && rec.status === "Deferred"
          ? {
              ...rec,
              status: "Scheduled",
              remainingInst: Math.max(rec.remainingInst - 1, 1),
            }
          : rec,
      ),
    );
  };
  return (
    <div className="min-h-screen bg-white p-3">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Left Main */}
        <div className="space-y-4 xl:col-span-8">
          {/* Header */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-brand-900">
                    Recovery Schedule
                  </h2>
                  <p className="mt-0.5 text-sm text-brand-700">
                    Monitor and manage loan deductions for the current payroll
                    period
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white">
                  <button
                    onClick={() =>
                      setSelectedPeriodIndex((prev) => Math.max(prev - 1, 0))
                    }
                    disabled={selectedPeriodIndex === 0}
                    className="inline-flex h-10 w-10 items-center justify-center text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="border-x border-gray-200 px-4 py-2.5 text-sm font-semibold text-brand-900">
                    {selectedPeriod}
                  </div>
                  <button
                    onClick={() =>
                      setSelectedPeriodIndex((prev) =>
                        Math.min(prev + 1, PERIODS.length - 1),
                      )
                    }
                    disabled={selectedPeriodIndex === PERIODS.length - 1}
                    className="inline-flex h-10 w-10 items-center justify-center text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  <Download className="h-4 w-4" /> Export Schedule
                </button>
              </div>
            </div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Total Active Loans
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-bold text-brand-900">
                    {totalLoans}
                  </p>
                  <div className="rounded-lg bg-brand-100 p-2">
                    <Clock className="h-4 w-4 text-brand-800" />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Scheduled Recovery
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-bold text-brand-900">
                    {formatPKR(recoveryAmount)}
                  </p>
                  <div className="rounded-lg bg-brand-100 p-2">
                    <Wallet className="h-4 w-4 text-brand-800" />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Closing This Cycle
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-bold text-brand-900">
                    {closingSoon}
                  </p>
                  <div className="rounded-lg bg-brand-100 p-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-800" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Listing */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Filters */}
            <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  placeholder="Search employee, emp id, loan id..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    resetPage();
                  }}
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white">
                    <Filter className="h-4 w-4 text-brand-700" />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(
                        e.target.value as "All" | RecoveryRecord["status"],
                      );
                      resetPage();
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                  >
                    <option value="All">Status: All</option>
                    <option value="Scheduled">Status: Scheduled</option>
                    <option value="Deferred">Status: Deferred</option>
                    <option value="Recovered">Status: Recovered</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-brand-700">Show</span>
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
                        {size}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-brand-700">entries</span>
                </div>
              </div>
            </div>
            {/* Stats Bar */}
            <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
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
                  {totalEntries}
                </span>
                <span className="text-brand-700"> recoveries</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                  <span className="font-semibold text-brand-900">
                    {scheduledCount}
                  </span>
                  Scheduled
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                  <span className="font-semibold text-brand-900">
                    {deferredCount}
                  </span>
                  Deferred
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                  <span className="font-semibold text-brand-900">
                    {recoveredCount}
                  </span>
                  Recovered
                </div>
              </div>
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px]">
                <thead className="border-b border-gray-200 bg-white">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Sr.
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Employee Info
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Loan Type
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                      EMI Amount
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Outstanding
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Remaining
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
                  {paginatedRecoveries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                            <Calendar className="h-5 w-5 text-brand-800" />
                          </div>
                          <p className="text-sm font-semibold text-brand-900">
                            No recovery records found
                          </p>
                          <p className="text-sm text-brand-700">
                            Try changing your search or status filter.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRecoveries.map((rec, index) => {
                      const rowNumber = (currentPage - 1) * perPage + index + 1;
                      return (
                        <tr
                          key={rec.id}
                          className={`transition hover:bg-brand-100/60 ${rec.status === "Deferred" ? "bg-violet-50/20" : ""}`}
                        >
                          <td className="px-5 py-4 text-sm font-medium text-brand-900">
                            {rowNumber}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                                {getInitials(rec.empName)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-brand-900">
                                  {rec.empName}
                                </p>
                                <p className="mt-0.5 text-xs text-brand-700">
                                  {rec.empId} · {rec.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center rounded-full border border-gray-200 bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                              {rec.type}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-semibold text-brand-900">
                            {rec.status === "Deferred"
                              ? "--"
                              : rec.emi.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-medium text-brand-800">
                            {rec.outstanding.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="inline-flex min-w-[56px] flex-col items-center rounded-lg border border-gray-200 bg-white px-2 py-1.5">
                              <span className="text-sm font-semibold text-brand-900">
                                {rec.remainingInst}
                              </span>
                              <span className="text-[11px] text-brand-700">
                                inst.
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(rec.status)}`}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              {rec.status === "Scheduled" && (
                                <>
                                  <button
                                    onClick={() => setDeferModalEmp(rec)}
                                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                                    title="Defer EMI"
                                  >
                                    <PauseCircle className="h-4 w-4" />
                                    Defer
                                  </button>
                                  <button
                                    onClick={() => handleMarkRecovered(rec.id)}
                                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                                    title="Mark recovered"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Recover
                                  </button>
                                </>
                              )}
                              {rec.status === "Deferred" && (
                                <button
                                  onClick={() => handleReinstate(rec.id)}
                                  className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                                  title="Reinstate EMI"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Reinstate
                                </button>
                              )}
                              {rec.status === "Recovered" && (
                                <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Done
                                </span>
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
            {paginatedRecoveries.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-brand-700">
                  Page
                  <span className="font-semibold text-brand-900">
                    {currentPage}
                  </span>
                  of
                  <span className="font-semibold text-brand-900">
                    {totalPages}
                  </span>
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
                        className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${currentPage === pageNumber ? "border-brand-800 bg-brand-800 text-white" : "border-gray-200 bg-white text-brand-800 hover:bg-brand-100"}`}
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
                    {showingFrom}
                  </span>
                  {" – "}
                  <span className="font-semibold text-brand-900">
                    {showingTo}
                  </span>
                  {" of "}
                  <span className="font-semibold text-brand-900">
                    {totalEntries}
                  </span>
                  {" entries"}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Right Side */}
        <div className="space-y-4 xl:col-span-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-brand-900">
                  Recovery Roadmap
                </h3>
                <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                  6 Months View
                </span>
              </div>
              <p className="mt-1 text-sm text-brand-700">
                Forecast based on current recoveries and projected closures
              </p>
            </div>
            <div className="space-y-4 px-5 py-5">
              {roadmapData.map((item) => (
                <div key={item.month} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      {item.month}
                    </span>
                    <span className="text-sm font-semibold text-brand-900">
                      {formatPKR(item.amount)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full border border-gray-200 bg-brand-100/40">
                    <div
                      className="h-full bg-brand-800 transition-all"
                      style={{ width: `${item.perc}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 px-5 py-4">
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
                  <BarChart3 className="h-4 w-4 text-brand-800" />
                </div>
                <p className="text-sm leading-6 text-brand-700">
                  Forecast includes scheduled closures. New loan applications or
                  approved deferrals can shift the next cycle totals.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
              <Info className="h-4 w-4 text-brand-800" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-brand-900">
                Recovery Note
              </h4>
              <p className="mt-1 text-sm leading-6 text-brand-700">
                Deferred installments increase the tenure by one month.
                Recovered entries reduce both outstanding balance and remaining
                installments.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Deferral Modal */}
      {deferModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/30 px-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                  <PauseCircle className="h-5 w-5 text-brand-800" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-brand-900">
                    Defer Installment
                  </h3>
                  <p className="mt-0.5 text-sm text-brand-700">
                    Skip current month repayment for this employee
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeferModalEmp(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Employee
                </p>
                <p className="mt-2 text-sm font-semibold text-brand-900">
                  {deferModalEmp.empName} ({deferModalEmp.empId})
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      EMI to Skip
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {formatPKR(deferModalEmp.emi)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Loan
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {deferModalEmp.id}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Reason for Deferral
                </label>
                <select
                  value={deferReason}
                  onChange={(e) => setDeferReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  <option>Financial Hardship</option>
                  <option>Salary Adjustment Correction</option>
                  <option>Exceptional Management Approval</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
                  <AlertCircle className="h-4 w-4 text-brand-800" />
                </div>
                <p className="text-sm leading-6 text-brand-700">
                  Deferring this installment will increase the loan tenure by
                  one month. Interest adjustments, if any, should be
                  recalculated in the final loan ledger.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setDeferModalEmp(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeferral}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <Check className="h-4 w-4" /> Confirm Deferral
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecoverySchedule;