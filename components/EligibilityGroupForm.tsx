"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Save,
  Users,
  ShieldCheck,
  Briefcase,
  MapPin,
  Layers3,
  Info,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

/** ---------------- Types ---------------- */

export type EligibilityGroup = {
  id: string;
  name: string;
  description?: string;
  priority: number;
  criteria: {
    employmentTypes: string[];
    grades: string[];
    gradeRange: { from: string; to: string };
    departments: string[];
    locations: string[];
    gender: "Any" | "Male" | "Female";
    minTenure: number;
    probationStatus: "Include" | "Exclude" | "Only Probation";
  };
  leaveTypes: string[];
  allTypes: boolean;
  createdAt?: string;
  updatedAt?: string;
};

interface EligibilityGroupFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: EligibilityGroup | null;
  onSave: (payload: Omit<EligibilityGroup, "createdAt" | "updatedAt">) => void;
}

/** ---------------- Mock master data ---------------- */

const EMPLOYMENT_TYPES = ["Permanent", "Contract", "Probation", "Intern", "Consultant"];
const GRADES = ["L1", "L2", "L3", "L4", "L5", "L6", "L7"];
const DEPARTMENTS = [
  "Engineering",
  "Product",
  "HR",
  "Finance",
  "Operations",
  "Sales",
  "Marketing",
  "IT",
];
const LOCATIONS = ["HQ", "Lahore", "Karachi", "Islamabad", "Remote", "Regional Office"];
const LEAVE_TYPES = [
  "ANNUAL",
  "CASUAL",
  "SICK",
  "MATERNITY",
  "PATERNITY",
  "UNPAID",
  "COMPOFF",
  "SHORT",
  "BEREAVE",
  "STUDY",
];

const uid = () => `EG-${Math.floor(100000 + Math.random() * 900000)}`;

const EMPTY_FORM: Omit<EligibilityGroup, "createdAt" | "updatedAt"> = {
  id: uid(),
  name: "",
  description: "",
  priority: 1,
  criteria: {
    employmentTypes: [],
    grades: [],
    gradeRange: { from: "L1", to: "L5" },
    departments: [],
    locations: [],
    gender: "Any",
    minTenure: 0,
    probationStatus: "Include",
  },
  leaveTypes: ["ANNUAL", "CASUAL", "SICK"],
  allTypes: false,
};

/** ---------------- Helpers ---------------- */

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

function MultiSelectChips({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "border-brand-800 bg-brand-800 text-white"
                : "border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

/** ---------------- Component ---------------- */

export default function EligibilityGroupForm({
  isOpen,
  onClose,
  initialData,
  onSave,
}: EligibilityGroupFormProps) {
  const isEdit = !!initialData;

  const [form, setForm] = useState<Omit<EligibilityGroup, "createdAt" | "updatedAt">>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setForm({
        id: initialData.id,
        name: initialData.name,
        description: initialData.description || "",
        priority: initialData.priority,
        criteria: {
          employmentTypes: initialData.criteria.employmentTypes || [],
          grades: initialData.criteria.grades || [],
          gradeRange: initialData.criteria.gradeRange || { from: "L1", to: "L5" },
          departments: initialData.criteria.departments || [],
          locations: initialData.criteria.locations || [],
          gender: initialData.criteria.gender || "Any",
          minTenure: initialData.criteria.minTenure ?? 0,
          probationStatus: initialData.criteria.probationStatus || "Include",
        },
        leaveTypes: initialData.leaveTypes || [],
        allTypes: initialData.allTypes || false,
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        id: uid(),
      });
    }

    setErrors({});
  }, [isOpen, initialData]);

  const summary = useMemo(() => {
    return {
      empTypes:
        form.criteria.employmentTypes.length > 0
          ? form.criteria.employmentTypes.length
          : "Any",
      departments:
        form.criteria.departments.length > 0 ? form.criteria.departments.length : "Any",
      locations: form.criteria.locations.length > 0 ? form.criteria.locations.length : "Any",
      leaveTypes: form.allTypes ? "All Types" : `${form.leaveTypes.length} mapped`,
    };
  }, [form]);

  const toggleArrayValue = (
    section: "employmentTypes" | "grades" | "departments" | "locations",
    value: string
  ) => {
    setForm((prev) => {
      const current = prev.criteria[section];
      const exists = current.includes(value);

      return {
        ...prev,
        criteria: {
          ...prev.criteria,
          [section]: exists
            ? current.filter((item) => item !== value)
            : [...current, value],
        },
      };
    });
  };

  const toggleLeaveType = (value: string) => {
    setForm((prev) => {
      const exists = prev.leaveTypes.includes(value);

      return {
        ...prev,
        leaveTypes: exists
          ? prev.leaveTypes.filter((item) => item !== value)
          : [...prev.leaveTypes, value],
      };
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) nextErrors.name = "Group name is required.";
    if (form.priority < 1) nextErrors.priority = "Priority must be at least 1.";

    const fromIndex = GRADES.indexOf(form.criteria.gradeRange.from);
    const toIndex = GRADES.indexOf(form.criteria.gradeRange.to);

    if (fromIndex > toIndex) {
      nextErrors.gradeRange = "Grade range is invalid. 'From' cannot be after 'To'.";
    }

    if (!form.allTypes && form.leaveTypes.length === 0) {
      nextErrors.leaveTypes = "Select at least one leave type or enable all types.";
    }

    if (form.criteria.minTenure < 0) {
      nextErrors.minTenure = "Minimum tenure cannot be negative.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      ...form,
      name: form.name.trim(),
      description: form.description?.trim() || "",
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="border-b border-gray-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-800 text-white">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-brand-900">
                  {isEdit ? "Edit Eligibility Group" : "Create Eligibility Group"}
                </h3>
                <p className="mt-1 text-sm text-brand-700">
                  Define matching rules and assign leave type access for employee groups.
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

        <div className="max-h-[78vh] overflow-y-auto p-6">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Basic Information
                </h4>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Group Name" required error={errors.name}>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="HQ Permanent Staff"
                      className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                    />
                  </Field>

                  <Field
                    label="Priority"
                    required
                    hint="Lower number means higher precedence."
                    error={errors.priority}
                  >
                    <input
                      type="number"
                      min={1}
                      value={form.priority}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          priority: Number(e.target.value),
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                    />
                  </Field>

                  <div className="md:col-span-2">
                    <Field
                      label="Description"
                      hint="Optional internal note to explain the intent of this eligibility group."
                    >
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="For permanent HQ employees across core departments."
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-brand-800" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Eligibility Criteria
                  </h4>
                </div>

                <div className="mt-5 space-y-5">
                  <Field label="Employment Types">
                    <MultiSelectChips
                      options={EMPLOYMENT_TYPES}
                      selected={form.criteria.employmentTypes}
                      onToggle={(value) => toggleArrayValue("employmentTypes", value)}
                    />
                  </Field>

                  <Field label="Specific Grades">
                    <MultiSelectChips
                      options={GRADES}
                      selected={form.criteria.grades}
                      onToggle={(value) => toggleArrayValue("grades", value)}
                    />
                  </Field>

                  <Field
                    label="Grade Range"
                    hint="Used when broad eligibility needs a minimum and maximum level."
                    error={errors.gradeRange}
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <select
                        value={form.criteria.gradeRange.from}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria,
                              gradeRange: {
                                ...prev.criteria.gradeRange,
                                from: e.target.value,
                              },
                            },
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                      >
                        {GRADES.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>

                      <select
                        value={form.criteria.gradeRange.to}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria,
                              gradeRange: {
                                ...prev.criteria.gradeRange,
                                to: e.target.value,
                              },
                            },
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                      >
                        {GRADES.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Field>

                  <Field label="Departments">
                    <MultiSelectChips
                      options={DEPARTMENTS}
                      selected={form.criteria.departments}
                      onToggle={(value) => toggleArrayValue("departments", value)}
                    />
                  </Field>

                  <Field label="Locations">
                    <MultiSelectChips
                      options={LOCATIONS}
                      selected={form.criteria.locations}
                      onToggle={(value) => toggleArrayValue("locations", value)}
                    />
                  </Field>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Gender">
                      <select
                        value={form.criteria.gender}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria,
                              gender: e.target.value as "Any" | "Male" | "Female",
                            },
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                      >
                        <option value="Any">Any</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </Field>

                    <Field label="Minimum Tenure (Months)" error={errors.minTenure}>
                      <input
                        type="number"
                        min={0}
                        value={form.criteria.minTenure}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria,
                              minTenure: Number(e.target.value),
                            },
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                      />
                    </Field>

                    <Field label="Probation Status">
                      <select
                        value={form.criteria.probationStatus}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria,
                              probationStatus: e.target.value as
                                | "Include"
                                | "Exclude"
                                | "Only Probation",
                            },
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                      >
                        <option value="Include">Include</option>
                        <option value="Exclude">Exclude</option>
                        <option value="Only Probation">Only Probation</option>
                      </select>
                    </Field>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-800" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Leave Type Access
                  </h4>
                </div>

                <div className="mt-5 space-y-4">
                  <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-sm text-brand-900">
                    <input
                      type="checkbox"
                      checked={form.allTypes}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, allTypes: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800"
                    />
                    Grant access to all leave types
                  </label>

                  {!form.allTypes ? (
                    <div>
                      <MultiSelectChips
                        options={LEAVE_TYPES}
                        selected={form.leaveTypes}
                        onToggle={toggleLeaveType}
                      />
                      {errors.leaveTypes ? (
                        <p className="mt-2 text-sm text-red-600">{errors.leaveTypes}</p>
                      ) : null}
                    </div>
                  ) : null}
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
                      Group
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {form.name || "Untitled Group"}
                    </p>
                    <p className="mt-1 text-[11px] text-brand-700">
                      Priority: {form.priority}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-brand-800">
                      <Users className="h-4 w-4" />
                      <p className="text-sm font-medium">
                        Employment: {summary.empTypes}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-brand-800">
                      <Layers3 className="h-4 w-4" />
                      <p className="text-sm font-medium">
                        Departments: {summary.departments}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-brand-800">
                      <MapPin className="h-4 w-4" />
                      <p className="text-sm font-medium">
                        Locations: {summary.locations}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-brand-800">
                      <ShieldCheck className="h-4 w-4" />
                      <p className="text-sm font-medium">
                        Leave Access: {summary.leaveTypes}
                      </p>
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
                      Priority conflicts may cause ambiguous matching. Use unique priorities
                      when multiple groups target similar employee segments.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Matching Logic
                    </p>
                    <p className="mt-2 text-sm leading-6 text-brand-700">
                      Use broader ranges plus optional specific filters to keep eligibility
                      maintenance easy and scalable.
                    </p>
                  </div>
                </div>
              </div>

              {errors.gradeRange || errors.leaveTypes ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-red-800">
                        Validation Alert
                      </p>
                      <p className="mt-2 text-sm text-red-700">
                        Review grade range and leave type access before saving.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
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
              Save Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}