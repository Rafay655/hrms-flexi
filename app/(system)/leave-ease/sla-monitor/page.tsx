"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Mail,
  UserPlus,
  Zap,
  Bell,
  ArrowUpRight,
  ShieldAlert,
  TimerReset,
  Activity,
} from "lucide-react";

interface OverdueRequest {
  id: string;
  employee: string;
  avatar: string;
  type: string;
  submitted: string;
  overdueBy: string;
  approver: string;
}

interface ApproverStat {
  name: string;
  pending: number;
  avgTime: string;
  compliance: number;
}

const MOCK_OVERDUE: OverdueRequest[] = [
  {
    id: "LV-9921",
    employee: "Zohaib Shah",
    avatar: "ZS",
    type: "Annual Leave",
    submitted: "2025-02-10 09:00",
    overdueBy: "4h 22m",
    approver: "Farhan Ali",
  },
  {
    id: "LV-9925",
    employee: "Kamran Akmal",
    avatar: "KA",
    type: "Casual Leave",
    submitted: "2025-02-10 11:30",
    overdueBy: "1h 45m",
    approver: "Sana Khan",
  },
];

const MOCK_AT_RISK: OverdueRequest[] = [
  {
    id: "LV-9930",
    employee: "Dania J.",
    avatar: "DJ",
    type: "Sick Leave",
    submitted: "2025-02-11 14:00",
    overdueBy: "52m remaining",
    approver: "Sarah Miller",
  },
  {
    id: "LV-9932",
    employee: "Usman Ghani",
    avatar: "UG",
    type: "Annual Leave",
    submitted: "2025-02-11 15:45",
    overdueBy: "3h 10m remaining",
    approver: "Sarah Miller",
  },
];

const MOCK_APPROVERS: ApproverStat[] = [
  { name: "Sarah Miller", pending: 12, avgTime: "4.2h", compliance: 98 },
  { name: "Farhan Ali", pending: 8, avgTime: "22.5h", compliance: 65 },
  { name: "Sana Khan", pending: 15, avgTime: "18.1h", compliance: 78 },
  { name: "Ahmed Khan", pending: 3, avgTime: "2.5h", compliance: 100 },
];

type RangeOption = "Today" | "This Week" | "This Month";

export default function SLAMonitorDashboard() {
  const [range, setRange] = useState<RangeOption>("This Week");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(
    new Date().toLocaleTimeString()
  );

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastRefreshed(new Date().toLocaleTimeString());
    }, 300000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const totalPending = useMemo(
    () => MOCK_APPROVERS.reduce((sum, approver) => sum + approver.pending, 0),
    []
  );

  const overdueCount = MOCK_OVERDUE.length;
  const atRiskCount = MOCK_AT_RISK.length;
  const withinSLA = Math.max(totalPending - overdueCount - atRiskCount, 0);
  const compliancePercent =
    totalPending > 0 ? Math.round((withinSLA / totalPending) * 100) : 0;

  const avgResponse = useMemo(() => {
    const values = MOCK_APPROVERS.map((item) => Number.parseFloat(item.avgTime));
    const total = values.reduce((sum, value) => sum + value, 0);
    return `${(total / values.length).toFixed(1)}h`;
  }, []);

  const topApprover = useMemo(() => {
    if (!MOCK_APPROVERS.length) return null;
    return [...MOCK_APPROVERS].sort((a, b) => b.compliance - a.compliance)[0];
  }, []);

  const getComplianceClasses = (val: number) => {
    if (val >= 90) {
      return {
        text: "text-emerald-600",
        bar: "bg-emerald-500",
        chip: "bg-emerald-50 border-emerald-100 text-emerald-700",
      };
    }

    if (val >= 75) {
      return {
        text: "text-amber-600",
        bar: "bg-amber-500",
        chip: "bg-amber-50 border-amber-100 text-amber-700",
      };
    }

    return {
      text: "text-red-600",
      bar: "bg-red-500",
      chip: "bg-red-50 border-red-100 text-red-700",
    };
  };

  const trendData = [70, 85, 90, 80, 75, 95, 88, 82, 79, 85, 92, 98];

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  SLA Monitor
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Real-time tracking of approval bottlenecks, response time, and SLA compliance.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
                {(["Today", "This Week", "This Month"] as RangeOption[]).map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRange(item)}
                      className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                        range === item
                          ? "bg-brand-800 text-white"
                          : "text-brand-800 hover:bg-brand-100"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Auto Refresh
                  </div>
                  <div className="text-[11px] text-brand-700">
                    Last: {lastRefreshed}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoRefresh((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 rounded-full transition ${
                    autoRefresh ? "bg-brand-800" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                      autoRefresh ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setLastRefreshed(new Date().toLocaleTimeString())}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Now
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-100 p-2 text-brand-800">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Total Pending
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {totalPending}
                  </div>
                  <div className="text-[11px] text-brand-700">
                    Org-wide queue
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-100 p-2 text-brand-800">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Within SLA
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {withinSLA}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-brand-700">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {compliancePercent}% compliance
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-100 p-2 text-brand-800">
                  <TimerReset className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    At Risk
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {atRiskCount}
                  </div>
                  <div className="text-[11px] text-brand-700">
                    Breach in less than 4h
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-100 p-2 text-brand-800">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Overdue
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {overdueCount}
                  </div>
                  <div className="text-[11px] text-brand-700">
                    Requires escalation
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-brand-900 p-4 text-white">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-100">
                Avg Response
              </div>
              <div className="mt-1 text-lg font-bold">{avgResponse}</div>
              <div className="text-[11px] text-brand-100">
                Across all approvers
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left side */}
          <div className="space-y-6 lg:col-span-8">
            {/* Overdue queue */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                    <AlertCircle className="h-4 w-4" />
                    Overdue Queue
                  </h3>
                  <p className="mt-1 text-sm text-brand-700">
                    Requests that have already breached defined SLA timelines.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                  Priority 1
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-white">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Request
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Type
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Submitted
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Overdue By
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Approver
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-brand-300/40 bg-white">
                    {MOCK_OVERDUE.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center">
                          <div className="text-sm font-semibold text-brand-900">
                            No overdue requests
                          </div>
                          <div className="mt-1 text-sm text-brand-700">
                            Everything is currently within defined SLA limits.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      MOCK_OVERDUE.map((req) => (
                        <tr key={req.id} className="hover:bg-brand-100 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-xs font-semibold text-brand-900">
                                {req.avatar}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-brand-900">
                                  {req.employee}
                                </div>
                                <div className="text-[11px] text-brand-700">
                                  {req.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-brand-900">
                            {req.type}
                          </td>
                          <td className="px-5 py-4 text-sm text-brand-700">
                            {req.submitted}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                              {req.overdueBy}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-brand-900">
                            {req.approver}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                className="rounded-lg border border-gray-200 bg-white p-2 text-red-600 transition hover:bg-red-50"
                                title="Escalate"
                              >
                                <Zap className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100"
                                title="Reassign"
                              >
                                <UserPlus className="h-4 w-4" />
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

            {/* At risk queue */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                    <AlertTriangle className="h-4 w-4" />
                    At Risk Queue
                  </h3>
                  <p className="mt-1 text-sm text-brand-700">
                    Requests likely to breach SLA within the next 4 hours.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  Needs Attention
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-white">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Request
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Type
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Submitted
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Remaining
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Approver
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-brand-300/40 bg-white">
                    {MOCK_AT_RISK.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center">
                          <div className="text-sm font-semibold text-brand-900">
                            No at-risk requests
                          </div>
                          <div className="mt-1 text-sm text-brand-700">
                            No request is close to breaching SLA right now.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      MOCK_AT_RISK.map((req) => (
                        <tr key={req.id} className="hover:bg-brand-100 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-xs font-semibold text-brand-900">
                                {req.avatar}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-brand-900">
                                  {req.employee}
                                </div>
                                <div className="text-[11px] text-brand-700">
                                  {req.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-brand-900">
                            {req.type}
                          </td>
                          <td className="px-5 py-4 text-sm text-brand-700">
                            {req.submitted}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              {req.overdueBy}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-brand-900">
                            {req.approver}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                            >
                              <Bell className="h-4 w-4" />
                              Send Reminder
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

          {/* Right side */}
          <div className="space-y-6 lg:col-span-4">
            {/* Approver leaderboard */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
                    Approver Leaderboard
                  </h3>
                  <p className="mt-1 text-sm text-brand-700">
                    Performance by compliance and response time.
                  </p>
                </div>

                <button
                  type="button"
                  className="text-sm font-medium text-brand-800 transition hover:text-brand-900"
                >
                  View All
                </button>
              </div>

              <div className="divide-y divide-brand-300/40">
                {MOCK_APPROVERS.map((approver) => {
                  const colors = getComplianceClasses(approver.compliance);

                  return (
                    <div
                      key={approver.name}
                      className="p-4 transition-colors hover:bg-brand-100"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-brand-900">
                            {approver.name}
                          </div>
                          <div className="mt-1 text-[11px] text-brand-700">
                            {approver.pending} pending in queue
                          </div>
                        </div>

                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${colors.chip}`}
                        >
                          {approver.compliance}% SLA
                        </span>
                      </div>

                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${colors.bar}`}
                          style={{ width: `${approver.compliance}%` }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm text-brand-700">
                          Avg Time:{" "}
                          <span className="font-semibold text-brand-900">
                            {approver.avgTime}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100"
                          title="Email approver"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trend */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-5 py-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
                  SLA Compliance Trend
                </h3>
                <p className="mt-1 text-sm text-brand-700">
                  Snapshot of the last 12 working days.
                </p>
              </div>

              <div className="px-5 py-5">
                <div className="flex h-52 items-end gap-2">
                  {trendData.map((value, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-2">
                      <div className="text-[10px] font-semibold text-brand-700">
                        {value}%
                      </div>
                      <div className="flex h-40 w-full items-end rounded-md bg-gray-100 p-1">
                        <div
                          className={`w-full rounded-sm ${
                            value >= 90 ? "bg-emerald-500" : "bg-brand-800/65"
                          }`}
                          style={{ height: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-center text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                  Last 12 Working Days
                </div>
              </div>
            </div>

            {/* Prediction card */}
            <div className="rounded-xl border border-gray-200 bg-brand-900 p-5 text-white shadow-sm">
              <div className="flex items-center gap-2 text-brand-100">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  AI Prediction
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-brand-100">
                Expected <span className="font-semibold text-white">8–12% drop</span> in
                compliance next week due to higher annual leave volume during the
                festival season.
              </p>

              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-100">
                  Best Performing Approver
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">
                    {topApprover ? topApprover.name : "N/A"}
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {topApprover ? `${topApprover.compliance}%` : "--"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white transition hover:text-brand-100"
              >
                Optimize Workflows
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}