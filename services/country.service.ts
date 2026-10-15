import { api } from '@/lib/api';
import type {
  Country,
  CountryFormData,
  CountryApiPayload,
  PaginatedCountriesResponse,
} from '@/types/country';

const BASE_PATH = '/flexi-meta/company/countries';

const toApiPayload = (data: CountryFormData): CountryApiPayload => ({
  name: data.name.trim(),
  iso2: data.iso2.trim().toUpperCase(),
  iso3: data.iso3.trim().toUpperCase() || null,
  phonecode: data.phonecode.trim() || null,
  region: data.region.trim() || null,
  status: data.status,
});

export const countryService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedCountriesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<Country> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: CountryFormData): Promise<Country> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: CountryFormData): Promise<Country> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};