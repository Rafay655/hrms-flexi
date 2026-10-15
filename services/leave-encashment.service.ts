import { api } from '@/lib/api';
import type { LeaveEncashment, LeaveEncashmentFormData, PaginatedLeaveEncashmentsResponse } from '@/types/leave-encashment';

const BASE_PATH = '/leave-ease/encashment';

export const leaveEncashmentService = {
  getAll: async (params: { page?: number; per_page?: number; company_id?: string }) => {
    const { data } = await api.get<PaginatedLeaveEncashmentsResponse>(BASE_PATH, { params });
    return data;
  },

  create: async (payload: LeaveEncashmentFormData) => {
    const { data } = await api.post(BASE_PATH, {
      company_id: payload.company_id,
      employee_id: payload.employee_id,
      leave_type_id: payload.leave_type_id,
      year: payload.year,
      days_encashed: payload.days_encashed,
      rate_per_day: payload.rate_per_day ? parseFloat(payload.rate_per_day) : null,
    });
    return data;
  },
};