import { api } from '@/lib/api';
import type {
  IbanFormat,
  IbanFormatFormData,
  IbanFormatApiPayload,
  PaginatedIbanFormatsResponse,
} from '@/types/iban-format';

const BASE_PATH = '/flexi-meta/employee/iban-formats';

const toApiPayload = (data: IbanFormatFormData): IbanFormatApiPayload => ({
  country: data.country.trim(),
  regex_pattern: data.regex_pattern.trim(),
  example: data.example.trim() || null,
  status: data.status,
});

export const ibanFormatService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedIbanFormatsResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<IbanFormat> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: IbanFormatFormData): Promise<IbanFormat> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: IbanFormatFormData): Promise<IbanFormat> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};