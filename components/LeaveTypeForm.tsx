"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Save,
  Database,
  Clock,
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type LeaveCategory = "Paid" | "Unpaid";
type LeaveUnit = "Days" | "Half-days" | "Hours";
type LeaveAccrual = "Monthly" | "Annual" | "On Join" | "None";
type LeaveStatus = "Active" | "Inactive";

export interface LeaveTypeConfig {
  code: string;
  name: string;
  category: LeaveCategory;
  unit: LeaveUnit;
  quota: string;
  accrual: LeaveAccrual;
  eligible: number;
  status: LeaveStatus;
  description: string;
}

interface LeaveTypeFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: LeaveTypeConfig | null;
  onSave?: (data: LeaveTypeConfig) => void;
}

const DEFAULT_FORM: LeaveTypeConfig = {
  code: "",
  name: "",
  category: "Paid",
  unit: "Days",
  quota: "",
  accrual: "Monthly",
  eligible: 0,
  status: "Active",
  description: "",
};

function Field({
  label,
  required,
  children,
  hint,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-brand-600">{hint}</p>
      ) : null}
    </div>
  );
}

export function LeaveTypeForm({
  isOpen,
  onClose,
  initialData,
  onSave,
}: LeaveTypeFormProps) {
  const isEdit = !!initialData;

  const [form, setForm] = useState<LeaveTypeConfig>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setForm(initialData);
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
  }, [isOpen, initialData]);

  const summary = useMemo(() => {
    const quotaText = form.quota || "Not defined";
    const eligibility = form.eligible > 0 ? `${form.eligible} employees` : "No mapping";
    return { quotaText, eligibility };
  }, [form]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.code.trim()) nextErrors.code = "Code is required.";
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.quota.trim()) nextErrors.quota = "Quota is required.";
    if (form.eligible < 0) nextErrors.eligible = "Eligible count cannot be negative.";
    if (!form.description.trim()) nextErrors.description = "Description is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    if (onSave) {
      onSave({
        ...form,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        quota: form.quota.trim(),
        description: form.description.trim(),
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="border-b border-gray-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-800 text-white">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-brand-900">
                  {isEdit ? "Edit Leave Type" : "Create Leave Type"}
                </h3>
                <p className="mt-1 text-sm text-brand-700">
                  Configure entitlement, accrual, eligibility, and usage behavior.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 p-2 text-brand-700 transition hover:bg-brand-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Basic Information
                </h4>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field
                    label="Leave Code"
                    required
                    hint="Use uppercase short code like ANNUAL, SICK, COMPOFF."
                    error={errors.code}
                  >
                    <input
                      value={form.code}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                      }
                      placeholder="ANNUAL"
                      className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                    />
                  </Field>

                  <Field label="Leave Name" required error={errors.name}>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Annual Leave"
                      className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                    />
                  </Field>

                  <Field label="Category">
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          category: e.target.value as LeaveCategory,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </Field>

                  <Field label="Unit">
                    <select
                      value={form.unit}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          unit: e.target.value as LeaveUnit,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                    >
                      <option value="Days">Days</option>
                      <option value="Half-days">Half-days</option>
                      <option value="Hours">Hours</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Policy Rules
                </h4>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field
                    label="Quota / Entitlement"
                    required
                    hint="Example: 14 days/year, 10 days/event, Unlimited"
                    error={errors.quota}
                  >
                    <input
                      value={form.quota}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, quota: e.target.value }))
                      }
                      placeholder="14 days/year"
                      className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                    />
                  </Field>

                  <Field label="Accrual Policy">
                    <select
                      value={form.accrual}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          accrual: e.target.value as LeaveAccrual,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Annual">Annual</option>
                      <option value="On Join">On Join</option>
                      <option value="None">None</option>
                    </select>
                  </Field>

                  <Field
                    label="Eligible Employees"
                    hint="Total employees currently mapped to this leave type."
                    error={errors.eligible}
                  >
                    <input
                      type="number"
                      min={0}
                      value={form.eligible}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          eligible: Number(e.target.value),
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                    />
                  </Field>

                  <Field label="Status">
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          status: e.target.value as LeaveStatus,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Description
                </h4>

                <div className="mt-5">
                  <Field
                    label="Policy Description"
                    required
                    hint="Add a clear explanation of when and why this leave type is used."
                    error={errors.description}
                  >
                    <textarea
                      rows={5}
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Describe this leave policy..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Live Summary
                </h4>

                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-brand-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Leave Type
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {form.name || "Untitled Leave Type"}
                    </p>
                    <p className="mt-1 text-[11px] text-brand-700">
                      Code: {form.code || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-brand-800">
                      <Clock className="h-4 w-4" />
                      <p className="text-sm font-medium">
                        {form.accrual} accrual • {summary.quotaText}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-brand-800">
                      <ShieldCheck className="h-4 w-4" />
                      <p className="text-sm font-medium">
                        Eligibility: {summary.eligibility}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`rounded-xl border p-4 ${
                      form.status === "Active"
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 ${
                        form.status === "Active" ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {form.status === "Active" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      <p className="text-sm font-medium">{form.status} policy</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                      Reminder
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-700">
                      Changes to leave types may affect employee balances, accrual rules,
                      and eligibility assignments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
            >
              <Save className="h-4 w-4" />
              Save Leave Type
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}