

import type { ApplicationStatus, EmiStatus, LoanStatus } from "@/types/loan-hub";

export function num(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function pkr(v: number | string | null | undefined, opts?: { decimals?: boolean }): string {
  const n = num(v);
  const decimals = opts?.decimals ?? false;
  return `PKR ${n.toLocaleString("en-PK", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })}`;
}

export interface BadgeMeta {
  label: string;
  className: string;
  color: string;
}

const LOAN_STATUS: Record<LoanStatus, BadgeMeta> = {
  approved: { label: "Approved", className: "bg-blue-50 text-blue-700 ring-blue-200", color: "#2563eb" },
  disbursed: { label: "Disbursed", className: "bg-indigo-50 text-indigo-700 ring-indigo-200", color: "#4f46e5" },
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700 ring-emerald-200", color: "#059669" },
  on_hold: { label: "On Hold", className: "bg-amber-50 text-amber-700 ring-amber-200", color: "#d97706" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-600 ring-gray-200", color: "#6b7280" },
  closed_via_ff: { label: "Closed (F&F)", className: "bg-gray-100 text-gray-600 ring-gray-200", color: "#6b7280" },
  written_off: { label: "Written Off", className: "bg-red-50 text-red-700 ring-red-200", color: "#dc2626" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500 ring-gray-200", color: "#9ca3af" },
};

const APP_STATUS: Record<ApplicationStatus, BadgeMeta> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600 ring-gray-200", color: "#6b7280" },
  submitted: { label: "Submitted", className: "bg-sky-50 text-sky-700 ring-sky-200", color: "#0284c7" },
  pending_l1: { label: "Pending L1", className: "bg-amber-50 text-amber-700 ring-amber-200", color: "#d97706" },
  pending_l2: { label: "Pending L2", className: "bg-amber-50 text-amber-800 ring-amber-200", color: "#b45309" },
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 ring-emerald-200", color: "#059669" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 ring-red-200", color: "#dc2626" },
  revision_requested: { label: "Revision", className: "bg-orange-50 text-orange-700 ring-orange-200", color: "#ea580c" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500 ring-gray-200", color: "#9ca3af" },
};

const EMI_STATUS: Record<EmiStatus, BadgeMeta> = {
  scheduled: { label: "Scheduled", className: "bg-gray-100 text-gray-600 ring-gray-200", color: "#6b7280" },
  due: { label: "Due", className: "bg-sky-50 text-sky-700 ring-sky-200", color: "#0284c7" },
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700 ring-emerald-200", color: "#059669" },
  partial: { label: "Partial", className: "bg-amber-50 text-amber-700 ring-amber-200", color: "#d97706" },
  missed: { label: "Missed", className: "bg-red-50 text-red-700 ring-red-200", color: "#dc2626" },
  waived: { label: "Waived", className: "bg-gray-100 text-gray-500 ring-gray-200", color: "#9ca3af" },
  adjusted: { label: "Adjusted", className: "bg-violet-50 text-violet-700 ring-violet-200", color: "#7c3aed" },
};

const FALLBACK: BadgeMeta = { label: "—", className: "bg-gray-100 text-gray-500 ring-gray-200", color: "#9ca3af" };

export function loanStatusMeta(s: string): BadgeMeta {
  return LOAN_STATUS[s as LoanStatus] ?? FALLBACK;
}
export function applicationStatusMeta(s: string): BadgeMeta {
  return APP_STATUS[s as ApplicationStatus] ?? FALLBACK;
}
export function emiStatusMeta(s: string): BadgeMeta {
  return EMI_STATUS[s as EmiStatus] ?? FALLBACK;
}

export const INTEREST_TYPE_LABELS: Record<string, string> = {
  interest_free: "Interest-free",
  fixed_flat: "Fixed flat",
  reducing_balance: "Reducing balance",
};

/** Donut palette for the portfolio-by-type chart (brand-aligned). */
export const CHART_COLORS = ["#322E53", "#EEC293", "#F3AB9D", "#6366f1", "#059669", "#d97706", "#0ea5e9", "#a855f7"];
