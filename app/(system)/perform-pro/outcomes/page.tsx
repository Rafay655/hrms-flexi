"use client";

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  Gauge,
  Send,
  Users,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { performProService } from "@/services/performpro";
import type {
  PerformProOutcomeReleaseStatus,
  PerformProOutcomeStatus,
  PerformProPerformanceOutcome,
} from "@/types/performpro";

type DecisionDialog =
  | { kind: "ASSEMBLE"; cycleUuid: string; cycleName: string }
  | { kind: "APPROVE" | "REJECT"; outcome: PerformProPerformanceOutcome }
  | { kind: "RELEASE"; outcome: PerformProPerformanceOutcome }
  | { kind: "BATCH_RELEASE"; outcomes: PerformProPerformanceOutcome[] }
  | { kind: "ACKNOWLEDGE"; outcome: PerformProPerformanceOutcome }
  | null;

const statusStyles: Record<PerformProOutcomeStatus, string> = {
  PENDING_APPROVAL: "bg-amber-50 text-amber-900 ring-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  REJECTED: "bg-rose-50 text-rose-800 ring-rose-200",
};

const releaseStatusStyles: Record<PerformProOutcomeReleaseStatus, string> = {
  NOT_RELEASED: "bg-slate-100 text-slate-700 ring-slate-200",
  RELEASED: "bg-sky-50 text-sky-800 ring-sky-200",
  ACKNOWLEDGED: "bg-violet-50 text-violet-800 ring-violet-200",
};

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function apiMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return error instanceof Error ? error.message : fallback;
  return error.response?.data?.error?.message
    ?? error.response?.data?.message
    ?? fallback;
}

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function organizationLabel(organization: Record<string, unknown>) {
  const values = [
    organization.designation_name ?? organization.designation,
    organization.department_name ?? organization.department,
    organization.grade_band_name ?? organization.grade_band,
  ].filter((value) => typeof value === "string" && value.trim() !== "");
  return values.join(" · ") || "Organization snapshot available";
}

function StatusBadge({ status }: { status: PerformProOutcomeStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}>
      {humanize(status)}
    </span>
  );
}

function ReleaseStatusBadge({ status }: { status: PerformProOutcomeReleaseStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${releaseStatusStyles[status]}`}>
      {humanize(status)}
    </span>
  );
}

function HashValue({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd
        className="mt-1 truncate font-mono text-xs text-slate-800"
        title={value ?? "Not configured"}
      >
        {value ?? "Not configured"}
      </dd>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "indigo" | "emerald";
}) {
  const colors = {
    slate: "bg-slate-500",
    indigo: "bg-indigo-600",
    emerald: "bg-emerald-600",
  };
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold tabular-nums text-slate-950">{value.toFixed(2)} / 5</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <div
          className={`h-full rounded-full ${colors[tone]}`}
          style={{ width: `${Math.max(0, Math.min(100, (value / 5) * 100))}%` }}
        />
      </div>
    </div>
  );
}

export default function PerformanceOutcomesPage() {
  const queryClient = useQueryClient();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PerformProOutcomeStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [assemblyCycleUuid, setAssemblyCycleUuid] = useState("");
  const [dialog, setDialog] = useState<DecisionDialog>(null);
  const [reason, setReason] = useState("");
  const [selectedForRelease, setSelectedForRelease] = useState<string[]>([]);

  const queueQuery = useQuery({
    queryKey: ["perform-pro", "outcomes"],
    queryFn: performProService.outcomeQueue,
  });
  const cyclesQuery = useQuery({
    queryKey: ["perform-pro", "cycles", "ACTIVE"],
    queryFn: () => performProService.cycles("ACTIVE"),
    enabled: Boolean(queueQuery.data?.capabilities.can_assemble),
  });
  const assemblyCycles = useMemo(
    () => (cyclesQuery.data ?? []).filter((cycle) => cycle.active_phase === "OUTCOME_APPROVAL"),
    [cyclesQuery.data],
  );
  const activeAssemblyCycleUuid = assemblyCycles.some(
    (cycle) => cycle.uuid === assemblyCycleUuid,
  )
    ? assemblyCycleUuid
    : assemblyCycles[0]?.uuid ?? "";

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (queueQuery.data?.outcomes ?? []).filter((outcome) => (
      (statusFilter === "ALL" || outcome.status === statusFilter)
      && (
        needle === ""
        || outcome.display_name.toLowerCase().includes(needle)
        || outcome.cycle_name.toLowerCase().includes(needle)
        || organizationLabel(outcome.organization).toLowerCase().includes(needle)
      )
    ));
  }, [queueQuery.data?.outcomes, search, statusFilter]);

  const activeSelectedUuid = filtered.some((outcome) => outcome.uuid === selectedUuid)
    ? selectedUuid
    : filtered[0]?.uuid ?? null;
  const detailQuery = useQuery({
    queryKey: ["perform-pro", "outcomes", activeSelectedUuid],
    queryFn: () => performProService.outcome(activeSelectedUuid!),
    enabled: Boolean(activeSelectedUuid),
  });

  const assembleMutation = useMutation({
    mutationFn: performProService.assembleOutcomes,
    onSuccess: async (run) => {
      await queryClient.invalidateQueries({ queryKey: ["perform-pro", "outcomes"] });
      toast.success(`${run.participant_count} calibrated scorecards assembled for approval.`);
      setDialog(null);
    },
    onError: (error) => {
      showApiError(error, { fallbackMessage: apiMessage(error, "Unable to assemble performance outcomes.") });
    },
  });

  const decisionMutation = useMutation({
    mutationFn: ({
      outcome,
      decision,
      note,
    }: {
      outcome: PerformProPerformanceOutcome;
      decision: "approve" | "reject";
      note: string;
    }) => performProService.decideOutcome(outcome, decision, note),
    onSuccess: async (outcome) => {
      queryClient.setQueryData(
        ["perform-pro", "outcomes", outcome.uuid],
        outcome,
      );
      await queryClient.invalidateQueries({ queryKey: ["perform-pro", "outcomes"] });
      toast.success(
        outcome.status === "APPROVED"
          ? "Outcome approved with immutable decision evidence."
          : "Outcome rejected and the mandatory reason was recorded.",
      );
      setDialog(null);
      setReason("");
    },
    onError: async (error) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        await Promise.all([queueQuery.refetch(), detailQuery.refetch()]);
        showApiError(error, { fallbackMessage: "This outcome changed in another window. The latest evidence has been loaded; review it before retrying." });
        setDialog(null);
        return;
      }
      showApiError(error, { fallbackMessage: apiMessage(error, "Unable to record the outcome decision.") });
    },
  });

  const releaseMutation = useMutation({
    mutationFn: (outcome: PerformProPerformanceOutcome) =>
      performProService.releaseOutcome(outcome),
    onSuccess: async (outcome) => {
      queryClient.setQueryData(["perform-pro", "outcomes", outcome.uuid], outcome);
      await queryClient.invalidateQueries({ queryKey: ["perform-pro", "outcomes"] });
      setSelectedForRelease((current) => current.filter((uuid) => uuid !== outcome.uuid));
      setDialog(null);
      toast.success("Outcome released. The employee has been notified securely.");
    },
    onError: async (error) => handleStaleOrError(
      error,
      "Unable to release the performance outcome.",
    ),
  });

  const batchReleaseMutation = useMutation({
    mutationFn: (outcomes: PerformProPerformanceOutcome[]) =>
      performProService.batchReleaseOutcomes(outcomes),
    onSuccess: async (batch) => {
      await queryClient.invalidateQueries({ queryKey: ["perform-pro", "outcomes"] });
      setSelectedForRelease([]);
      setDialog(null);
      toast.success(`${batch.released_count} outcomes released as one controlled batch.`);
    },
    onError: async (error) => handleStaleOrError(
      error,
      "The batch was not released. No selected outcome was changed.",
    ),
  });

  const acknowledgementMutation = useMutation({
    mutationFn: (outcome: PerformProPerformanceOutcome) =>
      performProService.acknowledgeOutcome(outcome),
    onSuccess: async (outcome) => {
      queryClient.setQueryData(["perform-pro", "outcomes", outcome.uuid], outcome);
      await queryClient.invalidateQueries({ queryKey: ["perform-pro", "outcomes"] });
      setDialog(null);
      toast.success("Receipt acknowledged with immutable evidence.");
    },
    onError: async (error) => handleStaleOrError(
      error,
      "Unable to acknowledge this outcome.",
    ),
  });

  async function handleStaleOrError(error: unknown, fallback: string) {
    if (isAxiosError(error) && error.response?.status === 409) {
      await Promise.all([queueQuery.refetch(), detailQuery.refetch()]);
      toast.error(
        "Outcome evidence changed in another window. The latest version is loaded; review it before retrying.",
      );
      setDialog(null);
      return;
    }
    toast.error(apiMessage(error, fallback));
  }

  const selected = detailQuery.data;
  const summary = queueQuery.data?.summary;
  const activeCycle = assemblyCycles.find((cycle) => cycle.uuid === activeAssemblyCycleUuid);
  const decisionPending = assembleMutation.isPending
    || decisionMutation.isPending
    || releaseMutation.isPending
    || batchReleaseMutation.isPending
    || acknowledgementMutation.isPending;
  const releaseCandidates = (queueQuery.data?.outcomes ?? []).filter(
    (outcome) => outcome.capabilities.can_release,
  );
  const selectedReleaseOutcomes = releaseCandidates.filter(
    (outcome) => selectedForRelease.includes(outcome.uuid),
  );
  const rejectReasonInvalid = dialog?.kind === "REJECT" && reason.trim().length < 10;

  function confirmDialog() {
    if (!dialog) return;
    if (dialog.kind === "ASSEMBLE") {
      assembleMutation.mutate(dialog.cycleUuid);
      return;
    }
    if (dialog.kind === "RELEASE") {
      releaseMutation.mutate(dialog.outcome);
      return;
    }
    if (dialog.kind === "BATCH_RELEASE") {
      batchReleaseMutation.mutate(dialog.outcomes);
      return;
    }
    if (dialog.kind === "ACKNOWLEDGE") {
      acknowledgementMutation.mutate(dialog.outcome);
      return;
    }
    if (dialog.kind === "REJECT" && reason.trim().length < 10) {
      toast.error("Enter a rejection reason of at least 10 characters.");
      return;
    }
    decisionMutation.mutate({
      outcome: dialog.outcome,
      decision: dialog.kind === "APPROVE" ? "approve" : "reject",
      note: reason,
    });
  }

  return (
    <main className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white">
                <BadgeCheck aria-hidden="true" className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
                  PerformPro
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  Performance outcomes
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Approve calibrated scorecards, release approved outcomes through controlled
                  visibility gates, and capture employee acknowledgement evidence.
                </p>
              </div>
            </div>
            {queueQuery.data?.capabilities.pre_release_confidential ? (
              <div className="flex max-w-sm items-start gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-900 ring-1 ring-inset ring-indigo-200">
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                Scorecards remain confidential until the release workflow.
              </div>
            ) : null}
          </div>
        </header>

        {queueQuery.data?.capabilities.can_assemble ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-950">Assemble calibrated outcomes</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Creates one immutable scorecard for every calibrated participant in the open phase.
                </p>
              </div>
              <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
                <div className="min-w-64 flex-1">
                  <label htmlFor="outcome-cycle" className="text-sm font-medium text-slate-800">
                    Outcome-approval cycle
                  </label>
                  <select
                    id="outcome-cycle"
                    value={activeAssemblyCycleUuid}
                    onChange={(event) => setAssemblyCycleUuid(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                  >
                    {assemblyCycles.length === 0 ? (
                      <option value="">No cycle in outcome approval</option>
                    ) : null}
                    {assemblyCycles.map((cycle) => (
                      <option key={cycle.uuid} value={cycle.uuid}>{cycle.name}</option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  className="min-h-11 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!activeCycle || decisionPending}
                  onClick={() => activeCycle && setDialog({
                    kind: "ASSEMBLE",
                    cycleUuid: activeCycle.uuid,
                    cycleName: activeCycle.name,
                  })}
                >
                  <Sparkles aria-hidden="true" className="size-4" />
                  Assemble scorecards
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {queueQuery.data?.capabilities.can_release ? (
          <section className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-600 text-white">
                  <Users aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-sky-950">Controlled release</h2>
                  <p className="mt-1 text-sm leading-6 text-sky-800">
                    Select approved outcomes below. A batch is all-or-nothing and each employee
                    receives access only after immutable release evidence is recorded.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                className="min-h-11 bg-sky-700 hover:bg-sky-800"
                disabled={selectedReleaseOutcomes.length === 0 || decisionPending}
                onClick={() => setDialog({
                  kind: "BATCH_RELEASE",
                  outcomes: selectedReleaseOutcomes,
                })}
              >
                <Send aria-hidden="true" className="size-4" />
                Release selected ({selectedReleaseOutcomes.length})
              </Button>
            </div>
          </section>
        ) : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Outcome queue summary">
          {[
            { label: "All outcomes", value: summary?.total ?? 0, icon: FileCheck2, tone: "text-slate-700" },
            { label: "Pending approval", value: summary?.pending_approval ?? 0, icon: Gauge, tone: "text-amber-700" },
            { label: "Approved", value: summary?.approved ?? 0, icon: CheckCircle2, tone: "text-emerald-700" },
            { label: "Rejected", value: summary?.rejected ?? 0, icon: XCircle, tone: "text-rose-700" },
            { label: "Awaiting acknowledgement", value: summary?.awaiting_acknowledgement ?? 0, icon: Send, tone: "text-sky-700" },
            { label: "Acknowledged", value: summary?.acknowledged ?? 0, icon: BadgeCheck, tone: "text-violet-700" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-600">{card.label}</span>
                <card.icon aria-hidden="true" className={`size-5 ${card.tone}`} />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">{card.value}</p>
            </div>
          ))}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">Approval queue</h2>
                <p className="mt-1 text-xs text-slate-500">{filtered.length} visible scorecards</p>
              </div>
              {queueQuery.isFetching ? (
                <RefreshCw aria-hidden="true" className="size-4 animate-spin text-slate-400" />
              ) : null}
            </div>
            <div className="mt-4 space-y-3">
              <label htmlFor="outcome-search" className="sr-only">Search outcome scorecards</label>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-slate-400" />
                <Input
                  id="outcome-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search employee or cycle"
                  className="min-h-11 pl-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label htmlFor="outcome-status" className="sr-only">Filter by status</label>
                <select
                  id="outcome-status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as PerformProOutcomeStatus | "ALL")}
                  className="col-span-2 min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                >
                  <option value="ALL">All statuses</option>
                  <option value="PENDING_APPROVAL">Pending approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {queueQuery.isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 rounded-xl" />
                ))
                : filtered.map((outcome) => (
                  <div
                    key={outcome.uuid}
                    className={`rounded-xl border transition-colors duration-200 ${
                      activeSelectedUuid === outcome.uuid
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {outcome.capabilities.can_release ? (
                      <label className="flex min-h-11 cursor-pointer items-center gap-2 border-b border-slate-200 px-3 text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={selectedForRelease.includes(outcome.uuid)}
                          onChange={(event) => setSelectedForRelease((current) => (
                            event.target.checked
                              ? [...current, outcome.uuid]
                              : current.filter((uuid) => uuid !== outcome.uuid)
                          ))}
                          className="size-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
                        />
                        Include in controlled release
                      </label>
                    ) : null}
                    <button
                      type="button"
                      aria-current={activeSelectedUuid === outcome.uuid ? "true" : undefined}
                      onClick={() => setSelectedUuid(outcome.uuid)}
                      className="w-full cursor-pointer p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-950">{outcome.display_name}</span>
                        <StatusBadge status={outcome.status} />
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">{outcome.cycle_name}</span>
                      <span className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                        <ReleaseStatusBadge status={outcome.release_status} />
                        <span className="font-semibold tabular-nums">{outcome.scores.final_score.toFixed(2)}</span>
                      </span>
                    </button>
                  </div>
                ))}
            </div>
            {!queueQuery.isLoading && filtered.length === 0 ? (
              <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                No outcome scorecards match this filter.
              </p>
            ) : null}
          </aside>

          <div>
            {queueQuery.isError ? (
              <StatePanel
                title="Outcome queue unavailable"
                detail={apiMessage(queueQuery.error, "The approval queue could not be loaded.")}
                onRetry={() => queueQuery.refetch()}
              />
            ) : detailQuery.isLoading ? (
              <DetailSkeleton />
            ) : detailQuery.isError ? (
              <StatePanel
                title="Scorecard unavailable"
                detail={apiMessage(detailQuery.error, "The selected outcome could not be loaded.")}
                onRetry={() => detailQuery.refetch()}
              />
            ) : selected ? (
              <article className="space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-semibold text-slate-950">{selected.display_name}</h2>
                        <StatusBadge status={selected.status} />
                        <ReleaseStatusBadge status={selected.release_status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{organizationLabel(selected.organization)}</p>
                      <p className="mt-1 text-xs text-slate-500">{selected.cycle_name}</p>
                    </div>
                    <div className="rounded-xl bg-indigo-50 px-4 py-3 text-right ring-1 ring-inset ring-indigo-200">
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Final rating</p>
                      <p className="mt-1 text-lg font-semibold text-indigo-950">{selected.rating.label}</p>
                      <p className="text-sm tabular-nums text-indigo-800">
                        {selected.scores.final_score.toFixed(2)} / 5
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="space-y-5" aria-label="Score comparison visualization">
                      <ScoreBar label="Manager review baseline" value={selected.scores.pre_calibration_score} tone="slate" />
                      <ScoreBar label="Calibrated panel score" value={selected.scores.calibrated_score} tone="indigo" />
                      <ScoreBar label="Final outcome score" value={selected.scores.final_score} tone="emerald" />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Calibration variance</p>
                      <p className={`mt-2 text-2xl font-semibold tabular-nums ${
                        selected.scores.calibration_variance > 0
                          ? "text-emerald-700"
                          : selected.scores.calibration_variance < 0
                            ? "text-rose-700"
                            : "text-slate-800"
                      }`}>
                        {selected.scores.calibration_variance > 0 ? "+" : ""}
                        {selected.scores.calibration_variance.toFixed(2)}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        {selected.scores.was_adjusted
                          ? "The calibration panel recorded an adjustment."
                          : "The panel retained the manager-review score."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <caption className="sr-only">Accessible score comparison table</caption>
                      <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="py-2 pr-4 font-semibold">Baseline</th>
                          <th className="py-2 pr-4 font-semibold">Calibrated</th>
                          <th className="py-2 pr-4 font-semibold">Variance</th>
                          <th className="py-2 font-semibold">Final rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-slate-800">
                          <td className="py-3 pr-4 tabular-nums">{selected.scores.pre_calibration_score.toFixed(2)}</td>
                          <td className="py-3 pr-4 tabular-nums">{selected.scores.calibrated_score.toFixed(2)}</td>
                          <td className="py-3 pr-4 tabular-nums">{selected.scores.calibration_variance.toFixed(2)}</td>
                          <td className="py-3">{selected.rating.label} ({selected.rating.value})</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Fingerprint aria-hidden="true" className="size-5 text-indigo-600" />
                    <h3 className="font-semibold text-slate-950">Immutable evidence</h3>
                  </div>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <HashValue label="Scorecard hash" value={selected.evidence.scorecard_hash} />
                    <HashValue label="Calibration source" value={selected.evidence.calibration_source_hash} />
                    <HashValue label="Rating scale" value={selected.evidence.rating_scale_hash} />
                    <HashValue label="Scoring policy" value={selected.evidence.scoring_policy_hash} />
                    <HashValue label="Assembly evidence" value={selected.evidence.assembly_hash} />
                    <HashValue label="Current evidence" value={selected.evidence.current_evidence_hash} />
                    {selected.release ? (
                      <HashValue label="Release evidence" value={selected.release.release_hash} />
                    ) : null}
                    {selected.acknowledgement ? (
                      <HashValue
                        label="Acknowledgement evidence"
                        value={selected.acknowledgement.acknowledgement_hash}
                      />
                    ) : null}
                  </dl>
                </section>

                {selected.decisions && selected.decisions.length > 0 ? (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                    <h3 className="font-semibold text-slate-950">Decision evidence</h3>
                    <div className="mt-4 space-y-3">
                      {selected.decisions.map((decision) => (
                        <div key={decision.uuid} className="rounded-xl border border-slate-200 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <StatusBadge status={decision.to_status} />
                            <time className="text-xs text-slate-500">{formatDateTime(decision.occurred_at)}</time>
                          </div>
                          {decision.reason ? (
                            <p className="mt-3 text-sm leading-6 text-slate-700">{decision.reason}</p>
                          ) : null}
                          <p className="mt-3 truncate font-mono text-xs text-slate-500" title={decision.decision_hash}>
                            {decision.decision_hash}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {selected.release ? (
                  <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Send aria-hidden="true" className="size-5 text-sky-700" />
                          <h3 className="font-semibold text-sky-950">Released outcome</h3>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-sky-800">
                          Employee and snapshotted-manager visibility was opened at{" "}
                          {formatDateTime(selected.release.occurred_at)} through a{" "}
                          {selected.release.release_mode.toLowerCase()} release.
                        </p>
                      </div>
                      <ReleaseStatusBadge status={selected.release_status} />
                    </div>
                    {selected.acknowledgement ? (
                      <div className="mt-4 rounded-xl bg-white p-4 ring-1 ring-inset ring-violet-200">
                        <p className="font-medium text-violet-950">
                          Employee receipt acknowledged
                        </p>
                        <p className="mt-1 text-sm text-violet-800">
                          Recorded {formatDateTime(selected.acknowledgement.occurred_at)} using{" "}
                          {selected.acknowledgement.statement_version}.
                        </p>
                      </div>
                    ) : (
                      <p className="mt-4 rounded-xl bg-white p-4 text-sm text-sky-900 ring-1 ring-inset ring-sky-200">
                        Acknowledgement is pending. It confirms receipt and does not waive the
                        employee&apos;s right to raise a dispute.
                      </p>
                    )}
                  </section>
                ) : null}

                {selected.capabilities.can_approve || selected.capabilities.can_reject ? (
                  <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                    <div>
                      <h3 className="font-semibold text-indigo-950">Record outcome decision</h3>
                      <p className="mt-1 text-sm text-indigo-800">
                        Decisions are final for this assembly and append immutable evidence.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 border-rose-300 text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                          setReason("");
                          setDialog({ kind: "REJECT", outcome: selected });
                        }}
                      >
                        <XCircle aria-hidden="true" className="size-4" />
                        Reject
                      </Button>
                      <Button
                        type="button"
                        className="min-h-11 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          setReason("");
                          setDialog({ kind: "APPROVE", outcome: selected });
                        }}
                      >
                        <CheckCircle2 aria-hidden="true" className="size-4" />
                        Approve outcome
                      </Button>
                    </div>
                  </section>
                ) : null}

                {selected.capabilities.can_release ? (
                  <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-5">
                    <div>
                      <h3 className="font-semibold text-sky-950">Release approved outcome</h3>
                      <p className="mt-1 text-sm text-sky-800">
                        This opens employee visibility, sends a notification, and appends immutable evidence.
                      </p>
                    </div>
                    <Button
                      type="button"
                      className="min-h-11 bg-sky-700 hover:bg-sky-800"
                      disabled={decisionPending}
                      onClick={() => setDialog({ kind: "RELEASE", outcome: selected })}
                    >
                      <Send aria-hidden="true" className="size-4" />
                      Release outcome
                    </Button>
                  </section>
                ) : null}

                {selected.capabilities.can_acknowledge ? (
                  <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5 sm:p-6">
                    <h3 className="font-semibold text-violet-950">Acknowledge receipt</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-violet-800">
                      By acknowledging, you confirm that you received and reviewed this outcome.
                      Acknowledgement does not mean you agree with it and does not limit dispute rights.
                    </p>
                    <Button
                      type="button"
                      className="mt-4 min-h-11 bg-violet-700 hover:bg-violet-800"
                      disabled={decisionPending}
                      onClick={() => setDialog({ kind: "ACKNOWLEDGE", outcome: selected })}
                    >
                      <BadgeCheck aria-hidden="true" className="size-4" />
                      Acknowledge receipt
                    </Button>
                  </section>
                ) : null}
              </article>
            ) : (
              <StatePanel
                title="No outcome selected"
                detail="Select a scorecard from the approval queue to inspect its rating and evidence."
              />
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open && !decisionPending) {
            setDialog(null);
            setReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog?.kind === "ASSEMBLE"
                ? `Assemble outcomes for ${dialog.cycleName}?`
                : dialog?.kind === "APPROVE"
                  ? `Approve ${dialog.outcome.display_name}'s outcome?`
                  : dialog?.kind === "REJECT"
                    ? `Reject ${dialog.outcome.display_name}'s outcome?`
                    : dialog?.kind === "RELEASE"
                      ? `Release ${dialog.outcome.display_name}'s outcome?`
                      : dialog?.kind === "BATCH_RELEASE"
                        ? `Release ${dialog.outcomes.length} approved outcomes?`
                        : `Acknowledge receipt of ${dialog?.outcome.display_name ?? "this"} outcome?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog?.kind === "ASSEMBLE"
                ? "This ingests completed calibration scores, derives final ratings from the pinned scale, and freezes one scorecard per participant."
                : dialog?.kind === "RELEASE" || dialog?.kind === "BATCH_RELEASE"
                  ? "Release is approved-only, opens the configured visibility gates, notifies each employee, and cannot be undone."
                  : dialog?.kind === "ACKNOWLEDGE"
                    ? "This confirms receipt only. It does not indicate agreement or waive dispute rights."
                    : "This versioned decision is appended to the evidence chain and cannot be edited."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {dialog?.kind === "APPROVE" || dialog?.kind === "REJECT" ? (
            <div>
              <label htmlFor="outcome-decision-reason" className="text-sm font-medium text-slate-800">
                {dialog?.kind === "REJECT" ? "Rejection reason" : "Approval note (optional)"}
              </label>
              <Textarea
                id="outcome-decision-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-2 min-h-28"
                aria-invalid={rejectReasonInvalid}
                aria-describedby={dialog?.kind === "REJECT" ? "outcome-reason-help" : undefined}
                placeholder={
                  dialog?.kind === "REJECT"
                    ? "Explain the evidence or policy concern requiring rejection."
                    : "Add context for the immutable approval record."
                }
              />
              {dialog?.kind === "REJECT" ? (
                <p
                  id="outcome-reason-help"
                  role={rejectReasonInvalid ? "alert" : undefined}
                  className={`mt-2 text-xs ${rejectReasonInvalid ? "text-rose-700" : "text-slate-500"}`}
                >
                  A reason of at least 10 characters is mandatory.
                </p>
              ) : null}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={decisionPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={decisionPending || rejectReasonInvalid}
              onClick={(event) => {
                event.preventDefault();
                confirmDialog();
              }}
              className={
                dialog?.kind === "REJECT"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : dialog?.kind === "RELEASE" || dialog?.kind === "BATCH_RELEASE"
                    ? "bg-sky-700 hover:bg-sky-800"
                    : dialog?.kind === "ACKNOWLEDGE"
                      ? "bg-violet-700 hover:bg-violet-800"
                      : "bg-emerald-600 hover:bg-emerald-700"
              }
            >
              {decisionPending ? (
                <RefreshCw aria-hidden="true" className="size-4 animate-spin" />
              ) : dialog?.kind === "REJECT" ? (
                <XCircle aria-hidden="true" className="size-4" />
              ) : dialog?.kind === "RELEASE" || dialog?.kind === "BATCH_RELEASE" ? (
                <Send aria-hidden="true" className="size-4" />
              ) : (
                <CheckCircle2 aria-hidden="true" className="size-4" />
              )}
              {dialog?.kind === "ASSEMBLE"
                ? "Assemble scorecards"
                : dialog?.kind === "APPROVE"
                  ? "Confirm approval"
                  : dialog?.kind === "REJECT"
                    ? "Confirm rejection"
                    : dialog?.kind === "RELEASE"
                      ? "Release outcome"
                      : dialog?.kind === "BATCH_RELEASE"
                        ? "Release selected"
                        : "Acknowledge receipt"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function StatePanel({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <AlertCircle aria-hidden="true" className="mx-auto size-8 text-slate-400" />
      <h2 className="mt-4 font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{detail}</p>
      {onRetry ? (
        <Button type="button" variant="outline" className="mt-5 min-h-11" onClick={onRetry}>
          <RefreshCw aria-hidden="true" className="size-4" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading outcome scorecard">
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-52 rounded-2xl" />
    </div>
  );
}
