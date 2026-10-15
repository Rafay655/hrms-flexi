"use client";

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileClock,
  History,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Target,
  UserRound,
  UsersRound,
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { performProService } from "@/services/performpro";
import type {
  PerformProManagerReviewDetail,
  PerformProReviewTask,
  PerformProReviewWaiverExceptionCode,
  PerformProSelfReviewAnswer,
  PerformProSelfReviewGoal,
} from "@/types/performpro";

type ManagerReviewForm = {
  answers: Record<string, { rating: number; comment: string }>;
  overallSummary: string;
  strengths: string;
  developmentAreas: string;
};

type WorkflowAction = "return" | "reopen" | "waive";

const emptyForm: ManagerReviewForm = {
  answers: {},
  overallSummary: "",
  strengths: "",
  developmentAreas: "",
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

const waiverExceptions: Array<{
  value: PerformProReviewWaiverExceptionCode;
  label: string;
}> = [
  { value: "EMPLOYEE_UNAVAILABLE", label: "Employee unavailable" },
  { value: "MANAGER_UNAVAILABLE", label: "Manager unavailable" },
  { value: "LEAVE_OF_ABSENCE", label: "Leave of absence" },
  { value: "ROLE_VACANT", label: "Role vacant" },
  { value: "PROCESS_EXCEPTION", label: "Process exception" },
  { value: "OTHER", label: "Other documented exception" },
];

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

function subjectValue(task: PerformProReviewTask, keys: string[]) {
  for (const key of keys) {
    const value = task.subject?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function subjectName(task: PerformProReviewTask) {
  return subjectValue(task, ["employee_name", "full_name", "name"])
    ?? `${task.subject_employee_uuid.slice(0, 8)}…`;
}

function subjectMeta(task: PerformProReviewTask) {
  return [
    subjectValue(task, ["employee_code", "code"]),
    subjectValue(task, ["department_name", "department"]),
  ].filter(Boolean).join(" · ");
}

function formFromDetail(detail: PerformProManagerReviewDetail): ManagerReviewForm {
  const evidence = detail.submission ?? detail.draft;
  return {
    answers: Object.fromEntries(
      (evidence?.answers ?? []).map((answer) => [
        answer.goal_uuid,
        { rating: answer.rating, comment: answer.comment },
      ]),
    ),
    overallSummary: evidence?.overall_summary ?? "",
    strengths: evidence?.strengths ?? "",
    developmentAreas: evidence?.development_areas ?? "",
  };
}

function answersFromForm(
  goals: PerformProSelfReviewGoal[],
  form: ManagerReviewForm,
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

function weightedScore(
  goals: PerformProSelfReviewGoal[],
  form: ManagerReviewForm,
) {
  if (!goals.length || goals.some((goal) => !form.answers[goal.uuid]?.rating)) {
    return null;
  }
  const weight = goals.reduce((sum, goal) => sum + goal.weightage_pct, 0);
  if (weight <= 0) return null;
  const weighted = goals.reduce(
    (sum, goal) => sum + form.answers[goal.uuid].rating * goal.weightage_pct,
    0,
  );
  return Math.round((weighted / weight) * 100) / 100;
}

function finalValidation(
  detail: PerformProManagerReviewDetail,
  form: ManagerReviewForm,
) {
  const missing = detail.snapshot.goals.filter((goal) => {
    const answer = form.answers[goal.uuid];
    return !answer?.rating || answer.comment.trim().length < 5;
  });
  if (missing.length > 0) {
    return `Complete the manager rating and a five-character comment for ${missing.length} goal${missing.length === 1 ? "" : "s"}.`;
  }
  if (form.overallSummary.trim().length < 10) {
    return "Add an overall manager summary of at least ten characters.";
  }
  return null;
}

function VarianceBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
        No comparison
      </span>
    );
  }
  const label = value === 0
    ? "Aligned"
    : `${value > 0 ? "+" : ""}${value.toFixed(2)} vs employee`;
  const style = value === 0
    ? "bg-sky-50 text-sky-800 ring-sky-200"
    : Math.abs(value) >= 1
      ? "bg-amber-50 text-amber-900 ring-amber-200"
      : "bg-violet-50 text-violet-800 ring-violet-200";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}>
      {label}
    </span>
  );
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

function QueueCard({
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
      className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-600/25 ${
        active
          ? "border-brand-300 bg-brand-50/70 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-950">{subjectName(task)}</p>
          <p className="mt-1 truncate text-xs text-gray-600">
            {subjectMeta(task) || task.cycle_name || "Manager review"}
          </p>
        </div>
        <ChevronRight
          aria-hidden="true"
          className={`mt-0.5 size-4 shrink-0 ${active ? "text-brand-700" : "text-gray-400"}`}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={task.status} />
        <span className="text-xs text-gray-600">Due {formatDateTime(task.due_at)}</span>
      </div>
    </button>
  );
}

function GoalEvidence({
  goal,
  index,
  employeeAnswer,
  managerAnswer,
  readOnly,
  onChange,
}: {
  goal: PerformProSelfReviewGoal;
  index: number;
  employeeAnswer: PerformProSelfReviewAnswer | null;
  managerAnswer: { rating: number; comment: string };
  readOnly: boolean;
  onChange: (value: { rating: number; comment: string }) => void;
}) {
  const variance = employeeAnswer && managerAnswer.rating
    ? managerAnswer.rating - employeeAnswer.rating
    : null;
  const ratingId = `manager-rating-${goal.uuid}`;
  const commentId = `manager-comment-${goal.uuid}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
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
            <p className="text-xs text-gray-600">Current / target</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatValue(goal.current_value, goal.target_unit)} /{" "}
              {formatValue(goal.target_value, goal.target_unit)}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-600">Recorded progress</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {goal.progress_pct === null ? "Not measured" : `${goal.progress_pct}%`}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-600">Expected progress</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {goal.expected_progress_pct === null
                ? "Not measured"
                : `${goal.expected_progress_pct}%`}
            </p>
          </div>
        </div>
        <Progress
          value={Math.max(0, Math.min(100, goal.progress_pct ?? 0))}
          aria-label={`${goal.title} progress`}
          className="mt-4 h-2 bg-gray-100"
        />

        {goal.key_results.length > 0 && (
          <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">
              Key-result evidence
            </p>
            <div className="mt-2 divide-y divide-gray-200">
              {goal.key_results.map((keyResult) => (
                <div key={keyResult.uuid} className="flex flex-col gap-2 py-3 first:pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{keyResult.title}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      {formatValue(keyResult.current_value, keyResult.target_unit)} of{" "}
                      {formatValue(keyResult.target_value, keyResult.target_unit)}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                    {keyResult.progress_pct === null ? "Not measured" : `${keyResult.progress_pct}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2">
        <section className="border-b border-gray-200 bg-slate-50 p-5 sm:p-6 lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-950">Employee reflection</h3>
            {employeeAnswer ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-gray-900 ring-1 ring-inset ring-gray-200">
                {employeeAnswer.rating} / 5
              </span>
            ) : (
              <span className="text-xs font-medium text-gray-600">Not submitted</span>
            )}
          </div>
          <p className="mt-4 min-h-16 whitespace-pre-wrap text-sm leading-6 text-gray-700">
            {employeeAnswer?.comment || "No employee comment is available for this goal."}
          </p>
        </section>

        <section className="bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-950">Manager assessment</h3>
            <VarianceBadge value={variance} />
          </div>
          <label htmlFor={ratingId} className="mt-4 block text-sm font-medium text-gray-900">
            Manager rating <span className="text-rose-600">*</span>
          </label>
          <select
            id={ratingId}
            value={managerAnswer.rating || ""}
            disabled={readOnly}
            onChange={(event) =>
              onChange({ ...managerAnswer, rating: Number(event.target.value) })
            }
            className="mt-2 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">Select a rating</option>
            {ratingOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <label htmlFor={commentId} className="mt-4 block text-sm font-medium text-gray-900">
            Manager evidence <span className="text-rose-600">*</span>
          </label>
          <Textarea
            id={commentId}
            value={managerAnswer.comment}
            readOnly={readOnly}
            onChange={(event) =>
              onChange({ ...managerAnswer, comment: event.target.value })
            }
            placeholder="Explain the outcomes and evidence supporting this rating."
            className="mt-2 min-h-28 resize-y rounded-xl border-gray-300 focus-visible:border-brand-600 focus-visible:ring-brand-600/20 read-only:bg-gray-100"
            maxLength={5000}
          />
        </section>
      </div>
    </article>
  );
}

function LoadingPanel() {
  return (
    <div className="space-y-5" aria-label="Loading manager review">
      <Skeleton className="h-56 rounded-3xl" />
      <Skeleton className="h-[34rem] rounded-2xl" />
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}

export default function ManagerReviewsPage() {
  const queryClient = useQueryClient();
  const [selectedTaskUuid, setSelectedTaskUuid] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formState, setFormState] = useState<{
    taskUuid: string;
    values: ManagerReviewForm;
    dirty: boolean;
  } | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [workflowAction, setWorkflowAction] = useState<WorkflowAction | null>(null);
  const [workflowReason, setWorkflowReason] = useState("");
  const [waiverException, setWaiverException] =
    useState<PerformProReviewWaiverExceptionCode>("MANAGER_UNAVAILABLE");

  const tasksQuery = useQuery({
    queryKey: ["perform-pro", "manager-reviews"],
    queryFn: performProService.managerReviewTasks,
  });
  const filteredTasks = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return tasksQuery.data ?? [];
    return (tasksQuery.data ?? []).filter((task) =>
      [subjectName(task), subjectMeta(task), task.cycle_name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle)),
    );
  }, [search, tasksQuery.data]);
  const activeTaskUuid = selectedTaskUuid
    ?? filteredTasks.find((task) => task.status === "OPEN")?.uuid
    ?? filteredTasks[0]?.uuid
    ?? null;
  const detailQuery = useQuery({
    queryKey: ["perform-pro", "manager-review", activeTaskUuid],
    queryFn: () => performProService.managerReview(activeTaskUuid!),
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
      review: PerformProManagerReviewDetail;
      values: ManagerReviewForm;
    }) =>
      performProService.saveManagerReviewDraft({
        detail: review,
        answers: answersFromForm(review.snapshot.goals, values),
        overallSummary: values.overallSummary,
        strengths: values.strengths,
        developmentAreas: values.developmentAreas,
      }),
    onSuccess: async (saved) => {
      queryClient.setQueryData(
        ["perform-pro", "manager-review", saved.task.uuid],
        saved,
      );
      setFormState({
        taskUuid: saved.task.uuid,
        values: formFromDetail(saved),
        dirty: false,
      });
      toast.success(`Manager-review draft revision ${saved.draft?.draft_version ?? 1} saved.`);
      await queryClient.invalidateQueries({
        queryKey: ["perform-pro", "manager-reviews"],
      });
    },
    onError: (error) =>
      showApiError(error, { fallbackMessage: apiMessage(error, "The manager-review draft could not be saved.") }),
  });

  const submitMutation = useMutation({
    mutationFn: async ({
      review,
      values,
    }: {
      review: PerformProManagerReviewDetail;
      values: ManagerReviewForm;
    }) => {
      const saved = await performProService.saveManagerReviewDraft({
        detail: review,
        answers: answersFromForm(review.snapshot.goals, values),
        overallSummary: values.overallSummary,
        strengths: values.strengths,
        developmentAreas: values.developmentAreas,
      });
      return performProService.submitManagerReview(saved);
    },
    onSuccess: async (submitted) => {
      queryClient.setQueryData(
        ["perform-pro", "manager-review", submitted.task.uuid],
        submitted,
      );
      setFormState({
        taskUuid: submitted.task.uuid,
        values: formFromDetail(submitted),
        dirty: false,
      });
      setConfirmSubmit(false);
      toast.success("Manager review submitted and locked as review evidence.");
      await queryClient.invalidateQueries({
        queryKey: ["perform-pro", "manager-reviews"],
      });
    },
    onError: (error) => {
      setConfirmSubmit(false);
      showApiError(error, { fallbackMessage: apiMessage(error, "The manager review could not be submitted.") });
    },
  });

  const workflowMutation = useMutation({
    mutationFn: ({
      review,
      action,
      reason,
      exceptionCode,
    }: {
      review: PerformProManagerReviewDetail;
      action: WorkflowAction;
      reason: string;
      exceptionCode: PerformProReviewWaiverExceptionCode | null;
    }) =>
      performProService.executeReviewWorkflow({
        task: review.task,
        action,
        reason,
        exceptionCode,
      }),
    onSuccess: async (result) => {
      const action = workflowAction;
      setWorkflowAction(null);
      setWorkflowReason("");
      toast.success(
        action === "return"
          ? "Review returned to the employee in a new review round."
          : action === "reopen"
            ? "Review reopened in a new immutable round."
            : "Review task waived with exception evidence.",
      );
      if (action === "reopen" && result.resulting_task?.task_type === "MANAGER_REVIEW") {
        setSelectedTaskUuid(result.resulting_task.uuid);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["perform-pro", "manager-reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["perform-pro", "manager-review"] }),
        queryClient.invalidateQueries({ queryKey: ["perform-pro", "review-workflow"] }),
        queryClient.invalidateQueries({ queryKey: ["perform-pro", "self-reviews"] }),
      ]);
    },
    onError: (error) =>
      showApiError(error, { fallbackMessage: apiMessage(error, "The review workflow action could not be completed.") }),
  });

  const employeeAnswers = useMemo(
    () => new Map(
      (detail?.snapshot.employee_submission?.answers ?? [])
        .map((answer) => [answer.goal_uuid, answer]),
    ),
    [detail],
  );
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
  const liveManagerScore = detail
    ? weightedScore(detail.snapshot.goals, form)
    : null;
  const employeeScore = detail?.snapshot.employee_submission?.weighted_score ?? null;
  const liveVariance = liveManagerScore !== null && employeeScore !== null
    ? Math.round((liveManagerScore - employeeScore) * 100) / 100
    : null;
  const isBusy = saveMutation.isPending
    || submitMutation.isPending
    || workflowMutation.isPending;
  const readOnly = !detail?.can_edit || Boolean(detail?.submission);
  const openCount = tasksQuery.data?.filter((task) => task.status === "OPEN").length ?? 0;

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
    field: "overallSummary" | "strengths" | "developmentAreas",
    value: string,
  ) {
    if (!detail) return;
    setFormState({
      taskUuid: detail.task.uuid,
      values: { ...form, [field]: value },
      dirty: true,
    });
  }

  function requestSubmission() {
    if (!detail) return;
    const message = finalValidation(detail, form);
    if (message) {
      toast.error(message);
      return;
    }
    setConfirmSubmit(true);
  }

  function openWorkflow(action: WorkflowAction) {
    setWorkflowReason("");
    setWaiverException("MANAGER_UNAVAILABLE");
    setWorkflowAction(action);
  }

  function executeWorkflow() {
    if (!detail || !workflowAction) return;
    if (workflowReason.trim().length < 10) {
      toast.error("Add a reason of at least ten characters.");
      return;
    }
    workflowMutation.mutate({
      review: detail,
      action: workflowAction,
      reason: workflowReason,
      exceptionCode: workflowAction === "waive" ? waiverException : null,
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-6 text-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px]">
        <header className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                <UsersRound aria-hidden="true" className="size-4" />
                PerformPro · Manager reviews
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                Team review queue
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
                Compare employee reflections with frozen goal evidence, document your
                assessment, and complete each assigned manager review.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-amber-50 px-5 py-3 ring-1 ring-inset ring-amber-200">
                <p className="text-xs font-medium text-amber-800">Open reviews</p>
                <p className="mt-1 text-2xl font-bold text-amber-950">{openCount}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-5 py-3 ring-1 ring-inset ring-gray-200">
                <p className="text-xs font-medium text-gray-600">Assigned</p>
                <p className="mt-1 text-2xl font-bold text-gray-950">
                  {tasksQuery.data?.length ?? 0}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-4 shadow-sm xl:sticky xl:top-6">
            <div className="flex items-center justify-between gap-3 px-1 pb-4">
              <div>
                <h2 className="font-semibold text-gray-950">Assigned employees</h2>
                <p className="mt-1 text-xs text-gray-600">{filteredTasks.length} shown</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 cursor-pointer rounded-xl"
                onClick={() => void tasksQuery.refetch()}
                disabled={tasksQuery.isFetching}
                aria-label="Refresh manager-review queue"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={`size-4 ${tasksQuery.isFetching ? "animate-spin motion-reduce:animate-none" : ""}`}
                />
              </Button>
            </div>
            <div className="relative mb-4">
              <Search aria-hidden="true" className="absolute top-3.5 left-3.5 size-4 text-gray-500" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelectedTaskUuid(null);
                }}
                placeholder="Search employee or team"
                aria-label="Search manager-review queue"
                className="h-11 rounded-xl border-gray-300 pl-10 focus-visible:border-brand-600 focus-visible:ring-brand-600/20"
              />
            </div>

            {tasksQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
              </div>
            ) : tasksQuery.isError ? (
              <div role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
                <AlertCircle aria-hidden="true" className="mb-2 size-5" />
                {apiMessage(tasksQuery.error, "The manager-review queue could not be loaded.")}
              </div>
            ) : filteredTasks.length ? (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <QueueCard
                    key={task.uuid}
                    task={task}
                    active={task.uuid === activeTaskUuid}
                    onSelect={() => setSelectedTaskUuid(task.uuid)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-10 text-center">
                <CheckCircle2 aria-hidden="true" className="mx-auto size-8 text-gray-500" />
                <p className="mt-3 font-medium text-gray-900">
                  {search ? "No matching employees" : "No manager reviews assigned"}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {search
                    ? "Try another name, code, or department."
                    : "Tasks appear when the manager-review phase opens."}
                </p>
              </div>
            )}
          </aside>

          <section className="min-w-0">
            {detailQuery.isLoading ? (
              <LoadingPanel />
            ) : detailQuery.isError ? (
              <div role="alert" className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
                <AlertCircle aria-hidden="true" className="size-6" />
                <h2 className="mt-3 text-lg font-semibold">Manager review could not be opened</h2>
                <p className="mt-2 text-sm">
                  {apiMessage(detailQuery.error, "Refresh the task and try again.")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 h-11 cursor-pointer rounded-xl border-rose-300 bg-white"
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
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                        <UserRound aria-hidden="true" className="size-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={detail.task.status} />
                          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800 ring-1 ring-inset ring-brand-200">
                            Review round {detail.task.review_round ?? 1}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                            detail.snapshot.employee_evidence_status === "SUBMITTED"
                              ? "bg-sky-50 text-sky-800 ring-sky-200"
                              : "bg-gray-100 text-gray-700 ring-gray-200"
                          }`}>
                            {detail.snapshot.employee_evidence_status === "SUBMITTED"
                              ? "Employee self review available"
                              : "Employee self review not submitted"}
                          </span>
                        </div>
                        <h2 className="mt-3 truncate text-2xl font-bold tracking-tight text-gray-950">
                          {subjectName(detail.task)}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                          {subjectMeta(detail.task) || detail.task.cycle_name}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-2">
                            <CalendarClock aria-hidden="true" className="size-4 text-gray-500" />
                            Due {formatDateTime(detail.task.due_at)}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <FileClock aria-hidden="true" className="size-4 text-gray-500" />
                            {detail.draft
                              ? `Draft revision ${detail.draft.draft_version}`
                              : "No draft saved yet"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid min-w-[290px] grid-cols-3 gap-2">
                      <div className="rounded-xl bg-slate-50 p-3 text-center">
                        <p className="text-[11px] font-medium text-gray-600">Employee</p>
                        <p className="mt-1 text-xl font-bold text-gray-950">
                          {employeeScore === null ? "—" : employeeScore.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-brand-50 p-3 text-center">
                        <p className="text-[11px] font-medium text-brand-700">Manager</p>
                        <p className="mt-1 text-xl font-bold text-brand-950">
                          {liveManagerScore === null ? "—" : liveManagerScore.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-3 text-center">
                        <p className="text-[11px] font-medium text-amber-800">Variance</p>
                        <p className="mt-1 text-xl font-bold text-amber-950">
                          {liveVariance === null
                            ? "—"
                            : `${liveVariance > 0 ? "+" : ""}${liveVariance.toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!detail.submission && (
                    <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium text-gray-900">Manager assessments complete</span>
                        <span className="font-semibold text-brand-800">
                          {completedGoalCount} of {totalGoalCount}
                        </span>
                      </div>
                      <Progress
                        value={completionPct}
                        aria-label="Manager-review completion"
                        className="mt-3 h-2.5 bg-gray-200"
                      />
                    </div>
                  )}
                </section>

                {detail.snapshot.employee_submission && (
                  <section className="rounded-3xl border border-sky-200 bg-sky-50/70 p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <ClipboardList aria-hidden="true" className="mt-0.5 size-5 text-sky-700" />
                      <div>
                        <h2 className="font-semibold text-sky-950">Employee’s overall reflection</h2>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-sky-900">
                          {detail.snapshot.employee_submission.overall_summary
                            || "No overall summary was provided."}
                        </p>
                        <p className="mt-3 text-xs text-sky-800">
                          Submitted {formatDateTime(detail.snapshot.employee_submission.occurred_at)}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {detail.snapshot.goals.map((goal, index) => (
                  <GoalEvidence
                    key={goal.uuid}
                    goal={goal}
                    index={index}
                    employeeAnswer={employeeAnswers.get(goal.uuid) ?? null}
                    managerAnswer={form.answers[goal.uuid] ?? { rating: 0, comment: "" }}
                    readOnly={readOnly}
                    onChange={(value) => updateAnswer(goal.uuid, value)}
                  />
                ))}

                {!detail.snapshot.goals.length && (
                  <section className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
                    <Target aria-hidden="true" className="mx-auto size-9 text-gray-500" />
                    <h2 className="mt-4 text-lg font-semibold text-gray-950">
                      No review-ready goals
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      This task cannot be finalized until review-ready goal evidence exists.
                    </p>
                  </section>
                )}

                <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-semibold text-gray-950">Manager summary</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Capture the overall assessment, strengths to reinforce, and development
                    priorities for the next period.
                  </p>
                  <div className="mt-6 space-y-5">
                    <div>
                      <label htmlFor="manager-summary" className="text-sm font-semibold text-gray-900">
                        Overall summary <span className="text-rose-600">*</span>
                      </label>
                      <Textarea
                        id="manager-summary"
                        value={form.overallSummary}
                        readOnly={readOnly}
                        onChange={(event) => updateNarrative("overallSummary", event.target.value)}
                        placeholder="Summarize performance, impact, and the rationale for the overall assessment."
                        className="mt-2 min-h-32 resize-y rounded-xl border-gray-300 focus-visible:border-brand-600 focus-visible:ring-brand-600/20 read-only:bg-gray-100"
                        maxLength={10000}
                      />
                    </div>
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div>
                        <label htmlFor="manager-strengths" className="text-sm font-semibold text-gray-900">
                          Strengths
                        </label>
                        <Textarea
                          id="manager-strengths"
                          value={form.strengths}
                          readOnly={readOnly}
                          onChange={(event) => updateNarrative("strengths", event.target.value)}
                          placeholder="What should the employee continue and amplify?"
                          className="mt-2 min-h-28 resize-y rounded-xl border-gray-300 focus-visible:border-brand-600 focus-visible:ring-brand-600/20 read-only:bg-gray-100"
                          maxLength={10000}
                        />
                      </div>
                      <div>
                        <label htmlFor="manager-development" className="text-sm font-semibold text-gray-900">
                          Development areas
                        </label>
                        <Textarea
                          id="manager-development"
                          value={form.developmentAreas}
                          readOnly={readOnly}
                          onChange={(event) => updateNarrative("developmentAreas", event.target.value)}
                          placeholder="What growth focus or support is needed next?"
                          className="mt-2 min-h-28 resize-y rounded-xl border-gray-300 focus-visible:border-brand-600 focus-visible:ring-brand-600/20 read-only:bg-gray-100"
                          maxLength={10000}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {(workflowQuery.data?.capabilities.can_return
                  || workflowQuery.data?.capabilities.can_reopen
                  || workflowQuery.data?.capabilities.can_waive
                  || Boolean(workflowQuery.data?.history.length)) && (
                  <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <History aria-hidden="true" className="mt-0.5 size-5 text-brand-700" />
                        <div>
                          <h2 className="font-semibold text-gray-950">Review workflow controls</h2>
                          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
                            Returns and reopens create a new review round. Prior submissions,
                            drafts, and evidence remain immutable. Waivers require a documented
                            exception and close only this task.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {workflowQuery.data?.capabilities.can_return && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 cursor-pointer rounded-xl border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100"
                            disabled={isBusy}
                            onClick={() => openWorkflow("return")}
                          >
                            <Undo2 aria-hidden="true" className="size-4" />
                            Return to employee
                          </Button>
                        )}
                        {workflowQuery.data?.capabilities.can_reopen && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 cursor-pointer rounded-xl"
                            disabled={isBusy}
                            onClick={() => openWorkflow("reopen")}
                          >
                            <RotateCcw aria-hidden="true" className="size-4" />
                            Reopen task
                          </Button>
                        )}
                        {workflowQuery.data?.capabilities.can_waive && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 cursor-pointer rounded-xl border-rose-300 text-rose-800 hover:bg-rose-50"
                            disabled={isBusy}
                            onClick={() => openWorkflow("waive")}
                          >
                            <Ban aria-hidden="true" className="size-4" />
                            Waive task
                          </Button>
                        )}
                      </div>
                    </div>

                    {workflowQuery.data?.history.length ? (
                      <ol className="mt-6 space-y-3" aria-label="Review workflow history">
                        {workflowQuery.data.history.map((transition) => (
                          <li
                            key={transition.uuid}
                            className="rounded-2xl border border-gray-200 bg-slate-50 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-gray-950">
                                  {humanize(transition.action)}
                                </span>
                                {transition.resulting_review_round && (
                                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                                    Round {transition.resulting_review_round}
                                  </span>
                                )}
                                {transition.exception_code && (
                                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-800 ring-1 ring-inset ring-rose-200">
                                    {humanize(transition.exception_code)}
                                  </span>
                                )}
                              </div>
                              <time className="text-xs text-gray-600">
                                {formatDateTime(transition.occurred_at)}
                              </time>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-gray-700">
                              {transition.reason}
                            </p>
                            <p className="mt-2 text-xs text-gray-500">
                              Evidence hash{" "}
                              <span className="font-mono">
                                {transition.evidence_hash.slice(0, 12)}…
                              </span>
                            </p>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-5 text-sm text-gray-600">
                        No return, reopen, or waiver actions have been recorded.
                      </p>
                    )}
                  </section>
                )}

                <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 text-brand-700" />
                      <div>
                        <p className="font-semibold text-gray-950">Immutable review evidence</p>
                        <p className="mt-1 text-xs leading-5 text-gray-600">
                          Snapshot {detail.snapshot.snapshot_version} · captured{" "}
                          {formatDateTime(detail.snapshot.captured_at)} · hash{" "}
                          <span className="font-mono">{detail.snapshot.evidence_hash.slice(0, 12)}…</span>
                        </p>
                        {dirty && detail.can_edit && (
                          <p role="status" className="mt-2 text-xs font-medium text-amber-700">
                            You have unsaved manager-review changes.
                          </p>
                        )}
                      </div>
                    </div>

                    {detail.can_edit && !detail.submission ? (
                      <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 cursor-pointer rounded-xl px-5"
                          disabled={isBusy}
                          onClick={() => saveMutation.mutate({ review: detail, values: form })}
                        >
                          <Save aria-hidden="true" className="size-4" />
                          {saveMutation.isPending ? "Saving…" : "Save draft"}
                        </Button>
                        <Button
                          type="button"
                          className="h-11 cursor-pointer rounded-xl bg-brand-700 px-5 text-white hover:bg-brand-800"
                          disabled={isBusy || detail.snapshot.goals.length === 0}
                          onClick={requestSubmission}
                        >
                          <Send aria-hidden="true" className="size-4" />
                          {submitMutation.isPending ? "Submitting…" : "Submit manager review"}
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
                <UsersRound aria-hidden="true" className="mx-auto size-10 text-gray-500" />
                <h2 className="mt-4 text-lg font-semibold text-gray-950">
                  Select an employee review
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Choose an assigned task to compare evidence and begin your assessment.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this manager review?</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">
              A final draft revision will be saved first. The manager ratings, comments,
              score comparison, and summary will then be locked as immutable evidence and
              the assigned task will be completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-gray-700">
            <div className="flex items-center justify-between gap-3">
              <span>Employee weighted score</span>
              <strong>{employeeScore === null ? "Not available" : employeeScore.toFixed(2)}</strong>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span>Manager weighted score</span>
              <strong>{liveManagerScore?.toFixed(2) ?? "Not complete"}</strong>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span>Score variance</span>
              <strong>
                {liveVariance === null
                  ? "Not available"
                  : `${liveVariance > 0 ? "+" : ""}${liveVariance.toFixed(2)}`}
              </strong>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="h-11 cursor-pointer rounded-xl"
              disabled={submitMutation.isPending}
            >
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 cursor-pointer rounded-xl bg-brand-700 text-white hover:bg-brand-800"
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

      <AlertDialog
        open={workflowAction !== null}
        onOpenChange={(open) => {
          if (!open && !workflowMutation.isPending) setWorkflowAction(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {workflowAction === "return"
                ? "Return this review to the employee?"
                : workflowAction === "reopen"
                  ? "Reopen this review task?"
                  : "Waive this review task?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-6">
              {workflowAction === "waive"
                ? "This task will close as waived. The exception category, reason, actor, and task state will be locked as evidence."
                : "A new review round will be created. Existing submissions and evidence remain unchanged and available in the workflow history."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {workflowAction === "waive" && (
            <div>
              <label
                htmlFor="workflow-exception"
                className="text-sm font-semibold text-gray-900"
              >
                Exception category
              </label>
              <select
                id="workflow-exception"
                value={waiverException}
                onChange={(event) =>
                  setWaiverException(
                    event.target.value as PerformProReviewWaiverExceptionCode,
                  )
                }
                className="mt-2 h-11 w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
              >
                {waiverExceptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label
              htmlFor="workflow-reason"
              className="text-sm font-semibold text-gray-900"
            >
              Reason <span className="text-rose-600">*</span>
            </label>
            <Textarea
              id="workflow-reason"
              value={workflowReason}
              onChange={(event) => setWorkflowReason(event.target.value)}
              placeholder={
                workflowAction === "return"
                  ? "Explain what the employee must clarify or revise."
                  : workflowAction === "reopen"
                    ? "Explain why a new review round is required."
                    : "Document why this review task cannot be completed."
              }
              className="mt-2 min-h-28 resize-y rounded-xl border-gray-300 focus-visible:border-brand-600 focus-visible:ring-brand-600/20"
              maxLength={2000}
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 10 characters.</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="h-11 cursor-pointer rounded-xl"
              disabled={workflowMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={`h-11 cursor-pointer rounded-xl text-white ${
                workflowAction === "waive"
                  ? "bg-rose-700 hover:bg-rose-800"
                  : "bg-brand-700 hover:bg-brand-800"
              }`}
              disabled={
                workflowMutation.isPending || workflowReason.trim().length < 10
              }
              onClick={(event) => {
                event.preventDefault();
                executeWorkflow();
              }}
            >
              {workflowMutation.isPending
                ? "Recording…"
                : workflowAction === "return"
                  ? "Return and open new round"
                  : workflowAction === "reopen"
                    ? "Reopen in new round"
                    : "Waive with evidence"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
