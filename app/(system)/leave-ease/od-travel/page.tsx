"use client";

import React, { useMemo, useState } from "react";
import {
  Zap,
  FileSpreadsheet,
  Search,
  Clock,
  AlertTriangle,
  History,
  Calendar,
  CheckSquare,
  XCircle,
  Mail,
  MoreHorizontal,
  Building2,
} from "lucide-react";

interface OrgCompOff {
  id: string;
  employee: string;
  avatar: string;
  dept: string;
  earnedDate: string;
  amount: number;
  expiryDate: string;
  status: "Available" | "Pending" | "Used" | "Expired";
  source: string;
  daysRemaining?: number;
}

const MOCK_ORG_CREDITS: OrgCompOff[] = [
  {
    id: "CO-501",
    employee: "Ahmed Khan",
    avatar: "AK",
    dept: "Engineering",
    earnedDate: "Dec 25, 2024",
    amount: 1.0,
    expiryDate: "Mar 25, 2025",
    status: "Available",
    source: "Worked Holiday",
    daysRemaining: 45,
  },
  {
    id: "CO-502",
    employee: "Sara Miller",
    avatar: "SM",
    dept: "Product",
    earnedDate: "Jan 05, 2025",
    amount: 1.0,
    expiryDate: "Apr 05, 2025",
    status: "Available",
    source: "Extra Shift",
    daysRemaining: 56,
  },
  {
    id: "CO-503",
    employee: "Tom Chen",
    avatar: "TC",
    dept: "Engineering",
    earnedDate: "Feb 10, 2025",
    amount: 0.5,
    expiryDate: "May 10, 2025",
    status: "Pending",
    source: "Approved OT",
  },
  {
    id: "CO-504",
    employee: "Anna Bell",
    avatar: "AB",
    dept: "Design",
    earnedDate: "Jan 15, 2025",
    amount: 1.0,
    expiryDate: "Feb 28, 2025",
    status: "Available",
    source: "Worked Holiday",
    daysRemaining: 12,
  },
  {
    id: "CO-505",
    employee: "Zoya Malik",
    avatar: "ZM",
    dept: "Engineering",
    earnedDate: "Nov 12, 2024",
    amount: 1.0,
    expiryDate: "Feb 12, 2025",
    status: "Available",
    source: "Worked Holiday",
    daysRemaining: 2,
  },
  {
    id: "CO-506",
    employee: "Ali Raza",
    avatar: "AR",
    dept: "HR",
    earnedDate: "Dec 10, 2024",
    amount: 1.0,
    expiryDate: "Mar 10, 2025",
    status: "Used",
    source: "Extra Shift",
  },
];

type ActiveTab = "All" | "Pending Requests" | "Expiring Soon" | "By Department";

const DEPARTMENT_SUMMARY = [
  { name: "Engineering", out: 145, pen: 4, exp: 12, used: 210 },
  { name: "Product", out: 82, pen: 2, exp: 5, used: 120 },
  { name: "Design", out: 45, pen: 1, exp: 3, used: 85 },
  { name: "Sales", out: 120, pen: 5, exp: 18, used: 310 },
  { name: "HR", out: 64, pen: 0, exp: 7, used: 165 },
];

function getStatusBadgeClasses(status: OrgCompOff["status"]) {
  switch (status) {
    case "Available":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Used":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "Expired":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function CompOffAllCredits() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return MOCK_ORG_CREDITS.filter((item) => {
      if (activeTab === "Pending Requests" && item.status !== "Pending") return false;
      if (
        activeTab === "Expiring Soon" &&
        (!item.daysRemaining || item.daysRemaining > 30)
      )
        return false;

      if (!q) return true;

      return (
        item.employee.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.dept.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q)
      );
    });
  }, [activeTab, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allVisibleSelected =
    filteredData.length > 0 &&
    filteredData.every((item) => selectedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredData.some((item) => item.id === id))
      );
      return;
    }

    const visibleIds = filteredData.map((item) => item.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const totalOutstanding = useMemo(() => {
    return MOCK_ORG_CREDITS.filter((item) => item.status === "Available").reduce(
      (sum, item) => sum + item.amount,
      0
    );
  }, []);

  const pendingRequests = useMemo(() => {
    return MOCK_ORG_CREDITS.filter((item) => item.status === "Pending").length;
  }, []);

  const expiringThisMonth = useMemo(() => {
    return MOCK_ORG_CREDITS.filter(
      (item) => typeof item.daysRemaining === "number" && item.daysRemaining <= 30
    ).reduce((sum, item) => sum + item.amount, 0);
  }, []);

  const creditedThisYear = 890.0;

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  All Comp-Off Credits
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Organization-wide administration of earned leave credits.
                </p>
              </div>
            </div>

            <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700">
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-100 p-2 text-brand-800">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Total Outstanding
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {totalOutstanding.toFixed(1)} Days
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Pending Approval
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {pendingRequests} Requests
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-50 p-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Expiring This Month
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {expiringThisMonth.toFixed(1)} Days
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-brand-900 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/10 p-2 text-brand-100">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-100">
                    Credited This Year
                  </div>
                  <div className="mt-1 text-lg font-bold">
                    {creditedThisYear.toFixed(1)} Days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main container */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["All", "Pending Requests", "Expiring Soon", "By Department"] as ActiveTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setSelectedIds([]);
                    }}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                      activeTab === tab
                        ? "bg-brand-800 text-white"
                        : "border border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                type="text"
                placeholder="Search employee, ID, dept, or source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>
          </div>

          {/* Bulk actions */}
          {selectedIds.length > 0 && activeTab === "Expiring Soon" && (
            <div className="border-b border-gray-200 bg-brand-900 px-6 py-4 text-white">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm font-medium">
                  <span className="font-semibold">{selectedIds.length}</span> item(s) selected
                </div>

                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15">
                    <Calendar className="h-4 w-4" />
                    Extend Expiry
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Process Lapse
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {activeTab === "By Department" ? (
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-white">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Department
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Outstanding
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Pending
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Expiring
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Used This Year
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-brand-300/40 bg-white">
                  {DEPARTMENT_SUMMARY.map((dept) => (
                    <tr key={dept.name} className="transition-colors hover:bg-brand-100">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-900">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="text-sm font-semibold text-brand-900">
                            {dept.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                        {dept.out.toFixed(1)} d
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-amber-700">
                        {dept.pen} req
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-red-700">
                        {dept.exp.toFixed(1)} d
                      </td>
                      <td className="px-5 py-4 text-sm text-brand-700">
                        {dept.used.toFixed(1)} d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-white">
                  <tr>
                    {activeTab === "Expiring Soon" && (
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </th>
                    )}
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Employee
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Earned On
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Expiry
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-brand-300/40 bg-white">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeTab === "Expiring Soon" ? 7 : 6}
                        className="px-5 py-16 text-center"
                      >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-300">
                          <Zap className="h-8 w-8" />
                        </div>
                        <div className="mt-4 text-sm font-semibold text-brand-900">
                          No records found
                        </div>
                        <div className="mt-1 text-sm text-brand-700">
                          Try changing the current tab or search query.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-brand-100">
                        {activeTab === "Expiring Soon" && (
                          <td className="px-5 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => toggleSelect(item.id)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </td>
                        )}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-xs font-semibold text-brand-900">
                              {item.avatar}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-brand-900">
                                {item.employee}
                              </div>
                              <div className="text-[11px] text-brand-700">
                                {item.dept} • {item.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                          {item.amount.toFixed(1)} day
                        </td>

                        <td className="px-5 py-4 text-sm text-brand-700">
                          {item.earnedDate}
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-sm text-brand-900">{item.expiryDate}</div>
                          {typeof item.daysRemaining === "number" &&
                            item.daysRemaining <= 30 && (
                              <div
                                className={`mt-1 text-[11px] font-semibold ${
                                  item.daysRemaining <= 7
                                    ? "text-red-600"
                                    : "text-orange-600"
                                }`}
                              >
                                {item.daysRemaining} days left
                              </div>
                            )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {item.status === "Pending" ? (
                              <>
                                <button
                                  title="Approve"
                                  className="rounded-lg border border-gray-200 bg-white p-2 text-emerald-600 transition hover:bg-emerald-50"
                                >
                                  <CheckSquare className="h-4 w-4" />
                                </button>
                                <button
                                  title="Reject"
                                  className="rounded-lg border border-gray-200 bg-white p-2 text-red-600 transition hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            ) : activeTab === "Expiring Soon" ? (
                              <>
                                <button
                                  title="Extend"
                                  className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100"
                                >
                                  <Calendar className="h-4 w-4" />
                                </button>
                                <button
                                  title="Notify"
                                  className="rounded-lg border border-gray-200 bg-white p-2 text-blue-600 transition hover:bg-blue-50"
                                >
                                  <Mail className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <button className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}