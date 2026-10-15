import { api } from '@/lib/api';
import type {
  Shift,
  ShiftFormData,
  ShiftApiPayload,
  PaginatedShiftsResponse,
  Weekday,
} from '@/types/shift';

const BASE_PATH = '/time-sync/shifts';

// Normalise working_days – API may return a JSON string or an array
const normaliseWorkingDays = (days: any): Weekday[] => {
  if (!days) return [];
  if (Array.isArray(days)) return days as Weekday[];
  if (typeof days === 'string') {
    try {
      const parsed = JSON.parse(days);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const toApiPayload = (data: ShiftFormData): ShiftApiPayload => ({
  shift_archetype_id: data.shift_archetype_id || null,
  name: data.name.trim(),
  code: data.code.trim(),
  shift_type: data.shift_type as ShiftApiPayload['shift_type'],
  start_time: data.start_time,
  end_time: data.end_time,
  is_night_shift: data.is_night_shift,
  grace_minutes: data.grace_minutes,
  early_out_grace_minutes: data.early_out_grace_minutes,
  break_duration_minutes: data.break_duration_minutes,
  overtime_allowed: data.overtime_allowed,
  ot_threshold_minutes: data.ot_threshold_minutes,
  max_ot_minutes_per_day: data.max_ot_minutes_per_day
    ? parseInt(data.max_ot_minutes_per_day)
    : null,
  working_days: data.working_days,
  is_active: data.is_active,
  attendance_policy_id: data.attendance_policy_id,
});

export const shiftService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: number;
  }) => {
    const response = await api.get<PaginatedShiftsResponse>(BASE_PATH, { params });
    // Normalise working_days for every record
    if (response.data?.data?.data) {
      response.data.data.data = response.data.data.data.map((s: any) => ({
        ...s,
        working_days: normaliseWorkingDays(s.working_days),
      }));
    }
    return response.data;
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    const item = response.data.data;
    return { ...item, working_days: normaliseWorkingDays(item.working_days) };
  },

  create: async (payload: ShiftFormData) => {
    const response = await api.post(BASE_PATH, toApiPayload(payload));
    return response.data.data;
  },

  update: async (uuid: string, payload: ShiftFormData) => {
    const response = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return response.data.data;
  },

  delete: async (uuid: string) => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};