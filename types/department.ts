

export interface Department {
  id: number;
  code: string;
  name: string;

  division?: { id: number; name: string } | null; // if API includes relation
  head_employee_id: number | null;
  status: "active" | "inactive";
}

export interface DepartmentFormData {
  code: string;
  name: string;
  division_id: number | "";
  head_employee_id: number | ""; // will be empty string but sent as null
  status: "active" | "inactive";
}

export interface DepartmentApiPayload {
  code: string;
  name: string;
  division_id: number;
  head_employee_id: null;
  status: "active" | "inactive";
}

export interface PaginatedDepartmentsResponse {
  success: boolean;
  message: string;
  data: Department[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}