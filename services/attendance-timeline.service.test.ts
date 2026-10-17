import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { timelineDay, timelineSummary, timelineToday } from '@/tests/fixtures/attendance-timeline';
import { attendanceTimelineService as service } from './attendance-timeline.service';
vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
describe('my timeline endpoints', () => {
  it('collects every server page for the calendar while preserving month and filters', async () => {
    const signal = new AbortController().signal;
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [timelineDay], meta: { current_page: 1, per_page: 10, total: 2, last_page: 2 } } });
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [{ ...timelineDay, id: 'second', attendance_date: '2026-10-15' }], meta: { current_page: 2, per_page: 10, total: 2, last_page: 2 } } });
    const result = await service.calendar({ month: '2026-10', status: 'present', page: 3, per_page: 10 }, signal);
    expect(result.data).toHaveLength(2);
    expect(api.get).toHaveBeenNthCalledWith(2, '/time-sync/attendance/my', { params: { month: '2026-10', status: 'present', page: 2, per_page: 50 }, signal });
    expect(result.meta.last_page).toBe(1);
  });
  it('rejects an incomplete calendar when a later page fails', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [timelineDay], meta: { current_page: 1, per_page: 10, total: 2, last_page: 2 } } });
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Connection lost'));
    await expect(service.calendar({ month: '2026-10', page: 1, per_page: 50 })).rejects.toThrow('Connection lost');
  });
  it('reads today without history filters and preserves live progress separately from finalized minutes', async () => {
    const signal = new AbortController().signal;
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: timelineToday } });
    const response = await service.today(signal);
    expect(api.get).toHaveBeenCalledExactlyOnceWith('/time-sync/attendance/today', { signal });
    expect(response.data).toMatchObject({ work_minutes: 0, progress: { worked_minutes: 68 }, last_out: null, is_geofence_valid: null });
  });
  it('keeps the flat history envelope and requests only supplied filters', async () => {
    const response = { success: true, employee: timelineToday.employee, data: [timelineDay], meta: { current_page: 2, per_page: 10, total: 31, last_page: 4 } };
    vi.mocked(api.get).mockResolvedValue({ data: response }); const signal = new AbortController().signal;
    expect(await service.history({ month: '2026-08', page: 2, per_page: 10, status: '', date_from: undefined }, signal)).toEqual(response);
    expect(api.get).toHaveBeenCalledWith('/time-sync/attendance/my', { params: { month: '2026-08', page: 2, per_page: 10 }, signal });
  });
  it('requests the full month summary independently of pagination and status', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: timelineSummary } });
    expect((await service.summary('2026-08')).data).toEqual(timelineSummary);
    expect(api.get).toHaveBeenCalledExactlyOnceWith('/time-sync/attendance/my/summary', { params: { month: '2026-08' }, signal: undefined });
  });
  it('does not turn failed envelopes into empty attendance and preserves HTTP errors', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: false, message: 'Employee not linked.', data: null } });
    await expect(service.today()).rejects.toThrow('Employee not linked.');
    const error = { response: { status: 403, data: { message: 'Permission denied.' } } };
    vi.mocked(api.get).mockRejectedValueOnce(error);
    await expect(service.summary('2026-08')).rejects.toBe(error);
  });
});
