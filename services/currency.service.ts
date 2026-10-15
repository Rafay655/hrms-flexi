import { api } from '@/lib/api';
import type {
  Currency,
  CurrencyFormData,
  CurrencyApiPayload,
  PaginatedCurrenciesResponse,
} from '@/types/currency';

const BASE_PATH = '/flexi-meta/employee/currencies';

const toApiPayload = (data: CurrencyFormData): CurrencyApiPayload => ({
  name: data.name.trim(),
  iso_code: data.iso_code.trim().toUpperCase(),
  symbol: data.symbol.trim(),
  decimal_places: data.decimal_places,
  status: data.status,
});

export const currencyService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedCurrenciesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<Currency> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: CurrencyFormData): Promise<Currency> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: CurrencyFormData): Promise<Currency> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};