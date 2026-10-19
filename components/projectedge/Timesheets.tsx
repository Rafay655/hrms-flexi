"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/store/hooks";
import { projectEdgeService } from "@/services/projectedge";
import { ProjectEdgeStatePanel } from "./StatePanel";
import {
  todayInCompany,
  dayNumber,
  dateFromDay,
} from "@/lib/projectedge-gantt";
import { weekDays, dailyHours } from "@/lib/projectedge-time";
import type { ProjectEdgeTask } from "@/types/projectedge";
import type { TimeEntry, TimeEntryInput } from "@/types/projectedge-time";

function failure(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    const fields = data?.errors ?? data?.error?.context?.errors;
    const field =
      fields &&
      Object.values(fields)
        .flat()
        .find((value) => typeof value === "string");
    return String(
      field ??
        data?.error?.message ??
        data?.message ??
        "The request failed. Please retry.",
    );
  }
  return "The request failed. Please retry.";
}

type Cell = { task: ProjectEdgeTask; date: string; entry?: TimeEntry };
export function Timesheets() {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const timezone =
    useAppSelector((state) => state.auth.company?.timezone) ?? undefined;
  const canLog = permissions.includes("projectedge.time.log");
  const canApprove = permissions.includes("projectedge.time.approve");
  const [mine, setMine] = useState(canLog);
  const [date, setDate] = useState(() => todayInCompany(timezone));
  const [cell, setCell] = useState<Cell | null>(null);
  const days = weekDays(date);
  const client = useQueryClient();
  const entries = useQuery({
    queryKey: ["projectedge", "timesheets", days[0], mine],
    queryFn: ({ signal }) =>
      projectEdgeService.timeEntries(days[0], days[6], mine, signal),
    enabled: canLog || canApprove,
  });
  const tasks = useQuery({
    queryKey: ["projectedge", "timesheet-tasks"],
    queryFn: async () => {
      const result: ProjectEdgeTask[] = [];
      let page = 1;
      let last = 1;
      do {
        const response = await projectEdgeService.myTasks({
          page,
          per_page: 100,
        });
        result.push(
          ...response.items.filter((task) => task.status !== "cancelled"),
        );
        last = response.meta.last_page;
        page++;
      } while (page <= last);
      return result;
    },
    enabled: canLog && mine && permissions.includes("projectedge.task.view"),
  });
  if (!canLog && !canApprove)
    return (
      <ProjectEdgeStatePanel
        kind="access"
        title="Timesheet access required"
        description="Ask your administrator for time entry or approval access."
      />
    );

  const logs = entries.data ?? [];
  const rows = new Map<
    string,
    { task: ProjectEdgeTask; employeeId?: number; employeeName?: string }
  >();
  if (mine)
    for (const task of tasks.data ?? []) rows.set(String(task.id), { task });
  for (const log of logs)
    rows.set(mine ? String(log.task_id) : `${log.employee_id}-${log.task_id}`, {
      task: {
        ...log.task,
        project_id: log.project_id,
        project: log.project,
        status: "",
        priority: "medium",
        completion_pct: 0,
        is_blocked: false,
        due_date: null,
      },
      employeeId: log.employee_id,
      employeeName: log.employee.name ?? "Employee",
    });
  const refresh = async () => {
    await client.invalidateQueries({
      predicate: ({ queryKey }) => queryKey[0] === "projectedge",
    });
  };
  const dayLabel = (day: string) =>
    new Intl.DateTimeFormat("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${day}T00:00:00Z`));
  return (
    <section className="space-y-4" aria-label="Weekly timesheet">
      <div className="flex flex-wrap items-center gap-3">
        {canLog && (
          <Button
            variant={mine ? "default" : "outline"}
            aria-pressed={mine}
            onClick={() => setMine(true)}
          >
            My entries
          </Button>
        )}
        {canApprove && (
          <Button
            variant={!mine ? "default" : "outline"}
            aria-pressed={!mine}
            onClick={() => setMine(false)}
          >
            Approval workspace
          </Button>
        )}
        <Button
          variant="outline"
          aria-label="Previous week"
          onClick={() => setDate(dateFromDay(dayNumber(days[0]) - 7))}
        >
          Previous
        </Button>
        <label className="text-sm">
          Week containing{" "}
          <input
            className="ml-2 min-h-11 rounded border px-2"
            type="date"
            value={date}
            onChange={(event) => {
              if (event.target.value) setDate(event.target.value);
            }}
          />
        </label>
        <Button
          variant="outline"
          aria-label="Next week"
          onClick={() => setDate(dateFromDay(dayNumber(days[0]) + 7))}
        >
          Next
        </Button>
        <Button
          variant="outline"
          onClick={() => setDate(todayInCompany(timezone))}
        >
          This week
        </Button>
      </div>
      <p className="text-sm text-slate-600">
        {days[0]} – {days[6]}. Drafts are editable; submitted and approved
        entries are locked. Rejected hours do not count toward the 24-hour daily
        limit.
      </p>
      {entries.isPending ? (
        <p role="status">Loading time entries…</p>
      ) : entries.isError ? (
        <ProjectEdgeStatePanel
          kind="error"
          title="Time entries could not load"
          description={failure(entries.error)}
          action={{
            label: "Retry",
            onClick: () => {
              void entries.refetch();
            },
          }}
        />
      ) : (
        <>
          {tasks.isError && mine && (
            <p role="alert">
              Assigned tasks could not load. Existing entries remain available.{" "}
              <Button
                variant="outline"
                onClick={() => {
                  void tasks.refetch();
                }}
              >
                Retry tasks
              </Button>
            </p>
          )}
          {mine && !permissions.includes("projectedge.task.view") && (
            <p role="status">
              Task-view access is required to discover tasks for new entries.
              You can still manage your existing entries.
            </p>
          )}
          {mine && canLog && (
            <div className="md:hidden">
              <label className="block text-sm">
                Quick entry: choose an assigned task
                <select
                  className="mt-1 min-h-11 w-full rounded border px-2"
                  value=""
                  onChange={(event) => {
                    const task = [...rows.values()].find(
                      (row) => row.task.id === Number(event.target.value),
                    )?.task;
                    if (task)
                      setCell({
                        task,
                        date,
                        entry: logs.find(
                          (log) =>
                            log.task_id === task.id && log.log_date === date,
                        ),
                      });
                  }}
                >
                  <option value="">Choose task</option>
                  {[...rows.values()].map(({ task }) => (
                    <option key={task.id} value={task.id}>
                      {task.task_code} — {task.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {!rows.size && !tasks.isFetching ? (
            <ProjectEdgeStatePanel
              kind="empty"
              title={
                mine
                  ? "No assigned tasks or time entries"
                  : "No entries in this week"
              }
              description="Choose another week or ask your project manager about task assignments."
            />
          ) : (
            <div className="hidden overflow-x-auto rounded-xl border bg-white md:block">
              <table className="w-full min-w-[980px] text-sm">
                <caption className="sr-only">
                  Task hours for the week starting {days[0]}
                </caption>
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th scope="col" className="p-3 text-left">
                      Task / project{!mine && " / employee"}
                    </th>
                    {days.map((day) => (
                      <th scope="col" key={day} className="p-2">
                        {dayLabel(day)}
                      </th>
                    ))}
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows.entries()].map(([key, row]) => {
                    const rowLogs = logs.filter(
                      (entry) =>
                        entry.task_id === row.task.id &&
                        (mine || entry.employee_id === row.employeeId),
                    );
                    return (
                      <tr key={key} className="border-b">
                        <th
                          scope="row"
                          className="max-w-56 p-3 text-left font-normal"
                        >
                          <span className="block font-semibold">
                            {row.task.task_code} — {row.task.title}
                          </span>
                          <span className="text-slate-600">
                            {row.task.project?.title}
                          </span>
                          {!mine && (
                            <span className="block">{row.employeeName}</span>
                          )}
                        </th>
                        {days.map((day) => {
                          const entry = rowLogs.find(
                            (log) => log.log_date === day,
                          );
                          return (
                            <td key={day} className="p-1 text-center">
                              {entry || (mine && canLog) ? (
                                <button
                                  className="min-h-11 w-full rounded border p-2 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                                  aria-label={`${row.task.task_code}, ${day}, ${entry ? `${entry.hours_logged} hours, ${entry.status}` : "add time"}`}
                                  onClick={() =>
                                    setCell({
                                      task: row.task,
                                      date: day,
                                      entry,
                                    })
                                  }
                                >
                                  <span className="block font-semibold">
                                    {entry?.hours_logged ?? "+"}
                                  </span>
                                  {entry && (
                                    <span className="block text-xs">
                                      {entry.status}
                                    </span>
                                  )}
                                </button>
                              ) : (
                                "—"
                              )}
                              {entry?.status === "rejected" && (
                                <p className="pe-state-danger max-w-36 text-xs">
                                  {entry.rejection_reason ??
                                    "Rejected — reason unavailable for this older entry."}
                                </p>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-2 text-center font-semibold">
                          {(
                            rowLogs
                              .filter((log) => log.status !== "rejected")
                              .reduce(
                                (sum, log) =>
                                  sum + Math.round(log.hours_logged * 100),
                                0,
                              ) / 100
                          ).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold">
                    <th scope="row" className="p-3 text-left">
                      {mine ? "Daily total" : "Team daily total"}
                    </th>
                    {days.map((day) => (
                      <td key={day} className="p-2 text-center">
                        {dailyHours(logs, day).toFixed(2)}
                      </td>
                    ))}
                    <td className="p-2 text-center">
                      {days.reduce(
                        (sum, day) =>
                          sum + Math.round(dailyHours(logs, day) * 100),
                        0,
                      ) / 100}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
      {!entries.isPending && !entries.isError && (
        <div className="space-y-2 md:hidden" aria-label="Weekly entries">
          {logs.map((entry) => (
            <article key={entry.id} className="pe-card p-3">
              <button
                className="min-h-11 w-full text-left"
                onClick={() =>
                  setCell({
                    task: {
                      ...entry.task,
                      project_id: entry.project_id,
                      project: entry.project,
                      status: "",
                      priority: "medium",
                      completion_pct: 0,
                      is_blocked: false,
                      due_date: null,
                    },
                    date: entry.log_date,
                    entry,
                  })
                }
                aria-label={`Open ${entry.task.task_code}, ${entry.log_date}`}
              >
                <span className="block font-semibold">
                  {entry.task.title} · {entry.hours_logged} h
                </span>
                <span className="block text-sm">
                  {entry.project.title} · {entry.log_date} · {entry.status}
                  {!mine && ` · ${entry.employee.name ?? "Employee"}`}
                </span>
              </button>
              {entry.rejection_reason && (
                <p className="pe-state-danger text-sm">
                  {entry.rejection_reason}
                </p>
              )}
            </article>
          ))}
          <p className="text-sm font-semibold">
            Weekly total:{" "}
            {days.reduce(
              (sum, day) => sum + Math.round(dailyHours(logs, day) * 100),
              0,
            ) / 100}{" "}
            h
          </p>
          <ul className="text-sm">
            {days.map((day) => (
              <li key={day}>
                {dayLabel(day)}: {dailyHours(logs, day).toFixed(2)} h
              </li>
            ))}
          </ul>
        </div>
      )}
      {cell && (
        <EntryDialog
          key={`${cell.task.id}-${cell.date}-${cell.entry?.id ?? "new"}`}
          cell={cell}
          entries={logs}
          canCreate={mine && canLog}
          onClose={() => setCell(null)}
          refresh={refresh}
        />
      )}
    </section>
  );
}

const schema = z.object({
  hours_logged: z
    .number()
    .gt(0, "Enter more than zero hours.")
    .max(24, "An entry cannot exceed 24 hours."),
  description: z.string().max(500),
  billable: z.boolean(),
});
type Values = z.infer<typeof schema>;
function EntryDialog({
  cell,
  entries,
  canCreate,
  onClose,
  refresh,
}: {
  cell: Cell;
  entries: TimeEntry[];
  canCreate: boolean;
  onClose: () => void;
  refresh: () => Promise<void>;
}) {
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const entry = cell.entry;
  const editable = entry ? entry.capabilities.edit : canCreate;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      hours_logged: entry?.hours_logged ?? 1,
      description: entry?.description ?? "",
      billable: entry?.billable ?? false,
    },
  });
  const run = async (work: () => Promise<unknown>, message: string) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await work();
      toast.success(message);
      await refresh();
      onClose();
    } catch (caught) {
      setError(failure(caught));
    } finally {
      setBusy(false);
    }
  };
  const save = form.handleSubmit((values) => {
    const total =
      dailyHours(entries, cell.date, entry?.employee_id, entry?.id) +
      values.hours_logged;
    if (Math.round(total * 100) > 2400) {
      form.setError("hours_logged", {
        message: `Daily total would be ${total.toFixed(2)} hours; the limit is 24.`,
      });
      return;
    }
    const payload: TimeEntryInput = {
      ...values,
      task_id: cell.task.id,
      log_date: cell.date,
    };
    void run(
      () => projectEdgeService.saveTimeEntry(payload, entry?.id),
      "Draft saved",
    );
  });
  const action = (kind: "submit" | "approve" | "reject" | "delete") => {
    if (!entry) return;
    if (kind === "reject" && (!reason.trim() || reason.trim().length > 1000)) {
      setError("Enter a rejection reason of 1–1000 characters.");
      return;
    }
    void run(
      () => projectEdgeService.timeEntryAction(entry.id, kind, reason.trim()),
      `Entry ${kind === "delete" ? "deleted" : kind === "submit" ? "submitted" : kind === "approve" ? "approved" : "rejected"}`,
    );
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        className="projectedge-shell max-h-[90vh] overflow-y-auto"
        showCloseButton={!busy}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          opener?.focus();
        }}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogTitle>
          {cell.task.task_code} — {cell.date}
        </DialogTitle>
        <DialogDescription>
          {cell.task.title} · {entry?.status ?? "New draft"}. Server validation
          remains authoritative.
        </DialogDescription>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {entry?.status === "rejected" && (
          <p className="text-sm text-red-700">
            {entry.rejection_reason ??
              "Rejection reason unavailable for this older entry."}{" "}
            Save corrections as a draft before resubmitting.
          </p>
        )}
        <form onSubmit={save} className="space-y-3">
          <fieldset disabled={busy || !editable} className="space-y-3">
            <label className="block">
              Hours
              <input
                type="number"
                step="0.01"
                className="mt-1 min-h-11 w-full rounded border px-3"
                aria-invalid={!!form.formState.errors.hours_logged}
                aria-describedby="time-hours-error"
                {...form.register("hours_logged", { valueAsNumber: true })}
              />
            </label>
            <p
              id="time-hours-error"
              role={form.formState.errors.hours_logged ? "alert" : undefined}
              className="text-sm text-red-700"
            >
              {form.formState.errors.hours_logged?.message}
            </p>
            <label className="block">
              Description
              <textarea
                className="mt-1 w-full rounded border p-3"
                maxLength={500}
                {...form.register("description")}
              />
            </label>
            {form.formState.errors.description && (
              <p role="alert">{form.formState.errors.description.message}</p>
            )}
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" {...form.register("billable")} />
              Billable time
            </label>
          </fieldset>
          {editable && (
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save draft"}
            </Button>
          )}
        </form>
        {entry && (
          <div className="flex flex-wrap gap-2">
            {entry.capabilities.submit && form.formState.isDirty && (
              <p className="w-full text-sm">
                Save your changes before submitting this draft.
              </p>
            )}
            {entry.capabilities.submit && (
              <Button
                disabled={busy || form.formState.isDirty}
                onClick={() => action("submit")}
              >
                Submit for approval
              </Button>
            )}
            {entry.capabilities.approve && (
              <Button disabled={busy} onClick={() => action("approve")}>
                Approve entry
              </Button>
            )}
            {entry.capabilities.reject && (
              <>
                <label className="w-full">
                  Rejection reason
                  <textarea
                    maxLength={1000}
                    value={reason}
                    disabled={busy}
                    onChange={(event) => setReason(event.target.value)}
                    className="mt-1 w-full rounded border p-3"
                  />
                </label>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => action("reject")}
                >
                  Reject entry
                </Button>
              </>
            )}
            {entry.capabilities.delete &&
              (confirmDelete ? (
                <div>
                  <p>Delete this draft? This cannot be undone.</p>
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={() => action("delete")}
                  >
                    Confirm deletion
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete draft
                </Button>
              ))}
          </div>
        )}
        {entry && (
          <section aria-label="Approval history">
            <h3 className="font-semibold">Entry history</h3>
            {entry.approval_history.length ? (
              <ol className="space-y-2 text-sm">
                {entry.approval_history.map((event) => (
                  <li key={event.id}>
                    {event.event.replaceAll("_", " ")} · {event.actor ?? "User"}{" "}
                    · {new Date(event.at).toLocaleString()}
                    {event.reason && <p>{event.reason}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm">No linked history available.</p>
            )}
          </section>
        )}
        <Button variant="outline" disabled={busy} onClick={onClose}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
