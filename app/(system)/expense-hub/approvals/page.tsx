"use client";

/**
 * app/(system)/expense-hub/approvals/page.tsx — approval inbox.
 * Data: GET /api/v1/expense-hub/approvals/pending. Actions: approve / reject.
 */

import { showApiError } from "@/lib/error-toast";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Inbox, X } from "lucide-react";
import { expenseHubService } from "@/services/expense-hub";
import { pkr } from "@/lib/expense-hub";

export default function ApprovalsPage() {
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["expense-hub", "approvals", "pending"],
    queryFn: expenseHubService.pendingApprovals,
    staleTime: 15_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["expense-hub", "approvals", "pending"] });

  const approve = useMutation({
    mutationFn: (uuid: string) => expenseHubService.approveClaim(uuid),
    onSuccess: () => {
      toast.success("Claim approved.");
      invalidate();
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Could not approve the claim." }),
  });

  const reject = useMutation({
    mutationFn: ({ uuid, reason }: { uuid: string; reason: string }) => expenseHubService.rejectClaim(uuid, reason),
    onSuccess: () => {
      toast.success("Claim rejected.");
      setRejecting(null);
      setReason("");
      invalidate();
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Could not reject the claim." }),
  });

  const claims = data ?? [];

  return (
    <div className="flex flex-col gap-4 bg-brand-100/40 p-6">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">ExpenseHub · Approvals</nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Approval Queue</h1>
        <p className="text-sm text-gray-500">Claims awaiting your decision.</p>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

      {!isLoading && claims.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-500 shadow-xs">
          <Inbox className="mx-auto mb-2 h-7 w-7 text-gray-300" />
          Nothing awaiting your approval.
        </div>
      )}

      <div className="grid gap-3">
        {claims.map((c) => (
          <div key={c.uuid} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link href={`/expense-hub/claims/${c.uuid}`} className="font-medium text-brand-700 hover:underline">
                  {c.claim_number ?? c.title}
                </Link>
                <p className="text-xs text-gray-500">
                  {c.title} · Employee #{c.employee_id} · {pkr(c.total_amount_pkr)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => approve.mutate(c.uuid)}
                  disabled={approve.isPending}
                  className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button
                  onClick={() => setRejecting(rejecting === c.uuid ? null : c.uuid)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>

            {rejecting === c.uuid && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for rejection"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                />
                <button
                  onClick={() => reject.mutate({ uuid: c.uuid, reason })}
                  disabled={reject.isPending || reason.trim().length === 0}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
