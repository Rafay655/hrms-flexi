
import React, { useEffect, useMemo, useState } from "react";
import { X, Save, Layers } from "lucide-react";


type PayrollFrequency = "Monthly" | "Bi-Weekly" | "Weekly";

export interface PayrollGroupFormValues {
  code: string;
  name: string;
  criteria: string;
  employeeCount: number;
  currency: string;
  officer: string;
  status: PayrollStatus;
  frequency: PayrollFrequency;
  lastRun: string;
}

interface PayrollGroupFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PayrollGroupFormValues) => void;
  initialData?: Partial<PayrollGroupFormValues>;
}
 enum PayrollStatus {
  Draft = "Draft",
  Pending = "Pending",
  Approved = "Approved",
  Locked = "Locked",
  Published = "Published",
}
const defaultValues: PayrollGroupFormValues = {
  code: "",
  name: "",
  criteria: "",
  employeeCount: 0,
  currency: "PKR",
  officer: "",
  status: PayrollStatus.Draft,
  frequency: "Monthly",
  lastRun: "Not processed yet",
};

const frequencyOptions: PayrollFrequency[] = ["Monthly", "Bi-Weekly", "Weekly"];
const currencyOptions = ["PKR", "USD", "SAR", "AED"];
const statusOptions = Object.values(PayrollStatus);

export const PayrollGroupForm: React.FC<PayrollGroupFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const mergedDefaults = useMemo(
    () => ({ ...defaultValues, ...initialData }),
    [initialData]
  );

  const [form, setForm] = useState<PayrollGroupFormValues>(mergedDefaults);
  const [errors, setErrors] = useState<Partial<Record<keyof PayrollGroupFormValues, string>>>({});

  useEffect(() => {
    if (isOpen) {
      setForm(mergedDefaults);
      setErrors({});
    }
  }, [isOpen, mergedDefaults]);

  if (!isOpen) return null;

  const updateField = <K extends keyof PayrollGroupFormValues>(
    key: K,
    value: PayrollGroupFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof PayrollGroupFormValues, string>> = {};

    if (!form.code.trim()) nextErrors.code = "Code is required";
    if (!form.name.trim()) nextErrors.name = "Group name is required";
    if (!form.criteria.trim()) nextErrors.criteria = "Criteria is required";
    if (!form.officer.trim()) nextErrors.officer = "Assigned officer is required";
    if (form.employeeCount < 0) nextErrors.employeeCount = "Employee count cannot be negative";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSave({
      ...form,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      criteria: form.criteria.trim(),
      officer: form.officer.trim(),
      currency: form.currency.trim().toUpperCase(),
      lastRun: form.lastRun.trim() || "Not processed yet",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/35 px-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-900">Payroll Group</h3>
              <p className="mt-0.5 text-sm text-brand-700">
                Create a payroll group with rules, officer, cycle, and status
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
                Group Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => updateField("code", e.target.value)}
                placeholder="e.g. CORP-ISL"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-600">{errors.code}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Islamabad Corporate Staff"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Employee Count
              </label>
              <input
                type="number"
                min={0}
                value={form.employeeCount}
                onChange={(e) =>
                  updateField("employeeCount", Number(e.target.value || 0))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.employeeCount && (
                <p className="mt-1 text-xs text-red-600">{errors.employeeCount}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => updateField("currency", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              >
                {currencyOptions.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Assigned Officer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.officer}
                onChange={(e) => updateField("officer", e.target.value)}
                placeholder="e.g. Ahmed Raza"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.officer && (
                <p className="mt-1 text-xs text-red-600">{errors.officer}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Frequency
              </label>
              <select
                value={form.frequency}
                onChange={(e) =>
                  updateField("frequency", e.target.value as PayrollFrequency)
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              >
                {frequencyOptions.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequency}
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
                  updateField("status", e.target.value as PayrollStatus)
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Last Run
              </label>
              <input
                type="text"
                value={form.lastRun}
                onChange={(e) => updateField("lastRun", e.target.value)}
                placeholder="e.g. Dec 31, 2024"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-brand-900">
                Inclusion Criteria <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={form.criteria}
                onChange={(e) => updateField("criteria", e.target.value)}
                placeholder="e.g. Location: ISB AND Type: Permanent"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
              {errors.criteria && (
                <p className="mt-1 text-xs text-red-600">{errors.criteria}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
          >
            <Save className="h-4 w-4" />
            Save Group
          </button>
        </div>
      </div>
    </div>
  );
};