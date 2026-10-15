import { api } from '@/lib/api';
import type {
  Gender,
  GenderFormData,
  GenderApiPayload,
  PaginatedGendersResponse,
} from '@/types/gender';

const BASE_PATH = '/flexi-meta/employee/genders';

const toApiPayload = (data: GenderFormData): GenderApiPayload => ({
  name: data.name.trim(),
  status: data.status,
});

export const genderService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedGendersResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<Gender> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: GenderFormData): Promise<Gender> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: GenderFormData): Promise<Gender> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};