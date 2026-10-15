// src/types/gratuity-policy.ts

export interface GratuityPolicy {
  id: string;
  entity_id: string | null;
  min_service_years: string;           // numeric string, e.g. "1.00"
  calculation_basis: string;           // "last_drawn_basic" | "last_drawn_gross" | "average_last_3_months" | "average_last_6_months"
  multiplier_per_year: string;
  max_gratuity_amount: string;
  prorate_partial_year: boolean;
  partial_year_threshold_months: number;
  is_taxable: boolean;
  effective_from: string;              // date string
  is_active: boolean;
}

export interface PaginatedGratuityPoliciesResponse {
  success: boolean;
  message: string;
  data: GratuityPolicy[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page?: number;
  };
}

export interface CreateGratuityPolicyPayload {
  entity_id?: string | null;
  min_service_years?: number | null;
  calculation_basis: string;
  multiplier_per_year?: number | null;
  max_gratuity_amount?: number | null;
  prorate_partial_year: boolean;
  partial_year_threshold_months?: number;
  is_taxable: boolean;
  effective_from: string;
  is_active: boolean;
}

export interface UpdateGratuityPolicyPayload {
  entity_id?: string | null;
  min_service_years?: number | null;
  calculation_basis?: string;
  multiplier_per_year?: number | null;
  max_gratuity_amount?: number | null;
  prorate_partial_year?: boolean;
  partial_year_threshold_months?: number;
  is_taxable?: boolean;
  effective_from?: string;
  is_active?: boolean;
}