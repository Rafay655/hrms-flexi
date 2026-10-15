export interface ShiftArchetype {
  id: string;            // UUID
  name: string;
  code: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ShiftArchetypeFormData {
  name: string;
  code: string;
  is_active: boolean;
}

export interface ShiftArchetypeApiPayload {
  name: string;
  code: string;
  is_active: boolean;
}

export interface PaginatedShiftArchetypesResponse {
  success: boolean;
  message: string;
  data: {
    data: ShiftArchetype[];
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