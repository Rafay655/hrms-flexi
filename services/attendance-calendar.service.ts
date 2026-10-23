import { api } from '@/lib/api';
import type { AttendanceCalendarFilters, AttendanceCalendarResponse } from '@/types/attendance-calendar';

export const attendanceCalendarService = {
  async get(filters: AttendanceCalendarFilters, signal?: AbortSignal): Promise<AttendanceCalendarResponse> {
    const { data } = await api.get<AttendanceCalendarResponse>('/time-sync/attendance/calendar', { params: filters, signal });
    if (!data.success) throw new Error(data.message || 'Attendance calendar is unavailable.');
    if (!data.data || !Array.isArray(data.data.employees) || !Array.isArray(data.data.shift_legend) || !data.meta) throw new Error('Unexpected attendance calendar response.');
    return data;
  },
};
