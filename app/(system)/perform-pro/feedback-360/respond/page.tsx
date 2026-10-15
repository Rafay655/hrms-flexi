"use client";

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  FileClock,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  UserRoundCheck,
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
  PerformProFeedback360Answer,
  PerformProFeedback360ResponseDetail,
  PerformProFeedback360ResponseTask,
} from "@/types/performpro";

type ResponseForm = {
  answers: Record<string, { rating: number | null; comment: string }>;
  overallComment: string;
};

const emptyForm: ResponseForm = { answers: {}, overallComment: "" };

const statusStyle: Record<PerformProFeedback360ResponseTask["status"], string> = {
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

function formFromDetail(detail: PerformProFeedback360ResponseDetail): ResponseForm {
  const evidence = detail.submission ?? detail.draft;
  return {
    answers: Object.fromEntries(
      (evidence?.answers ?? []).map((answer) => [
        answer.question_key,
        { rating: answer.rating, comment: answer.comment },
      ]),
    ),
    overallComment: evidence?.overall_comment ?? "",
  };
}

function answersFromForm(
  detail: PerformProFeedback360ResponseDetail,
  form: ResponseForm,
): PerformProFeedback360Answer[] {
  return detail.snapshot.questionnaire.questions.map((question) => ({
    question_key: question.key,
    rating: form.answers[question.key]?.rating ?? null,
    comment: form.answers[question.key]?.comment.trim() ?? "",
  }));
}

function isQuestionComplete(
  detail: PerformProFeedback360ResponseDetail,
  form: ResponseForm,
  questionKey: string,
) {
  const question = detail.snapshot.questionnaire.questions.find(
    (item) => item.key === questionKey,
  );
  const answer = form.answers[questionKey];
  if (!question) return false;
  if (question.rating_required && answer?.rating == null) return false;
  if (question.comment_required && !answer?.comment.trim()) return false;
  return true;
}

function TaskCard({
  task,
  active,
  onSelect,
}: {
  task: PerformProFeedback360ResponseTask;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={`w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
        active
          ? "border-brand-300 bg-brand-50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-950">{task.subject_name}</p>
          <p className="mt-1 truncate text-xs text-gray-500">{task.cycle_name}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusStyle[task.status]}`}>
          {humanize(task.status)}
        </span>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-gray-600">
        <CalendarClock aria-hidden="true" className="size-3.5" />
        Due {formatDateTime(task.due_at)}
      </p>
    </button>
  );
}

function ResponseLoading() {
  return (
    <div className="space-y-5" aria-label="Loading 360 feedback response">
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

export default function Feedback360ResponsePage() {
  const queryClient = useQueryClient();
  const [selectedTaskUuid, setSelectedTaskUuid] = useState<string | null>(null);
  const [formState, setFormState] = useState<{
    taskUuid: string;
    values: ResponseForm;
    dirty: boolean;
  } | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const tasksQuery = useQuery({
    queryKey: ["perform-pro", "feedback360", "responses"],
    queryFn: performProService.feedback360ResponseTasks,
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
    queryKey: ["perform-pro", "feedback360", "response", activeTaskUuid],
    queryFn: () => performProService.feedback360Response(activeTaskUuid!),
    enabled: Boolean(activeTaskUuid),
  });
  const detail = detailQuery.data ?? null;
  const form = detail
    ? formState?.taskUuid === detail.task.uuid
      ? formState.values
      : formFromDetail(detail)
    : emptyForm;
  const dirty = Boolean(
    formState
    && detail
    && formState.taskUuid === detail.task.uuid
    && formState.dirty,
  );

  function updateForm(next: ResponseForm) {
    if (!detail) return;
    setFormState({ taskUuid: detail.task.uuid, values: next, dirty: true });
  }

  function updateAnswer(
    questionKey: string,
    patch: Partial<{ rating: number | null; comment: string }>,
  ) {
    const current = form.answers[questionKey] ?? { rating: null, comment: "" };
    updateForm({
      ...form,
      answers: {
        ...form.answers,
        [questionKey]: { ...current, ...patch },
      },
    });
  }

  const saveMutation = useMutation({
    mutationFn: ({ response, values }: {
      response: PerformProFeedback360ResponseDetail;
      values: ResponseForm;
    }) => performProService.saveFeedback360Draft({
      detail: response,
      answers: answersFromForm(response, values),
      overallComment: values.overallComment,
    }),
    onSuccess: async (saved) => {
      queryClient.setQueryData(
        ["perform-pro", "feedback360", "response", saved.task.uuid],
        saved,
      );
      setFormState({
        taskUuid: saved.task.uuid,
        values: formFromDetail(saved),
        dirty: false,
      });
      toast.success(`Confidential draft revision ${saved.draft?.draft_version ?? 1} saved.`);
      await queryClient.invalidateQueries({
        queryKey: ["perform-pro", "feedback360", "responses"],
      });
    },
    onError: (error) =>
      showApiError(error, { fallbackMessage: apiMessage(error, "The confidential draft could not be saved.") }),
  });

  const submitMutation = useMutation({
    mutationFn: async ({ response, values }: {
      response: PerformProFeedback360ResponseDetail;
      values: ResponseForm;
    }) => {
      const saved = await performProService.saveFeedback360Draft({
        detail: response,
        answers: answersFromForm(response, values),
        overallComment: values.overallComment,
      });
      return performProService.submitFeedback360Response(saved);
    },
    onSuccess: async (submitted) => {
      queryClient.setQueryData(
        ["perform-pro", "feedback360", "response", submitted.task.uuid],
        submitted,
      );
      setFormState({
        taskUuid: submitted.task.uuid,
        values: formFromDetail(submitted),
        dirty: false,
      });
      setConfirmSubmit(false);
      toast.success("360 feedback submitted. Your response evidence is now locked.");
      await queryClient.invalidateQueries({
        queryKey: ["perform-pro", "feedback360", "responses"],
      });
    },
    onError: (error) => {
      setConfirmSubmit(false);
      showApiError(error, { fallbackMessage: apiMessage(error, "The 360 feedback could not be submitted.") });
    },
  });

  const completedCount = detail
    ? detail.snapshot.questionnaire.questions.filter((question) =>
        isQuestionComplete(detail, form, question.key)
      ).length
    : 0;
  const totalCount = detail?.snapshot.questionnaire.questions.length ?? 0;
  const completionPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const canSubmit = Boolean(detail?.can_edit && totalCount > 0 && completedCount === totalCount);
  const isBusy = saveMutation.isPending || submitMutation.isPending;
  const isReadOnly = !detail?.can_edit || Boolean(detail?.submission);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-3xl border border-brand-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                PerformPro · 360 feedback
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                My 360 feedback requests
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
                Give structured feedback from your direct experience. Drafts stay restricted to
                your assigned reviewer task, and final answers follow the cycle&apos;s identity policy.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-900 ring-1 ring-inset ring-brand-200">
              <ShieldCheck aria-hidden="true" className="size-5 text-brand-700" />
              <span>Confidential draft history and submission evidence are preserved.</span>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-4 shadow-sm xl:sticky xl:top-6">
            <div className="flex items-center justify-between px-1 pb-4">
              <div>
                <h2 className="font-semibold text-gray-950">Reviewer tasks</h2>
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
                aria-label="Refresh 360-feedback reviewer tasks"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={`size-4 ${tasksQuery.isFetching ? "animate-spin motion-reduce:animate-none" : ""}`}
                />
              </Button>
            </div>

            {tasksQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
            ) : tasksQuery.isError ? (
              <div role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
                <AlertCircle aria-hidden="true" className="mb-2 size-5" />
                {apiMessage(tasksQuery.error, "Reviewer tasks could not be loaded.")}
              </div>
            ) : tasksQuery.data?.length ? (
              <div className="space-y-3">
                {tasksQuery.data.map((task) => (
                  <TaskCard
                    key={task.uuid}
                    task={task}
                    active={task.uuid === activeTaskUuid}
                    onSelect={() => {
                      setSelectedTaskUuid(task.uuid);
                      setFormState(null);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-10 text-center">
                <CheckCircle2 aria-hidden="true" className="mx-auto size-8 text-gray-400" />
                <p className="mt-3 font-medium text-gray-900">No feedback requests assigned</p>
                <p className="mt-1 text-sm text-gray-500">
                  Requests appear after an approved reviewer roster is finalized and the phase opens.
                </p>
              </div>
            )}
          </aside>

          <section className="min-w-0">
            {detailQuery.isLoading ? (
              <ResponseLoading />
            ) : detailQuery.isError ? (
              <div role="alert" className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
                <AlertCircle aria-hidden="true" className="size-6" />
                <h2 className="mt-3 text-lg font-semibold">Feedback request could not be opened</h2>
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
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusStyle[detail.task.status]}`}>
                          {humanize(detail.task.status)}
                        </span>
                        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800 ring-1 ring-inset ring-brand-200">
                          {humanize(detail.snapshot.relationship_category)}
                        </span>
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800 ring-1 ring-inset ring-violet-200">
                          {humanize(detail.snapshot.anonymity_mode)}
                        </span>
                      </div>
                      <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-950">
                        Feedback for {detail.task.subject_name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">{detail.task.cycle_name}</p>
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
                    {detail.submission && (
                      <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-center ring-1 ring-inset ring-emerald-200">
                        <LockKeyhole aria-hidden="true" className="mx-auto size-5 text-emerald-700" />
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                          Final evidence locked
                        </p>
                      </div>
                    )}
                  </div>

                  {!detail.submission && (
                    <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium text-gray-900">Required responses complete</span>
                        <span className="font-semibold text-brand-800">
                          {completedCount} of {totalCount}
                        </span>
                      </div>
                      <Progress
                        value={completionPct}
                        aria-label="360-feedback completion"
                        className="mt-3 h-2.5 bg-gray-200"
                      />
                    </div>
                  )}
                </section>

                <section
                  aria-labelledby="privacy-heading"
                  className="rounded-3xl border border-violet-200 bg-violet-50 p-5 sm:p-6"
                >
                  <div className="flex items-start gap-3">
                    <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 text-violet-800" />
                    <div>
                      <h2 id="privacy-heading" className="font-semibold text-violet-950">
                        How your response is handled
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-violet-900">
                        {detail.privacy.notice}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-brand-50 p-2.5 text-brand-700">
                      <UserRoundCheck aria-hidden="true" className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-950">
                        {detail.snapshot.questionnaire.title}
                      </h2>
                      {detail.snapshot.questionnaire.instructions && (
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          {detail.snapshot.questionnaire.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {detail.snapshot.questionnaire.questions.map((question, index) => {
                  const answer = form.answers[question.key] ?? {
                    rating: null,
                    comment: "",
                  };
                  return (
                    <fieldset
                      key={question.key}
                      disabled={isReadOnly || isBusy}
                      className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm disabled:opacity-75 sm:p-6"
                    >
                      <legend className="sr-only">{question.prompt}</legend>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                        {question.section_label} · Question {index + 1}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold leading-7 text-gray-950">
                        {question.prompt}
                      </h3>
                      {question.help_text && (
                        <p className="mt-2 text-sm leading-6 text-gray-600">{question.help_text}</p>
                      )}

                      <div className="mt-5">
                        <p className="text-sm font-medium text-gray-900">
                          Rating {question.rating_required ? "(required)" : "(optional)"}
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                          {detail.snapshot.questionnaire.rating_scale.levels.map((level) => {
                            const id = `${question.key}-rating-${level.value}`;
                            return (
                              <label
                                key={level.value}
                                htmlFor={id}
                                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors ${
                                  answer.rating === level.value
                                    ? "border-brand-400 bg-brand-50 text-brand-950 ring-1 ring-brand-300"
                                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                }`}
                              >
                                <input
                                  id={id}
                                  type="radio"
                                  name={`${detail.task.uuid}-${question.key}-rating`}
                                  value={level.value}
                                  checked={answer.rating === level.value}
                                  onChange={() => updateAnswer(question.key, { rating: level.value })}
                                  className="size-4 accent-brand-700"
                                />
                                <span>
                                  <span className="font-semibold">{level.value}</span>
                                  <span className="ml-1">{level.label}</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-5">
                        <label
                          htmlFor={`${question.key}-comment`}
                          className="text-sm font-medium text-gray-900"
                        >
                          Supporting comment {question.comment_required ? "(required)" : "(optional)"}
                        </label>
                        <Textarea
                          id={`${question.key}-comment`}
                          value={answer.comment}
                          onChange={(event) =>
                            updateAnswer(question.key, { comment: event.target.value })
                          }
                          placeholder="Share specific, constructive observations."
                          className="mt-2 min-h-28 resize-y rounded-xl"
                          maxLength={10000}
                        />
                      </div>
                    </fieldset>
                  );
                })}

                <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-brand-50 p-2.5 text-brand-700">
                      <MessageSquareText aria-hidden="true" className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-950">Overall comment</h2>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        Add any balanced context that is not covered by the individual questions.
                      </p>
                    </div>
                  </div>
                  <label htmlFor="feedback360-overall-comment" className="sr-only">
                    Overall 360-feedback comment
                  </label>
                  <Textarea
                    id="feedback360-overall-comment"
                    value={form.overallComment}
                    onChange={(event) =>
                      updateForm({ ...form, overallComment: event.target.value })
                    }
                    disabled={isReadOnly || isBusy}
                    placeholder="Optional overall feedback"
                    className="mt-5 min-h-36 resize-y rounded-xl"
                    maxLength={20000}
                  />
                </section>

                <footer className="sticky bottom-4 z-10 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                  {(saveMutation.isError || submitMutation.isError) && (
                    <div
                      role="alert"
                      className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
                    >
                      {apiMessage(
                        saveMutation.error ?? submitMutation.error,
                        "Your response could not be saved. Review the form and try again.",
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-600" aria-live="polite">
                      {detail.submission
                        ? `Submitted ${formatDateTime(detail.submission.occurred_at)}`
                        : dirty
                          ? "You have unsaved changes."
                          : detail.draft
                            ? `Draft revision ${detail.draft.draft_version} saved.`
                            : "No draft saved yet."}
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl"
                        disabled={isReadOnly || isBusy || !dirty}
                        onClick={() => detail && saveMutation.mutate({
                          response: detail,
                          values: form,
                        })}
                      >
                        <Save aria-hidden="true" className="size-4" />
                        {saveMutation.isPending ? "Saving…" : "Save confidential draft"}
                      </Button>
                      <Button
                        type="button"
                        className="h-11 rounded-xl"
                        disabled={isReadOnly || isBusy || !canSubmit}
                        onClick={() => setConfirmSubmit(true)}
                      >
                        <Send aria-hidden="true" className="size-4" />
                        Submit final feedback
                      </Button>
                    </div>
                  </div>
                  {!canSubmit && detail.can_edit && !detail.submission && (
                    <p className="mt-3 text-xs text-amber-800" role="status">
                      Complete every required rating and comment before final submission.
                    </p>
                  )}
                </footer>
              </div>
            ) : selectedTask ? (
              <ResponseLoading />
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                <UserRoundCheck aria-hidden="true" className="mx-auto size-9 text-gray-400" />
                <h2 className="mt-4 text-lg font-semibold text-gray-950">Select a feedback request</h2>
              </div>
            )}
          </section>
        </div>
      </div>

      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit final 360 feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This locks your answers as immutable submission evidence. You will not be able to
              edit the response after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitMutation.isPending}>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitMutation.isPending || !detail}
              onClick={(event) => {
                event.preventDefault();
                if (detail) {
                  submitMutation.mutate({ response: detail, values: form });
                }
              }}
            >
              {submitMutation.isPending ? "Submitting…" : "Submit and lock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
