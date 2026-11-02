import { api } from '@/lib/api';
import type {
  AccrualRule,
  AccrualRuleFilters,
  AccrualRuleFormData,
  AccrualRuleApiPayload,
  PaginatedAccrualRulesResponse,
  AccrualFrequency,
} from '@/types/accrual-rule';

function checked<T extends {success?:boolean;message?:string}>(data:T):T {
  if(data.success===false)throw new Error(data.message||'Accrual rule request failed');
  return data;
}

const BASE_PATH = '/leave-ease/accrual-rule';

const toApiPayload = (data: AccrualRuleFormData): AccrualRuleApiPayload => ({
  leave_type_uuid: data.leave_type_uuid,
  name: data.name.trim(),
  accrual_frequency: data.accrual_frequency as AccrualFrequency,
  days_per_accrual: Number(data.days_per_accrual),
  max_carry_forward: data.max_carry_forward === '' ? null : parseFloat(data.max_carry_forward),
  carry_forward_expiry_months: data.carry_forward_expiry_months === '' ? null : Number(data.carry_forward_expiry_months),
  is_prorated_for_new_joiners: data.is_prorated_for_new_joiners,
  min_service_months_for_accrual: data.min_service_months_for_accrual,
  is_active: data.is_active,
  effective_from: data.effective_from,
  effective_to: data.effective_to || null,
});

export const accrualRuleService = {
  getSearchPool: async (filters: Omit<AccrualRuleFilters, 'page' | 'per_page'>, signal?: AbortSignal): Promise<AccrualRule[]> => {
    const rows = new Map<string, AccrualRule>();
    let page = 1;
    while (true) {
      const response = await accrualRuleService.getAll({ ...filters, page, per_page: 100 }, signal);
      for (const row of response.data) rows.set(row.uuid, row);
      if (page >= response.meta.last_page) break;
      if (response.meta.current_page !== page || !response.data.length) throw new Error('Could not load every accrual-rule page for search. Please retry.');
      page += 1;
    }
    return [...rows.values()];
  },
  getAll: async (params?: AccrualRuleFilters, signal?: AbortSignal) => {
    const { data } = await api.get<PaginatedAccrualRulesResponse>(BASE_PATH, { params, signal });
    return checked(data);
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    return checked(response.data).data as AccrualRule;
  },

  create: async (payload: AccrualRuleFormData) => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return checked(data).data;
  },

  update: async (uuid: string, payload: AccrualRuleFormData) => {
    const { data } = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return checked(data).data;
  },

  delete: async (uuid: string) => {
    const { data } = await api.delete(`${BASE_PATH}/${uuid}`);
    if(data)checked(data);
  },
};