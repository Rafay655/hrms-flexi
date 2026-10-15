import { api } from '@/lib/api';
import type {
  Salutation,
  SalutationFormData,
  SalutationApiPayload,
  PaginatedSalutationsResponse,
} from '@/types/salutation';

const BASE_PATH = '/flexi-meta/employee/salutations';

const toApiPayload = (data: SalutationFormData): SalutationApiPayload => ({
  name: data.name.trim(),
  status: data.status,
});

export const salutationService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedSalutationsResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<Salutation> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: SalutationFormData): Promise<Salutation> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: SalutationFormData): Promise<Salutation> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};