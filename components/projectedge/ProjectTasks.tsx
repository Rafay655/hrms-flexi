"use client";

import { useEffect, useId, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { projectEdgeService } from "@/services/projectedge";
import { STATUS_LABELS } from "@/lib/projectedge-board";
import type { BoardTask } from "@/types/projectedge-board";
import type {
  ProjectEdgeProject,
  ProjectEdgeTaskInput,
  ProjectEdgePriority,
} from "@/types/projectedge";
import { ProjectEdgeStatePanel } from "./StatePanel";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { TaskDetailDrawer } from "./TaskDetailDrawer";

export function ProjectTasks(props: {
  projectId: number;
  initialCreate?: boolean;
}) {
  const scope = useAppSelector(
    (s) =>
      `${s.auth.company?.id}-${s.auth.user?.id}-${s.auth.permissions.join(",")}`,
  );
  return (
    <TaskWorkspace
      key={`${props.projectId}-${scope}-${!!props.initialCreate}`}
      {...props}
      scope={scope}
    />
  );
}

function TaskWorkspace({
  projectId,
  initialCreate,
  scope,
}: {
  projectId: number;
  initialCreate?: boolean;
  scope: string;
}) {
  const router = useRouter();
  const editorOpener = useRef<HTMLButtonElement | null>(null);
  const closeEditor = () => {
    setEditor(null);
    if (editorOpener.current?.isConnected) editorOpener.current.focus();
    editorOpener.current = null;
    if (initialCreate)
      router.replace(`/projectedge/projects/${projectId}/tasks`, {
        scroll: false,
      });
  };
  const permissions = useAppSelector((s) => s.auth.permissions);
  const canView = permissions.includes("projectedge.task.view");
  const canCreate = permissions.includes("projectedge.task.create");
  const canEdit = canCreate || permissions.includes("projectedge.task.manage");
  const [editor, setEditor] = useState<"new" | BoardTask | null>(
    initialCreate && canCreate ? "new" : null,
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ["projectedge", "board", projectId, scope],
    queryFn: ({ signal }) => projectEdgeService.boardTasks(projectId, signal),
    enabled: canView,
    retry: false,
  });
  const project = useQuery({
    queryKey: ["projectedge", "project", projectId, scope],
    queryFn: () => projectEdgeService.project(projectId),
    enabled: canView,
    retry: false,
  });
  const milestones = useQuery({
    queryKey: ["projectedge", "milestones", projectId, scope],
    queryFn: () => projectEdgeService.projectMilestones(projectId),
    enabled: canView,
    retry: false,
  });
  if (!canView)
    return (
      <ProjectEdgeStatePanel
        kind="access"
        title="Task access required"
        description="Task-view permission is required to open this workspace."
      />
    );
  if (query.isPending || project.isPending)
    return (
      <p role="status" aria-busy="true">
        Loading project tasks…
      </p>
    );
  if (query.isError || project.isError)
    return (
      <ProjectEdgeStatePanel
        kind="error"
        title="Tasks unavailable"
        description="The project may be inaccessible or the connection failed."
        action={{
          label: "Retry tasks",
          onClick: () => {
            void query.refetch();
            void project.refetch();
          },
        }}
      />
    );
  const tasks = query.data.filter((t) => t.project_id === projectId);
  const filtered = tasks.filter(
    (t) =>
      (!status || t.status === status) &&
      `${t.task_code} ${t.title} ${t.assignee?.name ?? ""}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 25) - 1),
  );
  return (
    <section className="space-y-4" aria-label="Project task workspace">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Project tasks</h2>
        <div className="flex flex-wrap gap-2">
          {canCreate && (
            <Button
              onClick={(event) => {
                editorOpener.current = event.currentTarget;
                setEditor("new");
                setNotice("");
              }}
            >
              Create task
            </Button>
          )}
          <Button variant="outline" onClick={() => void query.refetch()}>
            Refresh tasks
          </Button>
        </div>
      </div>
      {notice && <p role="status">{notice}</p>}
      {editor && (
        <TaskEditor
          key={editor === "new" ? "new" : editor.id}
          project={project.data}
          tasks={tasks}
          task={editor === "new" ? undefined : editor}
          milestones={milestones.data ?? []}
          lookupPending={milestones.isPending}
          lookupFailed={milestones.isError}
          retryLookups={() => void milestones.refetch()}
          onCancel={closeEditor}
          onSaved={(title) => {
            closeEditor();
            setNotice(`Task saved: ${title}`);
            toast.success(`Task saved: ${title}`);
          }}
        />
      )}
      <div className="pe-card grid gap-3 border p-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Search project tasks
          <input
            type="search"
            className="rounded-md border px-3 py-2"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Task status
          <select
            className="rounded-md border px-3 py-2"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!filtered.length ? (
        <ProjectEdgeStatePanel
          kind="empty"
          title={tasks.length ? "No matching tasks" : "No tasks yet"}
          description={
            tasks.length
              ? "Change the search or status filter."
              : "Create the first task to plan work in this project."
          }
          action={
            tasks.length
              ? {
                  label: "Clear task filters",
                  onClick: () => {
                    setSearch("");
                    setStatus("");
                  },
                }
              : undefined
          }
        />
      ) : (
        <ul className="space-y-3" aria-label="Project task list">
          {filtered
            .slice(currentPage * 25, currentPage * 25 + 25)
            .map((task) => (
              <li
                key={task.id}
                className="pe-card min-w-0 space-y-3 border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    className="min-h-11 min-w-0 text-left font-semibold hover:underline"
                    onClick={() => setSelected(task.id)}
                    aria-label={`Open task ${task.task_code}: ${task.title}`}
                  >
                    {task.task_code} · {task.title}
                  </button>
                  {canEdit && (
                    <Button
                      variant="outline"
                      onClick={(event) => {
                        editorOpener.current = event.currentTarget;
                        setEditor(task);
                        setNotice("");
                      }}
                      aria-label={`Edit ${task.task_code}`}
                    >
                      Edit task
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ProjectStatusBadge status={task.status} />
                  <span className="text-sm">Priority: {task.priority}</span>
                  {task.is_blocked && (
                    <span className="pe-state-warning rounded border px-2 py-1 text-sm">
                      Blocked
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">
                  {task.assignee?.name ?? "Assigned employee"} · Due{" "}
                  {task.due_date ?? "not set"} · {task.completion_pct}% complete
                  · {task.estimated_hours} estimated hours
                </p>
              </li>
            ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          {filtered.length} matching tasks · Page {currentPage + 1} of{" "}
          {Math.max(1, Math.ceil(filtered.length / 25))}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!currentPage}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous tasks
          </Button>
          <Button
            variant="outline"
            disabled={(currentPage + 1) * 25 >= filtered.length}
            onClick={() => setPage(currentPage + 1)}
          >
            Next tasks
          </Button>
        </div>
      </div>
      {selected && (
        <TaskDetailDrawer
          taskId={selected}
          projectId={projectId}
          onClose={() => setSelected(null)}
          onOpen={setSelected}
        />
      )}
    </section>
  );
}

function TaskEditor({
  project,
  tasks,
  task,
  milestones,
  lookupPending,
  lookupFailed,
  retryLookups,
  onCancel,
  onSaved,
}: {
  project: ProjectEdgeProject;
  tasks: BoardTask[];
  task?: BoardTask;
  milestones: Array<{ id: number; title: string }>;
  lookupPending: boolean;
  lookupFailed: boolean;
  retryLookups: () => void;
  onCancel: () => void;
  onSaved: (title: string) => void;
}) {
  const client = useQueryClient();
  const id = useId();
  const alert = useRef<HTMLParagraphElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (error) alert.current?.focus();
  }, [error]);
  const scope = useAppSelector(
    (s) => `${s.auth.company?.id}-${s.auth.user?.id}`,
  );
  const detail = useQuery({
    queryKey: ["projectedge", "edit-task", scope, task?.id],
    queryFn: () => projectEdgeService.taskDetail(task!.id),
    enabled: !!task,
    retry: false,
  });
  if (task && detail.isPending)
    return <p role="status">Checking task edit access…</p>;
  if (
    task &&
    (detail.isError ||
      detail.data?.project_id !== project.id ||
      !detail.data?.capabilities.edit)
  )
    return (
      <ProjectEdgeStatePanel
        kind="access"
        title="Task edit unavailable"
        description="This task cannot be edited with your current access, or could not be loaded."
        action={{ label: "Cancel edit", onClick: onCancel }}
      />
    );
  const value = detail.data ?? task;
  const participants = project.participants ?? [];
  const fieldClass = "w-full min-w-0 rounded-md border px-3 py-2 text-sm";
  return (
    <form
      aria-label={task ? "Edit project task" : "Create project task"}
      className="pe-card space-y-4 border p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (saving || lookupPending || lookupFailed) return;
        const data = new FormData(e.currentTarget);
        const payload: ProjectEdgeTaskInput = {
          title: String(data.get("title")).trim(),
          description: String(data.get("description")).trim() || null,
          assigned_to: Number(data.get("assigned_to")),
          milestone_id: Number(data.get("milestone_id")) || null,
          parent_task_id: Number(data.get("parent_task_id")) || null,
          start_date: String(data.get("start_date")) || null,
          due_date: String(data.get("due_date")),
          estimated_hours: Number(data.get("estimated_hours")),
          priority: String(data.get("priority")) as ProjectEdgePriority,
        };
        if (
          !payload.title ||
          (payload.start_date && payload.start_date > payload.due_date)
        ) {
          setError("Enter a title and a due date on or after the start date.");
          return;
        }
        setSaving(true);
        setError("");
        try {
          if (task) await projectEdgeService.updateTask(task.id, payload);
          else await projectEdgeService.createTask(project.id, payload);
          await client.invalidateQueries({ queryKey: ["projectedge"] });
          onSaved(payload.title);
        } catch (cause) {
          const response = isAxiosError(cause) ? cause.response?.data : null;
          const messages = response?.errors
            ? Object.values(response.errors)
                .flat()
                .filter((v) => typeof v === "string")
                .join(" ")
            : "";
          setError(
            messages ||
              response?.message ||
              "Task could not be saved. Your entries are retained; check access and try again.",
          );
        } finally {
          setSaving(false);
        }
      }}
    >
      <h3 className="text-lg font-semibold">
        {task ? `Edit ${task.task_code}` : "Create task"}
      </h3>
      <p className="text-sm text-slate-600">
        Assign an active project participant. Dates must fit{" "}
        {project.start_date} to {project.end_date ?? "the project window"}.
        Status changes use the task detail drawer.
      </p>
      {lookupPending && <p role="status">Loading milestone choices…</p>}
      {lookupFailed && (
        <div role="alert">
          Milestones could not be loaded.{" "}
          <Button type="button" variant="outline" onClick={retryLookups}>
            Retry milestone choices
          </Button>
        </div>
      )}
      {error && (
        <p
          ref={alert}
          tabIndex={-1}
          id={`${id}-error`}
          role="alert"
          className="pe-state-danger rounded border p-3"
        >
          {error}
        </p>
      )}
      <fieldset
        disabled={saving || lookupPending || lookupFailed}
        aria-describedby={error ? `${id}-error` : undefined}
        className="grid min-w-0 gap-4 sm:grid-cols-2"
      >
        <label className="grid gap-1 text-sm sm:col-span-2">
          Task title
          <input
            autoFocus
            name="title"
            required
            maxLength={255}
            defaultValue={value?.title ?? ""}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          Description
          <textarea
            name="description"
            defaultValue={value?.description ?? ""}
            rows={3}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Assignee
          <select
            name="assigned_to"
            required
            defaultValue={value?.assigned_to ?? ""}
            className={fieldClass}
          >
            <option value="">Choose project participant</option>
            {participants.map((p) => (
              <option key={p.employee_id} value={p.employee_id}>
                {p.employee?.name ?? `Employee ${p.employee_id}`}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Priority
          <select
            name="priority"
            defaultValue={value?.priority ?? "medium"}
            className={fieldClass}
          >
            {["low", "medium", "high", "critical"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Start date
          <input
            name="start_date"
            type="date"
            min={project.start_date}
            max={project.end_date ?? undefined}
            defaultValue={value?.start_date ?? project.start_date}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Due date
          <input
            name="due_date"
            required
            type="date"
            min={project.start_date}
            max={project.end_date ?? undefined}
            defaultValue={value?.due_date ?? project.end_date ?? ""}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Estimated hours
          <input
            name="estimated_hours"
            type="number"
            required
            min={0}
            max={999999.99}
            step="0.01"
            defaultValue={value?.estimated_hours ?? 0}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Milestone
          <select
            name="milestone_id"
            defaultValue={value?.milestone_id ?? ""}
            className={fieldClass}
          >
            <option value="">No milestone</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          Parent task
          <select
            name="parent_task_id"
            defaultValue={value?.parent_task_id ?? ""}
            className={fieldClass}
          >
            <option value="">No parent task</option>
            {tasks
              .filter((t) => t.id !== task?.id)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.task_code} · {t.title}
                </option>
              ))}
          </select>
        </label>
        <Button type="submit" disabled={!participants.length}>
          {saving
            ? "Saving task…"
            : task
              ? "Save task changes"
              : "Save new task"}
        </Button>
      </fieldset>
      {!participants.length && (
        <p role="alert">
          Add an active participant to the project before creating tasks.
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={saving}
        onClick={onCancel}
      >
        Cancel task form
      </Button>
    </form>
  );
}
