export type BudgetCategory = "labor" | "material" | "overhead" | "other";
export interface BudgetLine {
  id: number;
  project_id: number;
  budget_type: BudgetCategory;
  description: string;
  planned_amount: string;
  actual_amount: string;
  cost_per_hour: string | null;
  system_generated: boolean;
}
export interface BudgetLineInput {
  budget_type: BudgetCategory;
  description: string;
  planned_amount: string;
  cost_per_hour?: string | null;
}
export interface BudgetBurnPoint {
  date: string;
  actual: string;
  remaining: string;
  kind: "opening_balance" | "approved_cost";
}
export interface BudgetReport {
  capabilities: { manage: boolean };
  lines: BudgetLine[];
  summary: {
    planned: string;
    allocated_planned: string;
    unallocated_planned: string;
    actual: string;
    remaining: string;
    utilization_pct: number | null;
    approved_hours: string;
    actual_basis: "approved_time_cost_snapshots";
    forecast: null;
    categories: Array<{
      budget_type: BudgetCategory;
      planned: string;
      actual: string;
      line_count: number;
    }>;
    by_employee: Array<{
      employee_id: string | null;
      employee_code: string | null;
      approved_hours: string;
      actual_cost: string;
      billable_hours: string;
      billable_cost: string;
    }>;
    burndown: {
      basis: "approved_cost_by_log_date";
      reported_on: string;
      has_approved_costs: boolean;
      includes_future_dates: boolean;
      points: BudgetBurnPoint[];
    };
  };
}
