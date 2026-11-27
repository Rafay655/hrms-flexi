import { api } from '@/lib/api';
import type {
  State,
  StateFormData,
  StateApiPayload,
  PaginatedStatesResponse,
} from '@/types/state';

const BASE_PATH = '/flexi-meta/company/states';

const toApiPayload = (data: StateFormData): StateApiPayload => ({
  name: data.name.trim(),
  code: data.code.trim() || null,
  country_id: Number(data.country_id),
  country_code: data.country_code.trim(),
  latitude: data.latitude ? parseFloat(data.latitude) : null,
  longitude: data.longitude ? parseFloat(data.longitude) : null,
  status: data.status,
});

export const stateService = {
  getOptions: async (countryId: number, signal?: AbortSignal): Promise<State[]> => {
    const rows: State[] = [];
    let page = 1;
    let lastPage = 1;
    do {
      const {data} = await api.get<PaginatedStatesResponse>(BASE_PATH, {params: {country_id: countryId, per_page: 100, page}, signal});
      if (data.success === false || !Array.isArray(data.data)) throw new Error('Unable to load states for the selected country.');
      lastPage = Number(data.meta?.last_page ?? 1);
      if (!Number.isSafeInteger(lastPage) || lastPage < page || (lastPage > page && !data.data.length)) throw new Error('Incomplete state options response.');
      rows.push(...data.data.filter(state => String(state.country_id ?? state.country?.id) === String(countryId)));
      page++;
    } while (page <= lastPage);
    return [...new Map(rows.map(state => [String(state.id), state])).values()];
  },
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    country_id?: number;
  }): Promise<PaginatedStatesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<State> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: StateFormData): Promise<State> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: StateFormData): Promise<State> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};