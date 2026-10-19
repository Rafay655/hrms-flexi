import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { projectEdgeService } from "./projectedge";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("projectEdgeService", () => {
  beforeEach(() => vi.resetAllMocks());
  it("creates and edits tasks through existing routes without status or cost writes", async () => {
    const payload = { title: "Task", description: null, assigned_to: 5, milestone_id: null, parent_task_id: null, start_date: "2026-10-01", due_date: "2026-10-10", estimated_hours: 8, priority: "medium" as const };
    vi.mocked(api.post).mockResolvedValue({ data: { data: { id: 9 } } });
    vi.mocked(api.put).mockResolvedValue({ data: { data: { id: 9 } } });
    expect(await projectEdgeService.createTask(7, payload)).toEqual({ id: 9 });
    expect(api.post).toHaveBeenCalledWith("/projectedge/tasks", { ...payload, project_id: 7 });
    expect(await projectEdgeService.updateTask(9, payload)).toEqual({ id: 9 });
    expect(api.put).toHaveBeenCalledWith("/projectedge/tasks/9", payload);
  });
  it("queues full report exports without pagination and uses authenticated blob downloads", async () => {
    const signal = new AbortController().signal;
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { data: { uuid: "export-a" } },
    });
    await projectEdgeService.requestReportExport(
      "cost-burn",
      { project_id: 7, page: 2, per_page: 25 },
      "xlsx",
      signal,
    );
    expect(api.post).toHaveBeenCalledWith(
      "/projectedge/reports/cost-burn/exports",
      { project_id: 7, from: undefined, to: undefined, format: "xlsx" },
      { signal },
    );
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { data: { status: "complete" } },
    });
    expect(
      await projectEdgeService.reportExportStatus("export-a", signal),
    ).toEqual({ status: "complete" });
    expect(api.get).toHaveBeenLastCalledWith(
      "/projectedge/exports/export-a/status",
      { signal },
    );
    const blob = new Blob(["private"]);
    vi.mocked(api.get).mockResolvedValueOnce({ data: blob });
    expect(
      await projectEdgeService.downloadReportExport("export-a", signal),
    ).toBe(blob);
    expect(api.get).toHaveBeenLastCalledWith(
      "/projectedge/exports/export-a/download",
      { responseType: "blob", signal },
    );
  });
  it("reads the approved report endpoint with filters and cancellation", async () => {
    const signal = new AbortController().signal;
    const report = {
      report: "cost-burn",
      rows: [],
      summary: { actual: "125.00" },
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: report } });
    expect(
      await projectEdgeService.report(
        "cost-burn",
        { project_id: 7, page: 2, per_page: 25 },
        signal,
      ),
    ).toEqual(report);
    expect(api.get).toHaveBeenCalledWith("/projectedge/reports/cost-burn", {
      params: { project_id: 7, page: 2, per_page: 25 },
      signal,
    });
  });

  it("loads every personal task page with cancellation and rejects partial reads", async () => {
    const signal = new AbortController().signal;
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: { data: [{ id: 1 }], meta: { last_page: 2 } },
      })
      .mockResolvedValueOnce({
        data: { data: [{ id: 1 }, { id: 2 }], meta: { last_page: 2 } },
      });
    expect(await projectEdgeService.allMyTasks(signal)).toEqual([
      { id: 1 },
      { id: 2 },
    ]);
    expect(api.get).toHaveBeenNthCalledWith(1, "/projectedge/tasks/my", {
      params: { page: 1, per_page: 100 },
      signal,
    });
    expect(api.get).toHaveBeenNthCalledWith(2, "/projectedge/tasks/my", {
      params: { page: 2, per_page: 100 },
      signal,
    });
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: { data: [{ id: 1 }], meta: { last_page: 2 } },
      })
      .mockRejectedValueOnce(new Error("second page failed"));
    await expect(projectEdgeService.allMyTasks(signal)).rejects.toThrow(
      "second page failed",
    );
  });

  it("uses the existing four delay routes with bounded pending/task pages and cancellation", async () => {
    const signal = new AbortController().signal;
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: [{ id: 11 }],
        meta: { current_page: 2, last_page: 3, total: 51 },
      },
    });
    expect(
      (await projectEdgeService.pendingDelays(true, 2, signal)).items,
    ).toEqual([{ id: 11 }]);
    expect(api.get).toHaveBeenLastCalledWith("/projectedge/delays", {
      params: { mine: 1, page: 2, per_page: 25 },
      signal,
    });
    await projectEdgeService.delayTasks("rollout", 1, signal);
    expect(api.get).toHaveBeenLastCalledWith("/projectedge/tasks", {
      params: { search: "rollout", page: 1, per_page: 25 },
      signal,
    });
    vi.mocked(api.post).mockResolvedValue({ data: { data: { id: 11 } } });
    await projectEdgeService.submitDelay(5, {
      delay_days: 3,
      reason: "Waiting",
    });
    expect(api.post).toHaveBeenLastCalledWith("/projectedge/tasks/5/delay", {
      delay_days: 3,
      reason: "Waiting",
    });
    await projectEdgeService.reviewDelay(11, "approve", " Accepted ");
    expect(api.post).toHaveBeenLastCalledWith(
      "/projectedge/delays/11/approve",
      { reviewer_note: "Accepted" },
    );
    await projectEdgeService.reviewDelay(11, "reject", "");
    expect(api.post).toHaveBeenLastCalledWith("/projectedge/delays/11/reject", {
      reviewer_note: null,
    });
  });

  it("uses the budget-gated read and existing planned-line endpoints without adding actual fields", async () => {
    const signal = new AbortController().signal;
    vi.mocked(api.get).mockResolvedValue({
      data: { data: { summary: { actual: "0.00" } } },
    });
    expect(await projectEdgeService.budgetReport(7, signal)).toEqual({
      summary: { actual: "0.00" },
    });
    expect(api.get).toHaveBeenLastCalledWith("/projectedge/projects/7/budget", {
      signal,
    });
    vi.mocked(api.post).mockResolvedValue({ data: { data: { id: 1 } } });
    vi.mocked(api.put).mockResolvedValue({ data: { data: { id: 1 } } });
    const payload = {
      budget_type: "labor" as const,
      description: "Delivery",
      planned_amount: "500.00",
      cost_per_hour: "75.00",
    };
    await projectEdgeService.saveBudgetLine(7, payload);
    expect(api.post).toHaveBeenLastCalledWith(
      "/projectedge/projects/7/budget",
      payload,
    );
    await projectEdgeService.saveBudgetLine(7, payload, 1);
    expect(api.put).toHaveBeenLastCalledWith(
      "/projectedge/projects/7/budget/1",
      payload,
    );
  });

  it("composes bounded resource weeks in order with cancellation and no partial success", async () => {
    const weeks = ["2026-09-28", "2026-10-05"];
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: { data: { week_start: weeks[0], resources: [] } },
      })
      .mockResolvedValueOnce({
        data: { data: { week_start: weeks[1], resources: [] } },
      });
    const signal = new AbortController().signal;
    expect(
      (await projectEdgeService.resourceMatrices(weeks, signal)).map(
        (matrix) => matrix.week_start,
      ),
    ).toEqual(weeks);
    expect(api.get).toHaveBeenNthCalledWith(
      1,
      "/projectedge/resources/matrix",
      { params: { week_start: weeks[0] }, signal },
    );
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      "/projectedge/resources/matrix",
      { params: { week_start: weeks[1] }, signal },
    );
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: { data: { week_start: weeks[0], resources: [] } },
      })
      .mockRejectedValueOnce(new Error("offline"));
    await expect(projectEdgeService.resourceMatrices(weeks)).rejects.toThrow(
      "offline",
    );
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { data: { week_start: "2026-09-21", resources: [] } },
    });
    await expect(
      projectEdgeService.resourceMatrices([weeks[0]]),
    ).rejects.toThrow("does not match");
    await expect(projectEdgeService.resourceMatrices([])).rejects.toThrow(
      "one and eight",
    );
    await expect(
      projectEdgeService.resourceMatrices(Array(9).fill(weeks[0])),
    ).rejects.toThrow("one and eight");
  });

  it("loads all weekly pages with ownership scope and fails on incomplete reads", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: { data: [{ id: 1 }], meta: { last_page: 2 } },
      })
      .mockResolvedValueOnce({
        data: { data: [{ id: 2 }], meta: { last_page: 2 } },
      });
    expect(
      await projectEdgeService.timeEntries("2026-09-28", "2026-10-04", true),
    ).toEqual([{ id: 1 }, { id: 2 }]);
    expect(api.get).toHaveBeenLastCalledWith("/projectedge/timelog", {
      params: {
        from: "2026-09-28",
        to: "2026-10-04",
        mine: 1,
        page: 2,
        per_page: 100,
      },
      signal: undefined,
    });
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: { data: [{ id: 1 }], meta: { last_page: 2 } },
      })
      .mockRejectedValueOnce(new Error("offline"));
    await expect(
      projectEdgeService.timeEntries("2026-09-28", "2026-10-04", false),
    ).rejects.toThrow("offline");
  });

  it("uses the existing time-log write endpoints", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: { id: 9 } } });
    vi.mocked(api.put).mockResolvedValue({ data: { data: { id: 9 } } });
    const input = {
      task_id: 2,
      log_date: "2026-10-01",
      hours_logged: 2,
      description: "Work",
      billable: false,
    };
    await projectEdgeService.saveTimeEntry(input);
    expect(api.post).toHaveBeenLastCalledWith("/projectedge/timelog", input);
    await projectEdgeService.saveTimeEntry(input, 9);
    expect(api.put).toHaveBeenLastCalledWith("/projectedge/timelog/9", input);
    for (const action of ["submit", "approve", "reject"] as const) {
      await projectEdgeService.timeEntryAction(9, action, "Reason");
      expect(api.post).toHaveBeenLastCalledWith(
        `/projectedge/timelog/9/${action}`,
        action === "reject" ? { reason: "Reason" } : undefined,
      );
    }
    await projectEdgeService.timeEntryAction(9, "delete");
    expect(api.delete).toHaveBeenLastCalledWith("/projectedge/timelog/9");
  });

  it("uses milestone lifecycle endpoints without overloading ordinary updates for deferral", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: { milestones: [], capabilities: { manage: true } } },
    });
    const signal = new AbortController().signal;
    await projectEdgeService.milestoneReport(7, signal);
    expect(api.get).toHaveBeenLastCalledWith(
      "/projectedge/projects/7/milestones",
      { signal },
    );
    vi.mocked(api.post).mockResolvedValue({ data: { data: { id: 2 } } });
    vi.mocked(api.put).mockResolvedValue({ data: { data: { id: 2 } } });
    const payload = {
      title: "Gate",
      description: null,
      due_date: "2026-10-10",
      is_gate: true,
      sort_order: 0,
    };
    await projectEdgeService.createMilestone(7, payload);
    expect(api.post).toHaveBeenLastCalledWith(
      "/projectedge/projects/7/milestones",
      payload,
    );
    await projectEdgeService.updateMilestone(2, payload);
    expect(api.put).toHaveBeenLastCalledWith(
      "/projectedge/milestones/2",
      payload,
    );
    await projectEdgeService.deferMilestone(2, {
      due_date: "2026-10-12",
      reason: "Review",
    });
    expect(api.post).toHaveBeenLastCalledWith(
      "/projectedge/milestones/2/defer",
      { due_date: "2026-10-12", reason: "Review" },
    );
    await projectEdgeService.achieveMilestone(2);
    expect(api.post).toHaveBeenLastCalledWith(
      "/projectedge/milestones/2/achieve",
    );
    await projectEdgeService.deleteMilestone(2);
    expect(api.delete).toHaveBeenLastCalledWith("/projectedge/milestones/2");
  });

  it("uses the existing task route for detail and authenticated blob downloads", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: { id: 9 } } });
    const signal = new AbortController().signal;
    expect(await projectEdgeService.taskDetail(9, signal)).toEqual({ id: 9 });
    expect(api.get).toHaveBeenLastCalledWith("/projectedge/tasks/9", {
      signal,
    });
    const blob = new Blob(["hello"]);
    vi.mocked(api.get).mockResolvedValueOnce({ data: blob });
    expect(await projectEdgeService.downloadAttachment(9, 3)).toBe(blob);
    expect(api.get).toHaveBeenLastCalledWith("/projectedge/tasks/9", {
      params: { attachment_id: 3 },
      responseType: "blob",
    });
  });

  it("sends comments, multipart files and deletes to the approved collaboration endpoints", async () => {
    await projectEdgeService.addComment(9, {
      body: "Hello",
      mentions: [4],
      parent_comment_id: 2,
    });
    expect(api.post).toHaveBeenLastCalledWith("/projectedge/tasks/9/comments", {
      body: "Hello",
      mentions: [4],
      parent_comment_id: 2,
    });
    const file = new File(["hello"], "note.txt", { type: "text/plain" });
    await projectEdgeService.uploadAttachment(9, file);
    const form = vi.mocked(api.post).mock.calls.at(-1)?.[1] as FormData;
    expect(form.get("file")).toBe(file);
    await projectEdgeService.deleteAttachment(9, 3);
    expect(api.delete).toHaveBeenLastCalledWith(
      "/projectedge/tasks/9/attachments/3",
    );
    await projectEdgeService.removeDependency(2);
    expect(api.delete).toHaveBeenLastCalledWith("/projectedge/dependencies/2");
  });

  it("loads every project-scoped task page before exposing the board", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: { data: [{ id: 1 }], meta: { last_page: 2 } },
      })
      .mockResolvedValueOnce({
        data: { data: [{ id: 2 }], meta: { last_page: 2 } },
      });
    const signal = new AbortController().signal;
    expect(
      (await projectEdgeService.boardTasks(7, signal)).map((task) => task.id),
    ).toEqual([1, 2]);
    expect(api.get).toHaveBeenNthCalledWith(2, "/projectedge/tasks", {
      params: { project_id: 7, per_page: 100, page: 2 },
      signal,
    });
  });

  it("does not silently show a partial board if a later page fails", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: { data: [{ id: 1 }], meta: { last_page: 2 } },
      })
      .mockRejectedValueOnce(new Error("Offline"));
    await expect(projectEdgeService.boardTasks(7)).rejects.toThrow("Offline");
  });

  it("keeps status-only and reorder permission paths distinct", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { data: { id: 9 } } });
    await projectEdgeService.moveBoardTask({
      id: 9,
      status: "in_progress",
      position: 2,
      reorder: true,
      changeStatus: true,
      delay_reason: "Waiting for vendor",
      confirm_completion: false,
    });
    expect(api.patch).toHaveBeenLastCalledWith(
      "/projectedge/tasks/9/kanban-position",
      {
        status: "in_progress",
        position: 2,
        delay_reason: "Waiting for vendor",
        confirm_completion: false,
      },
    );
    await projectEdgeService.moveBoardTask({
      id: 9,
      status: "in_progress",
      position: 0,
      reorder: true,
      changeStatus: false,
    });
    expect(api.patch).toHaveBeenLastCalledWith(
      "/projectedge/tasks/9/kanban-position",
      { position: 0 },
    );
    await projectEdgeService.moveBoardTask({
      id: 9,
      status: "on_hold",
      position: 0,
      reorder: false,
      changeStatus: true,
    });
    expect(api.patch).toHaveBeenLastCalledWith("/projectedge/tasks/9/status", {
      status: "on_hold",
    });
  });

  it("unwraps the milestone-health collection and server blocker state", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { data: { summary: {}, milestones: [{ id: 1, title: "Gate" }] } },
    });
    expect(await projectEdgeService.projectMilestones(7)).toEqual([
      { id: 1, title: "Gate" },
    ]);
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { data: { block_state: { task_id: 9, is_blocked: false } } },
    });
    expect(await projectEdgeService.taskBlockState(9)).toEqual({
      task_id: 9,
      is_blocked: false,
    });
    expect(api.get).toHaveBeenLastCalledWith(
      "/projectedge/tasks/9/dependencies",
    );
  });

  it("unwraps the authoritative Gantt payload without recomputing schedule values", async () => {
    const payload = {
      schedule: { critical_task_ids: [9], forecast_end_date: "2026-10-20" },
      tasks: [],
    };
    vi.mocked(api.get).mockResolvedValue({ data: { data: payload } });
    expect(await projectEdgeService.gantt(7)).toBe(payload);
    expect(api.get).toHaveBeenCalledWith("/projectedge/projects/7/gantt");
  });

  it("uses the existing task update and dependency endpoints", async () => {
    const dates = { start_date: "2026-10-02", due_date: "2026-10-05" };
    vi.mocked(api.put).mockResolvedValue({ data: { data: { id: 9 } } });
    await projectEdgeService.updateTaskDates(9, dates);
    expect(api.put).toHaveBeenCalledWith("/projectedge/tasks/9", dates);
    const dependency = {
      depends_on_task_id: 8,
      dependency_type: "SF" as const,
      lag_days: -2,
    };
    await projectEdgeService.addDependency(9, dependency);
    expect(api.post).toHaveBeenCalledWith(
      "/projectedge/tasks/9/dependencies",
      dependency,
    );
  });

  it("passes supported project filters and preserves pagination metadata", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        message: "ok",
        data: [{ id: 7, title: "Launch" }],
        meta: {
          current_page: 2,
          last_page: 3,
          per_page: 15,
          total: 31,
          from: 16,
          to: 30,
        },
      },
    });

    const result = await projectEdgeService.projects({
      page: 2,
      status: "active",
      search: "Launch",
    });

    expect(api.get).toHaveBeenCalledWith("/projectedge/projects", {
      params: { page: 2, status: "active", search: "Launch" },
    });
    expect(result.meta.total).toBe(31);
    expect(result.items[0].id).toBe(7);
  });

  it("unwraps a project after creation", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        message: "created",
        data: { id: 9, title: "ERP rollout" },
      },
    });
    const payload = {
      title: "ERP rollout",
      department_id: 2,
      project_type: "it" as const,
      manager_id: 8,
      start_date: "2026-10-01",
      status: "draft" as const,
      priority: "high" as const,
      auto_close: false,
      is_billable: false,
    };

    const result = await projectEdgeService.createProject(payload);

    expect(api.post).toHaveBeenCalledWith("/projectedge/projects", payload);
    expect(result.id).toBe(9);
  });
});
