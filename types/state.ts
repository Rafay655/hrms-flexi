export interface State {
  id: number;
  name: string;
  code: string | null;
  country_id: number;
  country_code: string;
  country?: { id: number; name: string; iso2: string } | null;
  latitude: number | null;
  longitude: number | null;
  status: "active" | "inactive";
  created_at?: string;
}

export interface StateFormData {
  name: string;
  code: string;
  country_id: number | "";
  country_code: string;
  latitude: string;
  longitude: string;
  status: "active" | "inactive";
}

export interface StateApiPayload {
  name: string;
  code: string | null;
  country_id: number;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
  status: "active" | "inactive";
}

export interface PaginatedStatesResponse {
  success: boolean;
  message: string;
  data: State[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}