export interface LeaveEncashment {
  uuid: string;
  employee: {
    id: string;           // UUID
    name: string;
  };
  leave_type: {
    id: string;           // UUID
    name: string;
    code: string;
  };
  year: number;
  days_encashed: number;
  rate_per_day: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';  // likely statuses
  approved_by: string | null;
  approved_at: string | null;
  payroll_included: boolean;
  rejection_reason: string | null;
  created_by: string;
  created_at: string;
}

export interface LeaveEncashmentFormData {
  company_id: string;       // UUID
  employee_id: string;      // UUID
  leave_type_id: string;    // UUID
  year: number;
  days_encashed: number;
  rate_per_day: string;     // optional, may be empty
}

export interface PaginatedLeaveEncashmentsResponse {
  success: boolean;
  message: string;
  data: LeaveEncashment[];   // array directly under data
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}