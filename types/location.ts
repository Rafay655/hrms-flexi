export interface LocationType {
  id: number;
  code: string;
  name: string;
  abbreviation: string;
  scope: "global" | "national" | "regional" | "local";
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface Location {
  id: number;
  code: string;
  name: string;
  
  location_type: LocationType | null; // The API returns this nested object
  is_virtual: boolean;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface LocationFormData {
  code: string;
  name: string;
  location_type_id: number | "";
  is_virtual: boolean;
  status: "active" | "inactive";
}

export interface LocationApiPayload {
  code: string;
  name: string;
  location_type_id: number;
  is_virtual: boolean;
  status: "active" | "inactive";
}

export interface PaginatedLocationsResponse {
  success: boolean;
  message: string;
  data: Location[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number; // not total_pages
    from: number;
    to: number;
  };
}