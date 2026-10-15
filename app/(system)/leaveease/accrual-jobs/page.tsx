"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Play,
  History,
  Clock,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  X,
  Info,
  Download,
  Settings2,
  ShieldCheck,
  RotateCcw,
  Eye,
  Calculator,
  Calendar,
  Briefcase,
} from "lucide-react";

interface AccrualJob {
  id: string;
  date: string;
  period: string;
  types: string;
  scope: string;
  status: "Completed" | "Running" | "Failed" | "Draft";
  employees: number;
  totalDays: number;
  errors: number;
}

const INITIAL_JOBS: AccrualJob[] = [
  {
    id: "JOB-2025-001",
    date: "Jan 01, 2025",
    period: "Jan 2025",
    types: "All",
    scope: "All Staff",
    status: "Completed",
    employees: 450,
    totalDays: 820.5,
    errors: 0,
  },
  {
    id: "JOB-2024-012",
    date: "Dec 01, 2024",
    period: "Dec 2024",
    types: "Annual, Sick",
    scope: "Engineering",
    status: "Completed",
    employees: 142,
    totalDays: 284,
    errors: 2,
  },
  {
    id: "JOB-2024-011",
    date: "Nov 01, 2024",
    period: "Nov 2024",
    types: "All",
    scope: "All Staff",
    status: "Completed",
    employees: 445,
    totalDays: 812,
    errors: 1,
  },
  {
    id: "JOB-2024-010",
    date: "Oct 01, 2024",
    period: "Oct 2024",
    types: "All",
    scope: "All Staff",
    status: "Completed",
    employees: 442,
    totalDays: 805,
    errors: 0,
  },
];

type LeaveTypeMode = "All" | "Specific";

type EmployeeCreditRow = {
  name: string;
  type: string;
  base: number;
  proration: number;
  credited: number;
  status: string;
  error?: boolean;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function buildJobId(existingCount: number) {
  const year = new Date().getFullYear();
  return `JOB-${year}-${String(existingCount + 1).padStart(3, "0")}`;
}

const MOCK_EMPLOYEE_BREAKDOWN: EmployeeCreditRow[] = [
  {
    name: "Ahmed Khan",
    type: "Annual",
    base: 2.0,
    proration: 1.0,
    credited: 2.0,
    status: "OK",
  },
  {
    name: "Sara Ahmed",
    type: "Annual",
    base: 2.0,
    proration: 0.5,
    credited: 1.0,
    status: "Prorated (Joined Jan 15)",
  },
  {
    name: "Tariq Mehmood",
    type: "Annual",
    base: 2.0,
    proration: 1.0,
    credited: 2.0,
    status: "OK",
  },
  {
    name: "Zoya Malik",
    type: "Annual",
    base: 2.0,
    proration: 0,
    credited: 0,
    status: "Failed: Missing Pay ID",
    error: true,
  },
];

export default function AccrualJobs() {
  const [jobs, setJobs] = useState<AccrualJob[]>(INITIAL_JOBS);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("February 2025");
  const [leaveTypeMode, setLeaveTypeMode] = useState<LeaveTypeMode>("All");
  const [scope, setScope] = useState("All Staff");
  const [dryRun, setDryRun] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentEmp, setCurrentEmp] = useState("");
  const [selectedJob, setSelectedJob] = useState<AccrualJob | null>(null);
  const [detailSearch, setDetailSearch] = useState("");

  useEffect(() => {
    if (!isRunning) return;

    const emps = [
      "Ahmed Khan",
      "Sara Ahmed",
      "Tariq Mehmood",
      "Zoya Malik",
      "Ali Raza",
      "Hamza Yousaf",
    ];

    let current = 0;

    const interval = setInterval(() => {
      current += 10;
      setProgress(current);
      setCurrentEmp(emps[Math.floor(Math.random() * emps.length)]);

      if (current >= 100) {
        clearInterval(interval);

        const newJob: AccrualJob = {
          id: buildJobId(jobs.length),
          date: formatToday(),
          period,
          types: leaveTypeMode === "All" ? "All" : "Specific",
          scope,
          status: dryRun ? "Draft" : "Completed",
          employees: scope === "All Staff" ? 450 : 140,
          totalDays: dryRun ? 0 : scope === "All Staff" ? 818.5 : 281.0,
          errors: dryRun ? 0 : Math.random() > 0.7 ? 1 : 0,
        };

        setJobs((prev) => [newJob, ...prev]);
        setIsRunning(false);
        setProgress(0);
        setCurrentEmp("");
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, jobs.length, period, leaveTypeMode, scope, dryRun]);

  const handleRun = () => {
    if (isRunning) return;
    setIsRunning(true);
    setProgress(0);
    setCurrentEmp("");
  };

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;

    return jobs.filter((job) => {
      const haystack =
        `${job.id} ${job.date} ${job.period} ${job.types} ${job.scope} ${job.status}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [jobs, search]);

  const filteredDetailRows = useMemo(() => {
    const q = detailSearch.trim().toLowerCase();
    if (!q) return MOCK_EMPLOYEE_BREAKDOWN;

    return MOCK_EMPLOYEE_BREAKDOWN.filter((row) => {
      const haystack = `${row.name} ${row.type} ${row.status}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [detailSearch]);

  const completedCount = jobs.filter((job) => job.status === "Completed").length;
  const failedCount = jobs.filter((job) => job.status === "Failed").length;
  const totalCredits = jobs.reduce((sum, job) => sum + job.totalDays, 0);

  const getStatusClasses = (status: AccrualJob["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-brand-700 text-white";
      case "Running":
        return "bg-amber-500 text-white";
      case "Failed":
        return "bg-red-600 text-white";
      case "Draft":
        return "bg-brand-600 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Accrual Jobs
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Run leave accrual batches, monitor execution, and review historical job activity.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Auto Schedule
                </p>
              </div>
              <p className="text-sm font-semibold text-brand-900">
                Monthly on 1st at 12:00 AM
              </p>
              <p className="mt-1 text-[11px] text-brand-700">
                Next run: Feb 1, 2025
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Completed Jobs
                </p>
              </div>
              <p className="text-sm font-semibold text-brand-900">
                {completedCount} successful runs
              </p>
              <p className="mt-1 text-[11px] text-brand-700">
                Failed jobs: {failedCount}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Total Credits Processed
                </p>
              </div>
              <p className="text-sm font-semibold text-brand-900">
                {totalCredits.toFixed(1)} days
              </p>
              <p className="mt-1 text-[11px] text-brand-700">
                Across all recorded accrual batches
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Run panel */}
          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-brand-700" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Run Accrual
                  </h3>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Period
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  >
                    <option>February 2025</option>
                    <option>January 2025</option>
                    <option>March 2025 (Forecast)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-brand-900">
                    Leave Types
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={cn(
                        "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                        leaveTypeMode === "All"
                          ? "border-brand-800 bg-brand-100 text-brand-900"
                          : "border-gray-200 bg-white text-brand-700 hover:bg-brand-100"
                      )}
                    >
                      <input
                        type="radio"
                        name="leaveTypeMode"
                        className="hidden"
                        checked={leaveTypeMode === "All"}
                        onChange={() => setLeaveTypeMode("All")}
                      />
                      All
                    </label>

                    <label
                      className={cn(
                        "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                        leaveTypeMode === "Specific"
                          ? "border-brand-800 bg-brand-100 text-brand-900"
                          : "border-gray-200 bg-white text-brand-700 hover:bg-brand-100"
                      )}
                    >
                      <input
                        type="radio"
                        name="leaveTypeMode"
                        className="hidden"
                        checked={leaveTypeMode === "Specific"}
                        onChange={() => setLeaveTypeMode("Specific")}
                      />
                      Specific
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Scope
                  </label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  >
                    <option>All Staff</option>
                    <option>Engineering Dept</option>
                    <option>Sales Dept</option>
                    <option>Remote Workers</option>
                  </select>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:bg-brand-100">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  />
                  <div>
                    <p className="text-sm font-medium text-brand-900">
                      Dry Run Only
                    </p>
                    <p className="mt-0.5 text-[11px] text-brand-700">
                      Preview accrual impact without updating balances or ledger records.
                    </p>
                  </div>
                </label>

                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRunning ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isRunning ? "Processing..." : "Run Accrual Job"}
                </button>
              </div>
            </div>

            {isRunning && (
              <div className="rounded-xl border border-gray-200 bg-brand-900 p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    Live Progress
                  </h3>
                  <button
                    onClick={() => {
                      setIsRunning(false);
                      setProgress(0);
                      setCurrentEmp("");
                    }}
                    className="text-xs font-medium text-white/70 transition hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/80">
                      {Math.round(450 * (progress / 100))} / 450 employees
                    </span>
                    <span className="font-semibold text-white">{progress}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-white/75">
                    {currentEmp
                      ? `Processing ${currentEmp}...`
                      : "Preparing batch execution..."}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-700" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Schedule Info
                </h3>
              </div>

              <div className="space-y-1 text-sm">
                <p className="text-brand-700">
                  Auto-run:{" "}
                  <span className="font-semibold text-brand-900">
                    Monthly on 1st at 12:00 AM
                  </span>
                </p>
                <p className="text-brand-700">
                  Next run:{" "}
                  <span className="font-semibold text-brand-900">
                    Feb 1, 2025
                  </span>
                </p>
              </div>

              <button className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-800 transition hover:text-brand-900">
                Change Schedule <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* History */}
          <div className="space-y-4 lg:col-span-8">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-brand-700" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Job History
                  </h3>
                </div>

                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    type="text"
                    placeholder="Search by job ID, period, scope..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm">
                  <span className="text-brand-700">Showing </span>
                  <span className="font-semibold text-brand-900">
                    {filteredJobs.length}
                  </span>
                  <span className="text-brand-700"> jobs</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-brand-700">
                    <span className="font-semibold text-brand-900">
                      {completedCount}
                    </span>
                    Completed
                  </div>
                  <div className="h-3 w-px bg-gray-200" />
                  <div className="flex items-center gap-1.5 text-brand-700">
                    <span className="font-semibold text-brand-900">
                      {failedCount}
                    </span>
                    Failed
                  </div>
                  <div className="h-3 w-px bg-gray-200" />
                  <div className="flex items-center gap-1.5 text-brand-700">
                    <span className="font-semibold text-brand-900">
                      {jobs.length}
                    </span>
                    Total Runs
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-white">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Job ID / Date
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Period
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Types
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Scope
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Status
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Credits
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Errors
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Briefcase className="h-10 w-10 text-brand-300" />
                            <p className="text-sm font-semibold text-brand-900">
                              No accrual jobs found
                            </p>
                            <p className="text-sm text-brand-700">
                              Try adjusting your search criteria.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job) => (
                        <tr
                          key={job.id}
                          className="transition-colors hover:bg-brand-100"
                        >
                          <td className="px-5 py-3.5 text-sm">
                            <div>
                              <div className="font-mono text-sm font-semibold text-brand-900">
                                {job.id}
                              </div>
                              <div className="text-[11px] text-brand-700">
                                {job.date}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-sm font-medium text-brand-900">
                            {job.period}
                          </td>

                          <td className="px-5 py-3.5 text-sm text-brand-700">
                            {job.types}
                          </td>

                          <td className="px-5 py-3.5 text-sm text-brand-700">
                            {job.scope}
                          </td>

                          <td className="px-5 py-3.5 text-center text-sm">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                                getStatusClasses(job.status)
                              )}
                            >
                              {job.status}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right text-sm">
                            <div className="font-semibold text-brand-900">
                              {job.totalDays.toFixed(1)} days
                            </div>
                            <div className="text-[11px] text-brand-700">
                              {job.employees} staff
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-center text-sm">
                            <span
                              className={cn(
                                "font-semibold",
                                job.errors > 0 ? "text-red-600" : "text-brand-700"
                              )}
                            >
                              {job.errors}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-center text-sm">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100 hover:text-brand-900"
                                title="Re-run Job"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <button
                                className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100 hover:text-brand-900"
                                title="View Details"
                                onClick={() => setSelectedJob(job)}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 text-amber-700" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Accrual Proration Logic
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-800/90">
                    The system applies proration for employees joining or leaving within the period. Review each job’s detail log to validate formula outputs, skipped records, and exceptions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail drawer */}
        {selectedJob && (
          <div className="fixed inset-0 z-[100] overflow-hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedJob(null)}
            />

            <div className="absolute right-0 top-0 flex h-full w-full max-w-[760px] flex-col border-l border-gray-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                    <Database className="h-5 w-5 text-white" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-brand-900">
                      Job Detail
                    </h2>
                    <p className="mt-0.5 text-sm text-brand-700">
                      {selectedJob.id} · {selectedJob.period} accrual run
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedJob(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-brand-700 transition hover:bg-brand-100 hover:text-brand-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                        Types
                      </p>
                      <p className="mt-1 text-sm font-semibold text-brand-900">
                        {selectedJob.types}
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                        Scope
                      </p>
                      <p className="mt-1 text-sm font-semibold text-brand-900">
                        {selectedJob.scope}
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                        Employees
                      </p>
                      <p className="mt-1 text-sm font-semibold text-brand-900">
                        {selectedJob.employees}
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                        Errors
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-sm font-semibold",
                          selectedJob.errors > 0 ? "text-red-600" : "text-brand-900"
                        )}
                      >
                        {selectedJob.errors}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-brand-700" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Employee Credit Log
                        </h3>
                      </div>

                      <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                        <input
                          type="text"
                          placeholder="Search employee..."
                          value={detailSearch}
                          onChange={(e) => setDetailSearch(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-gray-200 bg-white">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                              Employee
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                              Leave Type
                            </th>
                            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                              Base
                            </th>
                            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                              Proration
                            </th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                              Credited
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 bg-white">
                          {filteredDetailRows.map((row, i) => (
                            <tr key={i} className="transition-colors hover:bg-brand-100">
                              <td className="px-5 py-3.5 text-sm">
                                <div>
                                  <div className="font-semibold text-brand-900">
                                    {row.name}
                                  </div>
                                  <div
                                    className={cn(
                                      "text-[11px]",
                                      row.error ? "text-red-600" : "text-brand-700"
                                    )}
                                  >
                                    {row.status}
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-3.5 text-sm text-brand-700">
                                {row.type}
                              </td>

                              <td className="px-5 py-3.5 text-center text-sm text-brand-700">
                                {row.base.toFixed(2)}
                              </td>

                              <td className="px-5 py-3.5 text-center text-sm text-brand-700">
                                × {row.proration.toFixed(2)}
                              </td>

                              <td className="px-5 py-3.5 text-right text-sm">
                                <span
                                  className={cn(
                                    "font-semibold",
                                    row.error ? "text-gray-400" : "text-emerald-600"
                                  )}
                                >
                                  +{row.credited.toFixed(2)} d
                                </span>
                              </td>
                            </tr>
                          ))}

                          {filteredDetailRows.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-5 py-12 text-center">
                                <p className="text-sm font-medium text-brand-700">
                                  No employee records found for this search.
                                </p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-brand-100 p-5">
                    <div className="flex items-start gap-3">
                      <Calculator className="mt-0.5 h-4 w-4 text-brand-700" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Proration Formula
                        </p>
                        <code className="mt-2 inline-block rounded-md border border-gray-200 bg-white px-3 py-2 text-[11px] text-brand-900">
                          (Days in Service / Total Days in Period) * Period Quota
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-amber-700" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          Audit Guidance
                        </p>
                        <p className="mt-1 text-sm leading-6 text-amber-800/90">
                          Review prorated entries, skipped records, and failed balances before rerunning any completed batch.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-brand-700">
                  Export this run or rerun the batch for corrected records.
                </p>

                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>

                  <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900">
                    <RotateCcw className="h-4 w-4" />
                    Re-run Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}