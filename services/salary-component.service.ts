import { api } from '@/lib/api';
import type {
  SalaryComponent,
  SalaryComponentFormData,
  SalaryComponentApiPayload,
  PaginatedSalaryComponentsResponse,
} from '@/types/salary-component';

const BASE_PATH = '/flexi-meta/employee/salary-components';

const toApiPayload = (data: SalaryComponentFormData): SalaryComponentApiPayload => ({
  code: data.code.trim(),
  name: data.name.trim(),
  type: data.type as SalaryComponentApiPayload['type'],
  status: data.status,
});

export const salaryComponentService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedSalaryComponentsResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<SalaryComponent> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: SalaryComponentFormData): Promise<SalaryComponent> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: SalaryComponentFormData): Promise<SalaryComponent> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};