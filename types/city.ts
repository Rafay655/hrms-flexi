export interface City {
  id: number;
  name: string;
  state_id: number;
  state_code: string | null;
  state?: { id: number; name: string; code: string } | null;
  country_id: number;
  country_code: string;
  country?: { id: number; name: string; iso2: string } | null;
  latitude: number | null;
  longitude: number | null;
  status: "active" | "inactive";
  created_at?: string;
}

export interface CityFormData {
  name: string;
  state_id: number | "";
  state_code: string;
  country_id: number | "";
  country_code: string;
  latitude: string;
  longitude: string;
  status: "active" | "inactive";
}

export interface CityApiPayload {
  name: string;
  state_id: number;
  state_code: string | null;
  country_id: number;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
  status: "active" | "inactive";
}

export interface PaginatedCitiesResponse {
  success: boolean;
  message: string;
  data: City[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}