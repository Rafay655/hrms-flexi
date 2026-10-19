import React from "react";
import { detailFixture } from "./task-detail.fixture";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProjectEdgeGanttChart } from "./GanttChart";
import { projectEdgeService } from "@/services/projectedge";
import type { ProjectEdgeGantt, GanttTask } from "@/types/projectedge-gantt";

const auth = vi.hoisted(() => ({
  permissions: [
    "projectedge.gantt.view",
    "projectedge.task.view",
    "projectedge.task.manage",
    "projectedge.dependency.manage",
  ],
}));
vi.mock("@/store/hooks", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({
      auth: {
        permissions: auth.permissions,
        company: { timezone: "Asia/Karachi" },
      },
    }),
}));
vi.mock("@/services/projectedge", () => ({
  projectEdgeService: {
    taskDetail: vi.fn(),
    gantt: vi.fn(),
    boardTasks: vi.fn(),
    updateTaskDates: vi.fn(),
    addDependency: vi.fn(),
  },
}));

const first: GanttTask = {
  id: 1,
  code: "T-1",
  title: "Discovery",
  parent_task_id: null,
  milestone_id: 1,
  start_date: "2026-10-01",
  end_date: "2026-10-03",
  status: "in_progress",
  completion_pct: 40,
  is_blocked: true,
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
};
const data: ProjectEdgeGantt = {
  project: {
    id: 7,
    code: "P-7",
    title: "Launch",
    start_date: "2026-10-01",
    end_date: "2026-10-31",
    status: "active",
    completion_pct: 40,
  },
  schedule: {
    duration_days: 4,
    forecast_end_date: "2026-10-04",
    project_slack_days: 27,
    critical_task_ids: [1],
  },
  tasks: [
    first,
    {
      ...first,
      id: 2,
      code: "T-2",
      title: "Interview",
      parent_task_id: 1,
      is_critical: false,
    },
  ],
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
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ProjectEdgeGanttChart projectId={7} />
    </QueryClientProvider>,
  );
  return client;
}
describe("ProjectEdge Gantt interactions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.permissions = [
      "projectedge.gantt.view",
      "projectedge.task.view",
      "projectedge.task.manage",
      "projectedge.dependency.manage",
    ];
    vi.mocked(projectEdgeService.taskDetail).mockResolvedValue(detailFixture());
    vi.mocked(projectEdgeService.boardTasks).mockResolvedValue([
      detailFixture(),
      detailFixture({ id: 2, title: "Interview" }),
    ]);
    vi.mocked(projectEdgeService.gantt).mockResolvedValue(
      structuredClone(data),
    );
  });
  afterEach(cleanup);
  it("fails closed without timeline permission", () => {
    auth.permissions = [];
    mount();
    expect(screen.getByText("Gantt access required")).toBeInTheDocument();
    expect(projectEdgeService.gantt).not.toHaveBeenCalled();
  });
  it("supports hierarchy collapse, zoom, milestones and server critical labels", async () => {
    mount();
    await screen.findByRole("button", { name: "Collapse Discovery" });
    expect(screen.getByText("Release gate")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Collapse Discovery" }));
    expect(
      screen.queryByRole("button", { name: /^InterviewSam/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(
      screen.getByRole("button", { name: /^InterviewSam/ }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "month" }));
    expect(screen.getByRole("button", { name: "month" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Critical path (1)")).toBeInTheDocument();
  });
  it("retains authoritative dates after a rejected save and exposes the server error", async () => {
    vi.mocked(projectEdgeService.updateTaskDates).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: { errors: { due_date: ["Date exceeds project bounds."] } },
      },
    });
    const client = mount();
    fireEvent.click(
      await screen.findByRole("button", { name: /^DiscoverySam/ }),
    );
    fireEvent.change(await screen.findByLabelText("Due date"), {
      target: { value: "2026-10-05" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save dates" }));
    await screen.findByText(/Date exceeds project bounds\./);
    expect(
      client.getQueryData<ProjectEdgeGantt>(["projectedge", "gantt", 7])
        ?.tasks[0].end_date,
    ).toBe("2026-10-03");
    expect(projectEdgeService.gantt).toHaveBeenCalledTimes(1);
  });
  it("disables saves while pending and refetches only after server confirmation", async () => {
    let confirm!: (
      value: Awaited<ReturnType<typeof projectEdgeService.updateTaskDates>>,
    ) => void;
    vi.mocked(projectEdgeService.updateTaskDates).mockImplementation(
      () =>
        new Promise((resolve) => {
          confirm = resolve;
        }),
    );
    const client = mount();
    fireEvent.click(
      await screen.findByRole("button", { name: /^DiscoverySam/ }),
    );
    fireEvent.change(await screen.findByLabelText("Due date"), {
      target: { value: "2026-10-05" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save dates" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save dates" })).toBeDisabled(),
    );
    expect(
      client.getQueryData<ProjectEdgeGantt>(["projectedge", "gantt", 7])
        ?.tasks[0].end_date,
    ).toBe("2026-10-03");
    vi.mocked(projectEdgeService.gantt).mockResolvedValue({
      ...data,
      tasks: [{ ...first, end_date: "2026-10-05" }, data.tasks[1]],
    });
    confirm({ id: 1 } as Awaited<
      ReturnType<typeof projectEdgeService.updateTaskDates>
    >);
    await waitFor(() =>
      expect(projectEdgeService.gantt).toHaveBeenCalledTimes(2),
    );
    expect(
      client.getQueryData<ProjectEdgeGantt>(["projectedge", "gantt", 7])
        ?.tasks[0].end_date,
    ).toBe("2026-10-05");
  });
  it("adds dependencies through the server and displays cycle validation failures", async () => {
    vi.mocked(projectEdgeService.addDependency).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Dependency would create a cycle." } },
    });
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: /^DiscoverySam/ }),
    );
    const predecessor = await screen.findByLabelText("Predecessor");
    await waitFor(() => expect(predecessor).not.toBeDisabled());
    fireEvent.change(predecessor, {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Dependency type"), {
      target: { value: "SS" },
    });
    fireEvent.change(screen.getByLabelText("Lag (calendar days)"), {
      target: { value: "-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add dependency" }));
    await screen.findByText("Dependency would create a cycle.");
    expect(projectEdgeService.addDependency).toHaveBeenCalledWith(1, {
      depends_on_task_id: 2,
      dependency_type: "SS",
      lag_days: -1,
    });
  });
  it("provides a read-only drawer without mutation permissions", async () => {
    auth.permissions = ["projectedge.gantt.view"];
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: /^DiscoverySam/ }),
    );
    await screen.findByText("Task access required");
    expect(projectEdgeService.taskDetail).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Save dates" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add dependency" }),
    ).not.toBeInTheDocument();
  });
  it.each(["move", "resize"] as const)(
    "sends a pointer %s to the server without moving the cached bar",
    async (mode) => {
      vi.mocked(projectEdgeService.updateTaskDates).mockImplementation(
        () => new Promise(() => {}),
      );
      const client = mount();
      const button = await screen.findByRole("button", {
        name: mode === "move" ? /^Discovery, 2026/ : /^Resize Discovery/,
      });
      Object.defineProperty(button, "setPointerCapture", { value: vi.fn() });
      fireEvent(
        button,
        new MouseEvent("pointerdown", {
          bubbles: true,
          button: 0,
          clientX: 100,
        }),
      );
      fireEvent(
        button,
        new MouseEvent("pointerup", { bubbles: true, button: 0, clientX: 136 }),
      );
      await waitFor(() =>
        expect(projectEdgeService.updateTaskDates).toHaveBeenCalledWith(1, {
          start_date: mode === "move" ? "2026-10-03" : "2026-10-01",
          due_date: "2026-10-05",
        }),
      );
      expect(
        client.getQueryData<ProjectEdgeGantt>(["projectedge", "gantt", 7])
          ?.tasks[0].end_date,
      ).toBe("2026-10-03");
    },
  );
  it("provides recoverable errors and a truthful empty state", async () => {
    vi.mocked(projectEdgeService.gantt).mockRejectedValueOnce(
      new Error("Network unavailable"),
    );
    vi.mocked(projectEdgeService.gantt).mockResolvedValue({
      ...data,
      tasks: [],
      milestones: [],
      dependencies: [],
      schedule: { ...data.schedule, critical_task_ids: [] },
    });
    mount();
    await screen.findByText("Timeline unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("No scheduled work yet");
  });
});
