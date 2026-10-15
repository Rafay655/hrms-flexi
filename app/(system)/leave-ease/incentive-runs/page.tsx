"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Play,
  History,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Clock,
  Eye,
  Search,
  Calculator,
  Download,
  RefreshCw,
  FileText,
  Zap,
  ShieldAlert,
  Info,
  ArrowUpRight,
  Database,
  Briefcase,
  Settings2,
} from "lucide-react";

type AwardRunStatus = "Completed" | "Running" | "Failed" | "Dry Run";

interface AwardRun {
  id: string;
  rule: string;
  period: string;
  runDate: string;
  status: AwardRunStatus;
  qualified: number;
  awarded: number;
  exceptions: number;
  runBy: string;
}

interface DetailEmployeeRow {
  name: string;
  id: string;
  award?: string;
  reason?: string;
  actual?: string;
  target?: string;
}

const INITIAL_RUNS: AwardRun[] = [
  {
    id: "RUN-2025-001",
    rule: "Perfect Attendance Monthly",
    period: "Jan 2025",
    runDate: "Feb 02, 2025",
    status: "Completed",
    qualified: 125,
    awarded: 125,
    exceptions: 0,
    runBy: "Sarah Admin",
  },
  {
    id: "RUN-2025-002",
    rule: "Punctuality Award",
    period: "Jan 2025",
    runDate: "Feb 02, 2025",
    status: "Completed",
    qualified: 310,
    awarded: 305,
    exceptions: 5,
    runBy: "Sarah Admin",
  },
  {
    id: "RUN-2025-003",
    rule: "Quarterly Wellness",
    period: "Q4 2024",
    runDate: "Jan 05, 2025",
    status: "Completed",
    qualified: 88,
    awarded: 88,
    exceptions: 0,
    runBy: "System",
  },
  {
    id: "RUN-2025-004",
    rule: "Perfect Attendance Monthly",
    period: "Feb 2025",
    runDate: "Now",
    status: "Running",
    qualified: 0,
    awarded: 0,
    exceptions: 0,
    runBy: "John Doe",
  },
  {
    id: "RUN-2025-005",
    rule: "Loyalty Leave",
    period: "Year 2024",
    runDate: "Jan 01, 2025",
    status: "Dry Run",
    qualified: 215,
    awarded: 0,
    exceptions: 2,
    runBy: "Sarah Admin",
  },
];

const RULE_OPTIONS = [
  "Perfect Attendance Monthly",
  "Punctuality Award",
  "Quarterly Wellness",
  "Loyalty Leave",
];

const PERIOD_OPTIONS = [
  "January 2025",
  "February 2025",
  "December 2024",
  "Q4 2024",
  "Year 2024",
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function buildRunId(index: number) {
  return `RUN-2025-${String(index + 1).padStart(3, "0")}`;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csvContent = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getMockQualified(run: AwardRun): DetailEmployeeRow[] {
  return [
    { name: "Ahmed Khan", id: "EMP-101", award: "1.0 d Annual" },
    { name: "Sara Miller", id: "EMP-102", award: "1.0 d Annual" },
    { name: "Tom Chen", id: "EMP-103", award: "1.0 d Annual" },
  ].slice(0, Math.max(1, Math.min(3, run.awarded || 1)));
}

function getMockDisqualified(): DetailEmployeeRow[] {
  return [
    {
        id: "EMP-201",
      name: "Usman Ali",
      reason: "Late Occurrences",
      actual: "3",
      target: "Max 0",
    },
    {
        id: "EMP-202",
      name: "Mona Shah",
      reason: "Attendance %",
      actual: "92%",
      target: "Min 95%",
    },
    {
        id: "EMP-203",
      name: "Ali Raza",
      reason: "Unpaid Leave Taken",
      actual: "1 d",
      target: "0 d",
    },
  ];
}

function getMockExceptions(run: AwardRun): DetailEmployeeRow[] {
  if (run.exceptions === 0) return [];
  return [
    {
        id: "EMP-301",
      name: "Exception Group",
      reason: `Missing Payroll ID (${run.exceptions} Employees)`,
      actual: "Attendance / payroll mismatch",
      target: "Valid employee mapping",
    },
  ];
}

export default function IncentiveAwardRuns() {
  const [runs, setRuns] = useState<AwardRun[]>(INITIAL_RUNS);

  const [runRule, setRunRule] = useState("Perfect Attendance Monthly");
  const [runPeriod, setRunPeriod] = useState("January 2025");
  const [isDryRun, setIsDryRun] = useState(false);
  const [isLaunchingRun, setIsLaunchingRun] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedRun, setSelectedRun] = useState<AwardRun | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<
    "qualified" | "disqualified" | "exceptions"
  >("qualified");

  const filteredRuns = useMemo(() => {
    const q = search.trim().toLowerCase();

    return runs.filter((run) => {
      const haystack = [
        run.id,
        run.rule,
        run.period,
        run.runDate,
        run.status,
        run.runBy,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || haystack.includes(q);
      const matchesStatus =
        statusFilter === "All" || run.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [runs, search, statusFilter]);

  const totalQualified = useMemo(
    () => runs.reduce((sum, run) => sum + run.qualified, 0),
    [runs]
  );

  const totalAwarded = useMemo(
    () => runs.reduce((sum, run) => sum + run.awarded, 0),
    [runs]
  );

  const totalExceptions = useMemo(
    () => runs.reduce((sum, run) => sum + run.exceptions, 0),
    [runs]
  );

  const getStatusBadge = (status: AwardRunStatus) => {
    switch (status) {
      case "Completed":
        return "bg-brand-700 text-white";
      case "Running":
        return "bg-blue-600 text-white";
      case "Failed":
        return "bg-red-600 text-white";
      case "Dry Run":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const executeNewRun = () => {
    if (isLaunchingRun) return;

    setIsLaunchingRun(true);

    const draftRun: AwardRun = {
      id: buildRunId(runs.length),
      rule: runRule,
      period: runPeriod,
      runDate: "Now",
      status: isDryRun ? "Dry Run" : "Running",
      qualified: isDryRun ? 210 : 0,
      awarded: isDryRun ? 0 : 0,
      exceptions: isDryRun ? 2 : 0,
      runBy: "Current User",
    };

    if (isDryRun) {
      setRuns((prev) => [draftRun, ...prev]);
      setIsLaunchingRun(false);
      return;
    }

    setRuns((prev) => [draftRun, ...prev]);

    setTimeout(() => {
      setRuns((prev) =>
        prev.map((run) =>
          run.id === draftRun.id
            ? {
                ...run,
                runDate: new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                }),
                status: "Completed",
                qualified: 126,
                awarded: 124,
                exceptions: 2,
              }
            : run
        )
      );
      setIsLaunchingRun(false);
    }, 1800);
  };

  const rerunJob = (run: AwardRun) => {
    setRuns((prev) =>
      prev.map((item) =>
        item.id === run.id
          ? {
              ...item,
              status: "Running",
              runDate: "Now",
            }
          : item
      )
    );

    setTimeout(() => {
      const updatedRun: AwardRun = {
        ...run,
        runDate: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        status: run.status === "Dry Run" ? "Dry Run" : "Completed",
        qualified: Math.max(run.qualified, 1),
        awarded:
          run.status === "Dry Run"
            ? 0
            : Math.max(run.awarded, Math.max(run.qualified - run.exceptions, 1)),
        exceptions: run.exceptions,
      };

      setRuns((prev) =>
        prev.map((item) => (item.id === run.id ? updatedRun : item))
      );

      if (selectedRun?.id === run.id) {
        setSelectedRun(updatedRun);
      }
    }, 1600);
  };

  const exportRuns = () => {
    const rows = [
      [
        "Run ID",
        "Rule",
        "Period",
        "Run Date",
        "Status",
        "Qualified",
        "Awarded",
        "Exceptions",
        "Run By",
      ],
      ...filteredRuns.map((run) => [
        run.id,
        run.rule,
        run.period,
        run.runDate,
        run.status,
        run.qualified,
        run.awarded,
        run.exceptions,
        run.runBy,
      ]),
    ];

    downloadCsv("incentive-award-runs.csv", rows);
  };

  const exportRunDetail = (run: AwardRun) => {
    const rows = [
      ["Run ID", run.id],
      ["Rule", run.rule],
      ["Period", run.period],
      ["Status", run.status],
      ["Qualified", run.qualified],
      ["Awarded", run.awarded],
      ["Exceptions", run.exceptions],
      [],
      ["Qualified Employees"],
      ["Name", "Employee ID", "Award"],
      ...getMockQualified(run).map((item) => [item.name, item.id ?? "", item.award ?? ""]),
    ];

    downloadCsv(`${run.id}-detail.csv`, rows);
  };

  useEffect(() => {
    if (!selectedRun) return;
    const updated = runs.find((run) => run.id === selectedRun.id);
    if (updated) setSelectedRun(updated);
  }, [runs, selectedRun]);

  const qualifiedRows = selectedRun ? getMockQualified(selectedRun) : [];
  const disqualifiedRows = selectedRun ? getMockDisqualified() : [];
  const exceptionRows = selectedRun ? getMockExceptions(selectedRun) : [];

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <Play className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Incentive Award Runs
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Execute incentive rules and audit leave distributions based on attendance data.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                Total Qualified
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-900">
                {totalQualified.toLocaleString()} staff
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                Total Awarded
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-900">
                {totalAwarded.toLocaleString()} entries
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                Total Exceptions
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-900">
                {totalExceptions.toLocaleString()} exceptions
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Run Form */}
          <div className="lg:col-span-4">
            <div className="sticky top-8 rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-brand-700" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Run New Award
                  </h3>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Rule to Execute
                  </label>
                  <select
                    value={runRule}
                    onChange={(e) => setRunRule(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  >
                    {RULE_OPTIONS.map((rule) => (
                      <option key={rule}>{rule}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Evaluation Period
                  </label>
                  <select
                    value={runPeriod}
                    onChange={(e) => setRunPeriod(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  >
                    {PERIOD_OPTIONS.map((period) => (
                      <option key={period}>{period}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:bg-brand-100">
                  <input
                    type="checkbox"
                    checked={isDryRun}
                    onChange={(e) => setIsDryRun(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  />
                  <div>
                    <p className="text-sm font-medium text-brand-900">Dry Run Only</p>
                    <p className="mt-0.5 text-[11px] text-brand-700">
                      Preview results without updating employee leave balances.
                    </p>
                  </div>
                </label>

                <button
                  onClick={executeNewRun}
                  disabled={isLaunchingRun}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLaunchingRun ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {isDryRun ? "Execute Dry Run" : "Execute Award Job"}
                </button>
              </div>

              <div className="border-t border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 text-amber-700" />
                  <p className="text-sm leading-6 text-amber-900">
                    Job will verify attendance data via <span className="font-semibold">TimeSync</span> before processing. Expected duration: 2–5 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Job History */}
          <div className="space-y-4 lg:col-span-8">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-brand-700" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Job Execution History
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                    <input
                      type="text"
                      placeholder="Search runs, rules, periods..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none"
                  >
                    <option>All</option>
                    <option>Completed</option>
                    <option>Running</option>
                    <option>Failed</option>
                    <option>Dry Run</option>
                  </select>

                  <button
                    onClick={exportRuns}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm">
                  <span className="text-brand-700">Showing </span>
                  <span className="font-semibold text-brand-900">
                    {filteredRuns.length}
                  </span>
                  <span className="text-brand-700"> runs</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-white">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Job ID / Rule
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Period
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Qualified
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Exceptions
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredRuns.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Briefcase className="h-10 w-10 text-brand-300" />
                            <p className="text-sm font-semibold text-brand-900">
                              No award runs found
                            </p>
                            <p className="text-sm text-brand-700">
                              Try adjusting your search or status filter.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRuns.map((run) => (
                        <tr
                          key={run.id}
                          className="cursor-pointer transition-colors hover:bg-brand-100"
                          onClick={() => {
                            setSelectedRun(run);
                            setActiveDetailTab("qualified");
                          }}
                        >
                          <td className="px-5 py-3.5 text-sm">
                            <div>
                              <div className="font-semibold text-brand-900">
                                {run.rule}
                              </div>
                              <div className="text-[11px] font-mono text-brand-700">
                                {run.id}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-sm text-brand-700">
                            {run.period}
                          </td>

                          <td className="px-5 py-3.5 text-sm">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                                getStatusBadge(run.status)
                              )}
                            >
                              {run.status === "Running" && (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              )}
                              {run.status}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-sm">
                            <div className="font-semibold text-brand-900">
                              {run.qualified} staff
                            </div>
                            <div className="text-[11px] text-emerald-600">
                              {run.awarded} awarded
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-sm">
                            <span
                              className={cn(
                                "font-medium",
                                run.exceptions > 0
                                  ? "text-red-600"
                                  : "text-brand-700"
                              )}
                            >
                              {run.exceptions} {run.exceptions === 1 ? "Error" : "Errors"}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-center text-sm">
                            <button className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100">
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Drawer */}
        {selectedRun && (
          <div className="fixed inset-0 z-[200] overflow-hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedRun(null)}
            />

            <div className="absolute right-0 top-0 flex h-full w-full max-w-[680px] flex-col border-l border-gray-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      selectedRun.status === "Completed"
                        ? "bg-brand-100"
                        : selectedRun.status === "Running"
                        ? "bg-blue-100"
                        : selectedRun.status === "Failed"
                        ? "bg-red-100"
                        : "bg-gray-100"
                    )}
                  >
                    <FileText className="h-5 w-5 text-brand-800" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-brand-900">
                      Run Audit
                    </h2>
                    <p className="mt-0.5 text-sm text-brand-700">
                      {selectedRun.id} · {selectedRun.rule} · {selectedRun.period}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRun(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-brand-700 transition hover:bg-brand-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Summary cards */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                        Executed On
                      </p>
                      <p className="mt-1 text-sm font-semibold text-brand-900">
                        {selectedRun.runDate}
                      </p>
                      <p className="mt-1 text-[11px] text-brand-700">
                        by {selectedRun.runBy}
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                        Ledger Entries
                      </p>
                      <p className="mt-1 text-sm font-semibold text-emerald-600">
                        +{selectedRun.awarded} entries
                      </p>
                      <button className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand-800 transition hover:text-brand-900">
                        View in Audit Log <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div>
                    <div className="flex gap-4 border-b border-gray-200">
                      {[
                        { key: "qualified", label: `Qualified (${selectedRun.qualified})` },
                        { key: "disqualified", label: "Disqualified" },
                        { key: "exceptions", label: `Exceptions (${selectedRun.exceptions})` },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() =>
                            setActiveDetailTab(
                              tab.key as "qualified" | "disqualified" | "exceptions"
                            )
                          }
                          className={cn(
                            "border-b-2 px-1 pb-3 text-xs font-semibold uppercase tracking-wider transition",
                            activeDetailTab === tab.key
                              ? "border-brand-800 text-brand-900"
                              : "border-transparent text-brand-700 hover:text-brand-900"
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="pt-4">
                      {activeDetailTab === "qualified" && (
                        <div className="space-y-3">
                          {qualifiedRows.map((emp, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-semibold text-emerald-700">
                                  OK
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-brand-900">
                                    {emp.name}
                                  </p>
                                  <p className="text-[11px] text-brand-700">
                                    {emp.id}
                                  </p>
                                </div>
                              </div>

                              <span className="text-sm font-semibold text-brand-900">
                                {emp.award}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeDetailTab === "disqualified" && (
                        <div className="space-y-3">
                          {disqualifiedRows.map((emp, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-[11px] font-semibold text-gray-600">
                                  X
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-brand-900">
                                    {emp.name}
                                  </p>
                                  <p className="text-[11px] text-red-600">
                                    {emp.reason}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-medium text-brand-700">
                                  {emp.actual} / <span className="text-brand-900">{emp.target}</span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeDetailTab === "exceptions" && (
                        <div className="space-y-3">
                          {exceptionRows.length === 0 ? (
                            <div className="rounded-lg border border-gray-200 bg-white p-4">
                              <p className="text-sm font-medium text-brand-700">
                                No exceptions recorded for this run.
                              </p>
                            </div>
                          ) : (
                            exceptionRows.map((item, i) => (
                              <div
                                key={i}
                                className="rounded-lg border border-red-200 bg-red-50 p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="mt-0.5 h-4 w-4 text-red-600" />
                                  <div>
                                    <p className="text-sm font-semibold text-red-900">
                                      {item.reason}
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-red-800/90">
                                      {item.actual}. Expected: {item.target}.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reversal Panel */}
                  <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                    <div className="flex items-center gap-3 text-red-700">
                      <ShieldAlert className="h-5 w-5" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider">
                        Enterprise Reversal
                      </h4>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-red-800/90">
                      If attendance data was corrected after this job executed, you can reverse all awards. This creates debit entries with reference <span className="font-semibold">REV-{selectedRun.id}</span>.
                    </p>

                    <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100">
                      <RotateCcw className="h-4 w-4" />
                      Reverse Award Batch
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 border-t border-gray-200 bg-white px-6 py-4">
                <button
                  onClick={() => exportRunDetail(selectedRun)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100 inline-flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Detailed CSV
                </button>

                <button
                  onClick={() => rerunJob(selectedRun)}
                  className="flex-1 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900 inline-flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Re-run Job
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}