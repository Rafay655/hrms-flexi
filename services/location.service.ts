import { api } from '@/lib/api';
import type {
  Location,
  LocationFormData,
  LocationApiPayload,
  PaginatedLocationsResponse,
} from '@/types/location';

const BASE_PATH = '/flexi-meta/company/locations';

const toApiPayload = (data: LocationFormData): LocationApiPayload => ({
  code: data.code.trim(),
  name: data.name.trim(),
  location_type_id: Number(data.location_type_id),
  is_virtual: data.is_virtual,
  status: data.status,
});

export const locationService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    location_type_id?: number;
  }): Promise<PaginatedLocationsResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<Location> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: LocationFormData): Promise<Location> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: LocationFormData): Promise<Location> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};