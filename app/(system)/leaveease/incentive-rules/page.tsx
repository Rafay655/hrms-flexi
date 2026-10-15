"use client";

import React, { useMemo, useState } from "react";
import {
  Gift,
  Plus,
  MoreHorizontal,
  Eye,
  Edit3,
  Copy,
  Play,
  Power,
  Info,
  CheckCircle2,
  Search,
  Zap,
  Clock,
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  Briefcase,
  X,
  BarChart3,
} from "lucide-react";
import { IncentiveRuleForm } from "@/components/leaveease/IncentiveRuleForm";

type IncentiveWindow = "Monthly" | "Quarterly" | "Annual";
type IncentiveStatus = "Active" | "Inactive";

interface IncentiveRule {
  id: string;
  name: string;
  window: IncentiveWindow;
  conditions: string[];
  award: string;
  eligibleCount: number;
  status: IncentiveStatus;
  lastProcessed?: string;
}

const INITIAL_RULES: IncentiveRule[] = [
  {
    id: "INC-001",
    name: "Perfect Attendance Bonus",
    window: "Monthly",
    conditions: ["No unpaid", "0 lates", "No short leave"],
    award: "1 day Annual Leave",
    eligibleCount: 142,
    status: "Active",
    lastProcessed: "Jan 02, 2025",
  },
  {
    id: "INC-002",
    name: "Punctuality Award",
    window: "Monthly",
    conditions: ["< 3 lates", "No unauthorized"],
    award: "0.5 day Casual Leave",
    eligibleCount: 310,
    status: "Active",
    lastProcessed: "Jan 02, 2025",
  },
  {
    id: "INC-003",
    name: "Quarterly Wellness Reward",
    window: "Quarterly",
    conditions: ["< 2 sick days", "No lates"],
    award: "2 days Annual Leave",
    eligibleCount: 88,
    status: "Active",
    lastProcessed: "Oct 05, 2024",
  },
  {
    id: "INC-004",
    name: "Loyalty Leave Credit",
    window: "Annual",
    conditions: ["Tenure > 12m", "Rating > 4.0"],
    award: "5 days Annual Leave",
    eligibleCount: 215,
    status: "Inactive",
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function buildRuleId(index: number) {
  return `INC-${String(index + 1).padStart(3, "0")}`;
}

export default function IncentiveRulesList() {
  const [rules, setRules] = useState<IncentiveRule[]>(INITIAL_RULES);
  const [search, setSearch] = useState("");
  const [windowFilter, setWindowFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<IncentiveRule | null>(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedRule, setSelectedRule] = useState<IncentiveRule | null>(null);

  const filteredRules = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rules.filter((rule) => {
      const haystack = [
        rule.id,
        rule.name,
        rule.window,
        rule.award,
        rule.status,
        ...(rule.conditions || []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || haystack.includes(q);
      const matchesWindow = windowFilter === "All" || rule.window === windowFilter;
      const matchesStatus = statusFilter === "All" || rule.status === statusFilter;

      return matchesSearch && matchesWindow && matchesStatus;
    });
  }, [rules, search, windowFilter, statusFilter]);

  const activeCount = useMemo(
    () => rules.filter((rule) => rule.status === "Active").length,
    [rules]
  );

  const totalEligible = useMemo(
    () =>
      rules
        .filter((rule) => rule.status === "Active")
        .reduce((sum, rule) => sum + rule.eligibleCount, 0),
    [rules]
  );

  const handleRunNow = (id: string) => {
    setIsRunning(id);
    setOpenMenuId(null);

    setTimeout(() => {
      setRules((prev) =>
        prev.map((rule) =>
          rule.id === id
            ? {
                ...rule,
                lastProcessed: new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                }),
              }
            : rule
        )
      );
      setIsRunning(null);
    }, 1600);
  };

  const handleEdit = (rule: IncentiveRule) => {
    setEditingRule(rule);
    setIsFormOpen(true);
    setOpenMenuId(null);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setIsFormOpen(true);
    setOpenMenuId(null);
  };

  const handleClone = (rule: IncentiveRule) => {
    const cloned: IncentiveRule = {
      ...rule,
      id: buildRuleId(rules.length + 1),
      name: `${rule.name} Copy`,
      status: "Inactive",
    };

    setRules((prev) => [cloned, ...prev]);
    setOpenMenuId(null);
  };

  const handleToggleStatus = (rule: IncentiveRule) => {
    setRules((prev) =>
      prev.map((item) =>
        item.id === rule.id
          ? {
              ...item,
              status: item.status === "Active" ? "Inactive" : "Active",
            }
          : item
      )
    );
    setOpenMenuId(null);
  };

  const getWindowBadge = (window: IncentiveWindow) => {
    switch (window) {
      case "Monthly":
        return "bg-brand-100 text-brand-800 border-gray-200";
      case "Quarterly":
        return "bg-violet-50 text-violet-700 border-gray-200";
      case "Annual":
        return "bg-emerald-50 text-emerald-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-500 border-gray-200";
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
                <Gift className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Earned Leave Incentive Rules
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Automate leave credits using attendance, punctuality, tenure, and performance criteria.
                </p>
              </div>
            </div>

            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
            >
              <Plus className="h-4 w-4" />
              Create Rule
            </button>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Active Rules
                </p>
              </div>
              <p className="text-sm font-semibold text-brand-900">
                {activeCount} active configurations
              </p>
              <p className="mt-1 text-[11px] text-brand-700">
                Used in automated incentive distribution
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Eligible Staff
                </p>
              </div>
              <p className="text-sm font-semibold text-brand-900">
                {totalEligible.toLocaleString()} projected
              </p>
              <p className="mt-1 text-[11px] text-brand-700">
                Across all active rules
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Processing Note
                </p>
              </div>
              <p className="text-sm font-semibold text-brand-900">
                Processed after payroll lock
              </p>
              <p className="mt-1 text-[11px] text-brand-700">
                Leave credits are posted directly into balance ledger
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="rounded-xl border border-gray-200 bg-brand-100 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-800 shadow-sm">
              <Info className="h-4 w-4" />
            </div>
            <p className="text-sm leading-6 text-brand-900">
              Incentive awards are processed after <span className="font-semibold">payroll lock</span> so attendance data stays accurate. Once processed, credits are posted into the employee’s selected leave balance with full audit tracking.
            </p>
          </div>
        </div>

        {/* Main List */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                type="text"
                placeholder="Search rules, award, conditions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={windowFilter}
                onChange={(e) => setWindowFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none"
              >
                <option>All</option>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Annual</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none"
              >
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm">
              <span className="text-brand-700">Showing </span>
              <span className="font-semibold text-brand-900">{filteredRules.length}</span>
              <span className="text-brand-700"> rules</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-brand-700">
                <span className="font-semibold text-brand-900">{rules.length}</span>
                Total Rules
              </div>
              <div className="h-3 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5 text-brand-700">
                <span className="font-semibold text-brand-900">{activeCount}</span>
                Active
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Rule Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Window
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Conditions
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Award
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Eligible
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
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Briefcase className="h-10 w-10 text-brand-300" />
                        <p className="text-sm font-semibold text-brand-900">
                          No incentive rules found
                        </p>
                        <p className="text-sm text-brand-700">
                          Try adjusting your search or filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((rule) => (
                    <tr key={rule.id} className="transition-colors hover:bg-brand-100">
                      <td className="px-5 py-3.5 text-sm">
                        <div>
                          <div className="font-semibold text-brand-900">{rule.name}</div>
                          <div className="text-[11px] font-mono text-brand-700">{rule.id}</div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-sm">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                            getWindowBadge(rule.window)
                          )}
                        >
                          {rule.window}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-sm">
                        <div className="flex flex-wrap gap-1.5">
                          {rule.conditions.map((condition, idx) => (
                            <span
                              key={idx}
                              className="rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-[11px] font-medium text-brand-700"
                            >
                              {condition}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-sm">
                        <div className="flex items-center gap-2 text-brand-900">
                          <Zap className="h-4 w-4 text-amber-500" />
                          <span className="font-semibold">{rule.award}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-center text-sm">
                        <div className="font-semibold text-brand-900">
                          {rule.eligibleCount}
                        </div>
                        <div className="text-[11px] text-brand-700">Staff</div>
                      </td>

                      <td className="px-5 py-3.5 text-center text-sm">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                            rule.status === "Active"
                              ? "bg-brand-700 text-white"
                              : "bg-gray-100 text-gray-600"
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
                            className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {openMenuId === rule.id && (
                            <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg">
                              <button
                                onClick={() => {
                                  setSelectedRule(rule);
                                  setOpenMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                              >
                                <Eye className="h-4 w-4" />
                                View Analytics
                              </button>

                              <button
                                onClick={() => handleEdit(rule)}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit Rule
                              </button>

                              <button
                                onClick={() => handleClone(rule)}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                              >
                                <Copy className="h-4 w-4" />
                                Clone Rule
                              </button>

                              {rule.status === "Active" && (
                                <button
                                  onClick={() => handleRunNow(rule.id)}
                                  disabled={!!isRunning}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-brand-800 transition hover:bg-brand-100 disabled:opacity-50"
                                >
                                  {isRunning === rule.id ? (
                                    <Clock className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                  Run Now
                                </button>
                              )}

                              <div className="my-1 h-px bg-gray-200" />

                              <button
                                onClick={() => handleToggleStatus(rule)}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition",
                                  rule.status === "Active"
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-emerald-700 hover:bg-emerald-50"
                                )}
                              >
                                <Power className="h-4 w-4" />
                                {rule.status === "Active" ? "Deactivate" : "Activate"}
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

        {/* Bottom Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                Compliance Notes
              </h3>
            </div>

            <p className="text-sm leading-6 text-brand-700">
              Rule triggers are cross-checked with <span className="font-semibold text-brand-900">TimeSync</span> and <span className="font-semibold text-brand-900">PayEdge</span>. Every incentive posting generates a ledger audit entry for the employee.
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
              <button className="inline-flex items-center gap-2 text-sm font-medium text-brand-800 transition hover:text-brand-900">
                View Distribution History <ChevronRight className="h-4 w-4" />
              </button>

              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                ISO 27001 Verified
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-brand-900 p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">Upcoming Batch</h3>
                <p className="mt-1 text-sm leading-6 text-white/75">
                  Feb 2025 incentives will be calculated automatically on Mar 02. Projected staff eligible:{" "}
                  <span className="font-semibold text-white">~420</span>.
                </p>
              </div>

              <button className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
                Preview February Awards <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <AlertCircle className="pointer-events-none absolute opacity-0" />
          </div>
        </div>

        {/* Analytics Drawer */}
        {selectedRule && (
          <div className="fixed inset-0 z-[220] overflow-hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedRule(null)}
            />
            <div className="absolute right-0 top-0 flex h-full w-full max-w-[640px] flex-col border-l border-gray-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-brand-900">
                      Rule Analytics
                    </h2>
                    <p className="mt-0.5 text-sm text-brand-700">
                      {selectedRule.name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRule(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-brand-700 transition hover:bg-brand-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Rule ID
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedRule.id}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Window
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedRule.window}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Eligible Staff
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedRule.eligibleCount}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Last Processed
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedRule.lastProcessed || "Not processed yet"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Award
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">
                    {selectedRule.award}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Conditions
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedRule.conditions.map((condition, idx) => (
                      <span
                        key={idx}
                        className="rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-[11px] font-medium text-brand-700"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-4 w-4 text-amber-700" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        Analytics Note
                      </p>
                      <p className="mt-1 text-sm leading-6 text-amber-800/90">
                        Eligibility counts are preview values based on current attendance and compliance data. Final distribution is recalculated after payroll lock.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setSelectedRule(null)}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <IncentiveRuleForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingRule(null);
          }}
          initialData={editingRule}
        />
      </div>
    </div>
  );
}