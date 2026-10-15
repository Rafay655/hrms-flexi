export interface Country {
  id: number;
  name: string;
  iso2: string;
  iso3: string | null;
  phonecode: string | null;
  region: string | null;
  status: "active" | "inactive";
  created_at?: string;
}

export interface CountryFormData {
  name: string;
  iso2: string;
  iso3: string;
  phonecode: string;
  region: string;
  status: "active" | "inactive";
}

export interface CountryApiPayload {
  name: string;
  iso2: string;
  iso3: string | null;
  phonecode: string | null;
  region: string | null;
  status: "active" | "inactive";
}

export interface PaginatedCountriesResponse {
  success: boolean;
  message: string;
  data: Country[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}