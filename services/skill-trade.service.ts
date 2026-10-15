import { api } from '@/lib/api';
import type {
  SkillTrade,
  SkillTradeFormData,
  SkillTradeApiPayload,
  PaginatedSkillTradesResponse,
} from '@/types/skill-trade';

const BASE_PATH = '/flexi-meta/employee/skill-trades';

const toApiPayload = (data: SkillTradeFormData): SkillTradeApiPayload => ({
  code: data.code.trim() || null,
  name: data.name.trim(),
  status: data.status,
});

export const skillTradeService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedSkillTradesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<SkillTrade> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: SkillTradeFormData): Promise<SkillTrade> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: SkillTradeFormData): Promise<SkillTrade> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};