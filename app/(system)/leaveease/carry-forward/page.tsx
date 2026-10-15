"use client";

import React, { useMemo, useState } from "react";
import {
  Save,
  Calendar,
  Info,
  ChevronRight,
  Calculator,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Users,
  ArrowRightLeft,
  ShieldCheck,
  Eye,
  RotateCcw,
  Settings2,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

type ExpiryOption =
  | "End of Q1"
  | "End of Q2"
  | "End of Year"
  | "Never"
  | "Custom";

interface CarryForwardRule {
  type: string;
  enabled: boolean;
  maxDays: number;
  expiry: ExpiryOption;
  projectedDays: number;
  impactedStaff: number;
}

const INITIAL_RULES: CarryForwardRule[] = [
  {
    type: "Annual Leave",
    enabled: true,
    maxDays: 10,
    expiry: "End of Q1",
    projectedDays: 1840,
    impactedStaff: 310,
  },
  {
    type: "Casual Leave",
    enabled: false,
    maxDays: 0,
    expiry: "End of Year",
    projectedDays: 0,
    impactedStaff: 0,
  },
  {
    type: "Sick Leave",
    enabled: true,
    maxDays: 5,
    expiry: "Never",
    projectedDays: 610,
    impactedStaff: 125,
  },
  {
    type: "Comp-Off",
    enabled: true,
    maxDays: 2,
    expiry: "End of Q1",
    projectedDays: 45,
    impactedStaff: 22,
  },
  {
    type: "Study Leave",
    enabled: true,
    maxDays: 15,
    expiry: "Never",
    projectedDays: 150,
    impactedStaff: 10,
  },
];

const YEAR_OPTIONS = [
  "Year 2024 → 2025",
  "Year 2023 → 2024",
  "Year 2025 → 2026",
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function cloneRules(rules: CarryForwardRule[]) {
  return rules.map((rule) => ({ ...rule }));
}

function computeProjection(rules: CarryForwardRule[]) {
  const totalBalances = rules.reduce((sum, rule) => sum + rule.projectedDays, 0);

  const toCarryForward = rules.reduce((sum, rule) => {
    if (!rule.enabled) return sum;
    return sum + Math.min(rule.projectedDays, rule.maxDays * rule.impactedStaff);
  }, 0);

  const toLapse = Math.max(totalBalances - toCarryForward, 0);

  const liabilityShift = -(toLapse * 72);

  const lapseByDepartment = [
    { dept: "Engineering", total: 1200, lapse: Math.round(toLapse * 0.27) },
    { dept: "Sales", total: 1000, lapse: Math.round(toLapse * 0.37) },
    { dept: "HR & Ops", total: 500, lapse: Math.round(toLapse * 0.07) },
    { dept: "Product", total: 1420, lapse: Math.round(toLapse * 0.29) },
  ];

  return {
    totalBalances,
    toCarryForward,
    toLapse,
    liabilityShift,
    lapseByDepartment,
  };
}

export default function CarryForwardRules() {
  const [yearRange, setYearRange] = useState("Year 2024 → 2025");
  const [rules, setRules] = useState<CarryForwardRule[]>(cloneRules(INITIAL_RULES));
  const [savedRules, setSavedRules] = useState<CarryForwardRule[]>(cloneRules(INITIAL_RULES));
  const [selectedRule, setSelectedRule] = useState<CarryForwardRule | null>(null);

  const [isModified, setIsModified] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const projection = useMemo(() => computeProjection(rules), [rules]);

  const enabledRulesCount = useMemo(
    () => rules.filter((rule) => rule.enabled).length,
    [rules]
  );

  const totalImpactedStaff = useMemo(
    () => rules.reduce((sum, rule) => sum + (rule.enabled ? rule.impactedStaff : 0), 0),
    [rules]
  );

  const updateRule = (index: number, updates: Partial<CarryForwardRule>) => {
    setRules((prev) => {
      const next = [...prev];
      const current = next[index];
      const updated = { ...current, ...updates };

      if (!updated.enabled) {
        updated.maxDays = 0;
        updated.projectedDays = 0;
        updated.impactedStaff = 0;
      } else {
        const baseline = INITIAL_RULES.find((r) => r.type === updated.type);
        if (baseline) {
          updated.impactedStaff =
            updates.impactedStaff !== undefined
              ? updates.impactedStaff
              : baseline.impactedStaff;

          const safeMax = Math.max(updated.maxDays || 0, 0);
          const roughProjected = Math.round(safeMax * updated.impactedStaff * 0.58);
          updated.projectedDays = roughProjected;
        }
      }

      next[index] = updated;
      return next;
    });

    setIsModified(true);
  };

  const handleYearChange = (value: string) => {
    setYearRange(value);
    setShowPreview(false);
  };

  const handlePreview = () => {
    setIsPreviewLoading(true);
    setShowPreview(false);

    setTimeout(() => {
      setIsPreviewLoading(false);
      setShowPreview(true);
    }, 900);
  };

  const handleSave = () => {
    if (!isModified) return;

    setIsSaving(true);

    setTimeout(() => {
      setSavedRules(cloneRules(rules));
      setIsModified(false);
      setIsSaving(false);
    }, 800);
  };

  const handleReset = () => {
    setRules(cloneRules(savedRules));
    setIsModified(false);
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <ArrowRightLeft className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Carry Forward Rules
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Configure how unused leave balances move into the next leave year.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={yearRange}
                onChange={(e) => handleYearChange(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              >
                {YEAR_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>

              <button
                onClick={handleReset}
                disabled={!isModified}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>

              <button
                onClick={handleSave}
                disabled={!isModified || isSaving}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition",
                  isModified
                    ? "bg-brand-800 text-white hover:bg-brand-900"
                    : "cursor-not-allowed bg-gray-100 text-gray-400"
                )}
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save All Changes"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Scheduled Event
                </p>
              </div>
              <p className="text-sm font-semibold text-brand-900">
                Year-end processing: Jan 5, 2025
              </p>
              <p className="mt-1 text-[11px] text-brand-700">
                Rules are applied only to active staff with eligible balances.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Active Rules
                </p>
              </div>
              <p className="text-sm font-semibold text-brand-900">
                {enabledRulesCount} leave types enabled
              </p>
              <p className="mt-1 text-[11px] text-brand-700">
                Total impacted staff: {totalImpactedStaff.toLocaleString()}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-700" />
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Rule Notes
                </p>
              </div>
              <p className="text-sm font-semibold text-brand-900">
                Carry forward respects caps and expiry policies
              </p>
              <p className="mt-1 text-[11px] text-brand-700">
                Preview before final year-end execution.
              </p>
            </div>
          </div>
        </div>

        {/* Rules table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-brand-700" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                Rule Matrix
              </h3>
            </div>

            <div className="text-xs text-brand-700">
              {rules.length} leave types configured
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
                    Carry Forward
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Max Days
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Expiry
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Projected CF
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {rules.map((rule, idx) => (
                  <tr key={rule.type} className="transition-colors hover:bg-brand-100">
                    <td className="px-5 py-3.5 text-sm">
                      <div>
                        <div className="font-semibold text-brand-900">
                          {rule.type}
                        </div>
                        <div className="text-[11px] text-brand-700">
                          {rule.enabled ? "Rule enabled" : "Rule disabled"}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-sm">
                      <button
                        onClick={() => updateRule(idx, { enabled: !rule.enabled })}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                          rule.enabled ? "bg-brand-800" : "bg-gray-300"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            rule.enabled ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-sm">
                      <input
                        type="number"
                        min={0}
                        disabled={!rule.enabled}
                        value={rule.maxDays}
                        onChange={(e) =>
                          updateRule(idx, {
                            maxDays: Math.max(Number(e.target.value) || 0, 0),
                          })
                        }
                        className={cn(
                          "w-24 rounded-lg border px-3 py-2 text-sm outline-none transition",
                          rule.enabled
                            ? "border-gray-200 bg-white text-brand-900 focus:border-brand-800"
                            : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                        )}
                      />
                    </td>

                    <td className="px-5 py-3.5 text-sm">
                      <select
                        disabled={!rule.enabled}
                        value={rule.expiry}
                        onChange={(e) =>
                          updateRule(idx, {
                            expiry: e.target.value as ExpiryOption,
                          })
                        }
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm outline-none transition",
                          rule.enabled
                            ? "border-gray-200 bg-white text-brand-900 focus:border-brand-800"
                            : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                        )}
                      >
                        <option>End of Q1</option>
                        <option>End of Q2</option>
                        <option>End of Year</option>
                        <option>Never</option>
                        <option>Custom</option>
                      </select>
                    </td>

                    <td className="px-5 py-3.5 text-sm">
                      {rule.enabled ? (
                        <div>
                          <div className="font-semibold text-brand-900">
                            ~{rule.projectedDays.toLocaleString()} days
                          </div>
                          <div className="text-[11px] text-brand-700">
                            {rule.impactedStaff} employees
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          No carry forward
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center text-sm">
                      <button
                        onClick={() => setSelectedRule(rule)}
                        className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100 hover:text-brand-900"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {rules.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Briefcase className="h-10 w-10 text-brand-300" />
                        <p className="text-sm font-semibold text-brand-900">
                          No carry forward rules found
                        </p>
                        <p className="text-sm text-brand-700">
                          Add or configure leave rules to continue.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-brand-900">
                Year-End Projection
              </h3>
              <p className="mt-1 text-sm text-brand-700">
                Simulate how balances will be processed based on the current rule configuration.
              </p>
            </div>

            <button
              onClick={handlePreview}
              disabled={isPreviewLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900 disabled:opacity-60"
            >
              {isPreviewLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4" />
              )}
              {showPreview ? "Recalculate Projection" : "Preview Year-End Processing"}
            </button>
          </div>

          <div className="p-6">
            {isPreviewLoading ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                <RefreshCw className="h-8 w-8 animate-spin text-brand-700" />
                <p className="text-sm font-medium text-brand-900">
                  Calculating projection...
                </p>
                <p className="text-sm text-brand-700">
                  Reviewing enabled rules, caps, expiry, and projected balances.
                </p>
              </div>
            ) : showPreview ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <div className="mb-3 flex items-center gap-2 text-brand-700">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Total Balances
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-brand-900">
                      {projection.totalBalances.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-brand-700">
                      Days as of Dec 31
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <div className="mb-3 flex items-center gap-2 text-brand-700">
                      <ArrowRightLeft className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        To Carry Forward
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-brand-900">
                      {projection.toCarryForward.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-brand-700">
                      Within rule limits
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <div className="mb-3 flex items-center gap-2 text-brand-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        To Lapse
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-brand-900">
                      {projection.toLapse.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-brand-700">
                      Balances above caps or disabled by policy
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <div className="mb-3 flex items-center gap-2 text-brand-700">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Liability Shift
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-brand-900">
                      ${projection.liabilityShift.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-brand-700">
                      Estimated financial impact
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-brand-700" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Projected Lapse by Department
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {projection.lapseByDepartment.map((dept) => {
                        const ratio =
                          dept.total > 0 ? Math.min((dept.lapse / dept.total) * 100, 100) : 0;

                        return (
                          <div key={dept.dept} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-brand-900">
                                {dept.dept}
                              </span>
                              <span className="font-semibold text-brand-700">
                                {dept.lapse} days
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-brand-800"
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-brand-900 p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-white/80">
                        Finalize Rules
                      </h4>
                    </div>

                    <p className="text-sm leading-6 text-white/80">
                      Once approved, save the updated rules and review employee communication before final year-end processing begins.
                    </p>

                    <button className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
                      <ShieldCheck className="h-4 w-4" />
                      Review Communication Draft
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-brand-900">
                  No projection data
                </p>
                <p className="max-w-sm text-sm text-brand-700">
                  Click the preview button above to simulate the year-end leave transition.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detail drawer */}
        {selectedRule && (
          <div className="fixed inset-0 z-[100] overflow-hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedRule(null)}
            />

            <div className="absolute right-0 top-0 flex h-full w-full max-w-[620px] flex-col border-l border-gray-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                    <Info className="h-5 w-5 text-white" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-brand-900">
                      Rule Detail
                    </h2>
                    <p className="mt-0.5 text-sm text-brand-700">
                      {selectedRule.type} carry forward policy
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRule(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-brand-700 transition hover:bg-brand-100 hover:text-brand-900"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Carry Forward
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">
                    {selectedRule.enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Max Days
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">
                    {selectedRule.maxDays} days
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Expiry Rule
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">
                    {selectedRule.expiry}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Projected Carry Forward
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">
                    {selectedRule.projectedDays.toLocaleString()} days
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-brand-100 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-4 w-4 text-brand-700" />
                    <div>
                      <p className="text-sm font-semibold text-brand-900">
                        Rule Guidance
                      </p>
                      <p className="mt-1 text-sm leading-6 text-brand-700">
                        Disabled rules lapse remaining balances automatically. Enabled rules only carry balances within configured caps.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
                <p className="text-xs text-brand-700">
                  Review policy details before final save.
                </p>

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
      </div>
    </div>
  );
}