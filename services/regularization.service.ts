import { api } from '@/lib/api';
import type {
  Regularization,
  RegularizationFormData,
} from '@/types/regularization';

const BASE_PATH = '/time-sync/regularizations';

export const regularizationService = {
  getMyRegularizations: async (params: any) => {
    const { data } = await api.get(`${BASE_PATH}/my`, { params });
    return data;
  },

  getAllRegularizations: async (params: any) => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  create: async (payload: RegularizationFormData) => {
    // Convert datetime-local to ISO
    const apiPayload = {
      employee_id: payload.employee_id,
      attendance_date: payload.attendance_date,
      correction_type: payload.correction_type,
      requested_in: payload.requested_in ? new Date(payload.requested_in).toISOString() : null,
      requested_out: payload.requested_out ? new Date(payload.requested_out).toISOString() : null,
      reason: payload.reason,
      supporting_doc_path: payload.supporting_doc_path || null,
    };
    const { data } = await api.post(BASE_PATH, apiPayload);
    return data;
  },
};