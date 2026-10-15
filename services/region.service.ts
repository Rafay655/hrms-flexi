import { api } from '@/lib/api';
import type { Region, RegionFormData, PaginatedRegionsResponse } from '@/types/region';

const BASE_PATH = '/flexi-meta/company/regions';

export const regionService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedRegionsResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<Region> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: RegionFormData): Promise<Region> => {
    const { data } = await api.post(BASE_PATH, payload);
    return data;
  },

  update: async (id: number, payload: RegionFormData): Promise<Region> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};