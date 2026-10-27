import { api } from '@/lib/api';
export interface ScheduleShift { id: string; name: string; code?: string; start_time: string; end_time: string; is_night_shift?: boolean; ends_next_day?: boolean }
export interface ScheduleLeave { id: string; leave_type: string; status: string; portion: string; day_fraction: number; start_time: string | null; end_time: string | null }
export interface ScheduleDay {
  date: string; day_type: 'working' | 'weekly_off' | 'holiday' | 'unassigned';
  roster_id: string | null; shift: ScheduleShift | null;
  location: { id: string; name: string } | null;
  breaks: { label: string; start_time: string; end_time: string; paid: boolean; duration_minutes: number }[];
  scheduled_minutes: number; holiday: { id: string; name: string; type?: string } | null;
  leaves: ScheduleLeave[];
  pending_swaps: { id: string; status: string; role: string; colleague?: { id: string; name: string }; proposed_shift?: ScheduleShift }[];
  roster_change: { changed_at: string; changed_by?: { name: string }; previous_shift: ScheduleShift | null; reason: string | null } | null;
  notes: string | null;
}
export interface MySchedule {
  month: string; month_label: string; timezone: string; today: string;
  employee: { id: string; employee_code: string; name: string };
  summary: { scheduled_days: number; scheduled_minutes: number; weekly_off_days: number; holiday_days: number; unassigned_days: number; approved_leave_days: number; pending_leave_requests: number; pending_swap_requests: number };
  days: ScheduleDay[];
}
export const myScheduleService = {
  async get(month: string, signal?: AbortSignal): Promise<MySchedule> {
    const { data } = await api.get<{ success: boolean; message?: string; data: MySchedule }>('/time-sync/attendance/my/schedule', { params: { month }, signal });
    if (!data.success) throw new Error(data.message || 'Unable to load your schedule.');
    if (!data.data || !Array.isArray(data.data.days) || !data.data.summary || data.data.month !== month) throw new Error('The schedule response does not match the expected format.');
    return data.data;
  },
};
