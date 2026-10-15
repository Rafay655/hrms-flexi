"use client";
import { useMemo, useState } from "react";
import {
  Ban,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock3,
  Wallet,
  Download,
  FileText,
  Trash2,
  Send,
  Info,
  ShieldCheck,
  Landmark,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  AlertCircle,
  X,
} from "lucide-react";

type ExitType =
  | "Resignation"
  | "Termination"
  | "Retirement"
  | "Contract End"
  | "Death"
  | "Absconding";

type SettlementStatus =
  | "Initiated"
  | "HR Review"
  | "Finance Review"
  | "Approved"
  | "Paid"
  | "Closed";

interface SettlementRecord {
  id: string;
  empId: string;
  empName: string;
  lastWorkingDay: string;
  exitType: ExitType;
  amount: number;
  status: SettlementStatus;
  tenure: string;
  department: string;
  grossSalary: number;
  gratuity: number;
  leaveEncashment: number;
  noticeAdjustment: number;
  loanRecovery: number;
  assetClearance: "Pending" | "Cleared";
}

interface EOSSettlementsListProps {
  onCreateNew?: () => void;
}

const DEFAULT_PER_PAGE = 10;

const STATUS_FLOW: SettlementStatus[] = [
  "Initiated",
  "HR Review",
  "Finance Review",
  "Approved",
  "Paid",
  "Closed",
];

const TYPE_OPTIONS: Array<"All" | ExitType> = [
  "All",
  "Resignation",
  "Termination",
  "Retirement",
  "Contract End",
  "Death",
  "Absconding",
];

const MOCK_SETTLEMENTS: SettlementRecord[] = [
  {
    id: "EOS-2025-001",
    empId: "EMP-1199",
    empName: "Umar Jafri",
    lastWorkingDay: "2025-01-15",
    exitType: "Resignation",
    amount: 458000,
    status: "HR Review",
    tenure: "4.5 Years",
    department: "Engineering",
    grossSalary: 220000,
    gratuity: 275000,
    leaveEncashment: 85000,
    noticeAdjustment: 65000,
    loanRecovery: -12000,
    assetClearance: "Pending",
  },
  {
    id: "EOS-2025-002",
    empId: "EMP-1205",
    empName: "Hassan Ali",
    lastWorkingDay: "2025-01-20",
    exitType: "Contract End",
    amount: 125000,
    status: "Initiated",
    tenure: "1 Year",
    department: "Operations",
    grossSalary: 95000,
    gratuity: 45000,
    leaveEncashment: 30000,
    noticeAdjustment: 50000,
    loanRecovery: 0,
    assetClearance: "Pending",
  },
  {
    id: "EOS-2024-098",
    empId: "EMP-1044",
    empName: "Raza Jafri",
    lastWorkingDay: "2024-12-31",
    exitType: "Retirement",
    amount: 2450000,
    status: "Paid",
    tenure: "15 Years",
    department: "Finance",
    grossSalary: 410000,
    gratuity: 1750000,
    leaveEncashment: 350000,
    noticeAdjustment: 400000,
    loanRecovery: -50000,
    assetClearance: "Cleared",
  },
  {
    id: "EOS-2025-003",
    empId: "EMP-1301",
    empName: "Ayesha Malik",
    lastWorkingDay: "2025-01-05",
    exitType: "Termination",
    amount: 85000,
    status: "Finance Review",
    tenure: "8 Months",
    department: "Sales",
    grossSalary: 78000,
    gratuity: 0,
    leaveEncashment: 25000,
    noticeAdjustment: 60000,
    loanRecovery: 0,
    assetClearance: "Pending",
  },
  {
    id: "EOS-2024-095",
    empId: "EMP-1012",
    empName: "Saira Shah",
    lastWorkingDay: "2024-12-15",
    exitType: "Resignation",
    amount: 312000,
    status: "Closed",
    tenure: "3.2 Years",
    department: "HR",
    grossSalary: 160000,
    gratuity: 145000,
    leaveEncashment: 72000,
    noticeAdjustment: 105000,
    loanRecovery: -10000,
    assetClearance: "Cleared",
  },
];

function formatPKR(val: number): string {
  return `PKR ${Math.round(val).toLocaleString()}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getExitTypeClasses(type: ExitType): string {
  switch (type) {
    case "Termination":
    case "Absconding":
      return "bg-red-50 text-red-700 border-red-200";
    case "Retirement":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "Death":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "Contract End":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-brand-100 text-brand-800 border-gray-200";
  }
}

function getStatusClasses(status: SettlementStatus): string {
  switch (status) {
    case "Initiated":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "HR Review":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Finance Review":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "Approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Paid":
      return "bg-brand-100 text-brand-800 border-gray-200";
    case "Closed":
      return "bg-gray-100 text-gray-500 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getNextStatus(status: SettlementStatus): SettlementStatus | null {
  const currentIndex = STATUS_FLOW.indexOf(status);
  if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[currentIndex + 1];
}

function escapeCsv(value: string | number): string {
  const stringValue = String(value ?? "");
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

 function EOSSettlementsList({
  onCreateNew,
}: EOSSettlementsListProps) {
  const [records, setRecords] = useState<SettlementRecord[]>(MOCK_SETTLEMENTS);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "COMPLETED">(
    "ALL"
  );
  const [typeFilter, setTypeFilter] = useState<"All" | ExitType>("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [selectedRecord, setSelectedRecord] = useState<SettlementRecord | null>(
    null
  );

  const filteredRecords = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesTab =
        activeTab === "ALL"
          ? true
          : activeTab === "PENDING"
          ? !["Paid", "Closed"].includes(record.status)
          : ["Paid", "Closed"].includes(record.status);

      const matchesType = typeFilter === "All" || record.exitType === typeFilter;

      const matchesSearch =
        !needle ||
        [
          record.id,
          record.empId,
          record.empName,
          record.exitType,
          record.status,
          record.tenure,
          record.department,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      return matchesTab && matchesType && matchesSearch;
    });
  }, [records, search, activeTab, typeFilter]);

  const totalEntries = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredRecords.slice(start, start + perPage);
  }, [filteredRecords, currentPage, perPage]);

  const stats = useMemo(() => {
    const pending = records.filter((r) => r.status === "Initiated").length;
    const inProgress = records.filter((r) =>
      ["HR Review", "Finance Review", "Approved"].includes(r.status)
    ).length;
    const completedMTD = records.filter((r) =>
      ["Paid", "Closed"].includes(r.status)
    ).length;

    const averageResolutionDays = 5;

    return {
      pending,
      inProgress,
      completedMTD,
      averageResolutionDays,
    };
  }, [records]);

  const resetPage = (): void => setPage(1);

  const updateRecordStatus = (id: string, nextStatus: SettlementStatus): void => {
    setRecords((prev) =>
      prev.map((record) =>
        record.id === id ? { ...record, status: nextStatus } : record
      )
    );

    setSelectedRecord((prev) =>
      prev && prev.id === id ? { ...prev, status: nextStatus } : prev
    );
  };

  const handleAdvance = (record: SettlementRecord): void => {
    const nextStatus = getNextStatus(record.status);
    if (!nextStatus) return;
    updateRecordStatus(record.id, nextStatus);
  };

  const handleDelete = (id: string): void => {
    setRecords((prev) => prev.filter((record) => record.id !== id));
    setSelectedRecord((prev) => (prev?.id === id ? null : prev));
  };

  const handleExport = (): void => {
    const headers = [
      "Sr",
      "Settlement ID",
      "Employee ID",
      "Employee Name",
      "Last Working Day",
      "Exit Type",
      "Amount",
      "Status",
      "Tenure",
      "Department",
    ];

    const rows = filteredRecords.map((record, index) => [
      index + 1,
      record.id,
      record.empId,
      record.empName,
      record.lastWorkingDay,
      record.exitType,
      record.amount,
      record.status,
      record.tenure,
      record.department,
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
    anchor.download = "eos-settlements.csv";
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
                <Landmark className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-brand-900">
                  Final Settlements (EOS)
                </h2>
                <p className="mt-0.5 text-sm text-brand-700">
                  Manage separation benefits, gratuity, and notice period encashments
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

              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <Plus className="h-4 w-4" />
                New Settlement
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Pending Initiation
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {stats.pending}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Ban className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                In Review Flow
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {stats.inProgress}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Clock3 className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Completed MTD
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {stats.completedMTD}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Avg Resolution
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {stats.averageResolutionDays}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <ShieldCheck className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listing */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {["ALL", "PENDING", "COMPLETED"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab as "ALL" | "PENDING" | "COMPLETED");
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
                  placeholder="Search employee or settlement id..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    resetPage();
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white">
                  <Filter className="h-4 w-4 text-brand-700" />
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as "All" | ExitType);
                    resetPage();
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      Exit Type: {type}
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

          <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm">
              <span className="text-brand-700">Showing </span>
              <span className="font-semibold text-brand-900">{showingFrom}</span>
              <span className="text-brand-700"> to </span>
              <span className="font-semibold text-brand-900">{showingTo}</span>
              <span className="text-brand-700"> of </span>
              <span className="font-semibold text-brand-900">{totalEntries}</span>
              <span className="text-brand-700"> settlements</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {records.filter((r) => r.status === "HR Review").length}
                </span>
                HR Verification
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {records.filter((r) => r.status === "Finance Review").length}
                </span>
                Finance Review
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px]">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Settlement ID
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Last Working Day
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Exit Type
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Settlement Amount
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
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                          <Landmark className="h-5 w-5 text-brand-800" />
                        </div>
                        <p className="text-sm font-semibold text-brand-900">
                          No settlements found
                        </p>
                        <p className="text-sm text-brand-700">
                          Try changing your tab, exit type filter, or search value.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record) => {
                    const nextStatus = getNextStatus(record.status);

                    return (
                      <tr key={record.id} className="hover:bg-brand-100/60">
                        <td className="px-5 py-4">
                          <div className="font-mono text-sm font-semibold text-brand-900">
                            {record.id}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                              {getInitials(record.empName)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-brand-900">
                                {record.empName}
                              </p>
                              <p className="mt-0.5 text-xs text-brand-700">
                                {record.empId} • {record.tenure}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center text-sm text-brand-800">
                          {record.lastWorkingDay}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getExitTypeClasses(
                              record.exitType
                            )}`}
                          >
                            {record.exitType}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-semibold text-brand-900">
                          {formatPKR(record.amount)}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              record.status
                            )}`}
                          >
                            {record.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedRecord(record)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-800 transition hover:bg-brand-100"
                              title="View Statement"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => setSelectedRecord(record)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-800 transition hover:bg-brand-100"
                              title="View Detailed Statement"
                            >
                              <FileText className="h-4 w-4" />
                            </button>

                            {nextStatus && (
                              <button
                                onClick={() => handleAdvance(record)}
                                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                                title="Move to next stage"
                              >
                                <Send className="h-4 w-4" />
                                Next
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(record.id)}
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

          {paginatedRecords.length > 0 && (
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

        {/* Compliance note */}
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
            <Info className="h-4 w-4 text-brand-800" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-brand-900">
              End of Service Protocol
            </h4>
            <p className="mt-1 text-sm leading-6 text-brand-700">
              Final settlements may include gratuity, leave encashment, notice pay,
              and recovery deductions. Finance review should only start after asset
              and loan clearance documents are completed.
            </p>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/30 px-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-brand-900">
                  Settlement Statement
                </h3>
                <p className="mt-0.5 text-sm text-brand-700">
                  Review separation payout details and process stage
                </p>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
              <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-800">
                    {getInitials(selectedRecord.empName)}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-brand-900">
                      {selectedRecord.empName}
                    </h4>
                    <p className="mt-0.5 text-sm text-brand-700">
                      {selectedRecord.empId} • {selectedRecord.department} • {selectedRecord.tenure}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                    selectedRecord.status
                  )}`}
                >
                  {selectedRecord.status}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Settlement Summary
                  </h5>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">Exit Type</span>
                      <span className="font-semibold text-brand-900">
                        {selectedRecord.exitType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">Last Working Day</span>
                      <span className="font-semibold text-brand-900">
                        {selectedRecord.lastWorkingDay}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">Gross Salary</span>
                      <span className="font-semibold text-brand-900">
                        {formatPKR(selectedRecord.grossSalary)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">Final Settlement</span>
                      <span className="font-semibold text-brand-900">
                        {formatPKR(selectedRecord.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Component Breakdown
                  </h5>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">Gratuity</span>
                      <span className="font-semibold text-brand-900">
                        {formatPKR(selectedRecord.gratuity)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">Leave Encashment</span>
                      <span className="font-semibold text-brand-900">
                        {formatPKR(selectedRecord.leaveEncashment)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">Notice Adjustment</span>
                      <span className="font-semibold text-brand-900">
                        {formatPKR(selectedRecord.noticeAdjustment)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">Loan Recovery</span>
                      <span className="font-semibold text-red-700">
                        {selectedRecord.loanRecovery < 0 ? "-" : ""}
                        {formatPKR(Math.abs(selectedRecord.loanRecovery))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Clearance Checklist
                </h5>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Asset Clearance
                    </p>
                    <p className="mt-2 text-sm font-semibold text-brand-900">
                      {selectedRecord.assetClearance}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Loan Recovery
                    </p>
                    <p className="mt-2 text-sm font-semibold text-brand-900">
                      {selectedRecord.loanRecovery === 0 ? "No Due" : "Adjustment Applied"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Finance Ready
                    </p>
                    <p className="mt-2 text-sm font-semibold text-brand-900">
                      {selectedRecord.assetClearance === "Cleared" ? "Yes" : "Pending"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                  <AlertCircle className="h-4 w-4 text-brand-800" />
                </div>
                <p className="text-sm leading-6 text-brand-700">
                  Before marking a settlement as paid or closed, confirm that all
                  recoveries, asset returns, and clearance approvals are attached
                  to the employee’s separation record.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 border-t border-gray-200 bg-white px-6 py-4 sm:grid-cols-3">
              <button
                onClick={() => {
                  handleDelete(selectedRecord.id);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>

              <button
                onClick={() => {
                  const nextStatus = getNextStatus(selectedRecord.status);
                  if (nextStatus) updateRecordStatus(selectedRecord.id, nextStatus);
                }}
                disabled={!getNextStatus(selectedRecord.status)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Move Next
              </button>

              <button
                onClick={() => setSelectedRecord(null)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <CheckCircle2 className="h-4 w-4" />
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default EOSSettlementsList;