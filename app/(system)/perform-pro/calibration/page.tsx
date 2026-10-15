"use client";

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Fingerprint,
  LockKeyhole,
  Play,
  Plus,
  RefreshCw,
  Save,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRoundCheck,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { performProService } from "@/services/performpro";
import type {
  PerformProCalibrationCohortInput,
  PerformProCalibrationAdjustmentReason,
  PerformProCalibrationParticipantCandidate,
  PerformProCalibrationParticipantSnapshot,
  PerformProCalibrationReviewFlag,
  PerformProCalibrationSession,
  PerformProCalibrationSetupContext,
} from "@/types/performpro";

type ViewMode = "sessions" | "setup";
type CohortDraft = PerformProCalibrationCohortInput & { localId: string };

const adjustmentReasons: Array<{
  value: PerformProCalibrationAdjustmentReason;
  label: string;
}> = [
  { value: "EVIDENCE_REASSESSMENT", label: "Evidence reassessment" },
  { value: "CONSISTENCY_ALIGNMENT", label: "Cross-cohort consistency" },
  { value: "ROLE_COMPLEXITY", label: "Role complexity" },
  { value: "PERFORMANCE_CONTEXT", label: "Performance context" },
  { value: "RATING_SCALE_ALIGNMENT", label: "Rating-scale alignment" },
  { value: "OTHER", label: "Other documented reason" },
];

const reviewFlags: Array<{
  value: PerformProCalibrationReviewFlag;
  label: string;
}> = [
  { value: "PERFORMANCE_EVIDENCE", label: "Performance evidence" },
  { value: "MANAGER_BIAS_REVIEW", label: "Manager-bias review" },
  { value: "CROSS_COHORT_CONSISTENCY", label: "Cross-cohort consistency" },
  { value: "ROLE_SCOPE_CHANGE", label: "Role or scope change" },
  { value: "DATA_QUALITY", label: "Data quality" },
  { value: "EXCEPTION", label: "Documented exception" },
];

function apiMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string; error?: { message?: string } }>(error)) {
    return error.response?.data?.message
      ?? error.response?.data?.error?.message
      ?? fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isForbidden(error: unknown) {
  return isAxiosError(error) && error.response?.status === 403;
}

function humanize(value: string | null) {
  if (!value) return "Not available";
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

function organizationMeta(organization: Record<string, unknown>) {
  const values = [
    organization.employee_code,
    organization.department_name ?? organization.department,
    organization.grade_band_name ?? organization.grade_band,
  ];
  return values
    .filter((value): value is string => typeof value === "string" && value.trim() !== "")
    .join(" · ");
}

function kebabCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function StateMessage({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-600">
        <Scale aria-hidden="true" className="size-6" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{detail}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="space-y-5" aria-label="Loading calibration workspace">
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}

function SessionDetail({
  session,
  opening,
  adjusting,
  completing,
  onOpen,
  onAdjust,
  onComplete,
}: {
  session: PerformProCalibrationSession;
  opening: boolean;
  adjusting: boolean;
  completing: boolean;
  onOpen: () => Promise<void>;
  onAdjust: (
    participant: PerformProCalibrationParticipantSnapshot,
    score: number,
    reason: PerformProCalibrationAdjustmentReason,
    detail: string,
    flags: PerformProCalibrationReviewFlag[],
  ) => Promise<void>;
  onComplete: (note: string) => Promise<void>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completionNote, setCompletionNote] = useState("");
  const [target, setTarget] = useState<PerformProCalibrationParticipantSnapshot | null>(null);
  const [score, setScore] = useState("");
  const [reason, setReason] = useState<PerformProCalibrationAdjustmentReason>(
    "EVIDENCE_REASSESSMENT",
  );
  const [reasonDetail, setReasonDetail] = useState("");
  const [flags, setFlags] = useState<PerformProCalibrationReviewFlag[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const executionStatus = session.execution?.status ?? "READY";
  const statusStyle = executionStatus === "COMPLETED"
    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : executionStatus === "OPEN"
      ? "bg-indigo-50 text-indigo-800 ring-indigo-200"
      : "bg-amber-50 text-amber-900 ring-amber-200";

  function selectParticipant(participant: PerformProCalibrationParticipantSnapshot) {
    setTarget(participant);
    setScore(participant.current_score.toFixed(2));
    setReason("EVIDENCE_REASSESSMENT");
    setReasonDetail("");
    setFlags([]);
    setFormError(null);
  }

  async function submitAdjustment() {
    if (!target) return;
    const nextScore = Number(score);
    if (!Number.isFinite(nextScore) || nextScore < 1 || nextScore > 5) {
      setFormError("Enter a score between 1.00 and 5.00.");
      return;
    }
    if (Math.abs(nextScore - target.current_score) < 0.001) {
      setFormError("The new score must differ from the current score.");
      return;
    }
    if (reasonDetail.trim().length < 10) {
      setFormError("Document at least 10 characters of supporting rationale.");
      return;
    }
    if (flags.length === 0) {
      setFormError("Select at least one review flag.");
      return;
    }
    setFormError(null);
    try {
      await onAdjust(target, nextScore, reason, reasonDetail.trim(), flags);
      setTarget(null);
    } catch {
      // The parent mutation surfaces the API message and refreshes stale state.
    }
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 bg-indigo-50 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                <ShieldCheck aria-hidden="true" className="size-4" />
                Versioned calibration evidence
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {session.name}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{session.cycle_name}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusStyle}`}>
                {humanize(executionStatus)}
              </span>
              {session.capabilities.can_open ? (
                <Button
                  type="button"
                  className="min-h-11"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Play aria-hidden="true" className="size-4" />
                  Open session
                </Button>
              ) : null}
              {session.capabilities.can_complete ? (
                <Button
                  type="button"
                  className="min-h-11 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setConfirmComplete(true)}
                >
                  <LockKeyhole aria-hidden="true" className="size-4" />
                  Complete session
                </Button>
              ) : null}
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Scheduled", formatDateTime(session.scheduled_at)],
              ["Execution version", String(session.execution?.lock_version ?? 0)],
              ["Score adjustments", String(session.execution?.adjustment_count ?? 0)],
              ["Adjusted participants", `${session.execution?.adjusted_participant_count ?? 0} / ${session.participant_count}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-indigo-100 bg-white p-3">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Evidence chain
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Every score change advances the session version and retains its previous value,
              reason, flags, actor and tamper-evident hash.
            </p>
            <p className="mt-2 break-all font-mono text-[11px] leading-5 text-slate-500">
              {session.execution?.current_evidence_hash ?? session.setup_hash}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Lifecycle
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {session.execution
                ? `Opened ${formatDateTime(session.execution.opened_at)}`
                : `Ready · scheduled ${formatDateTime(session.scheduled_at)}`}
            </p>
            {session.execution?.completed_at ? (
              <p className="mt-1 text-sm font-medium text-emerald-700">
                Completed {formatDateTime(session.execution.completed_at)}
              </p>
            ) : null}
            {session.execution?.completion ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {session.execution.completion.completion_note}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {target ? (
        <section
          aria-labelledby="score-adjustment-title"
          className="rounded-2xl border border-indigo-300 bg-white p-5 ring-4 ring-indigo-50"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Immutable score adjustment
              </p>
              <h3 id="score-adjustment-title" className="mt-1 text-lg font-semibold text-slate-950">
                {target.display_name}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Baseline {target.pre_calibration_score.toFixed(2)}
                {" · "}Current {target.current_score.toFixed(2)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              onClick={() => setTarget(null)}
              disabled={adjusting}
            >
              Cancel
            </Button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[180px_280px_minmax(0,1fr)]">
            <div>
              <label htmlFor="adjusted-score" className="text-sm font-medium text-slate-800">
                New score
              </label>
              <Input
                id="adjusted-score"
                type="number"
                inputMode="decimal"
                min={1}
                max={5}
                step={0.25}
                value={score}
                onChange={(event) => setScore(event.target.value)}
                className="mt-2 h-11"
              />
            </div>
            <div>
              <label htmlFor="adjustment-reason" className="text-sm font-medium text-slate-800">
                Reason
              </label>
              <select
                id="adjustment-reason"
                value={reason}
                onChange={(event) => setReason(
                  event.target.value as PerformProCalibrationAdjustmentReason,
                )}
                className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30"
              >
                {adjustmentReasons.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="adjustment-detail" className="text-sm font-medium text-slate-800">
                Evidence-based rationale
              </label>
              <Textarea
                id="adjustment-detail"
                value={reasonDetail}
                onChange={(event) => setReasonDetail(event.target.value)}
                placeholder="Explain the evidence considered and why this score is consistent…"
                className="mt-2 min-h-24"
                maxLength={2000}
              />
            </div>
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-slate-800">
              Review flags · select at least one
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {reviewFlags.map((option) => {
                const checked = flags.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm text-slate-800 transition-colors hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => setFlags(
                        value === true
                          ? [...flags, option.value]
                          : flags.filter((flag) => flag !== option.value),
                      )}
                      className="size-5"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {formError ? (
            <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
              {formError}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              className="min-h-11 min-w-44"
              onClick={submitAdjustment}
              disabled={adjusting}
            >
              {adjusting
                ? <RefreshCw aria-hidden="true" className="size-4 animate-spin" />
                : <Save aria-hidden="true" className="size-4" />}
              {adjusting ? "Recording…" : "Record adjustment"}
            </Button>
          </div>
        </section>
      ) : null}

      {(session.cohorts ?? []).map((cohort) => (
        <section key={cohort.uuid} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Cohort {cohort.sequence}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">{cohort.name}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {humanize(cohort.scope_type)}
                {cohort.scope_value ? ` · ${cohort.scope_value}` : " · Curated roster"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                {cohort.participant_count} participants
              </span>
              {cohort.capabilities.can_adjust ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                  Adjustment access
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {cohort.facilitators.map((facilitator) => (
              <span
                key={facilitator.uuid}
                className="inline-flex min-h-9 items-center gap-2 rounded-full bg-slate-50 px-3 text-sm text-slate-800 ring-1 ring-inset ring-slate-200"
              >
                <UserRoundCheck aria-hidden="true" className="size-4 text-indigo-600" />
                {facilitator.display_name}
                <span className="text-xs font-medium text-slate-500">
                  {humanize(facilitator.role)}
                </span>
              </span>
            ))}
          </div>

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[880px] text-left text-sm">
              <caption className="sr-only">
                Baseline, current and adjusted calibration scores for {cohort.name}
              </caption>
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Participant</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Baseline</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Current</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Change</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Evidence</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cohort.participants.map((participant) => (
                  <tr key={participant.uuid}>
                    <th scope="row" className="px-4 py-4 font-medium text-slate-950">
                      {participant.display_name}
                      <span className="mt-1 block text-xs font-normal text-slate-500">
                        {organizationMeta(participant.organization) || "Organization snapshot retained"}
                      </span>
                    </th>
                    <td className="px-4 py-4 tabular-nums text-slate-700">
                      {participant.pre_calibration_score.toFixed(2)}
                      <span className="mt-1 block text-xs text-slate-500">
                        Self {participant.employee_score?.toFixed(2) ?? "—"}
                      </span>
                    </td>
                    <td className="min-w-48 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          role="meter"
                          aria-label={`${participant.display_name} current calibrated score`}
                          aria-valuemin={1}
                          aria-valuemax={5}
                          aria-valuenow={participant.current_score}
                          className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200"
                        >
                          <div
                            className={`h-full rounded-full ${
                              participant.adjusted ? "bg-emerald-600" : "bg-indigo-600"
                            }`}
                            style={{ width: `${participant.current_score / 5 * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold tabular-nums text-slate-950">
                          {participant.current_score.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className={`px-4 py-4 text-right font-semibold tabular-nums ${
                      participant.calibration_variance > 0
                        ? "text-emerald-700"
                        : participant.calibration_variance < 0
                          ? "text-rose-700"
                          : "text-slate-500"
                    }`}>
                      {participant.calibration_variance > 0 ? "+" : ""}
                      {participant.calibration_variance.toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      {participant.latest_adjustment ? (
                        <details className="max-w-xs">
                          <summary className="cursor-pointer font-medium text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                            {humanize(participant.latest_adjustment.reason_code)}
                          </summary>
                          <p className="mt-2 text-xs leading-5 text-slate-600">
                            {participant.latest_adjustment.reason_detail}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {participant.adjustment_history.length} immutable adjustment
                            {participant.adjustment_history.length === 1 ? "" : "s"}
                          </p>
                        </details>
                      ) : (
                        <span className="text-xs text-slate-500">Baseline retained</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {participant.capabilities.can_adjust ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-11"
                          onClick={() => selectParticipant(participant)}
                        >
                          <SlidersHorizontal aria-hidden="true" className="size-4" />
                          Adjust
                        </Button>
                      ) : (
                        <LockKeyhole aria-label="Score adjustment locked" className="ml-auto size-4 text-slate-400" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {session.execution?.completion ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 text-emerald-700" />
            <div>
              <h3 className="font-semibold text-emerald-950">Final score evidence frozen</h3>
              <p className="mt-1 text-sm leading-6 text-emerald-900">
                {session.execution.completion.adjusted_participant_count} of{" "}
                {session.execution.completion.participant_count} participants were adjusted
                across {session.execution.completion.adjustment_count} evidence records.
              </p>
              <p className="mt-2 break-all font-mono text-[11px] text-emerald-800">
                {session.execution.completion.completion_hash}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Open this calibration session?</AlertDialogTitle>
            <AlertDialogDescription>
              Opening starts version 1 of the execution evidence chain. Assigned facilitators
              will be notified and authorized cohorts can begin recording adjustments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={opening}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={opening}
              onClick={(event) => {
                event.preventDefault();
                void onOpen()
                  .then(() => setConfirmOpen(false))
                  .catch(() => undefined);
              }}
            >
              {opening ? "Opening…" : "Open session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmComplete} onOpenChange={setConfirmComplete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete and freeze final scores?</AlertDialogTitle>
            <AlertDialogDescription>
              This is irreversible. Current scores, adjustment hashes and the completion
              rationale will be frozen as the final calibration evidence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <label htmlFor="completion-note" className="text-sm font-medium text-slate-800">
              Completion rationale
            </label>
            <Textarea
              id="completion-note"
              value={completionNote}
              onChange={(event) => setCompletionNote(event.target.value)}
              placeholder="Confirm how the panel reconciled the cohort and evidence…"
              className="mt-2 min-h-28"
              maxLength={2000}
            />
            {completionNote.trim().length > 0 && completionNote.trim().length < 10 ? (
              <p role="alert" className="mt-2 text-sm text-rose-700">
                Enter at least 10 characters.
              </p>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={completing || completionNote.trim().length < 10}
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={(event) => {
                event.preventDefault();
                void onComplete(completionNote.trim())
                  .then(() => {
                    setConfirmComplete(false);
                    setCompletionNote("");
                  })
                  .catch(() => undefined);
              }}
            >
              {completing ? "Completing…" : "Complete session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function participantCard(
  participant: PerformProCalibrationParticipantCandidate,
  controlId: string,
  checked: boolean,
  disabled: boolean,
  onChange: (checked: boolean) => void,
) {
  return (
    <label
      key={participant.participant_uuid}
      htmlFor={controlId}
      className={`flex min-h-16 items-start gap-3 rounded-xl border p-3 transition-colors ${
        checked
          ? "border-indigo-300 bg-indigo-50/70"
          : "border-slate-200 bg-white hover:border-slate-300"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <Checkbox
        id={controlId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(value === true)}
        className="mt-1 size-5"
      />
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-slate-950">{participant.display_name}</span>
        <span className="mt-0.5 block text-xs text-slate-500">
          {organizationMeta(participant.organization) || participant.employee_uuid}
        </span>
        {!participant.eligible ? (
          <span className="mt-1 block text-xs font-medium text-amber-800">
            {participant.conflicts.map(humanize).join(" · ")}
          </span>
        ) : null}
      </span>
      <span className="text-sm font-semibold tabular-nums text-indigo-700">
        {participant.pre_calibration_score?.toFixed(2) ?? "—"}
      </span>
    </label>
  );
}

function SetupBuilder({
  context,
  sessionName,
  scheduledAt,
  durationMinutes,
  cohorts,
  submitting,
  onSessionName,
  onScheduledAt,
  onDuration,
  onCohorts,
  onSubmit,
}: {
  context: PerformProCalibrationSetupContext;
  sessionName: string;
  scheduledAt: string;
  durationMinutes: string;
  cohorts: CohortDraft[];
  submitting: boolean;
  onSessionName: (value: string) => void;
  onScheduledAt: (value: string) => void;
  onDuration: (value: string) => void;
  onCohorts: (cohorts: CohortDraft[]) => void;
  onSubmit: () => void;
}) {
  const policy = context.policy;
  const selectedParticipants = useMemo(
    () => new Set(cohorts.flatMap((cohort) => cohort.participant_uuids)),
    [cohorts],
  );

  function updateCohort(localId: string, patch: Partial<CohortDraft>) {
    onCohorts(
      cohorts.map((cohort) => cohort.localId === localId ? { ...cohort, ...patch } : cohort),
    );
  }

  function addCohort() {
    const index = cohorts.length + 1;
    onCohorts([
      ...cohorts,
      {
        localId: crypto.randomUUID(),
        name: `Cohort ${index}`,
        cohort_key: `cohort-${index}`,
        scope_type: policy.cohort_strategy,
        scope_value: null,
        participant_uuids: [],
        lead_facilitator_employee_uuid: "",
        co_facilitator_employee_uuids: [],
      },
    ]);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
              Bound calibration policy
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Version {policy.binding_version} · {humanize(policy.cohort_strategy)} cohorts
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Each cohort requires {policy.minimum_cohort_size}–{policy.maximum_cohort_size}
              {" "}eligible participants and at least {policy.minimum_facilitators_per_cohort}
              {" "}facilitator{policy.minimum_facilitators_per_cohort === 1 ? "" : "s"}.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            {context.participants.filter((participant) => participant.eligible).length} eligible
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
            <CalendarClock aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-950">Session schedule</h2>
            <p className="text-sm text-slate-500">
              Calibration window: {formatDateTime(context.phase.opens_at)} – {formatDateTime(context.phase.due_at)}
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_250px_180px]">
          <div>
            <label htmlFor="calibration-session-name" className="text-sm font-medium text-slate-800">
              Session name
            </label>
            <Input
              id="calibration-session-name"
              value={sessionName}
              onChange={(event) => onSessionName(event.target.value)}
              placeholder="e.g. Leadership calibration"
              className="mt-2 h-11"
              maxLength={160}
            />
          </div>
          <div>
            <label htmlFor="calibration-scheduled-at" className="text-sm font-medium text-slate-800">
              Scheduled date and time
            </label>
            <Input
              id="calibration-scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => onScheduledAt(event.target.value)}
              className="mt-2 h-11"
            />
          </div>
          <div>
            <label htmlFor="calibration-duration" className="text-sm font-medium text-slate-800">
              Duration (minutes)
            </label>
            <Input
              id="calibration-duration"
              type="number"
              min={15}
              max={480}
              value={durationMinutes}
              onChange={(event) => onDuration(event.target.value)}
              className="mt-2 h-11"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Cohort roster</h2>
          <p className="mt-1 text-sm text-slate-600">
            A participant can appear once. Self-facilitation is blocked by the API.
          </p>
        </div>
        <Button type="button" variant="outline" className="min-h-11" onClick={addCohort}>
          <Plus aria-hidden="true" className="size-4" />
          Add cohort
        </Button>
      </div>

      {cohorts.length === 0 ? (
        <StateMessage
          title="No cohorts yet"
          detail="Add the first cohort, then assign an eligible roster and facilitation team."
          action={(
            <Button type="button" className="min-h-11" onClick={addCohort}>
              <Plus aria-hidden="true" className="size-4" />
              Add first cohort
            </Button>
          )}
        />
      ) : null}

      {cohorts.map((cohort, index) => {
        const participantEmployeeUuids = new Set(
          cohort.participant_uuids.map(
            (participantUuid) => context.participants.find(
              (candidate) => candidate.participant_uuid === participantUuid,
            )?.employee_uuid,
          ).filter((value): value is string => Boolean(value)),
        );
        const leadIsParticipant = cohort.participant_uuids.some((participantUuid) => {
          const participant = context.participants.find(
            (candidate) => candidate.participant_uuid === participantUuid,
          );
          return participant?.employee_uuid === cohort.lead_facilitator_employee_uuid;
        });
        return (
          <section key={cohort.localId} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  Cohort {index + 1}
                </p>
                <h3 className="mt-1 font-semibold text-slate-950">
                  {cohort.name || "Untitled cohort"}
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                onClick={() => onCohorts(cohorts.filter((item) => item.localId !== cohort.localId))}
                aria-label={`Remove ${cohort.name || `cohort ${index + 1}`}`}
              >
                <Trash2 aria-hidden="true" className="size-4" />
                Remove
              </Button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label htmlFor={`cohort-name-${cohort.localId}`} className="text-sm font-medium text-slate-800">
                  Cohort name
                </label>
                <Input
                  id={`cohort-name-${cohort.localId}`}
                  value={cohort.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    updateCohort(cohort.localId, {
                      name,
                      cohort_key: kebabCase(name),
                    });
                  }}
                  className="mt-2 h-11"
                  maxLength={140}
                />
              </div>
              <div>
                <label htmlFor={`cohort-key-${cohort.localId}`} className="text-sm font-medium text-slate-800">
                  Evidence key
                </label>
                <Input
                  id={`cohort-key-${cohort.localId}`}
                  value={cohort.cohort_key}
                  onChange={(event) => updateCohort(cohort.localId, {
                    cohort_key: kebabCase(event.target.value),
                  })}
                  className="mt-2 h-11 font-mono text-sm"
                  maxLength={100}
                />
              </div>
              <div>
                <label htmlFor={`cohort-scope-${cohort.localId}`} className="text-sm font-medium text-slate-800">
                  {humanize(policy.cohort_strategy)} scope
                </label>
                {policy.cohort_strategy === "CUSTOM" ? (
                  <div
                    id={`cohort-scope-${cohort.localId}`}
                    className="mt-2 flex h-11 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
                  >
                    Curated roster
                  </div>
                ) : (
                  <select
                    id={`cohort-scope-${cohort.localId}`}
                    value={cohort.scope_value ?? ""}
                    onChange={(event) => {
                      const scopeValue = event.target.value;
                      updateCohort(cohort.localId, {
                        scope_value: scopeValue,
                        participant_uuids: cohort.participant_uuids.filter(
                          (participantUuid) => {
                            const participant = context.participants.find(
                              (candidate) => candidate.participant_uuid === participantUuid,
                            );
                            return participant?.cohort_scope_values[
                              policy.cohort_strategy as "DEPARTMENT" | "GRADE_BAND" | "MANAGER"
                            ].some(
                              (value) => value.toLocaleLowerCase()
                                === scopeValue.toLocaleLowerCase(),
                            );
                          },
                        ),
                      });
                    }}
                    className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                  >
                    <option value="">Select {humanize(policy.cohort_strategy)}</option>
                    {context.scope_options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} · {option.eligible_count} eligible
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Participants</p>
                  <span className="text-xs font-medium text-slate-500">
                    {cohort.participant_uuids.length} selected
                  </span>
                </div>
                <div className="mt-3 grid max-h-[420px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                  {context.participants.map((participant) => {
                    const checked = cohort.participant_uuids.includes(participant.participant_uuid);
                    const usedElsewhere = selectedParticipants.has(participant.participant_uuid) && !checked;
                    const outsideScope = policy.cohort_strategy !== "CUSTOM"
                      && Boolean(cohort.scope_value)
                      && !participant.cohort_scope_values[policy.cohort_strategy].some(
                        (value) => value.toLocaleLowerCase()
                          === cohort.scope_value?.toLocaleLowerCase(),
                      );
                    const disabled = !participant.eligible || usedElsewhere || outsideScope;
                    return participantCard(
                      participant,
                      `participant-${cohort.localId}-${participant.participant_uuid}`,
                      checked,
                      disabled,
                      (nextChecked) => {
                      updateCohort(cohort.localId, {
                        participant_uuids: nextChecked
                          ? [...cohort.participant_uuids, participant.participant_uuid]
                          : cohort.participant_uuids.filter(
                            (uuid) => uuid !== participant.participant_uuid,
                          ),
                        lead_facilitator_employee_uuid:
                          nextChecked
                          && cohort.lead_facilitator_employee_uuid === participant.employee_uuid
                            ? ""
                            : cohort.lead_facilitator_employee_uuid,
                        co_facilitator_employee_uuids:
                          cohort.co_facilitator_employee_uuids.filter(
                            (uuid) => !nextChecked || uuid !== participant.employee_uuid,
                          ),
                      });
                      },
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Facilitators</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Assign one lead and optional co-facilitators. Everyone listed holds the
                  calibration facilitation permission.
                </p>
                <label
                  htmlFor={`lead-facilitator-${cohort.localId}`}
                  className="mt-4 block text-sm font-medium text-slate-800"
                >
                  Lead facilitator
                </label>
                <select
                  id={`lead-facilitator-${cohort.localId}`}
                  value={cohort.lead_facilitator_employee_uuid}
                  onChange={(event) => updateCohort(cohort.localId, {
                    lead_facilitator_employee_uuid: event.target.value,
                    co_facilitator_employee_uuids:
                      cohort.co_facilitator_employee_uuids.filter(
                        (uuid) => uuid !== event.target.value,
                      ),
                  })}
                  className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                >
                  <option value="">Select a lead</option>
                  {context.facilitators.map((facilitator) => (
                    <option
                      key={facilitator.employee_uuid}
                      value={facilitator.employee_uuid}
                      disabled={participantEmployeeUuids.has(facilitator.employee_uuid)}
                    >
                      {facilitator.display_name}
                    </option>
                  ))}
                </select>
                {leadIsParticipant ? (
                  <p className="mt-2 text-xs font-medium text-rose-700">
                    This facilitator is included in the same cohort roster.
                  </p>
                ) : null}

                <fieldset className="mt-5">
                  <legend className="text-sm font-medium text-slate-800">
                    Co-facilitators
                  </legend>
                  <div className="mt-2 space-y-2">
                    {context.facilitators
                      .filter(
                        (facilitator) =>
                          facilitator.employee_uuid !== cohort.lead_facilitator_employee_uuid,
                      )
                      .map((facilitator) => {
                        const checked = cohort.co_facilitator_employee_uuids.includes(
                          facilitator.employee_uuid,
                        );
                        const hasParticipantConflict = participantEmployeeUuids.has(
                          facilitator.employee_uuid,
                        );
                        return (
                          <label
                            key={facilitator.employee_uuid}
                            className={`flex min-h-11 items-center gap-3 rounded-lg bg-white px-3 ring-1 ring-inset ring-slate-200 ${
                              hasParticipantConflict
                                ? "cursor-not-allowed opacity-55"
                                : "cursor-pointer"
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              disabled={hasParticipantConflict}
                              onCheckedChange={(value) => updateCohort(cohort.localId, {
                                co_facilitator_employee_uuids: value === true
                                  ? [
                                    ...cohort.co_facilitator_employee_uuids,
                                    facilitator.employee_uuid,
                                  ]
                                  : cohort.co_facilitator_employee_uuids.filter(
                                    (uuid) => uuid !== facilitator.employee_uuid,
                                  ),
                              })}
                              className="size-5"
                            />
                            <span className="text-sm text-slate-800">
                              {facilitator.display_name}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </fieldset>
              </div>
            </div>
          </section>
        );
      })}

      <section className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-start gap-3">
          <Fingerprint aria-hidden="true" className="mt-0.5 size-5 text-indigo-600" />
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Creating the session freezes the policy, cohort roster, facilitator assignments,
            organization context, and pre-calibration manager scores as immutable evidence.
          </p>
        </div>
        <Button type="button" className="min-h-11 min-w-44" onClick={onSubmit} disabled={submitting}>
          {submitting ? <RefreshCw aria-hidden="true" className="size-4 animate-spin" /> : <ShieldCheck aria-hidden="true" className="size-4" />}
          {submitting ? "Creating session…" : "Create session"}
        </Button>
      </section>
    </div>
  );
}

export default function CalibrationPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<ViewMode>("sessions");
  const [selectedSessionUuid, setSelectedSessionUuid] = useState<string | null>(null);
  const [selectedCycleUuid, setSelectedCycleUuid] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("90");
  const [cohorts, setCohorts] = useState<CohortDraft[]>([]);

  const sessionsQuery = useQuery({
    queryKey: ["perform-pro", "calibration", "sessions"],
    queryFn: performProService.calibrationSessions,
  });
  const setupCyclesQuery = useQuery({
    queryKey: ["perform-pro", "calibration", "setup-cycles"],
    queryFn: performProService.calibrationSetupCycles,
    retry: false,
  });

  const activeSessionUuid = selectedSessionUuid
    ?? sessionsQuery.data?.[0]?.uuid
    ?? null;
  const sessionQuery = useQuery({
    queryKey: ["perform-pro", "calibration", "session", activeSessionUuid],
    queryFn: () => performProService.calibrationSession(activeSessionUuid!),
    enabled: Boolean(activeSessionUuid),
  });

  const setupCycles = setupCyclesQuery.data ?? [];
  const activeCycleUuid = selectedCycleUuid
    ?? setupCycles.find((cycle) => cycle.ready_for_setup)?.uuid
    ?? setupCycles[0]?.uuid
    ?? null;
  const setupContextQuery = useQuery({
    queryKey: ["perform-pro", "calibration", "setup-context", activeCycleUuid],
    queryFn: () => performProService.calibrationSetupContext(activeCycleUuid!),
    enabled: mode === "setup" && Boolean(activeCycleUuid),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const context = setupContextQuery.data;
      if (!context || !activeCycleUuid) {
        throw new Error("Select a cycle with an available calibration setup context.");
      }
      if (!context.capabilities.can_create) {
        throw new Error("The selected cycle is not in a calibration setup window.");
      }
      if (!sessionName.trim()) throw new Error("Enter a session name.");
      const scheduledDate = new Date(scheduledAt);
      if (!scheduledAt || Number.isNaN(scheduledDate.getTime())) {
        throw new Error("Choose a valid session date and time.");
      }
      const duration = Number(durationMinutes);
      if (!Number.isInteger(duration) || duration < 15 || duration > 480) {
        throw new Error("Duration must be between 15 and 480 minutes.");
      }
      if (cohorts.length === 0) throw new Error("Add at least one calibration cohort.");
      const keys = new Set<string>();
      const participantUuids = new Set<string>();
      for (const cohort of cohorts) {
        if (!cohort.name.trim() || !cohort.cohort_key) {
          throw new Error("Every cohort requires a name and evidence key.");
        }
        if (keys.has(cohort.cohort_key)) throw new Error("Cohort evidence keys must be unique.");
        keys.add(cohort.cohort_key);
        if (
          cohort.participant_uuids.length < context.policy.minimum_cohort_size
          || cohort.participant_uuids.length > context.policy.maximum_cohort_size
        ) {
          throw new Error(
            `${cohort.name} must contain ${context.policy.minimum_cohort_size}–${context.policy.maximum_cohort_size} participants.`,
          );
        }
        for (const participantUuid of cohort.participant_uuids) {
          if (participantUuids.has(participantUuid)) {
            throw new Error("A participant can belong to only one cohort.");
          }
          participantUuids.add(participantUuid);
        }
        if (!cohort.lead_facilitator_employee_uuid) {
          throw new Error(`${cohort.name} requires a lead facilitator.`);
        }
        if (
          1 + cohort.co_facilitator_employee_uuids.length
          < context.policy.minimum_facilitators_per_cohort
        ) {
          throw new Error(`${cohort.name} does not meet the facilitator minimum.`);
        }
        if (context.policy.cohort_strategy !== "CUSTOM" && !cohort.scope_value?.trim()) {
          throw new Error(`${cohort.name} requires a ${humanize(context.policy.cohort_strategy)} scope.`);
        }
      }
      return performProService.createCalibrationSession({
        cycleUuid: activeCycleUuid,
        name: sessionName.trim(),
        scheduledAt: scheduledDate.toISOString(),
        durationMinutes: duration,
        cohorts: cohorts.map((cohort) => ({
          name: cohort.name,
          cohort_key: cohort.cohort_key,
          scope_type: cohort.scope_type,
          scope_value: cohort.scope_value,
          participant_uuids: cohort.participant_uuids,
          lead_facilitator_employee_uuid: cohort.lead_facilitator_employee_uuid,
          co_facilitator_employee_uuids: cohort.co_facilitator_employee_uuids,
        })),
      });
    },
    onSuccess: async (session) => {
      await queryClient.invalidateQueries({
        queryKey: ["perform-pro", "calibration", "sessions"],
      });
      queryClient.setQueryData(
        ["perform-pro", "calibration", "session", session.uuid],
        session,
      );
      setSelectedSessionUuid(session.uuid);
      setMode("sessions");
      setSessionName("");
      setScheduledAt("");
      setDurationMinutes("90");
      setCohorts([]);
      toast.success("Calibration session and immutable setup evidence created.");
    },
    onError: (error) => {
      showApiError(error, { fallbackMessage: apiMessage(error, "Unable to create the calibration session.") });
    },
  });

  function applySessionResult(session: PerformProCalibrationSession) {
    queryClient.setQueryData(
      ["perform-pro", "calibration", "session", session.uuid],
      session,
    );
    void queryClient.invalidateQueries({
      queryKey: ["perform-pro", "calibration", "sessions"],
    });
  }

  function executionError(error: unknown, fallback: string) {
    if (isAxiosError(error) && error.response?.status === 409) {
      void sessionQuery.refetch();
      toast.error(
        "This session changed in another window. The latest evidence has been loaded; review it before retrying.",
      );
      return;
    }
    toast.error(apiMessage(error, fallback));
  }

  const openMutation = useMutation({
    mutationFn: performProService.openCalibrationSession,
    onSuccess: (session) => {
      applySessionResult(session);
      toast.success("Calibration session opened and facilitators notified.");
    },
    onError: (error) => executionError(error, "Unable to open the calibration session."),
  });

  const adjustMutation = useMutation({
    mutationFn: performProService.adjustCalibrationScore,
    onSuccess: (session) => {
      applySessionResult(session);
      toast.success("Score adjustment recorded as immutable evidence.");
    },
    onError: (error) => executionError(error, "Unable to record the score adjustment."),
  });

  const completeMutation = useMutation({
    mutationFn: ({
      session,
      note,
    }: {
      session: PerformProCalibrationSession;
      note: string;
    }) => performProService.completeCalibrationSession(session, note),
    onSuccess: (session) => {
      applySessionResult(session);
      toast.success("Calibration completed and final score evidence frozen.");
    },
    onError: (error) => executionError(error, "Unable to complete the calibration session."),
  });

  const maySetup = !setupCyclesQuery.isError || !isForbidden(setupCyclesQuery.error);
  const activeSession = sessionQuery.data;

  return (
    <main className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                <Scale aria-hidden="true" className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
                  PerformPro
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  Calibration workspace
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Build policy-bound cohorts, run versioned score calibration, and freeze
                  the final panel decision with a complete evidence chain.
                </p>
              </div>
            </div>
            <div className="flex rounded-xl bg-slate-100 p-1" aria-label="Calibration workspace view">
              <Button
                type="button"
                variant={mode === "sessions" ? "default" : "ghost"}
                className="min-h-10"
                onClick={() => setMode("sessions")}
              >
                <ClipboardCheck aria-hidden="true" className="size-4" />
                Sessions
              </Button>
              {maySetup ? (
                <Button
                  type="button"
                  variant={mode === "setup" ? "default" : "ghost"}
                  className="min-h-10"
                  onClick={() => setMode("setup")}
                >
                  <Plus aria-hidden="true" className="size-4" />
                  New setup
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        {mode === "sessions" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-950">Session queue</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Administered or assigned sessions
                  </p>
                </div>
                {sessionsQuery.isFetching ? (
                  <RefreshCw aria-hidden="true" className="size-4 animate-spin text-slate-400" />
                ) : (
                  <UsersRound aria-hidden="true" className="size-5 text-indigo-600" />
                )}
              </div>
              <div className="mt-4 space-y-2">
                {sessionsQuery.isLoading
                  ? Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 rounded-xl" />
                  ))
                  : sessionsQuery.data?.map((session) => (
                    <button
                      key={session.uuid}
                      type="button"
                      onClick={() => setSelectedSessionUuid(session.uuid)}
                      aria-current={activeSessionUuid === session.uuid ? "true" : undefined}
                      className={`w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                        activeSessionUuid === session.uuid
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-950">{session.name}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                          session.execution?.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                            : session.execution?.status === "OPEN"
                              ? "bg-indigo-50 text-indigo-800 ring-indigo-200"
                              : "bg-amber-50 text-amber-900 ring-amber-200"
                        }`}>
                          {humanize(session.execution?.status ?? "READY")}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">{session.cycle_name}</span>
                      <span className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                        <CalendarClock aria-hidden="true" className="size-3.5" />
                        {formatDateTime(session.scheduled_at)}
                      </span>
                    </button>
                  ))}
              </div>
              {!sessionsQuery.isLoading && sessionsQuery.data?.length === 0 ? (
                <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  No calibration sessions are assigned or available yet.
                </p>
              ) : null}
            </aside>

            <div>
              {sessionsQuery.isError ? (
                <StateMessage
                  title="Calibration sessions are unavailable"
                  detail={apiMessage(sessionsQuery.error, "The session queue could not be loaded.")}
                  action={(
                    <Button type="button" variant="outline" className="min-h-11" onClick={() => sessionsQuery.refetch()}>
                      <RefreshCw aria-hidden="true" className="size-4" />
                      Try again
                    </Button>
                  )}
                />
              ) : sessionQuery.isLoading ? (
                <LoadingPanel />
              ) : sessionQuery.isError ? (
                <StateMessage
                  title="Session detail could not be loaded"
                  detail={apiMessage(sessionQuery.error, "The selected session may no longer be available.")}
                  action={(
                    <Button type="button" variant="outline" className="min-h-11" onClick={() => sessionQuery.refetch()}>
                      <RefreshCw aria-hidden="true" className="size-4" />
                      Try again
                    </Button>
                  )}
                />
              ) : activeSession ? (
                <SessionDetail
                  session={activeSession}
                  opening={openMutation.isPending}
                  adjusting={adjustMutation.isPending}
                  completing={completeMutation.isPending}
                  onOpen={async () => {
                    await openMutation.mutateAsync(activeSession);
                  }}
                  onAdjust={async (participant, nextScore, nextReason, detail, nextFlags) => {
                    if (!activeSession.execution) {
                      throw new Error("Open the session before recording adjustments.");
                    }
                    await adjustMutation.mutateAsync({
                      sessionUuid: activeSession.uuid,
                      participantSnapshotUuid: participant.uuid,
                      expectedExecutionVersion: activeSession.execution.lock_version,
                      adjustedScore: nextScore,
                      reasonCode: nextReason,
                      reasonDetail: detail,
                      reviewFlags: nextFlags,
                    });
                  }}
                  onComplete={async (note) => {
                    await completeMutation.mutateAsync({
                      session: activeSession,
                      note,
                    });
                  }}
                />
              ) : (
                <StateMessage
                  title="No calibration session selected"
                  detail={
                    maySetup
                      ? "Create a policy-bound setup when the cycle reaches its calibration window."
                      : "Assigned calibration sessions will appear here once an administrator finalizes the cohort roster."
                  }
                  action={maySetup ? (
                    <Button type="button" className="min-h-11" onClick={() => setMode("setup")}>
                      <Plus aria-hidden="true" className="size-4" />
                      Create session
                    </Button>
                  ) : undefined}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-64 flex-1">
                  <label htmlFor="calibration-cycle" className="text-sm font-medium text-slate-800">
                    Performance cycle
                  </label>
                  <select
                    id="calibration-cycle"
                    value={activeCycleUuid ?? ""}
                    onChange={(event) => {
                      setSelectedCycleUuid(event.target.value || null);
                      setSessionName("");
                      setScheduledAt("");
                      setDurationMinutes("90");
                      setCohorts([]);
                    }}
                    className="mt-2 min-h-11 w-full max-w-xl rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                  >
                    {setupCycles.map((cycle) => (
                      <option key={cycle.uuid} value={cycle.uuid}>
                        {cycle.name} · {cycle.ready_for_setup ? "Ready for setup" : `${humanize(cycle.calibration_phase_status)} calibration`}
                      </option>
                    ))}
                  </select>
                </div>
                {setupContextQuery.data ? (
                  <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
                    <CheckCircle2 aria-hidden="true" className="mr-2 inline size-4" />
                    Manager review {humanize(setupContextQuery.data.manager_review_phase_status)}
                  </div>
                ) : null}
              </div>
            </section>

            {setupCyclesQuery.isLoading || setupContextQuery.isLoading ? (
              <LoadingPanel />
            ) : setupCyclesQuery.isError ? (
              <StateMessage
                title="Session setup is not authorized"
                detail={apiMessage(
                  setupCyclesQuery.error,
                  "Only calibration approvers and review administrators can create a session.",
                )}
                action={(
                  <Button type="button" variant="outline" className="min-h-11" onClick={() => setMode("sessions")}>
                    Back to assigned sessions
                  </Button>
                )}
              />
            ) : setupCycles.length === 0 ? (
              <StateMessage
                title="No calibration-ready cycles"
                detail="An active cycle with a calibration phase is required before a session can be configured."
              />
            ) : setupContextQuery.isError ? (
              <StateMessage
                title="Setup context is unavailable"
                detail={apiMessage(
                  setupContextQuery.error,
                  "Verify the policy binding and review-phase lifecycle before retrying.",
                )}
                action={(
                  <Button type="button" variant="outline" className="min-h-11" onClick={() => setupContextQuery.refetch()}>
                    <RefreshCw aria-hidden="true" className="size-4" />
                    Try again
                  </Button>
                )}
              />
            ) : setupContextQuery.data && !setupContextQuery.data.capabilities.can_create ? (
              <StateMessage
                title="This cycle is not ready for setup"
                detail="Calibration setup requires an active cycle, a closed manager-review phase, and a pending or open calibration phase."
              />
            ) : setupContextQuery.data ? (
              <SetupBuilder
                context={setupContextQuery.data}
                sessionName={sessionName}
                scheduledAt={scheduledAt}
                durationMinutes={durationMinutes}
                cohorts={cohorts}
                submitting={createMutation.isPending}
                onSessionName={setSessionName}
                onScheduledAt={setScheduledAt}
                onDuration={setDurationMinutes}
                onCohorts={setCohorts}
                onSubmit={() => createMutation.mutate()}
              />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                <AlertCircle aria-hidden="true" className="mr-2 inline size-4" />
                Select a cycle to begin calibration setup.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
