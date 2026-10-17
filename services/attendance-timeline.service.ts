import { api } from '@/lib/api';
import type { TimelineEnvelope, TimelineFilters, TimelineListResponse, TodayAttendance, MonthlyAttendanceSummary } from '@/types/attendance-timeline';
const ROOT = '/time-sync/attendance';
function checked<T extends { success: boolean; message: string }>(response: T): T {
  if (!response.success) throw new Error(response.message || 'Attendance is unavailable.');
  return response;
}
export const attendanceTimelineService = {
  async today(signal?: AbortSignal) {
    return checked((await api.get<TimelineEnvelope<TodayAttendance | null>>(`${ROOT}/today`, { signal })).data);
  },
  async history(filters: TimelineFilters, signal?: AbortSignal) {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined));
    const response = checked((await api.get<TimelineListResponse>(`${ROOT}/my`, { params, signal })).data);
    if (!Array.isArray(response.data)) throw new Error('Attendance history returned an unexpected format.');
    return response;
  },
  async summary(month: string, signal?: AbortSignal) {
    return checked((await api.get<TimelineEnvelope<MonthlyAttendanceSummary | null>>(`${ROOT}/my/summary`, { params: { month }, signal })).data);
  },
  async calendar(filters: TimelineFilters, signal?: AbortSignal): Promise<TimelineListResponse> {
    const first = await attendanceTimelineService.history({ ...filters, page: 1, per_page: 50 }, signal);
    const rows = [...first.data];
    for (let page = 2; page <= first.meta.last_page; page++) {
      const next = await attendanceTimelineService.history({ ...filters, page, per_page: 50 }, signal);
      rows.push(...next.data);
    }
    return { ...first, data: rows, meta: { ...first.meta, current_page: 1, last_page: 1, per_page: rows.length } };
  },
};
