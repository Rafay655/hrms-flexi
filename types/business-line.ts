export interface BusinessLine {
  id: number;
  code: string;
  name: string;
  description: string | null;
  industry_code: string | null;
  status: "active" | "inactive";
}

export interface BusinessLineFormData {
  code: string;
  name: string;
  description: string;
  industry_code: string;
  status: "active" | "inactive";
}

export interface BusinessLineApiPayload {
  code: string;
  name: string;
  description: string | null;
  industry_code: string | null;
  status: "active" | "inactive";
}

export interface PaginatedBusinessLinesResponse {
  success: boolean;
  message: string;
  data: BusinessLine[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}