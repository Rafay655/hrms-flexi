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
import { BudgetDashboard } from "./BudgetDashboard";
import { BudgetBurndown } from "./BudgetBurndown";
import { projectEdgeService } from "@/services/projectedge";
import { budgetFixture } from "./budget.fixture";
import { budgetMoney } from "@/lib/projectedge-budget";
import { dateFromDay, dayNumber } from "@/lib/projectedge-gantt";

const auth = vi.hoisted(() => ({
  permissions: [
    "projectedge.project.view",
    "projectedge.budget.view",
    "projectedge.budget.manage",
  ],
  company: { id: "company-a", currency: "PKR" as string | null },
}));
vi.mock("@/store/hooks", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector({ auth }),
}));
vi.mock("@/services/projectedge", () => ({
  projectEdgeService: { budgetReport: vi.fn(), saveBudgetLine: vi.fn() },
}));
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <BudgetDashboard projectId={7} />
      </QueryClientProvider>,
    ),
  };
}
describe("budget dashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.company.id = "company-a";
    auth.company.currency = "PKR";
    auth.permissions = [
      "projectedge.project.view",
      "projectedge.budget.view",
      "projectedge.budget.manage",
    ];
    vi.mocked(projectEdgeService.budgetReport).mockResolvedValue(
      structuredClone(budgetFixture),
    );
    vi.mocked(projectEdgeService.saveBudgetLine).mockResolvedValue(
      budgetFixture.lines[0],
    );
  });
  afterEach(cleanup);
  it("fails closed for ordinary project viewers and manage-only accounts", () => {
    auth.permissions = [
      "projectedge.project.view",
      "projectedge.budget.manage",
    ];
    mount();
    expect(screen.getByText("Budget access required")).toBeInTheDocument();
    expect(projectEdgeService.budgetReport).not.toHaveBeenCalled();
  });
  it("shows the project ceiling, real totals, categories and an accessible burn chart", async () => {
    mount();
    await screen.findByRole("heading", { name: "Project budget" });
    const summary = screen.getByLabelText("Budget summary");
    expect(summary).toHaveTextContent("1,000.00");
    expect(summary).toHaveTextContent("Actual cost");
    expect(summary).toHaveTextContent("750.00");
    expect(summary).toHaveTextContent("75%");
    expect(summary).toHaveTextContent("ForecastUnavailable");
    expect(
      screen.getByRole("img", { name: /Budget ceiling and remaining/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/includes future-dated approved entries/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Material, overhead and other actuals remain untracked/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("View burndown data table"));
    expect(
      screen.getByRole("table", { name: /Approved cost and remaining budget/ }),
    ).toHaveTextContent("2026-10-04");
    fireEvent.click(screen.getByText("View category data table"));
    expect(
      screen.getByRole("table", {
        name: /Planned and actual budget by category/,
      }),
    ).toHaveTextContent("Material");
  });
  it("honors server manage capability and locks system rollups", async () => {
    mount();
    await screen.findByText("Delivery");
    expect(
      screen.getByRole("button", { name: "Edit budget line Delivery" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit budget line Approved time" }),
    ).not.toBeInTheDocument();
    cleanup();
    vi.mocked(projectEdgeService.budgetReport).mockResolvedValue({
      ...budgetFixture,
      capabilities: { manage: false },
    });
    mount();
    await screen.findByText("Delivery");
    expect(
      screen.queryByRole("button", { name: "Add budget line" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit budget line Delivery" }),
    ).not.toBeInTheDocument();
  });
  it("preserves undefined utilization, overrun and overallocated category plan without fabricating currency", async () => {
    auth.company.currency = null;
    vi.mocked(projectEdgeService.budgetReport).mockResolvedValue({
      ...budgetFixture,
      summary: {
        ...budgetFixture.summary,
        planned: "0.00",
        remaining: "-250.00",
        actual: "250.00",
        utilization_pct: null,
        unallocated_planned: "-700.00",
      },
    });
    mount();
    await screen.findByText(/No company currency is configured/);
    expect(screen.getByLabelText("Budget summary")).toHaveTextContent(
      "Undefined",
    );
    expect(
      screen.getByText(/Remaining budget is negative/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Budget lines exceed the project ceiling/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Budget summary")).not.toHaveTextContent(
      "PKR",
    );
  });
  it("shows an empty chart and no lines while retaining an overall plan", async () => {
    const report = structuredClone(budgetFixture);
    report.lines = [];
    report.summary.burndown.has_approved_costs = false;
    report.summary.burndown.points = [report.summary.burndown.points[0]];
    vi.mocked(projectEdgeService.budgetReport).mockResolvedValue(report);
    mount();
    expect(
      await screen.findByText(/No approved time costs yet/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No category budget lines yet/),
    ).toBeInTheDocument();
  });
  it("saves only editable planned fields, never actuals, and invalidates after confirmation", async () => {
    const { client } = mount();
    await screen.findByText("Delivery");
    const invalidate = vi.spyOn(client, "invalidateQueries");
    fireEvent.click(screen.getByRole("button", { name: "Add budget line" }));
    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "material" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Equipment" },
    });
    fireEvent.change(screen.getByLabelText("Planned amount"), {
      target: { value: "200.00" },
    });
    expect(screen.queryByLabelText("Actual amount")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save budget line" }));
    await waitFor(() =>
      expect(projectEdgeService.saveBudgetLine).toHaveBeenCalledWith(
        7,
        {
          budget_type: "material",
          description: "Equipment",
          planned_amount: "200.00",
        },
        undefined,
      ),
    );
    await waitFor(() => expect(invalidate).toHaveBeenCalled());
  });
  it("validates decimal limits and retains form values on API failure", async () => {
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit budget line Delivery" }),
    );
    fireEvent.change(screen.getByLabelText("Planned amount"), {
      target: { value: "-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save budget line" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("non-negative");
    expect(projectEdgeService.saveBudgetLine).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Planned amount"), {
      target: { value: "600.00" },
    });
    fireEvent.change(screen.getByLabelText("Planning hourly rate (optional)"), {
      target: { value: "100000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save budget line" }));
    expect(await screen.findByText(/eight integer digits/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "material" },
    });
    vi.mocked(projectEdgeService.saveBudgetLine).mockRejectedValue(
      new Error("offline"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save budget line" }));
    expect(
      await screen.findByText(/budget line could not be saved/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Planned amount")).toHaveValue("600.00");
    expect(projectEdgeService.saveBudgetLine).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ cost_per_hour: null }),
      1,
    );
  });
  it("prevents closing during saves and restores keyboard focus after confirmation", async () => {
    mount();
    const opener = await screen.findByRole("button", {
      name: "Edit budget line Delivery",
    });
    opener.focus();
    fireEvent.click(opener);
    let release!: () => void;
    vi.mocked(projectEdgeService.saveBudgetLine).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve(budgetFixture.lines[0]);
        }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save budget line" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled(),
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    release();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(opener).toHaveFocus());
  });
  it("does not show cached costs after a failed refresh and supports retry", async () => {
    mount();
    await screen.findByText("Delivery");
    vi.mocked(projectEdgeService.budgetReport).mockRejectedValueOnce(
      new Error("offline"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Refresh budget" }));
    expect(
      await screen.findByText("Project budget unavailable"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Delivery")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry budget" }));
    expect(await screen.findByText("Delivery")).toBeInTheDocument();
  });
  it("clears the private editor when the company scope changes", async () => {
    const { client, rerender } = mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit budget line Delivery" }),
    );
    auth.company.id = "company-b";
    let complete!: (value: typeof budgetFixture) => void;
    vi.mocked(projectEdgeService.budgetReport).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    rerender(
      <QueryClientProvider client={client}>
        <BudgetDashboard projectId={7} />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Loading project budget…")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    complete(structuredClone(budgetFixture));
    await screen.findByText("Delivery");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("paginates long burn histories without omitting the accessible table", () => {
    const summary = structuredClone(budgetFixture.summary);
    summary.burndown.points = Array.from({ length: 30 }, (_, index) => ({
      date: dateFromDay(dayNumber("2026-09-01") + index),
      actual: String(index),
      remaining: String(1000 - index),
      kind: "approved_cost" as const,
    }));
    render(
      <BudgetBurndown summary={summary} money={budgetMoney("PKR").format} />,
    );
    fireEvent.click(screen.getByText("View burndown data table"));
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(26);
    fireEvent.click(screen.getByRole("button", { name: "Next burn points" }));
    expect(within(table).getAllByRole("row")).toHaveLength(6);
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
  });
});
