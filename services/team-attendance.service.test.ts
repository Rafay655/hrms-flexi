import { beforeEach, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { teamAttendance, teamDetail, teamLocations, teamSummary } from '@/tests/fixtures/team-attendance';
import { teamAttendanceService as service } from './team-attendance.service';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
const filters = { date: '2026-10-17', recursive: false, employee_uuid: 'manager-uuid' };

it('requests manager attendance and preserves direct-only scope and response metadata', async () => {
  const signal = new AbortController().signal;
  vi.mocked(api.get).mockResolvedValue({ data: teamAttendance });
  expect(await service.attendance(filters, signal)).toEqual(teamAttendance);
  expect(api.get).toHaveBeenCalledExactlyOnceWith('/time-sync/attendance/team', { params: filters, signal });
});
it('omits an empty manager filter', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: teamAttendance });
  await service.attendance({ ...filters, employee_uuid: '' });
  expect(api.get).toHaveBeenCalledWith('/time-sync/attendance/team', { params: { date: filters.date, recursive: false }, signal: undefined });
});
it('uses only documented date and recursive filters for summary and locations', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: teamSummary }).mockResolvedValueOnce({ data: teamLocations });
  expect(await service.summary({ ...filters, recursive: true })).toEqual(teamSummary);
  expect(await service.locations(filters)).toEqual(teamLocations);
  expect(api.get).toHaveBeenNthCalledWith(1, '/time-sync/attendance/team/summary', { params: { date: filters.date, recursive: true }, signal: undefined });
  expect(api.get).toHaveBeenNthCalledWith(2, '/time-sync/attendance/team/locations', { params: { date: filters.date, recursive: false }, signal: undefined });
});
it('loads a member on the requested date without manager or recursive filters', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: teamDetail });
  expect(await service.member('employee-uuid', filters.date)).toEqual(teamDetail);
  expect(api.get).toHaveBeenCalledWith('/time-sync/attendance/team/employee-uuid', { params: { date: filters.date }, signal: undefined });
});
it('surfaces failed envelopes and HTTP failures instead of inventing empty teams', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: { success: false, message: 'Access denied.' } });
  await expect(service.attendance(filters)).rejects.toThrow('Access denied.');
  const error = new Error('Server unavailable');
  vi.mocked(api.get).mockRejectedValueOnce(error);
  await expect(service.locations(filters)).rejects.toBe(error);
});
