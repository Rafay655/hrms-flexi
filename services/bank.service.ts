import { api } from '@/lib/api';
import type {
  Bank,
  BankFormData,
  BankApiPayload,
  PaginatedBanksResponse,
} from '@/types/bank';

const BASE_PATH = '/flexi-meta/employee/banks';

const toApiPayload = (data: BankFormData): BankApiPayload => ({
  code: data.code.trim(),
  name: data.name.trim(),
  country: data.country.trim() || null,
  status: data.status,
});

export const bankService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedBanksResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<Bank> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: BankFormData): Promise<Bank> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: BankFormData): Promise<Bank> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};