import { api } from '@/lib/api';
import type {
  MaritalStatus,
  MaritalStatusFormData,
  MaritalStatusApiPayload,
  PaginatedMaritalStatusesResponse,
} from '@/types/marital-status';

const BASE_PATH = '/flexi-meta/employee/marital-statuses';

const toApiPayload = (data: MaritalStatusFormData): MaritalStatusApiPayload => ({
  name: data.name.trim(),
  status: data.status,
});

export const maritalStatusService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedMaritalStatusesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<MaritalStatus> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: MaritalStatusFormData): Promise<MaritalStatus> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: MaritalStatusFormData): Promise<MaritalStatus> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};