export interface MaritalStatus {
  id: number;
  name: string;
  status: "active" | "inactive";
}

export interface MaritalStatusFormData {
  name: string;
  status: "active" | "inactive";
}

export interface MaritalStatusApiPayload {
  name: string;
  status: "active" | "inactive";
}

export interface PaginatedMaritalStatusesResponse {
  success: boolean;
  message: string;
  data: MaritalStatus[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}