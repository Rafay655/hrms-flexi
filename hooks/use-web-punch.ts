'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import { attendanceTimelineService } from '@/services/attendance-timeline.service';
import { webPunchService } from '@/services/web-punch.service';
import type { PunchListFilters } from '@/types/web-punch';
import { companyDate } from '@/lib/web-punch';

export function useWebPunch(filters: PunchListFilters) {
  const company = useAppSelector(state => state.auth.company?.id);
  const user = useAppSelector(state => state.auth.user?.id);
  const timeZone = useAppSelector(state => state.auth.company?.timezone) || 'Asia/Karachi';
  const date = companyDate(timeZone);
  const client = useQueryClient();
  const today = useQuery({
    queryKey: ['time-sync', 'my-timeline', company, user, 'today'],
    queryFn: ({ signal }) => attendanceTimelineService.today(signal),
    refetchInterval: 60_000,
    retry: false,
  });
  const employeeId = today.data?.data?.employee.uuid;
  // Separate from history filters: a past-date/search/source selection must not unlock Clock In.
  const clockIn = useQuery({
    queryKey: ['time-sync', 'clock-in-lock', company, user, employeeId, date],
    queryFn: ({ signal }) => webPunchService.clockIn(date, employeeId!, signal),
    enabled: Boolean(employeeId),
    refetchInterval: 60_000,
    retry: false,
  });
  const history = useQuery({
    queryKey: ['time-sync', 'punches', company, user, filters],
    queryFn: ({ signal }) => webPunchService.list(filters, signal),
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: webPunchService.submit,
    retry: false,
    onSuccess: (response, input) => {
      if (input.punch_type === 'in') client.setQueryData(['time-sync', 'clock-in-lock', company, user, employeeId, date], {
        success: true, message: response.message, data: [response.data],
        meta: { current_page: 1, per_page: 1, total: 1, last_page: 1 },
      });
      void client.invalidateQueries({ queryKey: ['time-sync'] });
    },
  });
  return { today, history, mutation, employeeId, clockIn };
}
