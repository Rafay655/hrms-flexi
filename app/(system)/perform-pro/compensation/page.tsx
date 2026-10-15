"use client";

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeDollarSign,
  Banknote,
  Cable,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Fingerprint,
  LockKeyhole,
  Plus,
  RefreshCw,
  RotateCcw,
  ScanSearch,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { performProService } from "@/services/performpro";
import type {
  PerformProCompensationItem,
  PerformProCompensationRound,
  PerformProCompensationRoundStatus,
  PerformProCompensationSyncBatchStatus,
  PerformProCompensationSyncItem,
  PerformProCreateCompensationRoundInput,
} from "@/types/performpro";

type Decision = "approve" | "reject";

const statusStyles: Record<PerformProCompensationRoundStatus, string> = {
  OPEN: "bg-amber-50 text-amber-800 ring-amber-200",
  SUBMITTED: "bg-sky-50 text-sky-800 ring-sky-200",
  APPROVED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  REJECTED: "bg-rose-50 text-rose-800 ring-rose-200",
};

const syncStatusStyles: Record<PerformProCompensationSyncBatchStatus, string> = {
  QUEUED: "bg-slate-100 text-slate-700 ring-slate-200",
  PROCESSING: "bg-sky-50 text-sky-800 ring-sky-200",
  PARTIALLY_SYNCED: "bg-amber-50 text-amber-800 ring-amber-200",
  SYNCED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  RECONCILIATION_REQUIRED: "bg-rose-50 text-rose-800 ring-rose-200",
  REVERSED: "bg-violet-50 text-violet-800 ring-violet-200",
};

function apiMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string; error?: { message?: string } }>(error)) {
    return error.response?.data?.error?.message
      ?? error.response?.data?.message
      ?? fallback;
  }
  return fallback;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function shortHash(value: string) {
  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}

function RoundStatus({ status }: { status: PerformProCompensationRoundStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default function CompensationPage() {
  const queryClient = useQueryClient();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [recommendItem, setRecommendItem] = useState<PerformProCompensationItem | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [increasePct, setIncreasePct] = useState("");
  const [recommendationReason, setRecommendationReason] = useState("");
  const [reverseItem, setReverseItem] = useState<PerformProCompensationSyncItem | null>(null);
  const [reverseReason, setReverseReason] = useState("");

  const queueQuery = useQuery({
    queryKey: ["performpro", "compensation"],
    queryFn: performProService.compensationQueue,
  });
  const effectiveUuid = selectedUuid ?? queueQuery.data?.rounds[0]?.uuid ?? null;
  const roundQuery = useQuery({
    queryKey: ["performpro", "compensation", effectiveUuid],
    queryFn: () => performProService.compensationRound(effectiveUuid!),
    enabled: Boolean(effectiveUuid),
  });
  const round = roundQuery.data
    ?? queueQuery.data?.rounds.find((candidate) => candidate.uuid === effectiveUuid)
    ?? null;
  const syncQuery = useQuery({
    queryKey: ["performpro", "compensation", "sync", round?.sync_batch?.uuid],
    queryFn: () => performProService.compensationSyncBatch(round!.sync_batch!.uuid),
    enabled: Boolean(round?.sync_batch?.uuid),
  });
  const syncBatch = syncQuery.data ?? null;

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!round || normalized === "") return round?.items ?? [];
    return round.items.filter((item) => [
      item.display_name,
      item.employee_uuid,
      item.rating.code,
      item.rating.label,
      String(item.organization.department_name ?? ""),
      String(item.organization.grade_band ?? ""),
    ].some((value) => value.toLowerCase().includes(normalized)));
  }, [round, search]);

  const refresh = async (updated?: PerformProCompensationRound) => {
    if (updated) {
      setSelectedUuid(updated.uuid);
      queryClient.setQueryData(
        ["performpro", "compensation", updated.uuid],
        updated,
      );
    }
    await queryClient.invalidateQueries({
      queryKey: ["performpro", "compensation"],
    });
  };

  const createMutation = useMutation({
    mutationFn: performProService.createCompensationRound,
    onSuccess: async (created) => {
      await refresh(created);
      setShowCreate(false);
      toast.success("Compensation round opened with frozen pay and policy evidence.");
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The compensation round could not be opened.") }),
  });
  const recommendMutation = useMutation({
    mutationFn: performProService.recommendCompensation,
    onSuccess: async (updated) => {
      await refresh(updated);
      setRecommendItem(null);
      setIncreasePct("");
      setRecommendationReason("");
      toast.success("Recommendation validated and recorded.");
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The recommendation could not be recorded.") }),
  });
  const submitMutation = useMutation({
    mutationFn: performProService.submitCompensationRound,
    onSuccess: async (updated) => {
      await refresh(updated);
      toast.success("Compensation round submitted for approval.");
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The round could not be submitted.") }),
  });
  const decisionMutation = useMutation({
    mutationFn: ({
      target,
      action,
      reason,
    }: {
      target: PerformProCompensationRound;
      action: Decision;
      reason: string;
    }) => performProService.decideCompensationRound(target, action, reason),
    onSuccess: async (updated) => {
      await refresh(updated);
      setDecision(null);
      setDecisionReason("");
      toast.success(`Compensation round ${updated.status.toLowerCase()}.`);
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The approval decision could not be recorded.") }),
  });
  const synchronizeMutation = useMutation({
    mutationFn: performProService.synchronizeCompensationRound,
    onSuccess: async (batch) => {
      queryClient.setQueryData(
        ["performpro", "compensation", "sync", batch.uuid],
        batch,
      );
      await refresh();
      toast.success("Approved revisions synchronized to PayEdge.");
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "PayEdge synchronization could not be completed.") }),
  });
  const reconcileMutation = useMutation({
    mutationFn: performProService.reconcileCompensationSync,
    onSuccess: async (batch) => {
      queryClient.setQueryData(
        ["performpro", "compensation", "sync", batch.uuid],
        batch,
      );
      await refresh();
      toast.success(batch.counts.mismatched === 0
        ? "Every PayEdge salary revision matched."
        : `${batch.counts.mismatched} revision(s) require attention.`);
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The PayEdge reconciliation could not be completed.") }),
  });
  const retryMutation = useMutation({
    mutationFn: performProService.retryCompensationSync,
    onSuccess: async (batch) => {
      queryClient.setQueryData(
        ["performpro", "compensation", "sync", batch.uuid],
        batch,
      );
      await refresh();
      toast.success("The PayEdge synchronization attempt was retried.");
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The PayEdge synchronization retry failed.") }),
  });
  const reverseMutation = useMutation({
    mutationFn: ({
      item,
      reason,
    }: {
      item: PerformProCompensationSyncItem;
      reason: string;
    }) => performProService.reverseCompensationSync(item, reason),
    onSuccess: async (batch) => {
      queryClient.setQueryData(
        ["performpro", "compensation", "sync", batch.uuid],
        batch,
      );
      await refresh();
      setReverseItem(null);
      setReverseReason("");
      toast.success("The PayEdge salary revision was safely reversed.");
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The salary revision could not be reversed.") }),
  });

  const openRecommendation = (item: PerformProCompensationItem) => {
    setRecommendItem(item);
    setIncreasePct(String(item.recommendation?.increase_pct ?? item.guideline.target_pct));
    setRecommendationReason(item.recommendation?.reason ?? "");
  };

  const submitRecommendation = (event: FormEvent) => {
    event.preventDefault();
    if (!recommendItem) return;
    recommendMutation.mutate({
      item: recommendItem,
      increase_pct: Number(increasePct),
      reason: recommendationReason,
    });
  };

  const projected = recommendItem
    ? recommendItem.current_pay.amount * (1 + (Number(increasePct) || 0) / 100)
    : 0;
  const summaryCards: Array<{
    label: string;
    value: number;
    icon: LucideIcon;
    color: string;
    background: string;
  }> = [
    { label: "Rounds", value: queueQuery.data?.summary.total_rounds ?? 0, icon: CircleDollarSign, color: "text-brand-700", background: "bg-brand-50" },
    { label: "Open", value: queueQuery.data?.summary.open ?? 0, icon: TrendingUp, color: "text-amber-700", background: "bg-amber-50" },
    { label: "Awaiting approval", value: queueQuery.data?.summary.submitted ?? 0, icon: ShieldCheck, color: "text-sky-700", background: "bg-sky-50" },
    { label: "Approved", value: queueQuery.data?.summary.approved ?? 0, icon: CheckCircle2, color: "text-emerald-700", background: "bg-emerald-50" },
    { label: "Recommendations due", value: queueQuery.data?.summary.pending_recommendations ?? 0, icon: UsersRound, color: "text-rose-700", background: "bg-rose-50" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-100">
                <BadgeDollarSign aria-hidden="true" className="h-5 w-5" />
                PerformPro · Confidential compensation workspace
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Compensation recommendations
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-100 sm:text-base">
                Freeze outcome eligibility and current pay, guide manager recommendations,
                validate the approved budget, and retain a verifiable decision chain.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => void refresh()}
                disabled={queueQuery.isFetching}
                className="min-h-11 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <RefreshCw aria-hidden="true" className={`mr-2 h-4 w-4 ${queueQuery.isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {queueQuery.data?.capabilities.can_create_round && (
                <Button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  disabled={(queueQuery.data?.eligible_cycles.length ?? 0) === 0}
                  className="min-h-11 bg-white text-brand-950 hover:bg-brand-50"
                >
                  <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
                  Open round
                </Button>
              )}
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-brand-50">
            <LockKeyhole aria-hidden="true" className="h-4 w-4 shrink-0" />
            Pay figures are restricted to compensation roles. Notifications never include salary or recommendation amounts.
          </div>
        </header>

        {queueQuery.isLoading ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-3xl" />
            ))}
          </section>
        ) : queueQuery.isError ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle aria-hidden="true" className="h-5 w-5" />
              {apiMessage(queueQuery.error, "Compensation data could not be loaded.")}
            </div>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map(({ label, value, icon: Icon, color, background }) => (
              <article key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${background}`}>
                  <Icon aria-hidden="true" className={`h-5 w-5 ${color}`} />
                </div>
                <p className="mt-4 text-2xl font-bold text-slate-950">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              </article>
            ))}
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="px-2 pb-4">
              <h2 className="font-semibold text-slate-950">Compensation rounds</h2>
              <p className="mt-1 text-xs text-slate-500">Select a policy and budget snapshot.</p>
            </div>
            {(queueQuery.data?.rounds.length ?? 0) === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                No round exists yet. Bind a compensation policy to a cycle with released outcomes, then open its budget.
              </div>
            ) : (
              <div className="space-y-2">
                {queueQuery.data?.rounds.map((candidate) => (
                  <button
                    key={candidate.uuid}
                    type="button"
                    onClick={() => setSelectedUuid(candidate.uuid)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                      candidate.uuid === effectiveUuid
                        ? "border-brand-300 bg-brand-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">{candidate.cycle_name}</p>
                        <p className="mt-1 text-xs text-slate-500">{candidate.round_reference}</p>
                      </div>
                      <ChevronRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <RoundStatus status={candidate.status} />
                      <span className="text-xs font-medium text-slate-500">
                        {candidate.progress.recommendation_count}/{candidate.eligible_count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <div className="min-w-0 space-y-6">
            {effectiveUuid && roundQuery.isLoading ? (
              <>
                <Skeleton className="h-52 rounded-3xl" />
                <Skeleton className="h-96 rounded-3xl" />
              </>
            ) : roundQuery.isError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
                {apiMessage(roundQuery.error, "The compensation round could not be loaded.")}
              </div>
            ) : !round ? (
              <div className="flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div>
                  <Banknote aria-hidden="true" className="mx-auto h-10 w-10 text-slate-400" />
                  <h2 className="mt-4 font-semibold text-slate-950">No compensation round selected</h2>
                  <p className="mt-2 text-sm text-slate-500">Open or select a round to begin.</p>
                </div>
              </div>
            ) : (
              <>
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <RoundStatus status={round.status} />
                        <span className="text-xs font-medium text-slate-500">Version {round.lock_version}</span>
                      </div>
                      <h2 className="mt-3 text-2xl font-bold text-slate-950">{round.cycle_name}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {round.round_reference} · Effective {formatDate(round.effective_date)} · {round.measurement_basis} pay
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {round.capabilities.can_submit && (
                        <Button
                          type="button"
                          onClick={() => submitMutation.mutate(round)}
                          disabled={submitMutation.isPending}
                          className="min-h-11 bg-brand-700 hover:bg-brand-800"
                        >
                          <Send aria-hidden="true" className="mr-2 h-4 w-4" />
                          Submit for approval
                        </Button>
                      )}
                      {round.capabilities.can_approve && (
                        <Button
                          type="button"
                          onClick={() => setDecision("approve")}
                          className="min-h-11 bg-emerald-700 hover:bg-emerald-800"
                        >
                          <CheckCircle2 aria-hidden="true" className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      )}
                      {round.capabilities.can_reject && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDecision("reject")}
                          className="min-h-11 border-rose-300 text-rose-700 hover:bg-rose-50"
                        >
                          <XCircle aria-hidden="true" className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      )}
                      {round.capabilities.can_sync && (
                        <Button
                          type="button"
                          onClick={() => synchronizeMutation.mutate(round)}
                          disabled={synchronizeMutation.isPending}
                          className="min-h-11 bg-brand-700 hover:bg-brand-800"
                        >
                          <Cable aria-hidden="true" className="mr-2 h-4 w-4" />
                          {synchronizeMutation.isPending ? "Synchronizing…" : "Synchronize PayEdge"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-brand-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Bound budget</p>
                      <p className="mt-2 text-xl font-bold text-brand-950">{formatMoney(round.budget.amount, round.currency_code)}</p>
                      <p className="mt-1 text-xs text-brand-700">Source v{round.budget.source_version}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Recommended</p>
                      <p className="mt-2 text-xl font-bold text-emerald-950">{formatMoney(round.budget.recommended, round.currency_code)}</p>
                      <p className="mt-1 text-xs text-emerald-700">{round.budget.utilization_pct}% utilized</p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Remaining</p>
                      <p className="mt-2 text-xl font-bold text-slate-950">{formatMoney(round.budget.remaining, round.currency_code)}</p>
                      <p className="mt-1 text-xs text-slate-600">{round.progress.pending_count} recommendation(s) due</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`${round.budget.utilization_pct}% budget utilized`}>
                    <div
                      className="h-full rounded-full bg-brand-600 transition-[width]"
                      style={{ width: `${Math.min(100, round.budget.utilization_pct)}%` }}
                    />
                  </div>
                  {round.decision && (
                    <div className={`mt-5 rounded-2xl border p-4 ${round.decision.decision === "APPROVED" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
                      <p className="font-semibold text-slate-950">{round.decision.decision} decision</p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{round.decision.reason}</p>
                    </div>
                  )}
                </article>

                {(round.sync_batch || round.status === "APPROVED") && (
                  <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="flex items-center gap-2 font-semibold text-slate-950">
                            <Cable aria-hidden="true" className="h-5 w-5 text-brand-700" />
                            PayEdge synchronization
                          </h2>
                          {syncBatch && (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${syncStatusStyles[syncBatch.status]}`}>
                              {syncBatch.status.replaceAll("_", " ")}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Approved-only, effective-dated salary revisions with one idempotent integration transaction per employee.
                        </p>
                      </div>
                      {syncBatch?.capabilities.can_reconcile && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => reconcileMutation.mutate(syncBatch)}
                          disabled={reconcileMutation.isPending}
                          className="min-h-11"
                        >
                          <ScanSearch aria-hidden="true" className="mr-2 h-4 w-4" />
                          {reconcileMutation.isPending ? "Reconciling…" : "Reconcile PayEdge"}
                        </Button>
                      )}
                    </div>
                    {!round.sync_batch ? (
                      <div className="p-5">
                        <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-brand-950">Approved and ready for controlled synchronization</p>
                            <p className="mt-1 text-sm leading-6 text-brand-800">
                              The batch will preserve current salaries until {formatDate(round.effective_date)} and record individual successes or failures.
                            </p>
                          </div>
                          {round.capabilities.can_sync && (
                            <Button
                              type="button"
                              onClick={() => synchronizeMutation.mutate(round)}
                              disabled={synchronizeMutation.isPending}
                              className="shrink-0 bg-brand-700 hover:bg-brand-800"
                            >
                              <Cable aria-hidden="true" className="mr-2 h-4 w-4" />
                              Start batch
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : syncQuery.isLoading ? (
                      <div className="space-y-3 p-5">
                        <Skeleton className="h-20 rounded-2xl" />
                        <Skeleton className="h-32 rounded-2xl" />
                      </div>
                    ) : syncQuery.isError ? (
                      <div className="p-5">
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                          {apiMessage(syncQuery.error, "The PayEdge synchronization evidence could not be loaded.")}
                        </div>
                      </div>
                    ) : syncBatch ? (
                      <>
                        <div className="grid gap-3 p-5 sm:grid-cols-3 lg:grid-cols-6">
                          {[
                            ["Total", syncBatch.counts.total],
                            ["Succeeded", syncBatch.counts.succeeded],
                            ["Failed", syncBatch.counts.failed],
                            ["Matched", syncBatch.counts.matched],
                            ["Mismatched", syncBatch.counts.mismatched],
                            ["Reversed", syncBatch.counts.reversed],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-2xl bg-slate-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                              <p className="mt-1 text-xl font-bold tabular-nums text-slate-950">{value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="overflow-x-auto border-t border-slate-200">
                          <table className="min-w-[900px] w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <tr>
                                <th className="px-5 py-3">Employee</th>
                                <th className="px-5 py-3">PayEdge status</th>
                                <th className="px-5 py-3">Effective</th>
                                <th className="px-5 py-3 text-right">Approved pay</th>
                                <th className="px-5 py-3">Evidence</th>
                                <th className="px-5 py-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {syncBatch.items.map((item) => (
                                <tr key={item.uuid} className="hover:bg-slate-50/70">
                                  <td className="px-5 py-4">
                                    <p className="font-semibold text-slate-950">{item.display_name}</p>
                                    <p className="mt-1 text-xs text-slate-500">{item.attempt_count} attempt(s)</p>
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      ["SYNCED", "MATCHED"].includes(item.status)
                                        ? "bg-emerald-50 text-emerald-800"
                                        : item.status === "REVERSED"
                                          ? "bg-violet-50 text-violet-800"
                                          : "bg-amber-50 text-amber-800"
                                    }`}>
                                      {item.status.replaceAll("_", " ")}
                                    </span>
                                    {item.last_error_code && (
                                      <p className="mt-2 text-xs text-rose-700">{item.last_error_code.replaceAll("_", " ")}</p>
                                    )}
                                  </td>
                                  <td className="px-5 py-4 text-slate-700">{formatDate(item.target_pay.effective_from)}</td>
                                  <td className="px-5 py-4 text-right">
                                    <p className="font-semibold tabular-nums text-slate-950">
                                      {formatMoney(item.target_pay.amount, item.target_pay.currency_code)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">{item.target_pay.measurement_basis}</p>
                                  </td>
                                  <td className="px-5 py-4">
                                    <p className="font-mono text-xs text-slate-700" title={item.current_evidence_hash}>
                                      {shortHash(item.current_evidence_hash)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {item.target_salary_assignment_uuid ? "Assignment recorded" : "No target assignment"}
                                    </p>
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                      {item.capabilities.can_retry && (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => retryMutation.mutate(item)}
                                          disabled={retryMutation.isPending}
                                          className="min-h-10"
                                        >
                                          <RefreshCw aria-hidden="true" className="mr-2 h-4 w-4" />
                                          Retry
                                        </Button>
                                      )}
                                      {item.capabilities.can_reverse && (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setReverseItem(item)}
                                          className="min-h-10 border-violet-200 text-violet-800 hover:bg-violet-50"
                                        >
                                          <RotateCcw aria-hidden="true" className="mr-2 h-4 w-4" />
                                          Reverse
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : null}
                  </article>
                )}

                <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-slate-950">Outcome-eligible population</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {round.eligible_count} frozen pay snapshot(s) · {round.ineligible_count ?? 0} exception(s)
                      </p>
                    </div>
                    <label className="relative block sm:w-72">
                      <span className="sr-only">Search compensation population</span>
                      <Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search employee, rating, team…"
                        className="min-h-11 pl-9"
                      />
                    </label>
                  </div>
                  {filteredItems.length === 0 ? (
                    <p className="p-10 text-center text-sm text-slate-500">No compensation items match the current search.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-[980px] w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-5 py-3">Employee</th>
                            <th className="px-5 py-3">Outcome</th>
                            <th className="px-5 py-3 text-right">Current pay</th>
                            <th className="px-5 py-3">Guideline</th>
                            <th className="px-5 py-3 text-right">Recommendation</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredItems.map((item) => (
                            <tr key={item.uuid} className="hover:bg-slate-50/70">
                              <td className="px-5 py-4">
                                <p className="font-semibold text-slate-950">{item.display_name}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {String(item.organization.department_name ?? "Department not captured")}
                                  {item.organization.grade_band ? ` · ${String(item.organization.grade_band)}` : ""}
                                </p>
                              </td>
                              <td className="px-5 py-4">
                                <p className="font-semibold text-slate-900">{item.rating.code} · {item.rating.label}</p>
                                <p className="mt-1 text-xs text-slate-500">Score {item.rating.final_score.toFixed(2)}</p>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <p className="font-semibold tabular-nums text-slate-950">{formatMoney(item.current_pay.amount, item.current_pay.currency_code)}</p>
                                <p className="mt-1 text-xs text-slate-500">{item.current_pay.measurement_basis}</p>
                              </td>
                              <td className="px-5 py-4">
                                <p className="font-semibold tabular-nums text-slate-900">{item.guideline.min_pct}%–{item.guideline.max_pct}%</p>
                                <p className="mt-1 text-xs text-slate-500">Target {item.guideline.target_pct}%</p>
                              </td>
                              <td className="px-5 py-4 text-right">
                                {item.recommendation ? (
                                  <>
                                    <p className="font-semibold tabular-nums text-emerald-800">+{item.recommendation.increase_pct}%</p>
                                    <p className="mt-1 text-xs tabular-nums text-slate-600">{formatMoney(item.recommendation.new_pay_amount, round.currency_code)}</p>
                                  </>
                                ) : <span className="text-slate-400">—</span>}
                              </td>
                              <td className="px-5 py-4">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "RECOMMENDED" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                                  {item.status === "RECOMMENDED" ? "Recommended" : "Pending"}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                {item.capabilities.can_recommend ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openRecommendation(item)}
                                    className="min-h-10"
                                  >
                                    {item.recommendation ? "Revise" : "Recommend"}
                                  </Button>
                                ) : (
                                  <span className="text-xs text-slate-400">Locked</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>

                <div className="grid gap-6 lg:grid-cols-2">
                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="flex items-center gap-2 font-semibold text-slate-950">
                      <Fingerprint aria-hidden="true" className="h-5 w-5 text-brand-700" />
                      Evidence chain
                    </h2>
                    <dl className="mt-4 space-y-3 text-xs">
                      {[
                        ["Policy", round.evidence.policy_hash],
                        ["Budget", round.evidence.budget_hash],
                        ["Population", round.evidence.population_hash],
                        ["Current", round.evidence.current_evidence_hash],
                      ].map(([label, hash]) => (
                        <div key={label} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2.5">
                          <dt className="font-semibold text-slate-600">{label}</dt>
                          <dd className="font-mono text-slate-800" title={hash}>{shortHash(hash)}</dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-slate-950">Population exceptions</h2>
                    <p className="mt-1 text-xs text-slate-500">Excluded before any recommendation was created.</p>
                    {(round.population_exceptions?.length ?? 0) === 0 ? (
                      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                        <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
                        Every released outcome had an applicable pay baseline.
                      </div>
                    ) : (
                      <ul className="mt-4 space-y-2">
                        {round.population_exceptions?.map((exception) => (
                          <li key={exception.outcome_uuid} className="rounded-2xl bg-amber-50 p-3 text-sm">
                            <p className="font-semibold text-amber-950">{exception.display_name}</p>
                            <p className="mt-1 text-xs text-amber-800">{exception.reason_code.replaceAll("_", " ")}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {showCreate && queueQuery.data && (
        <CreateRoundDialog
          cycles={queueQuery.data.eligible_cycles}
          pending={createMutation.isPending}
          onClose={() => setShowCreate(false)}
          onSubmit={(input) => createMutation.mutate(input)}
        />
      )}

      {recommendItem && round && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
          <form
            onSubmit={submitRecommendation}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recommendation-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="recommendation-title" className="text-xl font-bold text-slate-950">Recommend compensation</h2>
                <p className="mt-1 text-sm text-slate-500">{recommendItem.display_name} · {recommendItem.rating.label}</p>
              </div>
              <button type="button" onClick={() => setRecommendItem(null)} aria-label="Close recommendation dialog" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3">
              <div><p className="text-xs text-slate-500">Current</p><p className="mt-1 font-semibold text-slate-950">{formatMoney(recommendItem.current_pay.amount, round.currency_code)}</p></div>
              <div><p className="text-xs text-slate-500">Guideline</p><p className="mt-1 font-semibold text-slate-950">{recommendItem.guideline.min_pct}%–{recommendItem.guideline.max_pct}%</p></div>
              <div><p className="text-xs text-slate-500">Projected</p><p className="mt-1 font-semibold text-emerald-800">{formatMoney(projected, round.currency_code)}</p></div>
            </div>
            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-800">Increase percentage</span>
              <Input
                type="number"
                min={recommendItem.guideline.min_pct}
                max={recommendItem.guideline.max_pct}
                step="0.01"
                value={increasePct}
                onChange={(event) => setIncreasePct(event.target.value)}
                required
                className="mt-2 min-h-11"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-800">Recommendation rationale</span>
              <Textarea
                value={recommendationReason}
                onChange={(event) => setRecommendationReason(event.target.value)}
                minLength={20}
                maxLength={4000}
                required
                rows={5}
                placeholder="Explain the performance evidence and placement within the guideline."
                className="mt-2"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setRecommendItem(null)}>Cancel</Button>
              <Button type="submit" disabled={recommendMutation.isPending} className="bg-brand-700 hover:bg-brand-800">
                {recommendMutation.isPending ? "Validating…" : "Record recommendation"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {decision && round && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              decisionMutation.mutate({ target: round, action: decision, reason: decisionReason });
            }}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="decision-title"
          >
            <h2 id="decision-title" className="text-xl font-bold text-slate-950">
              {decision === "approve" ? "Approve" : "Reject"} compensation round
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This records an immutable {decision} decision for {round.round_reference}. Only an approved decision can open the controlled PayEdge synchronization batch.
            </p>
            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-800">Decision rationale</span>
              <Textarea
                value={decisionReason}
                onChange={(event) => setDecisionReason(event.target.value)}
                minLength={20}
                maxLength={4000}
                required
                rows={5}
                className="mt-2"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDecision(null)}>Cancel</Button>
              <Button
                type="submit"
                disabled={decisionMutation.isPending}
                className={decision === "approve" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-700 hover:bg-rose-800"}
              >
                {decisionMutation.isPending ? "Recording…" : `Confirm ${decision}`}
              </Button>
            </div>
          </form>
        </div>
      )}

      {reverseItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              reverseMutation.mutate({ item: reverseItem, reason: reverseReason });
            }}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reverse-title"
          >
            <h2 id="reverse-title" className="text-xl font-bold text-slate-950">
              Reverse PayEdge revision
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This restores {reverseItem.display_name}&apos;s frozen prior assignment. Reversal is blocked once payroll records consume the synchronized revision.
            </p>
            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-800">Mandatory reversal reason</span>
              <Textarea
                value={reverseReason}
                onChange={(event) => setReverseReason(event.target.value)}
                minLength={20}
                maxLength={4000}
                required
                rows={5}
                placeholder="Explain why the approved salary revision must be reversed."
                className="mt-2"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setReverseItem(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={reverseMutation.isPending}
                className="bg-violet-700 hover:bg-violet-800"
              >
                <RotateCcw aria-hidden="true" className="mr-2 h-4 w-4" />
                {reverseMutation.isPending ? "Reversing…" : "Confirm reversal"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function CreateRoundDialog({
  cycles,
  pending,
  onClose,
  onSubmit,
}: {
  cycles: Array<{
    uuid: string;
    code: string;
    name: string;
    released_outcome_count: number;
  }>;
  pending: boolean;
  onClose: () => void;
  onSubmit: (input: PerformProCreateCompensationRoundInput) => void;
}) {
  const [cycleUuid, setCycleUuid] = useState(cycles[0]?.uuid ?? "");
  const [budgetSourceUuid, setBudgetSourceUuid] = useState(() => crypto.randomUUID());
  const [budgetVersion, setBudgetVersion] = useState("1");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            cycle_uuid: cycleUuid,
            budget_source_uuid: budgetSourceUuid,
            budget_source_version: Number(budgetVersion),
            budget_amount: Number(budgetAmount),
            currency_code: currency.toUpperCase(),
            effective_date: effectiveDate,
          });
        }}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-round-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="create-round-title" className="text-xl font-bold text-slate-950">Open compensation round</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">The cycle policy, budget, released outcomes, and active pay assignments will be frozen.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close create round dialog" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <label className="mt-5 block">
          <span className="text-sm font-semibold text-slate-800">Performance cycle</span>
          <select
            value={cycleUuid}
            onChange={(event) => setCycleUuid(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            {cycles.map((cycle) => (
              <option key={cycle.uuid} value={cycle.uuid}>
                {cycle.name} · {cycle.released_outcome_count} released outcome(s)
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-sm font-semibold text-slate-800">Budget amount</span>
            <Input type="number" min="0.01" step="0.01" value={budgetAmount} onChange={(event) => setBudgetAmount(event.target.value)} required className="mt-2 min-h-11" />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-800">Currency</span>
            <Input value={currency} onChange={(event) => setCurrency(event.target.value)} minLength={3} maxLength={3} required className="mt-2 min-h-11 uppercase" />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-800">Budget source version</span>
            <Input type="number" min="1" value={budgetVersion} onChange={(event) => setBudgetVersion(event.target.value)} required className="mt-2 min-h-11" />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-800">Effective date</span>
            <Input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} required className="mt-2 min-h-11" />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-800">Budget source UUID</span>
          <div className="mt-2 flex gap-2">
            <Input value={budgetSourceUuid} onChange={(event) => setBudgetSourceUuid(event.target.value)} required className="min-h-11 font-mono text-xs" />
            <Button type="button" variant="outline" onClick={() => setBudgetSourceUuid(crypto.randomUUID())} className="min-h-11">Generate</Button>
          </div>
          <span className="mt-1 block text-xs text-slate-500">Use the approved finance budget identifier when one exists.</span>
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending} className="bg-brand-700 hover:bg-brand-800">
            {pending ? "Freezing evidence…" : "Open round"}
          </Button>
        </div>
      </form>
    </div>
  );
}
