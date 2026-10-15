"use client";

import { Check, Clock, X } from "lucide-react";
import { pkr } from "@/lib/loan-hub";
import type { LoanApproval } from "@/types/loan-hub";

/**
 * ApprovalTimeline — §7.3 vertical timeline of approval steps with decisions.
 */
export function ApprovalTimeline({ approvals }: { approvals: LoanApproval[] }) {
  if (!approvals.length) {
    return <p className="text-sm text-gray-400">No approval chain yet.</p>;
  }

  return (
    <ol className="relative ml-3 border-l border-gray-200">
      {approvals.map((a) => {
        const done = a.status === "approved";
        const rejected = a.status === "rejected" || a.status === "revision_requested";
        return (
          <li key={a.uuid} className="mb-5 ml-5">
            <span
              className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                done ? "bg-emerald-500" : rejected ? "bg-red-500" : "bg-amber-400"
              }`}
            >
              {done ? (
                <Check className="h-2.5 w-2.5 text-white" />
              ) : rejected ? (
                <X className="h-2.5 w-2.5 text-white" />
              ) : (
                <Clock className="h-2.5 w-2.5 text-white" />
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Level {a.approval_level}</span>
              <span className="text-xs capitalize text-gray-400">{a.approver_role?.replace(/_/g, " ")}</span>
            </div>
            <p className="text-xs capitalize text-gray-500">
              {a.status.replace(/_/g, " ")}
              {a.decided_at && ` · ${a.decided_at.slice(0, 10)}`}
            </p>
            {a.approved_amount != null && (
              <p className="text-xs text-gray-500">Approved: {pkr(a.approved_amount)}</p>
            )}
            {a.comments && <p className="mt-0.5 text-xs italic text-gray-500">“{a.comments}”</p>}
          </li>
        );
      })}
    </ol>
  );
}
