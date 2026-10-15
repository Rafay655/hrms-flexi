// types/ledger.types.ts

export interface LedgerEntry {
  id: string;
  legal_entity_id: string | null;
  employee_uuid: string;
  employee_name: string;
  state_id: number | null;
  state_name: string | null;
  payroll_month: number;
  payroll_year: number;
  contribution_type: string;
  employee_amount: string;
  employer_amount: string;
  total_amount: string;
  source_calculation_id: string | null;
  adjusts_ledger_id: string | null;
  adjustment_reason: string | null;
  remittance_status: 'pending' | 'included_in_challan' | 'remitted' | 'reconciled' | 'adjusted' | 'reversed';
  challan_no: string | null;
  challan_document_id: string | null;
  remitted_at: string | null;
  remitted_by: string | null;
  is_locked: boolean;
  is_immutable: boolean;
  created_at: string;
  updated_at: string;
}

export interface LedgerQueryParams {
  contribution_type?: string;
  remittance_status?: string;
  state_id?: number;
  payroll_month?: number;
  payroll_year?: number;
  employee_uuid?: string;
  challan_no?: string;
  legal_entity_id?: string;
  is_locked?: boolean;
  per_page?: number;
  page?: number;
}

export interface MarkIncludedPayload {
  ledger_uuids: string[];
}

export interface MarkRemittedPayload {
  ledger_uuids: string[];
  challan_no: string;
  payment_date: string;
}

export interface ReconcilePayload {
  ledger_uuids: string[];
}

export interface AdjustPayload {
  ledger_uuid: string;
  employee_amount: number;
  employer_amount: number;
  reason: string;
}

export interface ReversePayload {
  ledger_uuid: string;
  reason: string;
}

export interface UploadChallanPayload {
  ledger_uuid: string;
  challan_file: File;
  challan_no: string;
  description?: string;
}