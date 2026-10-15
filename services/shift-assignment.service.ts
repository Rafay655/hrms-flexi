import { api } from '@/lib/api';
import type {
  ShiftAssignment,
  ShiftAssignmentFormData,
  ShiftAssignmentApiPayload,
  PaginatedShiftAssignmentsResponse,
} from '@/types/shift-assignment';

const BASE_PATH = '/time-sync/shift-assignments';

const toApiPayload = (data: ShiftAssignmentFormData): ShiftAssignmentApiPayload => ({
  employee_id: data.employee_id,
  shift_id: data.shift_id,
  valid_from: data.valid_from,
  valid_to: data.valid_to || null,
  is_active: data.is_active,
});

export const shiftAssignmentService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: number;
  }) => {
    const { data } = await api.get<PaginatedShiftAssignmentsResponse>(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    return response.data.data as ShiftAssignment;
  },

  create: async (payload: ShiftAssignmentFormData) => {
    const response = await api.post(BASE_PATH, toApiPayload(payload));
    return response.data.data as ShiftAssignment;
  },

  update: async (uuid: string, payload: ShiftAssignmentFormData) => {
    const response = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return response.data.data as ShiftAssignment;
  },

  delete: async (uuid: string) => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};