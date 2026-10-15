import { api } from '@/lib/api';
import type { PayHead, PayHeadFormData, PaginatedPayHeadsResponse } from '@/types/pay-head';

const BASE_PATH = '/pay-edge/pay-heads';

const toApiPayload = (data: PayHeadFormData) => ({
  code: data.code.trim(),
  name: data.name.trim(),
  name_urdu: data.name_urdu.trim() || null,
  type: data.type,
  category: data.category,
  calculation_type: data.calculation_type,
  formula_expression: data.calculation_type === 'formula' ? data.formula_expression.trim() : null,
  is_taxable: data.is_taxable,
  is_statutory: data.is_statutory,
  statutory_code: data.statutory_code || null,
  affects_eobi: data.affects_eobi,
  affects_pessi: data.affects_pessi,
  is_part_of_gross: data.is_part_of_gross,
  is_part_of_ctc: data.is_part_of_ctc,
  is_overridable: data.is_overridable,   // ✅ new field
  display_order: data.display_order,
  is_active: data.is_active,
});

export const payHeadService = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const { data } = await api.get<PaginatedPayHeadsResponse>(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    return response.data.data as PayHead;
  },

  create: async (payload: PayHeadFormData) => {
    const response = await api.post(BASE_PATH, toApiPayload(payload));
    return response.data.data;
  },

  update: async (uuid: string, payload: PayHeadFormData) => {
    const response = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return response.data.data;
  },

  delete: async (uuid: string) => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};