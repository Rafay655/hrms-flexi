"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Plus,
  Search,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Database,
  Info,
  Users,
  ArrowRightLeft,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Briefcase,
  X,
  Play,
} from "lucide-react";

interface SummaryRow {
  type: string;
  total: number;
  cf: number;
  lapse: number;
  encash: number;
}

interface EmployeeRow {
  name: string;
  dept: string;
  type: string;
  current: number;
  carry: number;
  lapse: number;
  newOpening: number;
  highLapse?: boolean;
}

type ProcessMode = "Dry Run" | "Final Run";
type ProcessStatus = "Completed" | "In Progress";

interface YearEndRun {
  id: string;
  yearEnding: string;
  processingDate: string;
  mode: ProcessMode;
  status: ProcessStatus;
  staffProcessed: number;
  carryForwardDays: number;
  lapsedDays: number;
  encashDays: number;
  createdAt: string;
  summary: SummaryRow[];
}

const BASE_SUMMARY: SummaryRow[] = [
  { type: "Annual Leave", total: 2450, cf: 1250, lapse: 340, encash: 860 },
  { type: "Sick Leave", total: 1100, cf: 1100, lapse: 0, encash: 0 },
  { type: "Casual Leave", total: 850, cf: 0, lapse: 850, encash: 0 },
];

const BASE_EMPLOYEES: EmployeeRow[] = [
  {
    name: "Ahmed Khan",
    dept: "Engineering",
    type: "Annual",
    current: 14.5,
    carry: 10,
    lapse: 4.5,
    newOpening: 10,
  },
  {
    name: "Sara Miller",
    dept: "Product",
    type: "Annual",
    current: 8,
    carry: 8,
    lapse: 0,
    newOpening: 8,
  },
  {
    name: "Tom Chen",
    dept: "Engineering",
    type: "Annual",
    current: 18,
    carry: 10,
    lapse: 8,
    newOpening: 10,
    highLapse: true,
  },
  {
    name: "Anna Bell",
    dept: "Design",
    type: "Annual",
    current: 12,
    carry: 10,
    lapse: 2,
    newOpening: 10,
  },
  {
    name: "Zoya Malik",
    dept: "Engineering",
    type: "Casual",
    current: 5,
    carry: 0,
    lapse: 5,
    newOpening: 0,
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatNow() {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

function buildRunId(index: number) {
  const year = new Date().getFullYear();
  return `YEP-${year}-${String(index + 1).padStart(3, "0")}`;
}

function buildSummaryForYear(yearEnding: string): SummaryRow[] {
  const yearNum = Number(yearEnding) || 2024;
  const diff = yearNum - 2024;

  return BASE_SUMMARY.map((row, index) => {
    const factor = 1 + diff * 0.03 + index * 0.01;
    return {
      ...row,
      total: Math.round(row.total * factor),
      cf: Math.round(row.cf * factor),
      lapse: Math.round(row.lapse * factor),
      encash: Math.round(row.encash * factor),
    };
  });
}

export default function YearEndProcessingList() {
  const [runs, setRuns] = useState<YearEndRun[]>([
    {
      id: "YEP-2025-001",
      yearEnding: "2024",
      processingDate: "2025-01-01",
      mode: "Dry Run",
      status: "Completed",
      staffProcessed: 5,
      carryForwardDays: 2350,
      lapsedDays: 1190,
      encashDays: 860,
      createdAt: "Jan 01, 2025, 9:00 AM",
      summary: BASE_SUMMARY,
    },
  ]);

  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [selectedRun, setSelectedRun] = useState<YearEndRun | null>(null);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [step, setStep] = useState(1);

  const [yearEnding, setYearEnding] = useState("2024");
  const [processingDate, setProcessingDate] = useState("2025-01-01");
  const [isDryRun, setIsDryRun] = useState(true);

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("All Leave Types");

  const [confirmed, setConfirmed] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Preparing execution...");

  const years = useMemo(() => {
    const all = Array.from(new Set(runs.map((r) => r.yearEnding)));
    return ["All", ...all.sort((a, b) => Number(b) - Number(a))];
  }, [runs]);

  const departments = useMemo(() => {
    return ["All Departments", ...Array.from(new Set(BASE_EMPLOYEES.map((e) => e.dept)))];
  }, []);

  const leaveTypes = useMemo(() => {
    return ["All Leave Types", ...Array.from(new Set(BASE_EMPLOYEES.map((e) => e.type)))];
  }, []);

  const currentSummary = useMemo(() => buildSummaryForYear(yearEnding), [yearEnding]);

  const summaryTotals = useMemo(() => {
    return currentSummary.reduce(
      (acc, row) => {
        acc.total += row.total;
        acc.cf += row.cf;
        acc.lapse += row.lapse;
        acc.encash += row.encash;
        return acc;
      },
      { total: 0, cf: 0, lapse: 0, encash: 0 }
    );
  }, [currentSummary]);

  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();

    return BASE_EMPLOYEES.filter((emp) => {
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.dept.toLowerCase().includes(q) ||
        emp.type.toLowerCase().includes(q);

      const matchesDept =
        departmentFilter === "All Departments" || emp.dept === departmentFilter;

      const matchesType =
        leaveTypeFilter === "All Leave Types" || emp.type === leaveTypeFilter;

      return matchesSearch && matchesDept && matchesType;
    });
  }, [employeeSearch, departmentFilter, leaveTypeFilter]);

  const filteredRuns = useMemo(() => {
    const q = search.trim().toLowerCase();

    return runs.filter((run) => {
      const matchesSearch =
        !q ||
        run.id.toLowerCase().includes(q) ||
        run.yearEnding.toLowerCase().includes(q) ||
        run.mode.toLowerCase().includes(q) ||
        run.processingDate.toLowerCase().includes(q);

      const matchesMode = modeFilter === "All" || run.mode === modeFilter;
      const matchesYear = yearFilter === "All" || run.yearEnding === yearFilter;

      return matchesSearch && matchesMode && matchesYear;
    });
  }, [runs, search, modeFilter, yearFilter]);

  const totalCarry = useMemo(
    () => runs.reduce((sum, run) => sum + run.carryForwardDays, 0),
    [runs]
  );

  const totalLapse = useMemo(
    () => runs.reduce((sum, run) => sum + run.lapsedDays, 0),
    [runs]
  );

  const openWizard = () => {
    setIsWizardOpen(true);
    setStep(1);
    setYearEnding("2024");
    setProcessingDate("2025-01-01");
    setIsDryRun(true);
    setEmployeeSearch("");
    setDepartmentFilter("All Departments");
    setLeaveTypeFilter("All Leave Types");
    setConfirmed(false);
    setIsExecuting(false);
    setProgress(0);
    setStatus("Preparing execution...");
  };

  const closeWizard = () => {
    if (isExecuting) return;
    setIsWizardOpen(false);
  };

  const handleNext = () => {
    if (step === 1 && (!yearEnding || !processingDate)) return;
    if (step < 4) setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const saveRunRecord = (mode: ProcessMode) => {
    const newRun: YearEndRun = {
      id: buildRunId(runs.length),
      yearEnding,
      processingDate,
      mode,
      status: "Completed",
      staffProcessed: filteredEmployees.length || BASE_EMPLOYEES.length,
      carryForwardDays: summaryTotals.cf,
      lapsedDays: summaryTotals.lapse,
      encashDays: summaryTotals.encash,
      createdAt: formatNow(),
      summary: currentSummary,
    };

    setRuns((prev) => [newRun, ...prev]);
    setIsWizardOpen(false);
    setStep(1);
    setSelectedRun(newRun);
  };

  const startProcessing = () => {
    if (!confirmed || isExecuting) return;

    setIsExecuting(true);
    setProgress(0);
    setStatus("Validating balances...");

    let current = 0;

    const interval = setInterval(() => {
      current += 5;
      setProgress(current);

      if (current >= 10 && current < 30) setStatus("Validating balances...");
      if (current >= 30 && current < 60) setStatus("Creating carry forward entries...");
      if (current >= 60 && current < 90) setStatus("Creating lapse entries...");
      if (current >= 90 && current < 100) setStatus("Resetting opening balances...");

      if (current >= 100) {
        clearInterval(interval);
        setIsExecuting(false);
        setProgress(100);
        setStatus("Completed");
        saveRunRecord(isDryRun ? "Dry Run" : "Final Run");
      }
    }, 140);
  };

  const exportRuns = () => {
    const rows = [
      ["Run ID", "Year Ending", "Processing Date", "Mode", "Status", "Staff", "Carry Forward", "Lapse", "Encash", "Created At"],
      ...filteredRuns.map((run) => [
        run.id,
        run.yearEnding,
        run.processingDate,
        run.mode,
        run.status,
        run.staffProcessed,
        run.carryForwardDays,
        run.lapsedDays,
        run.encashDays,
        run.createdAt,
      ]),
    ];

    downloadCsv("year-end-runs.csv", rows);
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Year-End Processing
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Manage dry runs and final year-end leave transition records.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={exportRuns}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>

              <button
                onClick={openWizard}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <Plus className="h-4 w-4" />
                New Processing
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <Database className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Total Runs
                </p>
              </div>
              <p className="text-sm font-semibold text-brand-900">
                {runs.length} records
              </p>
              <p className="mt-1 text-[11px] text-brand-700">
                Dry and final year-end processing history
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Total Carry Forward
                </p>
              </div>
              <p className="text-sm font-semibold text-brand-900">
                {totalCarry.toLocaleString()} days
              </p>
              <p className="mt-1 text-[11px] text-brand-700">
                Across all completed runs
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Total Lapsed
                </p>
              </div>
              <p className="text-sm font-semibold text-brand-900">
                {totalLapse.toLocaleString()} days
              </p>
              <p className="mt-1 text-[11px] text-brand-700">
                Balances removed by policy
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                type="text"
                placeholder="Search by run ID, year, mode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none"
              >
                {years.map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>

              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none"
              >
                <option>All</option>
                <option>Dry Run</option>
                <option>Final Run</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm">
              <span className="text-brand-700">Showing </span>
              <span className="font-semibold text-brand-900">{filteredRuns.length}</span>
              <span className="text-brand-700"> records</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-brand-700">
                <span className="font-semibold text-brand-900">
                  {runs.filter((r) => r.mode === "Dry Run").length}
                </span>
                Dry Runs
              </div>
              <div className="h-3 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5 text-brand-700">
                <span className="font-semibold text-brand-900">
                  {runs.filter((r) => r.mode === "Final Run").length}
                </span>
                Final Runs
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Run ID
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Year
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Mode
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Carry Forward
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Lapse
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Created
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRuns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Briefcase className="h-10 w-10 text-brand-300" />
                        <p className="text-sm font-semibold text-brand-900">
                          No processing records found
                        </p>
                        <p className="text-sm text-brand-700">
                          Run a dry run or final processing to create records.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRuns.map((run) => (
                    <tr key={run.id} className="transition-colors hover:bg-brand-100">
                      <td className="px-5 py-3.5 text-sm font-mono font-semibold text-brand-900">
                        {run.id}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-brand-700">
                        {run.yearEnding}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-brand-700">
                        {run.processingDate}
                      </td>
                      <td className="px-5 py-3.5 text-sm">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                            run.mode === "Dry Run"
                              ? "bg-brand-100 text-brand-800"
                              : "bg-emerald-100 text-emerald-700"
                          )}
                        >
                          {run.mode}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm">
                        <span className="inline-flex rounded-full bg-brand-700 px-2.5 py-1 text-xs font-semibold text-white">
                          {run.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-brand-900">
                        {run.carryForwardDays.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-red-600">
                        {run.lapsedDays.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-brand-700">
                        {run.createdAt}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedRun(run)}
                          className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100 hover:text-brand-900"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isWizardOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                    <Play className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-brand-900">
                      Year-End Processing Wizard
                    </h2>
                    <p className="mt-0.5 text-sm text-brand-700">
                      Configure, preview, and save this processing run.
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeWizard}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-brand-700 transition hover:bg-brand-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="border-b border-gray-200 px-6 py-5">
                <div className="mx-auto flex max-w-3xl items-center justify-center gap-3">
                  {[1, 2, 3, 4].map((s, index) => (
                    <React.Fragment key={s}>
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-all",
                          step === s
                            ? "border-brand-800 bg-brand-800 text-white"
                            : step > s
                            ? "border-brand-800 bg-brand-800 text-white"
                            : "border-gray-200 bg-white text-gray-500"
                        )}
                      >
                        {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                      </div>
                      {index < 3 && (
                        <div
                          className={cn(
                            "h-0.5 flex-1 max-w-[72px]",
                            step > s ? "bg-brand-800" : "bg-gray-200"
                          )}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {step === 1 && (
                  <div className="mx-auto max-w-3xl space-y-6">
                    <div className="rounded-xl border border-gray-200 bg-white">
                      <div className="border-b border-gray-200 px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-brand-700" />
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                            Step 1 · Setup
                          </h3>
                        </div>
                      </div>

                      <div className="grid gap-5 p-5 md:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-brand-900">
                            Year Ending
                          </label>
                          <select
                            value={yearEnding}
                            onChange={(e) => setYearEnding(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none"
                          >
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                            <option value="2025">2025</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-brand-900">
                            Processing Date
                          </label>
                          <input
                            type="date"
                            value={processingDate}
                            onChange={(e) => setProcessingDate(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none"
                          />
                        </div>
                      </div>

                      <div className="px-5 pb-5">
                        <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:bg-brand-100">
                          <input
                            type="checkbox"
                            checked={isDryRun}
                            onChange={(e) => setIsDryRun(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300"
                          />
                          <div>
                            <p className="text-sm font-medium text-brand-900">
                              Dry Run
                            </p>
                            <p className="mt-0.5 text-[11px] text-brand-700">
                              If completed, this run will be saved to the list as a dry run record for this year.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-brand-700" />
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                            Step 2 · Aggregation Summary
                          </h3>
                        </div>
                        <div className="text-xs text-brand-700">
                          Year: {yearEnding}
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b border-gray-200 bg-white">
                            <tr>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                                Leave Type
                              </th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                                Total
                              </th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                                Carry Forward
                              </th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                                Lapse
                              </th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                                Encash
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {currentSummary.map((row) => (
                              <tr key={row.type}>
                                <td className="px-5 py-3.5 text-sm font-semibold text-brand-900">
                                  {row.type}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-brand-700">
                                  {row.total}
                                </td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-brand-900">
                                  {row.cf}
                                </td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-red-600">
                                  {row.lapse}
                                </td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600">
                                  {row.encash}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center">
                        <div className="relative w-full max-w-sm">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                          <input
                            type="text"
                            placeholder="Search employee..."
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none"
                          />
                        </div>

                        <select
                          value={departmentFilter}
                          onChange={(e) => setDepartmentFilter(e.target.value)}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none"
                        >
                          {departments.map((dept) => (
                            <option key={dept}>{dept}</option>
                          ))}
                        </select>

                        <select
                          value={leaveTypeFilter}
                          onChange={(e) => setLeaveTypeFilter(e.target.value)}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none"
                        >
                          {leaveTypes.map((type) => (
                            <option key={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b border-gray-200 bg-white">
                            <tr>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                                Employee
                              </th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                                Department
                              </th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                                Type
                              </th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                                Current
                              </th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                                Carry
                              </th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                                Lapse
                              </th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                                Opening
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredEmployees.map((emp, i) => (
                              <tr key={i} className="transition-colors hover:bg-brand-100">
                                <td className="px-5 py-3.5 text-sm font-semibold text-brand-900">
                                  {emp.name}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-brand-700">
                                  {emp.dept}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-brand-700">
                                  {emp.type}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-brand-700">
                                  {emp.current}
                                </td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-brand-900">
                                  {emp.carry}
                                </td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-red-600">
                                  {emp.lapse}
                                </td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-brand-900">
                                  {emp.newOpening}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="mx-auto max-w-4xl space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      <div className="bg-brand-900 px-6 py-6 text-white">
                        <h3 className="text-2xl font-bold">
                          Ready to {isDryRun ? "Save Dry Run" : "Execute Final Run"}
                        </h3>
                        <p className="mt-1 text-sm text-white/75">
                          This {isDryRun ? "dry run" : "final run"} will be saved as a list record for year {yearEnding}.
                        </p>
                      </div>

                      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-lg border border-gray-200 bg-white p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                            Staff
                          </p>
                          <p className="mt-2 text-2xl font-bold text-brand-900">
                            {filteredEmployees.length}
                          </p>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                            Carry Forward
                          </p>
                          <p className="mt-2 text-2xl font-bold text-brand-900">
                            {summaryTotals.cf}
                          </p>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                            Lapse
                          </p>
                          <p className="mt-2 text-2xl font-bold text-red-600">
                            {summaryTotals.lapse}
                          </p>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                            Encash
                          </p>
                          <p className="mt-2 text-2xl font-bold text-emerald-600">
                            {summaryTotals.encash}
                          </p>
                        </div>
                      </div>

                      <div className="px-6 pb-6">
                        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                          <div className="flex items-start gap-3">
                            <ShieldAlert className="mt-0.5 h-4 w-4 text-red-700" />
                            <div className="w-full">
                              <p className="text-sm font-semibold text-red-900">
                                Confirmation Required
                              </p>

                              <label className="mt-3 flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={confirmed}
                                  onChange={(e) => setConfirmed(e.target.checked)}
                                  className="mt-0.5 h-4 w-4 rounded border-red-300"
                                />
                                <span className="text-sm leading-6 text-red-800/90">
                                  I understand this {isDryRun ? "will save a dry run snapshot" : "will perform the final year-end transition and save its record"}.
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 px-6 py-4">
                        <div className="flex justify-end">
                          <button
                            onClick={startProcessing}
                            disabled={!confirmed}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <RefreshCw className="h-4 w-4" />
                            {isDryRun ? "Complete Dry Run" : "Process Final Run"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleBack}
                    disabled={step === 1 || isExecuting}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>

                  {step < 4 ? (
                    <button
                      onClick={handleNext}
                      disabled={isExecuting}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="text-xs text-brand-700">
                      Review complete and confirm to continue
                    </div>
                  )}
                </div>
              </div>

              {isExecuting && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                  <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                        <Database className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-brand-900">
                          Processing...
                        </h3>
                        <p className="text-sm text-brand-700">{status}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-brand-800 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        {progress}% complete
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedRun && (
          <div className="fixed inset-0 z-[220] overflow-hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedRun(null)}
            />
            <div className="absolute right-0 top-0 flex h-full w-full max-w-[720px] flex-col border-l border-gray-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-brand-900">
                      Run Detail
                    </h2>
                    <p className="mt-0.5 text-sm text-brand-700">
                      {selectedRun.id} · {selectedRun.mode} · {selectedRun.yearEnding}
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

              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Processing Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedRun.processingDate}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Created At
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedRun.createdAt}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Staff Processed
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedRun.staffProcessed}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedRun.status}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-200 px-5 py-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Summary
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-white">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                            Leave Type
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                            Total
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                            Carry
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                            Lapse
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                            Encash
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {selectedRun.summary.map((row) => (
                          <tr key={row.type}>
                            <td className="px-5 py-3.5 text-sm font-semibold text-brand-900">
                              {row.type}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-brand-700">
                              {row.total}
                            </td>
                            <td className="px-5 py-3.5 text-sm font-semibold text-brand-900">
                              {row.cf}
                            </td>
                            <td className="px-5 py-3.5 text-sm font-semibold text-red-600">
                              {row.lapse}
                            </td>
                            <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600">
                              {row.encash}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-4 w-4 text-amber-700" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        Note
                      </p>
                      <p className="mt-1 text-sm leading-6 text-amber-800/90">
                        Dry runs are saved as preview records only. Final runs represent execution-ready year-end history.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setSelectedRun(null)}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}