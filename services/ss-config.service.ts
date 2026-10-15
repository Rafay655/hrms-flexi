// services/ss-config.service.ts
import { api } from '@/lib/api';
import type {
  SsConfig,
  CreateSsConfigPayload,
  UpdateSsConfigPayload,
  SsConfigQueryParams,
} from '@/types/ss-config.types';

export const ssConfigApi = {
  getConfigs: (params?: SsConfigQueryParams) =>
    api.get<{ data: SsConfig[]; meta: any }>('/compliance/social-security/configs', { params }),

  getConfig: (uuid: string) =>
    api.get<{ data: SsConfig }>(`/compliance/social-security/configs/${uuid}`),

  createConfig: (payload: CreateSsConfigPayload) =>
    api.post<{ data: SsConfig }>('/compliance/social-security/configs', payload),

  updateConfig: (uuid: string, payload: UpdateSsConfigPayload) =>
    api.put<{ data: SsConfig }>(`/compliance/social-security/configs/${uuid}`, payload),

  deleteConfig: (uuid: string) =>
    api.delete(`/compliance/social-security/configs/${uuid}`),
};