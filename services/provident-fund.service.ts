// services/provident-fund.service.ts
import { api } from '@/lib/api';
import type {
  PFPolicy,
  CreatePFPolicyPayload,
  UpdatePFPolicyPayload,
  PFPolicyQueryParams,
  PFSalaryInput,
  PFCalculationPreview,
} from '@/types/provident-fund.types';

export const providentFundApi = {
  // ── PF Policies ──────────────────────────────────────
  getPolicies: (params?: PFPolicyQueryParams) =>
    api.get<{ data: PFPolicy[]; meta: any }>('/compliance/provident-fund/policies', { params }),

  getPolicy: (uuid: string) =>
    api.get<{ data: PFPolicy }>(`/compliance/provident-fund/policies/${uuid}`),

  createPolicy: (payload: CreatePFPolicyPayload) =>
    api.post<{ data: PFPolicy }>('/compliance/provident-fund/policies', payload),

  updatePolicy: (uuid: string, payload: UpdatePFPolicyPayload) =>
    api.put<{ data: PFPolicy }>(`/compliance/provident-fund/policies/${uuid}`, payload),

  deletePolicy: (uuid: string) =>
    api.delete(`/compliance/provident-fund/policies/${uuid}`),

  // ── PF Calculation ──────────────────────────────────
  calculatePreview: (payload: PFSalaryInput) =>
    api.post<{ data: PFCalculationPreview }>('/compliance/provident-fund/calculate-preview', payload),
};