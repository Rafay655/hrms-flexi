export type TemplateType = 'weekly' | 'fortnightly' | 'yearly';
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface PatternDay {
  shift?: { id: string; name: string; code: string; start_time: string; end_time: string; is_active: boolean } | null;
  day: Weekday;
  shift_id: string | null;   // UUID or null
  is_off: boolean;
}

export interface RosterTemplate {
  id: string;                // UUID
  name: string;
  template_type: TemplateType;
  working_days: Weekday[];
  pattern_data: PatternDay[];
  auto_generate: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RosterTemplateFormData {
  name: string;
  template_type: TemplateType | '';
  working_days: Weekday[];
  pattern_data: PatternDay[];
  auto_generate: boolean;
  is_active: boolean;
}

export interface RosterTemplateApiPayload {
  name: string;
  template_type: TemplateType;
  working_days: Weekday[];
  pattern_data: PatternDay[];
  auto_generate: boolean;
  is_active: boolean;
}

export interface PaginatedRosterTemplatesResponse {
  success: boolean;
  message: string;
  data: RosterTemplate[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}
