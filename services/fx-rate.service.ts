import { api } from '@/lib/api';
import type {
  FxRate,
  FxRateFormData,
  FxRateApiPayload,
  PaginatedFxRatesResponse,
} from '@/types/fx-rate';

const BASE_PATH = '/flexi-meta/employee/fx-rates';

const toApiPayload = (data: FxRateFormData): FxRateApiPayload => ({
  from_currency_id: Number(data.from_currency_id),
  to_currency_id: Number(data.to_currency_id),
  exchange_rate: data.exchange_rate,
  rate_date: data.rate_date,
});

export const fxRateService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedFxRatesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<FxRate> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: FxRateFormData): Promise<FxRate> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: FxRateFormData): Promise<FxRate> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};