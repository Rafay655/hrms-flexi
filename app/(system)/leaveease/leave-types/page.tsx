"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit3,
  Copy,
  History,
  Power,
  X,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  ShieldCheck,
  Users,
  RefreshCw,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsRight,
} from "lucide-react";
import { LeaveTypeForm } from "@/components/leaveease/LeaveTypeForm";
import { LeaveTypeVersionHistory } from "@/components/leaveease/LeaveTypeVersionHistory";
// import { EligibilityGroupForm } from "../EligibilityGroupForm";

interface LeaveTypeConfig {
  code: string;
  name: string;
  category: "Paid" | "Unpaid";
  unit: "Days" | "Half-days" | "Hours";
  quota: string;
  accrual: "Monthly" | "Annual" | "On Join" | "None";
  eligible: number;
  status: "Active" | "Inactive";
  description: string;
}

const DEFAULT_TYPES: LeaveTypeConfig[] = [
  {
    code: "ANNUAL",
    name: "Annual Leave",
    category: "Paid",
    unit: "Days",
    quota: "14 days/year",
    accrual: "Monthly",
    eligible: 450,
    status: "Active",
    description: "Standard vacation leave earned monthly.",
  },
  {
    code: "CASUAL",
    name: "Casual Leave",
    category: "Paid",
    unit: "Days",
    quota: "10 days/year",
    accrual: "Annual",
    eligible: 450,
    status: "Active",
    description: "For unforeseen personal matters.",
  },
  {
    code: "SICK",
    name: "Sick Leave",
    category: "Paid",
    unit: "Days",
    quota: "12 days/year",
    accrual: "Monthly",
    eligible: 450,
    status: "Active",
    description: "Medical leave for self-illness.",
  },
  {
    code: "MATERNITY",
    name: "Maternity Leave",
    category: "Paid",
    unit: "Days",
    quota: "12 weeks (84 days)",
    accrual: "None",
    eligible: 210,
    status: "Active",
    description: "Pakistan Maternity Benefit Ordinance 1958. 16 weeks in Sindh under Sindh Amendment.",
  },
  {
    code: "PATERNITY",
    name: "Paternity Leave",
    category: "Paid",
    unit: "Days",
    quota: "7 days",
    accrual: "None",
    eligible: 240,
    status: "Active",
    description: "Punjab Paternity Benefit Act 2023. Province-specific rules apply. Configure per entity.",
  },
  {
    code: "HAJJ",
    name: "Hajj Leave",
    category: "Paid",
    unit: "Days",
    quota: "30 days (once in service)",
    accrual: "None",
    eligible: 450,
    status: "Active",
    description: "Religious pilgrimage. Granted once per employment. Muslim employees only.",
  },
  {
    code: "IDDAH",
    name: "Iddah Leave",
    category: "Paid",
    unit: "Days",
    quota: "90 days",
    accrual: "None",
    eligible: 450,
    status: "Active",
    description: "Prescribed waiting period under Islamic law. Muslim women employees.",
  },
  {
    code: "UNPAID",
    name: "Unpaid Leave",
    category: "Unpaid",
    unit: "Days",
    quota: "Unlimited",
    accrual: "None",
    eligible: 450,
    status: "Active",
    description: "Leave without pay for extended absence.",
  },
  {
    code: "COMPOFF",
    name: "Comp-Off",
    category: "Paid",
    unit: "Days",
    quota: "Based on Credits",
    accrual: "None",
    eligible: 450,
    status: "Active",
    description: "Compensatory leave for extra work.",
  },
  {
    code: "SHORT",
    name: "Short Leave",
    category: "Paid",
    unit: "Hours",
    quota: "2 hours/month",
    accrual: "Monthly",
    eligible: 450,
    status: "Active",
    description: "Brief absence during work hours.",
  },
  {
    code: "BEREAVE",
    name: "Bereavement Leave",
    category: "Paid",
    unit: "Days",
    quota: "3 days/event",
    accrual: "None",
    eligible: 450,
    status: "Active",
    description: "Leave for loss of immediate family.",
  },
  {
    code: "STUDY",
    name: "Study Leave",
    category: "Paid",
    unit: "Days",
    quota: "15 days/year",
    accrual: "On Join",
    eligible: 100,
    status: "Inactive",
    description: "Professional development leave.",
  },
];

const DEFAULT_PAGE_SIZE = 10;

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
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
          {icon}
        </div>
      </div>
    </div>
  );
}

function categoryBadge(category: LeaveTypeConfig["category"]) {
  return category === "Paid"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-gray-50 text-gray-700 border-gray-200";
}

function statusBadge(status: LeaveTypeConfig["status"]) {
  return status === "Active"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-red-50 text-red-700 border-red-200";
}

export default function LeaveTypesList() {
  const [types, setTypes] = useState<LeaveTypeConfig[]>(DEFAULT_TYPES);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | "Paid" | "Unpaid">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  const [selectedType, setSelectedType] = useState<LeaveTypeConfig | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);

  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const filteredTypes = useMemo(() => {
    const q = search.trim().toLowerCase();

    return types.filter((type) => {
      const matchesSearch =
        !q ||
        type.name.toLowerCase().includes(q) ||
        type.code.toLowerCase().includes(q) ||
        type.quota.toLowerCase().includes(q) ||
        type.accrual.toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "All" || type.category === categoryFilter;

      const matchesStatus = statusFilter === "All" || type.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [types, search, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const active = types.filter((type) => type.status === "Active").length;
    const inactive = types.filter((type) => type.status === "Inactive").length;
    const paid = types.filter((type) => type.category === "Paid").length;
    const totalEligible = types.reduce((sum, type) => sum + type.eligible, 0);

    return {
      active,
      inactive,
      paid,
      totalEligible,
    };
  }, [types]);

  const totalEntries = filteredTypes.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTypes = filteredTypes.slice(startIndex, startIndex + pageSize);
  const showingFrom = totalEntries > 0 ? startIndex + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(startIndex + pageSize, totalEntries) : 0;

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setStatusFilter("All");
    setPage(1);
  };

  const toggleStatus = (code: string) => {
    setTypes((prev) =>
      prev.map((type) =>
        type.code === code
          ? {
              ...type,
              status: type.status === "Active" ? "Inactive" : "Active",
            }
          : type
      )
    );

    if (selectedType?.code === code) {
      setSelectedType((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === "Active" ? "Inactive" : "Active",
            }
          : null
      );
    }
  };

  const cloneType = (item: LeaveTypeConfig) => {
    const cloneCode = `${item.code}_COPY`;
    const safeCode = types.some((t) => t.code === cloneCode)
      ? `${item.code}_COPY_${Date.now().toString().slice(-4)}`
      : cloneCode;

    const cloned: LeaveTypeConfig = {
      ...item,
      code: safeCode,
      name: `${item.name} Copy`,
      status: "Inactive",
    };

    setTypes((prev) => [cloned, ...prev]);
    setActionMenuFor(null);
  };

  const handleDeactivateActivate = (item: LeaveTypeConfig) => {
    toggleStatus(item.code);
    setActionMenuFor(null);
  };

  React.useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter, pageSize]);

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Leave Types</h1>
            <p className="mt-1 text-sm text-brand-700">
              Configure and manage leave entitlements for the organization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsGroupFormOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              <Users className="h-4 w-4" />
              Manage Groups
            </button>

            <button
              onClick={() => {
                setSelectedType(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
            >
              <Plus className="h-4 w-4" />
              Create Leave Type
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active Types"
            value={stats.active}
            subtitle="Currently enabled"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatCard
            title="Inactive Types"
            value={stats.inactive}
            subtitle="Temporarily disabled"
            icon={<Power className="h-5 w-5" />}
          />
          <StatCard
            title="Paid Types"
            value={stats.paid}
            subtitle="Compensated leave policies"
            icon={<Clock className="h-5 w-5" />}
          />
          <StatCard
            title="Eligible Assignments"
            value={stats.totalEligible}
            subtitle="Total employee mappings"
            icon={<Users className="h-5 w-5" />}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  placeholder="Search by name, code, quota, accrual..."
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value as "All" | "Paid" | "Unpaid")
                  }
                >
                  <option value="All">All Categories</option>
                  <option value="Paid">Paid Only</option>
                  <option value="Unpaid">Unpaid Only</option>
                </select>

                <select
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as "All" | "Active" | "Inactive")
                  }
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                <select
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                  value={String(pageSize)}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>

                <button
                  onClick={resetFilters}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </button>
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
                  <span className="font-semibold text-brand-900">{stats.active}</span> Active
                </span>
                <span className="h-3 w-px bg-brand-200" />
                <span>
                  <span className="font-semibold text-brand-900">{stats.inactive}</span> Inactive
                </span>
                <span className="h-3 w-px bg-brand-200" />
                <span>
                  <span className="font-semibold text-brand-900">{stats.paid}</span> Paid
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px]">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Code
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Category
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Unit
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Quota
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Accrual
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Eligible
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
                {paginatedTypes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                          <Info className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold text-brand-900">
                          No leave types found
                        </h3>
                        <p className="mt-1 text-sm text-brand-700">
                          Try adjusting your search or filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTypes.map((type) => (
                    <tr
                      key={type.code}
                      className="cursor-pointer transition hover:bg-brand-100"
                      onClick={() => setSelectedType(type)}
                    >
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-800">
                          {type.code}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-brand-900">{type.name}</p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${categoryBadge(
                            type.category
                          )}`}
                        >
                          {type.category}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-brand-700">{type.unit}</td>

                      <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                        {type.quota}
                      </td>

                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-800">
                          <Clock className="h-4 w-4 text-brand-600" />
                          {type.accrual}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="text-sm font-semibold text-brand-900">{type.eligible}</div>
                        <p className="text-[10px] uppercase tracking-wider text-brand-700">staff</p>
                      </td>

                      <td
                        className="px-5 py-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => toggleStatus(type.code)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                            type.status === "Active" ? "bg-emerald-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              type.status === "Active" ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>

                      <td
                        className="px-5 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() =>
                              setActionMenuFor((prev) =>
                                prev === type.code ? null : type.code
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {actionMenuFor === type.code ? (
                            <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                              <div className="space-y-1">
                                <button
                                  onClick={() => {
                                    setSelectedType(type);
                                    setActionMenuFor(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-800 transition hover:bg-brand-100"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedType(type);
                                    setIsFormOpen(true);
                                    setActionMenuFor(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-800 transition hover:bg-brand-100"
                                >
                                  <Edit3 className="h-4 w-4" />
                                  Edit Config
                                </button>

                                <button
                                  onClick={() => cloneType(type)}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-800 transition hover:bg-brand-100"
                                >
                                  <Copy className="h-4 w-4" />
                                  Clone Type
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedType(type);
                                    setIsHistoryOpen(true);
                                    setActionMenuFor(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-800 transition hover:bg-brand-100"
                                >
                                  <History className="h-4 w-4" />
                                  Version History
                                </button>

                                <div className="my-1 h-px bg-gray-200" />

                                <button
                                  onClick={() => handleDeactivateActivate(type)}
                                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                                    type.status === "Active"
                                      ? "text-red-600 hover:bg-red-50"
                                      : "text-emerald-700 hover:bg-emerald-50"
                                  }`}
                                >
                                  <Power className="h-4 w-4" />
                                  {type.status === "Active" ? "Deactivate" : "Activate"}
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
                    <ChevronRightIcon className="h-4 w-4" />
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

        {selectedType ? (
          <div className="fixed inset-0 z-[100] overflow-hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedType(null)}
            />
            <div className="absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-800 text-white">
                    <Database className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-brand-900">{selectedType.name}</h3>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      {selectedType.code}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedType(null)}
                  className="rounded-lg border border-gray-200 p-2 text-brand-700 transition hover:bg-brand-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <section className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Configuration Summary
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Accrual Policy
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-900">
                          <Clock className="h-4 w-4 text-brand-700" />
                          {selectedType.accrual}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Unit of Measure
                        </p>
                        <p className="mt-2 text-sm font-semibold text-brand-900">
                          {selectedType.unit}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Entitlement
                        </p>
                        <p className="mt-2 text-sm font-semibold text-brand-900">
                          {selectedType.quota}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Status
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(
                            selectedType.status
                          )}`}
                        >
                          {selectedType.status}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Description
                    </h4>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <p className="text-sm leading-6 text-brand-700">
                        {selectedType.description}
                      </p>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Usage Insights
                    </h4>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <span className="text-sm font-medium text-brand-900">
                            92% Utilization Rate
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-brand-400" />
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                          <span className="text-sm font-medium text-brand-900">
                            Encashment Restricted
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-brand-400" />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Eligibility Access
                    </h4>

                    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-brand-800 p-5 text-white shadow-sm">
                      <div className="relative z-10 space-y-4">
                        <p className="text-sm leading-6 text-white/85">
                          Currently assigned to{" "}
                          <span className="font-semibold text-white">
                            {selectedType.eligible}
                          </span>{" "}
                          employees across multiple departments.
                        </p>

                        <button
                          onClick={() => setIsGroupFormOpen(true)}
                          className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                        >
                          Manage Access List
                        </button>
                      </div>

                      <ShieldCheck className="absolute -bottom-4 -right-4 h-24 w-24 text-white/10" />
                    </div>
                  </section>
                </div>
              </div>

              <div className="flex gap-3 border-t border-gray-200 bg-white p-6">
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="flex-1 rounded-lg bg-brand-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  Edit Configuration
                </button>

                <button
                  onClick={() => toggleStatus(selectedType.code)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
                >
                  <Power className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <LeaveTypeForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedType}
        />

        <LeaveTypeVersionHistory
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          typeName={selectedType?.name || "Annual Leave"}
        />

        {/* <EligibilityGroupForm
          isOpen={isGroupFormOpen}
          onClose={() => setIsGroupFormOpen(false)}
        /> */}
      </div>
    </div>
  );
}