export type HolidayType = 'national' | 'religious' | 'regional' | 'company';

export interface Holiday {
  id: string;
  uuid: string;
  company_id: number;
  name: string;
  date: string;             // YYYY-MM-DD
  year: number;
  is_optional: boolean;
  holiday_type: HolidayType;
  applies_to_all_branches: boolean;
  branch_id: string | null;   // UUID or null
  branch?: { id: string; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface HolidayFormData {
  name: string;
  date: string;
  is_optional: boolean;
  applies_to_all_branches: boolean;
  branch_id: string;          // UUID or empty
  holiday_type: HolidayType | '';
  year: string;               // number as string for input
}

export interface HolidayApiPayload {
  name: string;
  date: string;
  is_optional: boolean;
  applies_to_all_branches: boolean;
  branch_id: string | null;
  holiday_type: HolidayType | null;
  year: number | null;
}

export interface PaginatedHolidaysResponse {
  success: boolean;
  message: string;
  data: {
    data: Holiday[];
    links: any;
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      per_page: number;
      to: number;
      total: number;
    };
  };
}