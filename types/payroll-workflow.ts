// types/payroll-workflow.ts
import type { Division } from "@/types/division";
export interface PayrollWorkflow {
  run_id: string;
  workflow_uuid: string;
  period: string;
  payroll_group: string;
  version: string | null;
  employees: number;
  gross_total: number;
  net_payout: number;
  status: string;
  run_type: string;
  has_exceptions: boolean;
  exception_summary: {
    missing_bank_details: number;
    tax_slab_discrepancy: number;
    negative_net_salary: number;
  };
  run_insights: {
    avg_net_salary: number;
    total_tax_volume: number;
    bank_connectivity: string;
    auth_protocol: string;
    compliance: string;
  };
  audit_trail: {
    description: string;
    causer_id: number;
    created_at: string;
  }[];
}

export interface PayrollWorkflowsResponse {
  success: boolean;
  message: string;
  data: PayrollWorkflow[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

export interface WorkflowSelectResponse {
  workflow: {
    uuid: string;
    run_type: string;
    selection_mode: "whole_company" | "groups";
    selected_groups: number[];
  };
  period: {
    uuid: string;
    label: string;
    start_date: string;
    end_date: string;
  };
  available_groups: {
    divisions: Division[];
 
  };
  total_employees: number;
  run_type_options: string[];
  selection_mode_options: string[];
}

export interface WorkflowSelectPayload {
  payroll_period_id: string;
  run_type: string;
  selection_mode: "whole_company" | "groups";
  selected_groups: number[] | null;
}