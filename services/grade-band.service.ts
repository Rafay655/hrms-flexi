import { api } from '@/lib/api';
import type {
  GradeBand,
  GradeBandFormData,
  GradeBandApiPayload,
  PaginatedGradeBandsResponse,
} from '@/types/grade-band';

const BASE_PATH = '/flexi-meta/company/grade-bands';

const toApiPayload = (data: GradeBandFormData): GradeBandApiPayload => ({
  code: data.code.trim(),
  name: data.name.trim(),
  level: data.level.trim() || null,
  min_salary: parseFloat(data.min_salary) || 0,
  max_salary: parseFloat(data.max_salary) || 0,
  currency_id: Number(data.currency_id),
  benefit_tier: data.benefit_tier as GradeBandApiPayload['benefit_tier'],
  status: data.status,
});

export const gradeBandService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedGradeBandsResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<GradeBand> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: GradeBandFormData): Promise<GradeBand> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: GradeBandFormData): Promise<GradeBand> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};