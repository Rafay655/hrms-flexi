// services/eobi-config.service.ts
import { api } from '@/lib/api';
import type {
  EobiConfig,
  CreateEobiConfigPayload,
  UpdateEobiConfigPayload,
  EobiConfigQueryParams,
} from '@/types/eobi-config.types';

export const eobiConfigApi = {
  getConfigs: (params?: EobiConfigQueryParams) =>
    api.get<{ data: EobiConfig[]; meta: any }>('/compliance/eobi/configs', { params }),

  getConfig: (uuid: string) =>
    api.get<{ data: EobiConfig }>(`/compliance/eobi/configs/${uuid}`),

  createConfig: (payload: CreateEobiConfigPayload) =>
    api.post<{ data: EobiConfig }>('/compliance/eobi/configs', payload),

  updateConfig: (uuid: string, payload: UpdateEobiConfigPayload) =>
    api.put<{ data: EobiConfig }>(`/compliance/eobi/configs/${uuid}`, payload),

  deleteConfig: (uuid: string) =>
    api.delete(`/compliance/eobi/configs/${uuid}`),
};