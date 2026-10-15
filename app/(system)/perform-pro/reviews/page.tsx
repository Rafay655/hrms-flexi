"use client";

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileClock,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { performProService } from "@/services/performpro";
import type {
  PerformProReviewTask,
  PerformProSelfReviewAnswer,
  PerformProSelfReviewDetail,
  PerformProSelfReviewGoal,
} from "@/types/performpro";

type ReviewForm = {
  answers: Record<string, { rating: number; comment: string }>;
  overallSummary: string;
  achievements: string;
  challenges: string;
};

const emptyForm: ReviewForm = {
  answers: {},
  overallSummary: "",
  achievements: "",
  challenges: "",
};

const ratingOptions = [
  { value: 1, label: "1 · Needs significant improvement" },
  { value: 2, label: "2 · Partially met expectations" },
  { value: 3, label: "3 · Met expectations" },
  { value: 4, label: "4 · Exceeded expectations" },
  { value: 5, label: "5 · Exceptional impact" },
];

const statusStyle: Record<PerformProReviewTask["status"], string> = {
  OPEN: "bg-amber-50 text-amber-900 ring-amber-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  WAIVED: "bg-slate-100 text-slate-700 ring-slate-200",
  CANCELLED: "bg-rose-50 text-rose-800 ring-rose-200",
};

function apiMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatValue(value: number | null, unit: string | null) {
  if (value === null) return "Not set";
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ""}`;
}

function percent(value: number | null) {
  if (value === null) return "Not measured";
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)}%`;
}

function formFromDetail(detail: PerformProSelfReviewDetail): ReviewForm {
  const evidence = detail.submission ?? detail.draft;
  return {
    answers: Object.fromEntries(
      (evidence?.answers ?? []).map((answer) => [
        answer.goal_uuid,
        { rating: answer.rating, comment: answer.comment },
      ]),
    ),
    overallSummary: evidence?.overall_summary ?? "",
    achievements: evidence?.achievements ?? "",
    challenges: evidence?.challenges ?? "",
  };
}

function answersFromForm(
  goals: PerformProSelfReviewGoal[],
  form: ReviewForm,
): PerformProSelfReviewAnswer[] {
  return goals.flatMap((goal) => {
    const answer = form.answers[goal.uuid];
    return answer?.rating
      ? [{
          goal_uuid: goal.uuid,
          rating: answer.rating,
          comment: answer.comment.trim(),
        }]
      : [];
  });
}

function finalValidation(detail: PerformProSelfReviewDetail, form: ReviewForm) {
  const missing = detail.snapshot.goals.filter((goal) => {
    const answer = form.answers[goal.uuid];
    return !answer?.rating || answer.comment.trim().length < 5;
  });
  if (missing.length > 0) {
    return `Complete the rating and a five-character comment for ${missing.length} goal${missing.length === 1 ? "" : "s"}.`;
  }
  if (form.overallSummary.trim().length < 10) {
    return "Add an overall summary of at least ten characters.";
  }
  return null;
}

function StatusBadge({ status }: { status: PerformProReviewTask["status"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusStyle[status]}`}
    >
      {humanize(status)}
    </span>
  );
}

function TaskCard({
  task,
  active,
  onSelect,
}: {
  task: PerformProReviewTask;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={`w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-600/25 ${
        active
          ? "border-brand-300 bg-brand-50/70 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-950">
            {task.cycle_name ?? "Performance review"}
          </p>
          <p className="mt-1 text-xs text-gray-500">Self review</p>
        </div>
        <ChevronRight
          aria-hidden="true"
          className={`mt-0.5 size-4 shrink-0 ${active ? "text-brand-700" : "text-gray-400"}`}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={task.status} />
        <span className="text-xs text-gray-500">
          Due {formatDateTime(task.due_at)}
        </span>
      </div>
    </button>
  );
}

function KeyResultRow({ goal }: { goal: PerformProSelfReviewGoal }) {
  return (
    <div className="grid gap-3 border-t border-gray-100 py-3 first:border-t-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p className="text-sm font-medium text-gray-900">{goal.title}</p>
        <p className="mt-1 text-xs text-gray-500">
          {formatValue(goal.current_value, goal.target_unit)} of{" "}
          {formatValue(goal.target_value, goal.target_unit)}
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
          {percent(goal.progress_pct)}
        </span>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
          {humanize(goal.status)}
        </span>
      </div>
    </div>
  );
}

function GoalReviewCard({
  goal,
  index,
  answer,
  readOnly,
  onChange,
}: {
  goal: PerformProSelfReviewGoal;
  index: number;
  answer: { rating: number; comment: string };
  readOnly: boolean;
  onChange: (next: { rating: number; comment: string }) => void;
}) {
  const progressValue = Math.max(0, Math.min(100, goal.progress_pct ?? 0));
  const commentId = `goal-${goal.uuid}-comment`;
  const ratingId = `goal-${goal.uuid}-rating`;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                Goal {index + 1}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                {humanize(goal.goal_type)}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                {goal.weightage_pct}% weight
              </span>
            </div>
            <h2 className="mt-2 text-lg font-semibold text-gray-950">{goal.title}</h2>
            {goal.description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                {goal.description}
              </p>
            )}
          </div>
          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
            {humanize(goal.status)}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Current / target</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatValue(goal.current_value, goal.target_unit)} /{" "}
              {formatValue(goal.target_value, goal.target_unit)}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Recorded progress</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {percent(goal.progress_pct)}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Expected progress</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {percent(goal.expected_progress_pct)}
            </p>
          </div>
        </div>
        <Progress
          value={progressValue}
          aria-label={`${goal.title} progress`}
          className="mt-4 h-2 bg-gray-100"
        />

        {goal.key_results.length > 0 && (
          <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/60 px-4">
            <p className="pt-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
              Key-result evidence
            </p>
            <div className="mt-1">
              {goal.key_results.map((keyResult) => (
                <KeyResultRow key={keyResult.uuid} goal={keyResult} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-5 bg-slate-50/70 p-5 sm:p-6 lg:grid-cols-[minmax(220px,0.42fr)_1fr]">
        <div>
          <label htmlFor={ratingId} className="text-sm font-semibold text-gray-900">
            Your rating <span className="text-rose-600">*</span>
          </label>
          <select
            id={ratingId}
            value={answer.rating || ""}
            disabled={readOnly}
            onChange={(event) =>
              onChange({ ...answer, rating: Number(event.target.value) })
            }
            className="mt-2 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">Select a rating</option>
            {ratingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-5 text-gray-500">
            Use the recorded goal evidence and outcomes to choose the closest rating.
          </p>
        </div>
        <div>
          <label htmlFor={commentId} className="text-sm font-semibold text-gray-900">
            Evidence and reflection <span className="text-rose-600">*</span>
          </label>
          <Textarea
            id={commentId}
            value={answer.comment}
            readOnly={readOnly}
            onChange={(event) => onChange({ ...answer, comment: event.target.value })}
            placeholder="Describe the outcome, your contribution, and the evidence behind your rating."
            className="mt-2 min-h-28 resize-y rounded-xl border-gray-300 bg-white text-gray-900 focus-visible:border-brand-600 focus-visible:ring-brand-600/20 read-only:cursor-default read-only:bg-gray-100"
            maxLength={5000}
          />
          <p className="mt-2 text-right text-xs text-gray-500">
            {answer.comment.length.toLocaleString()} / 5,000
          </p>
        </div>
      </div>
    </article>
  );
}

function ReviewLoading() {
  return (
    <div className="space-y-5" aria-label="Loading self review">
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

export default function SelfReviewsPage() {
  const queryClient = useQueryClient();
  const [selectedTaskUuid, setSelectedTaskUuid] = useState<string | null>(null);
  const [formState, setFormState] = useState<{
    taskUuid: string;
    values: ReviewForm;
    dirty: boolean;
  } | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const tasksQuery = useQuery({
    queryKey: ["perform-pro", "self-reviews"],
    queryFn: performProService.selfReviewTasks,
  });
  const activeTaskUuid = selectedTaskUuid
    ?? tasksQuery.data?.find((task) => task.status === "OPEN")?.uuid
    ?? tasksQuery.data?.[0]?.uuid
    ?? null;
  const selectedTask = useMemo(
    () => tasksQuery.data?.find((task) => task.uuid === activeTaskUuid) ?? null,
    [activeTaskUuid, tasksQuery.data],
  );
  const detailQuery = useQuery({
    queryKey: ["perform-pro", "self-review", activeTaskUuid],
    queryFn: () => performProService.selfReview(activeTaskUuid!),
    enabled: Boolean(activeTaskUuid),
  });
  const workflowQuery = useQuery({
    queryKey: ["perform-pro", "review-workflow", activeTaskUuid],
    queryFn: () => performProService.reviewWorkflow(activeTaskUuid!),
    enabled: Boolean(activeTaskUuid),
  });
  const detail = detailQuery.data ?? null;
  const form = detail
    ? formState?.taskUuid === detail.task.uuid
      ? formState.values
      : formFromDetail(detail)
    : emptyForm;
  const dirty = formState !== null && detail?.task.uuid === formState.taskUuid
    ? formState.dirty
    : false;

  const saveMutation = useMutation({
    mutationFn: ({
      review,
      values,
    }: {
      review: PerformProSelfReviewDetail;
      values: ReviewForm;
    }) =>
      performProService.saveSelfReviewDraft({
        detail: review,
        answers: answersFromForm(review.snapshot.goals, values),
        overallSummary: values.overallSummary,
        achievements: values.achievements,
        challenges: values.challenges,
      }),
    onSuccess: async (saved) => {
      queryClient.setQueryData(
        ["perform-pro", "self-review", saved.task.uuid],
        saved,
      );
      setFormState({
        taskUuid: saved.task.uuid,
        values: formFromDetail(saved),
        dirty: false,
      });
      toast.success(`Draft revision ${saved.draft?.draft_version ?? 1} saved.`);
      await queryClient.invalidateQueries({
        queryKey: ["perform-pro", "self-reviews"],
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["perform-pro", "manager-reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["perform-pro", "review-workflow"] }),
      ]);
    },
    onError: (error) =>
      showApiError(error, { fallbackMessage: apiMessage(error, "The self-review draft could not be saved.") }),
  });

  const submitMutation = useMutation({
    mutationFn: async ({
      review,
      values,
    }: {
      review: PerformProSelfReviewDetail;
      values: ReviewForm;
    }) => {
      const saved = await performProService.saveSelfReviewDraft({
        detail: review,
        answers: answersFromForm(review.snapshot.goals, values),
        overallSummary: values.overallSummary,
        achievements: values.achievements,
        challenges: values.challenges,
      });
      return performProService.submitSelfReview(saved);
    },
    onSuccess: async (submitted) => {
      queryClient.setQueryData(
        ["perform-pro", "self-review", submitted.task.uuid],
        submitted,
      );
      setFormState({
        taskUuid: submitted.task.uuid,
        values: formFromDetail(submitted),
        dirty: false,
      });
      setConfirmSubmit(false);
      toast.success("Self review submitted. Your evidence is now locked.");
      await queryClient.invalidateQueries({
        queryKey: ["perform-pro", "self-reviews"],
      });
    },
    onError: (error) => {
      setConfirmSubmit(false);
      showApiError(error, { fallbackMessage: apiMessage(error, "The self review could not be submitted.") });
    },
  });

  const completedGoalCount = detail
    ? detail.snapshot.goals.filter((goal) => {
        const answer = form.answers[goal.uuid];
        return Boolean(answer?.rating && answer.comment.trim().length >= 5);
      }).length
    : 0;
  const totalGoalCount = detail?.snapshot.goals.length ?? 0;
  const completionPct = totalGoalCount
    ? Math.round((completedGoalCount / totalGoalCount) * 100)
    : 0;
  const isBusy = saveMutation.isPending || submitMutation.isPending;
  const isReadOnly = !detail?.can_edit || Boolean(detail?.submission);
  const returnTransition = workflowQuery.data?.history
    .findLast((transition) =>
      transition.action === "RETURN_TO_EMPLOYEE"
      && transition.resulting_task_uuid === detail?.task.uuid
    ) ?? null;

  function updateAnswer(
    goalUuid: string,
    value: { rating: number; comment: string },
  ) {
    if (!detail) return;
    setFormState({
      taskUuid: detail.task.uuid,
      values: {
        ...form,
        answers: { ...form.answers, [goalUuid]: value },
      },
      dirty: true,
    });
  }

  function updateNarrative(
    field: "overallSummary" | "achievements" | "challenges",
    value: string,
  ) {
    if (!detail) return;
    setFormState({
      taskUuid: detail.task.uuid,
      values: { ...form, [field]: value },
      dirty: true,
    });
  }

  function requestFinalSubmission() {
    if (!detail) return;
    const validationMessage = finalValidation(detail, form);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }
    setConfirmSubmit(true);
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-6 text-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <header className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                <ClipboardCheck aria-hidden="true" className="size-4" />
                PerformPro · Reviews
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                My self reviews
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
                Reflect on frozen goal evidence, record your rating and comments, then
                submit a final review for the next appraisal stage.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-gray-600">
              <ShieldCheck aria-hidden="true" className="size-5 text-brand-700" />
              <span>Every saved revision and final submission is preserved.</span>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-4 shadow-sm xl:sticky xl:top-6">
            <div className="flex items-center justify-between px-1 pb-4">
              <div>
                <h2 className="font-semibold text-gray-950">Review tasks</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {tasksQuery.data?.length ?? 0} assigned
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 rounded-xl"
                onClick={() => void tasksQuery.refetch()}
                disabled={tasksQuery.isFetching}
                aria-label="Refresh self-review tasks"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={`size-4 ${tasksQuery.isFetching ? "animate-spin motion-reduce:animate-none" : ""}`}
                />
              </Button>
            </div>

            {tasksQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
              </div>
            ) : tasksQuery.isError ? (
              <div role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
                <AlertCircle aria-hidden="true" className="mb-2 size-5" />
                {apiMessage(tasksQuery.error, "Review tasks could not be loaded.")}
              </div>
            ) : tasksQuery.data?.length ? (
              <div className="space-y-3">
                {tasksQuery.data.map((task) => (
                  <TaskCard
                    key={task.uuid}
                    task={task}
                    active={task.uuid === activeTaskUuid}
                    onSelect={() => setSelectedTaskUuid(task.uuid)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-10 text-center">
                <CheckCircle2 aria-hidden="true" className="mx-auto size-8 text-gray-400" />
                <p className="mt-3 font-medium text-gray-900">No self reviews assigned</p>
                <p className="mt-1 text-sm text-gray-500">
                  New tasks will appear when a self-review phase opens.
                </p>
              </div>
            )}
          </aside>

          <section className="min-w-0">
            {detailQuery.isLoading ? (
              <ReviewLoading />
            ) : detailQuery.isError ? (
              <div role="alert" className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
                <AlertCircle aria-hidden="true" className="size-6" />
                <h2 className="mt-3 text-lg font-semibold">Self review could not be opened</h2>
                <p className="mt-2 text-sm">
                  {apiMessage(detailQuery.error, "Refresh the task and try again.")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 h-11 rounded-xl border-rose-300 bg-white"
                  onClick={() => void detailQuery.refetch()}
                >
                  <RefreshCw aria-hidden="true" className="size-4" />
                  Try again
                </Button>
              </div>
            ) : detail ? (
              <div className="space-y-5">
                <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={detail.task.status} />
                        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800 ring-1 ring-inset ring-brand-200">
                          Review round {detail.task.review_round ?? 1}
                        </span>
                        {detail.submission && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800 ring-1 ring-inset ring-brand-200">
                            <Check aria-hidden="true" className="size-3.5" />
                            Final evidence locked
                          </span>
                        )}
                      </div>
                      <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-950">
                        {detail.task.cycle_name ?? selectedTask?.cycle_name ?? "Self review"}
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock aria-hidden="true" className="size-4 text-gray-400" />
                          Due {formatDateTime(detail.task.due_at)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <FileClock aria-hidden="true" className="size-4 text-gray-400" />
                          {detail.draft
                            ? `Draft revision ${detail.draft.draft_version}`
                            : "No draft saved yet"}
                        </span>
                      </div>
                    </div>
                    {detail.submission?.weighted_score != null && (
                      <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-center ring-1 ring-inset ring-emerald-200">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                          Weighted self score
                        </p>
                        <p className="mt-1 text-3xl font-bold text-emerald-900">
                          {detail.submission.weighted_score.toFixed(2)}
                          <span className="text-base font-medium text-emerald-700"> / 5</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {!detail.submission && (
                    <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium text-gray-900">Goal reflections complete</span>
                        <span className="font-semibold text-brand-800">
                          {completedGoalCount} of {totalGoalCount}
                        </span>
                      </div>
                      <Progress
                        value={completionPct}
                        aria-label="Self-review completion"
                        className="mt-3 h-2.5 bg-gray-200"
                      />
                    </div>
                  )}

                  {!detail.can_edit && !detail.submission && (
                    <div role="status" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      This task is read-only because the self-review phase is not open for editing
                      or you are viewing it with administrative access.
                    </div>
                  )}
                </section>

                {returnTransition && (
                  <section
                    role="status"
                    className="rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6"
                  >
                    <div className="flex items-start gap-3">
                      <Undo2 aria-hidden="true" className="mt-0.5 size-5 text-amber-800" />
                      <div>
                        <h2 className="font-semibold text-amber-950">
                          Returned for clarification
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-amber-900">
                          {returnTransition.reason}
                        </p>
                        <p className="mt-3 text-xs text-amber-800">
                          Returned {formatDateTime(returnTransition.occurred_at)} · evidence{" "}
                          <span className="font-mono">
                            {returnTransition.evidence_hash.slice(0, 12)}…
                          </span>
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {detail.snapshot.goals.length ? (
                  detail.snapshot.goals.map((goal, index) => (
                    <GoalReviewCard
                      key={goal.uuid}
                      goal={goal}
                      index={index}
                      answer={form.answers[goal.uuid] ?? { rating: 0, comment: "" }}
                      readOnly={isReadOnly}
                      onChange={(value) => updateAnswer(goal.uuid, value)}
                    />
                  ))
                ) : (
                  <section className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
                    <Target aria-hidden="true" className="mx-auto size-9 text-gray-400" />
                    <h2 className="mt-4 text-lg font-semibold text-gray-950">
                      No approved goals in this snapshot
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                      The task remains available as evidence, but it cannot be finalized until
                      review-ready goals exist.
                    </p>
                  </section>
                )}

                <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-brand-50 p-2.5 text-brand-700">
                      <Sparkles aria-hidden="true" className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-950">Overall reflection</h2>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        Summarize your impact across the review period. Achievements and challenges
                        add context but remain optional.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    <div>
                      <label htmlFor="overall-summary" className="text-sm font-semibold text-gray-900">
                        Overall summary <span className="text-rose-600">*</span>
                      </label>
                      <Textarea
                        id="overall-summary"
                        value={form.overallSummary}
                        readOnly={isReadOnly}
                        onChange={(event) => updateNarrative("overallSummary", event.target.value)}
                        placeholder="Summarize your overall contribution, growth, and impact."
                        className="mt-2 min-h-32 resize-y rounded-xl border-gray-300 focus-visible:border-brand-600 focus-visible:ring-brand-600/20 read-only:bg-gray-100"
                        maxLength={10000}
                      />
                    </div>
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div>
                        <label htmlFor="achievements" className="text-sm font-semibold text-gray-900">
                          Key achievements
                        </label>
                        <Textarea
                          id="achievements"
                          value={form.achievements}
                          readOnly={isReadOnly}
                          onChange={(event) => updateNarrative("achievements", event.target.value)}
                          placeholder="Call out outcomes, stretch contributions, or recognition."
                          className="mt-2 min-h-28 resize-y rounded-xl border-gray-300 focus-visible:border-brand-600 focus-visible:ring-brand-600/20 read-only:bg-gray-100"
                          maxLength={10000}
                        />
                      </div>
                      <div>
                        <label htmlFor="challenges" className="text-sm font-semibold text-gray-900">
                          Challenges and support
                        </label>
                        <Textarea
                          id="challenges"
                          value={form.challenges}
                          readOnly={isReadOnly}
                          onChange={(event) => updateNarrative("challenges", event.target.value)}
                          placeholder="Describe constraints, learning, or support needed next."
                          className="mt-2 min-h-28 resize-y rounded-xl border-gray-300 focus-visible:border-brand-600 focus-visible:ring-brand-600/20 read-only:bg-gray-100"
                          maxLength={10000}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 text-brand-700" />
                      <div>
                        <p className="font-semibold text-gray-950">Review evidence</p>
                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          Goal snapshot {detail.snapshot.snapshot_version} · captured{" "}
                          {formatDateTime(detail.snapshot.captured_at)} · hash{" "}
                          <span className="font-mono">{detail.snapshot.goals_hash.slice(0, 12)}…</span>
                        </p>
                        {dirty && detail.can_edit && (
                          <p role="status" className="mt-2 text-xs font-medium text-amber-700">
                            You have unsaved changes.
                          </p>
                        )}
                      </div>
                    </div>

                    {detail.can_edit && !detail.submission ? (
                      <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 rounded-xl px-5"
                          disabled={isBusy}
                          onClick={() =>
                            saveMutation.mutate({ review: detail, values: form })
                          }
                        >
                          <Save aria-hidden="true" className="size-4" />
                          {saveMutation.isPending ? "Saving…" : "Save draft"}
                        </Button>
                        <Button
                          type="button"
                          className="h-11 rounded-xl bg-brand-700 px-5 text-white hover:bg-brand-800"
                          disabled={isBusy || detail.snapshot.goals.length === 0}
                          onClick={requestFinalSubmission}
                        >
                          <Send aria-hidden="true" className="size-4" />
                          {submitMutation.isPending ? "Submitting…" : "Submit final review"}
                        </Button>
                      </div>
                    ) : detail.submission ? (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                        <CheckCircle2 aria-hidden="true" className="size-5" />
                        Submitted {formatDateTime(detail.submission.occurred_at)}
                      </div>
                    ) : null}
                  </div>
                </section>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">
                <ClipboardCheck aria-hidden="true" className="mx-auto size-10 text-gray-400" />
                <h2 className="mt-4 text-lg font-semibold text-gray-950">Select a review task</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Choose a task to open its review-ready goal snapshot.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this self review?</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">
              A final draft revision will be saved first. Submission then completes the task and
              locks your ratings, comments, and reflection as immutable review evidence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 rounded-xl" disabled={submitMutation.isPending}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 rounded-xl bg-brand-700 text-white hover:bg-brand-800"
              disabled={submitMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (detail) submitMutation.mutate({ review: detail, values: form });
              }}
            >
              {submitMutation.isPending ? "Submitting…" : "Save and submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
