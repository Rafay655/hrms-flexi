// src/services/salary-assignment.service.ts

import { api } from '@/lib/api';
import type {
  PaginatedSalaryAssignmentsResponse,
  SalaryAssignment,
  UpdateSalaryAssignmentPayload,
} from '@/types/salary-assignment';

const BASE_PATH = '/pay-edge/salary-assignments';

export interface CreateSalaryAssignmentPayload {
  employee_uuid: string;
  salary_structure_id: string;
  effective_from: string;
  effective_to?: string | null;
  gross_salary: number;
  currency_code?: string | null;
  revision_reason: string;
  status?: string;
}

export const salaryAssignmentService = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const { data } = await api.get<PaginatedSalaryAssignmentsResponse>(BASE_PATH, { params });
    return data;
  },

  create: async (payload: CreateSalaryAssignmentPayload) => {
    const { employee_uuid, ...body } = payload;
    const { data } = await api.post<{ success: boolean; message: string; data: SalaryAssignment }>(
      `/pay-edge/employees/${employee_uuid}/salary`,
      body
    );
    return data;
  },

  // ── Update ────────────────────────────────────────────────
  update: async (employeeUuid: string, assignmentUuid: string, payload: UpdateSalaryAssignmentPayload) => {
    const { data } = await api.put<{ success: boolean; message: string; data: SalaryAssignment }>(
      `/pay-edge/employees/${employeeUuid}/salary/${assignmentUuid}`,
      payload
    );
    return data;
  },
};