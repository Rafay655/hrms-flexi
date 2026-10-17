import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { deviceForm, canSyncDevice, validateDeviceForm } from '@/lib/attendance-device';
import type { AttendanceDevice } from '@/types/attendance-device';
import { attendanceDeviceService as service, toDevicePayload } from './attendance-device.service';
vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
const uuid = 'eb599b32-eba8-4c97-890f-1754a361ae27';
const branch = '54be7468-3a09-4f26-9f7d-df59717cb1bc';
const type = '19d2b0fa-d06f-4289-87f1-3c5970b7154e';
const form = () => ({ ...deviceForm(), friendly_name: 'Main gate', hardware_device_id: '1959743', sync_protocol: 'db_api' as const, device_driver: 'db_direct' as const, branch_id: branch, device_type_id: type, db_name: 'ezface', db_username: 'flexi_sync', db_port: '3306', sync_cursor: '0' });
beforeEach(() => vi.resetAllMocks());
describe('attendance device API contract', () => {
  it('requests server pagination and cancellation and preserves UUIDs and zero counts', async () => {
    const response = { success: true, data: [{ id: uuid, last_sync_count: 0 }], meta: { current_page: 2, total: 11, last_page: 2, per_page: 10 } };
    vi.mocked(api.get).mockResolvedValue({ data: response });
    const signal = new AbortController().signal;
    expect(await service.getAll({ page: 2, per_page: 10 }, signal)).toEqual(response);
    expect(api.get).toHaveBeenCalledWith('/time-sync/devices', { params: { page: 2, per_page: 10 }, signal });
    await service.getById(uuid, signal);
    expect(api.get).toHaveBeenLastCalledWith(`/time-sync/devices/${uuid}`, { signal });
  });
  it('creates with UUID lookup references, numeric ports and a zero cursor', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: { id: uuid } } });
    await service.create({ ...form(), db_password: ' secret with spaces ' });
    expect(api.post).toHaveBeenCalledWith('/time-sync/devices', expect.objectContaining({ branch_id: branch, device_type_id: type, db_port: 3306, sync_cursor: 0, db_password: ' secret with spaces ', mappings: [] }));
    expect(toDevicePayload(form())).not.toHaveProperty('db_password');
  });
  it('omits untouched password and mappings on edit; explicitly clears mappings only after editing', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { success: true, data: { id: uuid } } });
    await service.update(uuid, form(), false);
    const payload = vi.mocked(api.put).mock.calls[0][1];
    expect(payload).not.toHaveProperty('db_password'); expect(payload).not.toHaveProperty('mappings');
    await service.update(uuid, form(), true);
    expect(api.put).toHaveBeenLastCalledWith(`/time-sync/devices/${uuid}`, expect.objectContaining({ mappings: [] }));
  });
  it.each(['test', 'sync'] as const)('posts %s to the correct UUID endpoint without an invented payload', async action => {
    const result = { success: true, message: 'Done', data: { connected: false, imported: 0 } };
    vi.mocked(api.post).mockResolvedValue({ data: result });
    expect(await service[action](uuid)).toEqual(result);
    expect(api.post).toHaveBeenCalledExactlyOnceWith(`/time-sync/devices/${uuid}/${action}`);
  });
  it('preserves the top-level one-time API key and accepts empty deletion responses', async () => {
    const result = { success: true, data: { id: uuid }, one_time_api_key: 'ts_example' };
    vi.mocked(api.post).mockResolvedValue({ data: result });
    expect(await service.rotateKey(uuid)).toEqual(result);
    expect(api.post).toHaveBeenCalledWith(`/time-sync/devices/${uuid}/rotate-key`);
    vi.mocked(api.delete).mockResolvedValue({ status: 204 }); await service.delete(uuid);
    expect(api.delete).toHaveBeenCalledExactlyOnceWith(`/time-sync/devices/${uuid}`);
  });
  it('preserves backend validation errors and rejects unsuccessful envelopes', async () => {
    const error = { response: { status: 422, data: { errors: { sync_enabled: ['Enable device before syncing.'] } } } };
    vi.mocked(api.post).mockRejectedValueOnce(error);
    await expect(service.sync(uuid)).rejects.toBe(error);
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: false, message: 'Not available.' } });
    await expect(service.test(uuid)).rejects.toThrow('Not available.');
  });
});
describe('device form and sync rules', () => {
  it('preserves UUIDs and numeric zero fields when loading for editing', () => {
    const device = { ...toDevicePayload(form()), id: uuid, last_sync_count: 0, db_password_set: true } as AttendanceDevice;
    expect(deviceForm(device)).toMatchObject({ branch_id: branch, device_type_id: type, sync_cursor: '0', db_password: '' });
    expect(validateDeviceForm(form())).toBeNull();
  });
  it.each([['port', '1.2'], ['db_port', '65536'], ['sync_cursor', '-1'], ['sync_frequency_minutes', '0'], ['deduplication_window_minutes', '121'], ['branch_id', '1']] as const)('rejects invalid %s=%s', (key, value) => {
    expect(validateDeviceForm({ ...form(), [key]: value })).not.toBeNull();
  });
  it('allows active DB Direct or Pull API sync only', () => {
    const base = { is_active: true, sync_enabled: true, sync_protocol: 'db_api', device_driver: 'db_direct' } as AttendanceDevice;
    expect(canSyncDevice(base)).toBe(true);
    expect(canSyncDevice({ ...base, device_driver: 'rest_api' })).toBe(false);
    expect(canSyncDevice({ ...base, device_driver: 'rest_api', sync_protocol: 'pull_api' })).toBe(true);
    expect(canSyncDevice({ ...base, is_active: false })).toBe(false);
    expect(canSyncDevice({ ...base, sync_enabled: false })).toBe(false);
  });
});
