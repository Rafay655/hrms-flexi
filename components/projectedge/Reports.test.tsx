import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Reports } from "./Reports";
import { projectEdgeService } from "@/services/projectedge";
import type { ProjectEdgeReport } from "@/types/projectedge-reports";
const auth = vi.hoisted(() => ({
  permissions: ["projectedge.report.view", "projectedge.project.view"],
  company: { id: "a" },
  user: { id: "user-a" },
}));
vi.mock("@/store/hooks", () => ({
  useAppSelector: (selector: (s: unknown) => unknown) => selector({ auth }),
}));
vi.mock("@/services/projectedge", () => ({
  projectEdgeService: { report: vi.fn(), projects: vi.fn() },
}));
const response: ProjectEdgeReport = {
  report: "project-status",
  columns: [
    { key: "project", label: "Project" },
    { key: "value", label: "Completion (%)" },
  ],
  rows: [{ project: "Private launch", value: 50 }],
  summary: { active: 2 },
  notes: ["Current snapshot only."],
  generated_at: "2026-10-01T10:00:00Z",
  as_of: "2026-10-01",
  timezone: "Asia/Karachi",
  currency: null,
  filters: {},
  meta: { current_page: 1, last_page: 2, per_page: 25, total: 30 },
};
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <Reports />
      </QueryClientProvider>,
    ),
  };
}
describe("Reports", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.permissions = ["projectedge.report.view", "projectedge.project.view"];
    auth.company.id = "a";
    auth.user.id = "user-a";
    vi.mocked(projectEdgeService.projects).mockResolvedValue({
      items: [{ id: 7, title: "Launch", project_code: "PRJ-007" }],
      meta: { current_page: 1, last_page: 1, total: 1 },
    } as never);
    vi.mocked(projectEdgeService.report).mockResolvedValue(
      structuredClone(response),
    );
  });
  afterEach(cleanup);
  it("renders the authorized cost trend without inventing a forecast", async () => {
    auth.permissions.push("projectedge.budget.view");
    vi.mocked(projectEdgeService.report).mockResolvedValueOnce({
      ...response,
      report: "cost-burn",
      currency: "PKR",
      summary: { forecast: null },
      cost_burn: {
        planned: "100.00",
        remaining: "75.00",
        burndown: {
          basis: "approved_cost_by_log_date",
          reported_on: "2026-10-01",
          has_approved_costs: true,
          includes_future_dates: false,
          points: [
            {
              date: "2026-09-30",
              actual: "0.00",
              remaining: "100.00",
              kind: "opening_balance",
            },
            {
              date: "2026-10-01",
              actual: "25.00",
              remaining: "75.00",
              kind: "approved_cost",
            },
          ],
        },
      },
    });
    mount();
    fireEvent.change(screen.getByLabelText("Report"), {
      target: { value: "cost-burn" },
    });
    await screen.findByRole("option", { name: "PRJ-007 · Launch" });
    fireEvent.change(screen.getByLabelText("Project (required)"), {
      target: { value: "7" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate report" }));
    expect(
      await screen.findByRole("img", {
        name: "Budget ceiling and remaining balance by approved work date",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(/not an approval-date history or a forecast/),
    ).toBeInTheDocument();
  });
  it("does not query without report permission", () => {
    auth.permissions = [];
    mount();
    expect(screen.getByText("Report access required")).toBeInTheDocument();
    expect(projectEdgeService.report).not.toHaveBeenCalled();
    expect(projectEdgeService.projects).not.toHaveBeenCalled();
  });
  it("offers nine reports, queries only on submission, and renders scoped notes and accessible results", async () => {
    mount();
    expect(
      screen.getByLabelText("Report").querySelectorAll("option"),
    ).toHaveLength(9);
    expect(projectEdgeService.report).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Generate report" }));
    expect(
      await screen.findByRole("table", {
        name: "Project Status Dashboard results",
      }),
    ).toHaveTextContent("Private launch");
    expect(screen.getByText("Current snapshot only.")).toBeInTheDocument();
    expect(screen.getByText(/30 rows/)).toBeInTheDocument();
    expect(projectEdgeService.report).toHaveBeenCalledWith(
      "project-status",
      { page: 1, per_page: 25 },
      expect.any(AbortSignal),
    );
    fireEvent.click(screen.getByRole("button", { name: "Next results" }));
    await waitFor(() =>
      expect(projectEdgeService.report).toHaveBeenLastCalledWith(
        "project-status",
        { page: 2, per_page: 25 },
        expect.any(AbortSignal),
      ),
    );
  });
  it("source access is not inherited from report-view permission", () => {
    mount();
    fireEvent.change(screen.getByLabelText("Report"), {
      target: { value: "cost-burn" },
    });
    expect(screen.getByText("Source access required")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generate report" }),
    ).toBeDisabled();
    expect(projectEdgeService.report).not.toHaveBeenCalled();
  });
  it("requires a project for schedule and cost reports", async () => {
    auth.permissions.push("projectedge.gantt.view");
    mount();
    fireEvent.change(screen.getByLabelText("Report"), {
      target: { value: "gantt-progress" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate report" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Select a project");
    await screen.findByRole("option", { name: "PRJ-007 · Launch" });
    fireEvent.change(screen.getByLabelText("Project (required)"), {
      target: { value: "7" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate report" }));
    await waitFor(() =>
      expect(projectEdgeService.report).toHaveBeenCalledWith(
        "gantt-progress",
        { project_id: 7, page: 1, per_page: 25 },
        expect.any(AbortSignal),
      ),
    );
  });
  it("hides cached private results after a failed refresh", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Generate report" }));
    await screen.findByText("Private launch");
    vi.mocked(projectEdgeService.report).mockRejectedValueOnce(
      new Error("forbidden"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Refresh report" }));
    await screen.findByText("Report unavailable");
    expect(screen.queryByText("Private launch")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("clears results on filter and identity changes", async () => {
    const view = mount();
    fireEvent.click(screen.getByRole("button", { name: "Generate report" }));
    await screen.findByText("Private launch");
    fireEvent.change(screen.getByLabelText("Report"), {
      target: { value: "milestone-achievement" },
    });
    expect(screen.queryByText("Private launch")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Generate report" }));
    await screen.findByText("Private launch");
    auth.company.id = "b";
    view.rerender(
      <QueryClientProvider client={view.client}>
        <Reports />
      </QueryClientProvider>,
    );
    expect(screen.queryByText("Private launch")).not.toBeInTheDocument();
  });
  it("validates paired dates and does not discover projects for self-only reports", () => {
    auth.permissions = [
      "projectedge.report.view",
      "projectedge.task.view",
      "projectedge.time.log",
      "projectedge.delay.submit",
    ];
    mount();
    expect(screen.getByLabelText("Report")).toHaveValue("my-productivity");
    fireEvent.change(screen.getByLabelText("From date"), {
      target: { value: "2026-10-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate report" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Choose both dates");
    expect(projectEdgeService.projects).not.toHaveBeenCalled();
    expect(projectEdgeService.report).not.toHaveBeenCalled();
  });
});
