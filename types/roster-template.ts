export type TemplateType = 'weekly' | 'bi-weekly' | 'monthly' | 'custom';
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface PatternDay {
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