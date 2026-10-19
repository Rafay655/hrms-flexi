import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MyTasks } from "./MyTasks";
import { personalTaskFixture } from "./my-tasks.fixture";
import { projectEdgeService } from "@/services/projectedge";
const auth = vi.hoisted(() => ({
  permissions: [
    "projectedge.task.view",
    "projectedge.project.view",
    "projectedge.milestone.view",
  ],
  company: { id: "company-a", timezone: "Asia/Karachi" },
  user: { id: "user-a" },
}));
vi.mock("@/store/hooks", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector({ auth }),
}));
vi.mock("@/services/projectedge", () => ({
  projectEdgeService: { allMyTasks: vi.fn() },
}));
vi.mock("./TaskDetailDrawer", () => ({
  TaskDetailDrawer: ({
    taskId,
    projectId,
    onClose,
    onOpen,
  }: {
    taskId: number;
    projectId: number;
    onClose: () => void;
    onOpen: (id: number) => void;
  }) => (
    <div role="dialog" aria-label="Task workspace">
      Task {taskId}, project {projectId}
      <button onClick={onClose}>Close task</button>
      <button onClick={() => onOpen(10)}>Open child</button>
    </div>
  ),
}));
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <MyTasks />
      </QueryClientProvider>,
    ),
  };
}
describe("My Tasks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.company.id = "company-a";
    auth.user.id = "user-a";
    auth.permissions = [
      "projectedge.task.view",
      "projectedge.project.view",
      "projectedge.milestone.view",
    ];
    vi.mocked(projectEdgeService.allMyTasks).mockResolvedValue(
      structuredClone(personalTaskFixture),
    );
  });
  afterEach(cleanup);
  it("does not query without task-view permission", () => {
    auth.permissions = [];
    mount();
    expect(screen.getByText("Task access required")).toBeInTheDocument();
    expect(projectEdgeService.allMyTasks).not.toHaveBeenCalled();
  });
  it("shows cross-project and milestone context, priority and a textual blocked state", async () => {
    mount();
    const list = await screen.findByRole("list", {
      name: "Assigned task list",
    });
    expect(within(list).getAllByRole("article")).toHaveLength(3);
    expect(within(list).getByText("Blocked")).toBeInTheDocument();
    expect(within(list).getByRole("link", { name: "Launch" })).toHaveAttribute(
      "href",
      "/projectedge/projects/7/milestones?milestone=3",
    );
    expect(
      within(list).getByRole("link", { name: "PRJ-007 · People rollout" }),
    ).toHaveAttribute("href", "/projectedge/projects/7");
    expect(within(list).getByText("Priority: critical")).toBeInTheDocument();
    expect(screen.getByText(/3 matching of 3 assigned/)).toBeInTheDocument();
  });
  it("applies global sorting and combined filters, including On Hold", async () => {
    mount();
    await screen.findByRole("list", { name: "Assigned task list" });
    fireEvent.change(screen.getByLabelText("Sort tasks"), {
      target: { value: "priority" },
    });
    expect(
      within(
        screen.getByRole("list", { name: "Assigned task list" }),
      ).getAllByRole("article")[0],
    ).toHaveTextContent("TSK-002");
    fireEvent.change(screen.getByLabelText("Task status"), {
      target: { value: "on_hold" },
    });
    expect(
      screen.getByRole("list", { name: "Assigned task list" }),
    ).toHaveTextContent("Capacity review");
    fireEvent.click(screen.getByLabelText("Blocked only"));
    expect(screen.getByText("No matching tasks")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    fireEvent.change(screen.getByLabelText("Project"), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByLabelText("Search assigned work"), {
      target: { value: "Launch" },
    });
    expect(
      within(
        screen.getByRole("list", { name: "Assigned task list" }),
      ).getAllByRole("article"),
    ).toHaveLength(1);
  });
  it("groups six board statuses and opens the shared drawer with the actual project", async () => {
    mount();
    await screen.findByRole("list", { name: "Assigned task list" });
    fireEvent.click(screen.getByRole("button", { name: "Board view" }));
    const board = screen.getByLabelText("Assigned task board");
    expect(within(board).getByLabelText("On Hold tasks")).toHaveTextContent(
      "Capacity review",
    );
    expect(within(board).getByLabelText("Cancelled tasks")).toHaveTextContent(
      "No tasks",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Open task TSK-002: Publish policy" }),
    );
    expect(screen.getByRole("dialog")).toHaveTextContent("Task 2, project 8");
    fireEvent.click(screen.getByRole("button", { name: "Open child" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Task 10, project 8");
    fireEvent.click(screen.getByRole("button", { name: "Close task" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("bounds rendered cards but sorts and searches across the entire loaded queue", async () => {
    const many = Array.from({ length: 61 }, (_, index) => ({
      ...personalTaskFixture[0],
      id: index + 1,
      title: `Work ${index + 1}`,
      task_code: `TASK-${index + 1}`,
      priority: index === 60 ? ("critical" as const) : ("low" as const),
    }));
    vi.mocked(projectEdgeService.allMyTasks).mockResolvedValue(many);
    mount();
    const list = await screen.findByRole("list", {
      name: "Assigned task list",
    });
    expect(within(list).getAllByRole("article")).toHaveLength(50);
    fireEvent.click(screen.getByRole("button", { name: "Next tasks" }));
    expect(
      within(
        screen.getByRole("list", { name: "Assigned task list" }),
      ).getAllByRole("article"),
    ).toHaveLength(11);
    fireEvent.change(screen.getByLabelText("Sort tasks"), {
      target: { value: "priority" },
    });
    expect(
      within(
        screen.getByRole("list", { name: "Assigned task list" }),
      ).getAllByRole("article")[0],
    ).toHaveTextContent("TASK-61");
    fireEvent.change(screen.getByLabelText("Search assigned work"), {
      target: { value: "TASK-61" },
    });
    expect(
      within(
        screen.getByRole("list", { name: "Assigned task list" }),
      ).getAllByRole("article"),
    ).toHaveLength(1);
  });
  it("fails closed on refresh errors and supports retry/empty states", async () => {
    mount();
    await screen.findByRole("list", { name: "Assigned task list" });
    vi.mocked(projectEdgeService.allMyTasks).mockRejectedValueOnce(
      new Error("page failed"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Refresh tasks" }));
    await screen.findByText("Assigned tasks unavailable");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "PRJ-007 · People rollout" }),
    ).not.toBeInTheDocument();
    vi.mocked(projectEdgeService.allMyTasks).mockResolvedValue([]);
    fireEvent.click(screen.getByRole("button", { name: "Retry tasks" }));
    expect(await screen.findByText("No assigned tasks")).toBeInTheDocument();
  });
  it("clears selected tasks and old queue data on company/user changes", async () => {
    const view = mount();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Open task TSK-001: Review handbook",
      }),
    );
    auth.company.id = "company-b";
    auth.user.id = "user-b";
    vi.mocked(projectEdgeService.allMyTasks).mockResolvedValue([]);
    view.rerender(
      <QueryClientProvider client={view.client}>
        <MyTasks />
      </QueryClientProvider>,
    );
    await screen.findByText("No assigned tasks");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(/Review handbook/)).not.toBeInTheDocument();
    expect(
      view.client
        .getQueryCache()
        .getAll()
        .some((query) => query.queryKey.includes("company-b-user-b")),
    ).toBe(true);
  });
  it("does not expose monetary payload extras or unauthorized context links", async () => {
    auth.permissions = ["projectedge.task.view"];
    vi.mocked(projectEdgeService.allMyTasks).mockResolvedValue([
      {
        ...personalTaskFixture[0],
        ...{ cost_amount: "SECRET-COST", hourly_rate: "SECRET-RATE" },
      },
    ]);
    mount();
    await screen.findByRole("article");
    expect(screen.queryByText(/SECRET/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText(/Launch/)).toBeInTheDocument();
  });
});
