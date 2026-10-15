import { api } from '@/lib/api';
import type {
  HealthCondition,
  HealthConditionFormData,
  HealthConditionApiPayload,
  PaginatedHealthConditionsResponse,
} from '@/types/health-condition';

const BASE_PATH = '/flexi-meta/employee/health-conditions';

const toApiPayload = (data: HealthConditionFormData): HealthConditionApiPayload => ({
  name: data.name.trim(),
  status: data.status,
});

export const healthConditionService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedHealthConditionsResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<HealthCondition> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: HealthConditionFormData): Promise<HealthCondition> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: HealthConditionFormData): Promise<HealthCondition> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};