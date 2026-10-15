import { api } from '@/lib/api';
import type {
  State,
  StateFormData,
  StateApiPayload,
  PaginatedStatesResponse,
} from '@/types/state';

const BASE_PATH = '/flexi-meta/company/states';

const toApiPayload = (data: StateFormData): StateApiPayload => ({
  name: data.name.trim(),
  code: data.code.trim() || null,
  country_id: Number(data.country_id),
  country_code: data.country_code.trim(),
  latitude: data.latitude ? parseFloat(data.latitude) : null,
  longitude: data.longitude ? parseFloat(data.longitude) : null,
  status: data.status,
});

export const stateService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedStatesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<State> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: StateFormData): Promise<State> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: StateFormData): Promise<State> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};