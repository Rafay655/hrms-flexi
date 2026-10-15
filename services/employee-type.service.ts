import { api } from '@/lib/api';
import type {
  EmployeeType,
  EmployeeTypeFormData,
  EmployeeTypeApiPayload,
  PaginatedEmployeeTypesResponse,
} from '@/types/employee-type';

const BASE_PATH = '/flexi-meta/employee/employee-types';

const toApiPayload = (data: EmployeeTypeFormData): EmployeeTypeApiPayload => ({
  name: data.name.trim(),
  status: data.status,
});

export const employeeTypeService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedEmployeeTypesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<EmployeeType> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: EmployeeTypeFormData): Promise<EmployeeType> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: EmployeeTypeFormData): Promise<EmployeeType> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};