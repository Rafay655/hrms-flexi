export type LeaveRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'revoked';
export type HalfDaySession = 'am' | 'pm';

export interface LeaveRequest {
  id: string;
  uuid: string;
  company_id: number;
  employee_id: number;
  employee: {
    id: string;
    uuid: string;
    employee_code: string;
  };
  leave_type: {
    id: string;
    uuid: string;
    name: string;
    code: string;
    is_paid: boolean;
  };
  reviewer?: { id: string; name: string } | null;
  approved_by_user?: { id: string; uuid: string; name: string } | null;
  from_date: string;
  to_date: string;
  is_half_day: boolean;
  half_day_session: HalfDaySession | null;
  total_days: number;
  reason: string | null;
  attachment_path: string | null;   // returned by API
  status: LeaveRequestStatus;
  rejection_reason: string | null;
  approved_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  balance_deducted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveRequestFormData {
  employee_id: string;
  leave_type_id: string;
  from_date: string;
  to_date: string;
  is_half_day: boolean;
  half_day_session: HalfDaySession | '';
  reason: string;
  attachment: File | null;       // changed from string
  reviewer_id: string;
}

// No longer needed as we build FormData directly