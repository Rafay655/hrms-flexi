import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import Dashboard from "./dashboard";
const fixture = vi.hoisted(() => ({ data: {} as Record<string, unknown> }));
vi.mock("@/hooks/useFlexiHQDashboard", () => ({ useFlexiHQDashboard: () => ({ data: fixture.data, isError: false }) }));
afterEach(cleanup);
const base = { stats: { total_companies: 1, active_branches: 0, total_departments: 0, total_positions: 0, total_divisions: 0 }, org_snapshot: [], headcount_by_grade: [], branch_distribution: [] };
it("renders older dashboard responses without inventing missing workflow or form counts", () => {
 fixture.data = base;
 render(<Dashboard />);
 expect(screen.getByRole("status")).toHaveTextContent("missing: attention, forms, workflows");
 expect(screen.getByText("Workflow metrics are unavailable in this response.")).toBeInTheDocument();
 expect(screen.getByText("Onboarding configuration is unavailable in this response.")).toBeInTheDocument();
 expect(screen.getByText("Attention metrics are unavailable in this response.")).toBeInTheDocument();
 const card = screen.getByText("Active workflows").parentElement!;
 expect(within(card).getByText("—")).toBeInTheDocument();
});
it("preserves measured zero and hides unavailable attention counts", () => {
 fixture.data = { ...base, forms: { total_fields: 0, breakdown: [] }, workflows: { active: 0, items: [] }, attention: [{ key: "missing", label: "Validation coverage", note: "No mandatory-rule policy exists.", href: "/flexi-hq/validation-catalog", available: false, count: null }] };
 render(<Dashboard />);
 const card = screen.getByText("Active workflows").parentElement!;
 expect(within(card).getByText("0")).toBeInTheDocument();
 expect(within(card).queryByText("—")).not.toBeInTheDocument();
 const attention = screen.getByRole("link", { name: /Validation coverage/ });
 expect(attention).toHaveTextContent("No mandatory-rule policy exists.");
 expect(attention).not.toHaveTextContent("0");
});

it("renders a positive active workflow count numerically", () => {
 fixture.data = { ...base, workflows: { active: 6, items: [] }, forms: { total_fields: 0, breakdown: [] }, attention: [] };
 render(<Dashboard />);
 expect(within(screen.getByText("Active workflows").parentElement!).getByText("6")).toBeInTheDocument();
 expect(screen.queryByText(/does not include the active workflow count/)).not.toBeInTheDocument();
});
