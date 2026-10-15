"use client";

import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  Plus,
  RefreshCw,
  Pencil,
  Search,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";

type ProrationMethod =
  | "calendar_days"
  | "working_days"
  | "full_entitlement"
  | "next_cycle_only";

type RoundingRule = "none" | "up" | "down" | "nearest_half";

interface ProrationConfig {
  id: number;
  policy: string;
  leaveType: string;
  method: ProrationMethod;
  roundingRule: RoundingRule;
  applyOnHire: boolean;
  recalculateOnChange: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  annualEntitlement: number;
}

type FormState = {
  policy: string;
  leaveType: string;
  method: ProrationMethod;
  roundingRule: RoundingRule;
  applyOnHire: boolean;
  recalculateOnChange: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  annualEntitlement: number | "";
  joinDate: string;
};

const DEFAULT_ROWS: ProrationConfig[] = [
  {
    id: 1,
    policy: "Standard Leave Policy",
    leaveType: "Annual Leave",
    method: "calendar_days",
    roundingRule: "nearest_half",
    applyOnHire: true,
    recalculateOnChange: true,
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    isActive: true,
    annualEntitlement: 24,
  },
  {
    id: 2,
    policy: "Factory Workers Policy",
    leaveType: "Casual Leave",
    method: "working_days",
    roundingRule: "down",
    applyOnHire: true,
    recalculateOnChange: false,
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    isActive: true,
    annualEntitlement: 12,
  },
  {
    id: 3,
    policy: "Management Policy",
    leaveType: "Sick Leave",
    method: "full_entitlement",
    roundingRule: "none",
    applyOnHire: true,
    recalculateOnChange: true,
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    isActive: true,
    annualEntitlement: 15,
  },
  {
    id: 4,
    policy: "Contract Staff Policy",
    leaveType: "Annual Leave",
    method: "next_cycle_only",
    roundingRule: "none",
    applyOnHire: true,
    recalculateOnChange: false,
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    isActive: false,
    annualEntitlement: 18,
  },
];

const initialForm: FormState = {
  policy: "",
  leaveType: "",
  method: "calendar_days",
  roundingRule: "nearest_half",
  applyOnHire: true,
  recalculateOnChange: true,
  effectiveFrom: "2026-01-01",
  effectiveTo: "2026-12-31",
  isActive: true,
  annualEntitlement: "",
  joinDate: "2026-07-01",
};

function formatMethod(method: ProrationMethod) {
  switch (method) {
    case "calendar_days":
      return "Calendar Days";
    case "working_days":
      return "Working Days";
    case "full_entitlement":
      return "Full Entitlement";
    case "next_cycle_only":
      return "Next Cycle Only";
    default:
      return method;
  }
}

function formatRounding(rule: RoundingRule) {
  switch (rule) {
    case "nearest_half":
      return "Nearest 0.5";
    case "up":
      return "Round Up";
    case "down":
      return "Round Down";
    default:
      return "None";
  }
}

function calculatePreview(form: FormState) {
  const entitlement =
    typeof form.annualEntitlement === "number" ? form.annualEntitlement : 0;

  if (!form.joinDate || !form.effectiveFrom || !form.effectiveTo || !entitlement) {
    return {
      totalDays: 0,
      remainingDays: 0,
      raw: 0,
      rounded: 0,
      note: "Enter entitlement, cycle dates, and join date to preview proration.",
    };
  }

  const cycleStart = new Date(form.effectiveFrom);
  const cycleEnd = new Date(form.effectiveTo);
  const joinDate = new Date(form.joinDate);

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays =
    Math.max(Math.floor((cycleEnd.getTime() - cycleStart.getTime()) / msPerDay) + 1, 0) || 0;
  const remainingDays =
    joinDate > cycleEnd
      ? 0
      : Math.max(Math.floor((cycleEnd.getTime() - joinDate.getTime()) / msPerDay) + 1, 0);

  let raw = 0;
  let note = "";

  switch (form.method) {
    case "calendar_days":
      raw = totalDays ? (entitlement * remainingDays) / totalDays : 0;
      note = "Calculated using remaining calendar days in the cycle.";
      break;
    case "working_days":
      raw = totalDays ? (entitlement * Math.round(remainingDays * 0.72)) / Math.round(totalDays * 0.72) : 0;
      note = "Estimated using working-day ratio. Replace with real company calendar logic later.";
      break;
    case "full_entitlement":
      raw = entitlement;
      note = "Employee receives full entitlement for the current cycle.";
      break;
    case "next_cycle_only":
      raw = 0;
      note = "No current-cycle entitlement is granted. Leave starts next cycle.";
      break;
  }

  let rounded = raw;
  switch (form.roundingRule) {
    case "up":
      rounded = Math.ceil(raw);
      break;
    case "down":
      rounded = Math.floor(raw);
      break;
    case "nearest_half":
      rounded = Math.round(raw * 2) / 2;
      break;
    case "none":
    default:
      rounded = raw;
      break;
  }

  return {
    totalDays,
    remainingDays,
    raw,
    rounded,
    note,
  };
}

export default function LeaveProrationModule() {
  const [rows, setRows] = useState<ProrationConfig[]>(DEFAULT_ROWS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [methodFilter, setMethodFilter] = useState<"all" | ProrationMethod>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ProrationConfig | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        row.policy.toLowerCase().includes(q) ||
        row.leaveType.toLowerCase().includes(q) ||
        row.method.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && row.isActive) ||
        (statusFilter === "inactive" && !row.isActive);

      const matchesMethod = methodFilter === "all" || row.method === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [rows, search, statusFilter, methodFilter]);

  const preview = useMemo(() => calculatePreview(form), [form]);

  const activeCount = rows.filter((r) => r.isActive).length;
  const autoHireCount = rows.filter((r) => r.applyOnHire).length;
  const recalculationCount = rows.filter((r) => r.recalculateOnChange).length;

  const openCreate = () => {
    setEditingRow(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const openEdit = (row: ProrationConfig) => {
    setEditingRow(row);
    setForm({
      policy: row.policy,
      leaveType: row.leaveType,
      method: row.method,
      roundingRule: row.roundingRule,
      applyOnHire: row.applyOnHire,
      recalculateOnChange: row.recalculateOnChange,
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      isActive: row.isActive,
      annualEntitlement: row.annualEntitlement,
      joinDate: "2026-07-01",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRow(null);
    setForm(initialForm);
  };

  const saveConfig = () => {
    if (
      !form.policy.trim() ||
      !form.leaveType.trim() ||
      form.annualEntitlement === "" ||
      !form.effectiveFrom ||
      !form.effectiveTo
    ) {
      alert("Please fill all required fields.");
      return;
    }

    if (editingRow) {
      setRows((prev) =>
        prev.map((item) =>
          item.id === editingRow.id
            ? {
                ...item,
                policy: form.policy,
                leaveType: form.leaveType,
                method: form.method,
                roundingRule: form.roundingRule,
                applyOnHire: form.applyOnHire,
                recalculateOnChange: form.recalculateOnChange,
                effectiveFrom: form.effectiveFrom,
                effectiveTo: form.effectiveTo,
                isActive: form.isActive,
                annualEntitlement: Number(form.annualEntitlement),
              }
            : item
        )
      );
    } else {
      const nextId = Math.max(0, ...rows.map((r) => r.id)) + 1;
      setRows((prev) => [
        {
          id: nextId,
          policy: form.policy,
          leaveType: form.leaveType,
          method: form.method,
          roundingRule: form.roundingRule,
          applyOnHire: form.applyOnHire,
          recalculateOnChange: form.recalculateOnChange,
          effectiveFrom: form.effectiveFrom,
          effectiveTo: form.effectiveTo,
          isActive: form.isActive,
          annualEntitlement: Number(form.annualEntitlement),
        },
        ...prev,
      ]);
    }

    closeModal();
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Leave Proration
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Configure mid-year joining proration rules for leave entitlements.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100">
                <RefreshCw className="h-4 w-4" />
                Recalculate
              </button>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <Plus className="h-4 w-4" />
                Add Config
              </button>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Total Configs
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">{rows.length}</div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Active Rules
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">{activeCount}</div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Apply On Hire
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">{autoHireCount}</div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Recalculate On Change
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">{recalculationCount}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                type="text"
                placeholder="Search by policy, leave type, or method..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as "all" | ProrationMethod)}
              className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
            >
              <option value="all">All Methods</option>
              <option value="calendar_days">Calendar Days</option>
              <option value="working_days">Working Days</option>
              <option value="full_entitlement">Full Entitlement</option>
              <option value="next_cycle_only">Next Cycle Only</option>
            </select>
          </div>

          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2 text-sm text-brand-700">
              <Filter className="h-4 w-4" />
              Showing{" "}
              <span className="font-semibold text-brand-900">{filteredRows.length}</span>{" "}
              config(s)
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
              <Settings2 className="h-4 w-4" />
              Proration Configurations
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Sr.</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Policy / Leave Type</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Method</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Rounding</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Effective Period</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">Flags</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-brand-300/40 bg-white">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="text-sm font-semibold text-brand-900">
                        No proration configs found
                      </div>
                      <div className="mt-1 text-sm text-brand-700">
                        Try changing your filters or create a new configuration.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-brand-100 transition-colors">
                      <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-brand-900">{row.policy}</div>
                        <div className="text-[11px] text-brand-700">{row.leaveType}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-gray-200 bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                          {formatMethod(row.method)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-brand-900">
                        {formatRounding(row.roundingRule)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm text-brand-900">{row.effectiveFrom}</div>
                        <div className="text-[11px] text-brand-700">{row.effectiveTo}</div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="space-y-1 text-[11px] text-brand-700">
                          <div>{row.applyOnHire ? "Apply on Hire" : "Manual Only"}</div>
                          <div>{row.recalculateOnChange ? "Recalculate On Change" : "No Auto Recalc"}</div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            row.isActive
                              ? "bg-brand-800 text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {row.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEdit(row)}
                            className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100"
                          >
                            <Pencil className="h-4 w-4" />
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

        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-brand-900">
                      {editingRow ? "Edit Leave Proration Config" : "Create Leave Proration Config"}
                    </h3>
                    <p className="text-sm text-brand-700">
                      Configure calculation rules and preview the prorated result.
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-0 lg:grid-cols-[1.3fr_0.9fr]">
                <div className="border-b border-gray-200 p-6 lg:border-b-0 lg:border-r">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-brand-900">
                        Policy *
                      </label>
                      <input
                        value={form.policy}
                        onChange={(e) => setForm((p) => ({ ...p, policy: e.target.value }))}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                        placeholder="e.g. Standard Leave Policy"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-brand-900">
                        Leave Type *
                      </label>
                      <input
                        value={form.leaveType}
                        onChange={(e) => setForm((p) => ({ ...p, leaveType: e.target.value }))}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                        placeholder="e.g. Annual Leave"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-brand-900">
                        Proration Method *
                      </label>
                      <select
                        value={form.method}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            method: e.target.value as ProrationMethod,
                          }))
                        }
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                      >
                        <option value="calendar_days">Proportional (Calendar Days)</option>
                        <option value="working_days">Proportional (Working Days)</option>
                        <option value="full_entitlement">Full Entitlement</option>
                        <option value="next_cycle_only">Next Cycle Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-brand-900">
                        Rounding Rule
                      </label>
                      <select
                        value={form.roundingRule}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            roundingRule: e.target.value as RoundingRule,
                          }))
                        }
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                      >
                        <option value="none">None</option>
                        <option value="up">Round Up</option>
                        <option value="down">Round Down</option>
                        <option value="nearest_half">Nearest 0.5</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-brand-900">
                        Annual Entitlement *
                      </label>
                      <input
                        type="number"
                        value={form.annualEntitlement}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            annualEntitlement: e.target.value === "" ? "" : Number(e.target.value),
                          }))
                        }
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                        placeholder="e.g. 24"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-brand-900">
                        Employee Join Date
                      </label>
                      <input
                        type="date"
                        value={form.joinDate}
                        onChange={(e) => setForm((p) => ({ ...p, joinDate: e.target.value }))}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-brand-900">
                        Effective From *
                      </label>
                      <input
                        type="date"
                        value={form.effectiveFrom}
                        onChange={(e) => setForm((p) => ({ ...p, effectiveFrom: e.target.value }))}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-brand-900">
                        Effective To *
                      </label>
                      <input
                        type="date"
                        value={form.effectiveTo}
                        onChange={(e) => setForm((p) => ({ ...p, effectiveTo: e.target.value }))}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                      <div>
                        <div className="text-sm font-semibold text-brand-900">Apply On Hire</div>
                        <div className="text-[11px] text-brand-700">Run when employee is created</div>
                      </div>
                      <button
                        onClick={() => setForm((p) => ({ ...p, applyOnHire: !p.applyOnHire }))}
                        className={`relative inline-flex h-6 w-11 rounded-full transition ${
                          form.applyOnHire ? "bg-brand-800" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                            form.applyOnHire ? "left-5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                      <div>
                        <div className="text-sm font-semibold text-brand-900">Recalculate On Change</div>
                        <div className="text-[11px] text-brand-700">Run again when policy changes</div>
                      </div>
                      <button
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            recalculateOnChange: !p.recalculateOnChange,
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 rounded-full transition ${
                          form.recalculateOnChange ? "bg-brand-800" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                            form.recalculateOnChange ? "left-5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                      <div>
                        <div className="text-sm font-semibold text-brand-900">Active Status</div>
                        <div className="text-[11px] text-brand-700">Available for system use</div>
                      </div>
                      <button
                        onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                        className={`relative inline-flex h-6 w-11 rounded-full transition ${
                          form.isActive ? "bg-brand-800" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                            form.isActive ? "left-5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6">
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                      <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                        <CalendarDays className="h-4 w-4" />
                        Proration Preview
                      </h4>
                    </div>

                    <div className="grid gap-4 p-5">
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                          Method
                        </div>
                        <div className="mt-2 text-sm font-semibold text-brand-900">
                          {formatMethod(form.method)}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                            Total Cycle Days
                          </div>
                          <div className="mt-2 text-lg font-bold text-brand-900">
                            {preview.totalDays}
                          </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                            Remaining Days
                          </div>
                          <div className="mt-2 text-lg font-bold text-brand-900">
                            {preview.remainingDays}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                          Raw Proration
                        </div>
                        <div className="mt-2 text-lg font-bold text-brand-900">
                          {preview.raw.toFixed(2)}
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-brand-100 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                          Rounded Result
                        </div>
                        <div className="mt-2 text-2xl font-bold text-brand-900">
                          {preview.rounded.toFixed(2)}
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="mt-0.5 h-4 w-4 text-brand-800" />
                          <div>
                            <div className="text-sm font-semibold text-brand-900">
                              Calculation Note
                            </div>
                            <div className="mt-1 text-sm leading-6 text-brand-700">
                              {preview.note}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-2 text-sm text-brand-700">
                          <Clock3 className="h-4 w-4" />
                          Join Date
                          <ChevronRight className="h-4 w-4" />
                          <span className="font-semibold text-brand-900">{form.joinDate || "--"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveConfig}
                  className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  {editingRow ? "Update Config" : "Save Config"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}