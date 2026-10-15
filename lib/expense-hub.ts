import type { ClaimStatus } from "@/types/expense-hub";

export function pkr(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(
    Number.isFinite(n as number) ? (n as number) : 0,
  );
}

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  finance_verified: "Finance verified",
  reimbursement_scheduled: "Scheduled",
  reimbursed: "Reimbursed",
  revision_requested: "Revision requested",
  rejected: "Rejected",
  cancelled: "Cancelled",
  on_hold: "On hold",
};


export function claimStatusTone(status: ClaimStatus): string {
  switch (status) {
    case "reimbursed":
      return "bg-green-50 text-green-700 ring-green-200";
    case "approved":
    case "finance_verified":
    case "reimbursement_scheduled":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "under_review":
    case "submitted":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "rejected":
    case "cancelled":
      return "bg-red-50 text-red-700 ring-red-200";
    case "revision_requested":
    case "on_hold":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    default:
      return "bg-gray-100 text-gray-600 ring-gray-200";
  }
}
