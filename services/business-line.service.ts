import { api } from '@/lib/api';
import type {
  BusinessLine,
  BusinessLineFormData,
  BusinessLineApiPayload,
  PaginatedBusinessLinesResponse,
} from '@/types/business-line';

const BASE_PATH = '/flexi-meta/company/business-lines';

// Convert form data to API payload (trim strings, handle nulls)
const toApiPayload = (data: BusinessLineFormData): BusinessLineApiPayload => ({
  code: data.code.trim(),
  name: data.name.trim(),
  description: data.description.trim() || null,
  industry_code: data.industry_code.trim() || null,
  status: data.status,
});

export const businessLineService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedBusinessLinesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<BusinessLine> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: BusinessLineFormData): Promise<BusinessLine> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: BusinessLineFormData): Promise<BusinessLine> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};