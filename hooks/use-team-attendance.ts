'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import { teamAttendanceService } from '@/services/team-attendance.service';
import type { TeamFilters } from '@/types/team-attendance';

function useTeamScope() {
  const company = useAppSelector(state => state.auth.company?.id);
  const user = useAppSelector(state => state.auth.user?.id);
  return ['time-sync', 'my-team', company, user];
}

export function useTeamAttendance(filters: TeamFilters) {
  const scope = useTeamScope();
  const base = { date: filters.date, recursive: filters.recursive };
  const attendance = useQuery({ queryKey: [...scope, 'attendance', filters], queryFn: ({ signal }) => teamAttendanceService.attendance(filters, signal), retry: false });
  const summary = useQuery({ queryKey: [...scope, 'summary', base], queryFn: ({ signal }) => teamAttendanceService.summary(base, signal), retry: false });
  const locations = useQuery({ queryKey: [...scope, 'locations', base], queryFn: ({ signal }) => teamAttendanceService.locations(base, signal), retry: false });
  return { attendance, summary, locations };
}

export function useTeamMember(uuid: string, date: string) {
  const scope = useTeamScope();
  return useQuery({ queryKey: [...scope, 'member', uuid, date], queryFn: ({ signal }) => teamAttendanceService.member(uuid, date, signal), retry: false });
}
