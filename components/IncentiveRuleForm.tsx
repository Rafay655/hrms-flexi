"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Gift,
  Save,
  Settings2,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock3,
  ShieldCheck,
  Plus,
} from "lucide-react";

type IncentiveWindow = "Monthly" | "Quarterly" | "Annual";
type IncentiveStatus = "Active" | "Inactive";

export interface IncentiveRuleFormData {
  id?: string;
  name: string;
  window: IncentiveWindow;
  conditions: string[];
  award: string;
  eligibleCount: number;
  status: IncentiveStatus;
  lastProcessed?: string;
}

interface IncentiveRuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: IncentiveRuleFormData | null;
  onSave?: (data: IncentiveRuleFormData) => void;
}

const WINDOW_OPTIONS: IncentiveWindow[] = ["Monthly", "Quarterly", "Annual"];

const CONDITION_LIBRARY = [
  "No unpaid",
  "0 lates",
  "No short leave",
  "< 3 lates",
  "No unauthorized",
  "< 2 sick days",
  "No absences",
  "Tenure > 12m",
  "Rating > 4.0",
  "No disciplinary action",
];

const STATUS_OPTIONS: IncentiveStatus[] = ["Active", "Inactive"];

const DEFAULT_FORM: IncentiveRuleFormData = {
  name: "",
  window: "Monthly",
  conditions: [],
  award: "",
  eligibleCount: 0,
  status: "Active",
  lastProcessed: "",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function buildRuleId() {
  return `INC-${Math.floor(100 + Math.random() * 900)}`;
}

export function IncentiveRuleForm({
  isOpen,
  onClose,
  initialData,
  onSave,
}: IncentiveRuleFormProps) {
  const isEdit = !!initialData;

  const [form, setForm] = useState<IncentiveRuleFormData>(DEFAULT_FORM);
  const [customCondition, setCustomCondition] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setForm({
        id: initialData.id ?? buildRuleId(),
        name: initialData.name ?? "",
        window: initialData.window ?? "Monthly",
        conditions: initialData.conditions ?? [],
        award: initialData.award ?? "",
        eligibleCount: initialData.eligibleCount ?? 0,
        status: initialData.status ?? "Active",
        lastProcessed: initialData.lastProcessed ?? "",
      });
    } else {
      setForm({
        ...DEFAULT_FORM,
        id: buildRuleId(),
      });
    }

    setCustomCondition("");
    setErrors({});
    setIsSaving(false);
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const windowHint = useMemo(() => {
    switch (form.window) {
      case "Monthly":
        return "Best for attendance and punctuality incentives processed every month.";
      case "Quarterly":
        return "Suitable for broader consistency or wellness-based incentive checks.";
      case "Annual":
        return "Use for tenure, appraisal, and loyalty-based leave rewards.";
      default:
        return "";
    }
  }, [form.window]);

  const suggestedAwardPlaceholder = useMemo(() => {
    switch (form.window) {
      case "Monthly":
        return "e.g. 1 day Annual Leave";
      case "Quarterly":
        return "e.g. 2 days Annual Leave";
      case "Annual":
        return "e.g. 5 days Annual Leave";
      default:
        return "Enter incentive award";
    }
  }, [form.window]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) nextErrors.name = "Rule name is required.";
    if (!form.window) nextErrors.window = "Window is required.";
    if (!form.award.trim()) nextErrors.award = "Award is required.";
    if (!form.conditions.length) nextErrors.conditions = "Add at least one condition.";
    if (form.eligibleCount < 0) nextErrors.eligibleCount = "Eligible count cannot be negative.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = <K extends keyof IncentiveRuleFormData>(
    key: K,
    value: IncentiveRuleFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const toggleCondition = (condition: string) => {
    setForm((prev) => {
      const exists = prev.conditions.includes(condition);
      return {
        ...prev,
        conditions: exists
          ? prev.conditions.filter((item) => item !== condition)
          : [...prev.conditions, condition],
      };
    });

    setErrors((prev) => ({ ...prev, conditions: "" }));
  };

  const removeCondition = (condition: string) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((item) => item !== condition),
    }));
  };

  const addCustomCondition = () => {
    const value = customCondition.trim();
    if (!value) return;

    if (!form.conditions.includes(value)) {
      setForm((prev) => ({
        ...prev,
        conditions: [...prev.conditions, value],
      }));
    }

    setCustomCondition("");
    setErrors((prev) => ({ ...prev, conditions: "" }));
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);

    const payload: IncentiveRuleFormData = {
      ...form,
      id: form.id || buildRuleId(),
      eligibleCount: Number(form.eligibleCount) || 0,
    };

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      onSave?.(payload);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative z-[121] max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <Gift className="h-5 w-5 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-brand-900">
                  {isEdit ? "Edit Incentive Rule" : "Create Incentive Rule"}
                </h2>
                <p className="mt-0.5 text-sm text-brand-700">
                  Configure earned leave incentives using attendance, punctuality, or performance criteria.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-brand-700 transition hover:bg-brand-100 hover:text-brand-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-148px)] overflow-y-auto">
          <div className="grid gap-6 p-6 lg:grid-cols-3">
            {/* Main section */}
            <div className="space-y-6 lg:col-span-2">
              {/* Basic information */}
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-brand-700" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Basic Information
                    </h3>
                  </div>
                </div>

                <div className="grid gap-5 p-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Rule Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="e.g. Perfect Attendance Bonus"
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition",
                        errors.name
                          ? "border-red-300 focus:border-red-400"
                          : "border-gray-200 focus:border-brand-800"
                      )}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Rule ID
                    </label>
                    <input
                      value={form.id ?? ""}
                      disabled
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-brand-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        updateField("status", e.target.value as IncentiveStatus)
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Rule setup */}
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-brand-700" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Incentive Configuration
                    </h3>
                  </div>
                </div>

                <div className="grid gap-5 p-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Processing Window <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.window}
                      onChange={(e) =>
                        updateField("window", e.target.value as IncentiveWindow)
                      }
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition",
                        errors.window
                          ? "border-red-300 focus:border-red-400"
                          : "border-gray-200 focus:border-brand-800"
                      )}
                    >
                      {WINDOW_OPTIONS.map((window) => (
                        <option key={window} value={window}>
                          {window}
                        </option>
                      ))}
                    </select>
                    {errors.window && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.window}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-brand-700">
                      {windowHint}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Projected Eligible Count
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.eligibleCount}
                      onChange={(e) =>
                        updateField("eligibleCount", Number(e.target.value) || 0)
                      }
                      placeholder="e.g. 120"
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition",
                        errors.eligibleCount
                          ? "border-red-300 focus:border-red-400"
                          : "border-gray-200 focus:border-brand-800"
                      )}
                    />
                    {errors.eligibleCount && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.eligibleCount}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Award <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.award}
                      onChange={(e) => updateField("award", e.target.value)}
                      placeholder={suggestedAwardPlaceholder}
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition",
                        errors.award
                          ? "border-red-300 focus:border-red-400"
                          : "border-gray-200 focus:border-brand-800"
                      )}
                    />
                    {errors.award && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.award}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand-700" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Eligibility Conditions
                    </h3>
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-900">
                      Select Conditions <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CONDITION_LIBRARY.map((condition) => {
                        const active = form.conditions.includes(condition);

                        return (
                          <button
                            key={condition}
                            type="button"
                            onClick={() => toggleCondition(condition)}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-sm transition",
                              active
                                ? "border-brand-800 bg-brand-100 text-brand-900"
                                : "border-gray-200 bg-white text-brand-700 hover:bg-brand-100"
                            )}
                          >
                            {condition}
                          </button>
                        );
                      })}
                    </div>
                    {errors.conditions && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {errors.conditions}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-900">
                      Add Custom Condition
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={customCondition}
                        onChange={(e) => setCustomCondition(e.target.value)}
                        placeholder="e.g. No late check-ins for 30 days"
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                      />
                      <button
                        type="button"
                        onClick={addCustomCondition}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-900">
                      Applied Conditions
                    </label>

                    {form.conditions.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-brand-700">
                        No conditions added yet.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {form.conditions.map((condition) => (
                          <div
                            key={condition}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-brand-800"
                          >
                            <span>{condition}</span>
                            <button
                              type="button"
                              onClick={() => removeCondition(condition)}
                              className="rounded-full p-0.5 text-brand-700 transition hover:bg-brand-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-brand-700" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Rule Summary
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Name
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {form.name || "Not entered"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Window
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {form.window}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Award
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {form.award || "Not entered"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Conditions Count
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {form.conditions.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-brand-900 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    Processing Notes
                  </h3>
                </div>

                <div className="space-y-3 text-sm text-white/80">
                  <p>
                    Incentive rules are evaluated after attendance and payroll reconciliation.
                  </p>
                  <p>
                    Eligible count is a projected number and may change at final processing time.
                  </p>
                </div>
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">
                        Please complete required fields
                      </p>
                      <p className="mt-1 text-xs text-red-600">
                        Fix the highlighted fields before saving this rule.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-brand-700">
            {isEdit
              ? "You are updating an existing incentive rule."
              : "This rule will be available for automated leave incentive processing."}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : isEdit ? "Update Rule" : "Save Rule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}