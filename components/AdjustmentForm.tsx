import React, { useEffect, useMemo, useState } from "react";
import { X, Save, Wallet, Loader2 } from "lucide-react";

type AdjustmentType =
  | "Bonus"
  | "Penalty"
  | "Reimbursement"
  | "Correction"
  | "Arrears";

type AdjustmentStatus = "Pending" | "Approved" | "Rejected" | "Processed";

export interface AdjustmentFormValues {
  empId: string;
  empName: string;
  type: AdjustmentType;
  amount: number;
  period: string;
  reason: string;
  status: AdjustmentStatus;
  requestedBy: string;
}

interface AdjustmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AdjustmentFormValues) => void;
  initialData?: Partial<AdjustmentFormValues>;
}

const TYPE_OPTIONS: AdjustmentType[] = [
  "Bonus",
  "Penalty",
  "Reimbursement",
  "Correction",
  "Arrears",
];

const STATUS_OPTIONS: AdjustmentStatus[] = [
  "Pending",
  "Approved",
  "Rejected",
  "Processed",
];

const defaultValues: AdjustmentFormValues = {
  empId: "",
  empName: "",
  type: "Bonus",
  amount: 0,
  period: "Jan 2025",
  reason: "",
  status: "Pending",
  requestedBy: "HR Admin",
};

export const AdjustmentForm: React.FC<AdjustmentFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const mergedDefaults = useMemo(
    () => ({ ...defaultValues, ...initialData }),
    [initialData]
  );

  const [form, setForm] = useState<AdjustmentFormValues>(mergedDefaults);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof AdjustmentFormValues, string>>
  >({});

  useEffect(() => {
    if (isOpen) {
      setForm(mergedDefaults);
      setErrors({});
    }
  }, [isOpen, mergedDefaults]);

  if (!isOpen) return null;

  const updateField = <K extends keyof AdjustmentFormValues>(
    key: K,
    value: AdjustmentFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof AdjustmentFormValues, string>> = {};

    if (!form.empId.trim()) nextErrors.empId = "Employee ID is required";
    if (!form.empName.trim()) nextErrors.empName = "Employee name is required";
    if (!form.reason.trim()) nextErrors.reason = "Reason is required";
    if (!form.period.trim()) nextErrors.period = "Period is required";
    if (!form.requestedBy.trim())
      nextErrors.requestedBy = "Requested by is required";
    if (Number(form.amount) === 0)
      nextErrors.amount = "Amount cannot be zero";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!validate()) return;

    let normalizedAmount = Number(form.amount || 0);

    if (form.type === "Penalty" && normalizedAmount > 0) {
      normalizedAmount = -normalizedAmount;
    }

    if (form.type !== "Penalty" && normalizedAmount < 0) {
      normalizedAmount = Math.abs(normalizedAmount);
    }

    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      onSave({
        ...form,
        empId: form.empId.trim(),
        empName: form.empName.trim(),
        period: form.period.trim(),
        reason: form.reason.trim(),
        requestedBy: form.requestedBy.trim(),
        amount: normalizedAmount,
      });
      setIsSubmitting(false);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/35 px-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-brand-900">
                New Adjustment
              </h3>
              <p className="mt-0.5 text-sm text-brand-700">
                Create an earning, deduction, correction, or reimbursement entry
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.empId}
                onChange={(e) => updateField("empId", e.target.value)}
                placeholder="e.g. EMP-1001"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.empId && (
                <p className="mt-1 text-xs text-red-600">{errors.empId}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Employee Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.empName}
                onChange={(e) => updateField("empName", e.target.value)}
                placeholder="e.g. Arsalan Khan"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.empName && (
                <p className="mt-1 text-xs text-red-600">{errors.empName}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Adjustment Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  updateField("type", e.target.value as AdjustmentType)
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              >
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  updateField("status", e.target.value as AdjustmentStatus)
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) =>
                  updateField("amount", Number(e.target.value || 0))
                }
                placeholder="e.g. 5000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
              )}
              <p className="mt-1 text-xs text-brand-700">
                Penalty will be saved as a negative amount automatically.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Payroll Period <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.period}
                onChange={(e) => updateField("period", e.target.value)}
                placeholder="e.g. Jan 2025"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.period && (
                <p className="mt-1 text-xs text-red-600">{errors.period}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Requested By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.requestedBy}
                onChange={(e) => updateField("requestedBy", e.target.value)}
                placeholder="e.g. HR Admin"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.requestedBy && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.requestedBy}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={form.reason}
                onChange={(e) => updateField("reason", e.target.value)}
                placeholder="e.g. Performance achievement for Jan 2025"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.reason && (
                <p className="mt-1 text-xs text-red-600">{errors.reason}</p>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-brand-100/30 p-4">
            <p className="text-sm font-semibold text-brand-900">
              Adjustment rule
            </p>
            <p className="mt-1 text-sm text-brand-700">
              Earnings stay positive, while penalties are saved as negative values
              so payroll totals remain correct.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Adjustment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};