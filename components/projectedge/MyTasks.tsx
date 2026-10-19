"use client";

import { useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { projectEdgeService } from "@/services/projectedge";
import { STATUS_LABELS } from "@/lib/projectedge-board";
import { todayInCompany } from "@/lib/projectedge-gantt";
import {
  personalTaskResults,
  type PersonalTaskFilters,
} from "@/lib/projectedge-my-tasks";
import type { PersonalTask } from "@/types/projectedge-my-tasks";
import type { TaskStatus } from "@/types/projectedge-board";
import { TaskDetailDrawer } from "./TaskDetailDrawer";
import { ProjectEdgeStatePanel } from "./StatePanel";
import { ProjectStatusBadge } from "./ProjectStatusBadge";

const initial: PersonalTaskFilters = {
  status: "",
  project: "",
  blocked: false,
  search: "",
  sort: "due",
};
const PAGE_SIZE = 50;
export function MyTasks() {
  const scope = useAppSelector(
    (state) => `${state.auth.company?.id}-${state.auth.user?.id}`,
  );
  return <PersonalWorkspace key={scope} scope={scope} />;
}

function PersonalWorkspace({ scope }: { scope: string }) {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const timezone = useAppSelector((state) => state.auth.company?.timezone);
  const canView = permissions.includes("projectedge.task.view");
  const [filters, setFilters] = useState(initial);
  const [view, setView] = useState<"list" | "board">("list");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<{
    id: number;
    projectId: number;
  } | null>(null);
  const query = useQuery({
    queryKey: ["projectedge", "my-tasks", scope],
    queryFn: ({ signal }) => projectEdgeService.allMyTasks(signal),
    enabled: canView,
    retry: false,
  });
  const filter = (change: Partial<PersonalTaskFilters>) => {
    setFilters((current) => ({ ...current, ...change }));
    setPage(0);
  };
  if (!canView)
    return (
      <ProjectEdgeStatePanel
        kind="access"
        title="Task access required"
        description="Task-view permission is required to see assigned work."
      />
    );
  const tasks = query.isError ? [] : (query.data ?? []);
  const results = personalTaskResults(tasks, filters);
  const projects = [
    ...new Map(
      tasks
        .filter((task) => task.project)
        .map((task) => [task.project_id, task.project!]),
    ).values(),
  ].sort((a, b) => a.title.localeCompare(b.title));
  const last = Math.max(0, Math.ceil(results.length / PAGE_SIZE) - 1);
  const current = Math.min(page, last);
  const visible = results.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const today = todayInCompany(timezone ?? undefined);
  const open = (task: PersonalTask) =>
    setSelected({ id: task.id, projectId: task.project_id });
  const card = (task: PersonalTask) => (
    <PersonalTaskCard
      key={task.id}
      task={task}
      today={today}
      permissions={permissions}
      onOpen={() => open(task)}
    />
  );
  return (
    <section className="space-y-5" aria-label="My assigned tasks">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" aria-label="Task display mode">
          <Button
            variant={view === "list" ? "default" : "outline"}
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            List view
          </Button>
          <Button
            variant={view === "board" ? "default" : "outline"}
            aria-pressed={view === "board"}
            onClick={() => setView("board")}
          >
            Board view
          </Button>
        </div>
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => {
            void query.refetch();
          }}
        >
          {query.isFetching ? "Refreshing…" : "Refresh tasks"}
        </Button>
      </div>
      <div
        className="pe-card grid items-end gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Task filters"
      >
        <label>
          Search assigned work
          <input
            className="mt-1 min-h-11 w-full rounded border px-3"
            value={filters.search}
            onChange={(event) => filter({ search: event.target.value })}
            maxLength={255}
          />
        </label>
        <label>
          Task status
          <select
            className="mt-1 min-h-11 w-full rounded border px-3"
            value={filters.status}
            onChange={(event) => filter({ status: event.target.value })}
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Project
          <select
            className="mt-1 min-h-11 w-full rounded border px-3"
            value={filters.project}
            onChange={(event) => filter({ project: event.target.value })}
          >
            <option value="">All assigned projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.project_code} · {project.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort tasks
          <select
            className="mt-1 min-h-11 w-full rounded border px-3"
            value={filters.sort}
            onChange={(event) =>
              filter({
                sort: event.target.value as PersonalTaskFilters["sort"],
              })
            }
          >
            <option value="due">Due date — earliest first</option>
            <option value="priority">Priority — critical first</option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={filters.blocked}
            onChange={(event) => filter({ blocked: event.target.checked })}
          />
          Blocked only
        </label>
        <Button
          variant="outline"
          onClick={() => {
            setFilters(initial);
            setPage(0);
          }}
        >
          Clear filters
        </Button>
      </div>
      {query.isPending ? (
        <div role="status" aria-busy="true" className="pe-card min-h-48 p-6">
          Loading all assigned task pages…
        </div>
      ) : query.isError ? (
        <ProjectEdgeStatePanel
          kind={
            isAxiosError(query.error) && query.error.response?.status === 403
              ? "access"
              : "error"
          }
          title="Assigned tasks unavailable"
          description="Your task queue could not be loaded, or task access / an employee profile is unavailable. Cached or partially loaded tasks are not shown."
          action={{
            label: "Retry tasks",
            onClick: () => {
              void query.refetch();
            },
          }}
        />
      ) : (
        <>
          <p role="status" className="text-sm">
            {results.length} matching of {tasks.length} assigned tasks across
            all loaded pages.{" "}
            {results.length > 0 &&
              `Showing ${current * PAGE_SIZE + 1}–${current * PAGE_SIZE + visible.length}.`}
          </p>
          {!results.length ? (
            <ProjectEdgeStatePanel
              kind="empty"
              title={tasks.length ? "No matching tasks" : "No assigned tasks"}
              description={
                tasks.length
                  ? "Change or clear filters to see other assigned work."
                  : "Tasks assigned to your employee profile will appear here."
              }
            />
          ) : view === "list" ? (
            <ul
              className="grid grid-cols-[minmax(0,1fr)] gap-3"
              aria-label="Assigned task list"
            >
              {visible.map((task) => (
                <li key={task.id}>{card(task)}</li>
              ))}
            </ul>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Board columns group the current display page, not whole-project
                Kanban ranks. Open a task to use its authorized status controls;
                this board has no drag/reorder actions.
              </p>
              <div
                className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3"
                aria-label="Assigned task board"
              >
                {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(
                  ([status, label]) => {
                    const column = visible.filter(
                      (task) => task.status === status,
                    );
                    const total = results.filter(
                      (task) => task.status === status,
                    ).length;
                    return (
                      <section
                        key={status}
                        className="min-w-0 rounded-xl border bg-slate-50 p-3"
                        aria-label={`${label} tasks`}
                      >
                        <h2 className="mb-3 font-semibold">
                          {label}{" "}
                          <span className="text-sm font-normal">
                            ({column.length} on page / {total} matching)
                          </span>
                        </h2>
                        {column.length ? (
                          <ul className="space-y-3">
                            {column.map((task) => (
                              <li key={task.id}>{card(task)}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm">
                            No tasks in this column on this page.
                          </p>
                        )}
                      </section>
                    );
                  },
                )}
              </div>
            </>
          )}
          {results.length > PAGE_SIZE && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
              >
                Previous tasks
              </Button>
              <span role="status" className="text-sm">
                Page {current + 1} of {last + 1}
              </span>
              <Button
                variant="outline"
                disabled={current === last}
                onClick={() => setPage(current + 1)}
              >
                Next tasks
              </Button>
            </div>
          )}
        </>
      )}
      {selected && !query.isError && (
        <TaskDetailDrawer
          key={`${scope}-${selected.projectId}`}
          taskId={selected.id}
          projectId={selected.projectId}
          onClose={() => setSelected(null)}
          onOpen={(id) => setSelected({ ...selected, id })}
        />
      )}
    </section>
  );
}

function PersonalTaskCard({
  task,
  today,
  permissions,
  onOpen,
}: {
  task: PersonalTask;
  today: string;
  permissions: string[];
  onOpen: () => void;
}) {
  const overdue = Boolean(
    task.due_date &&
      task.due_date < today &&
      !["done", "cancelled"].includes(task.status),
  );
  const priorityStyle =
    task.priority === "critical"
      ? "pe-state-danger"
      : task.priority === "high"
        ? "pe-state-warning"
        : "pe-state-neutral";
  const projectText = `${task.project?.project_code ?? "Project"} · ${task.project?.title ?? "Project context unavailable"}`;
  return (
    <article className="pe-card min-w-0 space-y-3 p-4">
      <h3 className="font-semibold">
        <Button
          variant="link"
          className="h-auto min-h-11 max-w-full items-start whitespace-normal [overflow-wrap:anywhere] p-0 text-left"
          onClick={onOpen}
          aria-label={`Open task ${task.task_code}: ${task.title}`}
        >
          {task.task_code} · {task.title}
        </Button>
      </h3>
      <p className="break-words text-sm">
        {permissions.includes("projectedge.project.view") ? (
          <Link
            className="underline"
            href={`/projectedge/projects/${task.project_id}`}
          >
            {projectText}
          </Link>
        ) : (
          projectText
        )}
      </p>
      <p className="break-words text-sm">
        Milestone:{" "}
        {task.milestone ? (
          permissions.includes("projectedge.milestone.view") &&
          permissions.includes("projectedge.project.view") ? (
            <Link
              className="underline"
              href={`/projectedge/projects/${task.project_id}/milestones?milestone=${task.milestone.id}`}
            >
              {task.milestone.title}
            </Link>
          ) : (
            task.milestone.title
          )
        ) : (
          "No linked milestone"
        )}
        {task.milestone?.due_date && ` · Due ${task.milestone.due_date}`}
      </p>
      <div className="flex flex-wrap gap-2 text-sm">
        <ProjectStatusBadge status={task.status} />
        <span className={`${priorityStyle} rounded border px-2 py-1`}>
          Priority: {task.priority}
        </span>
        {task.is_blocked && (
          <span className="pe-state-danger rounded border px-2 py-1">
            Blocked
          </span>
        )}
        {overdue && (
          <span className="pe-state-warning rounded border px-2 py-1">
            Overdue
          </span>
        )}
      </div>
      <p className="text-sm">
        Due {task.due_date ?? "not set"} · {task.completion_pct}% complete
      </p>
      {task.is_blocked && (
        <p className="text-sm text-slate-600">
          Open task details for server-provided blockers and milestone gates.
        </p>
      )}
    </article>
  );
}
