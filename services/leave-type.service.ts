import { api } from '@/lib/api';
import type {
  LeaveType,
  LeaveTypeFormData,
  LeaveTypeApiPayload,
  PaginatedLeaveTypesResponse,
  GenderRestriction,
} from '@/types/leave-type';

function checked<T extends { success?: boolean; message?: string }>(response: T): T {
  if (response.success === false) throw new Error(response.message || 'Leave type request failed');
  return response;
}

const BASE_PATH = '/leave-ease/leave-types';

const toApiPayload = (data: LeaveTypeFormData): LeaveTypeApiPayload => ({
  name: data.name.trim(),
  code: data.code.trim(),
  is_paid: data.is_paid,
  is_encashable: data.is_encashable,
  carry_forward_allowed: data.carry_forward_allowed,
  requires_attachment: data.requires_attachment,
  min_days_notice: data.min_days_notice,
  allow_half_day: data.allow_half_day,
  is_gender_specific: data.is_gender_specific,
  gender_restriction: data.is_gender_specific && data.gender_restriction ? data.gender_restriction as GenderRestriction : null,
  is_active: data.is_active,
});

export const leaveTypeService = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string; is_active?: number }) => {
    const { data } = await api.get<PaginatedLeaveTypesResponse>(BASE_PATH, { params });
    return checked(data);
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    return checked(response.data).data as LeaveType;
  },

  create: async (payload: LeaveTypeFormData) => {
    const response = await api.post(BASE_PATH, toApiPayload(payload));
    return checked(response.data).data;
  },

  update: async (uuid: string, payload: LeaveTypeFormData) => {
    const response = await api.patch(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return checked(response.data).data;
  },

  delete: async (uuid: string) => {
    const response = await api.delete(`${BASE_PATH}/${uuid}`);
    if (response.data) checked(response.data);
  },
};
