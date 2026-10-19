import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProjectTasks } from "./ProjectTasks";
import { projectEdgeService } from "@/services/projectedge";
import { detailFixture } from "./task-detail.fixture";

const auth = vi.hoisted(() => ({
  permissions: ["projectedge.task.view", "projectedge.task.create"],
  user: { id: "1" },
  company: { id: "1" },
}));
vi.mock("@/store/hooks", () => ({
  useAppSelector: (select: (s: unknown) => unknown) => select({ auth }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/services/projectedge", () => ({
  projectEdgeService: {
    boardTasks: vi.fn(),
    project: vi.fn(),
    projectMilestones: vi.fn(),
    taskDetail: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
  },
}));
vi.mock("./TaskDetailDrawer", () => ({
  TaskDetailDrawer: ({ taskId }: { taskId: number }) => (
    <div role="dialog">Task {taskId}</div>
  ),
}));
const task = detailFixture({
  id: 1,
  project_id: 7,
  title: "Discovery",
  task_code: "TSK-1",
  assigned_to: 5,
  start_date: "2026-10-01",
  due_date: "2026-10-10",
});
const project = {
  id: 7,
  start_date: "2026-10-01",
  end_date: "2026-10-31",
  participants: [{ employee_id: 5, employee: { name: "Sam" } }],
};
function mount(initialCreate = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <ProjectTasks projectId={7} initialCreate={initialCreate} />
    </QueryClientProvider>,
  );
  return { ...view, client };
}
async function fillCreate() {
  await screen.findByRole("form", { name: "Create project task" });
  fireEvent.change(screen.getByLabelText("Task title"), {
    target: { value: "UX probe" },
  });
  fireEvent.change(screen.getByLabelText("Assignee"), {
    target: { value: "5" },
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  auth.permissions = ["projectedge.task.view", "projectedge.task.create"];
  auth.user = { id: "1" };
  vi.mocked(projectEdgeService.boardTasks).mockResolvedValue([task]);
  vi.mocked(projectEdgeService.project).mockResolvedValue(project as never);
  vi.mocked(projectEdgeService.projectMilestones).mockResolvedValue([
    { id: 3, title: "Delivery" },
  ]);
  vi.mocked(projectEdgeService.taskDetail).mockResolvedValue({
    ...task,
    capabilities: { ...task.capabilities, edit: true },
  });
  vi.mocked(projectEdgeService.createTask).mockResolvedValue(task);
  vi.mocked(projectEdgeService.updateTask).mockResolvedValue(task);
});
describe("Project task workspace", () => {
  it.each(["Create task", "Edit TSK-1"])(
    "returns keyboard focus to %s when cancelling its inline form",
    async (name) => {
      const user = userEvent.setup();
      mount();
      const opener = await screen.findByRole("button", { name });
      opener.focus();
      await user.keyboard("{Enter}");
      await screen.findByLabelText("Task title");
      const cancel = screen.getByRole("button", { name: "Cancel task form" });
      cancel.focus();
      await user.keyboard("{Enter}");
      await waitFor(() => expect(screen.queryByRole("form")).not.toBeInTheDocument());
      expect(opener).toHaveFocus();
      expect(projectEdgeService.createTask).not.toHaveBeenCalled();
      expect(projectEdgeService.updateTask).not.toHaveBeenCalled();
    },
  );
  it("fails closed without task view and does not fetch", () => {
    auth.permissions = [];
    mount(true);
    expect(screen.getByText("Task access required")).toBeVisible();
    expect(projectEdgeService.boardTasks).not.toHaveBeenCalled();
  });
  it("shows readable rows, filters and opens the existing drawer", async () => {
    mount();
    const button = await screen.findByRole("button", {
      name: "Open task TSK-1: Discovery",
    });
    fireEvent.click(button);
    expect(screen.getByRole("dialog")).toHaveTextContent("Task 1");
    fireEvent.change(screen.getByLabelText("Search project tasks"), {
      target: { value: "missing" },
    });
    expect(screen.getByText("No matching tasks")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Clear task filters" }));
    expect(
      screen.getByRole("button", { name: "Open task TSK-1: Discovery" }),
    ).toBeVisible();
  });
  it("respects read-only grants even on the create link", async () => {
    auth.permissions = ["projectedge.task.view"];
    mount(true);
    await screen.findByText("Discovery", { exact: false });
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit TSK-1" }),
    ).not.toBeInTheDocument();
  });
  it("creates from the Add task query intent using only the existing task contract", async () => {
    mount(true);
    await fillCreate();
    fireEvent.click(screen.getByRole("button", { name: "Save new task" }));
    await waitFor(() =>
      expect(projectEdgeService.createTask).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          title: "UX probe",
          assigned_to: 5,
          due_date: "2026-10-31",
          milestone_id: null,
          parent_task_id: null,
        }),
      ),
    );
    expect(projectEdgeService.createTask).toHaveBeenCalledWith(
      7,
      expect.not.objectContaining({
        status: expect.anything(),
        cost: expect.anything(),
      }),
    );
    expect(await screen.findByText("Task saved: UX probe")).toBeVisible();
  });
  it("retains drafts on API error and focuses the error feedback", async () => {
    vi.mocked(projectEdgeService.createTask).mockRejectedValue(
      new Error("offline"),
    );
    mount(true);
    await fillCreate();
    fireEvent.click(screen.getByRole("button", { name: "Save new task" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveFocus();
    expect(screen.getByLabelText("Task title")).toHaveValue("UX probe");
  });
  it("uses authoritative detail capabilities before exposing edit fields", async () => {
    vi.mocked(projectEdgeService.taskDetail).mockResolvedValue({
      ...task,
      capabilities: { ...task.capabilities, edit: false },
    });
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Edit TSK-1" }));
    expect(await screen.findByText("Task edit unavailable")).toBeVisible();
    expect(screen.queryByLabelText("Task title")).not.toBeInTheDocument();
  });
  it("updates details without bypassing status transitions", async () => {
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Edit TSK-1" }));
    const title = await screen.findByLabelText("Task title");
    expect(title).toHaveValue("Discovery");
    fireEvent.change(title, { target: { value: "Revised discovery" } });
    fireEvent.click(screen.getByRole("button", { name: "Save task changes" }));
    await waitFor(() =>
      expect(projectEdgeService.updateTask).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ title: "Revised discovery", assigned_to: 5 }),
      ),
    );
    expect(
      await screen.findByText("Task saved: Revised discovery"),
    ).toBeVisible();
  });
  it("does not submit when milestone choices fail", async () => {
    vi.mocked(projectEdgeService.projectMilestones).mockRejectedValue(
      new Error("offline"),
    );
    mount(true);
    await screen.findByRole("button", { name: "Retry milestone choices" });
    expect(
      screen.getByRole("button", { name: "Save new task" }),
    ).toBeDisabled();
    expect(projectEdgeService.createTask).not.toHaveBeenCalled();
  });
  it("clears the editor and cached rows on an identity change", async () => {
    const { rerender } = mount(true);
    await fillCreate();
    auth.user = { id: "2" };
    auth.permissions = [];
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <ProjectTasks projectId={7} initialCreate />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Task access required")).toBeVisible();
    expect(screen.queryByLabelText("Task title")).not.toBeInTheDocument();
  });
  it("provides an empty state and retries a failed list", async () => {
    vi.mocked(projectEdgeService.boardTasks)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue([]);
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Retry tasks" }));
    expect(await screen.findByText("No tasks yet")).toBeVisible();
  });
});
