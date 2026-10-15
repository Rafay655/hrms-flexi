import { api } from '@/lib/api';
import type {
  DeviceType,
  DeviceTypeFormData,
  DeviceTypeApiPayload,
  PaginatedDeviceTypesResponse,
} from '@/types/device-type';

const BASE_PATH = '/flexi-meta/company/device-types';

const toApiPayload = (data: DeviceTypeFormData): DeviceTypeApiPayload => ({
  code: data.code.trim(),
  name: data.name.trim(),
  manufacturer: data.manufacturer.trim() || null,
  communication_protocol: data.communication_protocol as DeviceTypeApiPayload['communication_protocol'],
  is_biometric: data.is_biometric,
  supported_functions: data.supported_functions.length ? data.supported_functions : null,
  status: data.status,
});

export const deviceTypeService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedDeviceTypesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string): Promise<DeviceType> => {
    const { data } = await api.get(`${BASE_PATH}/${uuid}`);
    return data;
  },

  create: async (payload: DeviceTypeFormData): Promise<DeviceType> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (uuid: string, payload: DeviceTypeFormData): Promise<DeviceType> => {
    const { data } = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return data;
  },

  delete: async (uuid: string): Promise<void> => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};