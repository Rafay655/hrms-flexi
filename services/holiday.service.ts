import { api } from '@/lib/api';
import type {
  Holiday,
  HolidayFormData,
  HolidayApiPayload,
  PaginatedHolidaysResponse,
} from '@/types/holiday';

const BASE_PATH = '/leave-ease/holidays';

const toApiPayload = (data: HolidayFormData): HolidayApiPayload => ({
  name: data.name.trim(),
  date: data.date,
  is_optional: data.is_optional,
  applies_to_all_branches: data.applies_to_all_branches,
  branch_id: data.applies_to_all_branches ? null : (data.branch_id || null),
  holiday_type: data.holiday_type || null,
  year: data.year ? parseInt(data.year) : null,
});

export const holidayService = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const { data } = await api.get<PaginatedHolidaysResponse>(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string) => {
    const { data } = await api.get(`${BASE_PATH}/${uuid}`);
    return data.data as Holiday;
  },

  create: async (payload: HolidayFormData) => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data.data;
  },

  update: async (uuid: string, payload: HolidayFormData) => {
    const { data } = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return data.data;
  },

  delete: async (uuid: string) => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};