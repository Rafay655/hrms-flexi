"use client";

import { showApiError } from "@/lib/error-toast";
import { FormEvent, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Fingerprint,
  GraduationCap,
  LockKeyhole,
  MessagesSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { performProService } from "@/services/performpro";
import type {
  PerformProContinuousFeedback,
  PerformProContinuousFeedbackCategory,
  PerformProContinuousFeedbackVisibility,
  PerformProContinuousFeedbackWorkspace,
} from "@/types/performpro";

type FeedbackView = "received" | "authored" | "manager_visible" | "moderation";
type ModerationDialog = {
  feedback: PerformProContinuousFeedback;
  action: "HIDE" | "RESTORE";
} | null;

const viewLabels: Record<FeedbackView, string> = {
  received: "Received",
  authored: "Given",
  manager_visible: "Manager view",
  moderation: "Moderation",
};

const visibilityCopy: Record<
  PerformProContinuousFeedbackVisibility,
  { label: string; description: string }
> = {
  SHARED: {
    label: "Shared with employee",
    description: "The employee and you can read this feedback.",
  },
  SHARED_WITH_MANAGER: {
    label: "Shared with employee and manager",
    description: "The employee, their frozen manager, and you can read it.",
  },
  MANAGER_CONFIDENTIAL: {
    label: "Confidential to manager",
    description: "Only you, the employee’s frozen manager, and moderators can read it.",
  },
};

const categoryCopy: Record<
  PerformProContinuousFeedbackCategory,
  { label: string; description: string }
> = {
  RECOGNITION: {
    label: "Recognition",
    description: "Celebrate a specific contribution or behavior worth reinforcing.",
  },
  COACHING: {
    label: "Coaching",
    description: "Offer constructive, actionable guidance for growth.",
  },
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function shortHash(value: string) {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

function apiMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  return error.response?.data?.error?.message
    ?? error.response?.data?.message
    ?? fallback;
}

function feedbackForView(
  workspace: PerformProContinuousFeedbackWorkspace,
  view: FeedbackView,
) {
  return workspace[view];
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof MessagesSquare;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{value}</p>
        </div>
        <span className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function PrivacyBadge({
  visibility,
}: {
  visibility: PerformProContinuousFeedbackVisibility;
}) {
  const Icon = visibility === "MANAGER_CONFIDENTIAL"
    ? LockKeyhole
    : visibility === "SHARED_WITH_MANAGER"
      ? UsersRound
      : Eye;

  return (
    <Badge
      variant="outline"
      className="border-slate-200 bg-slate-50 text-slate-700"
    >
      <Icon aria-hidden="true" />
      {visibilityCopy[visibility].label}
    </Badge>
  );
}

function FeedbackCard({
  feedback,
  moderationMode,
  onModerate,
}: {
  feedback: PerformProContinuousFeedback;
  moderationMode: boolean;
  onModerate: (feedback: PerformProContinuousFeedback, action: "HIDE" | "RESTORE") => void;
}) {
  const categoryIsRecognition = feedback.category === "RECOGNITION";
  const CategoryIcon = categoryIsRecognition ? Award : GraduationCap;

  return (
    <article
      className={`rounded-xl border bg-white p-5 shadow-sm ${
        feedback.status === "HIDDEN"
          ? "border-rose-200"
          : "border-slate-200"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={categoryIsRecognition
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-sky-200 bg-sky-50 text-sky-900"}
            >
              <CategoryIcon aria-hidden="true" />
              {categoryCopy[feedback.category].label}
            </Badge>
            <PrivacyBadge visibility={feedback.visibility} />
            <Badge
              variant="outline"
              className={feedback.status === "HIDDEN"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"}
            >
              {feedback.status === "HIDDEN"
                ? <EyeOff aria-hidden="true" />
                : <CheckCircle2 aria-hidden="true" />}
              {humanize(feedback.status)}
            </Badge>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{feedback.author_name}</span>
            {" to "}
            <span className="font-semibold text-slate-900">{feedback.recipient_name}</span>
            {" · "}
            {humanize(feedback.relationship)}
          </p>
        </div>
        <time
          dateTime={feedback.submitted_at}
          className="shrink-0 text-xs text-slate-500"
        >
          {formatDateTime(feedback.submitted_at)}
        </time>
      </div>

      {feedback.context && (
        <p className="mt-4 text-sm font-medium text-indigo-800">{feedback.context}</p>
      )}
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
        {feedback.content}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays aria-hidden="true" className="size-3.5" />
          {feedback.cycle_name ?? "Outside a performance cycle"}
        </span>
        {feedback.recipient_manager_name && (
          <span className="inline-flex items-center gap-1.5">
            <UserRound aria-hidden="true" className="size-3.5" />
            Frozen manager: {feedback.recipient_manager_name}
          </span>
        )}
      </div>

      <details className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <summary className="cursor-pointer select-none font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
          Evidence and history
        </summary>
        <div className="mt-3 space-y-2">
          <p className="flex flex-wrap items-center gap-1.5">
            <Fingerprint aria-hidden="true" className="size-3.5" />
            Current evidence:{" "}
            <code className="break-all text-[11px]">{shortHash(feedback.evidence.current_evidence_hash)}</code>
          </p>
          <p>Version {feedback.lock_version} · {feedback.events.length} immutable event(s)</p>
          {feedback.events.map((event) => (
            <div
              key={event.uuid}
              className="rounded-md border border-slate-200 bg-white p-2.5"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-semibold text-slate-700">{humanize(event.event_type)}</span>
                <time dateTime={event.occurred_at}>{formatDateTime(event.occurred_at)}</time>
              </div>
              {event.reason && <p className="mt-1 leading-5">{event.reason}</p>}
              <p className="mt-1 text-[11px]">Event hash: {shortHash(event.event_hash)}</p>
            </div>
          ))}
        </div>
      </details>

      {moderationMode && feedback.capabilities.can_moderate && (
        <div className="mt-4 flex justify-end">
          {feedback.capabilities.can_hide && (
            <Button
              variant="outline"
              className="min-h-11 cursor-pointer border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              onClick={() => onModerate(feedback, "HIDE")}
            >
              <EyeOff aria-hidden="true" className="size-4" />
              Hide feedback
            </Button>
          )}
          {feedback.capabilities.can_restore && (
            <Button
              variant="outline"
              className="min-h-11 cursor-pointer border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              onClick={() => onModerate(feedback, "RESTORE")}
            >
              <Eye aria-hidden="true" className="size-4" />
              Restore feedback
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

function LoadingWorkspace() {
  return (
    <div aria-label="Loading continuous feedback" className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function ContinuousFeedbackPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<FeedbackView>("received");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [recipientUuid, setRecipientUuid] = useState("");
  const [cycleUuid, setCycleUuid] = useState("");
  const [category, setCategory] =
    useState<PerformProContinuousFeedbackCategory>("RECOGNITION");
  const [visibility, setVisibility] =
    useState<PerformProContinuousFeedbackVisibility>("SHARED");
  const [context, setContext] = useState("");
  const [content, setContent] = useState("");
  const [moderationDialog, setModerationDialog] = useState<ModerationDialog>(null);
  const [moderationReason, setModerationReason] = useState("");

  const workspaceQuery = useQuery({
    queryKey: ["perform-pro", "continuous-feedback"],
    queryFn: performProService.continuousFeedbackWorkspace,
  });

  const workspace = workspaceQuery.data;
  const availableViews = useMemo(() => {
    if (!workspace) return [] as FeedbackView[];
    const views: FeedbackView[] = [];
    if (workspace.capabilities.can_view_received) {
      views.push("received", "manager_visible");
    }
    if (workspace.capabilities.can_view_authored) views.push("authored");
    if (workspace.capabilities.can_moderate) views.push("moderation");
    return views;
  }, [workspace]);
  const activeView = availableViews.includes(view)
    ? view
    : (availableViews[0] ?? "received");
  const selectedRecipient = workspace?.recipient_candidates.find(
    (candidate) => candidate.uuid === recipientUuid,
  );

  const visibleFeedback = useMemo(() => {
    if (!workspace) return [];
    const term = search.trim().toLowerCase();
    const items = feedbackForView(workspace, activeView);
    if (!term) return items;
    return items.filter((item) => [
      item.author_name,
      item.recipient_name,
      item.recipient_manager_name ?? "",
      item.content,
      item.context ?? "",
      item.cycle_name ?? "",
      item.category,
      item.relationship,
      item.visibility,
      item.status,
    ].some((value) => value.toLowerCase().includes(term)));
  }, [activeView, search, workspace]);

  const createMutation = useMutation({
    mutationFn: performProService.createContinuousFeedback,
    onSuccess: async () => {
      toast.success("Feedback submitted securely.");
      setCreateOpen(false);
      setRecipientUuid("");
      setCycleUuid("");
      setCategory("RECOGNITION");
      setVisibility("SHARED");
      setContext("");
      setContent("");
      await queryClient.invalidateQueries({
        queryKey: ["perform-pro", "continuous-feedback"],
      });
    },
    onError: (error) => {
      showApiError(error, { fallbackMessage: apiMessage(error, "The feedback could not be submitted.") });
    },
  });

  const moderationMutation = useMutation({
    mutationFn: ({
      feedback,
      action,
      reason,
    }: {
      feedback: PerformProContinuousFeedback;
      action: "HIDE" | "RESTORE";
      reason: string;
    }) => performProService.moderateContinuousFeedback(feedback, action, reason),
    onSuccess: async (_, variables) => {
      toast.success(
        variables.action === "HIDE"
          ? "Feedback hidden with immutable evidence."
          : "Feedback restored with immutable evidence.",
      );
      setModerationDialog(null);
      setModerationReason("");
      await queryClient.invalidateQueries({
        queryKey: ["perform-pro", "continuous-feedback"],
      });
    },
    onError: (error) => {
      showApiError(error, { fallbackMessage: apiMessage(error, "The moderation action could not be recorded.") });
    },
  });

  function changeCategory(nextCategory: PerformProContinuousFeedbackCategory) {
    setCategory(nextCategory);
    if (nextCategory === "RECOGNITION" && visibility === "MANAGER_CONFIDENTIAL") {
      setVisibility("SHARED");
    }
  }

  function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recipientUuid || content.trim().length < 20) return;
    createMutation.mutate({
      recipientEmployeeUuid: recipientUuid,
      cycleUuid: cycleUuid || null,
      category,
      visibility,
      content: content.trim(),
      context: context.trim(),
    });
  }

  function openModeration(
    feedback: PerformProContinuousFeedback,
    action: "HIDE" | "RESTORE",
  ) {
    setModerationReason("");
    setModerationDialog({ feedback, action });
  }

  const createInvalid = !recipientUuid
    || content.trim().length < 20
    || context.trim().length > 0 && context.trim().length < 3
    || visibility !== "SHARED" && !selectedRecipient?.has_manager;

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
            <MessagesSquare aria-hidden="true" className="size-4" />
            PerformPro
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Continuous feedback
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Recognize contributions and share timely coaching with explicit visibility,
            protected narratives, and tamper-evident history.
          </p>
        </div>
        {workspace?.capabilities.can_create && (
          <Button
            className="min-h-11 cursor-pointer bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setCreateOpen(true)}
          >
            <Plus aria-hidden="true" className="size-4" />
            Give feedback
          </Button>
        )}
      </header>

      {workspaceQuery.isLoading && <LoadingWorkspace />}

      {workspaceQuery.isError && (
        <section
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900"
        >
          <div className="flex items-start gap-3">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <div>
              <h2 className="font-semibold">Continuous feedback is unavailable</h2>
              <p className="mt-1 text-sm">
                {apiMessage(workspaceQuery.error, "The workspace could not be loaded.")}
              </p>
              <Button
                variant="outline"
                className="mt-4 min-h-11 cursor-pointer border-rose-300 bg-white"
                onClick={() => workspaceQuery.refetch()}
              >
                <RefreshCw aria-hidden="true" className="size-4" />
                Try again
              </Button>
            </div>
          </div>
        </section>
      )}

      {workspace && (
        <>
          <section aria-label="Feedback summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={MessagesSquare}
              label="Received"
              value={workspace.summary.received}
              detail="Visible feedback shared directly with you."
            />
            <SummaryCard
              icon={Send}
              label="Given"
              value={workspace.summary.authored}
              detail="Feedback you submitted and can revisit."
            />
            <SummaryCard
              icon={UsersRound}
              label="Manager view"
              value={workspace.summary.manager_visible}
              detail="Items shared with you as the frozen manager."
            />
            <SummaryCard
              icon={ShieldCheck}
              label="Moderation"
              value={workspace.summary.moderation_total}
              detail={`${workspace.summary.hidden} hidden item${workspace.summary.hidden === 1 ? "" : "s"} in the governed record.`}
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div
                role="tablist"
                aria-label="Continuous feedback views"
                className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1"
              >
                {availableViews.map((candidateView) => {
                  const count = feedbackForView(workspace, candidateView).length;
                  return (
                    <button
                      key={candidateView}
                      type="button"
                      role="tab"
                      aria-selected={activeView === candidateView}
                      onClick={() => setView(candidateView)}
                      className={`min-h-10 cursor-pointer whitespace-nowrap rounded-md px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                        activeView === candidateView
                          ? "bg-white text-indigo-800 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {viewLabels[candidateView]}{" "}
                      <span className="tabular-nums text-xs">({count})</span>
                    </button>
                  );
                })}
              </div>
              <label className="relative block w-full lg:max-w-sm">
                <span className="sr-only">Search feedback</span>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search people, content, or category"
                  className="min-h-11 pl-9"
                />
              </label>
            </div>

            <div
              role="tabpanel"
              aria-label={viewLabels[activeView]}
              className="p-4 sm:p-5"
            >
              {visibleFeedback.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
                  <MessagesSquare aria-hidden="true" className="mx-auto size-9 text-slate-400" />
                  <h2 className="mt-3 font-semibold text-slate-900">No feedback to show</h2>
                  <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                    {search
                      ? "No entries match your search. Try a different name, category, or phrase."
                      : "Entries available for this permission-scoped view will appear here."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {visibleFeedback.map((feedback) => (
                    <FeedbackCard
                      key={feedback.uuid}
                      feedback={feedback}
                      moderationMode={activeView === "moderation"}
                      onModerate={openModeration}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Give continuous feedback</DialogTitle>
            <DialogDescription>
              Choose the audience carefully. Submitted narratives cannot be edited or deleted.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={submitFeedback}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-800">
                Employee
                <select
                  required
                  value={recipientUuid}
                  onChange={(event) => {
                    const nextUuid = event.target.value;
                    setRecipientUuid(nextUuid);
                    const nextRecipient = workspace?.recipient_candidates.find(
                      (candidate) => candidate.uuid === nextUuid,
                    );
                    if (!nextRecipient?.has_manager) setVisibility("SHARED");
                  }}
                  className="mt-1.5 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  <option value="">Select an employee</option>
                  {workspace?.recipient_candidates.map((candidate) => (
                    <option key={candidate.uuid} value={candidate.uuid}>
                      {candidate.employee_code} · {candidate.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Performance cycle
                <select
                  value={cycleUuid}
                  onChange={(event) => setCycleUuid(event.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  <option value="">No cycle association</option>
                  {workspace?.cycles.map((cycle) => (
                    <option key={cycle.uuid} value={cycle.uuid}>
                      {cycle.name} · {humanize(cycle.state)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-800">Feedback category</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {(["RECOGNITION", "COACHING"] as const).map((option) => (
                  <label
                    key={option}
                    className={`cursor-pointer rounded-xl border p-4 ${
                      category === option
                        ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold text-slate-900">
                      <input
                        type="radio"
                        name="feedback-category"
                        value={option}
                        checked={category === option}
                        onChange={() => changeCategory(option)}
                        className="size-4 accent-indigo-600"
                      />
                      {option === "RECOGNITION"
                        ? <Award aria-hidden="true" className="size-4 text-amber-600" />
                        : <GraduationCap aria-hidden="true" className="size-4 text-sky-600" />}
                      {categoryCopy[option].label}
                    </span>
                    <span className="mt-1 block pl-6 text-xs leading-5 text-slate-600">
                      {categoryCopy[option].description}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block text-sm font-semibold text-slate-800">
              Visibility
              <select
                value={visibility}
                onChange={(event) => setVisibility(
                  event.target.value as PerformProContinuousFeedbackVisibility,
                )}
                className="mt-1.5 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <option value="SHARED">{visibilityCopy.SHARED.label}</option>
                <option
                  value="SHARED_WITH_MANAGER"
                  disabled={!selectedRecipient?.has_manager}
                >
                  {visibilityCopy.SHARED_WITH_MANAGER.label}
                </option>
                <option
                  value="MANAGER_CONFIDENTIAL"
                  disabled={category === "RECOGNITION" || !selectedRecipient?.has_manager}
                >
                  {visibilityCopy.MANAGER_CONFIDENTIAL.label}
                </option>
              </select>
              <span className="mt-2 flex items-start gap-2 rounded-lg bg-slate-100 p-3 text-xs font-normal leading-5 text-slate-700">
                {visibility === "MANAGER_CONFIDENTIAL"
                  ? <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-600" />
                  : <Eye aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-600" />}
                {visibilityCopy[visibility].description}
              </span>
              {recipientUuid && !selectedRecipient?.has_manager && (
                <span className="mt-2 block text-xs font-normal text-amber-800">
                  This employee has no frozen manager, so only direct sharing is available.
                </span>
              )}
              {category === "RECOGNITION" && (
                <span className="mt-2 block text-xs font-normal text-slate-500">
                  Recognition must remain visible to the employee.
                </span>
              )}
            </label>

            <label className="block text-sm font-semibold text-slate-800">
              Context <span className="font-normal text-slate-500">(optional)</span>
              <Input
                value={context}
                onChange={(event) => setContext(event.target.value)}
                maxLength={1000}
                placeholder="Example: Customer launch retrospective"
                className="mt-1.5 min-h-11"
              />
              <span className="mt-1 block text-right text-xs font-normal text-slate-500">
                {context.length}/1000
              </span>
            </label>

            <label className="block text-sm font-semibold text-slate-800">
              Feedback
              <Textarea
                required
                value={content}
                onChange={(event) => setContent(event.target.value)}
                minLength={20}
                maxLength={4000}
                rows={7}
                placeholder="Describe the specific behavior, its impact, and what should be reinforced or improved."
                className="mt-1.5 resize-y"
              />
              <span className="mt-1 flex justify-between gap-3 text-xs font-normal text-slate-500">
                <span>Minimum 20 characters. Content is encrypted at rest.</span>
                <span className="tabular-nums">{content.length}/4000</span>
              </span>
            </label>

            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs leading-5 text-indigo-950">
              <p className="flex items-center gap-2 font-semibold">
                <ShieldCheck aria-hidden="true" className="size-4" />
                Governed submission
              </p>
              <p className="mt-1">
                The narrative is immutable after submission. Moderators can hide or restore
                visibility with a mandatory reason; the evidence chain remains intact.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 cursor-pointer"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createInvalid || createMutation.isPending}
                className="min-h-11 cursor-pointer bg-indigo-600 hover:bg-indigo-700"
              >
                {createMutation.isPending
                  ? <RefreshCw aria-hidden="true" className="size-4 animate-spin" />
                  : <Send aria-hidden="true" className="size-4" />}
                {createMutation.isPending ? "Submitting…" : "Submit feedback"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(moderationDialog)}
        onOpenChange={(open) => {
          if (!open && !moderationMutation.isPending) {
            setModerationDialog(null);
            setModerationReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderationDialog?.action === "HIDE"
                ? "Hide this feedback?"
                : "Restore this feedback?"}
            </DialogTitle>
            <DialogDescription>
              {moderationDialog?.action === "HIDE"
                ? "The recipient and manager will lose access. The author and moderators retain the governed record."
                : "The original visibility rules will apply again. This action is added to the immutable history."}
            </DialogDescription>
          </DialogHeader>
          <label className="text-sm font-semibold text-slate-800">
            Moderation reason
            <Textarea
              autoFocus
              value={moderationReason}
              onChange={(event) => setModerationReason(event.target.value)}
              minLength={10}
              maxLength={1000}
              rows={5}
              placeholder="Explain why this moderation action is necessary."
              className="mt-1.5 resize-y"
            />
            <span className="mt-1 flex justify-between gap-3 text-xs font-normal text-slate-500">
              <span>Required · minimum 10 characters</span>
              <span className="tabular-nums">{moderationReason.length}/1000</span>
            </span>
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={moderationMutation.isPending}
              className="min-h-11 cursor-pointer"
              onClick={() => setModerationDialog(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={moderationReason.trim().length < 10 || moderationMutation.isPending}
              className={`min-h-11 cursor-pointer ${
                moderationDialog?.action === "HIDE"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              onClick={() => {
                if (!moderationDialog) return;
                moderationMutation.mutate({
                  feedback: moderationDialog.feedback,
                  action: moderationDialog.action,
                  reason: moderationReason.trim(),
                });
              }}
            >
              {moderationMutation.isPending && (
                <RefreshCw aria-hidden="true" className="size-4 animate-spin" />
              )}
              {moderationDialog?.action === "HIDE" ? "Hide feedback" : "Restore feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
