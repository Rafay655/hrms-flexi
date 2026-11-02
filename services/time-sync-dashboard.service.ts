import { api } from '@/lib/api';
import type { TimeSyncDashboardData } from '@/types/time-sync-dashboard';

type DashboardEnvelope = { success: boolean; message?: string; data?: TimeSyncDashboardData };
export function normalizeDashboardResponse(response: DashboardEnvelope): TimeSyncDashboardData {
  if (!response.success) throw new Error(response.message || 'Dashboard unavailable.');
  const dashboard = response.data;
  if (!dashboard || !dashboard.kpi || !dashboard.attendance) {
    const missing = ['kpi', 'attendance'].filter(key => !dashboard?.[key as keyof TimeSyncDashboardData]);
    throw new Error(`Dashboard response is missing ${!dashboard ? 'data' : missing.join(', ')}. Please share the current dashboard Network response.`);
  }
  // Empty collections may be serialized as null or an empty object by the backend.
  const collection = <T>(value: T[] | null | undefined, field: string): T[] => {
    if (value == null) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object' && Object.keys(value).length === 0) return [];
    throw new Error(`Dashboard ${field} must be a list. Please share the current dashboard Network response.`);
  };
  return { ...dashboard,
    attendance_trend: collection(dashboard.attendance_trend, 'attendance_trend'),
    recent_activity: collection(dashboard.recent_activity, 'recent_activity'),
  };
}
export const timeSyncDashboardService = {
  async get(month: string, signal?: AbortSignal): Promise<TimeSyncDashboardData> {
    const { data } = await api.get<DashboardEnvelope>('/time-sync/dashboard', { params: { month }, signal });
    return normalizeDashboardResponse(data);
  },
};
