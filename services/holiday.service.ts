import { api } from '@/lib/api';
import type {
  Holiday,
  HolidayYearResponse,
  HolidayFormData,
  HolidayApiPayload,
  PaginatedHolidaysResponse,
} from '@/types/holiday';

function checked<T extends { success?: boolean; message?: string }>(data: T): T {
  if (data.success === false) throw new Error(data.message || 'Holiday request failed');
  return data;
}

const BASE_PATH = '/leave-ease/holidays';

const toApiPayload = (data: HolidayFormData): HolidayApiPayload => ({
  name: data.name.trim(),
  date: data.date,
  is_optional: data.is_optional,
  applies_to_all_branches: data.applies_to_all_branches,
  branch_id: data.applies_to_all_branches ? null : (data.branch_id || null),
  holiday_type: data.holiday_type || null,
  year: data.date ? Number(data.date.slice(0, 4)) : null,
});

export const holidayService = {
  getYear: async (year: number) => {
    const { data } = await api.get<HolidayYearResponse>(`${BASE_PATH}/bulk`, { params: { year } });
    return checked(data).data;
  },
  getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const { data } = await api.get<PaginatedHolidaysResponse>(BASE_PATH, { params });
    return checked(data);
  },

  getById: async (uuid: string) => {
    const { data } = await api.get(`${BASE_PATH}/${uuid}`);
    return checked(data).data as Holiday;
  },

  create: async (payload: HolidayFormData) => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return checked(data).data;
  },

  update: async (uuid: string, payload: HolidayFormData) => {
    const { year, holiday_type, ...values } = toApiPayload(payload);
    void year;
    const { data } = await api.patch(`${BASE_PATH}/${uuid}`, {
      ...values, ...(holiday_type ? { holiday_type } : {}),
    });
    return checked(data).data;
  },

  delete: async (uuid: string) => {
    const { data } = await api.delete(`${BASE_PATH}/${uuid}`);
    if (data) checked(data);
  },
};