"use client";

/**
 * Loan application detail — summary, eligibility snapshot, approval timeline and
 * the contextual actions (submit / approve / reject / revision / cancel).
 */

import { showApiError } from "@/lib/error-toast";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { loanHubService } from "@/services/loan-hub";
import { INTEREST_TYPE_LABELS, pkr } from "@/lib/loan-hub";
import { LoanStatusBadge } from "@/components/loan-hub/LoanStatusBadge";
import { ApprovalTimeline } from "@/components/loan-hub/ApprovalTimeline";
import { EligibilityCheckPanel } from "@/components/loan-hub/EligibilityCheckPanel";

export default function LoanApplicationDetail() {
  const uuid = String(useParams().uuid);
  const qc = useQueryClient();
  const [reason, setReason] = useState("");

  const { data: app, isLoading } = useQuery({
    queryKey: ["loan-hub", "application", uuid],
    queryFn: () => loanHubService.getApplication(uuid),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["loan-hub", "application", uuid] });

  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      toast.success("Done.");
      setReason("");
      refresh();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      showApiError(e, { fallbackMessage: e.response?.data?.message ?? "Action failed." }),
  });

  if (isLoading || !app) {
    return <div className="p-6 text-sm text-gray-400">Loading…</div>;
  }

  const isPending = app.status === "pending_l1" || app.status === "pending_l2";
  const isDraft = app.status === "draft" || app.status === "revision_requested";
  const cancellable = ["draft", "submitted", "pending_l1", "pending_l2", "approved"].includes(app.status);

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/loan-hub/applications" className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-brand-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Applications
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-brand-900">{app.application_number ?? "Draft Application"}</h1>
            <LoanStatusBadge status={app.status} kind="application" />
          </div>
          <p className="text-sm text-gray-500">
            {app.loan_type?.name} · Employee #{app.employee_id}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Summary + actions */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">Summary</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Info label="Requested" value={pkr(app.requested_amount)} />
              <Info label="Approved" value={app.approved_amount != null ? pkr(app.approved_amount) : "—"} />
              <Info label="Tenure" value={`${app.requested_tenure_months} mo`} />
              <Info label="Interest" value={INTEREST_TYPE_LABELS[app.interest_type] ?? app.interest_type} />
              <Info label="Purpose" value={app.purpose} />
              <Info label="Priority" value={String(app.deduction_priority)} />
            </dl>
            {app.rejection_reason && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Rejected: {app.rejection_reason}</p>}
            {app.revision_notes && <p className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-700">Revision: {app.revision_notes}</p>}
          </div>

          {/* Actions */}
          {(isPending || isDraft || cancellable) && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
              <h2 className="mb-3 text-sm font-semibold text-gray-800">Actions</h2>
              {(isPending) && (
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Comments / reason (required to reject or request changes)"
                  className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                />
              )}
              <div className="flex flex-wrap gap-2">
                {isDraft && (
                  <Btn tone="primary" onClick={() => act.mutate(() => loanHubService.submitApplication(uuid))} disabled={act.isPending}>
                    Submit for Approval
                  </Btn>
                )}
                {isPending && (
                  <>
                    <Btn tone="success" onClick={() => act.mutate(() => loanHubService.approve(uuid))} disabled={act.isPending}>
                      Approve
                    </Btn>
                    <Btn tone="danger" onClick={() => reason ? act.mutate(() => loanHubService.reject(uuid, reason)) : toast.error("A reason is required.")} disabled={act.isPending}>
                      Reject
                    </Btn>
                    <Btn tone="ghost" onClick={() => reason ? act.mutate(() => loanHubService.requestRevision(uuid, reason)) : toast.error("Notes are required.")} disabled={act.isPending}>
                      Request Revision
                    </Btn>
                  </>
                )}
                {cancellable && (
                  <Btn tone="ghost" onClick={() => act.mutate(() => loanHubService.cancelApplication(uuid))} disabled={act.isPending}>
                    Cancel
                  </Btn>
                )}
              </div>
              {app.loan && (
                <p className="mt-3 text-xs text-gray-500">
                  Loan account created:{" "}
                  <Link href={`/loan-hub/${app.loan.uuid}`} className="font-medium text-brand-700 hover:underline">
                    {app.loan.loan_number}
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Approvals + eligibility */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">Approval Chain</h2>
            <ApprovalTimeline approvals={app.approvals ?? []} />
          </div>
          {app.eligibility_snapshot && <EligibilityCheckPanel result={app.eligibility_snapshot} />}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="font-medium tabular-nums text-gray-800">{value}</dd>
    </div>
  );
}

function Btn({
  children,
  onClick,
  tone,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: "primary" | "success" | "danger" | "ghost";
  disabled?: boolean;
}) {
  const cls = {
    primary: "bg-brand-800 text-white hover:bg-brand-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-500",
    danger: "bg-red-600 text-white hover:bg-red-500",
    ghost: "border border-gray-200 text-gray-600 hover:bg-gray-50",
  }[tone];
  return (
    <button onClick={onClick} disabled={disabled} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${cls}`}>
      {children}
    </button>
  );
}
