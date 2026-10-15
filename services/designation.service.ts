import { api } from '@/lib/api';
import type {
  Designation,
  DesignationFormData,
  DesignationApiPayload,
  PaginatedDesignationsResponse,
} from '@/types/designation';

const BASE_PATH = '/flexi-meta/company/designations';

const toApiPayload = (data: DesignationFormData): DesignationApiPayload => ({
  title: data.title.trim(),
  code: data.code.trim(),
  department_id: Number(data.department_id),
  reports_to_id: data.reports_to_id === "" ? null : Number(data.reports_to_id),
  grade_band_id: data.grade_band_id === "" ? null : Number(data.grade_band_id),
  status: data.status,
});

export const designationService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedDesignationsResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<Designation> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: DesignationFormData): Promise<Designation> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: DesignationFormData): Promise<Designation> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};