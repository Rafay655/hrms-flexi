export interface EntityType {
  id: number;
  code: string;
  name: string;
  abbreviation: string;
  status: "active" | "inactive";
}

export interface EntityTypeFormData {
  code: string;
  name: string;
  abbreviation: string;
  status: "active" | "inactive";
}

export interface EntityTypeApiPayload {
  code: string;
  name: string;
  abbreviation: string;
  status: "active" | "inactive";
}

export interface PaginatedEntityTypesResponse {
  data: EntityType[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}