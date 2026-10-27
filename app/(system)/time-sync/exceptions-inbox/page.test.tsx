import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Page from "./page";
import { attendanceExceptionService } from "@/services/attendance-exception.service";
import type { ExceptionListResponse } from "@/types/attendance-exception";
vi.mock("@/store/hooks", () => ({ useAppSelector: () => "company-1" }));
vi.mock("@/services/attendance-exception.service", () => ({
  attendanceExceptionService: { list: vi.fn() },
}));
vi.mock("@/services/employee.service", () => ({
  employeeService: { getAllForBatches: vi.fn(async () => []) },
}));
vi.mock("@/services/department.service", () => ({
  departmentService: {
    getAll: vi.fn(async () => ({ data: [], meta: { last_page: 1 } })),
  },
}));
vi.mock("@/components/ui/searchable-select", () => ({
  default: (props: {
    id?: string;
    "aria-label"?: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
  }) => (
    <select
      id={props.id}
      aria-label={props["aria-label"]}
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    >
      <option value="">All</option>
      {props.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));
const response: ExceptionListResponse = {
  success: true,
  message: "Attendance anomalies retrieved successfully.",
  data: [
    {
      id: "case-1",
      exception_code: "EXC-001",
      date: "2026-10-22",
      type: "missing_punch_out",
      severity: "high",
      status: "pending",
      employee: {
        name: "Alex Taylor",
        employee_code: "E01",
        department: "Engineering",
      },
    },
  ],
  meta: {
    total: 51,
    current_page: 1,
    per_page: 25,
    last_page: 3,
    summary: {
      by_severity: { high: 30, medium: 15 },
      by_type: { missing_punch_out: 51 },
      affected_employees: 20,
    },
  },
};
let client: QueryClient;
function mount() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(attendanceExceptionService.list).mockResolvedValue(response);
});
afterEach(() => {
  cleanup();
  client.clear();
});
it("renders real rows, serial numbers and full-set summary counts", async () => {
  mount();
  expect(await screen.findByText("Alex Taylor")).toBeVisible();
  expect(screen.getByText("Missing Punch Out")).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "SR" })).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Actions for EXC-001" }),
  ).toBeVisible();
  expect(
    screen.getByText("High severity").parentElement?.parentElement,
  ).toHaveTextContent("30");
  expect(
    screen.queryByRole("button", { name: /Resolve/ }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
});
it("uses server-side category, status and pagination filters", async () => {
  mount();
  await screen.findByText("Alex Taylor");
  fireEvent.click(screen.getByRole("button", { name: "Missing punch" }));
  await waitFor(() =>
    expect(attendanceExceptionService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: "missing_punch", page: 1 }),
      expect.any(AbortSignal),
    ),
  );
  fireEvent.change(screen.getByLabelText("Filter by status"), {
    target: { value: "escalated" },
  });
  await waitFor(() =>
    expect(attendanceExceptionService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "escalated" }),
      expect.any(AbortSignal),
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  await waitFor(() =>
    expect(attendanceExceptionService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
      expect.any(AbortSignal),
    ),
  );
});
it("prevents invalid date ranges from triggering requests", async () => {
  mount();
  await screen.findByText("Alex Taylor");
  const count = vi.mocked(attendanceExceptionService.list).mock.calls.length;
  fireEvent.change(screen.getByLabelText("From date"), {
    target: { value: "2026-01-01" },
  });
  fireEvent.change(screen.getByLabelText("To date"), {
    target: { value: "2026-04-01" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply dates" }));
  expect(screen.getByRole("alert")).toHaveTextContent("62 days");
  expect(attendanceExceptionService.list).toHaveBeenCalledTimes(count);
});
it("debounces search and sends the trimmed search term", async () => {
  mount();
  await screen.findByText("Alex Taylor");
  fireEvent.change(screen.getByLabelText("Search exceptions"), {
    target: { value: " Alex " },
  });
  await waitFor(() =>
    expect(attendanceExceptionService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "Alex", page: 1 }),
      expect.any(AbortSignal),
    ),
  );
});
it("handles backend empty responses with zero last_page", async () => {
  vi.mocked(attendanceExceptionService.list).mockResolvedValue({
    ...response,
    message: "No employees matched the given filters.",
    data: [],
    meta: { total: 0, current_page: 1, per_page: 0, last_page: 0 },
  });
  mount();
  expect(await screen.findByText("No exceptions found")).toBeVisible();
  expect(screen.getByText("Page 1 of 1")).toBeVisible();
  expect(
    within(
      screen.getByRole("navigation", { name: "Exceptions pagination" }),
    ).getByRole("button", { name: "Next page" }),
  ).toBeDisabled();
});

it("offers regularization through the eligible exception menu", async () => {
  mount();
  await screen.findByText("Alex Taylor");
  fireEvent.pointerDown(
    screen.getByRole("button", { name: "Actions for EXC-001" }),
    { button: 0, ctrlKey: false, pointerType: "mouse" },
  );
  expect(
    await screen.findByRole("menuitem", { name: "Request regularization" }),
  ).toBeVisible();
});
