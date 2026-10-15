import React, { useEffect, useMemo, useState } from "react";
import { X, Save, Landmark, Loader2 } from "lucide-react";

type LoanType = "Salary Advance" | "Personal" | "Emergency" | "Car" | "House";
type LoanStatus = "Active" | "Pending" | "On Hold" | "Closed" | "Written Off";

export interface LoanFormValues {
  empId: string;
  empName: string;
  type: LoanType;
  principal: number;
  outstanding: number;
  emi: number;
  remainingInst: number;
  status: LoanStatus;
}

interface LoanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: LoanFormValues) => void;
  initialData?: Partial<LoanFormValues>;
}

const LOAN_TYPES: LoanType[] = [
  "Salary Advance",
  "Personal",
  "Emergency",
  "Car",
  "House",
];

const LOAN_STATUSES: LoanStatus[] = [
  "Pending",
  "Active",
  "On Hold",
  "Closed",
  "Written Off",
];

const defaultValues: LoanFormValues = {
  empId: "",
  empName: "",
  type: "Salary Advance",
  principal: 0,
  outstanding: 0,
  emi: 0,
  remainingInst: 12,
  status: "Pending",
};

export const LoanForm: React.FC<LoanFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const mergedDefaults = useMemo(
    () => ({ ...defaultValues, ...initialData }),
    [initialData]
  );

  const [form, setForm] = useState<LoanFormValues>(mergedDefaults);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoanFormValues, string>>
  >({});

  useEffect(() => {
    if (isOpen) {
      setForm(mergedDefaults);
      setErrors({});
    }
  }, [isOpen, mergedDefaults]);

  if (!isOpen) return null;

  const updateField = <K extends keyof LoanFormValues>(
    key: K,
    value: LoanFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const autoCalculate = () => {
    const principal = Number(form.principal || 0);
    const remainingInst = Math.max(Number(form.remainingInst || 0), 1);
    const emi = Math.round(principal / remainingInst);
    const outstanding = form.status === "Closed" ? 0 : emi * remainingInst;

    setForm((prev) => ({
      ...prev,
      emi,
      outstanding,
    }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof LoanFormValues, string>> = {};

    if (!form.empId.trim()) nextErrors.empId = "Employee ID is required";
    if (!form.empName.trim()) nextErrors.empName = "Employee name is required";
    if (Number(form.principal) <= 0) nextErrors.principal = "Principal must be greater than 0";
    if (Number(form.remainingInst) <= 0)
      nextErrors.remainingInst = "Remaining installments must be greater than 0";
    if (Number(form.emi) < 0) nextErrors.emi = "EMI cannot be negative";
    if (Number(form.outstanding) < 0)
      nextErrors.outstanding = "Outstanding cannot be negative";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const normalizedStatus = form.status;
    const normalizedOutstanding =
      normalizedStatus === "Closed" ? 0 : Number(form.outstanding || 0);

    const payload: LoanFormValues = {
      ...form,
      empId: form.empId.trim(),
      empName: form.empName.trim(),
      principal: Number(form.principal || 0),
      outstanding: normalizedOutstanding,
      emi: Number(form.emi || 0),
      remainingInst: Number(form.remainingInst || 0),
      status: normalizedStatus,
    };

    setForm(payload);

    const nextErrors: Partial<Record<keyof LoanFormValues, string>> = {};
    if (!payload.empId) nextErrors.empId = "Employee ID is required";
    if (!payload.empName) nextErrors.empName = "Employee name is required";
    if (payload.principal <= 0) nextErrors.principal = "Principal must be greater than 0";
    if (payload.remainingInst <= 0)
      nextErrors.remainingInst = "Remaining installments must be greater than 0";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      onSave(payload);
      setIsSubmitting(false);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/35 px-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
              <Landmark className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-brand-900">New Loan Application</h3>
              <p className="mt-0.5 text-sm text-brand-700">
                Create a new employee loan or salary advance request
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

        {/* Body */}
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
                Loan Type
              </label>
              <select
                value={form.type}
                onChange={(e) => updateField("type", e.target.value as LoanType)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              >
                {LOAN_TYPES.map((type) => (
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
                onChange={(e) => updateField("status", e.target.value as LoanStatus)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              >
                {LOAN_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Principal Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.principal}
                onChange={(e) =>
                  updateField("principal", Number(e.target.value || 0))
                }
                placeholder="e.g. 150000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.principal && (
                <p className="mt-1 text-xs text-red-600">{errors.principal}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Remaining Installments <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.remainingInst}
                onChange={(e) =>
                  updateField("remainingInst", Number(e.target.value || 0))
                }
                placeholder="e.g. 12"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.remainingInst && (
                <p className="mt-1 text-xs text-red-600">{errors.remainingInst}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                EMI Amount
              </label>
              <input
                type="number"
                min={0}
                value={form.emi}
                onChange={(e) => updateField("emi", Number(e.target.value || 0))}
                placeholder="e.g. 12500"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.emi && (
                <p className="mt-1 text-xs text-red-600">{errors.emi}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Outstanding Balance
              </label>
              <input
                type="number"
                min={0}
                value={form.outstanding}
                onChange={(e) =>
                  updateField("outstanding", Number(e.target.value || 0))
                }
                placeholder="e.g. 150000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.outstanding && (
                <p className="mt-1 text-xs text-red-600">{errors.outstanding}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="rounded-lg border border-gray-200 bg-brand-100/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-900">
                      Quick Auto Calculation
                    </p>
                    <p className="mt-1 text-sm text-brand-700">
                      Fill principal and installments, then auto-calculate EMI and outstanding.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={autoCalculate}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                  >
                    Auto Calculate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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
                Save Loan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};