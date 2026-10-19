import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TaskDetailDrawer } from "./TaskDetailDrawer";
import { detailFixture } from "./task-detail.fixture";
import { projectEdgeService } from "@/services/projectedge";

const auth = vi.hoisted(() => ({
  permissions: ["projectedge.task.view"],
  companyId: "company-a",
  userId: "user-a",
}));
vi.mock("@/store/hooks", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({
      auth: {
        permissions: auth.permissions,
        company: { id: auth.companyId, timezone: "Asia/Karachi" },
        user: { id: auth.userId },
      },
    }),
}));
vi.mock("@/services/projectedge", () => ({
  projectEdgeService: {
    taskDetail: vi.fn(),
    boardTasks: vi.fn(),
    moveBoardTask: vi.fn(),
    updateTaskDates: vi.fn(),
    addDependency: vi.fn(),
    removeDependency: vi.fn(),
    addComment: vi.fn(),
    uploadAttachment: vi.fn(),
    downloadAttachment: vi.fn(),
    deleteAttachment: vi.fn(),
  },
}));
const open = vi.fn();
const close = vi.fn();
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <TaskDetailDrawer
        taskId={1}
        projectId={7}
        onOpen={open}
        onClose={close}
      />
    </QueryClientProvider>,
  );
  return client;
}
describe("Task detail workspace", () => {
  it("closes on Escape and restores focus to its opener", async () => {
    function Harness() {
      const [visible, setVisible] = React.useState(false);
      return (
        <>
          <button onClick={() => setVisible(true)}>Open task</button>
          {visible ? (
            <TaskDetailDrawer
              taskId={1}
              projectId={7}
              onClose={() => setVisible(false)}
              onOpen={open}
            />
          ) : null}
        </>
      );
    }
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Open task" });
    trigger.focus();
    fireEvent.click(trigger);
    await screen.findByLabelText("Write a comment");
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  beforeEach(() => {
    vi.resetAllMocks();
    auth.companyId = "company-a";
    auth.userId = "user-a";
    auth.permissions = ["projectedge.task.view"];
    vi.mocked(projectEdgeService.taskDetail).mockResolvedValue(detailFixture());
    vi.mocked(projectEdgeService.boardTasks).mockResolvedValue([
      detailFixture({ id: 2, title: "Evidence" }),
    ]);
  });
  afterEach(cleanup);
  it("does not reuse private detail or dependency-candidate caches after identity changes", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const view = render(
      <QueryClientProvider client={client}>
        <TaskDetailDrawer
          taskId={1}
          projectId={7}
          onOpen={open}
          onClose={close}
        />
      </QueryClientProvider>,
    );
    await screen.findByLabelText("Write a comment");
    auth.companyId = "company-b";
    auth.userId = "user-b";
    vi.mocked(projectEdgeService.taskDetail).mockRejectedValue(
      new Error("not accessible"),
    );
    view.rerender(
      <QueryClientProvider client={client}>
        <TaskDetailDrawer
          taskId={1}
          projectId={7}
          onOpen={open}
          onClose={close}
        />
      </QueryClientProvider>,
    );
    await screen.findByText("Task unavailable");
    expect(screen.queryByLabelText("Write a comment")).not.toBeInTheDocument();
    expect(
      client
        .getQueryCache()
        .getAll()
        .some(
          (query) =>
            query.queryKey.includes("company-b") &&
            query.queryKey.includes("user-b"),
        ),
    ).toBe(true);
    expect(projectEdgeService.taskDetail).toHaveBeenCalledTimes(2);
  });
  it("fails closed without permission and recovers a failed detail request", async () => {
    auth.permissions = [];
    mount();
    expect(screen.getByText("Task access required")).toBeInTheDocument();
    expect(projectEdgeService.taskDetail).not.toHaveBeenCalled();
    cleanup();
    auth.permissions = ["projectedge.task.view"];
    vi.mocked(projectEdgeService.taskDetail).mockRejectedValueOnce(
      new Error("offline"),
    );
    mount();
    await screen.findByText("Task unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry task" }));
    await screen.findByLabelText("Write a comment");
  });
  it("renders real context and follows parent, child and server blocker links", async () => {
    vi.mocked(projectEdgeService.taskDetail).mockResolvedValue(
      detailFixture({
        parent: { id: 4, title: "Parent", task_code: "TSK-4" },
        subtasks: [
          {
            id: 2,
            title: "Evidence",
            task_code: "TSK-2",
            status: "todo",
            completion_pct: 0,
          },
        ],
        block_state: {
          task_id: 1,
          is_blocked: true,
          reasons: ["Evidence required"],
          blocking_chain: [
            {
              blocker_task_id: 3,
              blocker_task_code: "TSK-3",
              message: "Evidence required",
            },
          ],
        },
      }),
    );
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: /Parent: TSK-4/ }),
    );
    expect(open).toHaveBeenCalledWith(4);
    fireEvent.click(screen.getByRole("button", { name: /TSK-2 — Evidence/ }));
    expect(open).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: "Open TSK-3" }));
    expect(open).toHaveBeenCalledWith(3);
    expect(
      screen.getByText("8 estimated / 2 logged hours"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(close).toHaveBeenCalled();
  });
  it("keeps a rejected comment draft and sends scoped mentions and replies", async () => {
    vi.mocked(projectEdgeService.taskDetail).mockResolvedValue(
      detailFixture({
        comment_count: 1,
        comments: [
          {
            id: 11,
            body: "<script>not HTML</script>",
            parent_comment_id: null,
            mentions: [],
            author: { id: 10, name: "Sam" },
            created_at: "2026-10-01T10:00:00Z",
          },
        ],
      }),
    );
    vi.mocked(projectEdgeService.addComment)
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: { error: { message: "Comment failed." } } },
      })
      .mockResolvedValueOnce();
    mount();
    const field = await screen.findByLabelText("Write a comment");
    fireEvent.click(
      screen.getByRole("button", { name: "Reply to comment #11" }),
    );
    fireEvent.change(field, { target: { value: "Please review" } });
    const select = screen.getByLabelText(
      /Mention participants/,
    ) as HTMLSelectElement;
    select.options[0].selected = true;
    fireEvent.change(select);
    fireEvent.click(screen.getByRole("button", { name: "Post comment" }));
    await screen.findByText("Comment failed.");
    expect(field).toHaveValue("Please review");
    expect(document.querySelector("script")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Post comment" }));
    await waitFor(() => expect(field).toHaveValue(""));
    expect(projectEdgeService.addComment).toHaveBeenLastCalledWith(1, {
      body: "Please review",
      parent_comment_id: 11,
      mentions: [10],
    });
  });
  it("uses only server transitions and requires explicit completion confirmation", async () => {
    mount();
    const select = await screen.findByLabelText("New status");
    expect(
      within(select).queryByRole("option", { name: "To do" }),
    ).not.toBeInTheDocument();
    fireEvent.change(select, { target: { value: "done" } });
    fireEvent.click(screen.getByRole("button", { name: "Save status" }));
    await screen.findByText("Confirm setting progress to 100%.");
    expect(projectEdgeService.moveBoardTask).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText(/Confirm completion:/));
    fireEvent.click(screen.getByRole("button", { name: "Save status" }));
    await waitFor(() =>
      expect(projectEdgeService.moveBoardTask).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "done",
          confirm_completion: true,
          reorder: false,
        }),
      ),
    );
  });
  it("retains file selection on upload failure and confirms attachment deletion", async () => {
    vi.mocked(projectEdgeService.taskDetail).mockResolvedValue(
      detailFixture({
        attachments: [
          {
            id: 3,
            file_name: "note.txt",
            file_size_kb: 1,
            mime_type: "text/plain",
            uploaded_by: "Sam",
            created_at: "2026-10-01T10:00:00Z",
          },
        ],
      }),
    );
    vi.mocked(projectEdgeService.uploadAttachment).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { message: "Upload failed." } } },
    });
    mount();
    const file = new File(["hello"], "draft.txt", { type: "text/plain" });
    const input = await screen.findByLabelText(/Upload attachment \(up to/);
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload attachment" }));
    await screen.findByText("Upload failed.");
    expect((input as HTMLInputElement).files?.[0]).toBe(file);
    fireEvent.click(screen.getByRole("button", { name: "Delete note.txt" }));
    expect(projectEdgeService.deleteAttachment).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm delete note.txt" }),
    );
    await waitFor(() =>
      expect(projectEdgeService.deleteAttachment).toHaveBeenCalledWith(1, 3),
    );
  });
  it("obeys server read-only capabilities even when task view is granted", async () => {
    vi.mocked(projectEdgeService.taskDetail).mockResolvedValue(
      detailFixture({
        allowed_transitions: [],
        capabilities: {
          edit: false,
          comment: false,
          attachments: false,
          dependencies: false,
          activity: false,
        },
      }),
    );
    mount();
    await screen.findByText("Comments are read-only for your role.");
    expect(
      screen.queryByRole("button", { name: "Save dates" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Post comment" }),
    ).not.toBeInTheDocument();
    expect(projectEdgeService.boardTasks).not.toHaveBeenCalled();
  });
});
