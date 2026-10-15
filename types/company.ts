export type CompanyStatus = "active" | "inactive";

export type Company = {
  id: string;
  company_name: string;
  company_name_urdu: string | null;
  company_code: string;
  logo_url: string | null;
  letterhead_url: string | null;
  parent_company_id: string | null;
  parent_company_name: string | null;
  website_url: string | null;
  fiscal_year_start_month: number | null;
  industry: string | null;
  theme_color: string | null;
  description: string | null;
  support_email: string | null;
  social_profiles: unknown[] | null;
  official_email: string | null;
  phone: string | null;
  timezone: string | null;
 country: { id: string; code: string; name: string }
state_province: { id: string; code: string; name: string }
city: { id: string; name: string }
currency: { id: string; code: string; name: string; symbol: string }
  address_line_1: string | null;
  address_line_2: string | null;
  street: string | null;
  postal_code: string | null;
  incorporation_date: string | null;
  registration_number: string | null;
  tax_vat_id: string | null;
  date_format: string | null;
  week_start_day: string | null;
  divisions_count: number;
  departments_count: number;
  employees_count: number;
  status: CompanyStatus;
  wizard_step: number | null;
  created_at: string;
  updated_at: string;
};

export type PaginationMeta = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
};

export type PaginatedCompaniesResponse = {
  success: boolean;
  message: string;
  data: Company[];
  meta: PaginationMeta;
};

export type CompanyStep1FormData = {
  company_name: string;
  company_code: string;
  parent_company_id?: string | null;
  website_url?: string | null;
  fiscal_year_start_month?: string | number | null;
  industry?: string | null;
  logo?: File | string | null;
  theme_color?: string | null;
  description?: string | null;
};

export type CompanyStep1ApiPayload = FormData;

export type CompanyStep1Response = {
  success: boolean;
  message: string;
  data: Company;
};

export type SocialPlatform =
  | "linkedin"
  | "twitter"
  | "facebook"
  | "instagram"
  | "youtube"
  | "other";

export type SocialProfile = {
  platform: SocialPlatform;
  handle: string;
  url: string;
};

export type CompanyStep2FormData = {
  support_email?: string | null;
  social_profiles?: SocialProfile[];
};

export type CompanyStep2Response = {
  success: boolean;
  message: string;
  data: Company;
};

export type CompanyStep3Response = {
  success: boolean;
  message: string;
  data: Company;
};