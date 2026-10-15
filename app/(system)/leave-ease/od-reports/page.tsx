"use client";

import React, { useMemo, useState } from "react";
import {
  Briefcase,
  Plane,
  Globe,
  Search,
  Filter,
  Download,
  Calendar as CalendarIcon,
  List,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  MapPin,
  Clock,
  CheckSquare,
  Eye,
} from "lucide-react";

interface ODTravelRecord {
  id: string;
  employee: string;
  avatar: string;
  dept: string;
  type: "Official Duty" | "Local Travel" | "Inter-city Travel" | "International Travel";
  startDate: string;
  endDate: string;
  destination: string;
  purpose: string;
  status: "Pending" | "Approved" | "Active" | "Completed" | "Rejected";
}

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "Marketing",
];

const MOCK_DATA: ODTravelRecord[] = Array.from({ length: 30 }, (_, i) => {
  const types: ODTravelRecord["type"][] = [
    "Official Duty",
    "Local Travel",
    "Inter-city Travel",
    "International Travel",
  ];
  const names = [
    "Ahmed Khan",
    "Sara Miller",
    "Tom Chen",
    "Anna Bell",
    "Zoya Malik",
    "Ali Raza",
    "Mona Shah",
    "Hamza Aziz",
  ];

  const type = types[i % 4];
  const status: ODTravelRecord["status"] =
    i < 8 ? "Pending" : i < 12 ? "Active" : i < 25 ? "Completed" : "Approved";

  return {
    id: `ODT-2025-${1000 + i}`,
    employee: names[i % names.length],
    avatar: names[i % names.length]
      .split(" ")
      .map((n) => n[0])
      .join(""),
    dept: DEPARTMENTS[i % DEPARTMENTS.length],
    type,
    startDate: `2025-02-${String(10 + (i % 15)).padStart(2, "0")}`,
    endDate: `2025-02-${String(12 + (i % 15)).padStart(2, "0")}`,
    destination:
      i % 4 === 3
        ? "Dubai, UAE"
        : i % 2 === 0
        ? "Local Client Office"
        : "Lahore Branch",
    purpose:
      i % 3 === 0
        ? "Client Implementation"
        : i % 3 === 1
        ? "Quarterly Review"
        : "System Training",
    status,
  };
});

type ActiveTab = "All" | "OD" | "Travel" | "Pending" | "Active" | "Completed";

function getTypeBadge(type: ODTravelRecord["type"]) {
  switch (type) {
    case "Official Duty":
      return "bg-brand-100 text-brand-800 border-gray-200";
    case "Local Travel":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Inter-city Travel":
      return "bg-orange-50 text-orange-700 border-orange-100";
    case "International Travel":
      return "bg-violet-50 text-violet-700 border-violet-100";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getStatusStyle(status: ODTravelRecord["status"]) {
  switch (status) {
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Active":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "Completed":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "Approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Rejected":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function ODTravelAllRequests() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("All");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredData = useMemo(() => {
    return MOCK_DATA.filter((item) => {
      const matchesTab =
        activeTab === "All" ||
        (activeTab === "OD" && item.type === "Official Duty") ||
        (activeTab === "Travel" && item.type.includes("Travel")) ||
        (activeTab === "Pending" && item.status === "Pending") ||
        (activeTab === "Active" && item.status === "Active") ||
        (activeTab === "Completed" && item.status === "Completed");

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.employee.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.destination.toLowerCase().includes(q) ||
        item.purpose.toLowerCase().includes(q);

      const matchesDept = deptFilter === "All" || item.dept === deptFilter;
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;

      return matchesTab && matchesSearch && matchesDept && matchesStatus;
    });
  }, [activeTab, search, deptFilter, statusFilter]);

  const activeCount = MOCK_DATA.filter((item) => item.status === "Active").length;
  const pendingCount = MOCK_DATA.filter((item) => item.status === "Pending").length;
  const upcomingCount = 15;
  const internationalPending = MOCK_DATA.filter(
    (item) => item.type === "International Travel" && item.status === "Pending"
  ).length;

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-900">
                All OD / Travel Requests
              </h1>
              <p className="mt-0.5 text-sm text-brand-700">
                Global view of all out-of-office assignments and business travel.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-gray-200 bg-white p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-md p-2 transition ${
                    viewMode === "list"
                      ? "bg-brand-800 text-white"
                      : "text-brand-800 hover:bg-brand-100"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`rounded-md p-2 transition ${
                    viewMode === "calendar"
                      ? "bg-brand-800 text-white"
                      : "text-brand-800 hover:bg-brand-100"
                  }`}
                >
                  <CalendarIcon className="h-4 w-4" />
                </button>
              </div>

              <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700">
                <Download className="h-4 w-4" />
                Export List
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-brand-900 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/10 p-2 text-brand-100">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-100">
                    Currently Active
                  </div>
                  <div className="mt-1 text-lg font-bold">{activeCount} Assignments</div>
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
                    {pendingCount} Requests
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Upcoming (7d)
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {upcomingCount} Planned
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-violet-50 p-2 text-violet-700">
                  <Plane className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    International Pending
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {internationalPending} Critical
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main container */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Filters */}
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  placeholder="Search by employee name, request ID, destination, or purpose..."
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-700">
                  <Filter className="h-4 w-4" />
                  Filters
                </div>

                <select
                  className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                <select
                  className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {(["All", "OD", "Travel", "Pending", "Active", "Completed"] as ActiveTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
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
          </div>

          {viewMode === "list" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-white">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      ID / Employee
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Type
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Dates
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Destination
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Purpose
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
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-300">
                          <CalendarIcon className="h-8 w-8" />
                        </div>
                        <div className="mt-4 text-sm font-semibold text-brand-900">
                          No requests found
                        </div>
                        <div className="mt-1 text-sm text-brand-700">
                          Try changing search text, tabs, or filters.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-brand-100">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-xs font-semibold text-brand-900">
                              {item.avatar}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-brand-900">
                                {item.employee}
                              </div>
                              <div className="text-[11px] text-brand-700">{item.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getTypeBadge(item.type)}`}>
                            {item.type}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-brand-900">
                            {item.startDate}
                          </div>
                          <div className="text-[11px] text-brand-700">
                            to {item.endDate}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-brand-900">
                            <MapPin className="h-4 w-4 text-brand-700" />
                            {item.destination}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div
                            className="max-w-[180px] truncate text-sm text-brand-700"
                            title={item.purpose}
                          >
                            {item.purpose}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(item.status)}`}>
                            {item.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {item.status === "Pending" && (
                              <>
                                <button
                                  title="Approve"
                                  className="rounded-lg border border-gray-200 bg-white p-2 text-emerald-600 transition hover:bg-emerald-50"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                                <button
                                  title="Reject"
                                  className="rounded-lg border border-gray-200 bg-white p-2 text-red-600 transition hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            {item.status === "Active" && (
                              <button
                                title="Mark Complete"
                                className="rounded-lg border border-gray-200 bg-white p-2 text-indigo-600 transition hover:bg-indigo-50"
                              >
                                <CheckSquare className="h-4 w-4" />
                              </button>
                            )}

                            <button className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100">
                              <Eye className="h-4 w-4" />
                            </button>

                            <button className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10">
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
                <CalendarIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <h4 className="text-lg font-semibold text-brand-900">
                  Visual Timeline View
                </h4>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-700">
                  Display all OD and Travel records on a unified calendar timeline.
                  You can later plug this into your team calendar logic with type-based colors.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-brand-700">
                    <div className="h-3 w-3 rounded bg-brand-800" />
                    OD
                  </div>
                  <div className="flex items-center gap-2 text-sm text-brand-700">
                    <div className="h-3 w-3 rounded bg-violet-500" />
                    International
                  </div>
                  <div className="flex items-center gap-2 text-sm text-brand-700">
                    <div className="h-3 w-3 rounded bg-orange-500" />
                    Inter-city
                  </div>
                  <div className="flex items-center gap-2 text-sm text-brand-700">
                    <div className="h-3 w-3 rounded bg-emerald-500" />
                    Local
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}