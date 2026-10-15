"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Search,
  Sliders,
  Database,
  Info,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Upload,
  Clock,
  Save,
  User,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
} from "lucide-react";

interface BalanceAdjustmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (payload: {
    employeeId: string;
    employeeName: string;
    avatar: string;
    leaveType: string;
    adjType: "Credit" | "Debit";
    amount: number;
    effectiveDate: string;
    category: string;
    description: string;
    attachmentName?: string;
  }) => void;
}

type EmployeeRecord = {
  id: string;
  name: string;
  avatar: string;
  dept: string;
  balances: Record<string, number>;
};

const MOCK_EMPLOYEES: EmployeeRecord[] = [
  {
    id: "EMP-101",
    name: "Ahmed Khan",
    avatar: "AK",
    dept: "Engineering",
    balances: { "Annual Leave": 10, "Casual Leave": 5, "Sick Leave": 8, "Comp-Off": 2 },
  },
  {
    id: "EMP-102",
    name: "Sara Miller",
    avatar: "SM",
    dept: "Product",
    balances: { "Annual Leave": 12, "Casual Leave": 3, "Sick Leave": 10, "Comp-Off": 1 },
  },
  {
    id: "EMP-103",
    name: "Tom Chen",
    avatar: "TC",
    dept: "Engineering",
    balances: { "Annual Leave": 4, "Casual Leave": 2, "Sick Leave": 1, "Comp-Off": 0 },
  },
];

const LEAVE_TYPES = ["Annual Leave", "Casual Leave", "Sick Leave", "Comp-Off"] as const;

const CATEGORY_OPTIONS = [
  "Correction",
  "Joining Bonus",
  "Policy Change",
  "Exception/Special Grant",
  "Year-End Adjustment",
  "Other",
] as const;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function BalanceAdjustmentForm({
  isOpen,
  onClose,
  onSave,
}: BalanceAdjustmentFormProps) {
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<EmployeeRecord | null>(null);

  const [formData, setFormData] = useState({
    leaveType: "Annual Leave",
    adjType: "Credit" as "Credit" | "Debit",
    amount: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    category: "",
    description: "",
    attachmentName: "",
  });

  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    setEmployeeQuery("");
    setSelectedEmp(null);
    setFormData({
      leaveType: "Annual Leave",
      adjType: "Credit",
      amount: "",
      effectiveDate: new Date().toISOString().split("T")[0],
      category: "",
      description: "",
      attachmentName: "",
    });
    setErrors({});
    setIsSubmitting(false);
    setShowEmployeeDropdown(false);
  }, [isOpen]);

  const filteredEmployees = useMemo(() => {
    const q = employeeQuery.trim().toLowerCase();
    if (!q) return MOCK_EMPLOYEES;

    return MOCK_EMPLOYEES.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.id.toLowerCase().includes(q) ||
        emp.dept.toLowerCase().includes(q)
    );
  }, [employeeQuery]);

  const numericAmount = Number(formData.amount || 0);
  const currentBalance = selectedEmp ? selectedEmp.balances[formData.leaveType] || 0 : 0;

  const newBalance =
    formData.adjType === "Credit"
      ? currentBalance + numericAmount
      : Math.max(0, currentBalance - numericAmount);

  const exceedsCap = formData.leaveType === "Annual Leave" && newBalance > 14;
  const requiresApproval = numericAmount > 5;
  const debitExceedsBalance =
    formData.adjType === "Debit" && numericAmount > currentBalance;

  const canSubmit =
    !!selectedEmp &&
    numericAmount > 0 &&
    !!formData.category &&
    formData.description.trim().length >= 20 &&
    !debitExceedsBalance;

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!selectedEmp) nextErrors.employee = "Please select an employee.";
    if (!formData.leaveType) nextErrors.leaveType = "Leave type is required.";
    if (!formData.effectiveDate) nextErrors.effectiveDate = "Effective date is required.";
    if (!numericAmount || numericAmount <= 0) nextErrors.amount = "Enter a valid adjustment amount.";
    if (!formData.category) nextErrors.category = "Reason category is required.";
    if (formData.description.trim().length < 20) {
      nextErrors.description = "Description must be at least 20 characters.";
    }
    if (debitExceedsBalance) {
      nextErrors.amount = "Debit amount cannot exceed current balance.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    await new Promise((r) => setTimeout(r, 800));

    onSave?.({
      employeeId: selectedEmp!.id,
      employeeName: selectedEmp!.name,
      avatar: selectedEmp!.avatar,
      leaveType: formData.leaveType,
      adjType: formData.adjType,
      amount: numericAmount,
      effectiveDate: formData.effectiveDate,
      category: formData.category,
      description: formData.description.trim(),
      attachmentName: formData.attachmentName || undefined,
    });

    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative z-[201] flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <Sliders className="h-5 w-5 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-brand-900">
                  New Balance Adjustment
                </h2>
                <p className="mt-0.5 text-sm text-brand-700">
                  Manually override employee leave entitlements with full audit visibility.
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main form */}
            <div className="space-y-6 lg:col-span-2">
              {/* Employee selection */}
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-brand-700" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Employee Selection
                    </h3>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Select Employee <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                      <input
                        type="text"
                        value={employeeQuery}
                        onChange={(e) => {
                          setEmployeeQuery(e.target.value);
                          setShowEmployeeDropdown(true);
                        }}
                        onFocus={() => setShowEmployeeDropdown(true)}
                        placeholder="Search employee name, ID, or department..."
                        className={cn(
                          "w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition",
                          errors.employee
                            ? "border-red-300 focus:border-red-400"
                            : "border-gray-200 focus:border-brand-800"
                        )}
                      />

                      {showEmployeeDropdown && (
                        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                          {filteredEmployees.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-brand-700">
                              No employees found.
                            </div>
                          ) : (
                            filteredEmployees.map((emp) => (
                              <button
                                key={emp.id}
                                type="button"
                                onClick={() => {
                                  setSelectedEmp(emp);
                                  setEmployeeQuery(`${emp.name} (${emp.id})`);
                                  setShowEmployeeDropdown(false);
                                  setErrors((prev) => ({ ...prev, employee: "" }));
                                }}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-brand-100"
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-xs font-bold text-white">
                                  {emp.avatar}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-brand-900">
                                    {emp.name}
                                  </p>
                                  <p className="text-[11px] text-brand-700">
                                    {emp.id} · {emp.dept}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {errors.employee && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.employee}
                      </p>
                    )}
                  </div>

                  {selectedEmp && (
                    <div className="rounded-lg border border-gray-200 bg-brand-100 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-800 text-sm font-bold text-white">
                          {selectedEmp.avatar}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-brand-900">
                            {selectedEmp.name}
                          </p>
                          <p className="text-[11px] text-brand-700">
                            {selectedEmp.id} · {selectedEmp.dept}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Adjustment details */}
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand-700" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Adjustment Details
                    </h3>
                  </div>
                </div>

                <div className="grid gap-5 p-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Leave Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.leaveType}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, leaveType: e.target.value }))
                      }
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition",
                        errors.leaveType
                          ? "border-red-300 focus:border-red-400"
                          : "border-gray-200 focus:border-brand-800"
                      )}
                    >
                      {LEAVE_TYPES.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Effective Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.effectiveDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          effectiveDate: e.target.value,
                        }))
                      }
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition",
                        errors.effectiveDate
                          ? "border-red-300 focus:border-red-400"
                          : "border-gray-200 focus:border-brand-800"
                      )}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-900">
                      Adjustment Type <span className="text-red-500">*</span>
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, adjType: "Credit" }))
                        }
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                          formData.adjType === "Credit"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 bg-white text-brand-700 hover:bg-brand-100"
                        )}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                        Credit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, adjType: "Debit" }))
                        }
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                          formData.adjType === "Debit"
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-200 bg-white text-brand-700 hover:bg-brand-100"
                        )}
                      >
                        <ArrowDownRight className="h-4 w-4" />
                        Debit
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        className={cn(
                          "w-full rounded-lg border bg-white px-3 py-2.5 pr-14 text-sm text-brand-900 outline-none transition",
                          errors.amount
                            ? "border-red-300 focus:border-red-400"
                            : "border-gray-200 focus:border-brand-800"
                        )}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-brand-700">
                        Days
                      </span>
                    </div>
                    {errors.amount && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Reason Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, category: e.target.value }))
                      }
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition",
                        errors.category
                          ? "border-red-300 focus:border-red-400"
                          : "border-gray-200 focus:border-brand-800"
                      )}
                    >
                      <option value="">Select category...</option>
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Description / Justification <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Provide detailed justification (minimum 20 characters)..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition resize-none",
                        errors.description
                          ? "border-red-300 focus:border-red-400"
                          : "border-gray-200 focus:border-brand-800"
                      )}
                    />
                    {errors.description && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Attachment (Optional)
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-200 bg-white px-4 py-4 transition hover:bg-brand-100">
                      <Upload className="h-4 w-4 text-brand-700" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-brand-900">
                          {formData.attachmentName || "Upload supporting document"}
                        </p>
                        <p className="text-[11px] text-brand-700">
                          Click to attach proof or supporting file
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            attachmentName: e.target.files?.[0]?.name || "",
                          }))
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Impact preview */}
              {selectedEmp && (
                <div className="rounded-xl border border-gray-200 bg-brand-900 p-5 text-white">
                  <div className="mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4 text-white" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80">
                      Balance Preview
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-white/80">
                      <span>Current Balance</span>
                      <span className="font-semibold">{currentBalance} days</span>
                    </div>

                    <div
                      className={cn(
                        "flex items-center justify-between text-sm",
                        formData.adjType === "Credit"
                          ? "text-emerald-300"
                          : "text-red-300"
                      )}
                    >
                      <span>Adjustment</span>
                      <span className="font-semibold">
                        {formData.adjType === "Credit" ? "+" : "-"}
                        {numericAmount || 0} days
                      </span>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="flex items-center justify-between text-base font-semibold text-white">
                      <span>New Balance</span>
                      <span>{newBalance} days</span>
                    </div>
                  </div>
                </div>
              )}

              {exceedsCap && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        Threshold Alert
                      </p>
                      <p className="mt-1 text-sm leading-6 text-amber-800/90">
                        New balance exceeds the standard annual cap of 14 days.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval info */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  {requiresApproval ? (
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Approval Routing
                  </h3>
                </div>

                <p className="text-sm font-semibold text-brand-900">
                  {requiresApproval ? "Requires Authorization" : "Immediate Application"}
                </p>
                <p className="mt-1 text-sm leading-6 text-brand-700">
                  {requiresApproval
                    ? "Adjustments above 5 days trigger HR Manager review."
                    : "Small adjustments can be auto-approved for HR Admins."}
                </p>

                {requiresApproval && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-brand-100 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-800 text-[10px] font-bold text-white">
                        HRM
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-900">
                          HR Manager Route
                        </p>
                        <p className="text-[11px] text-brand-700">
                          Decision SLA: 24 hours
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 text-amber-700" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Audit Note
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-800/90">
                      Every manual adjustment creates a traceable balance ledger entry and can be reviewed during payroll audit cycles.
                    </p>
                  </div>
                </div>
              </div>

              {debitExceedsBalance && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">
                        Invalid Debit Amount
                      </p>
                      <p className="mt-1 text-sm leading-6 text-red-600">
                        Debit adjustment cannot exceed the employee’s current leave balance.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-brand-700">
              This adjustment will be tracked in audit logs and balance ledger history.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                Cancel
              </button>

              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {requiresApproval ? "Submit for Approval" : "Post Adjustment Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}