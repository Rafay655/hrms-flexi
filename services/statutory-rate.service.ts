import { api } from '@/lib/api';
import type {
  StatutoryRate,
  StatutoryRateFormData,
  StatutoryRateApiPayload,
  PaginatedStatutoryRatesResponse,
} from '@/types/statutory-rate';

const BASE_PATH = '/flexi-meta/employee/statutory-rates';

const toApiPayload = (data: StatutoryRateFormData): StatutoryRateApiPayload => ({
  location: String(data.location),
  rate_type: data.rate_type as StatutoryRateApiPayload['rate_type'],
  rate_slabs: data.rate_slabs,
  effective_from: data.effective_from,
  effective_to: data.effective_to || null,
  status: data.status,
});

export const statutoryRateService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedStatutoryRatesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<StatutoryRate> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: StatutoryRateFormData): Promise<StatutoryRate> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: StatutoryRateFormData): Promise<StatutoryRate> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};