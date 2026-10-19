import { describe, expect, it } from "vitest";
import { boardFailure, projectMove, sortedColumn } from "./projectedge-board";
import type { BoardTask } from "@/types/projectedge-board";

const tasks = [
  {
    id: 1,
    status: "todo",
    kanban_column: 0,
    due_date: "2026-10-01",
    completion_pct: 25,
  },
  {
    id: 2,
    status: "todo",
    kanban_column: 0,
    due_date: "2026-10-01",
    completion_pct: 0,
  },
  {
    id: 3,
    status: "in_progress",
    kanban_column: 0,
    due_date: "2026-10-02",
    completion_pct: 75,
  },
] as BoardTask[];
describe("Kanban display helpers", () => {
  it("uses deterministic position/date/id ordering for duplicate ranks", () => {
    expect(
      sortedColumn([...tasks].reverse(), "todo").map((task) => task.id),
    ).toEqual([1, 2]);
  });
  it("projects a pending move without changing progress or mutating the snapshot", () => {
    const moved = projectMove(tasks, {
      id: 1,
      status: "in_progress",
      position: 1,
      reorder: true,
      changeStatus: true,
    });
    expect(sortedColumn(moved, "in_progress").map((task) => task.id)).toEqual([
      3, 1,
    ]);
    expect(moved[0].completion_pct).toBe(25);
    expect(tasks[0].status).toBe("todo");
  });
  it("moves within a column by insertion index", () => {
    expect(
      sortedColumn(
        projectMove(tasks, {
          id: 1,
          status: "todo",
          position: 1,
          reorder: true,
          changeStatus: false,
        }),
        "todo",
      ).map((task) => task.id),
    ).toEqual([2, 1]);
  });
  it("reads the unified blocker envelope and legacy validation fields", () => {
    const blocker = { blocker_task_id: 2, message: "Waiting for evidence" };
    expect(
      boardFailure({
        isAxiosError: true,
        response: {
          data: {
            error: {
              message: "Task blocked",
              hint: "Resolve blockers",
              context: {
                blocking_chain: [blocker],
                reasons: ["Waiting for evidence"],
              },
            },
          },
        },
      }),
    ).toEqual({
      message: "Task blocked",
      hint: "Resolve blockers",
      blockers: [blocker],
      reasons: ["Waiting for evidence"],
    });
    expect(
      boardFailure({
        isAxiosError: true,
        response: {
          data: {
            message: "Invalid",
            errors: { delay_reason: ["Delay reason required"] },
          },
        },
      }).reasons,
    ).toEqual(["Delay reason required"]);
  });
});
