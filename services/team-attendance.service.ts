import { api } from '@/lib/api';
import type { TeamAttendanceResponse, TeamEnvelope, TeamFilters, TeamLocationsResponse, TeamMemberDetail, TeamSummary } from '@/types/team-attendance';

const ROOT = '/time-sync/attendance/team';
function checked<T extends { success: boolean; message: string }>(response: T): T {
  if (!response.success) throw new Error(response.message || 'Team attendance is unavailable.');
  return response;
}
function scope({ date, recursive }: TeamFilters) { return { date, recursive }; }

export const teamAttendanceService = {
  async attendance(filters: TeamFilters, signal?: AbortSignal) {
    const params = { ...scope(filters), ...(filters.employee_uuid ? { employee_uuid: filters.employee_uuid } : {}) };
    return checked((await api.get<TeamAttendanceResponse>(ROOT, { params, signal })).data);
  },
  async summary(filters: TeamFilters, signal?: AbortSignal) {
    return checked((await api.get<TeamEnvelope<TeamSummary>>(`${ROOT}/summary`, { params: scope(filters), signal })).data);
  },
  async locations(filters: TeamFilters, signal?: AbortSignal) {
    return checked((await api.get<TeamLocationsResponse>(`${ROOT}/locations`, { params: scope(filters), signal })).data);
  },
  async member(uuid: string, date: string, signal?: AbortSignal) {
    return checked((await api.get<TeamEnvelope<TeamMemberDetail>>(`${ROOT}/${encodeURIComponent(uuid)}`, { params: { date }, signal })).data);
  },
};
