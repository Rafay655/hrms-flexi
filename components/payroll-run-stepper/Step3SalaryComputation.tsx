// components/payroll-run-stepper/Step3Validation.tsx
"use client";

import { showApiError } from "@/lib/error-toast";
import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import {
  Loader2,
  ShieldAlert,
  AlertTriangle,
  Info,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { StepHandle } from "@/types/stepper";

/* ----------------------------------------------------------------------- */
/* Types                                                                    */
/* ----------------------------------------------------------------------- */

interface ValidationItem {
  rule: string;
  severity: "error" | "warning" | "info";
  message: string;
  context: Record<string, any> | any[] | null;
}

interface ValidationSummary {
  total_active_employees: number;
  employees_missing_salary: number;
  employees_missing_attendance: number;
  errors_count: number;
  warnings_count: number;
}

interface ValidationResponse {
  period_id: string;
  passed: boolean;
  errors: ValidationItem[];
  warnings: ValidationItem[];
  info: ValidationItem[];
  summary: ValidationSummary;
}

/* ----------------------------------------------------------------------- */
/* Props                                                                    */
/* ----------------------------------------------------------------------- */

interface Step3Props {
  workflowUuid?: string;
}

/* ----------------------------------------------------------------------- */
/* Small presentational helpers                                             */
/* ----------------------------------------------------------------------- */

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "danger" | "warning";
}) {
  const valueTone =
    tone === "danger"
      ? "text-red-600"
      : tone === "warning"
      ? "text-amber-600"
      : "text-gray-900";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${valueTone}`}>{value}</p>
    </div>
  );
}

const SEVERITY_CONFIG = {
  error: {
    icon: XCircle,
    heading: "Blocking Errors",
    headingClass: "text-red-700",
    cardClass: "border-red-200 bg-red-50",
    iconClass: "text-red-500",
    titleClass: "text-red-800",
    ruleClass: "text-red-600",
    chipClass: "border-red-200 bg-white/70 text-red-700",
  },
  warning: {
    icon: AlertTriangle,
    heading: "Warnings",
    headingClass: "text-amber-700",
    cardClass: "border-amber-200 bg-amber-50",
    iconClass: "text-amber-500",
    titleClass: "text-amber-800",
    ruleClass: "text-amber-600",
    chipClass: "border-amber-200 bg-white/70 text-amber-700",
  },
  info: {
    icon: Info,
    heading: "Information",
    headingClass: "text-blue-700",
    cardClass: "border-blue-200 bg-blue-50",
    iconClass: "text-blue-500",
    titleClass: "text-blue-800",
    ruleClass: "text-blue-600",
    chipClass: "border-blue-200 bg-white/70 text-blue-700",
  },
} as const;

interface ContextEmployee {
  employee_id: string;
  employee_code: string;
  employee_name: string;
}

/** Safely extracts `employees` from context, whatever shape context is. */
function extractEmployees(context: ValidationItem["context"]): ContextEmployee[] {
  if (!context || Array.isArray(context)) return [];
  return Array.isArray(context.employees) ? context.employees : [];
}

/**
 * Shorten messages that already list all employees inline,
 * replacing the list with a count and letting the chip list show details.
 */
function displayMessage(item: ValidationItem, employees: ContextEmployee[]): string {
  if (employees.length === 0) return item.message;
  const colonIdx = item.message.indexOf(":");
  if (colonIdx === -1) return item.message;
  const tail = item.message.slice(colonIdx + 1);
  const namesAreInline = employees.some((e) => tail.includes(e.employee_code));
  if (!namesAreInline) return item.message;
  const count = employees.length;
  return `${item.message.slice(0, colonIdx + 1)} ${count} employee${count > 1 ? "s" : ""} listed below.`;
}

function ContextDetails({
  context,
  chipClass,
}: {
  context: ValidationItem["context"];
  chipClass: string;
}) {
  if (!context || Array.isArray(context)) return null;

  const employees = extractEmployees(context);
  const otherEntries = Object.entries(context).filter(([key]) => key !== "employees");

  if (employees.length === 0 && otherEntries.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {employees.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {employees.map((emp) => (
            <span
              key={emp.employee_id}
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${chipClass}`}
            >
              {emp.employee_name}
              <span className="ml-1 opacity-70">({emp.employee_code})</span>
            </span>
          ))}
        </div>
      )}
      {otherEntries.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] opacity-80">
          {otherEntries.map(([key, value]) => (
            <span key={key}>
              <span className="font-semibold capitalize">{key.replace(/_/g, " ")}:</span>{" "}
              {String(value)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ValidationGroup({
  severity,
  items,
}: {
  severity: keyof typeof SEVERITY_CONFIG;
  items: ValidationItem[];
}) {
  if (items.length === 0) return null;
  const cfg = SEVERITY_CONFIG[severity];
  const HeadingIcon = cfg.icon;

  return (
    <div className="space-y-3">
      <h4 className={`flex items-center gap-2 text-sm font-semibold ${cfg.headingClass}`}>
        <HeadingIcon className="h-4 w-4" />
        {cfg.heading}
      </h4>
      <div className="grid gap-2">
        {items.map((item, idx) => {
          const employees = extractEmployees(item.context);
          return (
            <div key={idx} className={`rounded-lg border p-3 ${cfg.cardClass}`}>
              <div className="flex items-start gap-2.5">
                <HeadingIcon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.iconClass}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${cfg.titleClass}`}>
                    {displayMessage(item, employees)}
                  </p>
                  {item.rule && (
                    <p className={`mt-0.5 text-xs ${cfg.ruleClass}`}>Rule: {item.rule}</p>
                  )}
                  <ContextDetails context={item.context} chipClass={cfg.chipClass} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Step Component                                                           */
/* ----------------------------------------------------------------------- */

const Step3Validation = forwardRef<StepHandle, Step3Props>(
  function Step3Validation({ workflowUuid }, ref) {
    const [validationData, setValidationData] = useState<ValidationResponse | null>(null);

    // ---------- Validation mutation (POST) ----------
    const validationMutation = useMutation({
      mutationFn: async () => {
        const { data } = await api.post(
          `/pay-edge/payroll-workflows/${workflowUuid}/validate`
        );
        return data.data as ValidationResponse;
      },
      onSuccess: (data) => {
        setValidationData(data);
        if (data.passed) {
          toast.success("Validation passed – no blocking errors.");
        } else {
          toast.error(`Validation completed with ${data.summary.errors_count} error(s).`);
        }
      },
      onError: (error: any) => {
        showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Validation request failed." });
      },
    });

    // Run validation automatically when workflowUuid becomes available
    useEffect(() => {
      if (workflowUuid) {
        validationMutation.mutate();
      }
    }, [workflowUuid]);

    // ---------- Stepper hook (blocks Next if errors exist) ----------
    useImperativeHandle(ref, () => ({
      beforeNext: async () => {
        if (!validationData) {
          toast.error("Please run validation first.");
          throw new Error("Validation not run");
        }
        if (!validationData.passed) {
          toast.error("Please resolve all blocking errors before proceeding.");
          throw new Error("Validation errors exist");
        }
        return Promise.resolve();
      },
    }), [validationData]);

    // ---------- Render ----------
    if (!workflowUuid) {
      return (
        <div className="rounded-lg border border-gray-200 bg-gray-50/60 py-8 text-center text-sm text-gray-500">
          No workflow selected. Please complete previous steps first.
        </div>
      );
    }

    const isInitialLoad = validationMutation.isPending && !validationData;

    return (
      <div className="space-y-8">
        <Section
          title="Payroll Validation"
          description="Runs a series of checks against this period before computation."
          action={
            <button
              type="button"
              onClick={() => validationMutation.mutate()}
              disabled={validationMutation.isPending}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-[#1E1B4B] px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {validationMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {validationMutation.isPending ? "Validating…" : "Re-run"}
            </button>
          }
        >
          {/* Loading skeleton on first run */}
          {isInitialLoad && (
            <div className="space-y-3">
              <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
              </div>
            </div>
          )}

          {/* Overall status */}
          {validationData && (
            <div
              className={`flex items-center gap-3 rounded-lg border p-4 ${
                validationData.passed
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              {validationData.passed ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              ) : (
                <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" />
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {validationData.passed ? "All checks passed" : "Validation failed"}
                </p>
                <p className="text-sm text-gray-600">
                  {validationData.summary.errors_count} error(s),{" "}
                  {validationData.summary.warnings_count} warning(s)
                </p>
              </div>
            </div>
          )}
        </Section>

        {validationData && (
          <>
            {/* Summary tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatTile
                label="Active Employees"
                value={validationData.summary.total_active_employees}
              />
              <StatTile
                label="Missing Salary"
                value={validationData.summary.employees_missing_salary}
                tone="danger"
              />
              <StatTile
                label="Missing Attendance"
                value={validationData.summary.employees_missing_attendance}
                tone="warning"
              />
            </div>

            <ValidationGroup severity="error" items={validationData.errors} />
            <ValidationGroup severity="warning" items={validationData.warnings} />
            <ValidationGroup severity="info" items={validationData.info} />

            {/* Message when errors prevent continuation */}
            {!validationData.passed && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    You must resolve all blocking errors before continuing.
                  </p>
                  <p className="text-sm text-amber-700">
                    Fix the issues in the source system(s), then click “Re-run” to revalidate.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

export default Step3Validation;