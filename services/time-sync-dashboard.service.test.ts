import { beforeEach, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { timeSyncDashboardService } from './time-sync-dashboard.service';
import fixture from '@/tests/fixtures/time-sync-dashboard.json';
vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('passes the selected month and cancellation signal to the authenticated endpoint', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: fixture } });
  const signal = new AbortController().signal;
  expect(await timeSyncDashboardService.get('2026-10', signal)).toEqual(fixture);
  expect(api.get).toHaveBeenCalledWith('/time-sync/dashboard', { params: { month: '2026-10' }, signal });
});
it('rejects failed responses', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { success: false, message: 'Unavailable' } });
  await expect(timeSyncDashboardService.get('2026-10')).rejects.toThrow('Unavailable');
});

it('accepts null or empty serialized collections without rejecting the dashboard', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { ...fixture, recent_activity: null, attendance_trend: {} } } });
  const result = await timeSyncDashboardService.get('2026-10');
  expect(result.recent_activity).toEqual([]);
  expect(result.attendance_trend).toEqual([]);
  expect(result.kpi).toEqual(fixture.kpi);
});
it('identifies missing required fields rather than giving a generic response error', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { attendance: {} } } });
  await expect(timeSyncDashboardService.get('2026-10')).rejects.toThrow('missing kpi');
});
