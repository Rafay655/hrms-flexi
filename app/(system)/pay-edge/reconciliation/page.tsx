"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  Download,
  FileSearch,
  Filter,
  Info,
  Landmark,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";

type SourceStatus = "Synced" | "Pending" | "Error";
type IssueStatus = "Open" | "Fixed";

interface Source {
  id: number;
  name: string;
  period: string;
  records: number;
  lastSync: string;
  status: SourceStatus;
}

interface Discrepancy {
  id: number;
  employee: string;
  empId: string;
  timeSyncHours: number;
  payEdgeHours: number;
  suggestion: string;
  status: IssueStatus;
}

interface BankMatch {
  id: number;
  ref: string;
  statementAmount: number;
  payEdgeAmount: number;
  matched: boolean;
}

const INITIAL_SOURCES: Source[] = [
  { id: 1, name: "PayEdge (Core)", period: "Jan 2025", records: 485, lastSync: "10 mins ago", status: "Synced" },
  { id: 2, name: "TimeSync (Attendance)", period: "Jan 2025", records: 485, lastSync: "1 hour ago", status: "Synced" },
  { id: 3, name: "LeaveEase (Leave)", period: "Jan 2025", records: 42, lastSync: "2 hours ago", status: "Pending" },
  { id: 4, name: "Bank Statement (HBL)", period: "Jan 2025", records: 325, lastSync: "Just now", status: "Synced" },
];

const INITIAL_DISCREPANCIES: Discrepancy[] = [
  {
    id: 1,
    employee: "Kamran Shah",
    empId: "EMP-1022",
    timeSyncHours: 184.5,
    payEdgeHours: 176.0,
    suggestion: "Manual OT override in PayEdge. Check approval document.",
    status: "Open",
  },
  {
    id: 2,
    employee: "Sara Khan",
    empId: "EMP-1102",
    timeSyncHours: 168.0,
    payEdgeHours: 160.0,
    suggestion: "Public holiday on Jan 5 is missing in PayEdge sync.",
    status: "Open",
  },
  {
    id: 3,
    employee: "Usman Tariq",
    empId: "EMP-1181",
    timeSyncHours: 176.0,
    payEdgeHours: 172.0,
    suggestion: "Leave adjustment posted late. Recheck final attendance lock.",
    status: "Open",
  },
];

const INITIAL_BANK_MATCHES: BankMatch[] = [
  { id: 1, ref: "FT250115001", statementAmount: 185000, payEdgeAmount: 185000, matched: true },
  { id: 2, ref: "FT250115002", statementAmount: 420000, payEdgeAmount: 420000, matched: true },
  { id: 3, ref: "FT250115003", statementAmount: 106250, payEdgeAmount: 106500, matched: false },
];

const STATUS_FILTERS: Array<"All" | SourceStatus> = ["All", "Synced", "Pending", "Error"];

function formatAmount(value: number) {
  return `PKR ${value.toLocaleString()}`;
}

function formatHours(value: number) {
  return `${value.toFixed(1)} hrs`;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | boolean>>) {
  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const ReconciliationAssistant = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceStatus, setSourceStatus] = useState<"All" | SourceStatus>("All");

  const [issueSearch, setIssueSearch] = useState("");
  const [sources] = useState<Source[]>(INITIAL_SOURCES);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>(INITIAL_DISCREPANCIES);
  const [bankMatches] = useState<BankMatch[]>(INITIAL_BANK_MATCHES);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleRunRecon = () => {
    if (isRunning) return;

    setIsRunning(true);
    setShowResults(false);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setIsRunning(false);
      setShowResults(true);
    }, 1200);
  };

  const filteredSources = useMemo(() => {
    const q = sourceSearch.trim().toLowerCase();

    return sources.filter((source) => {
      const matchesSearch =
        !q ||
        `${source.name} ${source.period} ${source.lastSync}`.toLowerCase().includes(q);

      const matchesStatus =
        sourceStatus === "All" || source.status === sourceStatus;

      return matchesSearch && matchesStatus;
    });
  }, [sources, sourceSearch, sourceStatus]);

  const filteredDiscrepancies = useMemo(() => {
    const q = issueSearch.trim().toLowerCase();

    return discrepancies.filter((item) => {
      if (!q) return true;

      return `${item.employee} ${item.empId} ${item.suggestion}`
        .toLowerCase()
        .includes(q);
    });
  }, [discrepancies, issueSearch]);

  const syncedCount = sources.filter((item) => item.status === "Synced").length;
  const pendingCount = sources.filter((item) => item.status === "Pending").length;
  const errorCount = sources.filter((item) => item.status === "Error").length;

  const openIssues = discrepancies.filter((item) => item.status === "Open").length;
  const fixedIssues = discrepancies.filter((item) => item.status === "Fixed").length;

  const matchedCount = bankMatches.filter((item) => item.matched).length;
  const unmatchedCount = bankMatches.filter((item) => !item.matched).length;

  const handleFixIssue = (id: number) => {
    setDiscrepancies((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Fixed" } : item
      )
    );
  };

  const handleFixAll = () => {
    setDiscrepancies((prev) =>
      prev.map((item) =>
        item.status === "Open" ? { ...item, status: "Fixed" } : item
      )
    );
  };

  const handleExportSources = () => {
    downloadCsv(
      "reconciliation-sources.csv",
      ["Source Connector", "Reporting Period", "Records Found", "Last Sync", "Status"],
      filteredSources.map((source) => [
        source.name,
        source.period,
        source.records,
        source.lastSync,
        source.status,
      ])
    );
  };

  const handleExportAudit = () => {
    downloadCsv(
      "reconciliation-audit-report.csv",
      ["Section", "Reference", "Status", "Details"],
      [
        ["Sources", "Integrated Feeds", `${syncedCount} Synced / ${pendingCount} Pending / ${errorCount} Error`, "Source readiness snapshot"],
        ["Attendance vs Payroll", "Timesync vs PayEdge", `${openIssues} Open / ${fixedIssues} Fixed`, "Hours discrepancy review"],
        ["Bank Match", "HBL Statement", `${matchedCount} Matched / ${unmatchedCount} Unmatched`, "Statement comparison"],
      ]
    );
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                  <RefreshCw className={`h-5 w-5 text-white ${isRunning ? "animate-spin" : ""}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-brand-900">
                    Reconciliation Assistant
                  </h2>
                  <p className="mt-0.5 text-sm text-brand-700">
                    Auto-matching sub-systems and bank statements for ledger integrity
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  onClick={handleRunRecon}
                  disabled={isRunning}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
                  {isRunning ? "Running..." : "Run Reconciliation"}
                </button>

                <button
                  onClick={handleExportAudit}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                >
                  <Download className="h-4 w-4" />
                  Export Audit
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Synced Sources"
              value={String(syncedCount)}
              helper={`${sources.length} total connectors`}
              icon={<Database className="h-4 w-4 text-brand-700" />}
            />
            <SummaryCard
              label="Open Exceptions"
              value={String(openIssues)}
              helper="Need review or auto-fix"
              icon={<AlertTriangle className="h-4 w-4 text-brand-700" />}
            />
            <SummaryCard
              label="Bank Match Rate"
              value={`${Math.round((matchedCount / bankMatches.length) * 100)}%`}
              helper={`${matchedCount} matched entries`}
              icon={<Landmark className="h-4 w-4 text-brand-700" />}
            />
            <SummaryCard
              label="Automation Status"
              value={showResults ? "Ready" : "Awaiting Run"}
              helper={showResults ? "Latest results loaded" : "Run engine to refresh"}
              icon={<ShieldCheck className="h-4 w-4 text-brand-700" />}
            />
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm">
                <span className="text-brand-700">Source health: </span>
                <span className="font-semibold text-brand-900">{syncedCount}</span>
                <span className="text-brand-700"> synced, </span>
                <span className="font-semibold text-brand-900">{pendingCount}</span>
                <span className="text-brand-700"> pending, </span>
                <span className="font-semibold text-brand-900">{errorCount}</span>
                <span className="text-brand-700"> error</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-700">
                <span>
                  <span className="font-semibold text-brand-900">{openIssues}</span> open issues
                </span>
                <span className="h-3 w-px bg-brand-300" />
                <span>
                  <span className="font-semibold text-brand-900">{matchedCount}</span> bank matches
                </span>
                <span className="h-3 w-px bg-brand-300" />
                <span>
                  <span className="font-semibold text-brand-900">{unmatchedCount}</span> unmatched
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-brand-900">
                  Integrated Data Feeds
                </h3>
                <p className="mt-0.5 text-sm text-brand-700">
                  Connected payroll, attendance, leave, and bank sources
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    type="text"
                    value={sourceSearch}
                    onChange={(e) => setSourceSearch(e.target.value)}
                    placeholder="Search source..."
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800 sm:w-56"
                  />
                </div>

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <select
                    value={sourceStatus}
                    onChange={(e) => setSourceStatus(e.target.value as "All" | SourceStatus)}
                    className="h-10 rounded-lg border border-gray-200 bg-white pl-10 pr-8 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  >
                    {STATUS_FILTERS.map((option) => (
                      <option key={option} value={option}>
                        {option === "All" ? "All Statuses" : option}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleExportSources}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                >
                  <Download className="h-4 w-4" />
                  Export Sources
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 px-5 py-4">
            <div className="text-sm">
              <span className="text-brand-700">Showing </span>
              <span className="font-semibold text-brand-900">{filteredSources.length}</span>
              <span className="text-brand-700"> of </span>
              <span className="font-semibold text-brand-900">{sources.length}</span>
              <span className="text-brand-700"> sources</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Source Connector
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Reporting Period
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Records Found
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Last Sync
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-brand-300/50 bg-white">
                {filteredSources.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Database className="h-8 w-8 text-brand-300" />
                        <p className="text-sm font-semibold text-brand-900">
                          No sources found
                        </p>
                        <p className="text-sm text-brand-700">
                          Try changing the search or status filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSources.map((source) => (
                    <tr key={source.id} className="transition-colors hover:bg-brand-100">
                      <td className="px-5 py-3.5 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
                            <Database className="h-4 w-4 text-brand-800" />
                          </div>
                          <span className="font-semibold text-brand-900">{source.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-brand-900">{source.period}</td>
                      <td className="px-5 py-3.5 text-center text-sm font-semibold text-brand-900">
                        {source.records}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-brand-700">{source.lastSync}</td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={source.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-7">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-200 px-5 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                          <Clock className="h-4 w-4 text-brand-800" />
                          TimeSync vs PayEdge Discrepancies
                        </h3>
                        <p className="mt-0.5 text-sm text-brand-700">
                          Review hours mismatch before payroll posting
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                          <input
                            type="text"
                            value={issueSearch}
                            onChange={(e) => setIssueSearch(e.target.value)}
                            placeholder="Search employee..."
                            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800 sm:w-56"
                          />
                        </div>

                        <button
                          onClick={handleFixAll}
                          disabled={openIssues === 0}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Zap className="h-4 w-4" />
                          Auto-fix All ({openIssues})
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-200 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-brand-700">
                      <span>
                        <span className="font-semibold text-brand-900">{openIssues}</span> open
                      </span>
                      <span className="h-3 w-px bg-brand-300" />
                      <span>
                        <span className="font-semibold text-brand-900">{fixedIssues}</span> fixed
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-brand-300/50">
                    {filteredDiscrepancies.length === 0 ? (
                      <div className="px-5 py-14 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="h-8 w-8 text-brand-300" />
                          <p className="text-sm font-semibold text-brand-900">
                            No discrepancy records found
                          </p>
                          <p className="text-sm text-brand-700">
                            Try changing the employee search.
                          </p>
                        </div>
                      </div>
                    ) : (
                      filteredDiscrepancies.map((item) => {
                        const variance = item.timeSyncHours - item.payEdgeHours;

                        return (
                          <div
                            key={item.id}
                            className="px-5 py-4 transition-colors hover:bg-brand-100"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-xs font-semibold text-white">
                                    {item.employee.charAt(0)}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-semibold text-brand-900">
                                        {item.employee}
                                      </p>
                                      <span className="text-[11px] text-brand-700">
                                        {item.empId}
                                      </span>
                                      <IssueBadge status={item.status} />
                                    </div>

                                    <div className="mt-2 grid grid-cols-1 gap-3 text-sm text-brand-700 sm:grid-cols-3">
                                      <div>
                                        <span className="text-brand-700">TimeSync: </span>
                                        <span className="font-semibold text-brand-900">
                                          {formatHours(item.timeSyncHours)}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-brand-700">PayEdge: </span>
                                        <span className="font-semibold text-brand-900">
                                          {formatHours(item.payEdgeHours)}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-brand-700">Variance: </span>
                                        <span className="font-semibold text-red-600">
                                          {variance > 0 ? "+" : ""}
                                          {formatHours(variance)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
                                      <div className="flex items-start gap-2">
                                        <Bot className="mt-0.5 h-4 w-4 text-brand-800" />
                                        <p className="text-sm leading-6 text-brand-700">
                                          {item.suggestion}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 lg:pl-4">
                                <button
                                  onClick={() => handleFixIssue(item.id)}
                                  disabled={item.status === "Fixed"}
                                  className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {item.status === "Fixed" ? "Fixed" : "Mark Fixed"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 lg:col-span-5">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-200 px-5 py-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                      <Landmark className="h-4 w-4 text-brand-800" />
                      Bank Statement Match (HBL)
                    </h3>
                    <p className="mt-0.5 text-sm text-brand-700">
                      Statement comparison against payroll disbursement
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                            Bank Ref
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                            Statement Amt
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                            PayEdge Amt
                          </th>
                          <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                            Match
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-brand-300/50 bg-white">
                        {bankMatches.map((item) => (
                          <tr
                            key={item.id}
                            className={`transition-colors hover:bg-brand-100 ${
                              !item.matched ? "bg-red-50/40" : ""
                            }`}
                          >
                            <td className="px-5 py-3.5 text-sm font-semibold text-brand-900">
                              {item.ref}
                            </td>
                            <td className="px-5 py-3.5 text-right text-sm font-semibold text-brand-900">
                              {formatAmount(item.statementAmount)}
                            </td>
                            <td className="px-5 py-3.5 text-right text-sm font-semibold text-brand-900">
                              {formatAmount(item.payEdgeAmount)}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {item.matched ? (
                                <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" />
                              ) : (
                                <AlertTriangle className="mx-auto h-4 w-4 text-red-600" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-gray-200 px-5 py-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">
                        <span className="font-semibold text-brand-900">{matchedCount}</span> matched,{" "}
                        <span className="font-semibold text-brand-900">{unmatchedCount}</span> unmatched
                      </span>
                      <span className="text-brand-700">325 statement rows</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-brand-900 p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                      <FileSearch className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                        Audit Confirmation
                      </p>
                      <h4 className="mt-1 text-sm font-semibold text-white">
                        January reconciliation snapshot
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-white/80">
                        The engine verified the majority of records against the HBL
                        statement and highlighted only the remaining mismatches for review.
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                          <p className="text-[11px] text-white/70">Matched</p>
                          <p className="text-lg font-semibold text-white">{matchedCount}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                          <p className="text-[11px] text-white/70">Unmatched</p>
                          <p className="text-lg font-semibold text-white">{unmatchedCount}</p>
                        </div>
                      </div>

                      <button
                        onClick={handleExportAudit}
                        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"
                      >
                        <Download className="h-4 w-4" />
                        Final Audit Report
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
              <Info className="h-4 w-4 text-brand-800" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-brand-900">
                Reconciliation Protocol
              </h4>
              <p className="text-sm leading-6 text-brand-700">
                The assistant cross-checks payroll outputs against attendance,
                leave, and bank data. Exceptions are flagged for manual review
                and can be resolved through controlled actions such as mark-fixed
                or export-based audit handling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function SummaryCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
          {label}
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
          {icon}
        </div>
      </div>

      <div className="text-2xl font-bold text-brand-900">{value}</div>
      <p className="mt-2 text-[11px] text-brand-700">{helper}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: SourceStatus }) {
  const styles =
    status === "Synced"
      ? "bg-brand-100 text-brand-800 border-gray-200"
      : status === "Pending"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}

function IssueBadge({ status }: { status: IssueStatus }) {
  const styles =
    status === "Fixed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}


export default ReconciliationAssistant;