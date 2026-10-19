"use client";

import { useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Diamond,
  RefreshCw,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProjectEdgeStatePanel } from "./StatePanel";
import { TaskDetailDrawer } from "./TaskDetailDrawer";
import {
  barGeometry,
  dateFromDay,
  dayNumber,
  dependencyPath,
  shiftedDates,
  taskRows,
  timelineRange,
  timelineTicks,
  todayInCompany,
} from "@/lib/projectedge-gantt";
import { projectEdgeService } from "@/services/projectedge";
import { useAppSelector } from "@/store/hooks";
import type { GanttTask } from "@/types/projectedge-gantt";

const ROW_HEIGHT = 68;
const LABEL_WIDTH = 300;
const ZOOM = { day: 44, week: 18, month: 6 };
type Zoom = keyof typeof ZOOM;

function errorMessage(error: unknown): string {
  if (!axios.isAxiosError(error))
    return "The change could not be saved. Try again.";
  const body = error.response?.data;
  const messages =
    body?.errors && typeof body.errors === "object"
      ? Object.values(body.errors)
          .flat()
          .filter((value): value is string => typeof value === "string")
      : [];
  return messages.length
    ? messages.join(" ")
    : (body?.message ?? "The change could not be saved. Try again.");
}

export function ProjectEdgeGanttChart({ projectId }: { projectId: number }) {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const timezone = useAppSelector((state) => state.auth.company?.timezone);
  const canView = permissions.includes("projectedge.gantt.view");
  const canEdit = permissions.some((permission) =>
    ["projectedge.task.create", "projectedge.task.manage"].includes(permission),
  );
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["projectedge", "gantt", projectId],
    queryFn: () => projectEdgeService.gantt(projectId),
    enabled: canView && projectId > 0,
  });
  const [zoom, setZoom] = useState<Zoom>("week");
  const [forecast, setForecast] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const viewport = useRef<HTMLDivElement>(null);
  const arrowId = useId().replaceAll(":", "");
  const today = todayInCompany(timezone || "Asia/Karachi");
  const data = query.data;
  const rows = useMemo(
    () => taskRows(data?.tasks ?? [], collapsed),
    [data?.tasks, collapsed],
  );
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["projectedge", "gantt", projectId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["projectedge", "project", projectId],
      }),
      queryClient.invalidateQueries({ queryKey: ["projectedge", "my-tasks"] }),
    ]);
  };
  const mutation = useMutation({
    mutationFn: ({
      id,
      start,
      end,
    }: {
      id: number;
      start: string;
      end: string;
    }) =>
      projectEdgeService.updateTaskDates(id, {
        start_date: start,
        due_date: end,
      }),
    onSuccess: async () => {
      await refresh();
      setNotice("Task dates saved.");
      toast.success("Task dates saved.");
    },
    onError: (error) => {
      setNotice(errorMessage(error));
      toast.error(errorMessage(error));
    },
  });
  const selected = data?.tasks.find((task) => task.id === selectedId);

  if (!canView)
    return (
      <ProjectEdgeStatePanel
        kind="access"
        title="Gantt access required"
        description="Your role does not include timeline access."
      />
    );
  if (query.isPending)
    return (
      <div role="status" aria-busy="true" className="pe-card border p-6">
        <span className="sr-only">Loading project timeline</span>
        <div className="h-96 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  if (!data || query.isError)
    return (
      <ProjectEdgeStatePanel
        kind="error"
        title="Timeline unavailable"
        description="We could not load the project schedule."
        action={{ label: "Try again", onClick: () => query.refetch() }}
      />
    );

  const range = timelineRange(data);
  const dayWidth = ZOOM[zoom];
  const width = Math.max(600, (range.end - range.start + 1) * dayWidth);
  const todayX = (dayNumber(today) - range.start + 0.5) * dayWidth;
  const showToday = todayX >= 0 && todayX <= width;
  const tickStep = zoom === "day" ? 1 : zoom === "week" ? 7 : 30;
  const ticks = timelineTicks(range.start, range.end, zoom);
  const toggle = (id: number) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section aria-label="Project Gantt timeline" className="space-y-4">
      <div className="pe-card flex flex-wrap items-center justify-between gap-4 border p-4">
        <div>
          <h2>Delivery timeline</h2>
          <p className="mt-1 text-sm text-slate-600">
            Forecast finish {data.schedule.forecast_end_date ?? "not available"}{" "}
            ·{" "}
            {data.schedule.project_slack_days === null
              ? "No deadline slack"
              : `${data.schedule.project_slack_days} days deadline slack`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={forecast}
              onChange={(event) => setForecast(event.target.checked)}
            />
            Show forecast dates
          </label>
          <div
            className="flex rounded-lg border p-1"
            aria-label="Timeline zoom"
          >
            {(Object.keys(ZOOM) as Zoom[]).map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={zoom === level}
                onClick={() => setZoom(level)}
                className={`min-h-11 cursor-pointer rounded-md px-3 text-sm font-semibold capitalize focus-visible:outline-2 ${zoom === level ? "bg-indigo-700 text-white" : "hover:bg-slate-100"}`}
              >
                {level}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            disabled={!showToday}
            onClick={() =>
              viewport.current?.scrollTo({
                left: Math.max(
                  0,
                  LABEL_WIDTH + todayX - viewport.current.clientWidth / 2,
                ),
                behavior: "auto",
              })
            }
          >
            Today
          </Button>
          <Button
            variant="outline"
            disabled={query.isFetching}
            aria-label="Refresh timeline"
            onClick={() => query.refetch()}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 px-1 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1">
          <AlertTriangle aria-hidden="true" className="size-4 text-red-700" />{" "}
          Critical path ({data.schedule.critical_task_ids.length})
        </span>
        <span className="inline-flex items-center gap-1">
          <Diamond aria-hidden="true" className="size-4" /> Milestone / gate
        </span>
        <span>Arrows: prerequisite → dependent</span>
        <span>Dates: {forecast ? "forecast" : "planned"}</span>
      </div>
      <p className="sr-only" id={`${arrowId}-instructions`}>
        Scroll horizontally to explore the schedule. Open a task from its name
        or timeline bar. Critical tasks are labeled. Date changes can also be
        made in the task panel.
      </p>
      <p role="status" aria-live="polite" className="text-sm text-slate-700">
        {mutation.isPending ? "Saving task dates…" : notice}
      </p>
      <details className="pe-card border p-4">
        <summary className="min-h-11 cursor-pointer font-semibold">
          Accessible schedule table
        </summary>
        <div
          className="max-h-96 overflow-auto focus-visible:outline-2 focus-visible:outline-indigo-700"
          role="region"
          aria-label="Scrollable schedule table"
          tabIndex={0}
        >
          <table className="w-max min-w-full text-left text-sm [&_td]:min-w-32">
            <caption className="sr-only">
              Planned task dates and server-calculated critical path
            </caption>
            <thead>
              <tr>
                {[
                  "Task",
                  "Assignee",
                  "Status",
                  "Start",
                  "Due",
                  "Critical",
                  "Prerequisites",
                ].map((label) => (
                  <th key={label} scope="col" className="whitespace-nowrap p-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.tasks.map((task) => (
                <tr key={task.id} className="border-t">
                  <th scope="row" className="min-w-64 p-3">
                    <button
                      type="button"
                      className="min-h-11 w-64 cursor-pointer text-left underline"
                      onClick={() => setSelectedId(task.id)}
                    >
                      {task.code} · {task.title}
                    </button>
                  </th>
                  <td className="p-3">{task.assignee?.name ?? "Unassigned"}</td>
                  <td className="p-3">
                    {task.status.replaceAll("_", " ")}
                    {task.is_blocked ? " · Blocked" : ""}
                  </td>
                  <td className="whitespace-nowrap p-3">
                    {task.start_date ?? data.project.start_date}
                  </td>
                  <td className="whitespace-nowrap p-3">{task.end_date}</td>
                  <td className="p-3">{task.is_critical ? "Yes" : "No"}</td>
                  <td className="p-3">
                    {data.dependencies
                      .filter((edge) => edge.task_id === task.id)
                      .map(
                        (edge) =>
                          `${data.tasks.find((candidate) => candidate.id === edge.depends_on_task_id)?.code ?? edge.depends_on_task_id}: ${edge.type}, lag ${edge.lag_days} days`,
                      )
                      .join("; ") || "None"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {data.tasks.length === 0 && data.milestones.length === 0 ? (
        <ProjectEdgeStatePanel
          kind="empty"
          title="No scheduled work yet"
          description="Add tasks or milestones to display the project timeline."
        />
      ) : (
        <div
          ref={viewport}
          tabIndex={0}
          role="region"
          aria-label="Scrollable project timeline"
          aria-describedby={`${arrowId}-instructions`}
          className="pe-card max-h-[70vh] overflow-auto border focus-visible:outline-2 focus-visible:outline-indigo-700"
        >
          <div style={{ width: LABEL_WIDTH + width }}>
            <div className="sticky top-0 z-20 flex h-14 border-b bg-white">
              <div
                className="sticky left-0 z-30 flex shrink-0 items-center justify-between border-r bg-white px-4 font-semibold"
                style={{ width: LABEL_WIDTH }}
              >
                Tasks & milestones{" "}
                <button
                  type="button"
                  className="min-h-11 px-2 text-xs text-indigo-700"
                  onClick={() => setCollapsed(new Set())}
                >
                  Expand all
                </button>
              </div>
              <div className="relative" style={{ width }}>
                {ticks.map((day) => (
                  <span
                    key={day}
                    className="absolute top-0 flex h-14 items-center border-l px-2 text-xs text-slate-600"
                    style={{ left: (day - range.start) * dayWidth }}
                  >
                    {dateFromDay(day).slice(5)}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              {rows.map(({ task, depth, hasChildren }) => {
                const bar = barGeometry(
                  task,
                  range.start,
                  dayWidth,
                  forecast,
                  data.project.start_date,
                );
                return (
                  <div
                    key={task.id}
                    className="flex border-b border-slate-100"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <div
                      className="sticky left-0 z-10 flex shrink-0 items-center border-r bg-white px-3"
                      style={{
                        width: LABEL_WIDTH,
                        paddingLeft: 12 + Math.min(depth, 8) * 16,
                      }}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          aria-label={`${collapsed.has(task.id) ? "Expand" : "Collapse"} ${task.title}`}
                          aria-expanded={!collapsed.has(task.id)}
                          className="grid size-11 shrink-0 place-items-center rounded hover:bg-slate-100"
                          onClick={() => toggle(task.id)}
                        >
                          {collapsed.has(task.id) ? (
                            <ChevronRight className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>
                      ) : (
                        <span className="w-3 shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedId(task.id)}
                        className="min-h-11 min-w-0 flex-1 cursor-pointer text-left focus-visible:outline-2"
                      >
                        <span className="block truncate text-sm font-semibold">
                          {task.title}
                        </span>
                        <span className="block truncate text-xs text-slate-600">
                          {task.assignee?.name ?? "Unassigned"} ·{" "}
                          {task.status.replaceAll("_", " ")}
                          {task.is_critical ? " · Critical" : ""}
                          {task.is_blocked ? " · Blocked" : ""}
                        </span>
                      </button>
                    </div>
                    <div
                      className="pe-gantt-track relative"
                      style={{
                        width,
                        backgroundSize: `${tickStep * dayWidth}px 100%`,
                      }}
                    >
                      <TaskBar
                        task={task}
                        forecast={forecast}
                        projectStart={data.project.start_date}
                        left={bar.left}
                        width={bar.width}
                        dayWidth={dayWidth}
                        editable={canEdit && !forecast && !mutation.isPending}
                        onOpen={() => setSelectedId(task.id)}
                        onDates={(start, end) =>
                          mutation.mutate({ id: task.id, start, end })
                        }
                      />
                    </div>
                  </div>
                );
              })}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute top-0"
                style={{
                  left: LABEL_WIDTH,
                  width,
                  height: rows.length * ROW_HEIGHT,
                }}
              >
                <defs>
                  <marker
                    id={arrowId}
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto-start-reverse"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" fill="var(--pe-brand-500)" />
                  </marker>
                </defs>
                {data.dependencies.map((edge) => {
                  const path = dependencyPath(
                    edge,
                    rows,
                    range.start,
                    dayWidth,
                    forecast,
                    ROW_HEIGHT,
                    data.project.start_date,
                  );
                  return path ? (
                    <path
                      key={edge.id}
                      d={path}
                      fill="none"
                      stroke="var(--pe-brand-500)"
                      strokeWidth="1.5"
                      markerEnd={`url(#${arrowId})`}
                    >
                      <title>
                        {edge.type} · lag {edge.lag_days} days
                      </title>
                    </path>
                  ) : null;
                })}
              </svg>
              {data.milestones.map((milestone) => (
                <div
                  key={`milestone-${milestone.id}`}
                  className="flex border-b border-slate-100"
                  style={{ height: ROW_HEIGHT }}
                >
                  <div
                    className="sticky left-0 z-10 flex shrink-0 flex-col justify-center border-r bg-white px-4"
                    style={{ width: LABEL_WIDTH }}
                  >
                    <span className="truncate text-sm font-semibold">
                      {milestone.title}
                    </span>
                    <span className="text-xs text-slate-600">
                      {milestone.is_gate ? "Gate" : "Milestone"} ·{" "}
                      {milestone.status} · {milestone.due_date}
                    </span>
                  </div>
                  <div
                    className="pe-gantt-track relative"
                    style={{
                      width,
                      backgroundSize: `${tickStep * dayWidth}px 100%`,
                    }}
                  >
                    <span
                      title={`${milestone.title}: ${milestone.due_date}`}
                      className={`absolute top-6 inline-flex size-5 rotate-45 border-2 ${milestone.status === "achieved" ? "border-green-800 bg-green-100" : "border-indigo-700 bg-orange-100"}`}
                      style={{
                        left:
                          (dayNumber(milestone.due_date) - range.start + 0.5) *
                            dayWidth -
                          10,
                      }}
                    />
                  </div>
                </div>
              ))}
              {showToday ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 z-[5] border-l-2 border-dashed border-red-700"
                  style={{ left: LABEL_WIDTH + todayX }}
                >
                  <span className="rounded bg-red-700 px-1 text-xs text-white">
                    Today
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
      {selected ? (
        <TaskDetailDrawer
          taskId={selected.id}
          projectId={projectId}
          scheduleTask={selected}
          onClose={() => setSelectedId(null)}
          onOpen={setSelectedId}
        />
      ) : null}
    </section>
  );
}

function TaskBar({
  task,
  forecast,
  projectStart,
  left,
  width,
  dayWidth,
  editable,
  onOpen,
  onDates,
}: {
  task: GanttTask;
  forecast: boolean;
  projectStart: string;
  left: number;
  width: number;
  dayWidth: number;
  editable: boolean;
  onOpen: () => void;
  onDates: (start: string, end: string) => void;
}) {
  const drag = useRef<{ x: number; mode: "move" | "resize" } | null>(null);
  const moved = useRef(false);
  const begin = (
    event: React.PointerEvent<HTMLElement>,
    mode: "move" | "resize",
  ) => {
    if (!editable || event.button !== 0) return;
    moved.current = false;
    drag.current = { x: event.clientX, mode };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const finish = (event: React.PointerEvent<HTMLElement>) => {
    const pending = drag.current;
    drag.current = null;
    if (!pending) return;
    const shift = Math.round((event.clientX - pending.x) / dayWidth);
    if (!shift) return;
    moved.current = true;
    const next = shiftedDates(
      task.start_date ?? projectStart,
      task.end_date,
      shift,
      pending.mode,
    );
    onDates(next.start, next.end);
  };
  return (
    <div
      className={`pe-gantt-bar absolute top-3 flex h-11 rounded-md border-2 ${task.is_critical ? "pe-gantt-critical" : "border-indigo-700 bg-indigo-50 text-indigo-900"}`}
      style={{ left, width }}
    >
      <button
        type="button"
        className="relative min-w-0 flex-1 cursor-pointer overflow-hidden px-1 text-left text-xs font-semibold focus-visible:outline-2"
        aria-label={`${task.title}, ${forecast ? task.earliest_start : (task.start_date ?? projectStart)} to ${forecast ? task.earliest_finish : task.end_date}, ${task.completion_pct}% complete${task.is_critical ? ", critical path" : ""}`}
        title={`${task.title} · ${task.is_critical ? "Critical · " : ""}${task.completion_pct}% · Open to edit dates`}
        onPointerDown={(event) => begin(event, "move")}
        onPointerUp={finish}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onClick={() => {
          if (!moved.current) onOpen();
          moved.current = false;
        }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 bg-current opacity-15"
          style={{ width: `${task.completion_pct}%` }}
        />
        <span className="relative block truncate">
          {task.is_critical ? "Critical · " : ""}
          {task.title}
        </span>
      </button>
      {editable ? (
        <button
          type="button"
          aria-label={`Resize ${task.title}; open task panel for keyboard date editing`}
          className="absolute -right-5 -top-0.5 h-11 w-11 cursor-ew-resize after:absolute after:inset-y-2 after:left-5 after:border-l after:border-current"
          onPointerDown={(event) => begin(event, "resize")}
          onPointerUp={finish}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onClick={() => {
            if (!moved.current) onOpen();
            moved.current = false;
          }}
        />
      ) : null}
    </div>
  );
}
