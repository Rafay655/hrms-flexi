import type {
  GanttTask,
  GanttDependency,
  ProjectEdgeGantt,
} from "@/types/projectedge-gantt";

const DAY = 86_400_000;
export const dayNumber = (date: string): number =>
  Date.parse(`${date}T00:00:00Z`) / DAY;
export const dateFromDay = (day: number): string =>
  new Date(day * DAY).toISOString().slice(0, 10);
export const todayInCompany = (timezone = "Asia/Karachi"): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};

export type TaskRow = { task: GanttTask; depth: number; hasChildren: boolean };
// Only parent/child display ordering. Dependency edges and CPM values are never recalculated here.
export function taskRows(
  tasks: GanttTask[],
  collapsed: ReadonlySet<number>,
): TaskRow[] {
  const ids = new Set(tasks.map((task) => task.id));
  const children = new Map<number, GanttTask[]>();
  for (const task of tasks) {
    if (task.parent_task_id !== null && ids.has(task.parent_task_id)) {
      children.set(task.parent_task_id, [
        ...(children.get(task.parent_task_id) ?? []),
        task,
      ]);
    }
  }
  const result: TaskRow[] = [];
  const visited = new Set<number>();
  const walk = (task: GanttTask, depth: number) => {
    if (visited.has(task.id)) return;
    visited.add(task.id);
    result.push({ task, depth, hasChildren: children.has(task.id) });
    if (!collapsed.has(task.id))
      for (const child of children.get(task.id) ?? []) walk(child, depth + 1);
  };
  for (const task of tasks)
    if (task.parent_task_id === null || !ids.has(task.parent_task_id))
      walk(task, 0);
  // A malformed parent cycle must not hang the renderer or hide every task.
  for (const task of tasks) {
    if (!visited.has(task.id) && !hasCollapsedAncestor(task, tasks, collapsed))
      walk(task, 0);
  }
  return result;
}

function hasCollapsedAncestor(
  task: GanttTask,
  tasks: GanttTask[],
  collapsed: ReadonlySet<number>,
): boolean {
  const seen = new Set<number>();
  let parent = task.parent_task_id;
  while (parent !== null && !seen.has(parent)) {
    if (collapsed.has(parent)) return true;
    seen.add(parent);
    parent =
      tasks.find((candidate) => candidate.id === parent)?.parent_task_id ??
      null;
  }
  return false;
}

export function timelineRange(data: ProjectEdgeGantt) {
  const dates = [
    data.project.start_date,
    data.project.end_date,
    data.schedule.forecast_end_date,
    ...data.tasks.flatMap((task) => [
      task.start_date,
      task.end_date,
      task.earliest_start,
      task.earliest_finish,
    ]),
    ...data.milestones.map((milestone) => milestone.due_date),
  ].filter((date): date is string => Boolean(date));
  return {
    start: Math.min(...dates.map(dayNumber)) - 2,
    end: Math.max(...dates.map(dayNumber)) + 3,
  };
}

export function barGeometry(
  task: GanttTask,
  start: number,
  dayWidth: number,
  forecast: boolean,
  projectStart?: string,
) {
  const from = dayNumber(
    forecast
      ? task.earliest_start
      : (task.start_date ?? projectStart ?? task.earliest_start),
  );
  const to = dayNumber(forecast ? task.earliest_finish : task.end_date);
  return {
    left: (from - start) * dayWidth,
    width: Math.max(1, to - from + 1) * dayWidth,
  };
}

export function dependencyPath(
  edge: GanttDependency,
  rows: TaskRow[],
  start: number,
  dayWidth: number,
  forecast: boolean,
  rowHeight: number,
  projectStart?: string,
): string | null {
  const sourceIndex = rows.findIndex(
    (row) => row.task.id === edge.depends_on_task_id,
  );
  const targetIndex = rows.findIndex((row) => row.task.id === edge.task_id);
  if (sourceIndex < 0 || targetIndex < 0) return null;
  const source = barGeometry(
    rows[sourceIndex].task,
    start,
    dayWidth,
    forecast,
    projectStart,
  );
  const target = barGeometry(
    rows[targetIndex].task,
    start,
    dayWidth,
    forecast,
    projectStart,
  );
  const sx = source.left + (edge.type[0] === "F" ? source.width : 0);
  const tx = target.left + (edge.type[1] === "F" ? target.width : 0);
  const sy = sourceIndex * rowHeight + rowHeight / 2;
  const ty = targetIndex * rowHeight + rowHeight / 2;
  const bend = edge.type[0] === "F" ? sx + 12 : sx - 12;
  return `M ${sx} ${sy} H ${bend} V ${ty} H ${tx}`;
}

export function shiftedDates(
  start: string,
  end: string,
  shift: number,
  mode: "move" | "resize",
) {
  const nextStart = dayNumber(start) + (mode === "move" ? shift : 0);
  return {
    start: dateFromDay(nextStart),
    end: dateFromDay(Math.max(nextStart, dayNumber(end) + shift)),
  };
}

export function timelineTicks(
  start: number,
  end: number,
  zoom: "day" | "week" | "month",
) {
  const ticks: number[] = [];
  if (zoom === "month") {
    const date = new Date(start * DAY);
    date.setUTCDate(1);
    if (date.getTime() / DAY < start) date.setUTCMonth(date.getUTCMonth() + 1);
    for (
      ;
      date.getTime() / DAY <= end;
      date.setUTCMonth(date.getUTCMonth() + 1)
    )
      ticks.push(date.getTime() / DAY);
    return ticks;
  }
  for (let day = start; day <= end; day += zoom === "day" ? 1 : 7)
    ticks.push(day);
  return ticks;
}
