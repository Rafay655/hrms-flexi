export interface MinimumWage {
  id: number;
  location_id: number;
  location?: {
    id: number;
    name: string;
  } | null;
  wage_amount: string | number;
  wage_basis: "hourly" | "daily" | "weekly" | "monthly" | "annual";

  currency: {
    id: number;
    name: string;
    iso_code: string;
    symbol: string;
  } ;
  effective_from: string;
  effective_to: string | null;
  status: "active" | "inactive";
  created_at?: string;
}

export interface MinimumWageFormData {
  location: number | "";
  wage_amount: number;
  wage_basis: MinimumWage['wage_basis'] | "";
  currency_id: number | "";
  effective_from: string;
  effective_to: string | null;
  status: "active" | "inactive";
}

export interface MinimumWageApiPayload {
  location: string;
  wage_amount: number;
  wage_basis: MinimumWage['wage_basis'];
  currency_id: number;
  effective_from: string;
  effective_to: string | null;
  status: "active" | "inactive";
}

export interface PaginatedMinimumWagesResponse {
  success: boolean;
  message: string;
  data: MinimumWage[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}