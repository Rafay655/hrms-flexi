import React from "react";
import { detailFixture } from "./task-detail.fixture";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DragEndEvent } from "@dnd-kit/core";
import { ProjectEdgeKanbanBoard } from "./KanbanBoard";
import { projectEdgeService } from "@/services/projectedge";
import type { BoardTask } from "@/types/projectedge-board";

const auth = vi.hoisted(() => ({
  permissions: [
    "projectedge.task.view",
    "projectedge.task.status",
    "projectedge.task.manage",
    "projectedge.project.view",
  ],
}));
const drag = vi.hoisted(() => ({
  end: undefined as unknown as (event: DragEndEvent) => void,
}));
vi.mock("@/store/hooks", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: { permissions: auth.permissions } }),
}));
vi.mock("@/services/projectedge", () => ({
  projectEdgeService: {
    taskDetail: vi.fn(),
    boardTasks: vi.fn(),
    projectMilestones: vi.fn(),
    moveBoardTask: vi.fn(),
    taskBlockState: vi.fn(),
  },
}));
vi.mock("@dnd-kit/core", async (original) => {
  const real = await original<typeof import("@dnd-kit/core")>();
  return {
    ...real,
    DndContext: (props: React.ComponentProps<typeof real.DndContext>) => {
      drag.end = props.onDragEnd!;
      return <real.DndContext {...props} />;
    },
  };
});
const first: BoardTask = {
  id: 1,
  project_id: 7,
  task_code: "TSK-1",
  title: "Discovery",
  description: "Collect evidence",
  status: "todo",
  kanban_column: 0,
  due_date: "2026-10-10",
  start_date: "2026-10-01",
  priority: "high",
  completion_pct: 40,
  is_blocked: false,
  milestone_id: 1,
  parent_task_id: null,
  assigned_to: 5,
  assignee: { id: 5, name: "Sam" },
  estimated_hours: 8,
  logged_hours: 2,
};
const second: BoardTask = {
  ...first,
  id: 2,
  task_code: "TSK-2",
  title: "Evidence",
  kanban_column: 1,
  priority: "low",
};
function mount(initialTaskId?: number) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ProjectEdgeKanbanBoard projectId={7} initialTaskId={initialTaskId} />
    </QueryClientProvider>,
  );
  return client;
}
const card = (title = "Discovery") =>
  screen.getByRole("article", { name: new RegExp(`: ${title}$`) });
async function request(status: string) {
  await screen.findByRole("article", { name: "TSK-1: Discovery" });
  fireEvent.change(within(card()).getByLabelText("Move TSK-1 to"), {
    target: { value: status },
  });
  fireEvent.click(within(card()).getByRole("button", { name: "Move" }));
  return screen.findByRole("dialog");
}
describe("ProjectEdge Kanban board", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.permissions = [
      "projectedge.task.view",
      "projectedge.task.status",
      "projectedge.task.manage",
      "projectedge.project.view",
    ];
    vi.mocked(projectEdgeService.boardTasks).mockResolvedValue(
      structuredClone([first, second]),
    );
    vi.mocked(projectEdgeService.projectMilestones).mockResolvedValue([
      { id: 1, title: "Release gate" },
    ]);
    vi.mocked(projectEdgeService.taskDetail).mockImplementation(async (id) =>
      detailFixture({
        ...(id === 1 ? first : second),
        capabilities: {
          edit: false,
          comment: false,
          attachments: false,
          dependencies: false,
          activity: false,
        },
        allowed_transitions: [],
      }),
    );
    vi.mocked(projectEdgeService.taskBlockState).mockResolvedValue({
      task_id: 2,
      is_blocked: false,
      reasons: [],
      blocking_chain: [],
    });
  });
  afterEach(cleanup);
  it("fails closed without task view permission", () => {
    auth.permissions = [];
    mount();
    expect(screen.getByText("Board access required")).toBeInTheDocument();
    expect(projectEdgeService.boardTasks).not.toHaveBeenCalled();
  });
  it("renders card metadata, filters and optional execution states", async () => {
    vi.mocked(projectEdgeService.boardTasks).mockResolvedValue([
      first,
      second,
      {
        ...first,
        id: 3,
        task_code: "TSK-3",
        title: "Paused work",
        status: "on_hold",
      },
      {
        ...first,
        id: 4,
        task_code: "TSK-4",
        title: "Cancelled work",
        status: "cancelled",
      },
    ]);
    mount();
    await screen.findByRole("article", { name: "TSK-1: Discovery" });
    expect(
      screen.getByRole("region", { name: "Done column" }),
    ).toBeInTheDocument();
    expect(
      within(card()).getByText("8 estimated / 2 logged"),
    ).toBeInTheDocument();
    expect(within(card()).getByText("Release gate")).toBeInTheDocument();
    expect(screen.queryByText("Paused work")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Show On Hold/));
    expect(screen.getByText("Paused work")).toBeInTheDocument();
    expect(screen.getByText("Cancelled work")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Priority"), {
      target: { value: "low" },
    });
    expect(
      screen.queryByRole("article", { name: "TSK-1: Discovery" }),
    ).not.toBeInTheDocument();
    expect(card("Evidence")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search tasks"), {
      target: { value: "absent" },
    });
    expect(screen.getByText("No matching tasks")).toBeInTheDocument();
  });
  it("offers keyboard status changes without granting reorder rights", async () => {
    auth.permissions = ["projectedge.task.view", "projectedge.task.status"];
    vi.mocked(projectEdgeService.moveBoardTask).mockResolvedValue({
      ...first,
      status: "on_hold",
    });
    mount();
    const dialog = await request("on_hold");
    expect(
      screen.queryByRole("button", { name: "Move Discovery up" }),
    ).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText(/Delay reason/), {
      target: { value: "Waiting for vendor" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm move" }),
    );
    await waitFor(() =>
      expect(projectEdgeService.moveBoardTask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          status: "on_hold",
          reorder: false,
          delay_reason: "Waiting for vendor",
        }),
      ),
    );
  });
  it("requires explicit partial-progress completion confirmation", async () => {
    vi.mocked(projectEdgeService.boardTasks).mockResolvedValue([
      { ...first, status: "in_progress" },
      second,
    ]);
    vi.mocked(projectEdgeService.moveBoardTask).mockResolvedValue({
      ...first,
      status: "done",
      completion_pct: 100,
    });
    mount();
    const dialog = await request("done");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm move" }),
    );
    await screen.findByText("Confirm completion to continue.");
    expect(projectEdgeService.moveBoardTask).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("checkbox"));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm move" }),
    );
    await waitFor(() =>
      expect(projectEdgeService.moveBoardTask).toHaveBeenCalledWith(
        expect.objectContaining({ status: "done", confirm_completion: true }),
      ),
    );
  });
  it("rolls a rejected pending move back and opens the server-identified blocker", async () => {
    let reject!: (error: unknown) => void;
    vi.mocked(projectEdgeService.moveBoardTask).mockImplementation(
      () =>
        new Promise((_resolve, failure) => {
          reject = failure;
        }),
    );
    const client = mount();
    const dialog = await request("in_progress");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm move" }),
    );
    await waitFor(() =>
      expect(
        client.getQueryData<BoardTask[]>(["projectedge", "board", 7])?.[0]
          .status,
      ).toBe("in_progress"),
    );
    expect(
      within(dialog).getByRole("button", { name: "Saving move…" }),
    ).toBeDisabled();
    reject({
      isAxiosError: true,
      response: {
        data: {
          error: {
            code: "TASK_BLOCKED",
            message: "The task is blocked.",
            context: {
              reasons: ["Waiting for evidence"],
              blocking_chain: [
                {
                  blocker_task_id: 2,
                  blocker_task_code: "TSK-2",
                  message: "Waiting for evidence",
                },
              ],
            },
          },
        },
      },
    });
    await within(dialog).findByRole("link", { name: "Open TSK-2" });
    expect(
      client.getQueryData<BoardTask[]>(["projectedge", "board", 7])?.[0].status,
    ).toBe("todo");
    fireEvent.click(within(dialog).getByRole("link", { name: "Open TSK-2" }));
    await screen.findByRole("heading", { name: "Evidence" });
    expect(projectEdgeService.taskDetail).toHaveBeenCalledWith(
      2,
      expect.any(AbortSignal),
    );
  });
  it("refetches authoritative statuses after confirmation", async () => {
    vi.mocked(projectEdgeService.moveBoardTask).mockImplementation(async () => {
      vi.mocked(projectEdgeService.boardTasks).mockResolvedValue([
        { ...first, status: "in_progress" },
        second,
      ]);
      return { ...first, status: "in_progress" };
    });
    const client = mount();
    const dialog = await request("in_progress");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm move" }),
    );
    await waitFor(() =>
      expect(projectEdgeService.boardTasks).toHaveBeenCalledTimes(2),
    );
    expect(
      client.getQueryData<BoardTask[]>(["projectedge", "board", 7])?.[0].status,
    ).toBe("in_progress");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("sends keyboard reordering to the atomic position endpoint", async () => {
    vi.mocked(projectEdgeService.moveBoardTask).mockResolvedValue({
      ...first,
      kanban_column: 1,
    });
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Move Discovery down" }),
    );
    await waitFor(() =>
      expect(projectEdgeService.moveBoardTask).toHaveBeenCalledWith({
        id: 1,
        status: "todo",
        position: 1,
        reorder: true,
        changeStatus: false,
      }),
    );
  });
  it("routes a dnd-kit column drop through confirmation without saving on drag cancel", async () => {
    mount();
    await screen.findByRole("article", { name: "TSK-1: Discovery" });
    act(() => drag.end({ active: { id: 1 }, over: null } as DragEndEvent));
    expect(projectEdgeService.moveBoardTask).not.toHaveBeenCalled();
    act(() =>
      drag.end({
        active: { id: 1 },
        over: { id: "column-in_progress" },
      } as DragEndEvent),
    );
    await screen.findByRole("dialog");
    expect(projectEdgeService.moveBoardTask).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("uses the destination index for a downward dnd-kit reorder", async () => {
    vi.mocked(projectEdgeService.moveBoardTask).mockResolvedValue({
      ...first,
      kanban_column: 1,
    });
    mount();
    await screen.findByRole("article", { name: "TSK-1: Discovery" });
    act(() => drag.end({ active: { id: 1 }, over: { id: 2 } } as DragEndEvent));
    await waitFor(() =>
      expect(projectEdgeService.moveBoardTask).toHaveBeenCalledWith({
        id: 1,
        status: "todo",
        position: 1,
        reorder: true,
        changeStatus: false,
      }),
    );
  });
  it("allows an actual keyboard-sensor pickup and Escape cancellation", async () => {
    mount();
    const handle = await screen.findByRole("button", {
      name: "Drag Discovery",
    });
    handle.focus();
    fireEvent.keyDown(handle, { code: "Space", key: " " });
    await screen.findByText("Drop in a column to request a move.");
    fireEvent.keyDown(document, { code: "Escape", key: "Escape" });
    await waitFor(() =>
      expect(
        screen.queryByText("Drop in a column to request a move."),
      ).not.toBeInTheDocument(),
    );
    expect(projectEdgeService.moveBoardTask).not.toHaveBeenCalled();
  });
  it("shows a read-only board and supports task deep links", async () => {
    auth.permissions = ["projectedge.task.view"];
    mount(1);
    await screen.findByRole("heading", { name: "Discovery" });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(
      screen.queryByRole("button", { name: "Drag Discovery" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Move TSK-1 to")).not.toBeInTheDocument();
  });
  it("shows truthful loading, retry and empty states", async () => {
    vi.mocked(projectEdgeService.boardTasks)
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValue([]);
    mount();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    await screen.findByText("Board unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("No tasks yet");
  });
});
