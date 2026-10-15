import { api } from '@/lib/api';
import type { PaginatedCompOffsResponse, MyCompOffsResponse } from '@/types/comp-off';

const BASE_PATH = '/leave-ease/comp-off';

export const compOffService = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string; status?: string }) => {
    const { data } = await api.get<PaginatedCompOffsResponse>(BASE_PATH, { params });
    return data;
  },

  getMy: async (params?: { page?: number; per_page?: number; search?: string; status?: string }) => {
    const { data } = await api.get<MyCompOffsResponse>(`${BASE_PATH}/my`, { params });
    return data;
  },

  create: async (payload: CompOffFormData) => {
    const { data } = await api.post(BASE_PATH, payload);
    return data.data;
  },
};

// Form data type
export interface CompOffFormData {
  employee_id: string;      // UUID
  holiday_date: string;     // YYYY-MM-DD
  hours_worked: number;
  shift_duration: number;
  credit_type: string;      // 'full_day' | 'half_day'
  expires_at: string | null;
  source_event_data: Record<string, any> | null;
}