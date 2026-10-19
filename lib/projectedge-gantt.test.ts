import { describe, expect, it, vi, afterEach } from "vitest";
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
} from "./projectedge-gantt";
import type {
  GanttTask,
  ProjectEdgeGantt,
  DependencyType,
} from "@/types/projectedge-gantt";

export const task = (
  id: number,
  overrides: Partial<GanttTask> = {},
): GanttTask => ({
  id,
  code: `T-${id}`,
  title: `Task ${id}`,
  parent_task_id: null,
  milestone_id: null,
  start_date: "2026-10-01",
  end_date: "2026-10-03",
  status: "in_progress",
  completion_pct: 50,
  is_blocked: false,
  estimated_hours: 8,
  assignee: { id: 2, name: "Sam" },
  earliest_start: "2026-10-02",
  earliest_finish: "2026-10-04",
  latest_start: "2026-10-02",
  latest_finish: "2026-10-04",
  earliest_start_day: 1,
  earliest_finish_day: 4,
  latest_start_day: 1,
  latest_finish_day: 4,
  duration_days: 3,
  total_float_days: 0,
  is_critical: true,
  ...overrides,
});

export const gantt: ProjectEdgeGantt = {
  project: {
    id: 7,
    code: "P-7",
    title: "Launch",
    start_date: "2026-10-01",
    end_date: "2026-10-31",
    status: "active",
    completion_pct: 50,
  },
  schedule: {
    duration_days: 4,
    forecast_end_date: "2026-10-04",
    project_slack_days: 27,
    critical_task_ids: [1],
  },
  tasks: [task(1), task(2, { parent_task_id: 1, is_critical: false })],
  milestones: [
    {
      id: 1,
      title: "Release gate",
      due_date: "2026-10-20",
      is_gate: true,
      status: "pending",
      sort_order: 1,
    },
  ],
  dependencies: [
    { id: 1, task_id: 2, depends_on_task_id: 1, type: "FS", lag_days: 0 },
  ],
};

describe("Gantt rendering geometry (not CPM calculation)", () => {
  afterEach(() => vi.useRealTimers());
  it("uses UTC calendar arithmetic across DST and leap days", () => {
    expect(dayNumber("2026-03-09") - dayNumber("2026-03-08")).toBe(1);
    expect(dateFromDay(dayNumber("2028-02-28") + 1)).toBe("2028-02-29");
  });
  it("uses the company timezone for today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-30T20:00:00Z"));
    expect(todayInCompany("Asia/Karachi")).toBe("2026-10-01");
    expect(todayInCompany("UTC")).toBe("2026-09-30");
  });
  it("orders children below parents and collapses every descendant", () => {
    const tasks = [
      task(3, { parent_task_id: 2 }),
      task(2, { parent_task_id: 1 }),
      task(1),
    ];
    expect(
      taskRows(tasks, new Set()).map(({ task, depth }) => [task.id, depth]),
    ).toEqual([
      [1, 0],
      [2, 1],
      [3, 2],
    ]);
    expect(taskRows(tasks, new Set([1])).map(({ task }) => task.id)).toEqual([
      1,
    ]);
  });
  it("renders orphaned and cyclic parent data without looping", () => {
    expect(
      taskRows(
        [
          task(1, { parent_task_id: 2 }),
          task(2, { parent_task_id: 1 }),
          task(3, { parent_task_id: 99 }),
        ],
        new Set(),
      ),
    ).toHaveLength(3);
  });
  it("draws inclusive planned dates and uses the project anchor for missing starts", () => {
    expect(barGeometry(task(1), dayNumber("2026-10-01"), 10, false)).toEqual({
      left: 0,
      width: 30,
    });
    expect(
      barGeometry(
        task(1, { start_date: null }),
        dayNumber("2026-10-01"),
        10,
        false,
        "2026-10-01",
      ).left,
    ).toBe(0);
    expect(barGeometry(task(1), dayNumber("2026-10-01"), 10, true)).toEqual({
      left: 10,
      width: 30,
    });
  });
  it.each<[DependencyType, number, number]>([
    ["FS", 30, 0],
    ["SS", 0, 0],
    ["FF", 30, 30],
    ["SF", 0, 30],
  ])(
    "renders %s arrow endpoints from prerequisite to dependent",
    (type, source, target) => {
      const path = dependencyPath(
        { id: 1, task_id: 2, depends_on_task_id: 1, type, lag_days: 5 },
        taskRows(gantt.tasks, new Set()),
        dayNumber("2026-10-01"),
        10,
        false,
        68,
      );
      expect(path).toMatch(new RegExp(`^M ${source} 34 `));
      expect(path).toMatch(new RegExp(`V 102 H ${target}$`));
    },
  );
  it("omits arrows whose row is collapsed instead of constructing replacement edges", () => {
    expect(
      dependencyPath(
        gantt.dependencies[0],
        taskRows(gantt.tasks, new Set([1])),
        dayNumber("2026-10-01"),
        10,
        false,
        68,
      ),
    ).toBeNull();
  });
  it("preserves duration when moved backwards and clamps resize to one day", () => {
    expect(shiftedDates("2026-10-10", "2026-10-12", -5, "move")).toEqual({
      start: "2026-10-05",
      end: "2026-10-07",
    });
    expect(shiftedDates("2026-10-10", "2026-10-12", -5, "resize")).toEqual({
      start: "2026-10-10",
      end: "2026-10-10",
    });
  });
  it("covers deadlines and draws real month boundaries", () => {
    expect(timelineRange(gantt).end).toBe(dayNumber("2026-11-03"));
    expect(
      timelineTicks(
        dayNumber("2028-01-28"),
        dayNumber("2028-03-02"),
        "month",
      ).map(dateFromDay),
    ).toEqual(["2028-02-01", "2028-03-01"]);
  });
});
