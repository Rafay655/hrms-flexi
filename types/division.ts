export interface Division {
  id: number;
  code: string;
  name: string;
  head_employee_id: number | { id: number; name: string } | null;
  effective_from: string;
  effective_to: string | null;
  status: "active" | "inactive";
// if API includes description field (not in validation rules, but dummy had it)
}

export interface DivisionFormData {
  code: string;
  name: string;
  head_employee_id: number | "";
  effective_from: string;
  effective_to: string | null;
  status: "active" | "inactive";
 
}

export interface DivisionApiPayload {
  code: string;
  name: string;
  head_employee_id: number | null;
  effective_from: string;
  effective_to: string | null;
  status: "active" | "inactive";

}

export interface PaginatedDivisionsResponse {
  success: boolean;
  message: string;
  data: Division[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}