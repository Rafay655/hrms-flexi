"use client";

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CircleAlert,
  Clock3,
  FileCog,
  History,
  LoaderCircle,
  LockKeyhole,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { performProService } from "@/services/performpro";
import type {
  PerformProReportConfiguration,
  PerformProReportFrequency,
  PerformProReportRun,
  PerformProReportRunStatus,
  PerformProReportSchedule,
  PerformProReportScope,
} from "@/types/performpro";

const runStyles: Record<PerformProReportRunStatus, string> = {
  QUEUED: "bg-slate-100 text-slate-700 ring-slate-200",
  RUNNING: "bg-sky-50 text-sky-800 ring-sky-200",
  EXPORT_QUEUED: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  FAILED: "bg-rose-50 text-rose-800 ring-rose-200",
};

const frequencies: Array<{ value: PerformProReportFrequency; label: string }> = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
];

const scopeRank: Record<PerformProReportScope, number> = {
  SELF: 1,
  TEAM: 2,
  COMPANY: 3,
};

function apiMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string; error?: { message?: string } }>(error)) {
    return error.response?.data?.error?.message
      ?? error.response?.data?.message
      ?? fallback;
  }
  return fallback;
}

function formatDate(value: string | null) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function RunStatus({ status }: { status: PerformProReportRunStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${runStyles[status]}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function ReportSchedulingPanel() {
  const queryClient = useQueryClient();
  const [showConfigurationForm, setShowConfigurationForm] = useState(false);
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [cycleUuid, setCycleUuid] = useState("");
  const [configurationName, setConfigurationName] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<PerformProReportScope>("SELF");
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [retentionDays, setRetentionDays] = useState(7);
  const [scheduleName, setScheduleName] = useState("");
  const [frequency, setFrequency] = useState<PerformProReportFrequency>("WEEKLY");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [runTime, setRunTime] = useState("09:00");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Karachi",
  );
  const [recipients, setRecipients] = useState<string[]>([]);

  const schedulingQuery = useQuery({
    queryKey: ["performpro", "reporting", "scheduling"],
    queryFn: performProService.reportSchedulingContext,
  });
  const scheduling = schedulingQuery.data;

  const maximumScope = scheduling?.capabilities.maximum_scope ?? "SELF";
  const scopeOptions = useMemo(() => {
    const rank: Record<PerformProReportScope, number> = {
      SELF: 1,
      TEAM: 2,
      COMPANY: 3,
    };
    return (["SELF", "TEAM", "COMPANY"] as PerformProReportScope[])
      .filter((item) => rank[item] <= rank[maximumScope]);
  }, [maximumScope]);

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["performpro", "reporting", "scheduling"] }),
      queryClient.invalidateQueries({ queryKey: ["performpro", "reporting"] }),
    ]);
  }

  const createConfiguration = useMutation({
    mutationFn: performProService.createReportConfiguration,
    onSuccess: async () => {
      toast.success("Governed report configuration saved.");
      setShowConfigurationForm(false);
      setConfigurationName("");
      setDescription("");
      await refresh();
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "Could not save the report configuration.") }),
  });

  const updateConfiguration = useMutation({
    mutationFn: ({
      configuration,
      isActive,
    }: {
      configuration: PerformProReportConfiguration;
      isActive: boolean;
    }) => performProService.updateReportConfiguration(configuration, { is_active: isActive }),
    onSuccess: async (configuration) => {
      toast.success(configuration.is_active ? "Configuration resumed." : "Configuration paused.");
      await refresh();
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "Could not update the configuration.") }),
  });

  const createSchedule = useMutation({
    mutationFn: performProService.createReportSchedule,
    onSuccess: async () => {
      toast.success("Recurring delivery schedule created.");
      setScheduleFor(null);
      setScheduleName("");
      setRecipients([]);
      await refresh();
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "Could not create the report schedule.") }),
  });

  const updateSchedule = useMutation({
    mutationFn: ({
      schedule,
      isActive,
    }: {
      schedule: PerformProReportSchedule;
      isActive: boolean;
    }) => performProService.updateReportSchedule(schedule, { is_active: isActive }),
    onSuccess: async (schedule) => {
      toast.success(schedule.is_active ? "Schedule resumed." : "Schedule paused.");
      await refresh();
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "Could not update the report schedule.") }),
  });

  const runSchedule = useMutation({
    mutationFn: performProService.runReportSchedule,
    onSuccess: async () => {
      toast.success("Report run queued with frozen recipients.");
      await refresh();
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "Could not queue the report run.") }),
  });

  const rerun = useMutation({
    mutationFn: performProService.rerunReportRun,
    onSuccess: async () => {
      toast.success("Recovery run queued from the original evidence.");
      await refresh();
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "Could not queue the recovery run.") }),
  });

  if (schedulingQuery.isLoading) {
    return (
      <section className="space-y-4" aria-label="Loading report schedules">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </section>
    );
  }

  if (schedulingQuery.isError || !scheduling) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6" role="alert">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 h-5 w-5 text-rose-700" />
          <div className="flex-1">
            <h2 className="font-semibold text-rose-950">Scheduling could not be loaded</h2>
            <p className="mt-1 text-sm text-rose-800">
              {apiMessage(schedulingQuery.error, "Refresh to retry the governed scheduling workspace.")}
            </p>
          </div>
          <Button variant="outline" onClick={() => schedulingQuery.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </section>
    );
  }

  const isBusy = createConfiguration.isPending
    || updateConfiguration.isPending
    || createSchedule.isPending
    || updateSchedule.isPending
    || runSchedule.isPending
    || rerun.isPending;

  return (
    <section className="space-y-5" aria-labelledby="report-scheduling-title">
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-950 to-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/20">
              <CalendarClock className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Governed distribution</p>
              <h2 id="report-scheduling-title" className="mt-1 text-xl font-semibold">
                Saved reports and recurring delivery
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Freeze the configuration and authorized recipient roster for every run. Files remain private,
                retention-limited, and recoverable from immutable run evidence.
              </p>
            </div>
          </div>
          {scheduling.capabilities.can_manage_schedules && (
            <Button
              className="bg-white text-slate-950 hover:bg-blue-50"
              onClick={() => {
                setCycleUuid(cycleUuid || scheduling.cycles[0]?.uuid || "");
                setShowConfigurationForm((value) => !value);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Save configuration
            </Button>
          )}
        </div>
      </div>

      {showConfigurationForm && (
        <form
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            createConfiguration.mutate({
              cycleUuid,
              name: configurationName.trim(),
              description: description.trim(),
              scope,
              includeSensitiveFields: includeSensitive,
              retentionDays,
            });
          }}
        >
          <div className="flex items-center gap-3">
            <FileCog className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-950">New saved report configuration</h3>
              <p className="text-sm text-slate-500">Scope and sensitive-field access are checked again for every run.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Review cycle
              <select
                required
                value={cycleUuid}
                onChange={(event) => setCycleUuid(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <option value="">Select a cycle</option>
                {scheduling.cycles.map((cycle) => (
                  <option key={cycle.uuid} value={cycle.uuid}>{cycle.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Configuration name
              <input
                required
                minLength={3}
                maxLength={160}
                value={configurationName}
                onChange={(event) => setConfigurationName(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                placeholder="Executive cycle health"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Reporting scope
              <select
                value={scope}
                onChange={(event) => setScope(event.target.value as PerformProReportScope)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {scopeOptions.map((item) => (
                  <option key={item} value={item}>{item.charAt(0) + item.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700 md:col-span-2">
              Description
              <input
                maxLength={1000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                placeholder="Purpose and intended audience"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Retention (days)
              <input
                type="number"
                min={scheduling.capabilities.retention_days_min}
                max={scheduling.capabilities.retention_days_max}
                value={retentionDays}
                onChange={(event) => setRetentionDays(Number(event.target.value))}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              />
            </label>
          </div>
          {scheduling.capabilities.can_include_sensitive && (
            <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <input
                type="checkbox"
                checked={includeSensitive}
                onChange={(event) => setIncludeSensitive(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-400"
              />
              <span>
                <span className="block font-semibold">Include sensitive compensation aggregates</span>
                Every recipient must retain explicit sensitive-export access at execution and download time.
              </span>
            </label>
          )}
          <div className="mt-5 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowConfigurationForm(false)}>Cancel</Button>
            <Button type="submit" disabled={createConfiguration.isPending || !cycleUuid || configurationName.trim().length < 3}>
              {createConfiguration.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Save configuration
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-3" aria-label="Scheduling safeguards">
        {[
          [ShieldCheck, "Recipient authorization", "Scope and sensitive access are rechecked when each run starts."],
          [LockKeyhole, "Private delivery", "Notifications point recipients back to authenticated PerformPro downloads."],
          [History, "Immutable recovery", "Reruns retain the original configuration and recipient evidence."],
        ].map(([Icon, title, copy]) => {
          const SafeguardIcon = Icon as typeof ShieldCheck;
          return (
            <div key={String(title)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <SafeguardIcon className="h-5 w-5 text-blue-600" />
              <h3 className="mt-3 text-sm font-semibold text-slate-950">{String(title)}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{String(copy)}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-4" aria-live="polite">
        {scheduling.configurations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <CalendarClock className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-3 font-semibold text-slate-900">No saved report configurations</h3>
            <p className="mt-1 text-sm text-slate-500">Save a governed configuration before adding recurring delivery.</p>
          </div>
        ) : scheduling.configurations.map((configuration) => (
          <article key={configuration.uuid} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-950">{configuration.name}</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    {configuration.scope}
                  </span>
                  {!configuration.is_active && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                      PAUSED
                    </span>
                  )}
                  {configuration.include_sensitive_fields && (
                    <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-800 ring-1 ring-inset ring-rose-200">
                      <LockKeyhole className="mr-1 h-3 w-3" /> SENSITIVE
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{configuration.cycle_name} · CSV · {configuration.retention_days}-day retention</p>
                <p className="mt-2 font-mono text-[11px] text-slate-400" title={configuration.current_evidence_hash}>
                  Evidence {configuration.current_evidence_hash.slice(0, 12)}…
                </p>
              </div>
              {scheduling.capabilities.can_manage_schedules && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => updateConfiguration.mutate({
                      configuration,
                      isActive: !configuration.is_active,
                    })}
                  >
                    {configuration.is_active ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {configuration.is_active ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    size="sm"
                    disabled={isBusy || !configuration.is_active}
                    onClick={() => {
                      setScheduleFor(scheduleFor === configuration.uuid ? null : configuration.uuid);
                      setRecipients([]);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add schedule
                  </Button>
                </div>
              )}
            </div>

            {scheduleFor === configuration.uuid && (
              <form
                className="border-b border-blue-100 bg-blue-50/50 p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  createSchedule.mutate({
                    configurationUuid: configuration.uuid,
                    name: scheduleName.trim(),
                    frequency,
                    dayOfWeek: frequency === "WEEKLY" ? dayOfWeek : null,
                    dayOfMonth: ["MONTHLY", "QUARTERLY"].includes(frequency) ? dayOfMonth : null,
                    runTime,
                    timezone,
                    recipientUserUuids: recipients,
                  });
                }}
              >
                <h4 className="text-sm font-semibold text-slate-950">New recurring schedule</h4>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <label className="space-y-1.5 text-xs font-semibold text-slate-700 xl:col-span-2">
                    Schedule name
                    <input
                      required
                      minLength={3}
                      maxLength={160}
                      value={scheduleName}
                      onChange={(event) => setScheduleName(event.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      placeholder="Monday leadership delivery"
                    />
                  </label>
                  <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                    Frequency
                    <select
                      value={frequency}
                      onChange={(event) => setFrequency(event.target.value as PerformProReportFrequency)}
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      {frequencies.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                  {frequency === "WEEKLY" && (
                    <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                      Day
                      <select
                        value={dayOfWeek}
                        onChange={(event) => setDayOfWeek(Number(event.target.value))}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                          .map((label, index) => <option key={label} value={index}>{label}</option>)}
                      </select>
                    </label>
                  )}
                  {["MONTHLY", "QUARTERLY"].includes(frequency) && (
                    <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                      Day of month
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={dayOfMonth}
                        onChange={(event) => setDayOfMonth(Number(event.target.value))}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      />
                    </label>
                  )}
                  <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                    Local run time
                    <input
                      type="time"
                      required
                      value={runTime}
                      onChange={(event) => setRunTime(event.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    />
                  </label>
                  <label className="space-y-1.5 text-xs font-semibold text-slate-700 xl:col-span-2">
                    Timezone
                    <input
                      required
                      value={timezone}
                      onChange={(event) => setTimezone(event.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    />
                  </label>
                </div>
                <fieldset className="mt-4">
                  <legend className="text-xs font-semibold text-slate-700">Authorized recipients</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {scheduling.recipient_candidates
                      .filter((recipient) => (
                        scopeRank[recipient.maximum_scope] >= scopeRank[configuration.scope]
                        && (!configuration.include_sensitive_fields || recipient.can_receive_sensitive)
                      ))
                      .map((recipient) => (
                        <label key={recipient.uuid} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                          <input
                            type="checkbox"
                            checked={recipients.includes(recipient.uuid)}
                            onChange={(event) => setRecipients((current) => event.target.checked
                              ? [...current, recipient.uuid]
                              : current.filter((uuid) => uuid !== recipient.uuid))}
                            className="mt-0.5 h-4 w-4 rounded border-slate-400"
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-900">{recipient.name}</span>
                            <span className="block truncate text-xs text-slate-500">{recipient.email} · {recipient.maximum_scope}</span>
                          </span>
                        </label>
                      ))}
                  </div>
                </fieldset>
                <div className="mt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setScheduleFor(null)}>Cancel</Button>
                  <Button type="submit" disabled={createSchedule.isPending || scheduleName.trim().length < 3 || recipients.length === 0}>
                    {createSchedule.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Create schedule
                  </Button>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-100">
              {configuration.schedules.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">No recurring schedules for this configuration.</p>
              ) : configuration.schedules.map((schedule) => (
                <div key={schedule.uuid} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-950">{schedule.name}</h4>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                            schedule.is_active
                              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                              : "bg-amber-50 text-amber-800 ring-amber-200"
                          }`}>
                            {schedule.is_active ? "ACTIVE" : "PAUSED"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {schedule.frequency} at {schedule.run_time} · {schedule.timezone} · {schedule.recipient_count} recipients
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Next: {formatDate(schedule.next_run_at)} · Last: {schedule.last_run_status ?? "Not yet"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => updateSchedule.mutate({ schedule, isActive: !schedule.is_active })}
                      >
                        {schedule.is_active ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {schedule.is_active ? "Pause" : "Resume"}
                      </Button>
                      <Button
                        size="sm"
                        disabled={isBusy || !configuration.is_active}
                        onClick={() => runSchedule.mutate(schedule.uuid)}
                      >
                        <Send className="mr-2 h-4 w-4" /> Run now
                      </Button>
                    </div>
                  </div>

                  {schedule.runs.length > 0 && (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Run</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Recipients</th>
                            <th className="px-4 py-3 font-semibold">Requested</th>
                            <th className="px-4 py-3 font-semibold">Evidence / recovery</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {schedule.runs.map((run) => (
                            <RunRow
                              key={run.uuid}
                              run={run}
                              canRetry={scheduling.capabilities.can_retry_runs}
                              busy={isBusy}
                              onRetry={(uuid) => rerun.mutate(uuid)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RunRow({
  run,
  canRetry,
  busy,
  onRetry,
}: {
  run: PerformProReportRun;
  canRetry: boolean;
  busy: boolean;
  onRetry: (uuid: string) => void;
}) {
  return (
    <tr className="transition hover:bg-slate-50">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900">{run.trigger_type} · attempt {run.attempt_number}</p>
        <p className="mt-1 font-mono text-[11px] text-slate-400">{run.uuid.slice(0, 12)}…</p>
      </td>
      <td className="px-4 py-3">
        <RunStatus status={run.status} />
        {run.failure_code && <p className="mt-1 text-xs text-rose-700">{run.failure_code}</p>}
      </td>
      <td className="px-4 py-3 text-slate-600">
        <span className="inline-flex items-center"><UsersRound className="mr-1.5 h-4 w-4" /> {run.recipient_count}</span>
      </td>
      <td className="px-4 py-3 text-slate-600">{formatDate(run.requested_at)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <code className="text-[11px] text-slate-500">{run.current_evidence_hash.slice(0, 10)}…</code>
          {canRetry && ["FAILED", "COMPLETED"].includes(run.status) && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onRetry(run.uuid)}>
              <RefreshCw className="mr-2 h-4 w-4" /> Rerun
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
