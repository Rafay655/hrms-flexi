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
import { ResourceHeatmap } from "./ResourceHeatmap";
import { projectEdgeService } from "@/services/projectedge";
import { resourceMatricesFixture } from "./resource.fixture";

const auth = vi.hoisted(() => ({
  permissions: ["projectedge.resource.view"],
  company: { id: "company-a", timezone: "Asia/Karachi" },
}));
vi.mock("@/store/hooks", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector({ auth }),
}));
vi.mock("@/services/projectedge", () => ({
  projectEdgeService: { resourceMatrices: vi.fn() },
}));

function mount(projectId?: number) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ResourceHeatmap projectId={projectId} />
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByLabelText("Starting week containing"), {
    target: { value: "2026-10-01" },
  });
  return client;
}
describe("resource heatmap", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.company.id = "company-a";
    auth.permissions = ["projectedge.resource.view"];
    vi.mocked(projectEdgeService.resourceMatrices).mockResolvedValue(
      structuredClone(resourceMatricesFixture),
    );
  });
  afterEach(cleanup);
  it("does not reuse company A's allocation cache after the selected company changes", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const view = render(
      <QueryClientProvider client={client}>
        <ResourceHeatmap />
      </QueryClientProvider>,
    );
    await screen.findByRole("button", {
      name: "EMP-001, week 2026-09-28, 50%, Healthy",
    });
    let resolve!: (value: typeof resourceMatricesFixture) => void;
    vi.mocked(projectEdgeService.resourceMatrices).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    auth.company.id = "company-b";
    view.rerender(
      <QueryClientProvider client={client}>
        <ResourceHeatmap />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Loading all resource weeks…")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    resolve(
      resourceMatricesFixture.map((matrix) => ({ ...matrix, resources: [] })),
    );
    expect(
      await screen.findByText("No allocations in this period"),
    ).toBeInTheDocument();
    const keys = client
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey[2]);
    expect(keys).toEqual(expect.arrayContaining(["company-a", "company-b"]));
  });
  it("fails closed without resource-view access", () => {
    auth.permissions = ["projectedge.resource.manage"];
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ResourceHeatmap />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Resource access required")).toBeInTheDocument();
    expect(projectEdgeService.resourceMatrices).not.toHaveBeenCalled();
  });
  it("renders employee/week rows with numbers, labels and keyboard-accessible details", async () => {
    mount();
    const trigger = await screen.findByRole("button", {
      name: "EMP-001, week 2026-09-28, 50%, Healthy",
    });
    expect(
      screen.getByRole("button", {
        name: "EMP-001, week 2026-10-05, 90%, Caution",
      }),
    ).toBeInTheDocument();
    trigger.focus();
    fireEvent.click(trigger);
    const popup = screen.getByRole("dialog");
    expect(popup).toHaveTextContent("Available capacity");
    expect(popup).toHaveTextContent("40 h");
    expect(popup).toHaveTextContent("Leave hours");
    expect(popup).toHaveTextContent("Analyst");
    expect(popup).toHaveTextContent("2026-09-28 – 2026-10-25");
    fireEvent.keyDown(popup, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it("shows undefined zero-capacity overload without a fake percentage", async () => {
    mount();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "EMP-001, week 2026-10-12, —, Overloaded",
      }),
    );
    const popup = screen.getByRole("dialog");
    expect(popup).toHaveTextContent("Percentage is undefined");
    expect(popup).toHaveTextContent("Capacity is unconfigured");
    expect(popup).not.toHaveTextContent("Infinity");
    fireEvent.click(
      within(popup).getByRole("button", { name: "Close resource details" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "EMP-002, week 2026-10-05, —, No allocation",
      }),
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "not a measured 0% utilization",
    );
  });
  it("filters by employee, project and any-week state without changing percentages", async () => {
    mount();
    await screen.findByRole("button", {
      name: "EMP-001, week 2026-09-28, 50%, Healthy",
    });
    fireEvent.change(screen.getByLabelText("Project"), {
      target: { value: "7" },
    });
    expect(
      screen.queryByRole("button", {
        name: "EMP-002, week 2026-09-28, 125%, Overloaded",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "EMP-001, week 2026-09-28, 50%, Healthy",
      }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Utilization state"), {
      target: { value: "caution" },
    });
    expect(
      screen.getByRole("button", {
        name: "EMP-001, week 2026-09-28, 50%, Healthy",
      }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Employee code"), {
      target: { value: "not present" },
    });
    expect(
      screen.getByText("No resources match these filters"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(
      screen.getByRole("button", {
        name: "EMP-002, week 2026-09-28, 125%, Overloaded",
      }),
    ).toBeInTheDocument();
  });
  it("uses the project route only as a row filter, and provides mobile details", async () => {
    mount(7);
    expect(
      await screen.findByRole("button", {
        name: "Mobile: EMP-001, week 2026-09-28, 50%, Healthy",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Project")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "EMP-002, week 2026-09-28, 125%, Overloaded",
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Mobile: EMP-001, week 2026-09-28, 50%, Healthy",
      }),
    );
    expect(screen.getByRole("dialog")).toHaveTextContent("Allocated hours");
  });
  it("retains employee-weeks only after all reads resolve and supports retry", async () => {
    let resolve!: (value: typeof resourceMatricesFixture) => void;
    vi.mocked(projectEdgeService.resourceMatrices).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    mount();
    expect(screen.getByText("Loading all resource weeks…")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    resolve(structuredClone(resourceMatricesFixture));
    await screen.findByRole("table");
    vi.mocked(projectEdgeService.resourceMatrices).mockRejectedValueOnce(
      new Error("offline"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(
      await screen.findByText("Resource heatmap unavailable"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    vi.mocked(projectEdgeService.resourceMatrices).mockResolvedValue(
      structuredClone(resourceMatricesFixture),
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });
  it("changes bounded periods and never renders costs even when present in the response", async () => {
    const reports = structuredClone(resourceMatricesFixture);
    Object.assign(reports[0].resources[0], {
      cost_amount: 987654321,
      hourly_cost_rate: 876543210,
    });
    auth.permissions.push("projectedge.budget.view");
    vi.mocked(projectEdgeService.resourceMatrices).mockResolvedValue(reports);
    mount();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "EMP-001, week 2026-09-28, 50%, Healthy",
      }),
    );
    expect(document.body).not.toHaveTextContent("987654321");
    expect(document.body).not.toHaveTextContent("876543210");
    fireEvent.click(
      screen.getByRole("button", { name: "Close resource details" }),
    );
    fireEvent.change(screen.getByLabelText("Weeks"), {
      target: { value: "8" },
    });
    await waitFor(() =>
      expect(projectEdgeService.resourceMatrices).toHaveBeenLastCalledWith(
        expect.arrayContaining(["2026-11-16"]),
        expect.any(AbortSignal),
      ),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Next resource period" }),
    );
    await waitFor(() =>
      expect(projectEdgeService.resourceMatrices).toHaveBeenLastCalledWith(
        expect.arrayContaining(["2026-11-23"]),
        expect.any(AbortSignal),
      ),
    );
  });
  it("labels an empty allocation period without synthetic employees", async () => {
    vi.mocked(projectEdgeService.resourceMatrices).mockResolvedValue(
      resourceMatricesFixture.map((matrix) => ({ ...matrix, resources: [] })),
    );
    mount();
    expect(
      await screen.findByText("No allocations in this period"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
