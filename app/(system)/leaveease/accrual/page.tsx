"use client";

import React, { useMemo, useState } from "react";
import {
  Clock,
  Play,
  Plus,
  Search,
  MoreHorizontal,
  Edit3,
  History,
  Power,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Zap,
  Settings2,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { AccrualRuleForm } from "@/components/leaveease/AccrualRuleForm";

interface AccrualRule {
  id: string;
  leaveType: string;
  frequency: "Monthly" | "Quarterly" | "Annual" | "On Join";
  amount: string;
  cap: string;
  proration: string;
  lapse: string;
  status: "Active" | "Inactive";
  lastRun: string;
}

const MOCK_RULES: AccrualRule[] = [
  {
    id: "AC-1",
    leaveType: "Annual Leave",
    frequency: "Monthly",
    amount: "2.0 days/month",
    cap: "30 days max",
    proration: "Join ✓ Exit ✓",
    lapse: "End of year",
    status: "Active",
    lastRun: "Jan 1, 2025",
  },
  {
    id: "AC-2",
    leaveType: "Sick Leave",
    frequency: "Monthly",
    amount: "1.0 days/month",
    cap: "12 days max",
    proration: "Join ✓ Exit ✗",
    lapse: "Never",
    status: "Active",
    lastRun: "Jan 1, 2025",
  },
  {
    id: "AC-3",
    leaveType: "Casual Leave",
    frequency: "Annual",
    amount: "10.0 days/year",
    cap: "10 days max",
    proration: "None",
    lapse: "End of year",
    status: "Active",
    lastRun: "Jan 1, 2025",
  },
  {
    id: "AC-4",
    leaveType: "Maternity Leave",
    frequency: "On Join",
    amount: "90.0 days",
    cap: "No cap",
    proration: "None",
    lapse: "Never",
    status: "Active",
    lastRun: "N/A",
  },
  {
    id: "AC-5",
    leaveType: "Short Leave",
    frequency: "Monthly",
    amount: "2.0 hours/month",
    cap: "No cap",
    proration: "None",
    lapse: "After 3 months",
    status: "Active",
    lastRun: "Jan 1, 2025",
  },
  {
    id: "AC-6",
    leaveType: "Study Leave",
    frequency: "On Join",
    amount: "15.0 days",
    cap: "15 days max",
    proration: "None",
    lapse: "Never",
    status: "Inactive",
    lastRun: "N/A",
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AccrualRulesList() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [isRunning, setIsRunning] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AccrualRule | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleRunNow = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 1800);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setIsFormOpen(true);
  };

  const handleEdit = (rule: AccrualRule) => {
    setEditingRule(rule);
    setIsFormOpen(true);
    setOpenMenuId(null);
  };

  const filteredRules = useMemo(() => {
    const q = search.trim().toLowerCase();

    return MOCK_RULES.filter((rule) => {
      const matchesSearch =
        !q ||
        rule.leaveType.toLowerCase().includes(q) ||
        rule.frequency.toLowerCase().includes(q) ||
        rule.amount.toLowerCase().includes(q) ||
        rule.cap.toLowerCase().includes(q) ||
        rule.proration.toLowerCase().includes(q) ||
        rule.lapse.toLowerCase().includes(q) ||
        rule.status.toLowerCase().includes(q) ||
        rule.id.toLowerCase().includes(q);

      const matchesType =
        filterType === "All" || rule.leaveType === filterType;

      return matchesSearch && matchesType;
    });
  }, [search, filterType]);

  const activeCount = filteredRules.filter((r) => r.status === "Active").length;
  const inactiveCount = filteredRules.filter((r) => r.status === "Inactive").length;

  const getFrequencyClasses = (freq: AccrualRule["frequency"]) => {
    switch (freq) {
      case "Monthly":
        return "bg-brand-100 text-brand-800 border-gray-200";
      case "Quarterly":
        return "bg-violet-50 text-violet-700 border-gray-200";
      case "Annual":
        return "bg-emerald-50 text-emerald-700 border-gray-200";
      case "On Join":
        return "bg-amber-50 text-amber-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
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
                <Calendar className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Accrual Rules
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Define automated leave credit logic, proration rules, and accrual schedules.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRunNow}
                disabled={isRunning}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunning ? "Running..." : "Run Now"}
              </button>

              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <Plus className="h-4 w-4" />
                Create Rule
              </button>
            </div>
          </div>

          {/* Summary / scheduler */}
          <div className="grid gap-4 p-6 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Next Scheduled Run
                </p>
              </div>
              <p className="text-sm font-semibold text-brand-900">
                Feb 1, 2025 at 12:00 AM
              </p>
              <p className="mt-1 text-[11px] text-brand-700">
                System will credit eligible leave balances automatically.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  System Health
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected to Payroll
              </div>
              <p className="mt-2 text-[11px] text-brand-700">
                Accrual engine and payroll integration are healthy.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Coverage
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div>
                  <span className="font-semibold text-brand-900">
                    {MOCK_RULES.length}
                  </span>{" "}
                  <span className="text-brand-700">Rules</span>
                </div>
                <div className="h-3 w-px bg-gray-200" />
                <div>
                  <span className="font-semibold text-brand-900">
                    {MOCK_RULES.filter((r) => r.frequency === "Monthly").length}
                  </span>{" "}
                  <span className="text-brand-700">Monthly</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-brand-700">
                Covers recurring and one-time leave credit workflows.
              </p>
            </div>
          </div>
        </div>

        {/* Filters + table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                type="text"
                placeholder="Search by leave type, frequency, cap, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-brand-700">Type</span>
              <select
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-800"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Leave Types</option>
                <option value="Annual Leave">Annual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Maternity Leave">Maternity Leave</option>
                <option value="Short Leave">Short Leave</option>
                <option value="Study Leave">Study Leave</option>
              </select>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm">
              <span className="text-brand-700">Showing </span>
              <span className="font-semibold text-brand-900">
                {filteredRules.length}
              </span>
              <span className="text-brand-700"> accrual rules</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-brand-700">
                <span className="font-semibold text-brand-900">{activeCount}</span>
                Active
              </div>
              <div className="h-3 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5 text-brand-700">
                <span className="font-semibold text-brand-900">{inactiveCount}</span>
                Inactive
              </div>
              <div className="h-3 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5 text-brand-700">
                <span className="font-semibold text-brand-900">
                  {filteredRules.filter((r) => r.frequency === "On Join").length}
                </span>
                One-time rules
              </div>
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
                    Frequency
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Cap
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Proration
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Lapse
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Last Run
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Status
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Briefcase className="h-10 w-10 text-brand-300" />
                        <p className="text-sm font-semibold text-brand-900">
                          No accrual rules found
                        </p>
                        <p className="text-sm text-brand-700">
                          Try adjusting your search or leave type filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((rule) => (
                    <tr key={rule.id} className="transition-colors hover:bg-brand-100">
                      <td className="px-5 py-3.5 text-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-xs font-bold text-white">
                            {rule.leaveType.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-brand-900">
                              {rule.leaveType}
                            </div>
                            <div className="text-[11px] text-brand-700">
                              Rule ID: {rule.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-sm">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                            getFrequencyClasses(rule.frequency)
                          )}
                        >
                          {rule.frequency}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-sm font-semibold text-brand-900">
                        {rule.amount}
                      </td>

                      <td className="px-5 py-3.5 text-sm text-brand-700">
                        {rule.cap}
                      </td>

                      <td className="px-5 py-3.5 text-sm">
                        <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-brand-800">
                          {rule.proration}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-sm text-brand-700">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-brand-700" />
                          {rule.lapse}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-sm text-brand-700">
                        {rule.lastRun}
                      </td>

                      <td className="px-5 py-3.5 text-center text-sm">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                            rule.status === "Active"
                              ? "bg-brand-700 text-white"
                              : "bg-brand-600 text-white"
                          )}
                        >
                          {rule.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center text-sm">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() =>
                              setOpenMenuId(openMenuId === rule.id ? null : rule.id)
                            }
                            className="inline-flex items-center justify-center rounded-lg p-2 text-brand-700 transition hover:bg-brand-100 hover:text-brand-900"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {openMenuId === rule.id && (
                            <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg">
                              <button
                                onClick={() => handleEdit(rule)}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit Rule
                              </button>

                              <button
                                onClick={() => setOpenMenuId(null)}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                              >
                                <History className="h-4 w-4" />
                                View History
                              </button>

                              <div className="my-1 h-px bg-gray-200" />

                              <button
                                onClick={() => setOpenMenuId(null)}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                              >
                                <Power className="h-4 w-4" />
                                Deactivate
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom cards */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-brand-700" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                Pro Tip
              </h3>
            </div>

            <p className="text-sm leading-6 text-brand-700">
              Use <span className="font-semibold text-brand-900">On Join</span> for
              one-time entitlements and <span className="font-semibold text-brand-900">Monthly</span>{" "}
              or <span className="font-semibold text-brand-900">Quarterly</span> for
              recurring accrual plans. Proration helps keep balance allocation fair for
              mid-period joins and exits.
            </p>

            <button className="mt-4 text-sm font-medium text-brand-800 transition hover:text-brand-900">
              Learn about proration methods →
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-brand-900 p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-white" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80">
                Audit Logs
              </h3>
            </div>

            <p className="text-sm leading-6 text-white/80">
              Review detailed records of leave credits generated by the system for payroll,
              compliance, and reconciliation.
            </p>

            <button className="mt-4 inline-flex items-center rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
              View All Audit Logs
            </button>
          </div>
        </div>
      </div>

      <AccrualRuleForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRule(null);
        }}
        initialData={editingRule}
      />
    </div>
  );
}