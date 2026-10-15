"use client";

import React, { useMemo, useState } from "react";
import {
  Users,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  UserCheck,
  CalendarClock,
  Globe,
  ShieldCheck,
  Layers,
  ExternalLink,
  Info,
  Download,
  Briefcase,
  Trash2,
  Eye,
  Wallet,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";

import { PayrollGroupForm } from "@/components/PayrollGroupForm";
 enum PayrollStatus {
  Draft = "Draft",
  Pending = "Pending",
  Approved = "Approved",
  Locked = "Locked",
  Published = "Published",
}
interface PayrollGroup {
  id: string;
  code: string;
  name: string;
  criteria: string;
  employeeCount: number;
  currency: string;
  officer: string;
  status: PayrollStatus;
  frequency: "Monthly" | "Bi-Weekly" | "Weekly";
  lastRun: string;
}

const DEFAULT_PER_PAGE = 10;

const MOCK_GROUPS: PayrollGroup[] = [
  {
    id: "GRP-001",
    code: "CORP-ISL",
    name: "Islamabad Corporate Staff",
    criteria: "Location: ISB AND Type: Permanent",
    employeeCount: 145,
    currency: "PKR",
    officer: "Zainab Siddiqui",
    status: PayrollStatus.Approved,
    frequency: "Monthly",
    lastRun: "Dec 31, 2024",
  },
  {
    id: "GRP-002",
    code: "FACT-KHI",
    name: "Karachi Factory Workers",
    criteria: "Dept: Production AND Wage: Daily",
    employeeCount: 280,
    currency: "PKR",
    officer: "Ahmed Raza",
    status: PayrollStatus.Locked,
    frequency: "Weekly",
    lastRun: "Jan 12, 2025",
  },
  {
    id: "GRP-003",
    code: "EXEC-INT",
    name: "International Executives",
    criteria: "Grade: G20+",
    employeeCount: 12,
    currency: "USD",
    officer: "Jane Doe",
    status: PayrollStatus.Published,
    frequency: "Monthly",
    lastRun: "Dec 28, 2024",
  },
  {
    id: "GRP-004",
    code: "SALE-COMM",
    name: "Sales Commission Only",
    criteria: "Dept: Sales AND Sub-type: Comm-based",
    employeeCount: 35,
    currency: "PKR",
    officer: "Ahmed Raza",
    status: PayrollStatus.Draft,
    frequency: "Bi-Weekly",
    lastRun: "N/A",
  },
  {
    id: "GRP-005",
    code: "CONT-FT",
    name: "Fixed Term Contractors",
    criteria: "Contract: Active AND EndDate > Today",
    employeeCount: 13,
    currency: "PKR",
    officer: "Zainab Siddiqui",
    status: PayrollStatus.Pending,
    frequency: "Monthly",
    lastRun: "Dec 31, 2024",
  },
];

const FREQUENCY_OPTIONS: Array<"All" | PayrollGroup["frequency"]> = [
  "All",
  "Monthly",
  "Bi-Weekly",
  "Weekly",
];

const STATUS_OPTIONS = ["All", "Approved", "Locked", "Published", "Draft", "Pending"];

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getStatusLabel = (status: PayrollStatus) => String(status);

const getNextCycleLabel = (frequency: PayrollGroup["frequency"]) => {
  if (frequency === "Weekly") return "Next 7-day cycle";
  if (frequency === "Bi-Weekly") return "Next 14-day cycle";
  return "Month-end cycle";
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

 const PayrollGroupsList: React.FC = () => {
  const [groups, setGroups] = useState<PayrollGroup[]>(MOCK_GROUPS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [frequencyFilter, setFrequencyFilter] =
    useState<"All" | PayrollGroup["frequency"]>("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PayrollGroup | null>(null);

  const filteredGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return groups.filter((group) => {
      const matchesSearch =
        !needle ||
        [
          group.name,
          group.code,
          group.criteria,
          group.officer,
          group.currency,
          group.frequency,
          getStatusLabel(group.status),
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      const matchesFrequency =
        frequencyFilter === "All" || group.frequency === frequencyFilter;

      const matchesStatus =
        statusFilter === "All" || getStatusLabel(group.status) === statusFilter;

      return matchesSearch && matchesFrequency && matchesStatus;
    });
  }, [groups, search, frequencyFilter, statusFilter]);

  const totalEntries = filteredGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredGroups.slice(start, start + perPage);
  }, [filteredGroups, currentPage, perPage]);

  const approvedCount = groups.filter(
    (group) => getStatusLabel(group.status) === "Approved"
  ).length;
  const lockedCount = groups.filter(
    (group) => getStatusLabel(group.status) === "Locked"
  ).length;
  const totalEmployees = groups.reduce(
    (sum, group) => sum + group.employeeCount,
    0
  );
  const currenciesEnabled = Array.from(new Set(groups.map((g) => g.currency))).join(
    ", "
  );

  const handleFiltersChange = (
    nextSearch?: string,
    nextFrequency?: "All" | PayrollGroup["frequency"],
    nextStatus?: string,
    nextPerPage?: number
  ) => {
    if (typeof nextSearch === "string") setSearch(nextSearch);
    if (nextFrequency) setFrequencyFilter(nextFrequency);
    if (typeof nextStatus === "string") setStatusFilter(nextStatus);
    if (typeof nextPerPage === "number") setPerPage(nextPerPage);
    setPage(1);
  };

  const handleExport = () => {
    const headers = [
      "Sr",
      "Group Code",
      "Group Name",
      "Criteria",
      "Employees",
      "Currency",
      "Assigned Officer",
      "Frequency",
      "Status",
      "Last Run",
    ];

    const rows = filteredGroups.map((group, index) => [
      index + 1,
      group.code,
      group.name,
      group.criteria,
      group.employeeCount,
      group.currency,
      group.officer,
      group.frequency,
      getStatusLabel(group.status),
      group.lastRun,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payroll-groups.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    setGroups((prev) => prev.filter((group) => group.id !== deleteTarget.id));
    if (expandedId === deleteTarget.id) setExpandedId(null);
    setDeleteTarget(null);
  };

  const handleSaveGroup = (data: any) => {
    const nextNumber = groups.length + 1;
    const newId = `GRP-${String(nextNumber).padStart(3, "0")}`;

    const newGroup: PayrollGroup = {
      id: newId,
      code: (data?.code || newId).toString().trim(),
      name: (data?.name || "Untitled Payroll Group").toString().trim(),
      criteria: (data?.criteria || "Criteria not configured yet").toString().trim(),
      employeeCount: Number(data?.employeeCount ?? 0),
      currency: (data?.currency || "PKR").toString().trim().toUpperCase(),
      officer: (data?.officer || "Unassigned").toString().trim(),
      status: (data?.status || PayrollStatus.Draft) as PayrollStatus,
      frequency: (data?.frequency || "Monthly") as PayrollGroup["frequency"],
      lastRun: (data?.lastRun || "Not processed yet").toString().trim(),
    };

    setGroups((prev) => [newGroup, ...prev]);
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
                <Briefcase className="h-5 w-5 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-brand-900">Payroll Groups</h2>
                <p className="mt-0.5 text-sm text-brand-700">
                  Manage employee payroll segmentation, cycles, and processing groups
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
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <Plus className="h-4 w-4" />
                Add Payroll Group
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Total Groups
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">{groups.length}</p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Layers className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Approved Groups
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">{approvedCount}</p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <ShieldCheck className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Locked Groups
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">{lockedCount}</p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <CalendarClock className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Total Employees
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {totalEmployees.toLocaleString()}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Users className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters + Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                type="text"
                placeholder="Search by name, code, officer, criteria..."
                value={search}
                onChange={(e) => handleFiltersChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white">
                  <Filter className="h-4 w-4 text-brand-700" />
                </div>

                <select
                  value={frequencyFilter}
                  onChange={(e) =>
                    handleFiltersChange(
                      undefined,
                      e.target.value as "All" | PayrollGroup["frequency"]
                    )
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      Frequency: {option}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  handleFiltersChange(undefined, undefined, e.target.value)
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    Status: {option}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <span className="text-sm text-brand-700">Show</span>
                <select
                  value={perPage}
                  onChange={(e) =>
                    handleFiltersChange(undefined, undefined, undefined, Number(e.target.value))
                  }
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
              <span className="text-brand-700"> groups</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{approvedCount}</span>
                Approved
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{lockedCount}</span>
                Locked
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <Wallet className="h-3.5 w-3.5 text-brand-700" />
                <span className="font-semibold text-brand-900">{currenciesEnabled}</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px]">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Expand
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Sr.
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Group
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Criteria
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Frequency
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Employees
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Currency
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Assigned Officer
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Last Run
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedGroups.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-0">
                      <EmptyState
                        icon={Wallet}
                        title="No payroll groups"
                        description="Create payroll groups to organise employees for salary processing"
                        actionLabel="Create Group"
                        onAction={() => setIsFormOpen(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedGroups.map((group, index) => {
                    const isExpanded = expandedId === group.id;
                    const rowNumber = (currentPage - 1) * perPage + index + 1;

                    return (
                      <React.Fragment key={group.id}>
                        <tr className="transition hover:bg-brand-100/60">
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(isExpanded ? null : group.id)
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </td>

                          <td className="px-5 py-4 text-sm font-medium text-brand-900">
                            {rowNumber}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-xs font-bold text-white">
                                {group.code.slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-brand-900">
                                  {group.name}
                                </p>
                                <p className="mt-0.5 text-xs text-brand-700">
                                  {group.code}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-[260px] truncate text-sm text-brand-800">
                              {group.criteria}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center rounded-full border border-gray-200 bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                              {group.frequency}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-brand-900">
                              <Users className="h-4 w-4 text-brand-700" />
                              <span className="font-semibold">
                                {group.employeeCount.toLocaleString()}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-brand-800">
                              {group.currency}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800">
                                {getInitials(group.officer)}
                              </div>
                              <span className="text-sm font-medium text-brand-900">
                                {group.officer}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={group.status} />
                          </td>

                          <td className="px-5 py-4 text-sm text-brand-800">
                            {group.lastRun}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedId(isExpanded ? null : group.id);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-800 transition hover:bg-brand-100"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(group);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-700 transition hover:bg-brand-100"
                                title="Delete group"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-brand-100/30">
                            <td colSpan={11} className="px-5 py-5">
                              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
                                  <div className="mb-4 flex items-center justify-between">
                                    <h5 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                                      Group Inclusion Criteria
                                    </h5>

                                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                                      <CalendarClock className="h-3.5 w-3.5 text-brand-700" />
                                      {getNextCycleLabel(group.frequency)}
                                    </span>
                                  </div>

                                  <div className="rounded-lg border border-gray-200 bg-brand-100/40 p-4">
                                    <p className="font-mono text-sm leading-6 text-brand-900">
                                      {group.criteria}
                                    </p>
                                  </div>

                                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                                        Last Processed
                                      </p>
                                      <p className="mt-2 text-sm font-semibold text-brand-900">
                                        {group.lastRun}
                                      </p>
                                    </div>

                                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                                        Frequency
                                      </p>
                                      <p className="mt-2 text-sm font-semibold text-brand-900">
                                        {group.frequency}
                                      </p>
                                    </div>

                                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                                        Employees
                                      </p>
                                      <p className="mt-2 text-sm font-semibold text-brand-900">
                                        {group.employeeCount.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                  <div className="mb-4 flex items-center justify-between">
                                    <h5 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                                      Member Sample
                                    </h5>

                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 transition hover:underline"
                                    >
                                      View All
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      "Arsalan K.",
                                      "Saira A.",
                                      "Umar F.",
                                      "Zainab B.",
                                      "Mustafa K.",
                                      "Hassan R.",
                                      "Fatima Z.",
                                    ].map((name, sampleIndex) => (
                                      <div
                                        key={sampleIndex}
                                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-800"
                                      >
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-800">
                                          {getInitials(name)}
                                        </div>
                                        {name}
                                      </div>
                                    ))}

                                    {group.employeeCount > 7 && (
                                      <div className="inline-flex items-center rounded-full border border-gray-200 bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-800">
                                        +{group.employeeCount - 7} more
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                    View Membership Rules
                                  </button>

                                  <button
                                    type="button"
                                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                                  >
                                    <ShieldCheck className="h-4 w-4" />
                                    Run Compliance Check
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paginatedGroups.length > 0 && (
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
                  <ChevronRight className="h-4 w-4 rotate-180" />
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

              <div className="flex items-center gap-2 text-sm text-brand-700">
                <Globe className="h-4 w-4 text-brand-700" />
                <span>
                  <span className="font-semibold text-brand-900">{showingFrom}</span> –{" "}
                  <span className="font-semibold text-brand-900">{showingTo}</span> of{" "}
                  <span className="font-semibold text-brand-900">{totalEntries}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
            <Info className="h-4 w-4 text-brand-800" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-brand-900">
              Smart Payroll Grouping
            </h4>
            <p className="mt-1 text-sm leading-6 text-brand-700">
              Approved groups are ready for processing. Whenever employee master
              data changes, group membership can be re-evaluated on the next sync
              cycle so payroll stays clean and controlled.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <PayrollGroupForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveGroup}
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/30 px-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-brand-900">
              Delete Payroll Group?
            </h3>
            <p className="mt-2 text-sm leading-6 text-brand-700">
              This will remove{" "}
              <span className="font-semibold text-brand-900">
                {deleteTarget.name}
              </span>{" "}
              from the list.
            </p>

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
                onClick={handleDelete}
                className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollGroupsList;
