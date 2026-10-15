// types/tax-year.types.ts

export interface TaxYearSlab {
  id: string;
  slab_number: number;
  annual_income_from: number;
  annual_income_to: number | null;
  fixed_tax: number;
  tax_rate_percent: number;
  excess_over_amount: number | null;
  slab_label: string | null;
  sort_order: number;
  is_active: boolean;
  taxpayer_category: 'salaried' | 'non_salaried';
  surcharge_threshold: number | null;
  surcharge_rate: number | null;
  label?: string; // computed from backend
}

export interface LegalEntity {
  id: string;
  name: string;
}

export interface TaxYear {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  legal_entity_id: string;
  legal_entity: LegalEntity;
  country: string;
  notes: string | null;
  source_document: string | null;
  verified_by: string | null;
  verified_by_name: string | null;
  verified_date: string | null;
  status: 'draft' | 'active' | 'closed';
  is_active: boolean;
  is_editable: boolean;
  slabs: TaxYearSlab[];
  created_at: string;
  updated_at: string;
}

export interface CreateTaxYearPayload {
  label: string;
  start_date: string;
  end_date: string;
  country?: string;
  notes?: string | null;
  source_document?: string | null;
  verified_by?: string | null;
  verified_date?: string | null;
  status?: 'draft' | 'active' | 'closed';
}

export interface UpdateTaxYearPayload extends Partial<CreateTaxYearPayload> {}

export interface CloneTaxYearPayload {
  label: string;
  start_date: string;
  end_date: string;
  notes?: string | null;
}

export interface CreateSlabPayload {
  slab_number?: number;
  annual_income_from: number;
  annual_income_to?: number | null;
  fixed_tax?: number;
  tax_rate_percent: number;
  excess_over_amount?: number | null;
  slab_label?: string | null;
  sort_order?: number;
  is_active?: boolean;
  taxpayer_category?: 'salaried' | 'non_salaried';
  surcharge_threshold?: number | null;
  surcharge_rate?: number | null;
}

export interface UpdateSlabPayload extends Partial<CreateSlabPayload> {}