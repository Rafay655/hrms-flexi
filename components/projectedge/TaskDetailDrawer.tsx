"use client";

import { useId, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { PersonLabel } from "./PersonLabel";
import { ProjectEdgeStatePanel } from "./StatePanel";
import { useAppSelector } from "@/store/hooks";
import { projectEdgeService } from "@/services/projectedge";
import { STATUS_LABELS, boardFailure } from "@/lib/projectedge-board";
import { todayInCompany } from "@/lib/projectedge-gantt";
import type { TaskDetail } from "@/types/projectedge-detail";
import type { BoardFailure, TaskStatus } from "@/types/projectedge-board";
import type { GanttTask } from "@/types/projectedge-gantt";

export function TaskDetailDrawer({
  taskId,
  projectId,
  onClose,
  onOpen,
  scheduleTask,
}: {
  taskId: number;
  projectId: number;
  onClose: () => void;
  onOpen: (id: number) => void;
  scheduleTask?: GanttTask;
}) {
  const [opener] = useState(() =>
    typeof document === "undefined"
      ? null
      : (document.activeElement as HTMLElement | null),
  );
  const permissions = useAppSelector((state) => state.auth.permissions);
  const companyId = useAppSelector((state) => state.auth.company?.id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const canView = permissions.includes("projectedge.task.view");
  const query = useQuery({
    queryKey: [
      "projectedge",
      "task-detail",
      companyId,
      userId,
      projectId,
      taskId,
    ],
    queryFn: ({ signal }) => projectEdgeService.taskDetail(taskId, signal),
    enabled: canView,
    retry: false,
  });
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        className="projectedge-shell w-full overflow-y-auto bg-white p-6 sm:max-w-2xl [&>button]:size-11 [&>button]:right-3 [&>button]:top-3"
        onCloseAutoFocus={(event) => {
          if (opener?.isConnected) {
            event.preventDefault();
            opener.focus();
          }
        }}
      >
        <SheetTitle className="pr-12">
          {(canView && !query.isError && query.data?.title) || "Task details"}
        </SheetTitle>
        <SheetDescription>
          {(canView && !query.isError && query.data?.task_code) ||
            "ProjectEdge task workspace"}
        </SheetDescription>
        {!canView ? (
          <ProjectEdgeStatePanel
            kind="access"
            title="Task access required"
            description="You need task-view permission to open this drawer."
          />
        ) : query.isPending ? (
          <p role="status">Loading task details…</p>
        ) : query.isError ? (
          <ProjectEdgeStatePanel
            kind="error"
            title="Task unavailable"
            description="The task may be archived or inaccessible, or the connection failed."
            action={{ label: "Retry task", onClick: () => query.refetch() }}
          />
        ) : query.data.project_id !== projectId ? (
          <ProjectEdgeStatePanel
            kind="error"
            title="Task belongs to another project"
            description="Return to the project that owns this task."
          />
        ) : (
          <TaskWorkspace
            key={`${companyId}-${userId}-${taskId}`}
            task={query.data}
            onOpen={onOpen}
            scheduleTask={scheduleTask}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

const commentSchema = z.object({
  body: z.string().trim().min(1, "Write a comment.").max(10000),
  mentions: z.array(z.string()),
  parent: z.string(),
});
const statusSchema = z.object({
  status: z.string().min(1, "Choose a status."),
  delay_reason: z.string().max(500),
  confirm_completion: z.boolean(),
});
const datesSchema = z
  .object({
    start_date: z.string().min(1, "Choose a start date."),
    due_date: z.string().min(1, "Choose a due date."),
  })
  .refine((data) => data.due_date >= data.start_date, {
    message: "Due date must be on or after start.",
    path: ["due_date"],
  });
const dependencySchema = z.object({
  depends_on_task_id: z.string().regex(/^\d+$/, "Choose a predecessor."),
  dependency_type: z.enum(["FS", "SS", "FF", "SF"]),
  lag_days: z.string().regex(/^-?\d+$/, "Use whole calendar days."),
});

function TaskWorkspace({
  task,
  onOpen,
  scheduleTask,
}: {
  task: TaskDetail;
  onOpen: (id: number) => void;
  scheduleTask?: GanttTask;
}) {
  const queryClient = useQueryClient();
  const timezone = useAppSelector((state) => state.auth.company?.timezone);
  const companyId = useAppSelector((state) => state.auth.company?.id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<BoardFailure | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [reply, setReply] = useState<number | null>(null);
  const comment = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: "", mentions: [] as string[], parent: "" },
  });
  const status = useForm({
    resolver: zodResolver(statusSchema),
    defaultValues: { status: "", delay_reason: "", confirm_completion: false },
  });
  const dates = useForm({
    resolver: zodResolver(datesSchema),
    defaultValues: {
      start_date: task.start_date ?? "",
      due_date: task.due_date ?? "",
    },
  });
  const dependency = useForm({
    resolver: zodResolver(dependencySchema),
    defaultValues: {
      depends_on_task_id: "",
      dependency_type: "FS" as const,
      lag_days: "0",
    },
  });
  const candidates = useQuery({
    queryKey: [
      "projectedge",
      "detail-candidates",
      companyId,
      userId,
      task.project_id,
    ],
    queryFn: ({ signal }) =>
      projectEdgeService.boardTasks(task.project_id, signal),
    enabled: task.capabilities.dependencies,
  });
  async function run(
    action: () => Promise<unknown>,
    message: string,
    reset?: () => void,
  ) {
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      await action();
      reset?.();
      toast.success(message);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["projectedge", "milestone-report", task.project_id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projectedge", "task-detail"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projectedge", "detail-candidates"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projectedge", "board", task.project_id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projectedge", "gantt", task.project_id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projectedge", "project", task.project_id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projectedge", "my-tasks"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projectedge", "block-state"],
        }),
      ]);
    } catch (error) {
      const next = boardFailure(error);
      setFailure(next);
      toast.error(next.message);
    } finally {
      setBusy(false);
    }
  }
  const openTask = (target: number) => {
    if (!busy) onOpen(target);
  };
  const overdue =
    !!task.due_date && task.due_date < todayInCompany(timezone ?? undefined);
  return (
    <div className="pe-task-workspace space-y-6" aria-busy={busy}>
      <div className="flex flex-wrap items-center gap-3">
        <ProjectStatusBadge status={task.status} />
        <span className="text-sm capitalize">{task.priority} priority</span>
        <span>{task.completion_pct}% complete</span>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt>Assignee</dt>
          <dd><PersonLabel person={task.assignee} /></dd>
        </div>
        <div>
          <dt>Milestone</dt>
          <dd>{task.milestone?.title ?? "No milestone"}</dd>
        </div>
        <div>
          <dt>Start date</dt>
          <dd>{task.start_date ?? "Not scheduled"}</dd>
        </div>
        <div>
          <dt>Due date</dt>
          <dd>{task.due_date ?? "Not scheduled"}</dd>
        </div>
      </dl>
      {task.parent ? (
        <Button
          variant="link"
          disabled={busy}
          onClick={() => openTask(task.parent!.id)}
        >
          Parent: {task.parent.task_code} — {task.parent.title}
        </Button>
      ) : null}
      <section aria-label="Description">
        <h3>Description</h3>
        <p className="whitespace-pre-wrap text-sm">
          {task.description || "No description."}
        </p>
      </section>
      {scheduleTask ? (
        <section aria-label="Schedule forecast">
          <h3>Server schedule forecast</h3>
          <p>
            Earliest: {scheduleTask.earliest_start ?? "Unavailable"} →{" "}
            {scheduleTask.earliest_finish ?? "Unavailable"}
          </p>
          <p>
            Latest: {scheduleTask.latest_start ?? "Unavailable"} →{" "}
            {scheduleTask.latest_finish ?? "Unavailable"}
          </p>
          <p>
            Total float: {scheduleTask.total_float_days ?? "Unavailable"} days ·{" "}
            {scheduleTask.is_critical ? "Critical path" : "Not critical"}
          </p>
        </section>
      ) : null}
      {busy ? <p role="status">Processing request…</p> : null}
      {failure ? (
        <div role="alert" className="pe-state-danger rounded-lg p-3 text-sm">
          <p>
            {failure.message} {failure.hint} {failure.reasons.join(" ")}
          </p>
          {failure.blockers.map((blocker, index) => (
            <p key={index}>
              {blocker.message}
              {blocker.blocker_task_id ? (
                <Button
                  variant="link"
                  disabled={busy}
                  onClick={() => openTask(blocker.blocker_task_id!)}
                >
                  Open {blocker.blocker_task_code ?? "blocker"}
                </Button>
              ) : null}
            </p>
          ))}
        </div>
      ) : null}
      {task.allowed_transitions.length ? (
        <section aria-label="Update status">
          <h3>Update status</h3>
          <form
            onSubmit={status.handleSubmit((values) => {
              if (
                values.status === "done" &&
                task.completion_pct < 100 &&
                !values.confirm_completion
              ) {
                status.setError("confirm_completion", {
                  message: "Confirm setting progress to 100%.",
                });
                return;
              }
              if (
                overdue &&
                !["done", "cancelled"].includes(values.status) &&
                !values.delay_reason.trim()
              ) {
                status.setError("delay_reason", {
                  message: "An overdue task requires a delay reason.",
                });
                return;
              }
              return run(
                () =>
                  projectEdgeService.moveBoardTask({
                    id: task.id,
                    status: values.status as TaskStatus,
                    reorder: false,
                    changeStatus: true,
                    position: 0,
                    delay_reason: values.delay_reason || undefined,
                    confirm_completion: values.confirm_completion,
                  }),
                "Task status updated.",
                () => status.reset(),
              );
            })}
            className="space-y-3"
          >
            <label htmlFor={`${id}-status`}>New status</label>
            <select
              id={`${id}-status`}
              {...status.register("status")}
              disabled={busy}
            >
              <option value="">Choose status</option>
              {task.allowed_transitions.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
            <FieldError message={status.formState.errors.status?.message} />
            <label htmlFor={`${id}-delay`}>
              Delay reason{" "}
              {overdue ? "(required for nonterminal changes)" : "(optional)"}
            </label>
            <textarea
              id={`${id}-delay`}
              {...status.register("delay_reason")}
              disabled={busy}
              maxLength={500}
            />
            <FieldError
              message={status.formState.errors.delay_reason?.message}
            />
            {task.completion_pct < 100 ? (
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  {...status.register("confirm_completion")}
                  disabled={busy}
                />
                Confirm completion: set progress to 100% when marking done.
              </label>
            ) : null}
            <FieldError
              message={status.formState.errors.confirm_completion?.message}
            />
            <Button type="submit" className="pe-button-primary" disabled={busy}>
              Save status
            </Button>
          </form>
        </section>
      ) : (
        <p className="text-sm">
          Status is read-only for your role or this terminal task.
        </p>
      )}
      {task.capabilities.edit ? (
        <section aria-label="Schedule">
          <h3>Schedule</h3>
          <form
            className="space-y-3"
            onSubmit={dates.handleSubmit((values) =>
              run(
                () => projectEdgeService.updateTaskDates(task.id, values),
                "Dates updated.",
              ),
            )}
          >
            <label htmlFor={`${id}-start`}>Start date</label>
            <input
              id={`${id}-start`}
              type="date"
              {...dates.register("start_date")}
              disabled={busy}
            />
            <FieldError message={dates.formState.errors.start_date?.message} />
            <label htmlFor={`${id}-due`}>Due date</label>
            <input
              id={`${id}-due`}
              type="date"
              {...dates.register("due_date")}
              disabled={busy}
            />
            <FieldError message={dates.formState.errors.due_date?.message} />
            <Button type="submit" className="pe-button-primary" disabled={busy}>
              Save dates
            </Button>
          </form>
        </section>
      ) : null}
      <section aria-label="Sub-tasks">
        <h3>Sub-tasks ({task.subtasks.length})</h3>
        {task.subtasks.length ? (
          <ul>
            {task.subtasks.map((child) => (
              <li key={child.id}>
                <Button
                  variant="link"
                  disabled={busy}
                  onClick={() => openTask(child.id)}
                >
                  {child.task_code} — {child.title}
                </Button>
                <ProjectStatusBadge status={child.status} />{" "}
                {child.completion_pct}%
              </li>
            ))}
          </ul>
        ) : (
          <p>No sub-tasks.</p>
        )}
      </section>
      <section aria-label="Dependencies">
        <h3>Dependencies</h3>
        {task.dependencies.length ? (
          <ul>
            {task.dependencies.map((edge) => (
              <li
                key={edge.id}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <Button
                  variant="link"
                  disabled={busy}
                  onClick={() => openTask(edge.depends_on_task_id)}
                >
                  {edge.blocker?.task_code ?? `Task ${edge.depends_on_task_id}`}{" "}
                  — {edge.blocker?.title ?? "Archived predecessor"}
                </Button>
                <span>
                  {edge.dependency_type}, lag {edge.lag_days} days
                </span>
                {task.capabilities.dependencies ? (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => projectEdgeService.removeDependency(edge.id),
                        "Dependency removed.",
                      )
                    }
                  >
                    Remove dependency {edge.id}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No dependencies.</p>
        )}
        {task.capabilities.dependencies ? (
          <form
            className="mt-3 space-y-3"
            onSubmit={dependency.handleSubmit((values) =>
              run(
                () =>
                  projectEdgeService.addDependency(task.id, {
                    depends_on_task_id: Number(values.depends_on_task_id),
                    dependency_type: values.dependency_type,
                    lag_days: Number(values.lag_days),
                  }),
                "Dependency added.",
                () => dependency.reset(),
              ),
            )}
          >
            <label htmlFor={`${id}-predecessor`}>Predecessor</label>
            <select
              id={`${id}-predecessor`}
              {...dependency.register("depends_on_task_id")}
              disabled={busy || candidates.isPending || candidates.isError}
            >
              <option value="">Choose predecessor</option>
              {candidates.data
                ?.filter((candidate) => candidate.id !== task.id)
                .map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.task_code} — {candidate.title}
                  </option>
                ))}
            </select>
            <FieldError
              message={dependency.formState.errors.depends_on_task_id?.message}
            />
            {candidates.isError ? (
              <Button
                variant="outline"
                type="button"
                onClick={() => candidates.refetch()}
              >
                Retry predecessors
              </Button>
            ) : null}
            <label htmlFor={`${id}-type`}>Dependency type</label>
            <select
              id={`${id}-type`}
              {...dependency.register("dependency_type")}
              disabled={busy}
            >
              <option value="FS">Finish to start (FS)</option>
              <option value="SS">Start to start (SS)</option>
              <option value="FF">Finish to finish (FF)</option>
              <option value="SF">Start to finish (SF)</option>
            </select>
            <label htmlFor={`${id}-lag`}>Lag (calendar days)</label>
            <input
              id={`${id}-lag`}
              {...dependency.register("lag_days")}
              type="number"
              disabled={busy}
            />
            <FieldError
              message={dependency.formState.errors.lag_days?.message}
            />
            <Button
              type="submit"
              className="pe-button-primary"
              disabled={busy || candidates.isError || candidates.isPending}
            >
              Add dependency
            </Button>
          </form>
        ) : null}
      </section>
      <section aria-label="Blocking chain">
        <h3>Blocking chain</h3>
        {task.block_state.is_blocked ? (
          <ul>
            {task.block_state.blocking_chain.map((blocker, index) => (
              <li key={index} className="text-sm">
                {blocker.message}
                {blocker.blocker_task_id ? (
                  <Button
                    variant="link"
                    disabled={busy}
                    onClick={() => openTask(blocker.blocker_task_id!)}
                  >
                    Open {blocker.blocker_task_code ?? "blocking task"}
                  </Button>
                ) : blocker.milestone_id ? (
                  <a
                    className="inline-flex min-h-11 items-center underline"
                    href={`/projectedge/projects/${task.project_id}/milestones?milestone=${blocker.milestone_id}`}
                  >
                    View gate {blocker.milestone_title}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No outstanding blockers.</p>
        )}
      </section>
      <section aria-label="Time summary">
        <h3>Time summary</h3>
        <p>
          {task.time_summary.estimated_hours} estimated /{" "}
          {task.time_summary.logged_hours} logged hours
        </p>
        <p className="text-sm">
          Logged hours follow the server’s time-log approval rules.
        </p>
      </section>
      <section aria-label="Comments">
        <h3>Comments ({task.comment_count})</h3>
        {task.comment_count > 100 ? (
          <p>Showing the latest 100 comments.</p>
        ) : null}
        {task.comments.length ? (
          <ol className="space-y-3">
            {task.comments.map((entry) => (
              <li
                key={entry.id}
                className={`rounded-lg border p-3 text-sm ${entry.parent_comment_id ? "ml-4 border-l-4" : ""}`}
              >
                <p>
                  {entry.author.name} ·{" "}
                  <time dateTime={entry.created_at}>
                    {new Date(entry.created_at).toLocaleString()}
                  </time>
                  {entry.parent_comment_id
                    ? ` · Reply to comment #${entry.parent_comment_id}`
                    : ""}
                </p>
                <p className="whitespace-pre-wrap">{entry.body}</p>
                {entry.mentions.length ? (
                  <p>
                    Mentioned:{" "}
                    {entry.mentions
                      .map(
                        (mention) =>
                          task.mention_candidates.find(
                            (person) => person.id === mention,
                          )?.name ?? "Former participant",
                      )
                      .join(", ")}
                  </p>
                ) : null}
                {task.capabilities.comment ? (
                  <Button
                    variant="link"
                    disabled={busy}
                    onClick={() => {
                      setReply(entry.id);
                      comment.setValue("parent", String(entry.id));
                    }}
                  >
                    Reply to comment #{entry.id}
                  </Button>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p>No comments yet.</p>
        )}
        {task.capabilities.comment ? (
          <form
            className="mt-3 space-y-3"
            onSubmit={comment.handleSubmit((values) =>
              run(
                () =>
                  projectEdgeService.addComment(task.id, {
                    body: values.body,
                    mentions: values.mentions.map(Number),
                    ...(values.parent
                      ? { parent_comment_id: Number(values.parent) }
                      : {}),
                  }),
                "Comment posted.",
                () => {
                  comment.reset();
                  setReply(null);
                },
              ),
            )}
          >
            {reply ? (
              <p>
                Replying to comment #{reply}{" "}
                <Button
                  variant="link"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setReply(null);
                    comment.setValue("parent", "");
                  }}
                >
                  Cancel reply
                </Button>
              </p>
            ) : null}
            <label htmlFor={`${id}-comment`}>Write a comment</label>
            <textarea
              id={`${id}-comment`}
              {...comment.register("body")}
              disabled={busy}
              maxLength={10000}
            />
            <FieldError message={comment.formState.errors.body?.message} />
            <label htmlFor={`${id}-mentions`}>
              Mention participants (select one or more)
            </label>
            <select
              id={`${id}-mentions`}
              multiple
              {...comment.register("mentions")}
              disabled={busy}
            >
              {task.mention_candidates.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
            <Button type="submit" className="pe-button-primary" disabled={busy}>
              Post comment
            </Button>
          </form>
        ) : (
          <p className="text-sm">Comments are read-only for your role.</p>
        )}
      </section>
      <section aria-label="Attachments">
        <h3>Attachments</h3>
        {task.attachments.length ? (
          <ul className="space-y-3">
            {task.attachments.map((file) => (
              <li key={file.id} className="rounded-lg border p-3 text-sm">
                <p>
                  {file.file_name} · {file.file_size_kb} KB ·{" "}
                  {file.uploaded_by ?? "Former user"}
                </p>
                <Button
                  variant="link"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const blob = await projectEdgeService.downloadAttachment(
                        task.id,
                        file.id,
                      );
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = file.file_name;
                      link.click();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }, "Download started.")
                  }
                >
                  Download {file.file_name}
                </Button>
                {task.capabilities.attachments ? (
                  deleteId === file.id ? (
                    <span>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          run(
                            () =>
                              projectEdgeService.deleteAttachment(
                                task.id,
                                file.id,
                              ),
                            "Attachment deleted.",
                            () => setDeleteId(null),
                          )
                        }
                      >
                        Confirm delete {file.file_name}
                      </Button>
                      <Button
                        variant="link"
                        disabled={busy}
                        onClick={() => setDeleteId(null)}
                      >
                        Keep attachment
                      </Button>
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => setDeleteId(file.id)}
                    >
                      Delete {file.file_name}
                    </Button>
                  )
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No attachments.</p>
        )}
        {task.capabilities.attachments ? (
          <div className="mt-3 space-y-2">
            <label htmlFor={`${id}-file`}>
              Upload attachment (up to{" "}
              {Math.floor(task.attachment_policy.max_bytes / 1048576)} MB)
            </label>
            <input
              ref={fileInput}
              id={`${id}-file`}
              type="file"
              accept={task.attachment_policy.allowed_mimes.join(",")}
              disabled={busy}
            />
            <Button
              type="button"
              className="pe-button-primary"
              disabled={busy}
              onClick={() => {
                const file = fileInput.current?.files?.[0];
                if (!file) {
                  setFailure({
                    message: "Choose a file to upload.",
                    reasons: [],
                    blockers: [],
                  });
                  return;
                }
                if (file.size > task.attachment_policy.max_bytes) {
                  setFailure({
                    message: "File exceeds the attachment size limit.",
                    reasons: [],
                    blockers: [],
                  });
                  return;
                }
                run(
                  () => projectEdgeService.uploadAttachment(task.id, file),
                  "Attachment uploaded.",
                  () => {
                    if (fileInput.current) fileInput.current.value = "";
                  },
                );
              }}
            >
              Upload attachment
            </Button>
            <p className="text-sm">
              File type and size are verified by the server. Files are private
              to authorized project viewers.
            </p>
          </div>
        ) : (
          <p className="text-sm">
            Attachment management is read-only for your role.
          </p>
        )}
      </section>
      {task.capabilities.activity ? (
        <section aria-label="Activity">
          <h3>Recent task activity</h3>
          {task.activity.length ? (
            <ul>
              {task.activity.map((entry) => (
                <li key={entry.id} className="text-sm">
                  {entry.event_type.replaceAll("_", " ")} ·{" "}
                  {entry.actor ?? "Former user"} ·{" "}
                  <time dateTime={entry.created_at}>
                    {new Date(entry.created_at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p>No activity yet.</p>
          )}
          <p className="text-sm">Showing up to 20 latest task events.</p>
        </section>
      ) : null}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-sm text-red-700">
      {message}
    </p>
  ) : null;
}
