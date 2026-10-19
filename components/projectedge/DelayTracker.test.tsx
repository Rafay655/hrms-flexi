import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DelayTracker } from "./DelayTracker";
import { projectEdgeService } from "@/services/projectedge";
import { delayFixture, delayTaskFixture, delayPage } from "./delay.fixture";

const auth = vi.hoisted(() => ({
  permissions: [
    "projectedge.delay.submit",
    "projectedge.delay.approve",
    "projectedge.task.view",
    "projectedge.project.view",
  ],
  company: { id: "company-a" },
  user: { id: "user-a" },
}));
vi.mock("@/store/hooks", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector({ auth }),
}));
vi.mock("@/services/projectedge", () => ({
  projectEdgeService: {
    pendingDelays: vi.fn(),
    delayTasks: vi.fn(),
    submitDelay: vi.fn(),
    reviewDelay: vi.fn(),
  },
}));
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <DelayTracker />
      </QueryClientProvider>,
    ),
  };
}
async function openReview() {
  fireEvent.click(
    await screen.findByRole("button", { name: "Review request" }),
  );
  return screen.getByRole("dialog");
}
async function openSubmit() {
  fireEvent.click(screen.getByRole("button", { name: "Submit delay" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Choose TSK-005" }),
  );
  return await screen.findByRole("dialog", { name: "Submit delay request" });
}
describe("delay tracker", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.company.id = "company-a";
    auth.user.id = "user-a";
    auth.permissions = [
      "projectedge.delay.submit",
      "projectedge.delay.approve",
      "projectedge.task.view",
      "projectedge.project.view",
    ];
    vi.mocked(projectEdgeService.pendingDelays).mockResolvedValue(
      delayPage([structuredClone(delayFixture)]),
    );
    vi.mocked(projectEdgeService.delayTasks).mockResolvedValue(
      delayPage([structuredClone(delayTaskFixture)]),
    );
    vi.mocked(projectEdgeService.submitDelay).mockResolvedValue(
      structuredClone(delayFixture),
    );
    vi.mocked(projectEdgeService.reviewDelay).mockResolvedValue({
      ...structuredClone(delayFixture),
      approval_status: "approved",
      current_due_date: delayFixture.new_due_date,
      reviewer_note: "Agreed",
    });
  });
  afterEach(cleanup);
  it("fails closed without delay permission", () => {
    auth.permissions = ["projectedge.task.view"];
    mount();
    expect(screen.getByText("Delay access required")).toBeInTheDocument();
    expect(projectEdgeService.pendingDelays).not.toHaveBeenCalled();
  });
  it("shows dates, actors and full project impact without inventing schedule results", async () => {
    mount();
    const dialog = await openReview();
    expect(
      within(dialog).getByText(/Original due: 2026-10-09/),
    ).toHaveTextContent("Current due: 2026-10-09 · Requested due: 2026-10-12");
    expect(within(dialog).getByText(/Assignee: Ayesha/)).toBeInTheDocument();
    expect(
      within(dialog).getByLabelText("Project impact context"),
    ).toHaveTextContent("Requested task date is after this milestone");
    expect(
      within(dialog).getByText(
        /No schedule or critical-path impact is inferred/,
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Open task board" }),
    ).toHaveAttribute("href", "/projectedge/projects/7/board?task=5");
    expect(
      within(dialog).getByText(/Waiting for the integration credentials/),
    ).toBeInTheDocument();
    expect(projectEdgeService.pendingDelays).toHaveBeenCalledWith(
      false,
      1,
      expect.any(AbortSignal),
    );
  });
  it("submit-only users read their own queue and cannot review", async () => {
    auth.permissions = ["projectedge.delay.submit"];
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "View request" }),
    );
    expect(projectEdgeService.pendingDelays).toHaveBeenCalledWith(
      true,
      1,
      expect.any(AbortSignal),
    );
    expect(
      screen.queryByRole("button", { name: "Approve request" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Submit delay" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Task and project view access/),
    ).toBeInTheDocument();
  });
  it("switches reviewer scopes and paginates without showing previous-page requests", async () => {
    vi.mocked(projectEdgeService.pendingDelays).mockResolvedValue(
      delayPage([structuredClone(delayFixture)], 1, 2),
    );
    mount();
    await screen.findByRole("button", { name: "Review request" });
    fireEvent.click(screen.getByRole("button", { name: "Next requests" }));
    await waitFor(() =>
      expect(projectEdgeService.pendingDelays).toHaveBeenCalledWith(
        false,
        2,
        expect.any(AbortSignal),
      ),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "My pending requests" }),
    );
    await waitFor(() =>
      expect(projectEdgeService.pendingDelays).toHaveBeenCalledWith(
        true,
        1,
        expect.any(AbortSignal),
      ),
    );
  });
  it("requires explicit confirmation before approval and refetches after server success", async () => {
    const { client } = mount();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    await openReview();
    fireEvent.change(screen.getByLabelText("Reviewer note (optional)"), {
      target: { value: "Agreed" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Approve request" }));
    expect(projectEdgeService.reviewDelay).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm approval" }));
    await waitFor(() =>
      expect(projectEdgeService.reviewDelay).toHaveBeenCalledWith(
        11,
        "approve",
        "Agreed",
      ),
    );
    expect(
      await screen.findByLabelText("Last confirmed delay action"),
    ).toHaveTextContent("Reviewer note: Agreed");
    expect(invalidate).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("stale requests prohibit approval but retain rejection and failed notes", async () => {
    vi.mocked(projectEdgeService.pendingDelays).mockResolvedValue(
      delayPage([
        {
          ...structuredClone(delayFixture),
          stale: true,
          current_due_date: "2026-10-10",
          approval_blocked_reason:
            "The task due date changed after submission.",
          capabilities: { approve: false, reject: true },
        },
      ]),
    );
    vi.mocked(projectEdgeService.reviewDelay).mockRejectedValue(
      new Error("offline"),
    );
    mount();
    await openReview();
    expect(
      screen.getByRole("button", { name: "Approve request" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Reviewer note (optional)"), {
      target: { value: "Resubmit please" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reject request" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm rejection" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Reviewer note (optional)")).toHaveValue(
      "Resubmit please",
    );
    expect(projectEdgeService.reviewDelay).toHaveBeenCalledWith(
      11,
      "reject",
      "Resubmit please",
    );
  });
  it("keeps review pending non-dismissible and restores opener focus on cancel", async () => {
    let release!: () => void;
    vi.mocked(projectEdgeService.reviewDelay).mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({ ...delayFixture, approval_status: "rejected" });
        }),
    );
    mount();
    const opener = await screen.findByRole("button", {
      name: "Review request",
    });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole("button", { name: "Close request" }));
    await waitFor(() => expect(opener).toHaveFocus());
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole("button", { name: "Reject request" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm rejection" }));
    expect(
      screen.getByRole("button", { name: "Close request" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Reviewer note (optional)")).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();
    release();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
  it("selects permitted tasks, previews dates, validates days and retains failed submission", async () => {
    vi.mocked(projectEdgeService.submitDelay).mockRejectedValue(
      new Error("offline"),
    );
    mount();
    await openSubmit();
    fireEvent.change(screen.getByLabelText("Delay days"), {
      target: { value: "1.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm submission" }));
    await screen.findByRole("alert");
    expect(projectEdgeService.submitDelay).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Delay days"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: " Vendor waiting " },
    });
    expect(screen.getByText("2026-10-12")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm submission" }));
    await waitFor(() =>
      expect(projectEdgeService.submitDelay).toHaveBeenCalledWith(5, {
        delay_days: 3,
        reason: "Vendor waiting",
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "draft has been retained",
    );
    expect(screen.getByLabelText("Reason")).toHaveValue(" Vendor waiting ");
  });
  it("keeps submission pending non-dismissible and restores focus after confirmation", async () => {
    let release!: () => void;
    vi.mocked(projectEdgeService.submitDelay).mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve(delayFixture);
        }),
    );
    mount();
    await openSubmit();
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Waiting for access" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm submission" }));
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByLabelText("Reason")).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    release();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Submit delay" }),
      ).toHaveFocus(),
    );
    expect(
      screen.getByLabelText("Last confirmed delay action"),
    ).toHaveTextContent("Request pending");
  });
  it("task search and next pages preserve server capability denial", async () => {
    vi.mocked(projectEdgeService.delayTasks).mockResolvedValue(
      delayPage(
        [{ ...delayTaskFixture, delay_submission: { allowed: false } }],
        1,
        2,
      ),
    );
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Submit delay" }));
    expect(
      await screen.findByRole("button", { name: "Choose TSK-005" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next tasks" }));
    await waitFor(() =>
      expect(projectEdgeService.delayTasks).toHaveBeenCalledWith(
        "",
        2,
        expect.any(AbortSignal),
      ),
    );
    fireEvent.change(screen.getByLabelText("Task search"), {
      target: { value: "Rollout" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search tasks" }));
    await waitFor(() =>
      expect(projectEdgeService.delayTasks).toHaveBeenCalledWith(
        "Rollout",
        1,
        expect.any(AbortSignal),
      ),
    );
  });
  it("hides cached requests on failed refresh and supports retry and empty state", async () => {
    mount();
    await screen.findByRole("button", { name: "Review request" });
    vi.mocked(projectEdgeService.pendingDelays).mockRejectedValueOnce(
      new Error("offline"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Refresh requests" }));
    await screen.findByText("Pending requests unavailable");
    expect(
      screen.queryByRole("button", { name: "Review request" }),
    ).not.toBeInTheDocument();
    vi.mocked(projectEdgeService.pendingDelays).mockResolvedValue(
      delayPage([]),
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry requests" }));
    expect(await screen.findByText("No pending requests")).toBeInTheDocument();
  });
  it("clears private review drafts on company or identity change", async () => {
    const view = mount();
    await openReview();
    fireEvent.change(screen.getByLabelText("Reviewer note (optional)"), {
      target: { value: "Private note" },
    });
    auth.company.id = "company-b";
    auth.user.id = "user-b";
    view.rerender(
      <QueryClientProvider client={view.client}>
        <DelayTracker />
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        view.client
          .getQueryCache()
          .getAll()
          .some((query) => query.queryKey.includes("company-b-user-b")),
      ).toBe(true),
    );
  });
});
