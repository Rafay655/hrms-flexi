export interface LocationType {
  id: number;
  code: string;
  name: string;
  abbreviation: string | null;
  scope: "global" | "national" | "regional" | "local";
  status: "active" | "inactive";
}

export interface LocationTypeFormData {
  code: string;
  name: string;
  abbreviation: string;
  scope: "global" | "national" | "regional" | "local" | "";
  status: "active" | "inactive";
}

export interface LocationTypeApiPayload {
  code: string;
  name: string;
  abbreviation: string | null;
  scope: "global" | "national" | "regional" | "local";
  status: "active" | "inactive";
}

export interface PaginatedLocationTypesResponse {
  data: LocationType[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}