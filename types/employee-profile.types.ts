// types/employee-profile.types.ts

export interface EmployeeProfile {
  employee_uuid: string;
  employee_name: string;
  has_statutory_profile: boolean;
  cnic: string | null;
  cnic_masked: string | null;
  ntn: string | null;
  eobi_number: string | null;
  ss_number: string | null;
  social_security_number: string | null;
  legal_entity_id: string | null;
  work_location_id: number | null;
  state_id: number | null;
  state: { id: number; name: string; code: string } | null;
  home_state_id: number | null;
  effective_from: string | null;
  effective_to: string | null;
  filer_status: 'active_filer' | 'non_filer' | 'unknown' | null;
  is_filer: boolean;
  filer_verified_date: string | null;
  atl_verification_date: string | null;
  eobi_applicable: boolean;
  eobi_registration_date: string | null;
  eobi_registration_status: string | null;
  social_security_applicable: boolean;
  ss_scheme: string | null;
  ss_registration_date: string | null;
  ss_registration_status: string | null;
  tax_exemption_category: string | null;
  tax_exemption_percentage: string | null;
  exemption_certificate_number: string | null;
  previous_employer_taxable_income: string | null;
  previous_employer_tax_deducted: string | null;
  previous_employer_name: string | null;
  previous_employer_ntn: string | null;
  provident_fund_applicable: boolean;
  gratuity_applicable: boolean;
  gratuity_service_start_date: string | null;
  status: string | null;
}

export interface EmployeeProfileListResponse {
  current_page: number;
  data: EmployeeProfile[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: any[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface EmployeeProfileQueryParams {
  filer?: boolean;
  state_id?: number;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface CreateEmployeeProfilePayload {
  employee_uuid: string;
  state_id?: number | null;
  eobi_applicable?: boolean;
  social_security_applicable?: boolean;
  provident_fund_applicable?: boolean;
  gratuity_applicable?: boolean;
  is_filer?: boolean;
  filer_status?: 'active_filer' | 'non_filer' | 'unknown';
  effective_from?: string;
  cnic?: string;
  ntn?: string | null;
  eobi_number?: string | null;
  ss_number?: string | null;
    status?: 'draft' | 'active' | 'inactive';
}

export interface UpdateEmployeeProfilePayload {
  cnic?: string;
  ntn?: string | null;
  eobi_number?: string | null;
  ss_number?: string | null;
  is_filer?: boolean;
  filer_status?: 'active_filer' | 'non_filer' | 'unknown';
  eobi_applicable?: boolean;
  social_security_applicable?: boolean;
  provident_fund_applicable?: boolean;
  gratuity_applicable?: boolean;
  effective_from?: string;
  tax_exemption_category?: string | null;
  tax_exemption_percentage?: number | null;
  previous_employer_taxable_income?: number | null;
  previous_employer_tax_deducted?: number | null;
  previous_employer_name?: string | null;
  previous_employer_ntn?: string | null;
  gratuity_service_start_date?: string | null;
    status?: 'draft' | 'active' | 'inactive';
}

export interface TransferProvincePayload {
  new_work_location_id: string;
  new_state_id: number;
  effective_from: string;
  transfer_reason?: string | null;
  requires_new_ss_registration?: boolean;
  new_ss_scheme?: string | null;
  notes?: string | null;
}

export interface ProfileHistory {
  id: string;
  from_state_id: number;
  from_state_name: string;
  to_state_id: number;
  to_state_name: string;
  new_work_location_id: number;
  new_work_location_name: string;
  effective_from: string;
  effective_to: string | null;
  transfer_reason: string | null;
  requires_new_ss_registration: boolean;
  new_ss_scheme: string | null;
  notes: string | null;
  old_eobi_registration_status: string | null;
  old_ss_registration_status: string | null;
  transferred_by: string | null;
  transferred_at: string;
}