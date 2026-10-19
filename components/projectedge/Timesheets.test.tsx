import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Timesheets } from "./Timesheets";
import { projectEdgeService } from "@/services/projectedge";
import type { TimeEntry } from "@/types/projectedge-time";

const auth = vi.hoisted(() => ({
  permissions: ["projectedge.time.log", "projectedge.task.view"],
  company: { timezone: "Asia/Karachi" },
}));
vi.mock("@/store/hooks", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector({ auth }),
}));
vi.mock("@/services/projectedge", () => ({
  projectEdgeService: {
    timeEntries: vi.fn(),
    myTasks: vi.fn(),
    saveTimeEntry: vi.fn(),
    timeEntryAction: vi.fn(),
  },
}));
const task = {
  id: 2,
  task_code: "TS-2",
  title: "Build reports",
  project_id: 7,
  project: { id: 7, project_code: "PE-7", title: "Launch" },
  status: "todo",
  priority: "medium" as const,
  completion_pct: 0,
  is_blocked: false,
  due_date: null,
};
const log: TimeEntry = {
  id: 9,
  task_id: 2,
  project_id: 7,
  employee_id: 3,
  task,
  project: task.project,
  employee: { id: 3, name: "Ada" },
  log_date: "2026-10-01",
  hours_logged: 3,
  description: "Reports",
  billable: false,
  status: "draft",
  capabilities: {
    edit: true,
    submit: true,
    delete: true,
    approve: false,
    reject: false,
  },
  rejection_reason: null,
  approval_history: [],
};
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <Timesheets />
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByLabelText(/Week containing/), {
    target: { value: "2026-10-01" },
  });
}
describe("weekly timesheets", () => {
  it("submits saved drafts, confirms deletion, and prevents dismissal during a pending write", async () => {
    mount();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "TS-2, 2026-10-01, 3 hours, draft",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Submit for approval" }),
    );
    await waitFor(() =>
      expect(projectEdgeService.timeEntryAction).toHaveBeenCalledWith(
        9,
        "submit",
        "",
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "TS-2, 2026-10-01, 3 hours, draft" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete draft" }));
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
    let release!: () => void;
    vi.mocked(projectEdgeService.timeEntryAction).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm deletion" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Close" })).toBeDisabled(),
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    release();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(projectEdgeService.timeEntryAction).toHaveBeenLastCalledWith(
      9,
      "delete",
      "",
    );
  });

  it("supports approval and retry without exposing edit actions", async () => {
    auth.permissions = ["projectedge.time.approve"];
    // Both the initial current week and the fixture week must stay offline
    // until the test explicitly restores the service for Retry.
    vi.mocked(projectEdgeService.timeEntries).mockRejectedValue(
      new Error("offline"),
    );
    mount();
    expect(
      await screen.findByText("Time entries could not load"),
    ).toBeInTheDocument();
    vi.mocked(projectEdgeService.timeEntries).mockResolvedValue([
      {
        ...log,
        status: "submitted",
        capabilities: {
          edit: false,
          submit: false,
          delete: false,
          approve: true,
          reject: true,
        },
      },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    fireEvent.click(
      await screen.findByRole("button", {
        name: "TS-2, 2026-10-01, 3 hours, submitted",
      }),
    );
    expect(
      screen.queryByRole("button", { name: "Save draft" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Approve entry" }));
    await waitFor(() =>
      expect(projectEdgeService.timeEntryAction).toHaveBeenCalledWith(
        9,
        "approve",
        "",
      ),
    );
  });

  beforeEach(() => {
    vi.resetAllMocks();
    auth.permissions = ["projectedge.time.log", "projectedge.task.view"];
    vi.mocked(projectEdgeService.timeEntries).mockResolvedValue([
      structuredClone(log),
    ]);
    vi.mocked(projectEdgeService.myTasks).mockResolvedValue({
      items: [task],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 100,
        total: 1,
        from: 1,
        to: 1,
      },
    });
    vi.mocked(projectEdgeService.saveTimeEntry).mockResolvedValue(log);
    vi.mocked(projectEdgeService.timeEntryAction).mockResolvedValue(undefined);
  });
  afterEach(cleanup);
  it("fails closed without time permissions", () => {
    auth.permissions = [];
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Timesheets />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Timesheet access required")).toBeInTheDocument();
    expect(projectEdgeService.timeEntries).not.toHaveBeenCalled();
  });
  it("renders seven days and submits only an unchanged draft", async () => {
    mount();
    const cell = await screen.findByRole("button", {
      name: "TS-2, 2026-10-01, 3 hours, draft",
    });
    fireEvent.click(cell);
    fireEvent.change(screen.getByLabelText("Hours"), {
      target: { value: "4" },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Submit for approval" }),
      ).toBeDisabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(projectEdgeService.saveTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          hours_logged: 4,
          task_id: 2,
          log_date: "2026-10-01",
        }),
        9,
      ),
    );
  });
  it("checks the aggregate daily limit before sending a new entry", async () => {
    vi.mocked(projectEdgeService.timeEntries).mockResolvedValue([
      {
        ...log,
        task_id: 8,
        task: { ...task, id: 8, task_code: "TS-8" },
        hours_logged: 23,
      },
    ]);
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "TS-2, 2026-10-01, add time" }),
    );
    fireEvent.change(screen.getByLabelText("Hours"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(
      await screen.findByText(/Daily total would be 25.00/),
    ).toBeInTheDocument();
    expect(projectEdgeService.saveTimeEntry).not.toHaveBeenCalled();
  });
  it("shows rejected reasons and history and preserves the draft on a failed save", async () => {
    vi.mocked(projectEdgeService.timeEntries).mockResolvedValue([
      {
        ...log,
        status: "rejected",
        rejection_reason: "Please correct",
        capabilities: { ...log.capabilities, submit: false, delete: false },
        approval_history: [
          {
            id: 1,
            event: "time_rejected",
            status: "rejected",
            actor: "Manager",
            at: "2026-10-01T12:00:00Z",
            reason: "Please correct",
          },
        ],
      },
    ]);
    vi.mocked(projectEdgeService.saveTimeEntry).mockRejectedValue(
      new Error("failure"),
    );
    mount();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "TS-2, 2026-10-01, 3 hours, rejected",
      }),
    );
    expect(
      screen.getByRole("region", { name: "Approval history" }),
    ).toHaveTextContent("Manager");
    expect(
      screen.queryByRole("button", { name: "Submit for approval" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Corrected description" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "request failed",
    );
    expect(screen.getByLabelText("Description")).toHaveValue(
      "Corrected description",
    );
  });
  it("keeps submitted entries read-only and requires a reason to reject", async () => {
    auth.permissions = ["projectedge.time.approve"];
    vi.mocked(projectEdgeService.timeEntries).mockResolvedValue([
      {
        ...log,
        status: "submitted",
        capabilities: {
          edit: false,
          delete: false,
          submit: false,
          approve: true,
          reject: true,
        },
      },
    ]);
    mount();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "TS-2, 2026-10-01, 3 hours, submitted",
      }),
    );
    expect(screen.getByLabelText("Hours")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Reject entry" }));
    expect(screen.getByRole("alert")).toHaveTextContent("rejection reason");
    expect(projectEdgeService.timeEntryAction).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Rejection reason"), {
      target: { value: "Wrong date" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reject entry" }));
    await waitFor(() =>
      expect(projectEdgeService.timeEntryAction).toHaveBeenCalledWith(
        9,
        "reject",
        "Wrong date",
      ),
    );
  });
});
