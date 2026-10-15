import { api } from '@/lib/api';
import type {
  BloodGroup,
  BloodGroupFormData,
  BloodGroupApiPayload,
  PaginatedBloodGroupsResponse,
} from '@/types/blood-group';

const BASE_PATH = '/flexi-meta/employee/blood-groups';

const toApiPayload = (data: BloodGroupFormData): BloodGroupApiPayload => ({
  name: data.name.trim(),
  status: data.status,
});

export const bloodGroupService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedBloodGroupsResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<BloodGroup> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: BloodGroupFormData): Promise<BloodGroup> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: BloodGroupFormData): Promise<BloodGroup> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};