export interface Salutation {
  id: number;
  name: string;
  status: "active" | "inactive";
}

export interface SalutationFormData {
  name: string;
  status: "active" | "inactive";
}

export interface SalutationApiPayload {
  name: string;
  status: "active" | "inactive";
}

export interface PaginatedSalutationsResponse {
  success: boolean;
  message: string;
  data: Salutation[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}