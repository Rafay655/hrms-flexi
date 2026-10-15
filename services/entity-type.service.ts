import { api } from '@/lib/api';
import type {
  EntityType,
  EntityTypeFormData,
  EntityTypeApiPayload,
  PaginatedEntityTypesResponse,
} from '@/types/entity-type';

const BASE_PATH = '/flexi-meta/company/entity-types';

// Form data already matches API shape (all strings), just trim strings
const toApiPayload = (data: EntityTypeFormData): EntityTypeApiPayload => ({
  code: data.code.trim(),
  name: data.name.trim(),
  abbreviation: data.abbreviation.trim(),
  status: data.status,
});

export const entityTypeService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedEntityTypesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<EntityType> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: EntityTypeFormData): Promise<EntityType> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: EntityTypeFormData): Promise<EntityType> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};