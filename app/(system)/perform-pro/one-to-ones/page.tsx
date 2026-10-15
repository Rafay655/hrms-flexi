"use client";

import { showApiError } from "@/lib/error-toast";
import { FormEvent, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Fingerprint,
  History,
  ListChecks,
  LockKeyhole,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  UserRound,
  UsersRound,
  XCircle,
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
  PerformProOneToOneActionInput,
  PerformProOneToOneCadence,
  PerformProOneToOneEntryInput,
  PerformProOneToOneMeeting,
  PerformProOneToOneSeries,
} from "@/types/performpro";

type Editor =
  | { mode: "CREATE" }
  | { mode: "SCHEDULE"; series: PerformProOneToOneSeries }
  | {
      mode: "CONTENT";
      series: PerformProOneToOneSeries;
      meeting: PerformProOneToOneMeeting;
    }
  | null;
type Completion = {
  series: PerformProOneToOneSeries;
  meeting: PerformProOneToOneMeeting;
} | null;
type Cancellation = {
  series: PerformProOneToOneSeries;
  meeting: PerformProOneToOneMeeting;
} | null;
type ActionDecision = "KEEP" | "COMPLETE" | "CARRY";
type MeetingFilter = "ALL" | "UPCOMING" | "HISTORY";

const statusStyles = {
  SCHEDULED: "border-sky-200 bg-sky-50 text-sky-900",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-900",
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

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" })
    .format(new Date(`${value}T00:00:00`));
}

function apiMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }
  return error.response?.data?.error?.message
    ?? error.response?.data?.message
    ?? fallback;
}

function futureLocalDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(10, 0, 0, 0);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function toIso(value: string) {
  return new Date(value).toISOString();
}

function shortHash(value: string) {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof CalendarClock;
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

function MeetingCard({
  meeting,
  onContent,
  onComplete,
  onCancel,
}: {
  meeting: PerformProOneToOneMeeting;
  onContent: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const sharedEntries = meeting.entries.filter((entry) => entry.visibility === "SHARED");
  const privateEntries = meeting.entries.filter((entry) => entry.visibility === "PRIVATE");

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusStyles[meeting.status]}>
              {meeting.status === "SCHEDULED" && <Clock3 aria-hidden="true" />}
              {meeting.status === "COMPLETED" && <CheckCircle2 aria-hidden="true" />}
              {meeting.status === "CANCELLED" && <XCircle aria-hidden="true" />}
              {humanize(meeting.status)}
            </Badge>
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
              Meeting {meeting.sequence}
            </Badge>
          </div>
          <h3 className="mt-3 font-semibold text-slate-950">
            {formatDateTime(meeting.scheduled_start_at)}
          </h3>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 aria-hidden="true" className="size-3.5" />
              {Math.round(
                (new Date(meeting.scheduled_end_at).getTime()
                  - new Date(meeting.scheduled_start_at).getTime()) / 60_000,
              )} minutes
            </span>
            {meeting.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-3.5" />
                {meeting.location}
              </span>
            )}
          </div>
        </div>
        {meeting.status === "SCHEDULED" && (
          <div className="flex flex-wrap gap-2">
            {meeting.capabilities.can_add_content && (
              <Button
                variant="outline"
                className="min-h-11 cursor-pointer"
                onClick={onContent}
              >
                <Plus aria-hidden="true" className="size-4" />
                Add content
              </Button>
            )}
            {meeting.capabilities.can_complete && (
              <Button
                className="min-h-11 cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                onClick={onComplete}
              >
                <CheckCircle2 aria-hidden="true" className="size-4" />
                Complete
              </Button>
            )}
            {meeting.capabilities.can_cancel && (
              <Button
                variant="outline"
                className="min-h-11 cursor-pointer border-rose-200 text-rose-700 hover:bg-rose-50"
                onClick={onCancel}
              >
                <XCircle aria-hidden="true" className="size-4" />
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>

      {meeting.completion_summary && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Shared completion summary
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-emerald-950">
            {meeting.completion_summary}
          </p>
        </div>
      )}
      {meeting.cancellation_reason && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-800">
            Cancellation reason
          </p>
          <p className="mt-1 text-sm leading-6 text-rose-950">
            {meeting.cancellation_reason}
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <section aria-label="Shared agenda and notes">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UsersRound aria-hidden="true" className="size-4 text-indigo-600" />
            Shared agenda and notes
          </h4>
          <div className="mt-2 space-y-2">
            {sharedEntries.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                No shared agenda or discussion notes yet.
              </p>
            ) : sharedEntries.map((entry) => (
              <div key={entry.uuid} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {humanize(entry.entry_type)} · {entry.author_name}
                  </span>
                  <time dateTime={entry.created_at}>{formatDateTime(entry.created_at)}</time>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {entry.content}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="My private preparation">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <LockKeyhole aria-hidden="true" className="size-4 text-violet-600" />
            My private preparation
          </h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Only you can read these encrypted entries. They are hidden from the other
            participant and administrators.
          </p>
          <div className="mt-2 space-y-2">
            {privateEntries.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                No private preparation entries visible to you.
              </p>
            ) : privateEntries.map((entry) => (
              <div key={entry.uuid} className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                <span className="text-xs font-semibold text-violet-800">
                  Private {humanize(entry.entry_type)}
                </span>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-violet-950">
                  {entry.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-5 border-t border-slate-100 pt-4" aria-label="Commitments">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ListChecks aria-hidden="true" className="size-4 text-indigo-600" />
          Shared commitments
        </h4>
        {meeting.actions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No commitments recorded.</p>
        ) : (
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {meeting.actions.map((action) => (
              <div key={action.uuid} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                    {humanize(action.status)}
                  </Badge>
                </div>
                {action.description && (
                  <p className="mt-1 text-xs leading-5 text-slate-600">{action.description}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  {action.owner_name} · {formatDate(action.due_date)}
                  {action.source_action_uuid && " · Carried from an earlier meeting"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <details className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <summary className="cursor-pointer font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
          Immutable meeting evidence
        </summary>
        <p className="mt-2 flex items-center gap-1.5">
          <Fingerprint aria-hidden="true" className="size-3.5" />
          Version {meeting.lock_version} ·{" "}
          <code>{shortHash(meeting.evidence.current_evidence_hash)}</code>
        </p>
      </details>
    </article>
  );
}

export default function OneToOnesPage() {
  const queryClient = useQueryClient();
  const [selectedUuid, setSelectedUuid] = useState("");
  const [search, setSearch] = useState("");
  const [meetingFilter, setMeetingFilter] = useState<MeetingFilter>("ALL");
  const [editor, setEditor] = useState<Editor>(null);
  const [completion, setCompletion] = useState<Completion>(null);
  const [cancellation, setCancellation] = useState<Cancellation>(null);

  const [employeeUuid, setEmployeeUuid] = useState("");
  const [cycleUuid, setCycleUuid] = useState("");
  const [title, setTitle] = useState("");
  const [cadence, setCadence] = useState<PerformProOneToOneCadence>("WEEKLY");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [duration, setDuration] = useState(45);
  const [scheduledStart, setScheduledStart] = useState(futureLocalDate(1));
  const [location, setLocation] = useState("");
  const [entryType, setEntryType] =
    useState<PerformProOneToOneEntryInput["entry_type"]>("AGENDA");
  const [entryVisibility, setEntryVisibility] =
    useState<PerformProOneToOneEntryInput["visibility"]>("SHARED");
  const [entryContent, setEntryContent] = useState("");
  const [actionOwner, setActionOwner] =
    useState<PerformProOneToOneActionInput["owner_role"]>("EMPLOYEE");
  const [actionTitle, setActionTitle] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [actionDueDate, setActionDueDate] = useState("");

  const [completionSummary, setCompletionSummary] = useState("");
  const [actionDecisions, setActionDecisions] =
    useState<Record<string, ActionDecision>>({});
  const [nextMeetingAt, setNextMeetingAt] = useState(futureLocalDate(7));
  const [cancellationReason, setCancellationReason] = useState("");

  const workspaceQuery = useQuery({
    queryKey: ["perform-pro", "one-to-ones"],
    queryFn: performProService.oneToOneWorkspace,
  });
  const workspace = workspaceQuery.data;
  const matchingSeries = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!workspace) return [];
    if (!term) return workspace.series;
    return workspace.series.filter((series) => [
      series.title,
      series.manager.name,
      series.employee.name,
      series.cycle_name ?? "",
      series.cadence,
    ].some((value) => value.toLowerCase().includes(term)));
  }, [search, workspace]);
  const selected = matchingSeries.find((series) => series.uuid === selectedUuid)
    ?? matchingSeries[0]
    ?? null;
  const displayedMeetings = selected?.meetings.filter((meeting) => (
    meetingFilter === "ALL"
    || (meetingFilter === "UPCOMING" && meeting.status === "SCHEDULED")
    || (meetingFilter === "HISTORY" && meeting.status !== "SCHEDULED")
  )) ?? [];

  function resetEditor(mode: NonNullable<Editor>["mode"]) {
    setEmployeeUuid("");
    setCycleUuid("");
    setTitle("");
    setCadence("WEEKLY");
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    setDuration(45);
    setScheduledStart(futureLocalDate(mode === "CONTENT" ? 1 : 7));
    setLocation("");
    setEntryType(mode === "CONTENT" ? "NOTE" : "AGENDA");
    setEntryVisibility("SHARED");
    setEntryContent("");
    setActionOwner("EMPLOYEE");
    setActionTitle("");
    setActionDescription("");
    setActionDueDate("");
  }

  function contentInput() {
    const entries: PerformProOneToOneEntryInput[] = entryContent.trim()
      ? [{
          entry_type: entryType,
          visibility: entryVisibility,
          content: entryContent.trim(),
        }]
      : [];
    const actions: PerformProOneToOneActionInput[] = actionTitle.trim()
      ? [{
          owner_role: actionOwner,
          title: actionTitle.trim(),
          description: actionDescription.trim(),
          due_date: actionDueDate || null,
        }]
      : [];
    return { entries, actions };
  }

  async function refresh(series: PerformProOneToOneSeries) {
    setSelectedUuid(series.uuid);
    await queryClient.invalidateQueries({ queryKey: ["perform-pro", "one-to-ones"] });
  }

  const createMutation = useMutation({
    mutationFn: performProService.createOneToOneSeries,
    onSuccess: async (series) => {
      toast.success("One-to-one series scheduled.");
      setEditor(null);
      await refresh(series);
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The series could not be created.") }),
  });
  const scheduleMutation = useMutation({
    mutationFn: performProService.scheduleOneToOneMeeting,
    onSuccess: async (series) => {
      toast.success("Next meeting scheduled.");
      setEditor(null);
      await refresh(series);
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The meeting could not be scheduled.") }),
  });
  const contentMutation = useMutation({
    mutationFn: performProService.appendOneToOneContent,
    onSuccess: async (series) => {
      toast.success("Meeting content added securely.");
      setEditor(null);
      await refresh(series);
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The content could not be added.") }),
  });
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!completion) throw new Error("No meeting selected.");
      const completed = Object.entries(actionDecisions)
        .filter(([, decision]) => decision === "COMPLETE")
        .map(([uuid]) => uuid);
      const carried = Object.entries(actionDecisions)
        .filter(([, decision]) => decision === "CARRY")
        .map(([uuid]) => uuid);
      return performProService.completeOneToOneMeeting(
        completion.meeting,
        completionSummary.trim(),
        completed,
        carried,
        carried.length > 0 ? toIso(nextMeetingAt) : null,
      );
    },
    onSuccess: async (series) => {
      toast.success("Meeting completed and commitments reconciled.");
      setCompletion(null);
      await refresh(series);
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The meeting could not be completed.") }),
  });
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!cancellation) throw new Error("No meeting selected.");
      return performProService.cancelOneToOneMeeting(
        cancellation.meeting,
        cancellationReason.trim(),
      );
    },
    onSuccess: async (series) => {
      toast.success("Meeting cancellation recorded.");
      setCancellation(null);
      await refresh(series);
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The meeting could not be cancelled.") }),
  });

  function submitEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const content = contentInput();
    if (editor.mode === "CREATE") {
      createMutation.mutate({
        employeeUuid,
        cycleUuid: cycleUuid || null,
        title: title.trim(),
        cadence,
        timezone,
        durationMinutes: duration,
        scheduledStartAt: toIso(scheduledStart),
        location,
        ...content,
      });
    } else if (editor.mode === "SCHEDULE") {
      scheduleMutation.mutate({
        series: editor.series,
        scheduledStartAt: toIso(scheduledStart),
        location,
        ...content,
      });
    } else {
      contentMutation.mutate({
        meeting: editor.meeting,
        ...content,
      });
    }
  }

  function openCompletion(
    series: PerformProOneToOneSeries,
    meeting: PerformProOneToOneMeeting,
  ) {
    setCompletionSummary("");
    setNextMeetingAt(futureLocalDate(7));
    setActionDecisions(Object.fromEntries(
      meeting.actions
        .filter((action) => action.status === "OPEN")
        .map((action) => [action.uuid, "KEEP"]),
    ));
    setCompletion({ series, meeting });
  }

  const editorPending = createMutation.isPending
    || scheduleMutation.isPending
    || contentMutation.isPending;
  const editorContent = contentInput();
  const editorInvalid = editor?.mode === "CREATE"
    ? !employeeUuid || title.trim().length < 3 || !scheduledStart
    : editor?.mode === "SCHEDULE"
      ? !scheduledStart
      : editorContent.entries.length === 0 && editorContent.actions.length === 0;
  const hasCarry = Object.values(actionDecisions).includes("CARRY");

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
            <CalendarClock aria-hidden="true" className="size-4" />
            PerformPro
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            One-to-ones
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Prepare together, keep personal notes private, and turn recurring
            conversations into clear, traceable commitments.
          </p>
        </div>
        {workspace && workspace.direct_reports.length > 0 && (
          <Button
            className="min-h-11 cursor-pointer bg-indigo-600 hover:bg-indigo-700"
            onClick={() => {
              resetEditor("CREATE");
              setEditor({ mode: "CREATE" });
            }}
          >
            <Plus aria-hidden="true" className="size-4" />
            Start a series
          </Button>
        )}
      </header>

      {workspaceQuery.isLoading && (
        <div aria-label="Loading one-to-ones" className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-32 rounded-xl" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
            <Skeleton className="h-[520px] rounded-xl" />
            <Skeleton className="h-[520px] rounded-xl" />
          </div>
        </div>
      )}

      {workspaceQuery.isError && (
        <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
          <div className="flex items-start gap-3">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <div>
              <h2 className="font-semibold">One-to-ones are unavailable</h2>
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
          <section aria-label="One-to-one summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={UsersRound}
              label="Active series"
              value={workspace.summary.series}
              detail="Manager and employee conversation streams visible to you."
            />
            <SummaryCard
              icon={CalendarDays}
              label="Upcoming"
              value={workspace.summary.upcoming}
              detail="Scheduled meetings with reminder coverage."
            />
            <SummaryCard
              icon={CheckCircle2}
              label="Completed"
              value={workspace.summary.completed}
              detail="Meetings closed with shared summaries and evidence."
            />
            <SummaryCard
              icon={ListChecks}
              label="Open commitments"
              value={workspace.summary.open_actions}
              detail="Shared actions awaiting completion or carry-forward."
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="self-start rounded-xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-4">
              <div className="border-b border-slate-200 p-4">
                <label className="relative block">
                  <span className="sr-only">Search one-to-one series</span>
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search people or series"
                    className="min-h-11 pl-9"
                  />
                </label>
              </div>
              <div className="max-h-[65vh] space-y-2 overflow-y-auto p-3">
                {matchingSeries.length === 0 ? (
                  <div className="px-3 py-10 text-center">
                    <UsersRound aria-hidden="true" className="mx-auto size-8 text-slate-400" />
                    <p className="mt-2 text-sm font-semibold text-slate-800">No series found</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Start a series with a direct report or adjust your search.
                    </p>
                  </div>
                ) : matchingSeries.map((series) => {
                  const active = selected?.uuid === series.uuid;
                  const nextMeeting = series.meetings.find(
                    (meeting) => meeting.status === "SCHEDULED",
                  );
                  return (
                    <button
                      key={series.uuid}
                      type="button"
                      onClick={() => setSelectedUuid(series.uuid)}
                      className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                        active
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{series.title}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {series.manager.name} · {series.employee.name}
                      </p>
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        {nextMeeting
                          ? `Next: ${formatDateTime(nextMeeting.scheduled_start_at)}`
                          : "No upcoming meeting"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="min-w-0">
              {!selected ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                  <CalendarClock aria-hidden="true" className="mx-auto size-10 text-slate-400" />
                  <h2 className="mt-3 font-semibold text-slate-900">Select a one-to-one series</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Meeting details and commitments will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-900">
                            {humanize(selected.cadence)}
                          </Badge>
                          {selected.cycle_name && (
                            <Badge variant="outline">{selected.cycle_name}</Badge>
                          )}
                        </div>
                        <h2 className="mt-3 text-xl font-semibold text-slate-950">
                          {selected.title}
                        </h2>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <UserRound aria-hidden="true" className="size-4" />
                          {selected.manager.name}
                          <span aria-hidden="true">↔</span>
                          {selected.employee.name}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {selected.default_duration_minutes} minutes · {selected.timezone}
                        </p>
                      </div>
                      {selected.capabilities.can_schedule && (
                        <Button
                          className="min-h-11 cursor-pointer bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => {
                            resetEditor("SCHEDULE");
                            setEditor({ mode: "SCHEDULE", series: selected });
                          }}
                        >
                          <CalendarClock aria-hidden="true" className="size-4" />
                          Schedule meeting
                        </Button>
                      )}
                    </div>
                    <details className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <summary className="cursor-pointer font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                        Series evidence and history
                      </summary>
                      <p className="mt-2">
                        Version {selected.lock_version} · Evidence{" "}
                        <code>{shortHash(selected.evidence.current_evidence_hash)}</code>
                      </p>
                      <div className="mt-2 space-y-2">
                        {selected.events.map((event) => (
                          <div key={event.uuid} className="rounded-md border border-slate-200 bg-white p-2">
                            <div className="flex flex-wrap justify-between gap-2">
                              <span className="font-semibold">{humanize(event.event_type)}</span>
                              <time dateTime={event.occurred_at}>{formatDateTime(event.occurred_at)}</time>
                            </div>
                            {event.reason && <p className="mt-1">{event.reason}</p>}
                            <p className="mt-1 text-[11px]">Hash: {shortHash(event.event_hash)}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </section>

                  <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
                    {(["ALL", "UPCOMING", "HISTORY"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setMeetingFilter(filter)}
                        className={`min-h-10 cursor-pointer whitespace-nowrap rounded-md px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                          meetingFilter === filter
                            ? "bg-white text-indigo-800 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {humanize(filter)}
                      </button>
                    ))}
                  </div>

                  {displayedMeetings.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                      <History aria-hidden="true" className="mx-auto size-9 text-slate-400" />
                      <h3 className="mt-3 font-semibold text-slate-900">No meetings in this view</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Schedule a meeting or choose a different filter.
                      </p>
                    </div>
                  ) : displayedMeetings.map((meeting) => (
                    <MeetingCard
                      key={meeting.uuid}
                      meeting={meeting}
                      onContent={() => {
                        resetEditor("CONTENT");
                        setEditor({ mode: "CONTENT", series: selected, meeting });
                      }}
                      onComplete={() => openCompletion(selected, meeting)}
                      onCancel={() => {
                        setCancellationReason("");
                        setCancellation({ series: selected, meeting });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <Dialog open={Boolean(editor)} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editor?.mode === "CREATE" && "Start a one-to-one series"}
              {editor?.mode === "SCHEDULE" && "Schedule the next meeting"}
              {editor?.mode === "CONTENT" && "Add meeting content"}
            </DialogTitle>
            <DialogDescription>
              {editor?.mode === "CONTENT"
                ? "Add an encrypted shared or private entry, a shared commitment, or both."
                : "Schedule the conversation and optionally prepare an agenda or first commitment."}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={submitEditor}>
            {editor?.mode === "CREATE" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Direct report
                    <select
                      required
                      value={employeeUuid}
                      onChange={(event) => setEmployeeUuid(event.target.value)}
                      className="mt-1.5 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    >
                      <option value="">Select employee</option>
                      {workspace?.direct_reports.map((employee) => (
                        <option key={employee.uuid} value={employee.uuid}>
                          {employee.employee_code} · {employee.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-slate-800">
                    Performance cycle
                    <select
                      value={cycleUuid}
                      onChange={(event) => setCycleUuid(event.target.value)}
                      className="mt-1.5 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
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
                <label className="block text-sm font-semibold text-slate-800">
                  Series title
                  <Input
                    required
                    minLength={3}
                    maxLength={180}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Example: Weekly growth conversation"
                    className="mt-1.5 min-h-11"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="text-sm font-semibold text-slate-800">
                    Cadence
                    <select
                      value={cadence}
                      onChange={(event) => setCadence(
                        event.target.value as PerformProOneToOneCadence,
                      )}
                      className="mt-1.5 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    >
                      <option value="WEEKLY">Weekly</option>
                      <option value="BIWEEKLY">Every two weeks</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-slate-800">
                    Duration
                    <select
                      value={duration}
                      onChange={(event) => setDuration(Number(event.target.value))}
                      className="mt-1.5 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    >
                      {[30, 45, 60, 90].map((minutes) => (
                        <option key={minutes} value={minutes}>{minutes} minutes</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-slate-800">
                    Timezone
                    <Input
                      required
                      value={timezone}
                      onChange={(event) => setTimezone(event.target.value)}
                      className="mt-1.5 min-h-11"
                    />
                  </label>
                </div>
              </>
            )}

            {editor?.mode !== "CONTENT" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-800">
                  Meeting start
                  <Input
                    required
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(event) => setScheduledStart(event.target.value)}
                    className="mt-1.5 min-h-11"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Location or meeting link
                  <Input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    maxLength={1000}
                    placeholder="Optional"
                    className="mt-1.5 min-h-11"
                  />
                </label>
              </div>
            )}

            <fieldset className="rounded-xl border border-slate-200 p-4">
              <legend className="px-1 text-sm font-semibold text-slate-900">
                Agenda or discussion note <span className="font-normal text-slate-500">(optional)</span>
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-800">
                  Entry type
                  <select
                    value={entryType}
                    onChange={(event) => setEntryType(
                      event.target.value as PerformProOneToOneEntryInput["entry_type"],
                    )}
                    className="mt-1.5 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  >
                    <option value="AGENDA">Agenda item</option>
                    <option value="NOTE">Discussion note</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Visibility
                  <select
                    value={entryVisibility}
                    onChange={(event) => setEntryVisibility(
                      event.target.value as PerformProOneToOneEntryInput["visibility"],
                    )}
                    className="mt-1.5 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  >
                    <option value="SHARED">Shared with both participants</option>
                    <option value="PRIVATE">Private to me</option>
                  </select>
                </label>
              </div>
              <label className="mt-4 block text-sm font-semibold text-slate-800">
                Entry
                <Textarea
                  value={entryContent}
                  onChange={(event) => setEntryContent(event.target.value)}
                  maxLength={4000}
                  rows={4}
                  placeholder="Add a focused agenda item or discussion note."
                  className="mt-1.5 resize-y"
                />
              </label>
              <div className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-xs leading-5 ${
                entryVisibility === "PRIVATE"
                  ? "bg-violet-50 text-violet-950"
                  : "bg-indigo-50 text-indigo-950"
              }`}>
                {entryVisibility === "PRIVATE"
                  ? <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  : <UsersRound aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}
                {entryVisibility === "PRIVATE"
                  ? "Only you can read this encrypted entry. It is hidden from the other participant and administrators."
                  : "Both participants can read this encrypted entry. It becomes part of the governed meeting record."}
              </div>
            </fieldset>

            <fieldset className="rounded-xl border border-slate-200 p-4">
              <legend className="px-1 text-sm font-semibold text-slate-900">
                Shared commitment <span className="font-normal text-slate-500">(optional)</span>
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-800">
                  Owner
                  <select
                    value={actionOwner}
                    onChange={(event) => setActionOwner(
                      event.target.value as PerformProOneToOneActionInput["owner_role"],
                    )}
                    className="mt-1.5 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Due date
                  <Input
                    type="date"
                    value={actionDueDate}
                    onChange={(event) => setActionDueDate(event.target.value)}
                    className="mt-1.5 min-h-11"
                  />
                </label>
              </div>
              <label className="mt-4 block text-sm font-semibold text-slate-800">
                Commitment
                <Input
                  value={actionTitle}
                  onChange={(event) => setActionTitle(event.target.value)}
                  maxLength={500}
                  placeholder="Describe the agreed action"
                  className="mt-1.5 min-h-11"
                />
              </label>
              <label className="mt-4 block text-sm font-semibold text-slate-800">
                Description
                <Textarea
                  value={actionDescription}
                  onChange={(event) => setActionDescription(event.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Optional detail or success condition"
                  className="mt-1.5 resize-y"
                />
              </label>
            </fieldset>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 cursor-pointer"
                onClick={() => setEditor(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editorInvalid || editorPending}
                className="min-h-11 cursor-pointer bg-indigo-600 hover:bg-indigo-700"
              >
                {editorPending && <RefreshCw aria-hidden="true" className="size-4 animate-spin" />}
                {editor?.mode === "CREATE" && "Start series"}
                {editor?.mode === "SCHEDULE" && "Schedule meeting"}
                {editor?.mode === "CONTENT" && "Add content"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(completion)} onOpenChange={(open) => !open && setCompletion(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete this one-to-one</DialogTitle>
            <DialogDescription>
              Record a shared summary and decide what happens to every open commitment.
            </DialogDescription>
          </DialogHeader>
          <label className="text-sm font-semibold text-slate-800">
            Shared completion summary
            <Textarea
              autoFocus
              value={completionSummary}
              onChange={(event) => setCompletionSummary(event.target.value)}
              minLength={10}
              maxLength={4000}
              rows={5}
              className="mt-1.5 resize-y"
              placeholder="Summarize decisions, support, and next steps."
            />
          </label>
          {completion?.meeting.actions.some((action) => action.status === "OPEN") && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-slate-900">Open commitments</legend>
              {completion.meeting.actions
                .filter((action) => action.status === "OPEN")
                .map((action) => (
                  <div key={action.uuid} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{action.owner_name}</p>
                    <label className="mt-3 block text-xs font-semibold text-slate-700">
                      Decision
                      <select
                        value={actionDecisions[action.uuid] ?? "KEEP"}
                        onChange={(event) => setActionDecisions((current) => ({
                          ...current,
                          [action.uuid]: event.target.value as ActionDecision,
                        }))}
                        className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                      >
                        <option value="KEEP">Leave open on this meeting</option>
                        <option value="COMPLETE">Mark completed</option>
                        <option value="CARRY">Carry to next meeting</option>
                      </select>
                    </label>
                  </div>
                ))}
            </fieldset>
          )}
          {hasCarry && (
            <label className="text-sm font-semibold text-slate-800">
              Next meeting for carried commitments
              <Input
                required
                type="datetime-local"
                value={nextMeetingAt}
                onChange={(event) => setNextMeetingAt(event.target.value)}
                className="mt-1.5 min-h-11"
              />
              <span className="mt-2 flex items-start gap-2 text-xs font-normal leading-5 text-slate-600">
                <RotateCcw aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                Carried commitments will be cloned into this meeting with source evidence.
              </span>
            </label>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-11 cursor-pointer"
              disabled={completeMutation.isPending}
              onClick={() => setCompletion(null)}
            >
              Cancel
            </Button>
            <Button
              className="min-h-11 cursor-pointer bg-emerald-600 hover:bg-emerald-700"
              disabled={
                completionSummary.trim().length < 10
                || hasCarry && !nextMeetingAt
                || completeMutation.isPending
              }
              onClick={() => completeMutation.mutate()}
            >
              {completeMutation.isPending && <RefreshCw aria-hidden="true" className="size-4 animate-spin" />}
              Complete meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancellation)} onOpenChange={(open) => !open && setCancellation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this meeting?</DialogTitle>
            <DialogDescription>
              The reason is encrypted and retained in immutable meeting evidence. Scheduled
              reminders will safely no-op after cancellation.
            </DialogDescription>
          </DialogHeader>
          <label className="text-sm font-semibold text-slate-800">
            Cancellation reason
            <Textarea
              autoFocus
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
              minLength={10}
              maxLength={1000}
              rows={4}
              className="mt-1.5 resize-y"
              placeholder="Explain why the meeting is being cancelled."
            />
          </label>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-11 cursor-pointer"
              disabled={cancelMutation.isPending}
              onClick={() => setCancellation(null)}
            >
              Keep meeting
            </Button>
            <Button
              className="min-h-11 cursor-pointer bg-rose-600 hover:bg-rose-700"
              disabled={cancellationReason.trim().length < 10 || cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {cancelMutation.isPending && <RefreshCw aria-hidden="true" className="size-4 animate-spin" />}
              Cancel meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
