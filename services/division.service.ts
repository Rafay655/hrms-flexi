import { api } from '@/lib/api';
import type {
  Division,
  DivisionFormData,
  DivisionApiPayload,
  PaginatedDivisionsResponse,
} from '@/types/division';

const BASE_PATH = '/flexi-meta/company/divisions';

// Convert form data to API payload
const toApiPayload = (data: DivisionFormData): DivisionApiPayload => ({
  code: data.code.trim(),
  name: data.name.trim(),
  head_employee_id: data.head_employee_id === "" ? null : Number(data.head_employee_id),
  effective_from: data.effective_from,
  effective_to: data.effective_to || null,
  status: data.status,
});

export const divisionService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedDivisionsResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<Division> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: DivisionFormData): Promise<Division> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: DivisionFormData): Promise<Division> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};