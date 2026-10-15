import { api } from '@/lib/api';
import type {
  ShiftArchetype,
  ShiftArchetypeFormData,
  ShiftArchetypeApiPayload,
  PaginatedShiftArchetypesResponse,
} from '@/types/shift-archetype';

const BASE_PATH = '/flexi-meta/company/shift-archetypes';

const toApiPayload = (data: ShiftArchetypeFormData): ShiftArchetypeApiPayload => ({
  name: data.name.trim(),
  code: data.code.trim(),
  is_active: data.is_active,
});

export const shiftArchetypeService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: number;       // 1 for active only, 0 for inactive, undefined for all
  }) => {
    const { data } = await api.get<PaginatedShiftArchetypesResponse>(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    return response.data.data as ShiftArchetype;
  },

  create: async (payload: ShiftArchetypeFormData) => {
    const response = await api.post(BASE_PATH, toApiPayload(payload));
    return response.data.data as ShiftArchetype;
  },

  update: async (uuid: string, payload: ShiftArchetypeFormData) => {
    const response = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return response.data.data as ShiftArchetype;
  },

  delete: async (uuid: string) => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};