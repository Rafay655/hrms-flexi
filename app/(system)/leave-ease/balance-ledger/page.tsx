"use client";

import { useMemo, useState } from "react";
import {
  FileSpreadsheet,
  Filter,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Info,
  RefreshCw,
  Zap,
  MinusCircle,
  PlusCircle,
  CreditCard,
  Clock3,
  Search,
  Download,
  X,
} from "lucide-react";
import { LeaveType } from "../types";

interface Transaction {
  id: string;
  date: string;
  type:
    | "Opening"
    | "Accrual"
    | "CarryForward"
    | "AdjustmentCredit"
    | "LeaveTaken"
    | "AdjustmentDebit"
    | "Lapsed"
    | "Encashed";
  description: string;
  credit?: number;
  debit?: number;
  balance: number;
  reference?: string;
  leaveType: LeaveType;
  year: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "TX-001",
    date: "Jan 01, 2025",
    type: "Opening",
    description: "System opening balance",
    credit: 0,
    balance: 0,
    leaveType: LeaveType.ANNUAL,
    year: "2025",
  },
  {
    id: "TX-002",
    date: "Jan 01, 2025",
    type: "CarryForward",
    description: "Balance from 2024",
    credit: 2.0,
    balance: 2.0,
    reference: "CF-2024",
    leaveType: LeaveType.ANNUAL,
    year: "2025",
  },
  {
    id: "TX-003",
    date: "Jan 31, 2025",
    type: "Accrual",
    description: "Monthly accrual for January",
    credit: 2.0,
    balance: 4.0,
    reference: "JOB-992",
    leaveType: LeaveType.ANNUAL,
    year: "2025",
  },
  {
    id: "TX-004",
    date: "Feb 10, 2025",
    type: "LeaveTaken",
    description: "Approved leave request",
    debit: 3.0,
    balance: 1.0,
    reference: "LV-2025-1024",
    leaveType: LeaveType.ANNUAL,
    year: "2025",
  },
  {
    id: "TX-005",
    date: "Feb 28, 2025",
    type: "Accrual",
    description: "Monthly accrual for February",
    credit: 2.0,
    balance: 3.0,
    reference: "JOB-1021",
    leaveType: LeaveType.ANNUAL,
    year: "2025",
  },
  {
    id: "TX-006",
    date: "Mar 05, 2025",
    type: "AdjustmentCredit",
    description: "Comp-off credit adjustment",
    credit: 1.0,
    balance: 4.0,
    reference: "ADJ-442",
    leaveType: LeaveType.ANNUAL,
    year: "2025",
  },
  {
    id: "TX-007",
    date: "Mar 15, 2025",
    type: "Encashed",
    description: "Leave encashment request",
    debit: 1.0,
    balance: 3.0,
    reference: "ENC-001",
    leaveType: LeaveType.ANNUAL,
    year: "2025",
  },
  {
    id: "TX-008",
    date: "Mar 31, 2025",
    type: "Accrual",
    description: "Monthly accrual for March",
    credit: 2.0,
    balance: 5.0,
    reference: "JOB-1201",
    leaveType: LeaveType.ANNUAL,
    year: "2025",
  },
  {
    id: "TX-009",
    date: "Mar 31, 2025",
    type: "Lapsed",
    description: "Quarterly policy lapse",
    debit: 0.5,
    balance: 4.5,
    reference: "SYS-POL",
    leaveType: LeaveType.ANNUAL,
    year: "2025",
  },
  {
    id: "TX-010",
    date: "Jan 01, 2025",
    type: "Opening",
    description: "System opening balance",
    credit: 0,
    balance: 4.0,
    leaveType: LeaveType.CASUAL,
    year: "2025",
  },
  {
    id: "TX-011",
    date: "Jan 20, 2025",
    type: "LeaveTaken",
    description: "Casual leave approved",
    debit: 1.0,
    balance: 3.0,
    reference: "LV-2025-1101",
    leaveType: LeaveType.CASUAL,
    year: "2025",
  },
  {
    id: "TX-012",
    date: "Feb 11, 2025",
    type: "AdjustmentDebit",
    description: "Manual balance correction",
    debit: 0.5,
    balance: 2.5,
    reference: "ADJ-510",
    leaveType: LeaveType.CASUAL,
    year: "2025",
  },
  {
    id: "TX-013",
    date: "Jan 01, 2024",
    type: "Opening",
    description: "System opening balance",
    credit: 0,
    balance: 1.0,
    leaveType: LeaveType.ANNUAL,
    year: "2024",
  },
  {
    id: "TX-014",
    date: "Feb 01, 2024",
    type: "Accrual",
    description: "Monthly accrual for February",
    credit: 2.0,
    balance: 3.0,
    reference: "JOB-881",
    leaveType: LeaveType.ANNUAL,
    year: "2024",
  },
];

const PER_PAGE_OPTIONS = [5, 10, 20, 50] as const;

function getTransactionIcon(type: Transaction["type"]) {
  switch (type) {
    case "Opening":
      return (
        <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
          <History className="h-4 w-4" />
        </div>
      );
    case "Accrual":
      return (
        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600">
          <RefreshCw className="h-4 w-4" />
        </div>
      );
    case "CarryForward":
      return (
        <div className="rounded-xl bg-violet-100 p-2 text-violet-600">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      );
    case "AdjustmentCredit":
      return (
        <div className="rounded-xl bg-sky-100 p-2 text-sky-600">
          <PlusCircle className="h-4 w-4" />
        </div>
      );
    case "LeaveTaken":
      return (
        <div className="rounded-xl bg-rose-100 p-2 text-rose-600">
          <ArrowDownRight className="h-4 w-4" />
        </div>
      );
    case "AdjustmentDebit":
      return (
        <div className="rounded-xl bg-orange-100 p-2 text-orange-600">
          <MinusCircle className="h-4 w-4" />
        </div>
      );
    case "Lapsed":
      return (
        <div className="rounded-xl bg-slate-200 p-2 text-slate-500">
          <Clock3 className="h-4 w-4" />
        </div>
      );
    case "Encashed":
      return (
        <div className="rounded-xl bg-amber-100 p-2 text-amber-600">
          <CreditCard className="h-4 w-4" />
        </div>
      );
  }
}

function getTransactionLabel(type: Transaction["type"]) {
  switch (type) {
    case "Opening":
      return "Opening Balance";
    case "Accrual":
      return "Monthly Accrual";
    case "CarryForward":
      return "Carry Forward";
    case "AdjustmentCredit":
      return "Adjustment Credit";
    case "LeaveTaken":
      return "Leave Taken";
    case "AdjustmentDebit":
      return "Adjustment Debit";
    case "Lapsed":
      return "Lapsed";
    case "Encashed":
      return "Encashed";
  }
}

function getTransactionBadge(type: Transaction["type"]) {
  const map: Record<Transaction["type"], string> = {
    Opening: "bg-slate-100 text-slate-600 border-slate-200",
    Accrual: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CarryForward: "bg-violet-50 text-violet-700 border-violet-200",
    AdjustmentCredit: "bg-sky-50 text-sky-700 border-sky-200",
    LeaveTaken: "bg-rose-50 text-rose-700 border-rose-200",
    AdjustmentDebit: "bg-orange-50 text-orange-700 border-orange-200",
    Lapsed: "bg-slate-100 text-slate-600 border-slate-200",
    Encashed: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${map[type]}`}
    >
      {getTransactionLabel(type)}
    </span>
  );
}

function formatValue(value?: number, sign?: "credit" | "debit") {
  if (value === undefined) return "—";
  if (sign === "credit") return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  if (sign === "debit") return `-${value.toFixed(2)}`;
  return value.toFixed(2);
}

function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  const headers = Object.keys(rows[0] ?? {});
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function ReferenceDialog({
  reference,
  onClose,
}: {
  reference: string | null;
  onClose: () => void;
}) {
  if (!reference) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-[#111827]/35 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-gray-200 bg-white shadow-2xl">
        <div className="border-b border-gray-200 bg-gradient-to-br from-[#1E1D38] via-[#3A3662] to-[#6E5A9E] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Transaction Reference
              </p>
              <h3 className="mt-1 text-xl font-bold">{reference}</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/10 p-2 text-white/80 transition hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Reference Details
            </p>
            <p className="mt-2 text-sm text-gray-700">
              This is the linked audit reference for the selected ledger entry. In your real module,
              this can open the related leave request, adjustment, job run, or encashment record.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="h-11 rounded-xl bg-gradient-to-r from-[#443763] to-[#6E5A9E] px-5 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BalanceLedger() {
  const [selectedType, setSelectedType] = useState<string>(LeaveType.ANNUAL);
  const [selectedYear, setSelectedYear] = useState("2025");
  const [searchQuery, setSearchQuery] = useState("");
  const [txnTypeFilter, setTxnTypeFilter] = useState<string>("All");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PER_PAGE_OPTIONS)[number]>(10);
  const [showFilters, setShowFilters] = useState(false);
  const [activeReference, setActiveReference] = useState<string | null>(null);

  const transactionTypes = [
    "All",
    "Opening",
    "Accrual",
    "CarryForward",
    "AdjustmentCredit",
    "LeaveTaken",
    "AdjustmentDebit",
    "Lapsed",
    "Encashed",
  ];

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return MOCK_TRANSACTIONS.filter((tx) => {
      const matchesType = tx.leaveType === selectedType;
      const matchesYear = tx.year === selectedYear;
      const matchesTxnType = txnTypeFilter === "All" || tx.type === txnTypeFilter;
      const matchesSearch =
        !q ||
        tx.id.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        (tx.reference ?? "").toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q);

      return matchesType && matchesYear && matchesTxnType && matchesSearch;
    });
  }, [selectedType, selectedYear, txnTypeFilter, searchQuery]);

  const summary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        switch (tx.type) {
          case "Opening":
            acc.opening += tx.credit ?? 0;
            break;
          case "Accrual":
            acc.accrued += tx.credit ?? 0;
            break;
          case "CarryForward":
            acc.carryForward += tx.credit ?? 0;
            break;
          case "AdjustmentCredit":
            acc.adjustments += tx.credit ?? 0;
            break;
          case "AdjustmentDebit":
            acc.adjustments -= tx.debit ?? 0;
            break;
          case "LeaveTaken":
            acc.leaveTaken += tx.debit ?? 0;
            break;
          case "Lapsed":
            acc.lapsed += tx.debit ?? 0;
            break;
          case "Encashed":
            acc.encashed += tx.debit ?? 0;
            break;
        }

        acc.currentBalance = tx.balance;
        return acc;
      },
      {
        opening: 0,
        accrued: 0,
        carryForward: 0,
        adjustments: 0,
        leaveTaken: 0,
        lapsed: 0,
        encashed: 0,
        currentBalance: 0,
      }
    );
  }, [filteredTransactions]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));

  const paginatedTransactions = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, pageIndex, pageSize]);

  const from = filteredTransactions.length === 0 ? 0 : (pageIndex - 1) * pageSize + 1;
  const to = Math.min(pageIndex * pageSize, filteredTransactions.length);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setPageIndex(page);
  };

  const handleExport = () => {
    const rows = filteredTransactions.map((tx) => ({
      ID: tx.id,
      Date: tx.date,
      Type: getTransactionLabel(tx.type),
      Description: tx.description,
      Credit: tx.credit ?? "",
      Debit: tx.debit ?? "",
      Balance: tx.balance,
      Reference: tx.reference ?? "",
      LeaveType: tx.leaveType,
      Year: tx.year,
    }));

    downloadCsv(
      `balance-ledger-${selectedType.replace(/\s+/g, "-").toLowerCase()}-${selectedYear}.csv`,
      rows
    );
  };

  const resetFilters = () => {
    setSearchQuery("");
    setTxnTypeFilter("All");
    setPageIndex(1);
  };

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, pageIndex - 1);
    const end = Math.min(totalPages, pageIndex + 1);

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [pageIndex, totalPages]);

  const onChangeType = (value: string) => {
    setSelectedType(value);
    setPageIndex(1);
  };

  const onChangeYear = (value: string) => {
    setSelectedYear(value);
    setPageIndex(1);
  };

  const onChangePageSize = (value: number) => {
    setPageSize(value as (typeof PER_PAGE_OPTIONS)[number]);
    setPageIndex(1);
  };

  return (
    <>
      <div
        className="min-h-screen bg-white p-4 lg:p-8"
        style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}
      >
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#1E1D38]">Balance Ledger</h2>
              <p className="mt-1 text-sm text-gray-600">
                Detailed audit trail of your leave balance movements and system calculations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedType}
                onChange={(e) => onChangeType(e.target.value)}
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none transition focus:border-[#443763]"
              >
                {Object.values(LeaveType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => onChangeYear(e.target.value)}
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none transition focus:border-[#443763]"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>

              <button
                onClick={handleExport}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:shadow-lg"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-[#1E1D38] via-[#3A3662] to-[#6E5A9E] p-6 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                    {selectedType}
                  </p>
                  <h3 className="mt-2 text-xl font-bold">{selectedYear} Summary</h3>
                  <p className="mt-1 text-sm text-white/70">Dynamic totals based on your current filters.</p>
                </div>

                <div className="space-y-4 p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Opening Balance</span>
                      <span className="font-semibold text-gray-900">{summary.opening.toFixed(2)} d</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">+ Accrued</span>
                      <span className="font-semibold text-emerald-600">
                        +{summary.accrued.toFixed(2)} d
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">+ Carry Forward</span>
                      <span className="font-semibold text-violet-600">
                        +{summary.carryForward.toFixed(2)} d
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        {summary.adjustments >= 0 ? "+ Adjustments" : "- Adjustments"}
                      </span>
                      <span
                        className={`font-semibold ${
                          summary.adjustments >= 0 ? "text-sky-600" : "text-orange-600"
                        }`}
                      >
                        {summary.adjustments >= 0 ? "+" : ""}
                        {summary.adjustments.toFixed(2)} d
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">- Leave Taken</span>
                      <span className="font-semibold text-rose-600">
                        -{summary.leaveTaken.toFixed(2)} d
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">- Lapsed</span>
                      <span className="font-semibold text-slate-500">
                        -{summary.lapsed.toFixed(2)} d
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">- Encashed</span>
                      <span className="font-semibold text-amber-600">
                        -{summary.encashed.toFixed(2)} d
                      </span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between border-t border-gray-100 pt-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#443763]">
                        Current Balance
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-[#1E1D38]">
                      {summary.currentBalance.toFixed(2)}
                      <span className="ml-1 text-xs font-medium text-gray-400">Days</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gray-50 p-4 text-gray-500">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-[11px] leading-5">
                    Ledger updates can be scheduled or real-time depending on your final HRMS rules and job setup.
                  </p>
                </div>
              </div>
            </div>

            {/* Listing */}
            <div className="lg:col-span-3 space-y-6">
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50/70 px-6 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-semibold text-[#1E1D38]">Transactions</h4>
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Live Audit
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPageIndex(1);
                          }}
                          placeholder="Search ID, description, reference..."
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#443763]"
                        />
                      </div>

                      <button
                        onClick={() => setShowFilters((prev) => !prev)}
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        <Filter className="h-4 w-4" />
                        Filters
                      </button>
                    </div>
                  </div>

                  {showFilters && (
                    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-200 pt-4 sm:grid-cols-3">
                      <select
                        value={txnTypeFilter}
                        onChange={(e) => {
                          setTxnTypeFilter(e.target.value);
                          setPageIndex(1);
                        }}
                        className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-[#443763]"
                      >
                        {transactionTypes.map((type) => (
                          <option key={type} value={type}>
                            {type === "All" ? "All Transaction Types" : getTransactionLabel(type as Transaction["type"])}
                          </option>
                        ))}
                      </select>

                      <select
                        value={pageSize}
                        onChange={(e) => onChangePageSize(Number(e.target.value))}
                        className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-[#443763]"
                      >
                        {PER_PAGE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {size} per page
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={resetFilters}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        <X className="h-4 w-4" />
                        Reset Filters
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left">
                    <thead className="bg-gray-50/40">
                      <tr>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                          Date
                        </th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                          Transaction
                        </th>
                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                          Description
                        </th>
                        <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                          Credit
                        </th>
                        <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                          Debit
                        </th>
                        <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                          Balance
                        </th>
                        <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                          Reference
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {paginatedTransactions.length > 0 ? (
                        paginatedTransactions.map((tx) => (
                          <tr key={tx.id} className="group transition hover:bg-gray-50/70">
                            <td className="px-6 py-5">
                              <span className="text-sm text-gray-500">{tx.date}</span>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                {getTransactionIcon(tx.type)}
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-gray-800">
                                    {getTransactionLabel(tx.type)}
                                  </p>
                                  {getTransactionBadge(tx.type)}
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div>
                                <p className="text-sm text-gray-600">{tx.description}</p>
                                <p className="mt-1 text-[11px] text-gray-400">{tx.id}</p>
                              </div>
                            </td>

                            <td className="px-6 py-5 text-right">
                              <span
                                className={`text-sm font-semibold ${
                                  tx.credit !== undefined && tx.credit > 0
                                    ? "text-emerald-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {formatValue(tx.credit, "credit")}
                              </span>
                            </td>

                            <td className="px-6 py-5 text-right">
                              <span
                                className={`text-sm font-semibold ${
                                  tx.debit !== undefined ? "text-rose-600" : "text-gray-400"
                                }`}
                              >
                                {tx.debit !== undefined ? formatValue(tx.debit, "debit") : "—"}
                              </span>
                            </td>

                            <td className="px-6 py-5 text-right">
                              <span className="inline-flex rounded-lg bg-[#443763]/8 px-2.5 py-1 text-sm font-semibold text-[#443763]">
                                {tx.balance.toFixed(2)}
                              </span>
                            </td>

                            <td className="px-6 py-5 text-right">
                              {tx.reference ? (
                                <button
                                  onClick={() => setActiveReference(tx.reference ?? null)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#443763] transition hover:underline"
                                >
                                  {tx.reference}
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <span className="text-sm text-gray-300">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center">
                            <div className="mx-auto max-w-md">
                              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                                <Download className="h-6 w-6" />
                              </div>
                              <h4 className="mt-4 text-base font-semibold text-gray-700">
                                No transactions found
                              </h4>
                              <p className="mt-1 text-sm text-gray-500">
                                Try changing year, leave type, search, or transaction filters.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{from}</span> to{" "}
                    <span className="font-semibold text-gray-700">{to}</span> of{" "}
                    <span className="font-semibold text-gray-700">{filteredTransactions.length}</span> transactions
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(pageIndex - 1)}
                      disabled={pageIndex === 1}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      Prev
                    </button>

                    {pageNumbers.map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`h-9 min-w-9 rounded-xl px-3 text-sm font-semibold transition ${
                          page === pageIndex
                            ? "bg-[#443763] text-white"
                            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => goToPage(pageIndex + 1)}
                      disabled={pageIndex === totalPages}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-5 rounded-3xl border border-amber-200 bg-amber-50 p-6 md:flex-row md:items-center">
                <div className="rounded-2xl bg-white p-4 text-amber-600 shadow-sm">
                  <Zap className="h-7 w-7" />
                </div>

                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-amber-900">Missing a transaction?</h4>
                  <p className="mt-1 text-sm text-amber-800/80">
                    If you notice any issue in your leave balance history, contact HRBP or raise an audit request from this module.
                  </p>
                </div>

                <button className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700">
                  Open Audit Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReferenceDialog reference={activeReference} onClose={() => setActiveReference(null)} />
    </>
  );
}