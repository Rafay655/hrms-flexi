import { api } from '@/lib/api';
import type { LwpRecord, LwpFormData, PaginatedLwpResponse } from '@/types/lwp';

const BASE_PATH = '/leave-ease/lwp';

export const lwpService = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const { data } = await api.get<PaginatedLwpResponse>(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    return response.data.data as LwpRecord;
  },

  create: async (payload: LwpFormData) => {
    const { data } = await api.post(BASE_PATH, payload);
    return data.data;
  },
};