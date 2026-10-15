import { api } from '@/lib/api';
import type {
  LocationType,
  LocationTypeFormData,
  LocationTypeApiPayload,
  PaginatedLocationTypesResponse,
} from '@/types/location-type';

const BASE_PATH = '/flexi-meta/company/location-types';

// Convert form data to API payload (abbreviation can be null if empty)
const toApiPayload = (data: LocationTypeFormData): LocationTypeApiPayload => ({
  code: data.code.trim(),
  name: data.name.trim(),
  abbreviation: data.abbreviation.trim() || null,
  scope: data.scope as LocationTypeApiPayload['scope'],
  status: data.status,
});

export const locationTypeService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedLocationTypesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<LocationType> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: LocationTypeFormData): Promise<LocationType> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: LocationTypeFormData): Promise<LocationType> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};