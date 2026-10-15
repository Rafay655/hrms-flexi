import { api } from '@/lib/api';
import type {
  AttendanceDevice,
  AttendanceDeviceFormData,

  DeviceMapping,
} from '@/types/attendance-device';

const BASE_PATH = '/time-sync/devices';

const toApiPayload = (data: AttendanceDeviceFormData) => ({
  hardware_device_id: data.hardware_device_id.trim(),
  friendly_name: data.friendly_name.trim(),
  device_name: data.device_name.trim() || null,
  device_type_id: data.device_type_id || null,
  model_make: data.model_make.trim() || null,
  serial_number: data.serial_number.trim() || null,
  branch_id: data.branch_id || null,
  internal_location_name: data.internal_location_name.trim() || null,
  sync_protocol: data.sync_protocol,
  device_driver: data.device_driver,
  ip_address: data.ip_address.trim() || null,
  port: data.port ? parseInt(data.port) : null,
  sync_frequency_minutes: data.sync_frequency_minutes ? parseInt(data.sync_frequency_minutes) : null,
  ip_whitelist: data.ip_whitelist.trim() || null,
  deduplication_window_minutes: data.deduplication_window_minutes ? parseInt(data.deduplication_window_minutes) : null,
  auto_retry_on_failure: data.auto_retry_on_failure,
  sync_enabled: data.sync_enabled,
  is_active: data.is_active,
  mappings: data.mappings,
});

export const attendanceDeviceService = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string; is_active?: number }) => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    return response.data.data as AttendanceDevice;
  },

  create: async (payload: AttendanceDeviceFormData) => {
    const response = await api.post(BASE_PATH, toApiPayload(payload));
    return response.data.data;
  },

  update: async (uuid: string, payload: AttendanceDeviceFormData) => {
    const response = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return response.data.data;
  },

  delete: async (uuid: string) => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};