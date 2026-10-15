// types/minimum-wage.types.ts

export interface MinimumWage {
  id: string;
  company_id: string | null;
  state_id: number;
  region_city: string | null;
  wage_category: 'unskilled' | 'semi_skilled' | 'skilled' | 'highly_skilled' | 'general' | 'other';
  wage_basis: 'gross' | 'basic' | 'custom';
  minimum_wage_amount: number;
  payroll_behavior: 'warning' | 'block' | 'require_approval';
  effective_from: string;
  effective_to: string | null;
  source_document_path: string | null;
  status: 'draft' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateMinimumWagePayload {
  state_id: number;
  region_city?: string | null;
  wage_category?: 'unskilled' | 'semi_skilled' | 'skilled' | 'highly_skilled' | 'general' | 'other';
  wage_basis?: 'gross' | 'basic' | 'custom';
  minimum_wage_amount: number;
  payroll_behavior?: 'warning' | 'block' | 'require_approval';
  effective_from: string;
  effective_to?: string | null;
  source_document_path?: string | null;
  status?: 'draft' | 'active' | 'inactive';
}

export interface UpdateMinimumWagePayload extends Partial<CreateMinimumWagePayload> {}

export interface MinimumWageQueryParams {
  state_id?: number;
  status?: string;
  page?: number;
  per_page?: number;
  search?: string;
}