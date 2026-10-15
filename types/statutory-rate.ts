export interface RateSlab {
  from: number;
  to: number | null;
  rate: number;
}

export interface StatutoryRate {
  id: number;
  location_id: number;
  location?: {
    id: number;
    name: string;
  } | null;
  rate_type: "income_tax" | "corporate_tax" | "sales_tax" | "social_security" | "unemployment_insurance" | "workers_compensation" | "inheritance_tax";
  rate_slabs: RateSlab[];
  effective_from: string;
  effective_to: string | null;
  status: "active" | "inactive";
  created_at?: string;
}

export interface StatutoryRateFormData {
  location: number | "";
  rate_type: StatutoryRate['rate_type'] | "";
  rate_slabs: RateSlab[];
  effective_from: string;
  effective_to: string | null;
  status: "active" | "inactive";
}

export interface StatutoryRateApiPayload {
  location: string;
  rate_type: StatutoryRate['rate_type'];
  rate_slabs: RateSlab[];
  effective_from: string;
  effective_to: string | null;
  status: "active" | "inactive";
}

export interface PaginatedStatutoryRatesResponse {
  success: boolean;
  message: string;
  data: StatutoryRate[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}