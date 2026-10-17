import { api } from '@/lib/api';
import type { AttendanceDevice, AttendanceDeviceFormData, AttendanceDeviceFilters, DeviceEnvelope, DeviceListResponse, DeviceOperationResult, RotateDeviceKeyResponse } from '@/types/attendance-device';
const BASE_PATH = '/time-sync/devices';
export function toDevicePayload(form: AttendanceDeviceFormData, includeMappings = true) {
  const { db_password, mappings, ...fields } = form;
  return {
    ...fields,
    hardware_device_id: form.hardware_device_id.trim(), friendly_name: form.friendly_name.trim(),
    device_name: form.device_name.trim() || null, device_type_id: form.device_type_id || null,
    model_make: form.model_make.trim() || null, serial_number: form.serial_number.trim() || null,
    branch_id: form.branch_id || null, internal_location_name: form.internal_location_name.trim() || null,
    ip_address: form.ip_address.trim() || null, port: form.port === '' ? null : Number(form.port),
    db_host: form.db_host.trim() || null, db_port: form.db_port === '' ? null : Number(form.db_port),
    db_name: form.db_name.trim() || null, db_username: form.db_username.trim() || null,
    sync_cursor: form.sync_cursor === '' ? null : Number(form.sync_cursor),
    sync_frequency_minutes: form.sync_frequency_minutes === '' ? null : Number(form.sync_frequency_minutes),
    deduplication_window_minutes: form.deduplication_window_minutes === '' ? null : Number(form.deduplication_window_minutes),
    ip_whitelist: form.ip_whitelist.trim() || null,
    ...(db_password !== '' ? { db_password } : {}),
    ...(includeMappings ? { mappings: mappings.map(mapping => ({ ...mapping, device_key: mapping.device_key.trim(), default_value: mapping.default_value || null, notes: mapping.notes || null })) } : {}),
  };
}
function checked<T extends { success: boolean; message: string }>(response: T): T {
  if (!response.success) throw new Error(response.message || 'Device request failed.');
  return response;
}
export const attendanceDeviceService = {
  async getAll(params?: AttendanceDeviceFilters, signal?: AbortSignal) {
    return checked((await api.get<DeviceListResponse>(BASE_PATH, { params, signal })).data);
  },
  async getById(uuid: string, signal?: AbortSignal) {
    return checked((await api.get<DeviceEnvelope<AttendanceDevice>>(`${BASE_PATH}/${uuid}`, { signal })).data).data;
  },
  async create(form: AttendanceDeviceFormData) {
    return checked((await api.post<DeviceEnvelope<AttendanceDevice>>(BASE_PATH, toDevicePayload(form))).data).data;
  },
  async update(uuid: string, form: AttendanceDeviceFormData, includeMappings = true) {
    return checked((await api.put<DeviceEnvelope<AttendanceDevice>>(`${BASE_PATH}/${uuid}`, toDevicePayload(form, includeMappings))).data).data;
  },
  async delete(uuid: string) { await api.delete(`${BASE_PATH}/${uuid}`); },
  async test(uuid: string) {
    return checked((await api.post<DeviceEnvelope<DeviceOperationResult>>(`${BASE_PATH}/${uuid}/test`)).data);
  },
  async sync(uuid: string) {
    return checked((await api.post<DeviceEnvelope<DeviceOperationResult>>(`${BASE_PATH}/${uuid}/sync`)).data);
  },
  async rotateKey(uuid: string) {
    return checked((await api.post<RotateDeviceKeyResponse>(`${BASE_PATH}/${uuid}/rotate-key`)).data);
  },
};
