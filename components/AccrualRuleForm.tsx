"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Calendar,
  Clock,
  ShieldCheck,
  Save,
  Plus,
  Settings2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type AccrualFrequency = "Monthly" | "Quarterly" | "Annual" | "On Join";
type RuleStatus = "Active" | "Inactive";

export interface AccrualRuleFormData {
  id?: string;
  leaveType: string;
  frequency: AccrualFrequency;
  amount: string;
  cap: string;
  proration: string;
  lapse: string;
  status: RuleStatus;
  lastRun?: string;
}

interface AccrualRuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: AccrualRuleFormData | null;
  onSave?: (data: AccrualRuleFormData) => void;
}

const LEAVE_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Casual Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Short Leave",
  "Study Leave",
  "Unpaid Leave",
];

const PRORATION_OPTIONS = [
  "None",
  "Join ✓ Exit ✓",
  "Join ✓ Exit ✗",
  "Join ✗ Exit ✓",
  "Join only",
  "Exit only",
];

const LAPSE_OPTIONS = [
  "Never",
  "End of month",
  "End of quarter",
  "End of year",
  "After 3 months",
  "After 6 months",
];

const DEFAULT_FORM: AccrualRuleFormData = {
  leaveType: "",
  frequency: "Monthly",
  amount: "",
  cap: "",
  proration: "None",
  lapse: "Never",
  status: "Active",
  lastRun: "N/A",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function buildRuleId() {
  return `AC-${Math.floor(100 + Math.random() * 900)}`;
}

export function AccrualRuleForm({
  isOpen,
  onClose,
  initialData,
  onSave,
}: AccrualRuleFormProps) {
  const isEdit = !!initialData;

  const [form, setForm] = useState<AccrualRuleFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setForm({
        id: initialData.id ?? buildRuleId(),
        leaveType: initialData.leaveType ?? "",
        frequency: initialData.frequency ?? "Monthly",
        amount: initialData.amount ?? "",
        cap: initialData.cap ?? "",
        proration: initialData.proration ?? "None",
        lapse: initialData.lapse ?? "Never",
        status: initialData.status ?? "Active",
        lastRun: initialData.lastRun ?? "N/A",
      });
    } else {
      setForm({
        ...DEFAULT_FORM,
        id: buildRuleId(),
      });
    }

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

  const frequencyHint = useMemo(() => {
    switch (form.frequency) {
      case "Monthly":
        return "Best for recurring monthly leave credits.";
      case "Quarterly":
        return "Useful for leave balances credited every quarter.";
      case "Annual":
        return "Suitable for yearly bulk entitlement allocation.";
      case "On Join":
        return "Use for one-time entitlement on employee joining.";
      default:
        return "";
    }
  }, [form.frequency]);

  const amountPlaceholder = useMemo(() => {
    switch (form.frequency) {
      case "Monthly":
        return "e.g. 2.0 days/month";
      case "Quarterly":
        return "e.g. 3.0 days/quarter";
      case "Annual":
        return "e.g. 12.0 days/year";
      case "On Join":
        return "e.g. 90.0 days";
      default:
        return "Enter amount";
    }
  }, [form.frequency]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.leaveType.trim()) nextErrors.leaveType = "Leave type is required.";
    if (!form.frequency.trim()) nextErrors.frequency = "Frequency is required.";
    if (!form.amount.trim()) nextErrors.amount = "Amount is required.";
    if (!form.cap.trim()) nextErrors.cap = "Cap is required.";
    if (!form.proration.trim()) nextErrors.proration = "Proration is required.";
    if (!form.lapse.trim()) nextErrors.lapse = "Lapse rule is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);

    const payload: AccrualRuleFormData = {
      ...form,
      id: form.id || buildRuleId(),
      lastRun: form.frequency === "On Join" ? "N/A" : form.lastRun || "N/A",
    };

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      onSave?.(payload);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof AccrualRuleFormData>(
    key: K,
    value: AccrualRuleFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative z-[101] max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <Calendar className="h-5 w-5 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-brand-900">
                  {isEdit ? "Edit Accrual Rule" : "Create Accrual Rule"}
                </h2>
                <p className="mt-0.5 text-sm text-brand-700">
                  Configure leave credit logic, proration, caps, and lapse behavior.
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
            {/* Left / Main */}
            <div className="space-y-6 lg:col-span-2">
              {/* Basic info */}
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
                      Leave Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.leaveType}
                      onChange={(e) => updateField("leaveType", e.target.value)}
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition",
                        errors.leaveType
                          ? "border-red-300 focus:border-red-400"
                          : "border-gray-200 focus:border-brand-800"
                      )}
                    >
                      <option value="">Select leave type</option>
                      {LEAVE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.leaveType && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.leaveType}
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
                        updateField("status", e.target.value as RuleStatus)
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Accrual configuration */}
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand-700" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Accrual Configuration
                    </h3>
                  </div>
                </div>

                <div className="grid gap-5 p-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Frequency <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.frequency}
                      onChange={(e) =>
                        updateField(
                          "frequency",
                          e.target.value as AccrualFrequency
                        )
                      }
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition",
                        errors.frequency
                          ? "border-red-300 focus:border-red-400"
                          : "border-gray-200 focus:border-brand-800"
                      )}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annual">Annual</option>
                      <option value="On Join">On Join</option>
                    </select>
                    {errors.frequency && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.frequency}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-brand-700">
                      {frequencyHint}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.amount}
                      onChange={(e) => updateField("amount", e.target.value)}
                      placeholder={amountPlaceholder}
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition",
                        errors.amount
                          ? "border-red-300 focus:border-red-400"
                          : "border-gray-200 focus:border-brand-800"
                      )}
                    />
                    {errors.amount && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Cap <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.cap}
                      onChange={(e) => updateField("cap", e.target.value)}
                      placeholder="e.g. 30 days max / No cap"
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition",
                        errors.cap
                          ? "border-red-300 focus:border-red-400"
                          : "border-gray-200 focus:border-brand-800"
                      )}
                    />
                    {errors.cap && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.cap}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Lapse Rule <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.lapse}
                      onChange={(e) => updateField("lapse", e.target.value)}
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition",
                        errors.lapse
                          ? "border-red-300 focus:border-red-400"
                          : "border-gray-200 focus:border-brand-800"
                      )}
                    >
                      {LAPSE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.lapse && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.lapse}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Proration <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.proration}
                      onChange={(e) => updateField("proration", e.target.value)}
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition",
                        errors.proration
                          ? "border-red-300 focus:border-red-400"
                          : "border-gray-200 focus:border-brand-800"
                      )}
                    >
                      {PRORATION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.proration && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.proration}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-brand-700" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Guidance
                  </h3>
                </div>

                <div className="space-y-2 text-sm text-brand-700">
                  <p>
                    Use <span className="font-semibold text-brand-900">Monthly</span> for
                    recurring entitlements and{" "}
                    <span className="font-semibold text-brand-900">On Join</span> for
                    one-time allocations.
                  </p>
                  <p>
                    Set <span className="font-semibold text-brand-900">Cap</span> to
                    control maximum carry or balance limits.
                  </p>
                  <p>
                    Choose <span className="font-semibold text-brand-900">Proration</span>{" "}
                    carefully for fair balance allocation on mid-period joiners and leavers.
                  </p>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-700" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Rule Summary
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Leave Type
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {form.leaveType || "Not selected"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Frequency
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {form.frequency}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Amount
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {form.amount || "Not entered"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Cap
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {form.cap || "Not entered"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-brand-900 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    Validation Notes
                  </h3>
                </div>

                <div className="space-y-3 text-sm text-white/80">
                  <p>
                    Ensure the amount text clearly reflects unit and period, like
                    “2.0 days/month” or “10.0 days/year”.
                  </p>
                  <p>
                    For one-time entitlement rules, keep last run as{" "}
                    <span className="font-semibold text-white">N/A</span>.
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
                        Fix the highlighted inputs before saving this rule.
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
              ? "You are updating an existing accrual rule."
              : "This rule will be used for automated leave balance processing."}
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