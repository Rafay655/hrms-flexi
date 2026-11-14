import { beforeEach, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { shiftService } from './shift.service';
vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
const window = { weekdays: ['monday'], start_time: '13:30:00', end_time: '14:30:00', paid: false, label: 'Lunch' };
const response = { data: { success: true, message: 'Saved', data: { id: 'shift-id', working_days: ['monday'], break_windows: [window] } } };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.put).mockResolvedValue(response); vi.mocked(api.post).mockResolvedValue(response); vi.mocked(api.get).mockResolvedValue(response); });
it.each([undefined, 'shift-id'])('sends nested JSON break objects with API time keys for %s', async uuid => {
  await shiftService.save({ uuid, payload: { name: 'General', break_windows: [{ days: ['monday', 'monday'], start: '13:30', end: '14:30', paid: false, label: ' Lunch ' }] } });
  const call = uuid ? vi.mocked(api.put).mock.calls[0] : vi.mocked(api.post).mock.calls[0];
  expect(call[1]).toEqual({ name: 'General', break_windows: [{ weekdays: ['monday'], start_time: '13:30', end_time: '14:30', paid: false, label: 'Lunch' }] });
  expect(call[2]).toEqual({ headers: { 'Content-Type': 'application/json' } });
});
it('loads current API windows into the editor time fields', async () => {
  expect((await shiftService.getById('shift-id')).break_windows).toEqual([{ days: ['monday'], start: '13:30', end: '14:30', paid: false, label: 'Lunch' }]);
});
it('preserves an explicit empty schedule when clearing breaks', async () => {
  await shiftService.save({ uuid: 'shift-id', payload: { break_windows: [] } });
  expect(vi.mocked(api.put).mock.calls[0][1]).toEqual({ break_windows: [] });
});
it('does not send break windows for an unrelated partial update', async () => {
  await shiftService.save({ uuid: 'shift-id', payload: { is_active: false } });
  expect(vi.mocked(api.put).mock.calls[0][1]).toEqual({ is_active: false });
});
