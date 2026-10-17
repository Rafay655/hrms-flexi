'use client';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import { attendanceTimelineService } from '@/services/attendance-timeline.service';
import type { TimelineFilters } from '@/types/attendance-timeline';
export const attendanceTimelineKeys = { all: ['time-sync', 'my-timeline'] as const };
export function useAttendanceTimeline(filters: TimelineFilters, calendar = false) {
  const company = useAppSelector(state => state.auth.company?.id);
  const user = useAppSelector(state => state.auth.user?.id);
  const scope = [...attendanceTimelineKeys.all, company, user];
  const today = useQuery({ queryKey: [...scope, 'today'], queryFn: ({ signal }) => attendanceTimelineService.today(signal), refetchInterval: 60_000, retry: false });
  const historyFilters = calendar ? { ...filters, page: 1, per_page: 50 } : filters;
  const history = useQuery({ queryKey: [...scope, calendar ? 'calendar' : 'history', historyFilters], queryFn: ({ signal }) => calendar ? attendanceTimelineService.calendar(historyFilters, signal) : attendanceTimelineService.history(historyFilters, signal), retry: false });
  const summary = useQuery({ queryKey: [...scope, 'summary', filters.month], queryFn: ({ signal }) => attendanceTimelineService.summary(filters.month, signal), retry: false });
  return { today, history, summary };
}
