export interface Gender {
  id: number;
  name: string;
  status: "active" | "inactive";
}

export interface GenderFormData {
  name: string;
  status: "active" | "inactive";
}

export interface GenderApiPayload {
  name: string;
  status: "active" | "inactive";
}

export interface PaginatedGendersResponse {
  success: boolean;
  message: string;
  data: Gender[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}