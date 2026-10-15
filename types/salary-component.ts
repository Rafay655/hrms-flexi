export interface SalaryComponent {
  id: number;
  code: string;
  name: string;
  type: "earning" | "deduction" | "employer_contribution";
  status: "active" | "inactive";
  created_at?: string;
}

export interface SalaryComponentFormData {
  code: string;
  name: string;
  type: SalaryComponent['type'] | "";
  status: "active" | "inactive";
}

export interface SalaryComponentApiPayload {
  code: string;
  name: string;
  type: SalaryComponent['type'];
  status: "active" | "inactive";
}

export interface PaginatedSalaryComponentsResponse {
  success: boolean;
  message: string;
  data: SalaryComponent[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}