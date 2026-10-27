import { beforeEach, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { attendanceExceptionService } from './attendance-exception.service';
vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('sends list filters and cancellation to the documented anomalies endpoint', async () => {
  const response = { success: true, message: 'OK', data: [], meta: { total: 0, current_page: 1, last_page: 0, per_page: 0 } };
  vi.mocked(api.get).mockResolvedValue({ data: response });
  const filters = { date_from: '2026-10-01', date_to: '2026-10-23', status: 'pending' as const, category: 'missing_punch' as const, page: 1, per_page: 25 };
  const signal = new AbortController().signal;
  expect(await attendanceExceptionService.list(filters, signal)).toEqual(response);
  expect(api.get).toHaveBeenCalledWith('/time-sync/anomalies', { params: filters, signal });
});
it('rejects backend failures instead of displaying successful empty results', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { success: false, message: 'Unavailable' } });
  await expect(attendanceExceptionService.list({ page: 1, per_page: 25 })).rejects.toThrow('Unavailable');
});
