import { api } from '@/lib/api';
import type {
  CostCenter,
  CostCenterFormData,
  CostCenterApiPayload,
  PaginatedCostCentersResponse,
} from '@/types/cost-center';

const BASE_PATH = '/flexi-meta/company/cost-centers';

const toApiPayload = (data: CostCenterFormData): CostCenterApiPayload => ({
  code: data.code.trim(),
  name: data.name.trim(),
  parent_id: data.parent_id === "" ? null : Number(data.parent_id),
  type: data.type as CostCenterApiPayload['type'],
  manager_employee_id: null, // always null as requested
  budget: data.budget ? parseFloat(data.budget) : null,
  currency_id: data.currency_id === "" ? null : Number(data.currency_id),
  status: data.status,
});

export const costCenterService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedCostCentersResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<CostCenter> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: CostCenterFormData): Promise<CostCenter> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: CostCenterFormData): Promise<CostCenter> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};