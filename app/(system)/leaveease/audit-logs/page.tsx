"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Filter,
  Download,
  User,
  ArrowRight,
  X,
  ChevronRight,
  CheckCircle2,
  Shield,
  Terminal,
  Globe,
  Laptop,
  Layers,
  ClipboardList,
  Clock3,
  FileJson,
  Info,
} from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  employee: { name: string; id: string; avatar: string };
  action: string;
  category: "Request" | "Balance" | "Policy" | "Comp-Off" | "Config";
  entity: string;
  summary: string;
  by: { name: string; role: string };
  ip: string;
  details: {
    before: unknown;
    after: unknown;
  };
}

const MOCK_LOGS: AuditEntry[] = Array.from({ length: 100 }, (_, i) => ({
  id: `LOG-88${i}`,
  timestamp: "Feb 12, 2025 • 09:45:12 AM",
  employee: {
    name: ["Ahmed Khan", "Sara Ahmed", "Tariq Mehmood", "Zoya Malik", "Ali Raza"][i % 5],
    id: `EMP-10${(i % 5) + 1}`,
    avatar: ["AK", "SM", "TC", "ZM", "AR"][i % 5],
  },
  action: ["Approved", "Adjusted", "Modified", "Accrued", "Credited", "Published"][i % 6],
  category: ["Request", "Balance", "Policy", "Balance", "Comp-Off", "Policy"][i % 6] as AuditEntry["category"],
  entity: ["LV-4402", "Annual Leave", "Standard Policy", "Casual Leave", "CO-992", "Holiday Cal"][i % 6],
  summary: [
    "Leave request approved by manager",
    "Balance adjusted by admin (+2 days)",
    "Carry forward rules updated for 2025",
    "Monthly automated accrual run",
    "Overtime credit verified and added",
    "New v4 policy published to Engineering",
  ][i % 6],
  by: {
    name: i % 10 === 0 ? "System Process" : "Sarah Admin",
    role: i % 10 === 0 ? "Automated" : "HR Manager",
  },
  ip: `192.168.1.${100 + i}`,
  details: {
    before: { status: "Pending", days: 12, rules: { cf: false } },
    after: { status: "Approved", days: 14, rules: { cf: true } },
  },
}));

type CategoryFilter = "All" | AuditEntry["category"];

function splitTimestamp(timestamp: string) {
  const [date = "", time = ""] = timestamp.split("•").map((part) => part.trim());
  return { date, time };
}

function getCategoryClasses(category: AuditEntry["category"]) {
  switch (category) {
    case "Request":
      return "bg-brand-100 text-brand-800 border-gray-200";
    case "Balance":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Policy":
      return "bg-violet-50 text-violet-700 border-violet-100";
    case "Comp-Off":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "Config":
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function LeaveAuditLogs() {
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredLogs = useMemo(() => {
    return MOCK_LOGS.filter((log) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        log.employee.name.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q) ||
        log.entity.toLowerCase().includes(q) ||
        log.summary.toLowerCase().includes(q) ||
        log.by.name.toLowerCase().includes(q);

      const matchesCategory =
        activeCategory === "All" || log.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const visibleLogs = filteredLogs.slice(0, 50);

  const totalLogs = MOCK_LOGS.length;
  const requestCount = MOCK_LOGS.filter((log) => log.category === "Request").length;
  const policyCount = MOCK_LOGS.filter((log) => log.category === "Policy").length;
  const systemCount = MOCK_LOGS.filter((log) => log.by.role === "Automated").length;

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">Audit Logs</h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Immutable record of leave-related actions, approvals, adjustments, and configuration changes.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Total Logs
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">{totalLogs}</div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Request Events
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">{requestCount}</div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Policy Events
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">{policyCount}</div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Automated Entries
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">{systemCount}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                type="text"
                placeholder="Search by employee, log ID, entity, summary, or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              <ArrowRight className="h-4 w-4 text-brand-700" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-brand-800 transition hover:bg-brand-100"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["All", "Request", "Balance", "Policy", "Comp-Off", "Config"] as CategoryFilter[]).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                    activeCategory === category
                      ? "bg-brand-800 text-white"
                      : "border border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                <ClipboardList className="h-4 w-4" />
                Audit Entries
              </h3>
              <p className="mt-1 text-sm text-brand-700">
                Showing <span className="font-semibold text-brand-900">{visibleLogs.length}</span> of{" "}
                <span className="font-semibold text-brand-900">{filteredLogs.length}</span> matching logs
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-800">
              <CheckCircle2 className="h-4 w-4" />
              Retained for 7 years
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Timestamp
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Affected Entity
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Action
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Summary
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    By User / IP
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    View
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-brand-300/40 bg-white">
                {visibleLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Info className="mx-auto h-8 w-8 text-brand-300" />
                      <div className="mt-3 text-sm font-semibold text-brand-900">
                        No audit logs found
                      </div>
                      <div className="mt-1 text-sm text-brand-700">
                        Try changing search text or category filters.
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleLogs.map((log) => {
                    const { date, time } = splitTimestamp(log.timestamp);

                    return (
                      <tr
                        key={log.id}
                        className="cursor-pointer transition-colors hover:bg-brand-100"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-brand-900">{date}</div>
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-brand-700">
                            <Clock3 className="h-3.5 w-3.5" />
                            {time}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-xs font-semibold text-brand-900">
                              {log.employee.avatar}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-brand-900">
                                {log.employee.name}
                              </div>
                              <div className="text-[11px] text-brand-700">
                                {log.entity}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getCategoryClasses(
                                log.category
                              )}`}
                            >
                              {log.category}
                            </span>
                            <div className="text-sm font-semibold text-brand-900">
                              {log.action}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="max-w-sm text-sm text-brand-700">
                            {log.summary}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-brand-900">
                            {log.by.name}
                          </div>
                          <div className="mt-1 text-[11px] text-brand-700">
                            {log.by.role}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-brand-700">
                            <Laptop className="h-3.5 w-3.5" />
                            {log.ip}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <ChevronRight className="ml-auto h-4 w-4 text-brand-700" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-brand-700">
              Compliance retention enabled under internal audit standard.
            </div>

            <div className="flex items-center gap-2">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-xs font-semibold text-white">
                1
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-semibold text-brand-800 hover:bg-brand-100">
                2
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-semibold text-brand-800 hover:bg-brand-100">
                3
              </button>
            </div>
          </div>
        </div>

        {selectedLog && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 bg-brand-900 px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Terminal className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">
                      Audit Detail: {selectedLog.id}
                    </h3>
                    <p className="text-sm text-brand-100">{selectedLog.timestamp}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-lg p-2 text-white transition hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[75vh] overflow-y-auto">
                <div className="grid gap-6 p-6">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Category
                      </div>
                      <div className="mt-2 text-sm font-semibold text-brand-900">
                        {selectedLog.category}
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Action
                      </div>
                      <div className="mt-2 text-sm font-semibold text-brand-900">
                        {selectedLog.action}
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Entity
                      </div>
                      <div className="mt-2 text-sm font-semibold text-brand-900">
                        {selectedLog.entity}
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Performed By
                      </div>
                      <div className="mt-2 text-sm font-semibold text-brand-900">
                        {selectedLog.by.name}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                      <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                        <Layers className="h-4 w-4" />
                        State Comparison
                      </h4>
                    </div>

                    <div className="grid gap-0 md:grid-cols-2">
                      <div className="border-b border-gray-200 p-5 md:border-b-0 md:border-r">
                        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
                          Before Change
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-brand-900">
                          <pre>{JSON.stringify(selectedLog.details.before, null, 2)}</pre>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
                          After Change
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-brand-100 p-4 font-mono text-xs text-brand-900">
                          <pre>{JSON.stringify(selectedLog.details.after, null, 2)}</pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="border-b border-gray-200 px-5 py-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                          <User className="h-4 w-4" />
                          Affected Employee
                        </h4>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-100 text-sm font-semibold text-brand-900">
                            {selectedLog.employee.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-brand-900">
                              {selectedLog.employee.name}
                            </div>
                            <div className="text-[11px] text-brand-700">
                              {selectedLog.employee.id}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="border-b border-gray-200 px-5 py-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                          <Globe className="h-4 w-4" />
                          Network Context
                        </h4>
                      </div>

                      <div className="space-y-3 p-5">
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
                          <span className="text-brand-700">Source IP</span>
                          <span className="font-mono font-semibold text-brand-900">
                            {selectedLog.ip}
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
                          <span className="text-brand-700">User Role</span>
                          <span className="font-semibold text-brand-900">
                            {selectedLog.by.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  <FileJson className="h-4 w-4" />
                  Export Audit Fragment
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}