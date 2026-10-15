"use client";

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Fingerprint,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { performProService } from "@/services/performpro";
import type {
  PerformProInitiatePipInput,
  PerformProPipActionType,
  PerformProPipCase,
  PerformProPipClosureOutcome,
  PerformProPipHealth,
  PerformProPipOwnerRole,
  PerformProPipProgressUpdateInput,
  PerformProPipReviewerRole,
  PerformProPipStatus,
} from "@/types/performpro";

type ObjectiveDraft = PerformProInitiatePipInput["objectives"][number];
type ReviewDraft = PerformProInitiatePipInput["reviews"][number];
type Decision = "approve" | "reject" | "release";
type ExecutionAction =
  | "check-in"
  | "review"
  | "extend"
  | "successful"
  | "unsuccessful"
  | "escalate"
  | "acknowledge";
type ExecutionCommand =
  | {
      action: "check-in";
      summary: string;
      blockers: string;
      supportNeeded: string;
      updates: PerformProPipProgressUpdateInput[];
      evidenceNote: string;
    }
  | {
      action: "review";
      reviewUuid: string;
      reviewOutcome: "ON_TRACK" | "AT_RISK" | "OFF_TRACK";
      summary: string;
      employeeComments: string;
      managerAssessment: string;
      hrComments: string;
      supportActions: string;
      evidenceNote: string;
    }
  | {
      action: "extend";
      newEndDate: string;
      reason: string;
      reviewDate: string;
      reviewerRole: PerformProPipReviewerRole;
      reviewTitle: string;
      reviewAgenda: string;
    }
  | {
      action: "successful" | "unsuccessful" | "escalate";
      summary: string;
      reason: string;
      evidenceNote: string;
    }
  | { action: "acknowledge" };

const statusStyles: Record<PerformProPipStatus, string> = {
  PENDING_APPROVAL: "bg-amber-50 text-amber-900 ring-amber-200",
  APPROVED: "bg-sky-50 text-sky-900 ring-sky-200",
  REJECTED: "bg-rose-50 text-rose-900 ring-rose-200",
  RELEASED: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  COMPLETED_SUCCESSFULLY: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  COMPLETED_UNSUCCESSFULLY: "bg-rose-50 text-rose-900 ring-rose-200",
  ESCALATED: "bg-violet-50 text-violet-900 ring-violet-200",
};

const healthStyles: Record<PerformProPipHealth, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700",
  ON_TRACK: "bg-emerald-100 text-emerald-800",
  AT_RISK: "bg-amber-100 text-amber-900",
  OFF_TRACK: "bg-rose-100 text-rose-900",
  SUCCESSFUL: "bg-emerald-100 text-emerald-800",
  UNSUCCESSFUL: "bg-rose-100 text-rose-900",
  ESCALATED: "bg-violet-100 text-violet-900",
};

const ownerRoles: { value: PerformProPipOwnerRole; label: string }[] = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "MANAGER", label: "Manager" },
  { value: "SHARED", label: "Shared" },
];

const actionTypes: { value: PerformProPipActionType; label: string }[] = [
  { value: "DELIVERABLE", label: "Deliverable" },
  { value: "TRAINING", label: "Training" },
  { value: "COACHING", label: "Coaching" },
  { value: "SUPPORT", label: "Support" },
  { value: "OTHER", label: "Other" },
];

const reviewerRoles: { value: PerformProPipReviewerRole; label: string }[] = [
  { value: "MANAGER", label: "Manager" },
  { value: "HR", label: "HR" },
  { value: "BOTH", label: "Manager and HR" },
];

function futureDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function emptyObjective(weight = 100): ObjectiveDraft {
  return {
    title: "",
    issue_description: "",
    success_criteria: "",
    measurement_method: "",
    baseline: "",
    target: "",
    weight,
    target_date: futureDate(60),
    actions: [{
      owner_role: "EMPLOYEE",
      action_type: "DELIVERABLE",
      title: "",
      description: "",
      due_date: futureDate(45),
    }],
  };
}

function emptyReview(): ReviewDraft {
  return {
    review_date: futureDate(30),
    reviewer_role: "BOTH",
    title: "Progress review",
    agenda: "",
  };
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" })
    .format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function apiMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return error instanceof Error ? error.message : fallback;
  return error.response?.data?.error?.message
    ?? error.response?.data?.message
    ?? fallback;
}

function shortHash(value: string | null | undefined) {
  return value ? `${value.slice(0, 12)}…${value.slice(-8)}` : "Not recorded";
}

export default function PipPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [executionAction, setExecutionAction] = useState<ExecutionAction | null>(null);
  const [reason, setReason] = useState("");
  const [outcomeUuid, setOutcomeUuid] = useState("");
  const [triggerType, setTriggerType] = useState<"OUTCOME" | "MANAGER">("OUTCOME");
  const [triggerReason, setTriggerReason] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [startDate, setStartDate] = useState(futureDate(1));
  const [endDate, setEndDate] = useState(futureDate(90));
  const [expectations, setExpectations] = useState("");
  const [support, setSupport] = useState("");
  const [consequences, setConsequences] = useState("");
  const [objectives, setObjectives] = useState<ObjectiveDraft[]>([emptyObjective()]);
  const [reviews, setReviews] = useState<ReviewDraft[]>([emptyReview()]);
  const [evidenceNote, setEvidenceNote] = useState("");

  const queueQuery = useQuery({
    queryKey: ["perform-pro", "pip-cases"],
    queryFn: performProService.pipCases,
  });
  const detailQuery = useQuery({
    queryKey: ["perform-pro", "pip-cases", selectedUuid],
    queryFn: () => performProService.pipCase(selectedUuid!),
    enabled: Boolean(selectedUuid),
  });

  const queue = queueQuery.data;
  const selected = detailQuery.data
    ?? queue?.cases.find((item) => item.uuid === selectedUuid)
    ?? null;
  const filteredCases = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return queue?.cases ?? [];
    return (queue?.cases ?? []).filter((item) =>
      [item.display_name, item.case_reference, item.title, item.cycle_name]
        .some((value) => value.toLowerCase().includes(needle)));
  }, [queue?.cases, search]);

  async function refresh(updated?: PerformProPipCase) {
    await queryClient.invalidateQueries({ queryKey: ["perform-pro", "pip-cases"] });
    if (updated) {
      setSelectedUuid(updated.uuid);
      queryClient.setQueryData(["perform-pro", "pip-cases", updated.uuid], updated);
    }
  }

  const createMutation = useMutation({
    mutationFn: performProService.initiatePipCase,
    onSuccess: async (created) => {
      toast.success("Improvement plan submitted for HR approval.");
      setShowCreate(false);
      await refresh(created);
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "Unable to initiate the improvement plan.") }),
  });
  const decisionMutation = useMutation({
    mutationFn: async () => {
      if (!selected || !decision) throw new Error("Select a case action.");
      return decision === "release"
        ? performProService.releasePipCase(selected, reason)
        : performProService.decidePipCase(selected, decision, reason);
    },
    onSuccess: async (updated) => {
      toast.success(decision === "approve"
        ? "Plan approved."
        : decision === "reject"
          ? "Plan rejected."
          : "Plan released to the employee.");
      setDecision(null);
      setReason("");
      await refresh(updated);
    },
    onError: async (error) => {
      showApiError(error, { fallbackMessage: apiMessage(error, "Unable to complete the case action.") });
      if (isAxiosError(error) && error.response?.status === 409 && selectedUuid) {
        await detailQuery.refetch();
      }
    },
  });
  const executionMutation = useMutation({
    mutationFn: async (command: ExecutionCommand) => {
      if (!selected) throw new Error("Select an improvement plan.");
      const evidence = "evidenceNote" in command && command.evidenceNote.trim().length >= 10
        ? [{
            type: "NOTE" as const,
            title: "PIP execution evidence",
            description: command.evidenceNote.trim(),
          }]
        : [];
      switch (command.action) {
        case "check-in":
          return performProService.checkInPipCase({
            pipCase: selected,
            summary: command.summary,
            blockers: command.blockers,
            supportNeeded: command.supportNeeded,
            updates: command.updates,
            evidence,
          });
        case "review":
          return performProService.reviewPipCase({
            pipCase: selected,
            reviewUuid: command.reviewUuid,
            reviewOutcome: command.reviewOutcome,
            summary: command.summary,
            employeeComments: command.employeeComments,
            managerAssessment: command.managerAssessment,
            hrComments: command.hrComments,
            supportActions: command.supportActions,
            evidence,
          });
        case "extend":
          return performProService.extendPipCase({
            pipCase: selected,
            newEndDate: command.newEndDate,
            reason: command.reason,
            reviews: [{
              review_date: command.reviewDate,
              reviewer_role: command.reviewerRole,
              title: command.reviewTitle,
              agenda: command.reviewAgenda,
            }],
          });
        case "successful":
        case "unsuccessful":
        case "escalate": {
          const outcomes: Record<typeof command.action, PerformProPipClosureOutcome> = {
            successful: "SUCCESSFUL",
            unsuccessful: "UNSUCCESSFUL",
            escalate: "ESCALATED",
          };
          return performProService.closePipCase({
            pipCase: selected,
            outcome: outcomes[command.action],
            summary: command.summary,
            reason: command.reason,
            evidence,
          });
        }
        case "acknowledge":
          return performProService.acknowledgePipCase(selected);
      }
    },
    onSuccess: async (updated) => {
      toast.success("Improvement plan updated.");
      setExecutionAction(null);
      await refresh(updated);
    },
    onError: async (error) => {
      showApiError(error, { fallbackMessage: apiMessage(error, "Unable to update the improvement plan.") });
      if (isAxiosError(error) && error.response?.status === 409 && selectedUuid) {
        await detailQuery.refetch();
      }
    },
  });

  const totalWeight = objectives.reduce((sum, objective) => sum + Number(objective.weight), 0);
  const createInvalid = !queue?.eligible_outcomes.find((item) => item.uuid === outcomeUuid)
    || triggerReason.trim().length < 20
    || title.trim().length < 5
    || summary.trim().length < 20
    || expectations.trim().length < 20
    || support.trim().length < 20
    || consequences.trim().length < 20
    || totalWeight !== 100
    || objectives.some((objective) =>
      objective.title.trim().length < 5
      || objective.issue_description.trim().length < 20
      || objective.success_criteria.trim().length < 10
      || objective.measurement_method.trim().length < 10
      || objective.baseline.trim().length < 3
      || objective.target.trim().length < 3
      || objective.actions.length === 0
      || objective.actions.some((action) => action.title.trim().length < 3))
    || reviews.length === 0
    || reviews.some((review) =>
      review.title.trim().length < 3 || review.agenda.trim().length < 10);

  function submitCreate() {
    const outcome = queue?.eligible_outcomes.find((item) => item.uuid === outcomeUuid);
    if (!outcome || createInvalid) return;
    createMutation.mutate({
      outcome,
      trigger_type: triggerType,
      trigger_reason: triggerReason,
      title,
      summary,
      start_date: startDate,
      end_date: endDate,
      expectations,
      support_commitment: support,
      consequences_statement: consequences,
      objectives,
      reviews,
      evidence: evidenceNote.trim().length >= 10
        ? [{ type: "NOTE", title: "Initiation context", description: evidenceNote }]
        : [],
    });
  }

  if (queueQuery.isLoading) {
    return <div className="space-y-4 p-4 sm:p-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (queueQuery.isError) {
    return (
      <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 sm:m-6">
        <AlertTriangle className="mb-3 h-6 w-6 text-rose-700" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-rose-950">Improvement plans are unavailable</h1>
        <p className="mt-1 text-sm text-rose-800">{apiMessage(queueQuery.error, "Please try again.")}</p>
        <Button className="mt-4 min-h-11" variant="outline" onClick={() => queueQuery.refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <main className="space-y-5 p-4 sm:p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-700">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Controlled performance workflow
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Performance improvement plans</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Run outcome-backed plans from HR approval through check-ins, formal reviews, extension, closure, escalation, and employee acknowledgement.
            </p>
          </div>
          {queue?.capabilities.can_manage && queue.eligible_outcomes.length > 0 && (
            <Button className="min-h-11" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" /> Initiate plan
            </Button>
          )}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[
            ["Total", queue?.summary.total ?? 0],
            ["Pending", queue?.summary.pending_approval ?? 0],
            ["Active", queue?.summary.released ?? 0],
            ["On track", queue?.summary.on_track ?? 0],
            ["At risk", queue?.summary.at_risk ?? 0],
            ["Successful", queue?.summary.completed_successfully ?? 0],
            ["Escalated", queue?.summary.escalated ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <label htmlFor="pip-search" className="sr-only">Search improvement plans</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <Input id="pip-search" className="min-h-11 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search plans or employees" />
            </div>
          </div>
          <div className="max-h-[720px] divide-y divide-slate-100 overflow-y-auto">
            {filteredCases.length === 0 ? (
              <div className="p-8 text-center">
                <ClipboardCheck className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                <p className="mt-3 font-medium text-slate-800">No visible plans</p>
                <p className="mt-1 text-sm text-slate-500">
                  Employees see a plan only after HR releases it.
                </p>
              </div>
            ) : filteredCases.map((item) => (
              <button
                key={item.uuid}
                type="button"
                onClick={() => setSelectedUuid(item.uuid)}
                className={`flex min-h-24 w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${selectedUuid === item.uuid ? "bg-indigo-50/60" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-slate-950">{item.display_name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[item.status]}`}>
                      {humanize(item.status)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-700">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.case_reference} · {item.cycle_name}</p>
                  {item.status === "RELEASED" && (
                    <div className="mt-2">
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>{humanize(item.health)}</span>
                        <span>{Math.round(item.progress_percentage)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${item.progress_percentage}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selected ? (
            <div className="flex min-h-96 flex-col items-center justify-center text-center">
              <ClipboardCheck className="h-10 w-10 text-slate-300" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold text-slate-900">Select an improvement plan</h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500">Review objectives, support commitments, scheduled reviews, and the immutable decision trail.</p>
            </div>
          ) : detailQuery.isLoading ? (
            <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-72 w-full" /></div>
          ) : (
            <CaseDetail
              pipCase={selected}
              onAction={(action) => { setReason(""); setDecision(action); }}
              onExecute={setExecutionAction}
            />
          )}
        </section>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="create-pip-title">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 id="create-pip-title" className="text-xl font-semibold text-slate-950">Initiate improvement plan</h2>
                <p className="mt-1 text-sm text-slate-500">The definition becomes immutable when submitted.</p>
              </div>
              <Button variant="ghost" className="min-h-11" onClick={() => setShowCreate(false)}>Close</Button>
            </div>
            <div className="space-y-6 p-5">
              <fieldset className="grid gap-4 md:grid-cols-2">
                <legend className="sr-only">Case source and trigger</legend>
                <Field label="Released performance outcome">
                  <select className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={outcomeUuid} onChange={(event) => setOutcomeUuid(event.target.value)}>
                    <option value="">Select an employee outcome</option>
                    {queue?.eligible_outcomes.map((outcome) => (
                      <option key={outcome.uuid} value={outcome.uuid}>{outcome.display_name} · {outcome.cycle_name} · {outcome.rating.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Trigger">
                  <select className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={triggerType} onChange={(event) => setTriggerType(event.target.value as "OUTCOME" | "MANAGER")}>
                    <option value="OUTCOME">Performance outcome</option>
                    <option value="MANAGER">Manager initiated</option>
                  </select>
                </Field>
              </fieldset>
              <Field label="Trigger reason" hint="At least 20 characters">
                <Textarea value={triggerReason} onChange={(event) => setTriggerReason(event.target.value)} rows={3} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Plan title"><Input value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
                <Field label="Plan period">
                  <div className="grid grid-cols-2 gap-2">
                    <Input aria-label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                    <Input aria-label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                  </div>
                </Field>
              </div>
              <Field label="Case summary"><Textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} /></Field>
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label="Performance expectations"><Textarea value={expectations} onChange={(event) => setExpectations(event.target.value)} rows={5} /></Field>
                <Field label="Manager and HR support"><Textarea value={support} onChange={(event) => setSupport(event.target.value)} rows={5} /></Field>
                <Field label="Consequences if unmet"><Textarea value={consequences} onChange={(event) => setConsequences(event.target.value)} rows={5} /></Field>
              </div>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-950">Improvement objectives</h3>
                    <p className={`text-sm ${totalWeight === 100 ? "text-emerald-700" : "text-rose-700"}`}>Total weight: {totalWeight}% (must equal 100%)</p>
                  </div>
                  <Button type="button" variant="outline" className="min-h-11" onClick={() => setObjectives((items) => [...items, emptyObjective(0)])}><Plus className="mr-2 h-4 w-4" /> Add objective</Button>
                </div>
                <div className="space-y-4">
                  {objectives.map((objective, index) => (
                    <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-medium text-slate-900">Objective {index + 1}</h4>
                        {objectives.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setObjectives((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="mr-2 h-4 w-4" /> Remove</Button>}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Objective title"><Input value={objective.title} onChange={(event) => setObjectives((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} /></Field>
                        <Field label="Weight"><Input type="number" min={1} max={100} value={objective.weight} onChange={(event) => setObjectives((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, weight: Number(event.target.value) } : item))} /></Field>
                        <Field label="Performance gap"><Textarea value={objective.issue_description} onChange={(event) => setObjectives((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, issue_description: event.target.value } : item))} /></Field>
                        <Field label="Success criteria"><Textarea value={objective.success_criteria} onChange={(event) => setObjectives((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, success_criteria: event.target.value } : item))} /></Field>
                        <Field label="Measurement method"><Textarea value={objective.measurement_method} onChange={(event) => setObjectives((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, measurement_method: event.target.value } : item))} /></Field>
                        <Field label="Target date"><Input type="date" value={objective.target_date} onChange={(event) => setObjectives((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, target_date: event.target.value } : item))} /></Field>
                        <Field label="Baseline"><Input value={objective.baseline} onChange={(event) => setObjectives((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, baseline: event.target.value } : item))} /></Field>
                        <Field label="Target"><Input value={objective.target} onChange={(event) => setObjectives((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, target: event.target.value } : item))} /></Field>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-800">Required actions</p>
                          <Button type="button" variant="outline" size="sm" onClick={() => setObjectives((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, actions: [...item.actions, emptyObjective().actions[0]] } : item))}><Plus className="mr-1 h-4 w-4" /> Action</Button>
                        </div>
                        {objective.actions.map((action, actionIndex) => (
                          <div key={actionIndex} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-5">
                            <select aria-label="Action type" className="min-h-11 rounded-md border border-input bg-background px-2 text-sm" value={action.action_type} onChange={(event) => setObjectives((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, actions: item.actions.map((value, valueIndex) => valueIndex === actionIndex ? { ...value, action_type: event.target.value as PerformProPipActionType } : value) } : item))}>{actionTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                            <select aria-label="Action owner" className="min-h-11 rounded-md border border-input bg-background px-2 text-sm" value={action.owner_role} onChange={(event) => setObjectives((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, actions: item.actions.map((value, valueIndex) => valueIndex === actionIndex ? { ...value, owner_role: event.target.value as PerformProPipOwnerRole } : value) } : item))}>{ownerRoles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                            <Input aria-label="Action title" placeholder="Action title" value={action.title} onChange={(event) => setObjectives((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, actions: item.actions.map((value, valueIndex) => valueIndex === actionIndex ? { ...value, title: event.target.value } : value) } : item))} />
                            <Input aria-label="Action due date" type="date" value={action.due_date} onChange={(event) => setObjectives((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, actions: item.actions.map((value, valueIndex) => valueIndex === actionIndex ? { ...value, due_date: event.target.value } : value) } : item))} />
                            <Button type="button" variant="ghost" disabled={objective.actions.length === 1} onClick={() => setObjectives((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, actions: item.actions.filter((_, valueIndex) => valueIndex !== actionIndex) } : item))}><Trash2 className="mr-2 h-4 w-4" /> Remove</Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-950">Review schedule</h3>
                  <Button type="button" variant="outline" className="min-h-11" onClick={() => setReviews((items) => [...items, emptyReview()])}><Plus className="mr-2 h-4 w-4" /> Add review</Button>
                </div>
                <div className="space-y-3">
                  {reviews.map((review, index) => (
                    <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_1fr_1fr_2fr_auto]">
                      <Input aria-label="Review date" type="date" value={review.review_date} onChange={(event) => setReviews((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, review_date: event.target.value } : item))} />
                      <select aria-label="Reviewer role" className="min-h-11 rounded-md border border-input bg-background px-2 text-sm" value={review.reviewer_role} onChange={(event) => setReviews((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, reviewer_role: event.target.value as PerformProPipReviewerRole } : item))}>{reviewerRoles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                      <Input aria-label="Review title" value={review.title} onChange={(event) => setReviews((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} />
                      <Input aria-label="Review agenda" placeholder="Agenda and evidence to review" value={review.agenda} onChange={(event) => setReviews((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, agenda: event.target.value } : item))} />
                      <Button type="button" variant="ghost" disabled={reviews.length === 1} onClick={() => setReviews((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /><span className="sr-only">Remove review</span></Button>
                    </div>
                  ))}
                </div>
              </section>
              <Field label="Optional initiation evidence note" hint="At least 10 characters when provided">
                <Textarea value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} rows={3} />
              </Field>
            </div>
            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end">
              <Button variant="outline" className="min-h-11" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="min-h-11" disabled={createInvalid || createMutation.isPending} onClick={submitCreate}>
                {createMutation.isPending ? "Submitting…" : "Submit for HR approval"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {decision && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="pip-decision-title">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <h2 id="pip-decision-title" className="text-lg font-semibold text-slate-950">{humanize(decision)} improvement plan</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {decision === "release" ? "Releasing makes the approved plan visible to the employee." : "The reason becomes part of the immutable decision timeline."}
            </p>
            <Field label={decision === "release" ? "Release reason" : "Decision reason"} hint="At least 20 characters">
              <Textarea autoFocus className="mt-4" rows={5} value={reason} onChange={(event) => setReason(event.target.value)} />
            </Field>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" className="min-h-11" onClick={() => setDecision(null)}>Cancel</Button>
              <Button variant={decision === "reject" ? "destructive" : "default"} className="min-h-11" disabled={reason.trim().length < 20 || decisionMutation.isPending} onClick={() => decisionMutation.mutate()}>
                {decisionMutation.isPending ? "Saving…" : humanize(decision)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {executionAction && selected && (
        <PipExecutionDialog
          key={`${selected.uuid}:${executionAction}`}
          action={executionAction}
          pipCase={selected}
          pending={executionMutation.isPending}
          onClose={() => setExecutionAction(null)}
          onSubmit={(command) => executionMutation.mutate(command)}
        />
      )}
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-800">
      <span>{label}</span>
      {hint && <span className="ml-2 font-normal text-slate-500">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function CaseDetail({
  pipCase,
  onAction,
  onExecute,
}: {
  pipCase: PerformProPipCase;
  onAction: (action: Decision) => void;
  onExecute: (action: ExecutionAction) => void;
}) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[pipCase.status]}`}>{humanize(pipCase.status)}</span>
            <span className="text-xs text-slate-500">{pipCase.case_reference} · Version {pipCase.lock_version}</span>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">{pipCase.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{pipCase.display_name} · {pipCase.cycle_name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pipCase.capabilities.can_approve && <Button className="min-h-11" onClick={() => onAction("approve")}><CheckCircle2 className="mr-2 h-4 w-4" /> Approve</Button>}
          {pipCase.capabilities.can_reject && <Button variant="destructive" className="min-h-11" onClick={() => onAction("reject")}><XCircle className="mr-2 h-4 w-4" /> Reject</Button>}
          {pipCase.capabilities.can_release && <Button className="min-h-11" onClick={() => onAction("release")}><ShieldCheck className="mr-2 h-4 w-4" /> Release to employee</Button>}
          {pipCase.capabilities.can_check_in && <Button variant="outline" className="min-h-11" onClick={() => onExecute("check-in")}><Activity className="mr-2 h-4 w-4" /> Check in</Button>}
          {pipCase.capabilities.can_review && <Button variant="outline" className="min-h-11" onClick={() => onExecute("review")}><ClipboardCheck className="mr-2 h-4 w-4" /> Record review</Button>}
          {pipCase.capabilities.can_extend && <Button variant="outline" className="min-h-11" onClick={() => onExecute("extend")}><CalendarDays className="mr-2 h-4 w-4" /> Extend</Button>}
          {pipCase.capabilities.can_close && (
            <>
              <Button className="min-h-11" onClick={() => onExecute("successful")}><CheckCircle2 className="mr-2 h-4 w-4" /> Successful closure</Button>
              <Button variant="destructive" className="min-h-11" onClick={() => onExecute("unsuccessful")}>Unsuccessful closure</Button>
              <Button variant="outline" className="min-h-11" onClick={() => onExecute("escalate")}><AlertTriangle className="mr-2 h-4 w-4" /> Escalate</Button>
            </>
          )}
          {pipCase.capabilities.can_acknowledge && <Button className="min-h-11" onClick={() => onExecute("acknowledge")}><CheckCircle2 className="mr-2 h-4 w-4" /> Acknowledge receipt</Button>}
        </div>
      </header>

      {pipCase.capabilities.is_subject_view && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
          This is your approved plan and execution record. Progress, manager and HR support, formal reviews, and the final outcome remain visible in one evidence trail.
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Overall progress</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{Math.round(pipCase.progress_percentage)}%</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${healthStyles[pipCase.health]}`}>{humanize(pipCase.health)}</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200" aria-label={`${pipCase.progress_percentage}% complete`}>
          <div className="h-full rounded-full bg-indigo-600 transition-[width]" style={{ width: `${pipCase.progress_percentage}%` }} />
        </div>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <Info label="Effective end date" value={formatDate(pipCase.effective_end_date)} />
          <Info label="Next review" value={formatDate(pipCase.next_review_date)} />
          <Info label="Last check-in" value={formatDateTime(pipCase.last_checkin_at)} />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Info label="Trigger" value={humanize(pipCase.trigger_type)} />
        <Info label="Plan period" value={`${formatDate(pipCase.start_date)} – ${formatDate(pipCase.end_date)}`} />
        <Info label="Source outcome" value={`${pipCase.source_outcome.rating.label} · ${pipCase.source_outcome.final_score}`} />
      </div>
      <TextSection title="Case summary" body={pipCase.summary} />
      <TextSection title="Reason for initiation" body={pipCase.trigger_reason} />
      <div className="grid gap-4 lg:grid-cols-3">
        <TextSection title="Expectations" body={pipCase.expectations} />
        <TextSection title="Support commitment" body={pipCase.support_commitment} />
        <TextSection title="Consequences statement" body={pipCase.consequences_statement} />
      </div>

      <section>
        <h3 className="text-base font-semibold text-slate-950">Improvement objectives</h3>
        <div className="mt-3 space-y-3">
          {(pipCase.objectives ?? []).map((objective) => (
            <article key={objective.uuid} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="font-semibold text-slate-950">{objective.sequence}. {objective.title}</p><p className="mt-1 text-sm text-slate-600">{objective.issue_description}</p></div>
                <div className="text-right"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800">{objective.weight}% weight</span><p className="mt-2 text-sm font-semibold text-slate-800">{Math.round(objective.progress_percentage)}% · {humanize(objective.status)}</p></div>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Baseline" value={objective.baseline} />
                <Info label="Target" value={objective.target} />
                <Info label="Measurement" value={objective.measurement_method} />
                <Info label="Target date" value={formatDate(objective.target_date)} />
              </dl>
              <p className="mt-4 text-sm"><span className="font-medium text-slate-900">Success criteria:</span> <span className="text-slate-700">{objective.success_criteria}</span></p>
              <div className="mt-4 divide-y divide-slate-100 rounded-lg bg-slate-50 px-3">
                {objective.actions.map((action) => (
                  <div key={action.uuid} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div><span className="font-medium text-slate-900">{action.title}</span><span className="ml-2 text-slate-500">{humanize(action.action_type)} · {humanize(action.owner_role)}</span></div>
                    <span className="text-slate-500">{Math.round(action.progress_percentage)}% · Due {formatDate(action.due_date)}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-slate-950">Review schedule</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {[...(pipCase.reviews ?? []), ...(pipCase.extension_reviews ?? [])].map((review) => (
            <div key={review.uuid} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950"><CalendarDays className="h-4 w-4 text-indigo-600" /> {formatDate(review.review_date)}</div>
              <p className="mt-2 font-medium text-slate-900">{review.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{review.agenda}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">{humanize(review.reviewer_role)} · {review.completed ? "Completed" : "Pending"}</p>
            </div>
          ))}
        </div>
      </section>

      {((pipCase.check_ins?.length ?? 0) > 0 || (pipCase.review_records?.length ?? 0) > 0) && (
        <section>
          <h3 className="text-base font-semibold text-slate-950">Execution history</h3>
          <div className="mt-3 space-y-3">
            {(pipCase.check_ins ?? []).map((checkIn) => (
              <article key={checkIn.uuid} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-950">Progress check-in · {Math.round(checkIn.progress_after)}%</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${healthStyles[checkIn.health_after]}`}>{humanize(checkIn.health_after)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{checkIn.summary}</p>
                {checkIn.blockers && <p className="mt-2 text-sm text-rose-800"><strong>Blockers:</strong> {checkIn.blockers}</p>}
                {checkIn.support_needed && <p className="mt-1 text-sm text-slate-700"><strong>Support:</strong> {checkIn.support_needed}</p>}
                <p className="mt-2 text-xs text-slate-500">{humanize(checkIn.actor_role)} · {formatDateTime(checkIn.submitted_at)} · {shortHash(checkIn.checkin_hash)}</p>
              </article>
            ))}
            {(pipCase.review_records ?? []).map((review) => (
              <article key={review.uuid} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-950">{review.review_title}</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${healthStyles[review.review_outcome]}`}>{humanize(review.review_outcome)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{review.summary}</p>
                <p className="mt-2 text-sm text-slate-700"><strong>Assessment:</strong> {review.manager_assessment}</p>
                <p className="mt-1 text-sm text-slate-700"><strong>Support actions:</strong> {review.support_actions}</p>
                <p className="mt-2 text-xs text-slate-500">{humanize(review.actor_role)} · {formatDateTime(review.submitted_at)} · {shortHash(review.review_hash)}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {(pipCase.extensions?.length ?? 0) > 0 && (
        <section className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <h3 className="font-semibold text-sky-950">Extensions</h3>
          {(pipCase.extensions ?? []).map((extension) => (
            <p key={extension.uuid} className="mt-2 text-sm leading-6 text-sky-900">
              Extension {extension.extension_sequence}: {formatDate(extension.previous_end_date)} to {formatDate(extension.new_end_date)} — {extension.reason}
            </p>
          ))}
        </section>
      )}

      {pipCase.closure && (
        <section className="rounded-xl border border-slate-300 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-950">Final PIP outcome</h3>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${healthStyles[pipCase.closure.final_health]}`}>{humanize(pipCase.closure.outcome)}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{pipCase.closure.summary}</p>
          <p className="mt-2 text-sm text-slate-700"><strong>Reason:</strong> {pipCase.closure.reason}</p>
          <p className="mt-2 text-xs text-slate-500">Closed {formatDateTime(pipCase.closure.closed_at)} · {shortHash(pipCase.closure.closure_hash)}</p>
          {pipCase.acknowledgement && <p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-700"><strong>Employee acknowledged receipt:</strong> {formatDateTime(pipCase.acknowledgement.acknowledged_at)}</p>}
        </section>
      )}

      {(pipCase.decision || pipCase.release) && (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-950">Decision and release</h3>
          {pipCase.decision && <p className="mt-2 text-sm leading-6 text-slate-700"><strong>{humanize(pipCase.decision.decision)}:</strong> {pipCase.decision.reason} · {formatDateTime(pipCase.decision.decided_at)}</p>}
          {pipCase.release && <p className="mt-2 text-sm text-slate-700"><strong>Released:</strong> {formatDateTime(pipCase.release.released_at)} · {pipCase.release.statement_version}</p>}
        </section>
      )}

      <section>
        <h3 className="flex items-center gap-2 font-semibold text-slate-950"><Fingerprint className="h-4 w-4 text-indigo-600" /> Immutable evidence chain</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Info label="Source outcome" value={shortHash(pipCase.evidence_chain.source_outcome_evidence_hash)} mono />
          <Info label="Case definition" value={shortHash(pipCase.evidence_chain.case_hash)} mono />
          <Info label="Current evidence" value={shortHash(pipCase.evidence_chain.current_evidence_hash)} mono />
          <Info label="Release evidence" value={shortHash(pipCase.release?.release_hash)} mono />
          <Info label="Closure evidence" value={shortHash(pipCase.evidence_chain.closure_hash)} mono />
          <Info label="Acknowledgement" value={shortHash(pipCase.evidence_chain.acknowledgement_hash)} mono />
        </div>
        <div className="mt-4 space-y-3">
          {(pipCase.events ?? []).map((event) => (
            <div key={event.uuid} className="border-l-2 border-indigo-200 pl-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{humanize(event.event_type)}</p>
                <span className="text-xs text-slate-500">v{event.resulting_case_version} · {formatDateTime(event.occurred_at)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{event.reason}</p>
              <p className="mt-1 font-mono text-xs text-slate-400">{shortHash(event.event_hash)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function addDays(value: string, days: number) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function PipExecutionDialog({
  action,
  pipCase,
  pending,
  onClose,
  onSubmit,
}: {
  action: ExecutionAction;
  pipCase: PerformProPipCase;
  pending: boolean;
  onClose: () => void;
  onSubmit: (command: ExecutionCommand) => void;
}) {
  const editableItems = [
    ...(pipCase.objectives ?? []).map((objective) => ({
      type: "OBJECTIVE" as const,
      uuid: objective.uuid,
      title: objective.title,
      progress: objective.progress_percentage,
    })),
    ...(pipCase.objectives ?? []).flatMap((objective) =>
      objective.actions
        .filter((item) => !pipCase.capabilities.is_subject_view || item.owner_role !== "MANAGER")
        .map((item) => ({
          type: "ACTION" as const,
          uuid: item.uuid,
          title: item.title,
          progress: item.progress_percentage,
        }))),
  ];
  const pendingReviews = [
    ...(pipCase.reviews ?? []),
    ...(pipCase.extension_reviews ?? []),
  ].filter((review) => !review.completed);
  const [summary, setSummary] = useState("");
  const [reason, setReason] = useState("");
  const [blockers, setBlockers] = useState("");
  const [supportNeeded, setSupportNeeded] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [progress, setProgress] = useState<Record<string, number>>(
    Object.fromEntries(editableItems.map((item) => [item.uuid, item.progress])),
  );
  const [reviewUuid, setReviewUuid] = useState(pendingReviews[0]?.uuid ?? "");
  const [reviewOutcome, setReviewOutcome] = useState<"ON_TRACK" | "AT_RISK" | "OFF_TRACK">("ON_TRACK");
  const [employeeComments, setEmployeeComments] = useState("");
  const [managerAssessment, setManagerAssessment] = useState("");
  const [hrComments, setHrComments] = useState("");
  const [supportActions, setSupportActions] = useState("");
  const [newEndDate, setNewEndDate] = useState(addDays(pipCase.effective_end_date, 30));
  const [reviewDate, setReviewDate] = useState(addDays(pipCase.effective_end_date, 15));
  const [reviewerRole, setReviewerRole] = useState<PerformProPipReviewerRole>("BOTH");
  const [reviewTitle, setReviewTitle] = useState("Extension progress review");
  const [reviewAgenda, setReviewAgenda] = useState("");

  const title = {
    "check-in": "Record PIP check-in",
    review: "Record scheduled review",
    extend: "Extend improvement plan",
    successful: "Close as successful",
    unsuccessful: "Close as unsuccessful",
    escalate: "Escalate improvement plan",
    acknowledge: "Acknowledge final outcome",
  }[action];
  const evidenceInvalid = evidenceNote.length > 0 && evidenceNote.trim().length < 10;
  const invalid = action === "check-in"
    ? summary.trim().length < 20 || editableItems.length === 0 || evidenceInvalid
    : action === "review"
      ? !reviewUuid
        || summary.trim().length < 20
        || managerAssessment.trim().length < 20
        || supportActions.trim().length < 10
        || evidenceInvalid
      : action === "extend"
        ? newEndDate <= pipCase.effective_end_date
          || reviewDate <= pipCase.effective_end_date
          || reviewDate > newEndDate
          || reason.trim().length < 20
          || reviewTitle.trim().length < 3
          || reviewAgenda.trim().length < 10
        : action === "acknowledge"
          ? false
          : summary.trim().length < 20 || reason.trim().length < 20 || evidenceInvalid;

  function submit() {
    if (invalid) return;
    if (action === "check-in") {
      onSubmit({
        action,
        summary,
        blockers,
        supportNeeded,
        updates: editableItems.map((item) => ({
          item_type: item.type,
          item_uuid: item.uuid,
          progress_percentage: progress[item.uuid] ?? item.progress,
        })),
        evidenceNote,
      });
      return;
    }
    if (action === "review") {
      onSubmit({
        action,
        reviewUuid,
        reviewOutcome,
        summary,
        employeeComments,
        managerAssessment,
        hrComments,
        supportActions,
        evidenceNote,
      });
      return;
    }
    if (action === "extend") {
      onSubmit({
        action,
        newEndDate,
        reason,
        reviewDate,
        reviewerRole,
        reviewTitle,
        reviewAgenda,
      });
      return;
    }
    if (action === "acknowledge") {
      onSubmit({ action });
      return;
    }
    onSubmit({ action, summary, reason, evidenceNote });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="pip-execution-title">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="pip-execution-title" className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{pipCase.case_reference} · version {pipCase.lock_version}</p>
          </div>
          <Button variant="ghost" className="min-h-11" onClick={onClose}>Close</Button>
        </div>
        <div className="space-y-4 p-5">
          {action === "check-in" && (
            <>
              <div className="space-y-3">
                {editableItems.map((item) => (
                  <label key={item.uuid} className="block rounded-xl border border-slate-200 p-3">
                    <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-900">
                      <span>{item.title}</span>
                      <span>{progress[item.uuid] ?? item.progress}%</span>
                    </span>
                    <input
                      className="mt-3 min-h-11 w-full accent-indigo-600"
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={progress[item.uuid] ?? item.progress}
                      onChange={(event) => setProgress((values) => ({ ...values, [item.uuid]: Number(event.target.value) }))}
                    />
                  </label>
                ))}
              </div>
              <Field label="Check-in summary" hint="At least 20 characters"><Textarea rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} /></Field>
              <Field label="Blockers" hint="Optional"><Textarea rows={3} value={blockers} onChange={(event) => setBlockers(event.target.value)} /></Field>
              <Field label="Support needed" hint="Optional"><Textarea rows={3} value={supportNeeded} onChange={(event) => setSupportNeeded(event.target.value)} /></Field>
            </>
          )}
          {action === "review" && (
            pendingReviews.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Every scheduled review has already been completed.</div>
            ) : (
              <>
                <Field label="Scheduled review">
                  <select className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={reviewUuid} onChange={(event) => setReviewUuid(event.target.value)}>
                    {pendingReviews.map((review) => <option key={review.uuid} value={review.uuid}>{formatDate(review.review_date)} · {review.title}</option>)}
                  </select>
                </Field>
                <Field label="Review outcome">
                  <select className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={reviewOutcome} onChange={(event) => setReviewOutcome(event.target.value as typeof reviewOutcome)}>
                    <option value="ON_TRACK">On track</option>
                    <option value="AT_RISK">At risk</option>
                    <option value="OFF_TRACK">Off track</option>
                  </select>
                </Field>
                <Field label="Review summary"><Textarea rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} /></Field>
                <Field label="Manager assessment"><Textarea rows={4} value={managerAssessment} onChange={(event) => setManagerAssessment(event.target.value)} /></Field>
                <Field label="Employee comments" hint="Optional"><Textarea rows={3} value={employeeComments} onChange={(event) => setEmployeeComments(event.target.value)} /></Field>
                <Field label="HR comments" hint="Optional"><Textarea rows={3} value={hrComments} onChange={(event) => setHrComments(event.target.value)} /></Field>
                <Field label="Support actions"><Textarea rows={3} value={supportActions} onChange={(event) => setSupportActions(event.target.value)} /></Field>
              </>
            )
          )}
          {action === "extend" && (
            <>
              <Field label="New end date"><Input type="date" min={addDays(pipCase.effective_end_date, 7)} value={newEndDate} onChange={(event) => setNewEndDate(event.target.value)} /></Field>
              <Field label="Extension reason"><Textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} /></Field>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-950">Required extension review</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Review date"><Input type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} /></Field>
                  <Field label="Reviewer">
                    <select className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={reviewerRole} onChange={(event) => setReviewerRole(event.target.value as PerformProPipReviewerRole)}>{reviewerRoles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                  </Field>
                </div>
                <Field label="Review title"><Input value={reviewTitle} onChange={(event) => setReviewTitle(event.target.value)} /></Field>
                <Field label="Review agenda"><Textarea rows={3} value={reviewAgenda} onChange={(event) => setReviewAgenda(event.target.value)} /></Field>
              </div>
            </>
          )}
          {action !== "check-in" && action !== "review" && action !== "extend" && action !== "acknowledge" && (
            <>
              <div className={`rounded-xl border p-4 text-sm leading-6 ${action === "successful" ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-rose-200 bg-rose-50 text-rose-950"}`}>
                This is a final, immutable outcome. Confirm that the required formal reviews are complete before submission.
              </div>
              <Field label="Outcome summary"><Textarea rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} /></Field>
              <Field label="Outcome reason"><Textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} /></Field>
            </>
          )}
          {action === "acknowledge" && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm leading-6 text-indigo-950">
              I acknowledge receipt of the final performance improvement plan outcome. Acknowledgement confirms receipt and does not imply agreement.
            </div>
          )}
          {action !== "extend" && action !== "acknowledge" && (
            <Field label="Evidence note" hint="Optional; at least 10 characters when provided">
              <Textarea rows={3} value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} />
            </Field>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-4 sm:flex-row sm:justify-end">
          <Button variant="outline" className="min-h-11" onClick={onClose}>Cancel</Button>
          <Button
            variant={action === "unsuccessful" || action === "escalate" ? "destructive" : "default"}
            className="min-h-11"
            disabled={invalid || pending}
            onClick={submit}
          >
            {pending ? "Saving…" : action === "acknowledge" ? "Acknowledge receipt" : "Save immutable evidence"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 break-words text-sm text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function TextSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{body}</p>
    </section>
  );
}
