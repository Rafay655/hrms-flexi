export type CorrectionType = 'add_in' | 'add_out' | 'correct_in' | 'correct_out'; // guess
export type RegularizationStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Regularization {
  id: string;
  internal_id: number;
  company_id: number;
  employee_id: string;
  employee_internal_id: number;
  employee: {
    id: string;
    internal_id: number;
    employee_code: string;
    name: string;
  };
  attendance_date: string;      // "YYYY-MM-DD"
  correction_type: CorrectionType;
  requested_in: string | null;   // datetime
  requested_out: string | null;  // datetime
  reason: string;
  supporting_doc_path: string | null;
  status: RegularizationStatus;
  decided_by?: number;
  decided_by_user?: { id: number; name: string; email: string };
  decided_at?: string;
  rejection_reason?: string | null;
  escalated_at?: string | null;
  escalated_to?: number;
  escalated_to_user?: any | null;
  monthly_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface RegularizationFormData {
  employee_id: string;
  attendance_date: string;
  correction_type: CorrectionType | '';
  requested_in: string;     // datetime-local string
  requested_out: string;    // datetime-local string
  reason: string;
  supporting_doc_path: string;
}

export interface RegularizationFilters {
  page?: number;
  per_page?: number;
  status?: string;
  correction_type?: string;
  date_from?: string;
  date_to?: string;
}