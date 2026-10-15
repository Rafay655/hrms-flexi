"use client";

import { applicationStatusMeta, emiStatusMeta, loanStatusMeta } from "@/lib/loan-hub";

/**
 * LoanStatusBadge — §7.3 colour-coded status chip for a loan, application or EMI.
 */
export function LoanStatusBadge({
  status,
  kind = "loan",
}: {
  status: string;
  kind?: "loan" | "application" | "emi";
}) {
  const meta =
    kind === "application"
      ? applicationStatusMeta(status)
      : kind === "emi"
        ? emiStatusMeta(status)
        : loanStatusMeta(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
