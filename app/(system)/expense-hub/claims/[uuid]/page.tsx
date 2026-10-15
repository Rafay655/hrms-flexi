"use client";

/**
 * app/(system)/expense-hub/claims/[uuid]/page.tsx — claim detail + lifecycle actions.
 * Buttons are shown by status; the backend enforces permission + state — failures
 * surface as a toast.
 */

import { showApiError } from "@/lib/error-toast";
import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { expenseHubService } from "@/services/expense-hub";
import { CLAIM_STATUS_LABEL, claimStatusTone, pkr } from "@/lib/expense-hub";

export default function ClaimDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);
  const qc = useQueryClient();
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: claim, isLoading } = useQuery({
    queryKey: ["expense-hub", "claim", uuid],
    queryFn: () => expenseHubService.getClaim(uuid),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["expense-hub", "claim", uuid] });

  const action = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      toast.success("Done.");
      refresh();
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Action failed — you may not have permission, or the claim is in the wrong state." }),
  });

  if (isLoading || !claim) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }

  const run = (fn: () => Promise<unknown>) => action.mutate(fn);

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <Link href="/expense-hub/claims" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to claims
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">{claim.claim_number ?? claim.title}</h1>
          <p className="text-sm text-gray-500">
            {claim.title} · {claim.claim_type.replace("_", " ")} · Employee #{claim.employee_id}
          </p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${claimStatusTone(claim.status)}`}>
          {CLAIM_STATUS_LABEL[claim.status]}
        </span>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Claimed", claim.total_amount_claimed],
          ["Approved", claim.total_amount_approved],
          ["In PKR", claim.total_amount_pkr],
          ["Advance", claim.advance_adjustment],
        ].map(([label, val]) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-brand-900">{pkr(val as string)}</p>
          </div>
        ))}
      </div>

      {/* Line items */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Description</th>
              <th className="px-4 py-2.5 text-right">Claimed (PKR)</th>
              <th className="px-4 py-2.5 text-right">Approved</th>
              <th className="px-4 py-2.5">Flag</th>
            </tr>
          </thead>
          <tbody>
            {(claim.line_items ?? []).map((l) => (
              <tr key={l.uuid} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-2.5">{l.category?.name ?? "—"}</td>
                <td className="px-4 py-2.5 text-gray-500">{l.expense_date}</td>
                <td className="px-4 py-2.5 text-gray-600">{l.description ?? "—"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{pkr(l.amount_pkr)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{l.amount_approved ? pkr(l.amount_approved) : "—"}</td>
                <td className="px-4 py-2.5">
                  {l.policy_flag && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                      {l.policy_flag.replace("_", " ")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions by status */}
      <div className="flex flex-wrap items-center gap-2">
        {(claim.status === "draft" || claim.status === "revision_requested") && (
          <>
            <button onClick={() => run(() => expenseHubService.submitClaim(uuid))} className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Submit for approval
            </button>
            <button onClick={() => run(() => expenseHubService.cancelClaim(uuid))} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </>
        )}
        {claim.status === "approved" && (
          <button onClick={() => run(() => expenseHubService.verifyClaim(uuid))} className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Finance verify
          </button>
        )}
        {claim.status === "finance_verified" && (
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={payrollMonth}
              onChange={(e) => setPayrollMonth(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <button onClick={() => run(() => expenseHubService.scheduleClaim(uuid, payrollMonth))} className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Schedule reimbursement
            </button>
          </div>
        )}
        {claim.status === "reimbursement_scheduled" && (
          <button onClick={() => run(() => expenseHubService.reimburseClaim(uuid))} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            Mark reimbursed
          </button>
        )}
      </div>

      {claim.rejection_reason && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          Rejected: {claim.rejection_reason}
        </p>
      )}
      {claim.revision_notes && (
        <p className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-2 text-sm text-orange-700">
          Revision requested: {claim.revision_notes}
        </p>
      )}
    </div>
  );
}
