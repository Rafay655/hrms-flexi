"use client";
import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Wallet,
  CheckCircle2,
  FileText,
  Building2,
  Info,
  Download,
  Trash2,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Clock3,
  AlertCircle,
} from "lucide-react";
import { LoanForm } from "@/components/LoanForm";
import { LoanStatement } from "@/components/LoanStatement";

type LoanType = "Salary Advance" | "Personal" | "Emergency" | "Car" | "House";
type LoanStatus = "Active" | "Pending" | "On Hold" | "Closed" | "Written Off";

interface LoanRecord {
  id: string;
  empId: string;
  empName: string;
  type: LoanType;
  principal: number;
  outstanding: number;
  emi: number;
  remainingInst: number;
  status: LoanStatus;
}

const DEFAULT_PER_PAGE = 10;

const LOAN_TYPES: Array<"All" | LoanType> = [
  "All",
  "Salary Advance",
  "Personal",
  "Emergency",
  "Car",
  "House",
];

const TAB_OPTIONS: Array<"Active" | "Pending" | "Closed" | "All"> = [
  "Active",
  "Pending",
  "Closed",
  "All",
];

const MOCK_LOANS: LoanRecord[] = Array.from({ length: 45 }).map((_, i) => {
  const principal = [50000, 150000, 500000, 2500000][i % 4];
  const type: LoanType =
    i % 5 === 0
      ? "Salary Advance"
      : i % 5 === 1
      ? "Personal"
      : i % 5 === 2
      ? "Emergency"
      : i % 5 === 3
      ? "Car"
      : "House";

  const status: LoanStatus =
    i === 0 ? "Pending" : i === 5 ? "On Hold" : i > 35 ? "Closed" : "Active";

  const remaining = i > 35 ? 0 : 5 + (i % 12);
  const emi = Math.round(principal / 12);

  return {
    id: `L-2025-${500 - i}`,
    empId: `EMP-${1001 + i}`,
    empName: [
      "Arsalan Khan",
      "Saira Ahmed",
      "Umar Farooq",
      "Zainab Bibi",
      "Mustafa Kamal",
    ][i % 5],
    type,
    principal,
    outstanding: status === "Closed" ? 0 : Math.round(emi * remaining),
    emi,
    remainingInst: remaining,
    status,
  };
});

const formatPKR = (val: number) => `PKR ${val.toLocaleString()}`;

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getStatusClasses = (status: LoanStatus) => {
  switch (status) {
    case "Active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "On Hold":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "Closed":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "Written Off":
      return "bg-red-50 text-red-700 border-red-200";
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

 const LoansList: React.FC = () => {
  const [loans, setLoans] = useState<LoanRecord[]>(MOCK_LOANS);
  const [activeTab, setActiveTab] = useState<"Active" | "Pending" | "Closed" | "All">("Active");
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<"All" | LoanType>("All");
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LoanRecord | null>(null);

  const filteredLoans = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return loans.filter((loan) => {
      const matchesTab = activeTab === "All" || loan.status === activeTab;
      const matchesType = selectedType === "All" || loan.type === selectedType;
      const matchesSearch =
        !needle ||
        [
          loan.id,
          loan.empId,
          loan.empName,
          loan.type,
          loan.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      return matchesTab && matchesType && matchesSearch;
    });
  }, [loans, activeTab, selectedType, search]);

  const totalEntries = filteredLoans.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const paginatedLoans = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredLoans.slice(start, start + perPage);
  }, [filteredLoans, currentPage, perPage]);

  const activeCount = loans.filter((loan) => loan.status === "Active").length;
  const pendingCount = loans.filter((loan) => loan.status === "Pending").length;
  const closedCount = loans.filter((loan) => loan.status === "Closed").length;
  const totalOutstanding = loans.reduce((sum, loan) => sum + loan.outstanding, 0);
  const totalEmiRecovery = loans
    .filter((loan) => loan.status === "Active" || loan.status === "On Hold")
    .reduce((sum, loan) => sum + loan.emi, 0);
  const closingThisCycle = loans.filter(
    (loan) => loan.status === "Active" && loan.remainingInst <= 1
  ).length;

  const resetToFirstPage = () => setPage(1);

  const handleExportCSV = () => {
    const headers = [
      "Sr",
      "Loan ID",
      "Employee ID",
      "Employee Name",
      "Loan Type",
      "Principal",
      "Outstanding",
      "EMI",
      "Remaining Installments",
      "Status",
    ];

    const rows = filteredLoans.map((loan, index) => [
      index + 1,
      loan.id,
      loan.empId,
      loan.empName,
      loan.type,
      loan.principal,
      loan.outstanding,
      loan.emi,
      loan.remainingInst,
      loan.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "loans-and-advances.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteLoan = () => {
    if (!deleteTarget) return;
    setLoans((prev) => prev.filter((loan) => loan.id !== deleteTarget.id));
    if (selectedStatementId === deleteTarget.id) {
      setSelectedStatementId(null);
    }
    setDeleteTarget(null);
  };

  const handleSaveLoan = (data: any) => {
    const nextId = `L-2025-${String(600 + loans.length).padStart(3, "0")}`;
    const principal = Number(data?.principal ?? 0);
    const emi =
      Number(data?.emi ?? 0) > 0
        ? Number(data?.emi)
        : Math.round(principal / Math.max(Number(data?.remainingInst ?? 12), 1));

    const remainingInst = Number(data?.remainingInst ?? 12);
    const status = (data?.status ?? "Pending") as LoanStatus;

    const newLoan: LoanRecord = {
      id: nextId,
      empId: (data?.empId || `EMP-${2000 + loans.length + 1}`).toString().trim(),
      empName: (data?.empName || "New Employee").toString().trim(),
      type: (data?.type || "Salary Advance") as LoanType,
      principal,
      outstanding:
        status === "Closed" ? 0 : Number(data?.outstanding ?? emi * remainingInst),
      emi,
      remainingInst,
      status,
    };

    setLoans((prev) => [newLoan, ...prev]);
    setIsFormOpen(false);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <Landmark className="h-5 w-5 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-brand-900">Loans & Advances</h2>
                <p className="mt-0.5 text-sm text-brand-700">
                  Manage employee credit, repayments, statements, and outstanding liabilities
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>

              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <Plus className="h-4 w-4" />
                New Loan Application
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Active Loans
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">{activeCount}</p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Wallet className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Total Outstanding
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {formatPKR(totalOutstanding)}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Building2 className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                EMI Recovery
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {formatPKR(totalEmiRecovery)}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Calendar className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Closing This Cycle
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">{closingThisCycle}</p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-800" />
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
                    resetToFirstPage();
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
                  placeholder="Search employee, emp id, loan id..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    resetToFirstPage();
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
                    setSelectedType(e.target.value as "All" | LoanType);
                    resetToFirstPage();
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  {LOAN_TYPES.map((type) => (
                    <option key={type} value={type}>
                      Type: {type}
                    </option>
                  ))}
                </select>

                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    resetToFirstPage();
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
              <span className="text-brand-700"> loans</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{activeCount}</span>
                Active
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <Clock3 className="h-3.5 w-3.5 text-brand-700" />
                <span className="font-semibold text-brand-900">{pendingCount}</span>
                Pending
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-700" />
                <span className="font-semibold text-brand-900">{closedCount}</span>
                Closed
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px]">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Sr.
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Loan ID
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Type
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Principal
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Outstanding
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    EMI
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
                {paginatedLoans.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                          <Wallet className="h-5 w-5 text-brand-800" />
                        </div>
                        <p className="text-sm font-semibold text-brand-900">
                          No loans found
                        </p>
                        <p className="text-sm text-brand-700">
                          Try changing your tab, search, or type filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLoans.map((loan, index) => {
                    const rowNumber = (currentPage - 1) * perPage + index + 1;

                    return (
                      <tr key={loan.id} className="transition hover:bg-brand-100/60">
                        <td className="px-5 py-4 text-sm font-medium text-brand-900">
                          {rowNumber}
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-mono text-sm font-semibold text-brand-900">
                            {loan.id}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                              {getInitials(loan.empName)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-brand-900">
                                {loan.empName}
                              </p>
                              <p className="mt-0.5 text-xs text-brand-700">
                                {loan.empId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-full border border-gray-200 bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                            {loan.type}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-medium text-brand-800">
                          {loan.principal.toLocaleString()}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-semibold text-brand-900">
                          {loan.outstanding.toLocaleString()}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-semibold text-brand-900">
                          {loan.emi.toLocaleString()}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex min-w-[56px] flex-col items-center rounded-lg border border-gray-200 bg-white px-2 py-1.5">
                            <span className="text-sm font-semibold text-brand-900">
                              {loan.remainingInst}
                            </span>
                            <span className="text-[11px] text-brand-700">months</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              loan.status
                            )}`}
                          >
                            {loan.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedStatementId(loan.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-800 transition hover:bg-brand-100"
                              title="View Statement"
                            >
                              <FileText className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => setDeleteTarget(loan)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-700 transition hover:bg-brand-100"
                              title="Delete Loan"
                            >
                              <Trash2 className="h-4 w-4" />
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

          {/* Pagination */}
          {paginatedLoans.length > 0 && (
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

        {/* Info Block */}
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
            <Info className="h-4 w-4 text-brand-800" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-brand-900">
              Loan Recovery Policy
            </h4>
            <p className="mt-1 text-sm leading-6 text-brand-700">
              Recovery happens automatically through the payroll deduction component.
              For mid-month settlement or manual closure, use the repayment or close
              action from the employee loan statement.
            </p>
          </div>
        </div>
      </div>

      <LoanForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveLoan}
      />

      <LoanStatement
        isOpen={!!selectedStatementId}
        onClose={() => setSelectedStatementId(null)}
        loanId={selectedStatementId || ""}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/30 px-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-brand-900">
                  Delete Loan Record?
                </h3>
                <p className="mt-1 text-sm leading-6 text-brand-700">
                  This will remove{" "}
                  <span className="font-semibold text-brand-900">{deleteTarget.id}</span>{" "}
                  for{" "}
                  <span className="font-semibold text-brand-900">
                    {deleteTarget.empName}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteLoan}
                className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                Delete Loan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoansList;