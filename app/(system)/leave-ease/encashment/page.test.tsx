import React from "react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within,
} from "@testing-library/react";
import Page from "./page";
import { leaveEncashmentService as service } from "@/services/leave-encashment.service";
import { leaveTypeService } from "@/services/leave-type.service";
const context = vi.hoisted(() => ({
  permissions: ["encashment.create"],
  view: "",
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(context.view),
}));
vi.mock("@/store/hooks", () => ({
  useAppSelector: (select: (state: unknown) => unknown) =>
    select({
      auth: {
        company: { id: "company-uuid", timezone: "Asia/Karachi" },
        user: { id: "user", permissions: context.permissions },
      },
    }),
}));
vi.mock("@/hooks/useEmployees", () => ({
  useEmployees: () => ({
    data: [
      {
        id: 1,
        uuid: "employee-uuid",
        name: "Test Employee",
        employee_code: "EMP-1",
      },
    ],
    isPending: false,
  }),
}));
vi.mock("@/services/leave-type.service", () => ({
  leaveTypeService: { getAll: vi.fn() },
}));
vi.mock("@/services/leave-encashment.service", async () => {
  const actual = await vi.importActual<
    typeof import("@/services/leave-encashment.service")
  >("@/services/leave-encashment.service");
  return {
    ...actual,
    leaveEncashmentService: {
      getAll: vi.fn(),
      create: vi.fn(),
      decide: vi.fn(),
    },
  };
});
vi.mock("@/components/ui/searchable-select", () => ({
  default: (props: {
    "aria-label"?: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    allLabel?: string;
    disabled?: boolean;
  }) => (
    <select
      aria-label={props["aria-label"]}
      value={props.value}
      disabled={props.disabled}
      onChange={(e) => props.onChange(e.target.value)}
    >
      <option value="">{props.allLabel || "Select"}</option>
      {props.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));
let client: QueryClient;
function mount() {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  context.permissions = ["encashment.create"];
  context.view = "";
  vi.mocked(service.getAll).mockResolvedValue({
    success: true,
    message: "OK",
    data: [],
    meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
  });
  vi.mocked(leaveTypeService.getAll).mockResolvedValue({
    success: true,
    data: {
      data: [
        {
          id: "annual",
          uuid: "annual",
          company_id: 7,
          name: "Annual",
          code: "AL",
          is_active: true,
          is_encashable: true,
        },
        {
          id: "sick",
          uuid: "sick",
          company_id: 7,
          name: "Sick",
          code: "SL",
          is_active: true,
          is_encashable: false,
        },
      ],
      meta: { current_page: 1, last_page: 1, per_page: 100, total: 2 },
    },
  } as Awaited<ReturnType<typeof leaveTypeService.getAll>>);
  vi.mocked(service.create).mockResolvedValue({ success: true });
});
afterEach(() => {
  cleanup();
  client.clear();
});
it("loads real data using the active company, applies supported filters, and exposes bottom pagination", async () => {
  mount();
  await screen.findByText("No encashment records found.");
  expect(service.getAll).toHaveBeenCalledWith(
    expect.objectContaining({ per_page: 15 }),
    expect.anything(),
  );
  expect(
    screen.getByRole("navigation", { name: "Encashment pagination" }),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText('Payroll inclusion')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'More filters'}));
  fireEvent.change(screen.getByLabelText("Payroll inclusion"), {
    target: { value: "0" },
  });
  await waitFor(() =>
    expect(service.getAll).toHaveBeenLastCalledWith(
      expect.objectContaining({ payroll_included: 0 }),
      expect.anything(),
    ),
  );
  fireEvent.click(screen.getByRole('button',{name:/Hide filters/}));
  expect(screen.queryByLabelText('Payroll inclusion')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:/More filters/}));
  expect(screen.getByLabelText('Payroll inclusion')).toHaveValue('0');
});
it("creates with an encashable leave type UUID and allows an explicit zero rate", async () => {
  mount();
  await screen.findByText("No encashment records found.");
  fireEvent.click(screen.getByRole("button", { name: "Create encashment" }));
  const dialog = screen.getByRole("dialog");
  await waitFor(() =>
    expect(
      within(dialog).getByRole("option", { name: "Annual (AL)" }),
    ).toBeInTheDocument(),
  );
  expect(
    within(dialog).queryByRole("option", { name: "Sick (SL)" }),
  ).not.toBeInTheDocument();
  fireEvent.change(within(dialog).getByLabelText("Employee"), {
    target: { value: "employee-uuid" },
  });
  fireEvent.change(within(dialog).getByLabelText("Leave type"), {
    target: { value: "annual" },
  });
  fireEvent.change(within(dialog).getByLabelText("Year *"), {
    target: { value: "2026" },
  });
  fireEvent.change(within(dialog).getByLabelText("Days to encash *"), {
    target: { value: "0.5" },
  });
  fireEvent.change(within(dialog).getByLabelText("Rate per day (optional)"), {
    target: { value: "0" },
  });
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Create encashment" }),
  );
  await waitFor(() =>
    expect(service.create).toHaveBeenCalledWith({
      employee_id: "employee-uuid",
      leave_type_id: "annual",
      year: 2026,
      days_encashed: 0.5,
      rate_per_day: "0",
    }),
  );
});
it("opens the approvals link with pending records and shows create disabled for approval-only users", async () => {
  context.permissions = ["encashment.approve"];
  context.view = "view=approvals";
  mount();
  await screen.findByText("No encashment records found.");
  expect(screen.getByText("Encashment Approvals")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Create encashment" })).toBeDisabled();
  expect(service.getAll).toHaveBeenCalledWith(
    expect.objectContaining({ status: "pending" }),
    expect.anything(),
  );
});
