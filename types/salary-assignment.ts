// src/types/salary-assignment.ts

export interface SalaryAssignment {
  id: string;
  employee_id: string;
  employee_name: string;
  salary_structure_id: string;
  salary_structure: string;         // name of structure
  effective_from: string;
  effective_to: string | null;
  basic_salary: string;
  gross_salary: string;
  ctc: string;
  currency_code: string;
  revision_reason: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface PaginatedSalaryAssignmentsResponse {
  success: boolean;
  message: string;
  data: SalaryAssignment[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number;
    to: number;
    filters?: {
      search: string | null;
      employee_id: string | null;
      salary_structure_id: string | null;
      status: string | null;
      revision_reason: string | null;
      effective_from: string | null;
      effective_to: string | null;
      is_current: string | null;
      sort: string;
    };
  };
}

export interface UpdateSalaryAssignmentPayload {
  effective_from?: string;
  effective_to?: string | null;
  basic_salary?: number | null;
  gross_salary?: number | null;
  ctc?: number | null;
  salary_structure_id?: string;
  currency_code?: string | null;
  revision_reason?: string;
  status?: string;
}