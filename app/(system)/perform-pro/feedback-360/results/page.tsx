"use client";

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  EyeOff,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  Send,
  ShieldCheck,
  UsersRound,
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
import { Skeleton } from "@/components/ui/skeleton";
import { performProService } from "@/services/performpro";
import type {
  PerformProFeedback360QuestionResult,
  PerformProFeedback360Relationship,
  PerformProFeedback360Result,
  PerformProFeedback360ResultState,
} from "@/types/performpro";

const stateStyle: Record<PerformProFeedback360ResultState, string> = {
  NOT_CALCULATED: "bg-slate-100 text-slate-700 ring-slate-200",
  BLOCKED: "bg-amber-50 text-amber-900 ring-amber-200",
  READY_FOR_RELEASE: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  RELEASED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

const relationshipLabel: Record<PerformProFeedback360Relationship, string> = {
  MANAGER: "Manager",
  PEER: "Peers",
  DIRECT_REPORT: "Direct reports",
  CROSS_FUNCTIONAL: "Cross-functional",
  INTERNAL_CUSTOMER: "Internal customers",
  OTHER: "Other",
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

function subjectName(result: PerformProFeedback360Result) {
  const name = result.subject.employee_name ?? result.subject.full_name;
  return typeof name === "string" && name.trim()
    ? name
    : "Review participant";
}

function subjectMeta(result: PerformProFeedback360Result) {
  const code = result.subject.employee_code;
  const department = result.subject.department_name
    ?? result.subject.department;
  return [code, department]
    .filter((value): value is string => typeof value === "string" && value !== "")
    .join(" · ");
}

function ResultStateBadge({ state }: { state: PerformProFeedback360ResultState }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${stateStyle[state]}`}>
      {humanize(state)}
    </span>
  );
}

function ResultCard({
  result,
  active,
  onSelect,
}: {
  result: PerformProFeedback360Result;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={`w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
        active
          ? "border-indigo-300 bg-indigo-50/70"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-950">{subjectName(result)}</p>
          <p className="mt-1 truncate text-xs text-gray-500">{result.cycle_name}</p>
        </div>
        <ResultStateBadge state={result.result_state} />
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-gray-600">
        {result.result_state === "RELEASED"
          ? <CheckCircle2 aria-hidden="true" className="size-3.5 text-emerald-600" />
          : <Clock3 aria-hidden="true" className="size-3.5" />}
        {result.release
          ? `Released ${formatDateTime(result.release.occurred_at)}`
          : `${humanize(result.phase_status)} feedback phase`}
      </p>
    </button>
  );
}

function ScoreBar({
  value,
  maximum,
  label,
}: {
  value: number | null;
  maximum: number;
  label: string;
}) {
  if (value === null) {
    return (
      <div className="flex min-h-11 items-center gap-2 rounded-lg bg-slate-100 px-3 text-xs font-medium text-slate-600">
        <EyeOff aria-hidden="true" className="size-3.5" />
        Suppressed
      </div>
    );
  }

  const percentage = Math.min(100, Math.max(0, (value / maximum) * 100));
  return (
    <div className="flex items-center gap-3">
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={maximum}
        aria-valuenow={value}
        className="h-2.5 min-w-24 flex-1 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-indigo-600"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-12 text-right text-sm font-semibold tabular-nums text-gray-950">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function ScoreTable({
  questions,
  maximum,
}: {
  questions: PerformProFeedback360QuestionResult[];
  maximum: number;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full min-w-[620px] text-left text-sm">
        <caption className="sr-only">
          Aggregated 360-feedback question scores and response counts
        </caption>
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-gray-600">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Question</th>
            <th scope="col" className="px-4 py-3 font-semibold">Section</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Responses</th>
            <th scope="col" className="px-4 py-3 font-semibold">Average</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {questions.map((question) => (
            <tr key={question.key}>
              <th scope="row" className="max-w-md px-4 py-4 font-medium text-gray-950">
                {question.prompt}
              </th>
              <td className="px-4 py-4 text-gray-600">{question.section_label}</td>
              <td className="px-4 py-4 text-right tabular-nums text-gray-700">
                {question.response_count}
              </td>
              <td className="min-w-52 px-4 py-4">
                <ScoreBar
                  value={question.average_rating}
                  maximum={maximum}
                  label={`${question.prompt}: ${question.average_rating ?? "suppressed"} out of ${maximum}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultLoading() {
  return (
    <div className="space-y-5" aria-label="Loading 360-feedback results">
      <Skeleton className="h-52 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

export default function Feedback360ResultsPage() {
  const queryClient = useQueryClient();
  const [selectedParticipantUuid, setSelectedParticipantUuid] = useState<string | null>(null);
  const [confirmRelease, setConfirmRelease] = useState(false);

  const resultsQuery = useQuery({
    queryKey: ["perform-pro", "feedback360", "results"],
    queryFn: performProService.feedback360Results,
  });

  const activeParticipantUuid = selectedParticipantUuid
    ?? resultsQuery.data?.[0]?.participant_uuid
    ?? null;

  const resultQuery = useQuery({
    queryKey: ["perform-pro", "feedback360", "result", activeParticipantUuid],
    queryFn: () => performProService.feedback360Result(activeParticipantUuid!),
    enabled: Boolean(activeParticipantUuid),
  });

  const selected = resultQuery.data
    ?? resultsQuery.data?.find(
      (item) => item.participant_uuid === activeParticipantUuid,
    )
    ?? null;

  function updateResult(next: PerformProFeedback360Result) {
    queryClient.setQueryData(
      ["perform-pro", "feedback360", "result", next.participant_uuid],
      next,
    );
    queryClient.setQueryData<PerformProFeedback360Result[]>(
      ["perform-pro", "feedback360", "results"],
      (current) => current?.map((item) => (
        item.participant_uuid === next.participant_uuid ? next : item
      )) ?? [next],
    );
  }

  const recalculateMutation = useMutation({
    mutationFn: (result: PerformProFeedback360Result) =>
      performProService.recalculateFeedback360Result(result),
    onSuccess: (next) => {
      updateResult(next);
      toast.success(
        next.result_state === "BLOCKED"
          ? "Aggregation completed with privacy or response thresholds unmet."
          : "360-feedback result recalculated.",
      );
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The 360-feedback result could not be recalculated.") }),
  });

  const releaseMutation = useMutation({
    mutationFn: (result: PerformProFeedback360Result) =>
      performProService.releaseFeedback360Result(result),
    onSuccess: (next) => {
      updateResult(next);
      setConfirmRelease(false);
      toast.success("360-feedback results released to the employee.");
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The 360-feedback result could not be released.") }),
  });

  const maximumRating = useMemo(() => {
    const levels = selected?.aggregate?.aggregation.rating_scale.levels ?? [];
    return Math.max(1, ...levels.map((level) => level.value));
  }, [selected]);

  const comments = useMemo(() => {
    if (!selected?.aggregate) return [];
    return [
      ...selected.aggregate.aggregation.overall_comments.map((comment) => ({
        ...comment,
        context: "Overall feedback",
      })),
      ...selected.aggregate.aggregation.questions.flatMap((question) =>
        question.comments.map((comment) => ({
          ...comment,
          context: question.prompt,
        })),
      ),
    ];
  }, [selected]);

  const isLoading = resultsQuery.isLoading || (
    Boolean(activeParticipantUuid) && resultQuery.isLoading && !selected
  );

  return (
    <main className="min-h-screen bg-slate-50/70 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              PerformPro · Feedback intelligence
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              360 feedback results
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Review aggregated scores and themes while preserving the anonymity rules
              frozen with each reviewer roster.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              void resultsQuery.refetch();
              if (activeParticipantUuid) void resultQuery.refetch();
            }}
            disabled={resultsQuery.isFetching || resultQuery.isFetching}
            className="min-h-11"
          >
            <RefreshCw
              aria-hidden="true"
              className={`mr-2 size-4 ${
                resultsQuery.isFetching || resultQuery.isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh results
          </Button>
        </header>

        <section className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-indigo-700" />
            <div>
              <h2 className="font-semibold text-indigo-950">Privacy protection is active</h2>
              <p className="mt-1 text-sm leading-6 text-indigo-900/80">
                Reviewer identities and raw response records never appear here. Relationship
                cohorts and comments are suppressed when they do not meet the frozen minimum
                group size.
              </p>
            </div>
          </div>
        </section>

        {resultsQuery.isError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
            <div className="flex items-start gap-3">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <div>
                <h2 className="font-semibold">Results could not be loaded</h2>
                <p className="mt-1 text-sm">
                  {apiMessage(resultsQuery.error, "Try refreshing the results queue.")}
                </p>
              </div>
            </div>
          </section>
        ) : resultsQuery.data?.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <UsersRound aria-hidden="true" className="mx-auto size-10 text-gray-400" />
            <h2 className="mt-4 font-semibold text-gray-950">No finalized feedback rosters</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-600">
              Results become available for aggregation after reviewer rosters are finalized
              and every reviewer task is completed, waived, or cancelled.
            </p>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside aria-label="360-feedback result participants" className="space-y-3">
              {resultsQuery.isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-32 rounded-2xl" />
                ))
                : resultsQuery.data?.map((result) => (
                  <ResultCard
                    key={result.participant_uuid}
                    result={result}
                    active={result.participant_uuid === activeParticipantUuid}
                    onSelect={() => setSelectedParticipantUuid(result.participant_uuid)}
                  />
                ))}
            </aside>

            <section aria-live="polite">
              {isLoading || !selected ? (
                <ResultLoading />
              ) : resultQuery.isError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
                  <h2 className="font-semibold">This result could not be loaded</h2>
                  <p className="mt-1 text-sm">
                    {apiMessage(resultQuery.error, "Select the participant again or refresh.")}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-bold text-gray-950">
                            {subjectName(selected)}
                          </h2>
                          <ResultStateBadge state={selected.result_state} />
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{selected.cycle_name}</p>
                        {subjectMeta(selected) && (
                          <p className="mt-1 text-xs text-gray-500">{subjectMeta(selected)}</p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600">
                          <span>Phase: <strong>{humanize(selected.phase_status)}</strong></span>
                          <span>
                            Aggregate version:{" "}
                            <strong>{selected.aggregate?.run_version ?? "Not calculated"}</strong>
                          </span>
                          <span>
                            Responses:{" "}
                            <strong>{selected.aggregate?.source_submission_count ?? "—"}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selected.capabilities.can_recalculate && (
                          <Button
                            variant="outline"
                            className="min-h-11"
                            onClick={() => recalculateMutation.mutate(selected)}
                            disabled={recalculateMutation.isPending || releaseMutation.isPending}
                          >
                            <RefreshCw
                              aria-hidden="true"
                              className={`mr-2 size-4 ${
                                recalculateMutation.isPending ? "animate-spin" : ""
                              }`}
                            />
                            {selected.aggregate ? "Recalculate" : "Calculate result"}
                          </Button>
                        )}
                        {selected.capabilities.can_release && (
                          <Button
                            className="min-h-11 bg-indigo-700 hover:bg-indigo-800"
                            onClick={() => setConfirmRelease(true)}
                            disabled={releaseMutation.isPending || recalculateMutation.isPending}
                          >
                            <Send aria-hidden="true" className="mr-2 size-4" />
                            Release to employee
                          </Button>
                        )}
                      </div>
                    </div>
                  </section>

                  {selected.result_state === "NOT_CALCULATED" && (
                    <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                      <BarChart3 aria-hidden="true" className="mx-auto size-10 text-gray-400" />
                      <h3 className="mt-4 font-semibold text-gray-950">No aggregation evidence yet</h3>
                      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
                        A manager or review administrator can calculate results after all reviewer
                        tasks have reached a terminal state. Employees see results only after release.
                      </p>
                    </section>
                  )}

                  {selected.aggregate?.status === "BLOCKED" && (
                    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <div className="flex items-start gap-3">
                        <LockKeyhole aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-800" />
                        <div>
                          <h3 className="font-semibold text-amber-950">
                            Result blocked by release safeguards
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-amber-900/80">
                            Scores and comments remain hidden until every response and anonymity
                            threshold below is satisfied.
                          </p>
                          <ul className="mt-3 space-y-2 text-sm text-amber-950">
                            {selected.aggregate.suppression.blocked_reasons.map((reason) => (
                              <li key={reason} className="flex items-center gap-2">
                                <AlertCircle aria-hidden="true" className="size-4" />
                                {humanize(reason)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </section>
                  )}

                  {selected.aggregate?.status === "READY" && (
                    <>
                      <section className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Overall score
                          </p>
                          <p className="mt-2 text-3xl font-bold tabular-nums text-gray-950">
                            {selected.aggregate.aggregation.overall_score?.toFixed(2) ?? "—"}
                            <span className="ml-1 text-sm font-medium text-gray-500">
                              / {maximumRating}
                            </span>
                          </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Completed responses
                          </p>
                          <p className="mt-2 text-3xl font-bold tabular-nums text-gray-950">
                            {selected.aggregate.source_submission_count}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            of {selected.aggregate.source_task_count} assigned tasks
                          </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Privacy threshold
                          </p>
                          <p className="mt-2 text-3xl font-bold tabular-nums text-gray-950">
                            {selected.aggregate.minimum_group_size}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            minimum responses per relationship
                          </p>
                        </div>
                      </section>

                      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5">
                          <h3 className="font-semibold text-gray-950">Scores by question</h3>
                          <p className="mt-1 text-sm text-gray-600">
                            Aggregated ratings on the frozen questionnaire scale.
                          </p>
                        </div>
                        <ScoreTable
                          questions={selected.aggregate.aggregation.questions}
                          maximum={maximumRating}
                        />
                      </section>

                      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center gap-3">
                          <UsersRound aria-hidden="true" className="size-5 text-indigo-700" />
                          <div>
                            <h3 className="font-semibold text-gray-950">Relationship groups</h3>
                            <p className="text-sm text-gray-600">
                              Small cohorts are hidden as a complete unit.
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {selected.aggregate.aggregation.relationship_summary.map((group) => (
                            <article
                              key={group.relationship_category}
                              className="rounded-xl border border-gray-200 p-4"
                            >
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <h4 className="font-medium text-gray-950">
                                  {relationshipLabel[group.relationship_category]}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {group.response_count === null
                                    ? "Below privacy threshold"
                                    : `${group.response_count} response${group.response_count === 1 ? "" : "s"}`}
                                </span>
                              </div>
                              <ScoreBar
                                value={group.average_rating}
                                maximum={maximumRating}
                                label={`${relationshipLabel[group.relationship_category]} average`}
                              />
                              {group.suppressed && (
                                <p className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                                  <EyeOff aria-hidden="true" className="size-3.5" />
                                  Hidden because the privacy threshold was not met.
                                </p>
                              )}
                            </article>
                          ))}
                        </div>
                      </section>

                      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center gap-3">
                          <MessageSquareText aria-hidden="true" className="size-5 text-indigo-700" />
                          <div>
                            <h3 className="font-semibold text-gray-950">Feedback themes</h3>
                            <p className="text-sm text-gray-600">
                              Comments from cohorts that satisfy the privacy threshold.
                            </p>
                          </div>
                        </div>
                        {comments.length === 0 ? (
                          <div className="rounded-xl bg-slate-50 p-5 text-sm text-gray-600">
                            No releasable comments are available. Comments may be absent or
                            suppressed by the relationship-group threshold.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {comments.map((comment) => (
                              <article
                                key={`${comment.comment_id}-${comment.context}`}
                                className="rounded-xl border border-gray-200 p-4"
                              >
                                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                                  <span>{relationshipLabel[comment.relationship_category]}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{comment.context}</span>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-gray-800">{comment.text}</p>
                              </article>
                            ))}
                          </div>
                        )}
                      </section>
                    </>
                  )}

                  {selected.release && (
                    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-700" />
                        <div>
                          <h3 className="font-semibold text-emerald-950">
                            Released to the employee
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-emerald-900/80">
                            This immutable result was released on{" "}
                            {formatDateTime(selected.release.occurred_at)}. Reviewer identity
                            disclosure remains set to none.
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
                    <div className="flex items-start gap-3 text-sm text-slate-700">
                      <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                      <p>{selected.privacy.notice}</p>
                    </div>
                  </section>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <AlertDialog open={confirmRelease} onOpenChange={setConfirmRelease}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release these 360-feedback results?</AlertDialogTitle>
            <AlertDialogDescription>
              {selected
                ? `${subjectName(selected)} will be able to view this immutable aggregate. Reviewer identities and suppressed cohorts will remain hidden.`
                : "The employee will be able to view this immutable aggregate."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={releaseMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (selected) releaseMutation.mutate(selected);
              }}
              disabled={!selected || releaseMutation.isPending}
              className="bg-indigo-700 hover:bg-indigo-800"
            >
              {releaseMutation.isPending ? "Releasing…" : "Release results"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
