// src/services/salary-structure.service.ts

import { api } from '@/lib/api';
import type {
  SalaryStructure,
  SalaryStructureFormData,
  SalaryStructureApiPayload,
  PaginatedSalaryStructuresResponse,
  SalaryStructureComponentFormData,
  SimulationRequest,
  SimulationResponse,
  SalaryStructureComponent
} from '@/types/salary-structure';




// ─── Helpers ─────────────────────────────────────────────────────────
const BASE_PATH = '/pay-edge/salary-structures';

const toApiPayload = (data: SalaryStructureFormData): SalaryStructureApiPayload => ({
  name: data.name.trim(),
  description: data.description.trim() || null,
  currency_code: data.currency_code.trim() || null,
  is_default: data.is_default,
  is_active: data.is_active,
});

// ─── Service ─────────────────────────────────────────────────────────
export const salaryStructureService = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const { data } = await api.get<PaginatedSalaryStructuresResponse>(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    return response.data.data as SalaryStructure;
  },

  create: async (payload: SalaryStructureFormData) => {
    const response = await api.post(BASE_PATH, toApiPayload(payload));
    return response.data.data;
  },

  update: async (uuid: string, payload: SalaryStructureFormData) => {
    const response = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return response.data.data;
  },

  delete: async (uuid: string) => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },

  // ── Clone ─────────────────────────────────────────────────────
  clone: async (uuid: string, newName: string) => {
    const response = await api.post(`${BASE_PATH}/${uuid}/clone`, {
      new_name: newName,
    });
    return response.data; // you can adapt to response.data.data if needed
  },

  // ── Components ────────────────────────────────────────────────
  createComponent: async (structureUuid: string, payload: SalaryStructureComponentFormData) => {
    const { data } = await api.post(
      `${BASE_PATH}/${structureUuid}/components`,
      {
        pay_head_id: payload.pay_head_id || null,
        calculation_type: payload.calculation_type,
        default_value: payload.default_value || null,
        percentage: payload.percentage || null,
        formula_expression: payload.formula_expression || null,
        min_amount: payload.min_amount || null,
        max_amount: payload.max_amount || null,
        is_mandatory: payload.is_mandatory,
        display_order: payload.display_order,
      }
    );
    return data.data as SalaryStructureComponent;
  },

  // ── Simulation ────────────────────────────────────────────────
  simulate: async (payload: SimulationRequest): Promise<SimulationResponse> => {
    const { data } = await api.post<SimulationResponse>(
      `${BASE_PATH}/${payload.uuid}/simulate`,
      { gross_salary: payload.gross_salary }
    );
    return data;
  },
};