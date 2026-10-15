import { api } from '@/lib/api';
import type {
  LeaveRequest,
  LeaveRequestFormData,
} from '@/types/leave-request';

const BASE_PATH = '/leave-ease/requests';

// Helper to build FormData
const buildFormData = (data: LeaveRequestFormData): FormData => {
  const formData = new FormData();
  formData.append('employee_id', data.employee_id);
  formData.append('leave_type_id', data.leave_type_id);
  formData.append('from_date', data.from_date);
  formData.append('to_date', data.to_date);
  formData.append('is_half_day', data.is_half_day ? '1' : '0');
  if (data.is_half_day && data.half_day_session) {
    formData.append('half_day_session', data.half_day_session);
  }
  if (data.reason.trim()) {
    formData.append('reason', data.reason.trim());
  }
  if (data.attachment instanceof File) {
    formData.append('attachment', data.attachment);
  }
  if (data.reviewer_id.trim()) {
    formData.append('reviewer_id', data.reviewer_id.trim());
  }
  return formData;
};

export const leaveRequestService = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string; status?: string }) => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    return response.data.data as LeaveRequest;
  },

  create: async (payload: LeaveRequestFormData) => {
    const response = await api.post(BASE_PATH, buildFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  update: async (uuid: string, payload: LeaveRequestFormData) => {
    const response = await api.put(`${BASE_PATH}/${uuid}`, buildFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  delete: async (uuid: string) => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};