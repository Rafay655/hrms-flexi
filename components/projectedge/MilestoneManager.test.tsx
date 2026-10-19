import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MilestoneManager } from "./MilestoneManager";
import { MilestoneStrip } from "./MilestoneStrip";
import { projectEdgeService } from "@/services/projectedge";
import type {
  MilestoneReport,
  ProjectMilestone,
} from "@/types/projectedge-milestones";

const auth = vi.hoisted(() => ({ permissions: ["projectedge.project.view"] }));
vi.mock("@/store/hooks", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector({ auth }),
}));
vi.mock("@/services/projectedge", () => ({
  projectEdgeService: {
    milestoneReport: vi.fn(),
    createMilestone: vi.fn(),
    updateMilestone: vi.fn(),
    achieveMilestone: vi.fn(),
    deferMilestone: vi.fn(),
    deleteMilestone: vi.fn(),
  },
}));
const gate: ProjectMilestone = {
  id: 2,
  project_id: 7,
  title: "Release gate",
  description: "Review work",
  due_date: "2026-10-08",
  status: "pending",
  is_gate: true,
  sort_order: 0,
  health: "at_risk",
  progress: {
    total_tasks: 4,
    completed_tasks: 2,
    done_tasks: 1,
    cancelled_tasks: 1,
    progress_pct: 50,
  },
  achieved_at: null,
  achieved_by: null,
};
const report: MilestoneReport = {
  summary: { on_track: 0, at_risk: 1, missed: 0, achieved: 0 },
  milestones: [gate],
  capabilities: { manage: true },
};
function mount(
  element = <MilestoneManager projectId={7} initialMilestoneId={2} />,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // The board's legacy label cache must not be mistaken for a health report.
  client.setQueryData(
    ["projectedge", "milestones", 7],
    [{ id: 2, title: "Release gate" }],
  );
  render(<QueryClientProvider client={client}>{element}</QueryClientProvider>);
  return client;
}
describe("Milestone delivery UI", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.permissions = ["projectedge.project.view"];
    vi.mocked(projectEdgeService.milestoneReport).mockResolvedValue(
      structuredClone(report),
    );
  });
  afterEach(cleanup);
  it("fails closed and respects server role capability", async () => {
    auth.permissions = [];
    mount();
    expect(screen.getByText("Milestone access required")).toBeInTheDocument();
    expect(projectEdgeService.milestoneReport).not.toHaveBeenCalled();
    cleanup();
    auth.permissions = [
      "projectedge.project.view",
      "projectedge.milestone.manage",
    ];
    vi.mocked(projectEdgeService.milestoneReport).mockResolvedValue({
      ...report,
      capabilities: { manage: false },
    });
    mount();
    await screen.findByText("Read-only milestone access.");
    expect(
      screen.queryByRole("button", { name: "Create milestone" }),
    ).not.toBeInTheDocument();
  });
  it("shows authoritative health, terminal progress, gates and filtering", async () => {
    mount();
    const progress = await screen.findByRole("progressbar", {
      name: "Release gate task progress",
    });
    expect(progress).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("1 done · 1 cancelled")).toBeInTheDocument();
    expect(screen.getByText(/Gate not achieved:/)).toBeInTheDocument();
    expect(document.getElementById("milestone-2")).toHaveClass("ring-2");
    fireEvent.change(screen.getByLabelText("Filter milestone health"), {
      target: { value: "missed" },
    });
    expect(
      screen.getByText("No milestones match this health filter."),
    ).toBeInTheDocument();
  });
  it("retains a rejected edit draft and uses zero-based server positions", async () => {
    vi.mocked(projectEdgeService.updateMilestone).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { message: "Update rejected." } } },
    });
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit Release gate" }),
    );
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Approval gate" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save milestone" }));
    await screen.findByText("Update rejected.");
    expect(screen.getByLabelText("Title")).toHaveValue("Approval gate");
    expect(projectEdgeService.updateMilestone).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        title: "Approval gate",
        sort_order: 0,
        is_gate: true,
      }),
    );
  });
  it("creates validated checkpoints and confirms deletion before unlinking", async () => {
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Create milestone" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save milestone" }));
    await screen.findByText("A title is required.");
    expect(projectEdgeService.createMilestone).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Delivery" },
    });
    fireEvent.change(screen.getByLabelText("Due date"), {
      target: { value: "2026-10-12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save milestone" }));
    await waitFor(() =>
      expect(projectEdgeService.createMilestone).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ title: "Delivery", sort_order: 1 }),
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Delete Release gate" }),
    );
    expect(projectEdgeService.deleteMilestone).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    await waitFor(() =>
      expect(projectEdgeService.deleteMilestone).toHaveBeenCalledWith(2),
    );
  });
  it("requires a later defer date and preserves the gate on server-confirmed refetch", async () => {
    const client = mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Defer Release gate" }),
    );
    fireEvent.change(screen.getByLabelText("New due date"), {
      target: { value: gate.due_date },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm defer" }));
    await screen.findByText("Choose a date after the current due date.");
    expect(projectEdgeService.deferMilestone).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("New due date"), {
      target: { value: "2026-10-10" },
    });
    fireEvent.change(screen.getByLabelText("Deferral reason (optional)"), {
      target: { value: "Review pending" },
    });
    vi.mocked(projectEdgeService.deferMilestone).mockImplementation(
      async () => {
        vi.mocked(projectEdgeService.milestoneReport).mockResolvedValue({
          ...report,
          milestones: [{ ...gate, status: "deferred", due_date: "2026-10-10" }],
        });
        return { ...gate, status: "deferred" };
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm defer" }));
    await waitFor(() =>
      expect(
        client.getQueryData<MilestoneReport>([
          "projectedge",
          "milestone-report",
          7,
        ])?.milestones[0].status,
      ).toBe("deferred"),
    );
    expect(projectEdgeService.deferMilestone).toHaveBeenCalledWith(2, {
      due_date: "2026-10-10",
      reason: "Review pending",
    });
    expect(screen.getByText(/Gate not achieved:/)).toBeInTheDocument();
  });
  it("requires explicit achieve confirmation and prevents duplicate requests while pending", async () => {
    let resolve!: (value: ProjectMilestone) => void;
    vi.mocked(projectEdgeService.achieveMilestone).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const client = mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Achieve Release gate" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText(/Confirm achievement at 50%/),
    ).toBeInTheDocument();
    expect(projectEdgeService.achieveMilestone).not.toHaveBeenCalled();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm achieve" }),
    );
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "Confirm achieve" }),
      ).toBeDisabled(),
    );
    expect(
      client.getQueryData<MilestoneReport>([
        "projectedge",
        "milestone-report",
        7,
      ])?.milestones[0].status,
    ).toBe("pending");
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    resolve({ ...gate, status: "achieved" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(projectEdgeService.achieveMilestone).toHaveBeenCalledTimes(1);
  });
  it("recovers load errors and labels an empty project truthfully", async () => {
    vi.mocked(projectEdgeService.milestoneReport)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({
        ...report,
        milestones: [],
        summary: { on_track: 0, at_risk: 0, missed: 0, achieved: 0 },
      });
    mount();
    await screen.findByText("Milestones unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry milestones" }));
    await screen.findByText("No milestones yet");
  });
  it("overview strip links to milestone IDs and exposes all four server health states", async () => {
    vi.mocked(projectEdgeService.milestoneReport).mockResolvedValue({
      ...report,
      summary: { on_track: 1, at_risk: 1, missed: 1, achieved: 1 },
      milestones: (["on_track", "at_risk", "missed", "achieved"] as const).map(
        (health, index) => ({
          ...gate,
          id: index + 1,
          title: `Checkpoint ${index + 1}`,
          health,
          status: health === "achieved" ? "achieved" : "pending",
          achieved_at: health === "achieved" ? "2026-10-01T10:00:00Z" : null,
          achieved_by: health === "achieved" ? 10 : null,
          sort_order: index,
        }),
      ),
    });
    mount(<MilestoneStrip projectId={7} />);
    await screen.findByRole("region", { name: "Milestone strip" });
    expect(
      screen.getByRole("link", { name: "1. Checkpoint 1" }),
    ).toHaveAttribute("href", "/projectedge/projects/7/milestones?milestone=1");
    expect(screen.getByText("On track")).toBeInTheDocument();
    expect(screen.getByText("Missed")).toBeInTheDocument();
    expect(screen.getByText("Gate released")).toBeInTheDocument();
  });
  it("retains rejected deferral fields and restores opener focus on cancellation", async () => {
    vi.mocked(projectEdgeService.deferMilestone).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { message: "Deferral rejected." } } },
    });
    mount();
    const trigger = await screen.findByRole("button", {
      name: "Defer Release gate",
    });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.change(screen.getByLabelText("New due date"), {
      target: { value: "2026-10-12" },
    });
    fireEvent.change(screen.getByLabelText("Deferral reason (optional)"), {
      target: { value: "Awaiting review" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm defer" }));
    await screen.findByText("Deferral rejected.");
    expect(screen.getByLabelText("New due date")).toHaveValue("2026-10-12");
    expect(screen.getByLabelText("Deferral reason (optional)")).toHaveValue(
      "Awaiting review",
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
