"use client";

import React, { useMemo, useState } from "react";
import {
  Cpu,
  ChevronDown,
  Play,
  Zap,
  History,
  TrendingUp,
  Download,
  Upload,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Table as TableIcon,
  ChevronRight,
  Clock3,
  ShieldCheck,
  ArrowRight,
  BarChart3,
} from "lucide-react";

type SimulationStatus = "IDLE" | "LOADING" | "COMPLETED" | "BATCH";

interface BatchResult {
  id: string;
  scenario: string;
  punchIn: string;
  punchOut: string;
  status: string;
  impact: string;
}

const BATCH_RESULTS: BatchResult[] = [
  {
    id: "1",
    scenario: "Late Arrival (Grace Exceeded)",
    punchIn: "09:25 AM",
    punchOut: "06:00 PM",
    status: "Present (Late)",
    impact: "15m Deduct",
  },
  {
    id: "2",
    scenario: "Early Departure",
    punchIn: "09:00 AM",
    punchOut: "04:30 PM",
    status: "Short Day",
    impact: "0.25d Salary",
  },
  {
    id: "3",
    scenario: "Perfect Day",
    punchIn: "08:55 AM",
    punchOut: "06:15 PM",
    status: "Present",
    impact: "None",
  },
];

function formatTimeLabel(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;

  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function getStatusChipClasses(status: string) {
  if (status.toLowerCase().includes("late") || status.toLowerCase().includes("short")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-brand-100 text-brand-800 border-gray-200";
}

export default function PolicySimulator() {
  const [status, setStatus] = useState<SimulationStatus>("IDLE");
  const [policy, setPolicy] = useState("Standard Office Policy");
  const [inTime, setInTime] = useState("09:25");
  const [outTime, setOutTime] = useState("18:30");
  const [breakMins, setBreakMins] = useState("60");

  const handleSimulate = () => {
    setStatus("LOADING");
    setTimeout(() => setStatus("COMPLETED"), 800);
  };

  const handleBatchToggle = () => {
    setStatus("BATCH");
  };

  const handleReset = () => {
    setStatus("IDLE");
    setPolicy("Standard Office Policy");
    setInTime("09:25");
    setOutTime("18:30");
    setBreakMins("60");
  };

  const breakMinutesNumber = useMemo(() => Number.parseInt(breakMins || "0", 10) || 0, [breakMins]);

  const grossWorkedLabel = "9h 05m";
  const netMappedHours = useMemo(() => {
    const baseMinutes = 9 * 60 + 5;
    const mapped = Math.max(baseMinutes - breakMinutesNumber, 0);
    const hours = Math.floor(mapped / 60);
    const mins = mapped % 60;
    return `${hours}h ${String(mins).padStart(2, "0")}m`;
  }, [breakMinutesNumber]);

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-brand-900">
                    Policy Simulator
                  </h1>
                  <span className="rounded-full bg-brand-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Pro
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-brand-700">
                  Test attendance and payroll rule scenarios before production deployment.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                Reset
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <Download className="h-4 w-4" />
                Export Results
              </button>
            </div>
          </div>

          {/* Top summary */}
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Active Policy
              </div>
              <div className="mt-2 text-sm font-semibold text-brand-900">
                {policy}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Punch Window
              </div>
              <div className="mt-2 text-sm font-semibold text-brand-900">
                {formatTimeLabel(inTime)} → {formatTimeLabel(outTime)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Break Taken
              </div>
              <div className="mt-2 text-sm font-semibold text-brand-900">
                {breakMins} mins
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Current Mode
              </div>
              <div className="mt-2 text-sm font-semibold text-brand-900">
                {status === "BATCH"
                  ? "Batch Simulation"
                  : status === "COMPLETED"
                  ? "Single Trace"
                  : status === "LOADING"
                  ? "Processing"
                  : "Idle"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-12">
          {/* Left panel */}
          <div className="space-y-6 xl:col-span-4">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                    <Zap className="h-4 w-4" />
                    Scenario Parameters
                  </h3>
                  <p className="mt-1 text-sm text-brand-700">
                    Configure policy and attendance timing inputs.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleBatchToggle}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-800 transition hover:text-brand-900"
                >
                  <TableIcon className="h-4 w-4" />
                  Batch Mode
                </button>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-brand-900">
                    Target Policy
                  </label>
                  <div className="relative">
                    <select
                      value={policy}
                      onChange={(e) => setPolicy(e.target.value)}
                      className="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    >
                      <option>Standard Office Policy</option>
                      <option>Production Floor Rules</option>
                      <option>Field Force Flexi</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-brand-900">
                    Employee Profile
                  </label>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:bg-brand-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-sm font-semibold text-brand-900">
                        SP
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-brand-900">
                          Sample Profile
                        </div>
                        <div className="text-[11px] text-brand-700">
                          Grade E3 • Salaried
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-brand-700" />
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-900">
                      Punch In
                    </label>
                    <input
                      type="time"
                      value={inTime}
                      onChange={(e) => setInTime(e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-900">
                      Punch Out
                    </label>
                    <input
                      type="time"
                      value={outTime}
                      onChange={(e) => setOutTime(e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-brand-900">
                    Break Taken
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={breakMins}
                      onChange={(e) => setBreakMins(e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 pr-16 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Mins
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulate}
                  disabled={status === "LOADING"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "LOADING" ? (
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Simulate Scenario
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-800" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
                  Bulk Stress Test
                </h3>
              </div>

              <p className="mt-3 text-sm leading-6 text-brand-700">
                Upload CSV punch history to estimate how policy changes would
                impact past attendance and payroll outcomes.
              </p>

              <button
                type="button"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-4 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <Upload className="h-4 w-4" />
                Import Scenarios
              </button>
            </div>
          </div>

          {/* Right panel */}
          <div className="xl:col-span-8">
            {status === "IDLE" ? (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-100 text-brand-800">
                  <Zap className="h-10 w-10" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-brand-900">
                  Analysis Engine Idle
                </h3>
                <p className="mt-2 max-w-lg text-sm text-brand-700">
                  Configure a scenario on the left and run the simulator to trace
                  grace handling, thresholds, net hours, and final outcome.
                </p>
              </div>
            ) : status === "LOADING" ? (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
                <div className="relative">
                  <div className="h-20 w-20 animate-spin rounded-full border-4 border-gray-100 border-t-brand-800" />
                  <div className="absolute inset-0 flex items-center justify-center text-brand-800">
                    <Cpu className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="mt-5 text-xl font-bold text-brand-900">
                  Running Policy Trace
                </h3>
                <p className="mt-2 text-sm text-brand-700">
                  Processing grace rules, thresholds, break adjustments, and penalty tiers.
                </p>
              </div>
            ) : status === "BATCH" ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
                      Batch Simulation Results
                    </h3>
                    <p className="mt-1 text-sm text-brand-700">
                      Compare results across multiple attendance scenarios.
                    </p>
                  </div>

                  <span className="inline-flex rounded-full border border-gray-200 bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                    {BATCH_RESULTS.length} Scenarios Ran
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 bg-white">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Scenario
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Punch In
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Punch Out
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Result Status
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Deduction / Impact
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-brand-300/40 bg-white">
                      {BATCH_RESULTS.map((result) => (
                        <tr key={result.id} className="hover:bg-brand-100 transition-colors">
                          <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                            {result.scenario}
                          </td>
                          <td className="px-5 py-4 text-sm text-brand-700">
                            {result.punchIn}
                          </td>
                          <td className="px-5 py-4 text-sm text-brand-700">
                            {result.punchOut}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusChipClasses(
                                result.status
                              )}`}
                            >
                              {result.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-semibold text-brand-900">
                            {result.impact}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-gray-200 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setStatus("COMPLETED")}
                    className="text-sm font-medium text-brand-800 transition hover:text-brand-900"
                  >
                    View Single Scenario Trace
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                        <History className="h-4 w-4" />
                        Calculation Trace Summary
                      </h3>
                      <p className="mt-1 text-sm text-brand-700">
                        Detailed outcome trace for the simulated attendance case.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm font-medium text-brand-800 transition hover:text-brand-900"
                    >
                      <Download className="h-4 w-4" />
                      Full Trace JSON
                    </button>
                  </div>

                  {/* Context */}
                  <div className="grid gap-4 border-b border-gray-200 bg-brand-100/40 px-5 py-5 md:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Evaluated Shift
                      </div>
                      <div className="mt-2 text-sm font-semibold text-brand-900">
                        Morning Shift (09:00 AM - 06:00 PM)
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Expected Hours
                      </div>
                      <div className="mt-2 text-sm font-semibold text-brand-900">
                        8h 00m
                      </div>
                      <div className="text-[11px] text-brand-700">
                        After 1h lunch break
                      </div>
                    </div>
                  </div>

                  {/* Trace steps */}
                  <div className="space-y-6 p-5">
                    <div className="rounded-lg border border-gray-200 bg-white p-5">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                            Punch-In Analysis
                          </div>
                          <div className="mt-1 text-sm font-semibold text-brand-900">
                            Arrival evaluation against daily grace rules
                          </div>
                        </div>
                        <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          {formatTimeLabel(inTime)}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">
                            Gross latency detected: 25 minutes
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-brand-700">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Daily grace of 15 minutes applied</span>
                        </div>
                        <div className="flex items-center gap-2 text-brand-900">
                          <ArrowRight className="h-4 w-4" />
                          <span className="font-semibold">
                            Result: Net late by 10 minutes → Tier 2 penalty
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-5">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                            Punch-Out Analysis
                          </div>
                          <div className="mt-1 text-sm font-semibold text-brand-900">
                            Exit timing and overtime mapping check
                          </div>
                        </div>
                        <span className="rounded-full border border-gray-200 bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                          {formatTimeLabel(outTime)}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-brand-900">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">
                            Exit recorded 30 minutes after shift end
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-brand-700">
                          <TrendingUp className="h-4 w-4" />
                          <span>
                            Excess time not eligible for OT because threshold is 45 minutes
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-brand-800" />
                        <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                          Final Metrics
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                            Gross Worked
                          </div>
                          <div className="mt-2 text-sm font-semibold text-brand-900">
                            {grossWorkedLabel}
                          </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                            Break Time
                          </div>
                          <div className="mt-2 text-sm font-semibold text-brand-900">
                            {breakMins}m
                          </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-brand-100 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                            Net Mapped
                          </div>
                          <div className="mt-2 text-sm font-semibold text-brand-900">
                            {netMappedHours}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Outcome */}
                  <div className="bg-brand-900 px-5 py-6 text-white">
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div>
                        <div className="flex items-center gap-2 text-brand-100">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wider">
                            Simulation Conclusion
                          </span>
                        </div>

                        <div className="mt-3 text-3xl font-bold tracking-tight">
                          PRESENT
                        </div>
                        <div className="mt-1 text-sm text-brand-100">
                          Late penalty applied under current policy rules
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between py-2 text-sm">
                          <span className="text-brand-100">Salary Impact</span>
                          <span className="font-semibold text-white">
                            15 min deduction
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/10 py-2 text-sm">
                          <span className="text-brand-100">Leave Unit</span>
                          <span className="font-semibold text-white">0.0 Days</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/10 py-2 text-sm">
                          <span className="text-brand-100">Bonus Multiplier</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-white">
                            <XCircle className="h-4 w-4 text-red-300" />
                            Eligibility Void
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* What-if */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                        <RefreshCcw className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
                          Instant What-If Analysis
                        </h3>
                        <p className="mt-1 text-sm text-brand-700">
                          What if arrival was <span className="font-semibold text-brand-900">09:14 AM</span> instead of{" "}
                          <span className="font-semibold text-brand-900">{formatTimeLabel(inTime)}</span>?
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setInTime("09:14");
                        handleSimulate();
                      }}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                    >
                      Re-simulate Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}