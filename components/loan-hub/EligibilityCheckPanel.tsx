"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { pkr } from "@/lib/loan-hub";
import type { EligibilityResult } from "@/types/loan-hub";

const RULE_LABELS: Record<string, string> = {
  employment_status: "Employment status",
  probation_check: "Probation",
  contract_type: "Contract type",
  minimum_tenure: "Minimum service",
  concurrent_limit: "Concurrent loans",
  same_type_limit: "Same-type limit",
  cooling_period: "Cooling period",
  amount_validation: "Amount in range",
  emi_capacity: "Installment capacity",
  minimum_wage_guard: "Minimum-wage floor",
  notice_period: "Notice period",
  pending_application: "No pending application",
  policy_exists: "Policy exists",
};

/**
 * EligibilityCheckPanel — §7.3 pass/fail per eligibility rule with computed figures.
 */
export function EligibilityCheckPanel({ result }: { result: EligibilityResult }) {
  const c = result.computed ?? {};

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Eligibility</h3>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
            result.passed
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-red-50 text-red-700 ring-red-200"
          }`}
        >
          {result.passed ? "Eligible" : "Not eligible"}
        </span>
      </div>

      <ul className="space-y-1.5">
        {result.checks.map((chk) => (
          <li key={chk.rule} className="flex items-start gap-2 text-sm">
            {chk.passed ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            )}
            <span className="flex-1">
              <span className="text-gray-700">{RULE_LABELS[chk.rule] ?? chk.rule}</span>
              {!chk.passed && <span className="ml-1 text-xs text-red-600">— {chk.message}</span>}
            </span>
          </li>
        ))}
      </ul>

      {(c.new_emi !== undefined || c.eligible_max !== undefined) && (
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-50 pt-3 text-xs">
          {c.eligible_max != null && (
            <Figure label="Eligible up to" value={pkr(c.eligible_max)} />
          )}
          {c.new_emi != null && <Figure label="Monthly Installment" value={pkr(c.new_emi)} />}
          {c.emi_to_gross != null && <Figure label="Installment / gross" value={`${c.emi_to_gross}%`} />}
          {c.gross_salary != null && <Figure label="Gross salary" value={pkr(c.gross_salary)} />}
        </div>
      )}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="tabular-nums font-semibold text-gray-800">{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  );
}
