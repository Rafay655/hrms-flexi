import { api } from '@/lib/api';
import type {
  AccrualRule,
  AccrualRuleFormData,
  AccrualRuleApiPayload,
  PaginatedAccrualRulesResponse,
  AccrualFrequency,
} from '@/types/accrual-rule';

const BASE_PATH = '/leave-ease/accrual-rule';

const toApiPayload = (data: AccrualRuleFormData): AccrualRuleApiPayload => ({
  leave_type_uuid: data.leave_type_uuid,
  name: data.name.trim(),
  accrual_frequency: data.accrual_frequency as AccrualFrequency,
  days_per_accrual: data.days_per_accrual,
  max_carry_forward: data.max_carry_forward === '' ? null : parseFloat(data.max_carry_forward),
  carry_forward_expiry_months: data.carry_forward_expiry_months === '' ? null : parseInt(data.carry_forward_expiry_months),
  is_prorated_for_new_joiners: data.is_prorated_for_new_joiners,
  min_service_months_for_accrual: data.min_service_months_for_accrual,
  is_active: data.is_active,
  effective_from: data.effective_from,
  effective_to: data.effective_to || null,
});

export const accrualRuleService = {
  getAll: async (params?: { page?: number; per_page?: number }) => {
    const { data } = await api.get<PaginatedAccrualRulesResponse>(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    return response.data.data as AccrualRule;
  },

  create: async (payload: AccrualRuleFormData) => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data.data;
  },

  update: async (uuid: string, payload: AccrualRuleFormData) => {
    const { data } = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return data.data;
  },

  delete: async (uuid: string) => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};