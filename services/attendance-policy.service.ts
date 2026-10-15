import { api } from '@/lib/api';
import type {
  AttendancePolicy,
  AttendancePolicyFormData,
  AttendancePolicyApiPayload,
  PaginatedAttendancePoliciesResponse,
} from '@/types/attendance-policy';

const BASE_PATH = '/time-sync/policies';

// Helper: transform form data → API payload
const toApiPayload = (data: AttendancePolicyFormData): AttendancePolicyApiPayload => ({
  policy_name: data.policy_name.trim(),
  branch_ids: data.branch_ids.map(String), // ensure they're strings
  department_ids: data.department_ids.map(Number),
  employment_types: data.employment_types.map(Number),
  grace_in_minutes: data.grace_in_minutes,
  grace_out_minutes: data.grace_out_minutes,
  half_day_threshold_minutes: data.half_day_threshold_minutes,
  absent_threshold_minutes: data.absent_threshold_minutes,
  short_leave_threshold_minutes: data.short_leave_threshold_minutes,
  late_marks_for_half_day: data.late_marks_for_half_day,
  late_marks_for_absent: data.late_marks_for_absent,
  max_short_leaves_per_month: data.max_short_leaves_per_month,
  auto_absent_on_no_punch: data.auto_absent_on_no_punch,
  auto_absent_cutoff_time: data.auto_absent_cutoff_time,
  ot_calculation_method: data.ot_calculation_method,
  min_ot_minutes: data.min_ot_minutes,
  ot_rate_weekday: parseFloat(data.ot_rate_weekday) || 0,
  ot_rate_weekend: parseFloat(data.ot_rate_weekend) || 0,
  night_window_start: data.night_window_start,
  night_window_end: data.night_window_end,
  night_premium_rate: parseFloat(data.night_premium_rate) || 0,
  comp_off_eligible_on: data.comp_off_eligible_on,
  comp_off_min_hours: parseFloat(data.comp_off_min_hours) || 0,
  comp_off_expiry_days: data.comp_off_expiry_days,
  regularization_max_days_back: data.regularization_max_days_back,
  regularization_max_per_month: data.regularization_max_per_month,
  is_default: data.is_default,
  effective_from: data.effective_from,
  effective_to: data.effective_to || null,
  is_active: data.is_active,
});

export const attendancePolicyService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedAttendancePoliciesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string): Promise<AttendancePolicy> => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    // The single GET endpoint returns { success, data: { ... } }
    return response.data.data;
  },

  create: async (payload: AttendancePolicyFormData): Promise<AttendancePolicy> => {
    const response = await api.post(BASE_PATH, toApiPayload(payload));
    return response.data.data;
  },

  update: async (uuid: string, payload: AttendancePolicyFormData): Promise<AttendancePolicy> => {
    const response = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return response.data.data;
  },

  delete: async (uuid: string): Promise<void> => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};