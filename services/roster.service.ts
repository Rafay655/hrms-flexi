import { api } from '@/lib/api';
import type {
  RosterAssignment,
  RosterFormData,
  RosterApiPayload,
  PaginatedRostersResponse,
} from '@/types/roster';

const BASE_PATH = '/time-sync/roster';

const toApiPayload = (data: RosterFormData): RosterApiPayload => ({
  employee_id: data.employee_id,
  shift_id: data.shift_id || null,
  roster_date: data.roster_date,
  is_weekly_off: data.is_weekly_off,
  is_holiday: data.is_holiday,
  status: data.status,
  notes: data.notes.trim() || null,
  template_id: data.template_id || null,
});

export const rosterService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    date_from?: string;
    date_to?: string;
    status?: string;
    employee_id?: string;
  }) => {
    const { data } = await api.get<PaginatedRostersResponse>(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    return response.data.data as RosterAssignment;
  },

  create: async (payload: RosterFormData) => {
    const response = await api.post(BASE_PATH, toApiPayload(payload));
    return response.data.data;
  },

  update: async (uuid: string, payload: RosterFormData) => {
    const response = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return response.data.data;
  },

  delete: async (uuid: string) => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },

  publish: async (ids: string[]) => {
    const response = await api.post(`${BASE_PATH}/publish`, { ids });
    return response.data;
  },
};