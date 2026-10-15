import { api } from '@/lib/api';
import type {
  MinimumWage,
  MinimumWageFormData,
  MinimumWageApiPayload,
  PaginatedMinimumWagesResponse,
} from '@/types/minimum-wage';

const BASE_PATH = '/flexi-meta/employee/minimum-wages';

const toApiPayload = (data: MinimumWageFormData): MinimumWageApiPayload => ({
  location: String(data.location),
  wage_amount: data.wage_amount,
  wage_basis: data.wage_basis as MinimumWageApiPayload['wage_basis'],
  currency_id: Number(data.currency_id),
  effective_from: data.effective_from,
  effective_to: data.effective_to || null,
  status: data.status,
});

export const minimumWageService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedMinimumWagesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<MinimumWage> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: MinimumWageFormData): Promise<MinimumWage> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: MinimumWageFormData): Promise<MinimumWage> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};