export interface GradeBand {
  id: number;
  code: string;
  name: string;
  level: string | null;
  min_salary: string;
  max_salary: string;
  currency: {
    id: number;
    name: string;
    iso_code: string;
    symbol: string;
    decimal_places: number;
    status: string;
  } | null;
  benefit_tier: "tier_1_basic" | "tier_2_standard" | "tier_3_premium" | "tier_4_executive";
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface GradeBandFormData {
  code: string;
  name: string;
  level: string;
  min_salary: string;
  max_salary: string;
  currency_id: number | "";
  benefit_tier: GradeBand['benefit_tier'] | "";
  status: "active" | "inactive";
}

export interface GradeBandApiPayload {
  code: string;
  name: string;
  level: string | null;
  min_salary: number;
  max_salary: number;
  currency_id: number;
  benefit_tier: GradeBand['benefit_tier'];
  status: "active" | "inactive";
}

export interface PaginatedGradeBandsResponse {
  success: boolean;
  message: string;
  data: GradeBand[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}