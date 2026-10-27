import { api } from '@/lib/api';

export interface ReprocessInput {
  from_date: string;
  to_date: string;
  employee_id: string[];
}
export interface ReprocessResult {
  status: string;
  from_date: string;
  to_date: string;
  employees: number;
  processed: number;
  locked: number;
  skipped: number;
  by_status: Record<string, number>;
}
interface ReprocessResponse { success: boolean; message: string; data: ReprocessResult }

export const attendanceReprocessService = {
  async run(input: ReprocessInput): Promise<ReprocessResponse> {
    const payload = { from_date: input.from_date, to_date: input.to_date, ...(input.employee_id.length ? { employee_id: [...new Set(input.employee_id)] } : {}) };
    const { data } = await api.post<ReprocessResponse>('/time-sync/attendance/reprocess', payload);
    if (!data.success) throw new Error(data.message || 'Attendance reprocessing failed.');
    if (!data.data || !data.data.status) throw new Error('The server returned an unexpected reprocessing result.');
    return data;
  },
};
