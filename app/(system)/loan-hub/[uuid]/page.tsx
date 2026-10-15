"use client";

/**
 * Loan detail — summary, amortization schedule, transaction ledger and the
 * lifecycle actions (disburse / prepay / hold / resume / write-off / adjust).
 */

import { showApiError } from "@/lib/error-toast";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, ShieldCheck } from "lucide-react";
import { loanHubService } from "@/services/loan-hub";
import { INTEREST_TYPE_LABELS, pkr } from "@/lib/loan-hub";
import { LoanStatusBadge } from "@/components/loan-hub/LoanStatusBadge";
import { AmortizationTable } from "@/components/loan-hub/AmortizationTable";
import { LoanTransactionLedger } from "@/components/loan-hub/LoanTransactionLedger";

type ApiErr = { response?: { data?: { message?: string } } };
const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none";

export default function LoanDetail() {
  const uuid = String(useParams().uuid);
  const qc = useQueryClient();
  const [tab, setTab] = useState<"schedule" | "ledger">("schedule");

  // Action inputs
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [prepayType, setPrepayType] = useState("partial");
  const [prepayAmount, setPrepayAmount] = useState(0);
  const [reason, setReason] = useState("");

  const { data: loan, isLoading } = useQuery({
    queryKey: ["loan-hub", "loan", uuid],
    queryFn: () => loanHubService.getLoan(uuid),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["loan-hub", "loan", uuid] });
  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      toast.success("Done.");
      setReason("");
      setReference("");
      refresh();
    },
    onError: (e: ApiErr) => showApiError(e, { fallbackMessage: e.response?.data?.message ?? "Action failed." }),
  });

  if (isLoading || !loan) return <div className="p-6 text-sm text-gray-400">Loading…</div>;

  const isApproved = loan.status === "approved";
  const isActive = loan.status === "active";
  const isOnHold = loan.status === "on_hold";
  const repaidPct = loan.total_emis > 0 ? Math.round((loan.emis_paid / loan.total_emis) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div>
        <Link href="/loan-hub/active" className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-brand-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Loans
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">{loan.loan_number}</h1>
          <LoanStatusBadge status={loan.status} />
          <Link
            href={`/loan-hub/${uuid}/statement`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            View Statement
          </Link>
          <button
            onClick={async () => {
              try {
                await loanHubService.downloadStatement(uuid, loan.loan_number ?? uuid);
              } catch (apiFailure) {
                showApiError(apiFailure, { fallbackMessage: "Could not download statement." });
              }
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
          >
            <Download className="h-3.5 w-3.5" /> Statement (PDF)
          </button>
        </div>
        <p className="text-sm text-gray-500">
          {loan.loan_type?.name} · Employee #{loan.employee_id} · {INTEREST_TYPE_LABELS[loan.interest_type] ?? loan.interest_type}
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card label="Principal" value={pkr(loan.principal_amount)} />
        <Card label="Outstanding" value={pkr(loan.outstanding_balance)} tone="text-emerald-700" />
        <Card label="Installment" value={pkr(loan.emi_amount)} />
        <Card label="Repaid" value={`${loan.emis_paid}/${loan.total_emis} (${repaidPct}%)`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Schedule / ledger */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-xs lg:col-span-2">
          <div className="flex gap-1 border-b border-gray-100 p-2">
            {(["schedule", "ledger"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  tab === t ? "bg-brand-100 text-brand-800" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "schedule" ? (
            <AmortizationTable rows={loan.schedule ?? []} />
          ) : (
            <LoanTransactionLedger rows={loan.transactions ?? []} />
          )}
        </div>

        {/* Actions */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <h2 className="mb-3 text-sm font-semibold text-gray-800">Actions</h2>

          {isApproved && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Disburse</p>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
                <option value="bank_transfer">Bank transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="salary_addition">Salary addition</option>
              </select>
              <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference (optional)" className={inputCls} />
              <Action onClick={() => act.mutate(() => loanHubService.disburse(uuid, { disbursement_method: method, disbursement_reference: reference || undefined }))} disabled={act.isPending}>
                Disburse Loan
              </Action>
            </div>
          )}

          {(isActive || isOnHold) && (
            <div className="space-y-4">
              {isActive && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">Prepayment</p>
                  <select value={prepayType} onChange={(e) => setPrepayType(e.target.value)} className={inputCls}>
                    <option value="partial">Partial prepayment</option>
                    <option value="full">Full early closure</option>
                  </select>
                  {prepayType === "partial" && (
                    <input type="number" value={prepayAmount || ""} onChange={(e) => setPrepayAmount(Number(e.target.value))} placeholder="Amount (≥ 1,000)" className={inputCls} />
                  )}
                  <Action
                    onClick={() =>
                      act.mutate(() =>
                        loanHubService.prepay(uuid, prepayType === "full" ? { prepayment_type: "full" } : { prepayment_type: "partial", amount: prepayAmount, post_option: "reduce_emi" }),
                      )
                    }
                    disabled={act.isPending}
                  >
                    Process Prepayment
                  </Action>
                </div>
              )}

              <div className="space-y-2 border-t border-gray-50 pt-3">
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (for hold / write-off)" className={inputCls} />
                <div className="flex flex-wrap gap-2">
                  {isActive && (
                    <Action tone="ghost" onClick={() => reason ? act.mutate(() => loanHubService.hold(uuid, { reason })) : toast.error("Reason required.")} disabled={act.isPending}>
                      Hold
                    </Action>
                  )}
                  {isOnHold && (
                    <Action tone="ghost" onClick={() => act.mutate(() => loanHubService.resume(uuid))} disabled={act.isPending}>
                      Resume
                    </Action>
                  )}
                  <Action tone="ghost" onClick={() => act.mutate(() => loanHubService.recalculate(uuid))} disabled={act.isPending}>
                    Recalculate Schedule
                  </Action>
                  <Action tone="danger" onClick={() => reason ? act.mutate(() => loanHubService.writeOff(uuid, reason)) : toast.error("Reason required.")} disabled={act.isPending}>
                    Write Off
                  </Action>
                </div>
              </div>

              {/* Guarantor lifecycle */}
              {loan.guarantor_employee_id && (
                <div className="space-y-2 border-t border-gray-50 pt-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <ShieldCheck className="h-3.5 w-3.5" /> Guarantor (Employee #{loan.guarantor_employee_id})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Action tone="ghost" onClick={() => act.mutate(() => loanHubService.guarantorAccept(uuid))} disabled={act.isPending}>
                      Record Acceptance
                    </Action>
                    <Action
                      tone="ghost"
                      onClick={() => reason ? act.mutate(() => loanHubService.guarantorRelease(uuid, reason)) : toast.error("Reason required.")}
                      disabled={act.isPending}
                    >
                      Release Guarantor
                    </Action>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isApproved && !isActive && !isOnHold && (
            <p className="text-sm text-gray-400">No actions available for a {loan.status.replace(/_/g, " ")} loan.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <p className={`text-lg font-semibold tabular-nums ${tone ?? "text-brand-900"}`}>{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  );
}

function Action({
  children,
  onClick,
  disabled,
  tone = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "ghost" | "danger";
}) {
  const cls = {
    primary: "bg-brand-800 text-white hover:bg-brand-700",
    ghost: "border border-gray-200 text-gray-600 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-500",
  }[tone];
  return (
    <button onClick={onClick} disabled={disabled} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${cls}`}>
      {children}
    </button>
  );
}
