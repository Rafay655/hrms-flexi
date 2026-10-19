export type ReportId =
  | "project-status"
  | "gantt-progress"
  | "department-completion"
  | "delayed-tasks"
  | "time-utilization"
  | "cost-burn"
  | "resource-capacity"
  | "milestone-achievement"
  | "my-productivity";

export type ReportValue = string | number | boolean | null;
export type ReportExportFormat = "pdf" | "xlsx" | "png";
export type ReportExportJob = {
  uuid: string;
  report: ReportId;
  format: ReportExportFormat;
  status: "pending" | "processing" | "complete" | "failed";
  record_count: number | null;
  file_name: string | null;
  expires_at: string;
  error_message: string | null;
};
export type ReportFilters = {
  project_id?: number;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
};
export type ProjectEdgeReport = {
  cost_burn?: Pick<
    BudgetReport["summary"],
    "planned" | "remaining" | "burndown"
  >;
  report: ReportId;
  columns: { key: string; label: string }[];
  rows: Record<string, ReportValue>[];
  summary: Record<string, ReportValue>;
  notes: string[];
  generated_at: string;
  as_of: string;
  timezone: string;
  currency: string | null;
  filters: ReportFilters;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};
import type { BudgetReport } from "./projectedge-budget";
