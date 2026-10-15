// types/entity-profile.types.ts

// ============================================================================
// Shared / Nested Types
// ============================================================================

export interface State {
  id: number;
  name: string;
  code?: string;
}

export interface LegalEntity {
  id: string;          // UUID
  name: string;
}

export interface SSRegistration {
  state_id: number;
  scheme: string;
  employer_registration_no: string;
  registration_office: string | null;
  effective_from: string;
  status: 'active' | 'inactive' | 'pending';
}

// ============================================================================
// API Response Type
// ============================================================================

export interface EntityProfile {
  id: string;
  company_id: string | null;
  legal_entity: LegalEntity | null;          // from API response
  legal_entity_id: number | null;           // legacy numeric ID, ignore
  default_state: State | null;              // from API response
  default_state_id: number | null;          // legacy numeric ID, ignore
  operating_state_ids: State[];             // array of State objects
  ntn_masked: string | null;
  strn_masked: string | null;
  eobi_applicable: boolean;
  eobi_employer_registration_no: string | null;
  eobi_registration_office: string | null;
  eobi_effective_from: string | null;
  ss_applicable: boolean;
  ss_registrations: SSRegistration[];
  wwf_applicable: boolean;
  wppf_applicable: boolean;
  professional_tax_applicable: boolean;
  effective_from: string;
  effective_to: string | null;
  status: 'draft' | 'active' | 'inactive';
  is_editable: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Frontend Form State (used in create/edit modal)
// ============================================================================

export interface EntityProfileFormData {
  legal_entity_id: string | null;           // UUID of legal entity
  default_state_id: number | undefined;
  operating_state_ids: number[];
  ntn: string | null;
  strn: string | null;
  eobi_applicable: boolean;
  eobi_employer_registration_no: string | null;
  eobi_registration_office: string | null;
  eobi_effective_from: string | null;
  ss_applicable: boolean;
  wwf_applicable: boolean;
  wppf_applicable: boolean;
  professional_tax_applicable: boolean;
  effective_from: string;
  effective_to: string | null;
  status: 'draft' | 'active' | 'inactive';
}

// ============================================================================
// API Payloads (create / update)
// ============================================================================

export interface CreateEntityProfilePayload {
  legal_entity_id?: string | null;           // UUID
  default_state_id: number;
  operating_state_ids: number[];
  ntn?: string | null;
  strn?: string | null;
  eobi_applicable?: boolean;
  eobi_employer_registration_no?: string | null;
  eobi_registration_office?: string | null;
  eobi_effective_from?: string | null;
  ss_applicable?: boolean;
  ss_registrations?: SSRegistration[];
  wwf_applicable?: boolean;
  wppf_applicable?: boolean;
  professional_tax_applicable?: boolean;
  effective_from: string;
  effective_to?: string | null;
  status?: 'draft' | 'active' | 'inactive';
}

export interface UpdateEntityProfilePayload extends Partial<CreateEntityProfilePayload> {}

// ============================================================================
// Query Parameters
// ============================================================================

export interface EntityProfileQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}