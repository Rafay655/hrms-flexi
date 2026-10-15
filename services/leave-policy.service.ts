import { api } from '@/lib/api';
import type { LeavePolicy, LeavePolicyFormData, LeavePolicyApiPayload } from '@/types/leave-policy';

const BASE_PATH = '/leave-ease/policies';

// Helper to convert form data to API payload.
// For edit, scope fields are sent unchanged (they will be ignored by backend).
const toApiPayload = (data: LeavePolicyFormData): LeavePolicyApiPayload => ({
  leave_type_id: data.leave_type_id || null,
  grade_band_id: data.grade_band_id === '' ? null : Number(data.grade_band_id),
  department_id: data.department_id === '' ? null : Number(data.department_id),
  annual_entitlement: data.annual_entitlement,
  carry_forward_limit: data.carry_forward_limit === '' ? null : parseFloat(data.carry_forward_limit),
  encashment_limit: data.encashment_limit === '' ? null : parseFloat(data.encashment_limit),
  accrual_rate: data.accrual_rate === '' ? null : parseFloat(data.accrual_rate),
  accrual_period: data.accrual_period || null,
  probation_eligible: data.probation_eligible,
  min_service_months: data.min_service_months,
  max_consecutive_days: data.max_consecutive_days === '' ? null : parseInt(data.max_consecutive_days),
  requires_approval: data.requires_approval,
  effective_from: data.effective_from,
  is_active: data.is_active,
});

export const leavePolicyService = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string) => {
    const { data } = await api.get(`${BASE_PATH}/${uuid}`);
    return data.data as LeavePolicy;
  },

  create: async (payload: LeavePolicyFormData) => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data.data;
  },

  update: async (uuid: string, payload: LeavePolicyFormData) => {
    const { data } = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return data.data;
  },

  delete: async (uuid: string) => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};