export interface EmployeeType {
  id: number;
  name: string;
  status: "active" | "inactive";
}

export interface EmployeeTypeFormData {
  name: string;
  status: "active" | "inactive";
}

export interface EmployeeTypeApiPayload {
  name: string;
  status: "active" | "inactive";
}

export interface PaginatedEmployeeTypesResponse {
  success: boolean;
  message: string;
  data: EmployeeType[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}