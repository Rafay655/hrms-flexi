export interface Designation {
  id: number;
  title: string;
  code: string;
  department: {
    id: number;
    name: string;
    code: string;
  } | null;
  reports_to: {
    id: number;
    title: string;
    code: string;
  } | null;
  grade_band: {
    id: number;
    code: string;
    name: string;
    level: string | null;
    min_salary: string;
    max_salary: string;
    benefit_tier: string;
    status: string;
  } | null;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface DesignationFormData {
  title: string;
  code: string;
  department_id: number | "";
  reports_to_id: number | "";
  grade_band_id: number | "";
  status: "active" | "inactive";
}

export interface DesignationApiPayload {
  title: string;
  code: string;
  department_id: number;
  reports_to_id: number | null;
  grade_band_id: number | null;
  status: "active" | "inactive";
}

export interface PaginatedDesignationsResponse {
  success: boolean;
  message: string;
  data: Designation[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}