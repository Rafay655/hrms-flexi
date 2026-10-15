"use client";

import React, { Fragment, useMemo, useState } from "react";
import {
  Search,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  Users,
  Briefcase,
  CalendarDays,
  Download,
  RefreshCw,
  ArrowUpDown,
  ChevronsUpDown,
  ChevronDown,
} from "lucide-react";

type LeaveBucket = {
  used: number;
  total: number;
};

type TeamTransaction = {
  id: string;
  type: "Accrual" | "Leave" | "Carry Forward" | "Adjustment";
  date: string;
  description: string;
  qty: number;
};

type EmployeeBalance = {
  id: string;
  name: string;
  avatar: string;
  dept: string;
  designation: string;
  annual: LeaveBucket;
  casual: LeaveBucket;
  sick: LeaveBucket;
  compOff: LeaveBucket;
  isOnLeave: boolean;
  transactions: TeamTransaction[];
};

const DEFAULT_PER_PAGE = 10;

const MOCK_TEAM: EmployeeBalance[] = [
  {
    id: "EMP-101",
    name: "John Doe",
    avatar: "JD",
    dept: "Engineering",
    designation: "Senior Software Engineer",
    annual: { used: 8, total: 24 },
    casual: { used: 3, total: 10 },
    sick: { used: 2, total: 12 },
    compOff: { used: 0, total: 2 },
    isOnLeave: false,
    transactions: [
      { id: "TRX-1", type: "Accrual", date: "2026-01-31", description: "Monthly annual leave accrual", qty: 2 },
      { id: "TRX-2", type: "Leave", date: "2026-01-15", description: "Annual leave request approved", qty: -3 },
      { id: "TRX-3", type: "Carry Forward", date: "2026-01-01", description: "Carry forward from previous year", qty: 5 },
    ],
  },
  {
    id: "EMP-102",
    name: "Sara Khan",
    avatar: "SK",
    dept: "Product",
    designation: "Product Manager",
    annual: { used: 22, total: 24 },
    casual: { used: 9, total: 10 },
    sick: { used: 1, total: 12 },
    compOff: { used: 1, total: 1 },
    isOnLeave: true,
    transactions: [
      { id: "TRX-4", type: "Leave", date: "2026-02-18", description: "Annual leave in progress", qty: -2 },
      { id: "TRX-5", type: "Accrual", date: "2026-01-31", description: "Monthly accrual", qty: 2 },
      { id: "TRX-6", type: "Adjustment", date: "2026-01-12", description: "Manager balance correction", qty: 1 },
    ],
  },
  {
    id: "EMP-103",
    name: "Ahmed Ali",
    avatar: "AA",
    dept: "Engineering",
    designation: "Backend Engineer",
    annual: { used: 12, total: 24 },
    casual: { used: 5, total: 10 },
    sick: { used: 11, total: 12 },
    compOff: { used: 2, total: 2 },
    isOnLeave: false,
    transactions: [
      { id: "TRX-7", type: "Leave", date: "2026-02-10", description: "Sick leave entry", qty: -2 },
      { id: "TRX-8", type: "Accrual", date: "2026-01-31", description: "Monthly accrual", qty: 2 },
      { id: "TRX-9", type: "Adjustment", date: "2026-01-08", description: "Medical balance update", qty: 1 },
    ],
  },
  {
    id: "EMP-104",
    name: "Zoya Malik",
    avatar: "ZM",
    dept: "Design",
    designation: "UI/UX Designer",
    annual: { used: 5, total: 24 },
    casual: { used: 2, total: 10 },
    sick: { used: 0, total: 12 },
    compOff: { used: 0, total: 0 },
    isOnLeave: false,
    transactions: [
      { id: "TRX-10", type: "Accrual", date: "2026-01-31", description: "Monthly accrual", qty: 2 },
      { id: "TRX-11", type: "Carry Forward", date: "2026-01-01", description: "Carry forward", qty: 3 },
    ],
  },
  {
    id: "EMP-105",
    name: "Ali Raza",
    avatar: "AR",
    dept: "Engineering",
    designation: "Tech Lead",
    annual: { used: 24, total: 24 },
    casual: { used: 10, total: 10 },
    sick: { used: 12, total: 12 },
    compOff: { used: 5, total: 5 },
    isOnLeave: false,
    transactions: [
      { id: "TRX-12", type: "Leave", date: "2026-02-01", description: "Final annual leave booking", qty: -2 },
      { id: "TRX-13", type: "Adjustment", date: "2026-01-16", description: "Comp off usage adjustment", qty: -1 },
    ],
  },
  {
    id: "EMP-106",
    name: "Mona Shah",
    avatar: "MS",
    dept: "Engineering",
    designation: "QA Engineer",
    annual: { used: 2, total: 24 },
    casual: { used: 1, total: 10 },
    sick: { used: 1, total: 12 },
    compOff: { used: 0, total: 3 },
    isOnLeave: false,
    transactions: [
      { id: "TRX-14", type: "Accrual", date: "2026-01-31", description: "Monthly accrual", qty: 2 },
      { id: "TRX-15", type: "Leave", date: "2026-01-11", description: "Casual leave used", qty: -1 },
    ],
  },
  {
    id: "EMP-107",
    name: "Hamza Aziz",
    avatar: "HA",
    dept: "Design",
    designation: "Motion Designer",
    annual: { used: 15, total: 24 },
    casual: { used: 4, total: 10 },
    sick: { used: 2, total: 12 },
    compOff: { used: 1, total: 1 },
    isOnLeave: false,
    transactions: [
      { id: "TRX-16", type: "Leave", date: "2026-02-04", description: "Annual leave booking", qty: -4 },
      { id: "TRX-17", type: "Accrual", date: "2026-01-31", description: "Monthly accrual", qty: 2 },
    ],
  },
];

type SortField =
  | "name"
  | "dept"
  | "annual"
  | "casual"
  | "sick"
  | "compOff"
  | "totalRemaining"
  | "status";

type SortOrder = "asc" | "desc";

function getRemaining(bucket: LeaveBucket) {
  return Math.max(bucket.total - bucket.used, 0);
}

function getTotalRemaining(emp: EmployeeBalance) {
  return (
    getRemaining(emp.annual) +
    getRemaining(emp.casual) +
    getRemaining(emp.sick) +
    getRemaining(emp.compOff)
  );
}

function formatDate(input: string) {
  return new Date(input).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function downloadCsv(rows: EmployeeBalance[]) {
  const headers = [
    "Employee ID",
    "Name",
    "Department",
    "Designation",
    "Annual Remaining",
    "Casual Remaining",
    "Sick Remaining",
    "Comp Off Remaining",
    "Total Remaining",
    "On Leave",
  ];

  const csvRows = rows.map((emp) => [
    emp.id,
    emp.name,
    emp.dept,
    emp.designation,
    getRemaining(emp.annual),
    getRemaining(emp.casual),
    getRemaining(emp.sick),
    getRemaining(emp.compOff),
    getTotalRemaining(emp),
    emp.isOnLeave ? "Yes" : "No",
  ]);

  const csv = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "team-balances.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-brand-900">{value}</p>
          <p className="mt-1 text-sm text-brand-700">{subtitle}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function BalanceCell({
  used,
  total,
}: {
  used: number;
  total: number;
}) {
  const remaining = Math.max(total - used, 0);
  const width = total > 0 ? (remaining / total) * 100 : 0;

  const textClass =
    remaining === 0
      ? "text-red-600"
      : remaining < 3
      ? "text-amber-600"
      : "text-brand-900";

  const barClass =
    remaining === 0
      ? "bg-red-500"
      : remaining < 3
      ? "bg-amber-500"
      : "bg-brand-800";

  return (
    <div className="min-w-[92px]">
      <div className={`text-sm font-semibold ${textClass}`}>
        {remaining} / {total}
      </div>
      <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ employee }: { employee: EmployeeBalance }) {
  const totalRemaining = getTotalRemaining(employee);

  if (employee.isOnLeave) {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        On Leave
      </span>
    );
  }

  if (totalRemaining < 5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Low Balance
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800">
      <CheckCircle2 className="h-3.5 w-3.5" />
      OK
    </span>
  );
}

function SortableHeader({
  label,
  field,
  sortField,
  sortOrder,
  onSort,
  align = "left",
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  align?: "left" | "center" | "right";
}) {
  const isActive = sortField === field;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-wider text-brand-800 transition hover:text-brand-900 ${
        align === "center"
          ? "justify-center"
          : align === "right"
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <span>{label}</span>
      {isActive ? (
        <ChevronDown className={`h-3.5 w-3.5 transition ${sortOrder === "asc" ? "rotate-180" : ""}`} />
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-70" />
      )}
    </button>
  );
}

export default function TeamBalances() {
  const [employees] = useState<EmployeeBalance[]>(MOCK_TEAM);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const departments = useMemo(() => {
    return ["All", ...Array.from(new Set(employees.map((emp) => emp.dept)))];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return employees.filter((emp) => {
      const matchesSearch =
        !keyword ||
        emp.name.toLowerCase().includes(keyword) ||
        emp.id.toLowerCase().includes(keyword) ||
        emp.dept.toLowerCase().includes(keyword) ||
        emp.designation.toLowerCase().includes(keyword);

      const matchesDept = deptFilter === "All" || emp.dept === deptFilter;

      const totalRemaining = getTotalRemaining(emp);
      const computedStatus = emp.isOnLeave
        ? "On Leave"
        : totalRemaining < 5
        ? "Low Balance"
        : "OK";

      const matchesStatus = statusFilter === "All" || computedStatus === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, search, deptFilter, statusFilter]);

  const sortedEmployees = useMemo(() => {
    const sorted = [...filteredEmployees];

    sorted.sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "dept":
          aValue = a.dept.toLowerCase();
          bValue = b.dept.toLowerCase();
          break;
        case "annual":
          aValue = getRemaining(a.annual);
          bValue = getRemaining(b.annual);
          break;
        case "casual":
          aValue = getRemaining(a.casual);
          bValue = getRemaining(b.casual);
          break;
        case "sick":
          aValue = getRemaining(a.sick);
          bValue = getRemaining(b.sick);
          break;
        case "compOff":
          aValue = getRemaining(a.compOff);
          bValue = getRemaining(b.compOff);
          break;
        case "totalRemaining":
          aValue = getTotalRemaining(a);
          bValue = getTotalRemaining(b);
          break;
        case "status":
          aValue = a.isOnLeave ? 0 : getTotalRemaining(a) < 5 ? 1 : 2;
          bValue = b.isOnLeave ? 0 : getTotalRemaining(b) < 5 ? 1 : 2;
          break;
        default:
          break;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredEmployees, sortField, sortOrder]);

  const totalEntries = sortedEmployees.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedEmployees = sortedEmployees.slice(startIndex, startIndex + perPage);
  const showingFrom = totalEntries > 0 ? startIndex + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(startIndex + perPage, totalEntries) : 0;

  const totals = useMemo(() => {
    const teamCount = employees.length;
    const onLeaveCount = employees.filter((emp) => emp.isOnLeave).length;
    const lowBalanceCount = employees.filter(
      (emp) => !emp.isOnLeave && getTotalRemaining(emp) < 5
    ).length;

    const totalRemainingDays = employees.reduce(
      (sum, emp) => sum + getTotalRemaining(emp),
      0
    );

    return {
      teamCount,
      onLeaveCount,
      lowBalanceCount,
      totalRemainingDays,
    };
  }, [employees]);

  const averages = useMemo(() => {
    if (employees.length === 0) {
      return {
        annual: 0,
        casual: 0,
        sick: 0,
        compOff: 0,
      };
    }

    return {
      annual:
        employees.reduce((sum, emp) => sum + getRemaining(emp.annual), 0) /
        employees.length,
      casual:
        employees.reduce((sum, emp) => sum + getRemaining(emp.casual), 0) /
        employees.length,
      sick:
        employees.reduce((sum, emp) => sum + getRemaining(emp.sick), 0) /
        employees.length,
      compOff:
        employees.reduce((sum, emp) => sum + getRemaining(emp.compOff), 0) /
        employees.length,
    };
  }, [employees]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortOrder("asc");
  };

  const handleResetFilters = () => {
    setSearch("");
    setDeptFilter("All");
    setStatusFilter("All");
    setPage(1);
    setExpandedRow(null);
    setSortField("name");
    setSortOrder("asc");
  };

  React.useEffect(() => {
    setPage(1);
  }, [search, deptFilter, statusFilter, perPage]);

  React.useEffect(() => {
    if (expandedRow && !paginatedEmployees.some((emp) => emp.id === expandedRow)) {
      setExpandedRow(null);
    }
  }, [expandedRow, paginatedEmployees]);

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Team Balances</h1>
            <p className="mt-1 text-sm text-brand-700">
              Monitor team leave entitlements, remaining balances, and current availability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>

            <button
              type="button"
              onClick={() => downloadCsv(sortedEmployees)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Team Members"
            value={String(totals.teamCount)}
            subtitle="Employees in your visible team"
            icon={Users}
          />
          <StatCard
            title="On Leave"
            value={String(totals.onLeaveCount)}
            subtitle="Currently unavailable today"
            icon={CalendarDays}
          />
          <StatCard
            title="Low Balance"
            value={String(totals.lowBalanceCount)}
            subtitle="Need review or planning"
            icon={AlertTriangle}
          />
          <StatCard
            title="Remaining Days"
            value={String(totals.totalRemainingDays)}
            subtitle="Across all visible leave buckets"
            icon={Briefcase}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  placeholder="Search by employee, ID, department or designation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition placeholder:text-brand-400 focus:border-brand-800"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept === "All" ? "All Departments" : dept}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                >
                  <option value="All">All Statuses</option>
                  <option value="OK">OK</option>
                  <option value="Low Balance">Low Balance</option>
                  <option value="On Leave">On Leave</option>
                </select>

                <select
                  value={String(perPage)}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                >
                  {[10, 20, 50, 100].map((size) => (
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
                  <span className="font-semibold text-brand-900">{totals.onLeaveCount}</span> On Leave
                </span>
                <span className="h-3 w-px bg-brand-200" />
                <span>
                  <span className="font-semibold text-brand-900">{totals.lowBalanceCount}</span> Low Balance
                </span>
                <span className="h-3 w-px bg-brand-200" />
                <span>
                  <span className="font-semibold text-brand-900">{totals.totalRemainingDays}</span> Total Days
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px]">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left">
                    <SortableHeader
                      label="Employee"
                      field="name"
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-5 py-3 text-left">
                    <SortableHeader
                      label="Annual"
                      field="annual"
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-5 py-3 text-left">
                    <SortableHeader
                      label="Casual"
                      field="casual"
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-5 py-3 text-left">
                    <SortableHeader
                      label="Sick"
                      field="sick"
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-5 py-3 text-left">
                    <SortableHeader
                      label="Comp Off"
                      field="compOff"
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-5 py-3 text-center">
                    <SortableHeader
                      label="Total Remaining"
                      field="totalRemaining"
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      align="center"
                    />
                  </th>
                  <th className="px-5 py-3 text-left">
                    <SortableHeader
                      label="Status"
                      field="status"
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                          <Search className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold text-brand-900">
                          No team balances found
                        </h3>
                        <p className="mt-1 text-sm text-brand-700">
                          Try changing your search, department, or status filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp) => {
                    const totalRemaining = getTotalRemaining(emp);
                    const isExpanded = expandedRow === emp.id;

                    return (
                      <Fragment key={emp.id}>
                        <tr
                          className={`cursor-pointer transition hover:bg-brand-100 ${
                            isExpanded ? "bg-brand-50" : ""
                          }`}
                          onClick={() => setExpandedRow(isExpanded ? null : emp.id)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-sm font-bold text-white">
                                {emp.avatar}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-brand-900">{emp.name}</p>
                                <p className="mt-0.5 text-[11px] text-brand-700">
                                  {emp.id} • {emp.dept} • {emp.designation}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <BalanceCell used={emp.annual.used} total={emp.annual.total} />
                          </td>

                          <td className="px-5 py-4">
                            <BalanceCell used={emp.casual.used} total={emp.casual.total} />
                          </td>

                          <td className="px-5 py-4">
                            <BalanceCell used={emp.sick.used} total={emp.sick.total} />
                          </td>

                          <td className="px-5 py-4">
                            {emp.compOff.total > 0 ? (
                              <BalanceCell used={emp.compOff.used} total={emp.compOff.total} />
                            ) : (
                              <span className="text-sm text-brand-400">—</span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`text-sm font-semibold ${
                                  totalRemaining < 5 ? "text-red-600" : "text-brand-900"
                                }`}
                              >
                                {totalRemaining} d
                              </span>
                              {totalRemaining < 5 && !emp.isOnLeave ? (
                                <AlertTriangle className="mt-1 h-3.5 w-3.5 text-red-500" />
                              ) : null}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge employee={emp} />
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRow(isExpanded ? null : emp.id);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-brand-800 transition hover:bg-brand-100"
                            >
                              View
                              <ChevronRight
                                className={`h-4 w-4 transition ${isExpanded ? "rotate-90" : ""}`}
                              />
                            </button>
                          </td>
                        </tr>

                        {isExpanded ? (
                          <tr className="bg-brand-50/40">
                            <td colSpan={8} className="px-5 py-5">
                              <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
                                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                                  <div className="border-b border-gray-200 px-4 py-3">
                                    <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-800">
                                      <Info className="h-4 w-4" />
                                      Recent Transactions
                                    </h4>
                                  </div>

                                  <div className="divide-y divide-gray-200">
                                    {emp.transactions.length === 0 ? (
                                      <div className="px-4 py-6 text-sm text-brand-700">
                                        No recent transactions found.
                                      </div>
                                    ) : (
                                      emp.transactions.map((transaction) => (
                                        <div
                                          key={transaction.id}
                                          className="flex items-center justify-between gap-4 px-4 py-3"
                                        >
                                          <div>
                                            <p className="text-sm font-semibold text-brand-900">
                                              {transaction.description}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-brand-700">
                                              {transaction.type} • {formatDate(transaction.date)}
                                            </p>
                                          </div>

                                          <span
                                            className={`text-sm font-semibold ${
                                              transaction.qty >= 0
                                                ? "text-emerald-600"
                                                : "text-red-600"
                                            }`}
                                          >
                                            {transaction.qty >= 0 ? "+" : ""}
                                            {transaction.qty.toFixed(2)} d
                                          </span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                                      Employee Snapshot
                                    </h4>

                                    <div className="mt-4 space-y-3">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-brand-700">Employee ID</span>
                                        <span className="font-semibold text-brand-900">{emp.id}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-brand-700">Department</span>
                                        <span className="font-semibold text-brand-900">{emp.dept}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-brand-700">Designation</span>
                                        <span className="font-semibold text-brand-900">
                                          {emp.designation}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-brand-700">Total Remaining</span>
                                        <span className="font-semibold text-brand-900">
                                          {totalRemaining} days
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-brand-700">Availability</span>
                                        <span className="font-semibold text-brand-900">
                                          {emp.isOnLeave ? "Currently on leave" : "Available"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                                      Quick Insight
                                    </h4>
                                    <div className="mt-4 space-y-3 text-sm">
                                      <div className="flex items-center justify-between">
                                        <span className="text-brand-700">Annual balance</span>
                                        <span className="font-semibold text-brand-900">
                                          {getRemaining(emp.annual)} days
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-brand-700">Casual balance</span>
                                        <span className="font-semibold text-brand-900">
                                          {getRemaining(emp.casual)} days
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-brand-700">Sick balance</span>
                                        <span className="font-semibold text-brand-900">
                                          {getRemaining(emp.sick)} days
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-brand-700">Comp off</span>
                                        <span className="font-semibold text-brand-900">
                                          {getRemaining(emp.compOff)} days
                                        </span>
                                      </div>
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

              <tfoot className="border-t border-gray-200 bg-white">
                <tr>
                  <td className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Team Average
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                    {averages.annual.toFixed(1)} d
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                    {averages.casual.toFixed(1)} d
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                    {averages.sick.toFixed(1)} d
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                    {averages.compOff.toFixed(1)} d
                  </td>
                  <td className="px-5 py-4 text-center text-sm font-semibold text-brand-900">
                    Σ {totals.totalRemainingDays} days
                  </td>
                  <td colSpan={2} className="px-5 py-4" />
                </tr>
              </tfoot>
            </table>
          </div>

          {paginatedEmployees.length > 0 ? (
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
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
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
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
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