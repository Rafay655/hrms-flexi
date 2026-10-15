import { api } from '@/lib/api';
import type {
  City,
  CityFormData,
  CityApiPayload,
  PaginatedCitiesResponse,
} from '@/types/city';

const BASE_PATH = '/flexi-meta/company/cities';

const toApiPayload = (data: CityFormData): CityApiPayload => ({
  name: data.name.trim(),
  state_id: Number(data.state_id),
  state_code: data.state_code.trim() || null,
  country_id: Number(data.country_id),
  country_code: data.country_code.trim(),
  latitude: data.latitude ? parseFloat(data.latitude) : null,
  longitude: data.longitude ? parseFloat(data.longitude) : null,
  status: data.status,
});

export const cityService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedCitiesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<City> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: CityFormData): Promise<City> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: CityFormData): Promise<City> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};