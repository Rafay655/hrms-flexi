// src/services/gratuity-policy.service.ts

import { api } from '@/lib/api';
import type {
  PaginatedGratuityPoliciesResponse,
  GratuityPolicy,
  CreateGratuityPolicyPayload,
  UpdateGratuityPolicyPayload,
} from '@/types/gratuity-policy';

const BASE_PATH = '/pay-edge/gratuity-policies';

export const gratuityPolicyService = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const { data } = await api.get<PaginatedGratuityPoliciesResponse>(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    return response.data.data as GratuityPolicy;
  },

  create: async (payload: CreateGratuityPolicyPayload) => {
    const { data } = await api.post<{ success: boolean; message: string; data: GratuityPolicy }>(BASE_PATH, payload);
    return data;
  },

  update: async (uuid: string, payload: UpdateGratuityPolicyPayload) => {
    const { data } = await api.put<{ success: boolean; message: string; data: GratuityPolicy }>(`${BASE_PATH}/${uuid}`, payload);
    return data;
  },
};