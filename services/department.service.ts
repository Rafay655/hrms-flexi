import { api } from '@/lib/api';
import type {
  Department,
  DepartmentFormData,
  DepartmentApiPayload,
  PaginatedDepartmentsResponse,
} from '@/types/department';

const BASE_PATH = '/flexi-meta/company/departments';

const toApiPayload = (data: DepartmentFormData): DepartmentApiPayload => ({
  code: data.code.trim(),
  name: data.name.trim(),
  division_id: Number(data.division_id),
  head_employee_id: null, // always null as requested
  status: data.status,
});

export const departmentService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedDepartmentsResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<Department> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: DepartmentFormData): Promise<Department> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: DepartmentFormData): Promise<Department> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};