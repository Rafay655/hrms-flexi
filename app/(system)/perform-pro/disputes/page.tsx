"use client";

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  FileText,
  Fingerprint,
  Gavel,
  Link2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Trash2,
  Undo2,
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
  PerformProDisputeEligibleOutcome,
  PerformProDisputeEvidenceInput,
  PerformProOutcomeDispute,
  PerformProOutcomeDisputeCategory,
  PerformProOutcomeDisputeEvidence,
  PerformProOutcomeDisputeResolution,
  PerformProOutcomeDisputeStatus,
} from "@/types/performpro";

type ActionDialog =
  | { kind: "RESPONSE" | "RESOLVE" | "WITHDRAW"; dispute: PerformProOutcomeDispute }
  | null;

const statusStyles: Record<PerformProOutcomeDisputeStatus, string> = {
  OPEN: "bg-amber-50 text-amber-900 ring-amber-200",
  UNDER_REVIEW: "bg-sky-50 text-sky-900 ring-sky-200",
  RESOLVED: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  WITHDRAWN: "bg-slate-100 text-slate-700 ring-slate-200",
};

const categories: { value: PerformProOutcomeDisputeCategory; label: string }[] = [
  { value: "RATING", label: "Final rating" },
  { value: "SCORE", label: "Final score" },
  { value: "PROCESS", label: "Review process" },
  { value: "EVIDENCE", label: "Evidence considered" },
  { value: "OTHER", label: "Other concern" },
];

const resolutions: {
  value: PerformProOutcomeDisputeResolution;
  label: string;
}[] = [
  { value: "UPHELD", label: "Upheld" },
  { value: "PARTIALLY_UPHELD", label: "Partially upheld" },
  { value: "NOT_UPHELD", label: "Not upheld" },
  { value: "ADMINISTRATIVE_CORRECTION", label: "Administrative correction" },
  { value: "OTHER", label: "Other resolution" },
];

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

function StatusBadge({ status }: { status: PerformProOutcomeDisputeStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}>
      {humanize(status)}
    </span>
  );
}

function emptyEvidence(): PerformProDisputeEvidenceInput {
  return {
    type: "NOTE",
    title: "",
    description: "",
  };
}

export default function OutcomeDisputesPage() {
  const queryClient = useQueryClient();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PerformProOutcomeDisputeStatus | "ALL">("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [outcomeUuid, setOutcomeUuid] = useState("");
  const [category, setCategory] = useState<PerformProOutcomeDisputeCategory>("SCORE");
  const [reason, setReason] = useState("");
  const [requestedResolution, setRequestedResolution] = useState("");
  const [createEvidence, setCreateEvidence] = useState<PerformProDisputeEvidenceInput[]>([]);
  const [dialog, setDialog] = useState<ActionDialog>(null);
  const [actionNarrative, setActionNarrative] = useState("");
  const [resolution, setResolution] = useState<PerformProOutcomeDisputeResolution>("NOT_UPHELD");
  const [actionEvidence, setActionEvidence] = useState<PerformProDisputeEvidenceInput[]>([]);

  const queueQuery = useQuery({
    queryKey: ["perform-pro", "disputes"],
    queryFn: performProService.outcomeDisputes,
  });
  const eligibleOutcomes = queueQuery.data?.eligible_outcomes ?? [];
  const selectedOutcomeUuid = eligibleOutcomes.some((outcome) => outcome.uuid === outcomeUuid)
    ? outcomeUuid
    : eligibleOutcomes[0]?.uuid ?? "";
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (queueQuery.data?.disputes ?? []).filter((dispute) => (
      (statusFilter === "ALL" || dispute.status === statusFilter)
      && (
        needle === ""
        || dispute.case_reference.toLowerCase().includes(needle)
        || dispute.display_name.toLowerCase().includes(needle)
        || dispute.cycle_name.toLowerCase().includes(needle)
      )
    ));
  }, [queueQuery.data?.disputes, search, statusFilter]);
  const activeSelectedUuid = filtered.some((dispute) => dispute.uuid === selectedUuid)
    ? selectedUuid
    : filtered[0]?.uuid ?? null;
  const detailQuery = useQuery({
    queryKey: ["perform-pro", "disputes", activeSelectedUuid],
    queryFn: () => performProService.outcomeDispute(activeSelectedUuid!),
    enabled: Boolean(activeSelectedUuid),
  });

  const submitMutation = useMutation({
    mutationFn: (outcome: PerformProDisputeEligibleOutcome) =>
      performProService.submitOutcomeDispute({
        outcome,
        category,
        reason,
        requestedResolution,
        evidence: createEvidence,
      }),
    onSuccess: async (dispute) => {
      await queryClient.invalidateQueries({ queryKey: ["perform-pro", "disputes"] });
      queryClient.setQueryData(["perform-pro", "disputes", dispute.uuid], dispute);
      setSelectedUuid(dispute.uuid);
      setShowCreate(false);
      setReason("");
      setRequestedResolution("");
      setCreateEvidence([]);
      toast.success(`Dispute ${dispute.case_reference} submitted with immutable evidence.`);
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "Unable to submit the dispute.") }),
  });

  const responseMutation = useMutation({
    mutationFn: (dispute: PerformProOutcomeDispute) =>
      performProService.respondToOutcomeDispute({
        dispute,
        response: actionNarrative,
        evidence: actionEvidence,
      }),
    onSuccess: handleActionSuccess,
    onError: handleActionError,
  });
  const resolveMutation = useMutation({
    mutationFn: (dispute: PerformProOutcomeDispute) =>
      performProService.resolveOutcomeDispute({
        dispute,
        resolution,
        summary: actionNarrative,
        evidence: actionEvidence,
      }),
    onSuccess: handleActionSuccess,
    onError: handleActionError,
  });
  const withdrawMutation = useMutation({
    mutationFn: (dispute: PerformProOutcomeDispute) =>
      performProService.withdrawOutcomeDispute(dispute, actionNarrative),
    onSuccess: handleActionSuccess,
    onError: handleActionError,
  });

  async function handleActionSuccess(dispute: PerformProOutcomeDispute) {
    queryClient.setQueryData(["perform-pro", "disputes", dispute.uuid], dispute);
    await queryClient.invalidateQueries({ queryKey: ["perform-pro", "disputes"] });
    setDialog(null);
    setActionNarrative("");
    setActionEvidence([]);
    toast.success(`Case ${dispute.case_reference} updated with immutable evidence.`);
  }

  async function handleActionError(error: unknown) {
    if (isAxiosError(error) && error.response?.status === 409) {
      await Promise.all([queueQuery.refetch(), detailQuery.refetch()]);
      setDialog(null);
      toast.error(
        "This case changed in another window. The latest timeline is loaded; review it before retrying.",
      );
      return;
    }
    toast.error(apiMessage(error, "Unable to update the dispute case."));
  }

  const createInvalid = reason.trim().length < 20
    || (requestedResolution.trim() !== "" && requestedResolution.trim().length < 10)
    || evidenceInvalid(createEvidence);
  const actionMinimum = dialog?.kind === "RESOLVE" ? 20 : 10;
  const actionInvalid = actionNarrative.trim().length < actionMinimum
    || (dialog?.kind !== "WITHDRAW" && evidenceInvalid(actionEvidence));
  const pending = submitMutation.isPending
    || responseMutation.isPending
    || resolveMutation.isPending
    || withdrawMutation.isPending;
  const summary = queueQuery.data?.summary;
  const selected = detailQuery.data;

  function openAction(kind: NonNullable<ActionDialog>["kind"], dispute: PerformProOutcomeDispute) {
    setActionNarrative("");
    setActionEvidence([]);
    setResolution("NOT_UPHELD");
    setDialog({ kind, dispute });
  }

  function confirmAction() {
    if (!dialog || actionInvalid) return;
    if (dialog.kind === "RESPONSE") responseMutation.mutate(dialog.dispute);
    if (dialog.kind === "RESOLVE") resolveMutation.mutate(dialog.dispute);
    if (dialog.kind === "WITHDRAW") withdrawMutation.mutate(dialog.dispute);
  }

  return (
    <main className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-700 text-white">
                <Scale aria-hidden="true" className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                  PerformPro
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  Outcome disputes
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Submit and review confidential outcome concerns through a versioned case
                  timeline with immutable evidence, responses, and resolution records.
                </p>
              </div>
            </div>
            <div className="flex max-w-sm items-start gap-2 rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-900 ring-1 ring-inset ring-violet-200">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              Case notifications contain metadata only; reasons and evidence remain inside PerformPro.
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Dispute case summary">
          {[
            { label: "All cases", value: summary?.total ?? 0, icon: FileText, tone: "text-slate-700" },
            { label: "Open", value: summary?.open ?? 0, icon: AlertCircle, tone: "text-amber-700" },
            { label: "Under review", value: summary?.under_review ?? 0, icon: Search, tone: "text-sky-700" },
            { label: "Resolved", value: summary?.resolved ?? 0, icon: CheckCircle2, tone: "text-emerald-700" },
            { label: "Withdrawn", value: summary?.withdrawn ?? 0, icon: Undo2, tone: "text-slate-600" },
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

        {queueQuery.data?.capabilities.can_create && eligibleOutcomes.length > 0 ? (
          <section className="mt-6 rounded-2xl border border-violet-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-950">Raise an outcome dispute</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  A dispute records your concern; it does not change or withdraw acknowledgement.
                </p>
              </div>
              <Button
                type="button"
                variant={showCreate ? "outline" : "default"}
                className={showCreate ? "min-h-11" : "min-h-11 bg-violet-700 hover:bg-violet-800"}
                onClick={() => setShowCreate((value) => !value)}
              >
                {showCreate ? "Close form" : (
                  <>
                    <Plus aria-hidden="true" className="size-4" />
                    Start dispute
                  </>
                )}
              </Button>
            </div>
            {showCreate ? (
              <form
                className="mt-6 border-t border-slate-200 pt-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  const outcome = eligibleOutcomes.find((item) => item.uuid === selectedOutcomeUuid);
                  if (outcome && !createInvalid) submitMutation.mutate(outcome);
                }}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="dispute-outcome" className="text-sm font-medium text-slate-800">
                      Released outcome
                    </label>
                    <select
                      id="dispute-outcome"
                      value={selectedOutcomeUuid}
                      onChange={(event) => setOutcomeUuid(event.target.value)}
                      className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
                    >
                      {eligibleOutcomes.map((outcome) => (
                        <option key={outcome.uuid} value={outcome.uuid}>
                          {outcome.cycle_name} · {outcome.rating.label} ({outcome.final_score.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dispute-category" className="text-sm font-medium text-slate-800">
                      Concern category
                    </label>
                    <select
                      id="dispute-category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value as PerformProOutcomeDisputeCategory)}
                      className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
                    >
                      {categories.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-5">
                  <label htmlFor="dispute-reason" className="text-sm font-medium text-slate-800">
                    Detailed reason
                  </label>
                  <Textarea
                    id="dispute-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="mt-2 min-h-32"
                    aria-describedby="dispute-reason-help"
                    aria-invalid={reason.length > 0 && reason.trim().length < 20}
                    placeholder="Explain the score, rating, process, or evidence concern."
                  />
                  <p id="dispute-reason-help" className="mt-2 text-xs text-slate-500">
                    At least 20 characters. Be specific and factual.
                  </p>
                </div>
                <div className="mt-5">
                  <label htmlFor="requested-resolution" className="text-sm font-medium text-slate-800">
                    Requested resolution (optional)
                  </label>
                  <Textarea
                    id="requested-resolution"
                    value={requestedResolution}
                    onChange={(event) => setRequestedResolution(event.target.value)}
                    className="mt-2 min-h-24"
                    placeholder="Describe the review or correction you are requesting."
                  />
                </div>
                <EvidenceEditor items={createEvidence} onChange={setCreateEvidence} />
                <div className="mt-6 flex justify-end">
                  <Button
                    type="submit"
                    className="min-h-11 bg-violet-700 hover:bg-violet-800"
                    disabled={createInvalid || pending}
                  >
                    {submitMutation.isPending ? (
                      <RefreshCw aria-hidden="true" className="size-4 animate-spin" />
                    ) : (
                      <Scale aria-hidden="true" className="size-4" />
                    )}
                    Submit dispute
                  </Button>
                </div>
              </form>
            ) : null}
          </section>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-4">
            <div>
              <h2 className="font-semibold text-slate-950">Case queue</h2>
              <p className="mt-1 text-xs text-slate-500">{filtered.length} visible cases</p>
            </div>
            <div className="mt-4 space-y-3">
              <div className="relative">
                <label htmlFor="dispute-search" className="sr-only">Search dispute cases</label>
                <Search aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-slate-400" />
                <Input
                  id="dispute-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search case, employee, cycle"
                  className="min-h-11 pl-9"
                />
              </div>
              <label htmlFor="dispute-status" className="sr-only">Filter by case status</label>
              <select
                id="dispute-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as PerformProOutcomeDisputeStatus | "ALL")}
                className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
              >
                <option value="ALL">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="UNDER_REVIEW">Under review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>
            <div className="mt-4 space-y-2">
              {queueQuery.isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 rounded-xl" />
                ))
                : filtered.map((dispute) => (
                  <button
                    key={dispute.uuid}
                    type="button"
                    aria-current={activeSelectedUuid === dispute.uuid ? "true" : undefined}
                    onClick={() => setSelectedUuid(dispute.uuid)}
                    className={`w-full cursor-pointer rounded-xl border p-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 ${
                      activeSelectedUuid === dispute.uuid
                        ? "border-violet-300 bg-violet-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-950">{dispute.case_reference}</span>
                      <StatusBadge status={dispute.status} />
                    </span>
                    <span className="mt-2 block text-sm text-slate-700">{dispute.display_name}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {dispute.cycle_name} · {humanize(dispute.category)}
                    </span>
                  </button>
                ))}
            </div>
            {!queueQuery.isLoading && filtered.length === 0 ? (
              <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                No dispute cases match this filter.
              </p>
            ) : null}
          </aside>

          <div>
            {queueQuery.isError ? (
              <StatePanel
                title="Dispute queue unavailable"
                detail={apiMessage(queueQuery.error, "The case queue could not be loaded.")}
                onRetry={() => queueQuery.refetch()}
              />
            ) : detailQuery.isLoading ? (
              <div className="space-y-5">
                <Skeleton className="h-72 rounded-2xl" />
                <Skeleton className="h-96 rounded-2xl" />
              </div>
            ) : detailQuery.isError ? (
              <StatePanel
                title="Case unavailable"
                detail={apiMessage(detailQuery.error, "The selected dispute could not be loaded.")}
                onRetry={() => detailQuery.refetch()}
              />
            ) : selected ? (
              <article className="space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-semibold text-slate-950">{selected.case_reference}</h2>
                        <StatusBadge status={selected.status} />
                      </div>
                      <p className="mt-2 font-medium text-slate-800">{selected.display_name}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {selected.cycle_name} · {humanize(selected.category)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-violet-50 px-4 py-3 text-right ring-1 ring-inset ring-violet-200">
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Case version</p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums text-violet-950">{selected.lock_version}</p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">Employee reason</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.reason}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">Requested resolution</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {selected.requested_resolution ?? "No specific resolution requested."}
                      </p>
                    </div>
                  </div>
                  {selected.evidence.length > 0 ? (
                    <EvidenceList evidence={selected.evidence} />
                  ) : null}
                </section>

                {selected.resolution ? (
                  <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
                    <div className="flex items-center gap-2">
                      <BadgeCheck aria-hidden="true" className="size-5 text-emerald-700" />
                      <h3 className="font-semibold text-emerald-950">
                        {humanize(selected.resolution.code)}
                      </h3>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-emerald-900">
                      {selected.resolution.summary}
                    </p>
                    <p className="mt-3 text-xs text-emerald-800">
                      Resolved {formatDateTime(selected.resolution.resolved_at)}
                    </p>
                  </section>
                ) : null}

                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <MessageSquareText aria-hidden="true" className="size-5 text-violet-700" />
                    <h3 className="font-semibold text-slate-950">Immutable case timeline</h3>
                  </div>
                  <ol className="mt-5 space-y-4">
                    {(selected.events ?? []).map((event, index) => (
                      <li key={event.uuid} className="relative pl-8">
                        {index < (selected.events?.length ?? 0) - 1 ? (
                          <span aria-hidden="true" className="absolute left-[11px] top-7 h-[calc(100%+0.5rem)] w-px bg-slate-200" />
                        ) : null}
                        <span className="absolute left-0 top-1 grid size-6 place-items-center rounded-full bg-violet-100 text-violet-800 ring-4 ring-white">
                          <span className="text-[10px] font-bold">{event.resulting_dispute_version}</span>
                        </span>
                        <div className="rounded-xl border border-slate-200 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-950">{humanize(event.event_type)}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {humanize(event.actor_role)} · {formatDateTime(event.occurred_at)}
                              </p>
                            </div>
                            <StatusBadge status={event.to_status} />
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {event.narrative}
                          </p>
                          {event.evidence.length > 0 ? <EvidenceList evidence={event.evidence} compact /> : null}
                          <p className="mt-3 truncate font-mono text-xs text-slate-500" title={event.event_hash}>
                            {event.event_hash}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Fingerprint aria-hidden="true" className="size-5 text-violet-700" />
                    <h3 className="font-semibold text-slate-950">Evidence chain</h3>
                  </div>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <HashValue label="Source outcome" value={selected.evidence_chain.source_outcome_evidence_hash} />
                    <HashValue label="Source release" value={selected.evidence_chain.source_release_hash} />
                    <HashValue label="Submitted dispute" value={selected.evidence_chain.dispute_hash} />
                    <HashValue label="Current case evidence" value={selected.evidence_chain.current_evidence_hash} />
                  </dl>
                </section>

                {selected.capabilities.can_respond || selected.capabilities.can_resolve || selected.capabilities.can_withdraw ? (
                  <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-200 bg-violet-50 p-5">
                    <div>
                      <h3 className="font-semibold text-violet-950">Case actions</h3>
                      <p className="mt-1 text-sm text-violet-800">
                        Each action advances the case version and appends immutable evidence.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selected.capabilities.can_withdraw ? (
                        <Button type="button" variant="outline" className="min-h-11" onClick={() => openAction("WITHDRAW", selected)}>
                          <Undo2 aria-hidden="true" className="size-4" />
                          Withdraw
                        </Button>
                      ) : null}
                      {selected.capabilities.can_respond ? (
                        <Button type="button" variant="outline" className="min-h-11 border-sky-300 text-sky-800 hover:bg-sky-50" onClick={() => openAction("RESPONSE", selected)}>
                          <MessageSquareText aria-hidden="true" className="size-4" />
                          Add response
                        </Button>
                      ) : null}
                      {selected.capabilities.can_resolve ? (
                        <Button type="button" className="min-h-11 bg-emerald-700 hover:bg-emerald-800" onClick={() => openAction("RESOLVE", selected)}>
                          <Gavel aria-hidden="true" className="size-4" />
                          Resolve case
                        </Button>
                      ) : null}
                    </div>
                  </section>
                ) : null}
              </article>
            ) : (
              <StatePanel
                title="No dispute selected"
                detail="Select a case from the queue, or submit a dispute for an eligible released outcome."
              />
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setDialog(null);
            setActionNarrative("");
            setActionEvidence([]);
          }
        }}
      >
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog?.kind === "RESPONSE"
                ? `Respond to ${dialog.dispute.case_reference}`
                : dialog?.kind === "RESOLVE"
                  ? `Resolve ${dialog.dispute.case_reference}`
                  : `Withdraw ${dialog?.dispute.case_reference ?? "this dispute"}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog?.kind === "WITHDRAW"
                ? "Withdrawal closes this case. A new case can be submitted later while the release phase remains open."
                : "The narrative and supporting references become permanent entries in the confidential case timeline."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {dialog?.kind === "RESOLVE" ? (
            <div>
              <label htmlFor="dispute-resolution" className="text-sm font-medium text-slate-800">
                Resolution
              </label>
              <select
                id="dispute-resolution"
                value={resolution}
                onChange={(event) => setResolution(event.target.value as PerformProOutcomeDisputeResolution)}
                className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
              >
                {resolutions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label htmlFor="dispute-action-narrative" className="text-sm font-medium text-slate-800">
              {dialog?.kind === "RESPONSE"
                ? "Response"
                : dialog?.kind === "RESOLVE"
                  ? "Resolution summary"
                  : "Withdrawal reason"}
            </label>
            <Textarea
              id="dispute-action-narrative"
              value={actionNarrative}
              onChange={(event) => setActionNarrative(event.target.value)}
              className="mt-2 min-h-32"
              aria-invalid={actionNarrative.length > 0 && actionNarrative.trim().length < actionMinimum}
            />
            <p className="mt-2 text-xs text-slate-500">
              At least {actionMinimum} characters.
            </p>
          </div>
          {dialog?.kind !== "WITHDRAW" ? (
            <EvidenceEditor items={actionEvidence} onChange={setActionEvidence} />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending || actionInvalid}
              onClick={(event) => {
                event.preventDefault();
                confirmAction();
              }}
              className={
                dialog?.kind === "WITHDRAW"
                  ? "bg-slate-700 hover:bg-slate-800"
                  : dialog?.kind === "RESOLVE"
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-sky-700 hover:bg-sky-800"
              }
            >
              {pending ? <RefreshCw aria-hidden="true" className="size-4 animate-spin" /> : null}
              {dialog?.kind === "RESPONSE"
                ? "Append response"
                : dialog?.kind === "RESOLVE"
                  ? "Confirm resolution"
                  : "Confirm withdrawal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function evidenceInvalid(items: PerformProDisputeEvidenceInput[]) {
  return items.some((item) => (
    item.title.trim().length < 3
    || (item.type === "NOTE" && item.description.trim().length < 10)
    || (item.type === "LINK" && !/^https?:\/\/\S+$/i.test(item.url ?? ""))
    || (item.type === "DOCUMENT" && !item.document_uuid?.trim())
  ));
}

function EvidenceEditor({
  items,
  onChange,
}: {
  items: PerformProDisputeEvidenceInput[];
  onChange: (items: PerformProDisputeEvidenceInput[]) => void;
}) {
  function update(index: number, patch: Partial<PerformProDisputeEvidenceInput>) {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  return (
    <fieldset className="mt-6 rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <legend className="font-semibold text-slate-950">Supporting evidence</legend>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Add notes, secure DMS document UUIDs, or HTTP/HTTPS references. Maximum 10.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={items.length >= 10}
          onClick={() => onChange([...items, emptyEvidence()])}
        >
          <Plus aria-hidden="true" className="size-4" />
          Add evidence
        </Button>
      </div>
      <div className="mt-4 space-y-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
            <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)_44px]">
              <div>
                <label htmlFor={`evidence-type-${index}`} className="text-xs font-medium text-slate-700">Type</label>
                <select
                  id={`evidence-type-${index}`}
                  value={item.type}
                  onChange={(event) => update(index, {
                    type: event.target.value as PerformProDisputeEvidenceInput["type"],
                    document_uuid: "",
                    url: "",
                  })}
                  className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                >
                  <option value="NOTE">Evidence note</option>
                  <option value="DOCUMENT">DMS document</option>
                  <option value="LINK">Web reference</option>
                </select>
              </div>
              <div>
                <label htmlFor={`evidence-title-${index}`} className="text-xs font-medium text-slate-700">Title</label>
                <Input
                  id={`evidence-title-${index}`}
                  value={item.title}
                  onChange={(event) => update(index, { title: event.target.value })}
                  className="mt-1 min-h-11 bg-white"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-5 size-11 text-rose-700 hover:bg-rose-50"
                aria-label={`Remove evidence item ${index + 1}`}
                onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </div>
            {item.type === "DOCUMENT" ? (
              <div className="mt-4">
                <label htmlFor={`evidence-document-${index}`} className="text-xs font-medium text-slate-700">DMS document UUID</label>
                <Input
                  id={`evidence-document-${index}`}
                  value={item.document_uuid ?? ""}
                  onChange={(event) => update(index, { document_uuid: event.target.value })}
                  className="mt-1 min-h-11 bg-white font-mono"
                  placeholder="00000000-0000-4000-8000-000000000000"
                />
              </div>
            ) : null}
            {item.type === "LINK" ? (
              <div className="mt-4">
                <label htmlFor={`evidence-url-${index}`} className="text-xs font-medium text-slate-700">HTTP/HTTPS URL</label>
                <Input
                  id={`evidence-url-${index}`}
                  value={item.url ?? ""}
                  onChange={(event) => update(index, { url: event.target.value })}
                  className="mt-1 min-h-11 bg-white"
                  placeholder="https://"
                />
              </div>
            ) : null}
            <div className="mt-4">
              <label htmlFor={`evidence-description-${index}`} className="text-xs font-medium text-slate-700">
                {item.type === "NOTE" ? "Evidence note" : "Description (optional)"}
              </label>
              <Textarea
                id={`evidence-description-${index}`}
                value={item.description}
                onChange={(event) => update(index, { description: event.target.value })}
                className="mt-1 min-h-20 bg-white"
              />
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function EvidenceList({
  evidence,
  compact = false,
}: {
  evidence: PerformProOutcomeDisputeEvidence[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mt-4 space-y-2" : "mt-6 space-y-2"}>
      {!compact ? <h3 className="text-sm font-semibold text-slate-950">Supporting evidence</h3> : null}
      {evidence.map((item, index) => (
        <div key={`${item.title}-${index}`} className="rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
          <div className="flex items-start gap-2">
            {item.type === "LINK" ? (
              <Link2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-violet-700" />
            ) : (
              <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-violet-700" />
            )}
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{item.title}</p>
              {item.description ? <p className="mt-1 text-sm leading-5 text-slate-600">{item.description}</p> : null}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-sm font-medium text-violet-700 underline decoration-violet-300 underline-offset-4 hover:text-violet-900"
                >
                  Open reference
                </a>
              ) : null}
              {item.document ? (
                <p className="mt-2 font-mono text-xs text-slate-500">
                  {item.document.original_name} · v{item.document.version} · {item.document.uuid}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HashValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 truncate font-mono text-xs text-slate-800" title={value}>{value}</dd>
    </div>
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
