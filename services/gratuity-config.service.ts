// services/gratuity-config.service.ts
import { api } from '@/lib/api';
import type {
  GratuityConfig,
  CreateGratuityConfigPayload,
  UpdateGratuityConfigPayload,
  GratuityConfigQueryParams,
} from '@/types/gratuity-config.types';

export const gratuityConfigApi = {
  getConfigs: (params?: GratuityConfigQueryParams) =>
    api.get<{ data: GratuityConfig[]; meta: any }>('/compliance/gratuity/policies', { params }),

  getConfig: (uuid: string) =>
    api.get<{ data: GratuityConfig }>(`/compliance/gratuity/policies/${uuid}`),

  createConfig: (payload: CreateGratuityConfigPayload) =>
    api.post<{ data: GratuityConfig }>('/compliance/gratuity/policies', payload),

  updateConfig: (uuid: string, payload: UpdateGratuityConfigPayload) =>
    api.put<{ data: GratuityConfig }>(`/compliance/gratuity/policies/${uuid}`, payload),

  deleteConfig: (uuid: string) =>
    api.delete(`/compliance/gratuity/policies/${uuid}`),
};