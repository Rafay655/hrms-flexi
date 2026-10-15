import type { ReactNode } from "react";
import { Building2, LoaderCircle } from "lucide-react";
import type { Insight360Readiness } from "@/types/insight360";

const SOURCE_AREA_LABELS: Record<string, string> = {
  people_hub: "People",
  flexi_hq: "Organisation",
  flexi_meta: "Company reference data",
  time_sync: "Attendance and time",
  leave_ease: "Leave",
  pay_edge: "Payroll",
  catalogue_wave: "Trusted report catalogue",
};

export function sourceAreaLabel(key: string, fallback?: string) {
  return SOURCE_AREA_LABELS[key] ?? fallback ?? key.replaceAll("_", " ");
}

export function reportDisplayName(name: string) {
  return name.replace(/\s*\(live\)\s*$/i, "").trim();
}

export function refreshCadenceLabel(value: string) {
  const labels: Record<string, string> = {
    live: "As changes happen",
    on_demand: "When you run it",
    cached_15m: "Every 15 minutes",
    nightly: "Each night",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

const CATEGORY_LABELS: Record<string, string> = {
  attendance: "Attendance & time",
  "attendance & leave": "Attendance & leave",
  compensation: "Pay & compensation",
  employee: "People",
  "employee reports": "People",
  employees: "People",
  graphs: "Trends & visual insights",
  "hr reports": "Workforce",
  leave: "Leave",
  organisation: "Organisation",
  organization: "Organisation",
  payroll: "Pay & compensation",
  "payroll reports": "Payroll",
  recruitment: "Recruitment",
  "timesheet reports": "Timesheets",
  workforce: "Workforce planning",
};

export function categoryDisplayName(value: string) {
  const normalized = value.trim().toLowerCase().replaceAll("_", " ");
  return CATEGORY_LABELS[normalized]
    ?? normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function reportDescription(name: string, description?: string | null) {
  const cleanName = reportDisplayName(name).toLowerCase();
  const tailored = [
    [/salary variance/, "Compare current and previous net pay to spot changes that need review."],
    [/payroll summary/, "Review payroll totals by pay period."],
    [/employee payroll/, "Review employee pay and attendance information by pay period."],
    [/payslip/, "Review payslip availability and payment information."],
    [/deduction/, "Review employee payroll deductions by pay period."],
    [/earning/, "Review employee payroll earnings by pay period."],
    [/cost to company|\bctc\b/, "Review total employee cost, including employer contributions."],
    [/attendance/, "Review attendance information by employee and date."],
    [/attrition|retention risk/, "Review current employee retention risk indicators for active and probation employees."],
    [/joining.*exit|joiner.*leaver/, "Compare employee joiners and leavers over time."],
    [/division/, "View divisions used in your organisation structure."],
    [/department/, "View departments used in your organisation structure."],
    [/designation/, "View job designations used in your organisation structure."],
    [/employee list/, "View employees you are allowed to access."],
    [/compan(?:y|ies)/, "View company information available to your role."],
  ] as const;
  const match = tailored.find(([pattern]) => pattern.test(cleanName));
  if (match) return match[1];

  const technical = /[_]|\b(joined?|denominator|metadata|non-reversed|non-deleted|record|table|column|query|foreign key)\b/i;
  return description && !technical.test(description)
    ? description
    : `View and filter ${cleanName || "this report"}.`;
}

export function PageHeader({ eyebrow, title, description, action, inverse = false }: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  inverse?: boolean;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className={`text-sm font-semibold ${inverse ? "text-brand-500" : "text-brand-700"}`}>{eyebrow}</p>
        <h1 className={`mt-1.5 text-3xl font-semibold tracking-tight sm:text-4xl ${inverse ? "text-white" : "text-brand-900"}`}>{title}</h1>
        <p className={`mt-2 max-w-2xl text-base leading-7 ${inverse ? "text-brand-100" : "text-gray-600"}`}>{description}</p>
      </div>
      {action}
    </header>
  );
}

/**
 * Read-only indicator of the company these results are scoped to.
 *
 * Deliberately NOT a control. Company scope is global — it travels on the
 * X-Company-ID header set by <CompanySwitcher> in the app header, and no
 * Insight360 endpoint accepts a company parameter. The dropdowns that used to
 * sit here on six pages had a single option and no onChange handler, so they
 * looked interactive and did nothing.
 */
export function ScopeIndicator({ companyName }: { companyName?: string | null }) {
  return (
    <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-brand-100 px-3 text-sm text-brand-800">
      <Building2 aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-700" />
      <span className="text-gray-600">Showing</span>
      <span className="font-semibold text-brand-900">{companyName || "All permitted companies"}</span>
    </span>
  );
}

export function ReadinessBadge({ value }: { value: Insight360Readiness }) {
  const styles: Record<Insight360Readiness, string> = {
    ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
    partial: "border-amber-200 bg-amber-50 text-amber-800",
    blocked: "border-rose-200 bg-rose-50 text-rose-800",
    unavailable: "border-gray-200 bg-gray-100 text-gray-700",
  };
  const labels: Record<Insight360Readiness, string> = {
    ready: "Available",
    partial: "Limited",
    blocked: "Needs attention",
    unavailable: "Unavailable",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles[value]}`}>
      {labels[value]}
    </span>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const style = ["complete", "active", "approved", "passed", "ready", "reconciled", "released", "on_track", "low"].includes(value)
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : ["failed", "expired", "blocked", "rejected", "critical", "high", "variance"].includes(value)
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  const labels: Record<string, string> = {
    active: "Active",
    approved: "Approved",
    blocked: "Needs attention",
    complete: "Ready",
    expired: "Expired",
    failed: "Failed",
    high: "High",
    low: "Low",
    medium: "Medium",
    on_track: "On track",
    passed: "Passed",
    paused: "Paused",
    pending: "In progress",
    pending_sme: "Awaiting approval",
    processing: "Preparing",
    ready: "Available",
    reconciled: "Verified",
    rejected: "Not approved",
    released: "Available",
    replaced: "Replaced",
    running: "Running",
    variance: "Needs review",
    waived: "Accepted exception",
  };

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>{labels[value] ?? value.replaceAll("_", " ")}</span>;
}

export function LoadingPanel({ label = "Loading Insight360" }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 text-sm font-medium text-gray-600" role="status">
        <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-brand-700 motion-reduce:animate-none" />
        {label}
      </div>
    </div>
  );
}

export function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900" role="alert">
      <p className="font-semibold">Insight360 could not load this view.</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}
