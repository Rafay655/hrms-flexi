export type CompOffStatus = 'pending_approval' | 'approved' | 'rejected' | 'expired';
export type CreditType = 'full_day' | 'half_day';

export interface CompOff {
  id: string;
  uuid: string;
  company_id: number;
  employee_id: number;
  employee: {
    id: string;               // UUID
    uuid: string;
    employee_code: string;
  };
  approved_by_user: {
    id: string;
    uuid: string;
    name: string;
  } | null;
  holiday_date: string;       // YYYY-MM-DD
  hours_worked: number;
  shift_duration: number;
  credit_type: CreditType;
  credit_days: number;
  status: CompOffStatus;
  approved_at: string | null;
  expires_at: string | null;
  expiry_processed: boolean;
  source_event_data: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedCompOffsResponse {
  success: boolean;
  message: string;
  data: {
    data: CompOff[];
    links: any;
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      per_page: number;
      to: number;
      total: number;
    };
  } | null; // /my endpoint returns data directly as array, not inside data.data
}

// For /my endpoint, the response structure is different (data is an array directly)
export interface MyCompOffsResponse {
  success: boolean;
  message: string;
  data: CompOff[];
}