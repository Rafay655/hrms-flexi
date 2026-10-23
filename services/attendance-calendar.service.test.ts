import { beforeEach, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { attendanceCalendarService } from './attendance-calendar.service';
vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('sends documented dates and employee pagination through the authenticated API', async () => {
  const response = { success: true, message: 'OK', data: { from: '2026-09-01', to: '2026-09-30', employees: [], shift_legend: [] }, meta: { total: 0, current_page: 2, per_page: 10, last_page: 2 } };
  vi.mocked(api.get).mockResolvedValue({ data: response });
  const params = { date_from: '2026-09-01', date_to: '2026-09-30', page: 2, per_page: 10 };
  const signal = new AbortController().signal;
  expect(await attendanceCalendarService.get(params, signal)).toEqual(response);
  expect(api.get).toHaveBeenCalledWith('/time-sync/attendance/calendar', { params, signal });
});
it('rejects unsuccessful responses instead of showing an empty calendar', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { success: false, message: 'Unavailable' } });
  await expect(attendanceCalendarService.get({ date_from: '2026-09-01', date_to: '2026-09-30', page: 1, per_page: 10 })).rejects.toThrow('Unavailable');
});
