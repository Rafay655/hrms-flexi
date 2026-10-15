// services/minimum-wage.service.ts
import { api } from '@/lib/api';
import type {
  MinimumWage,
  CreateMinimumWagePayload,
  UpdateMinimumWagePayload,
  MinimumWageQueryParams,
} from '@/types/minimum-wage.types';

export const minimumWageApi = {
  getConfigs: (params?: MinimumWageQueryParams) =>
    api.get<{ data: MinimumWage[]; meta: any }>('/compliance/minimum-wages', { params }),

  getConfig: (uuid: string) =>
    api.get<{ data: MinimumWage }>(`/compliance/minimum-wages/${uuid}`),

  createConfig: (payload: CreateMinimumWagePayload) =>
    api.post<{ data: MinimumWage }>('/compliance/minimum-wages', payload),

  updateConfig: (uuid: string, payload: UpdateMinimumWagePayload) =>
    api.put<{ data: MinimumWage }>(`/compliance/minimum-wages/${uuid}`, payload),

  deleteConfig: (uuid: string) =>
    api.delete(`/compliance/minimum-wages/${uuid}`),
};