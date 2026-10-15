"use client";

import React, { useMemo, useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Zap,
  Sparkles,
  Filter,
  LayoutGrid,
  FileText,
  Users,
} from "lucide-react";

interface RiskAlert {
  id: string;
  severity: "High" | "Medium" | "Low";
  title: string;
  description: string;
  impact: string;
}

const MOCK_ALERTS: RiskAlert[] = [
  {
    id: "1",
    severity: "High",
    title: "Dec 25-31 Peak Risk",
    description: "8 requests pending across Engineering and Finance.",
    impact: "Coverage would drop to 35%",
  },
  {
    id: "2",
    severity: "Medium",
    title: "Marketing Overlap",
    description: "3 overlapping requests for Jan 15.",
    impact: "Social media team 40% OOO",
  },
  {
    id: "3",
    severity: "Low",
    title: "Engineering Stability",
    description: "Adequate coverage confirmed for next 2 weeks.",
    impact: "Stable >85%",
  },
];

function getSeverityClasses(severity: RiskAlert["severity"]) {
  switch (severity) {
    case "High":
      return "border-red-200 bg-red-50 text-red-700";
    case "Medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

function getDayRisk(day: number) {
  if (day >= 25) return { label: "High", percent: 35, tone: "red" as const };
  if (day >= 15 && day <= 20) return { label: "Medium", percent: 68, tone: "amber" as const };
  return { label: "Low", percent: 94, tone: "emerald" as const };
}

function getRiskBarClasses(tone: "red" | "amber" | "emerald") {
  switch (tone) {
    case "red":
      return {
        track: "bg-red-100",
        fill: "bg-red-500",
        tooltip: "bg-red-600 text-white",
      };
    case "amber":
      return {
        track: "bg-amber-100",
        fill: "bg-amber-500",
        tooltip: "bg-amber-500 text-white",
      };
    case "emerald":
    default:
      return {
        track: "bg-emerald-100",
        fill: "bg-emerald-500",
        tooltip: "bg-emerald-600 text-white",
      };
  }
}

export default function CoverageRiskPanel() {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [range, setRange] = useState<"30 Days" | "90 Days">("30 Days");

  const selectedDayRisk = useMemo(() => {
    if (!selectedDate) return null;
    return getDayRisk(selectedDate);
  }, [selectedDate]);

  const highAlerts = MOCK_ALERTS.filter((a) => a.severity === "High").length;
  const mediumAlerts = MOCK_ALERTS.filter((a) => a.severity === "Medium").length;
  const lowAlerts = MOCK_ALERTS.filter((a) => a.severity === "Low").length;

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Coverage Risk Analysis
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  AI-powered workforce availability monitoring and scheduling alerts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-gray-200 bg-white p-1">
                <button
                  onClick={() => setRange("30 Days")}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                    range === "30 Days"
                      ? "bg-brand-800 text-white"
                      : "text-brand-800 hover:bg-brand-100"
                  }`}
                >
                  30 Days
                </button>
                <button
                  onClick={() => setRange("90 Days")}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                    range === "90 Days"
                      ? "bg-brand-800 text-white"
                      : "text-brand-800 hover:bg-brand-100"
                  }`}
                >
                  90 Days
                </button>
              </div>

              <button className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                High Alerts
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">{highAlerts}</div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Medium Alerts
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">{mediumAlerts}</div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Low Alerts
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">{lowAlerts}</div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-brand-900 p-4 text-white">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-100">
                Global Coverage Avg.
              </div>
              <div className="mt-2 text-lg font-bold">82.4%</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Alerts + AI block */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-5 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                  <LayoutGrid className="h-4 w-4" />
                  Active Priority Alerts
                </h3>
              </div>

              <div className="space-y-4 p-5">
                {MOCK_ALERTS.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-xl border p-4 transition hover:shadow-sm ${getSeverityClasses(
                      alert.severity
                    )}`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {alert.severity === "High" ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : alert.severity === "Medium" ? (
                          <Info className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        <h4 className="text-sm font-semibold">{alert.title}</h4>
                      </div>

                      <span className="rounded-full border border-current/20 bg-white/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
                        {alert.severity} Priority
                      </span>
                    </div>

                    <p className="text-sm leading-6 opacity-90">{alert.description}</p>

                    <div className="mt-4 flex items-center justify-between border-t border-current/10 pt-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider">
                        {alert.impact}
                      </span>
                      <button className="text-[11px] font-semibold underline">
                        Analyze Deeply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-brand-900 p-6 text-white shadow-sm">
              <div className="flex items-center gap-2 text-brand-100">
                <Sparkles className="h-5 w-5 text-[#E8D5A3]" />
                <h4 className="text-xs font-semibold uppercase tracking-wider">
                  AI Recommendations
                </h4>
              </div>

              <div className="mt-5 space-y-4">
                {[
                  "Recommend approving Fatima's request first (Critical Lead role)",
                  "Suggest Ahmed shift dates to Jan 2-4 to balance coverage",
                  "Consider deferring Sara's request to the following week",
                ].map((rec, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold">
                      {i + 1}
                    </div>
                    <p className="text-sm leading-6 text-brand-100">{rec}</p>
                  </div>
                ))}
              </div>

              <button className="mt-6 w-full rounded-lg bg-[#E8D5A3] px-4 py-3 text-sm font-medium text-brand-900 transition hover:opacity-90">
                Apply Smart Recommendations
              </button>
            </div>
          </div>

          {/* Heatmap */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-7">
            <div className="flex flex-col gap-4 border-b border-gray-200 bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <button className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h3 className="text-lg font-bold text-brand-900">December 2024</h3>
                <button className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-emerald-500" />
                  80%+
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-amber-500" />
                  60-80%
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-red-500" />
                  &lt;60%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-200">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="border-b border-gray-100 bg-gray-50/50 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-brand-700"
                >
                  {day}
                </div>
              ))}

              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const isWeekend = (day + 6) % 7 === 0 || (day + 6) % 7 === 6;
                const risk = getDayRisk(day);
                const colors = getRiskBarClasses(risk.tone);

                return (
                  <div
                    key={day}
                    onMouseEnter={() => setSelectedDate(day)}
                    className={`group relative h-24 border-b border-r border-gray-100 p-3 transition ${
                      isWeekend ? "bg-gray-50/50" : "bg-white"
                    }`}
                  >
                    <span className="text-xs font-semibold text-brand-700">{day}</span>

                    {!isWeekend && (
                      <div className={`mt-auto h-2 w-full overflow-hidden rounded-full ${colors.track}`}>
                        <div
                          className={`h-full ${colors.fill}`}
                          style={{ width: `${risk.percent}%` }}
                        />
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-1 z-10 hidden rounded-lg p-3 text-white shadow-lg group-hover:block">
                      <div className={`flex h-full flex-col justify-between rounded-lg p-3 ${colors.tooltip}`}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider">
                          Coverage Info
                        </p>

                        <div>
                          <p className="text-xl font-bold">{risk.percent}%</p>
                          <p className="text-[10px] text-white/80">Active + Pending</p>
                        </div>

                        <div className="flex -space-x-1">
                          {[1, 2, 3].map((u) => (
                            <div
                              key={u}
                              className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-current bg-white text-[7px] font-semibold text-brand-900"
                            >
                              U
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-4 bg-gray-50/40 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-brand-800">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Global Coverage Avg.
                  </div>
                  <div className="mt-1 text-2xl font-bold text-brand-900">82.4%</div>
                </div>
              </div>

              <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100">
                <FileText className="h-4 w-4" />
                Export Coverage Heatmap
              </button>
            </div>
          </div>
        </div>

        {/* Selected day summary */}
        {selectedDayRisk && selectedDate && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Selected Day Insight
                </div>
                <div className="mt-1 text-sm font-semibold text-brand-900">
                  December {selectedDate}: {selectedDayRisk.label} Risk
                </div>
              </div>

              <div className="text-sm text-brand-700">
                Projected coverage:{" "}
                <span className="font-semibold text-brand-900">
                  {selectedDayRisk.percent}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}