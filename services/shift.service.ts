import { api } from '@/lib/api';
import type { Shift, ShiftFormData, Weekday, ShiftBreakWindow, PaginatedShiftsResponse } from '@/types/shift';
const ROOT = '/time-sync/shifts';
interface Envelope<T> { success: boolean; message: string; data: T }
function checked<T extends { success: boolean; message: string }>(data: T): T {
  if (!data.success) throw new Error(data.message || 'The shift request failed.');
  return data;
}
function workingDays(value: unknown): Weekday[] {
  if (Array.isArray(value)) return value as Weekday[];
  if (typeof value === 'string') { try { const result: unknown = JSON.parse(value); return Array.isArray(result) ? result as Weekday[] : []; } catch { return []; } }
  return [];
}
function breakWindows(raw: unknown): ShiftBreakWindow[] {
  if (raw == null || raw === '') return [];
  let value: unknown = raw;
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { throw new Error('The shift returned an invalid break schedule.'); } }
  if (!Array.isArray(value)) throw new Error('The shift returned an invalid break schedule.');
  return value.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('The shift returned an incomplete break window.');
    const window = item as Record<string, unknown>;
    const start = window.start_time ?? window.start;
    const end = window.end_time ?? window.end;
    const days = window.weekdays ?? window.days;
    if (!Array.isArray(days) || typeof start !== 'string' || typeof end !== 'string') throw new Error('The shift returned an incomplete break window.');
    return { days: workingDays(days), start: start.slice(0, 5), end: end.slice(0, 5), paid: window.paid === true || window.paid === 1, label: typeof window.label === 'string' ? window.label : '' };
  });
}
const normalize = (shift: Shift): Shift => ({ ...shift, working_days: workingDays(shift.working_days), break_windows: breakWindows(shift.break_windows) });
const payload = (data: ShiftFormData): Record<string, unknown> => ({ ...data, name: data.name.trim(), code: data.code.trim(), attendance_policy_id: data.attendance_policy_id || null, start_time: data.start_time.slice(0, 5), end_time: data.end_time.slice(0, 5), max_ot_minutes_per_day: data.max_ot_minutes_per_day === '' ? null : Number(data.max_ot_minutes_per_day) });
export const shiftService = {
  async lookup(): Promise<Shift[]> {
    const response = checked((await api.get<Envelope<Shift[]>>(`${ROOT}/lookup`)).data);
    if (!Array.isArray(response.data)) throw new Error('Unexpected shift lookup response.');
    return response.data;
  },
  async getAll(params?: { page?: number; per_page?: number; search?: string; is_active?: number }): Promise<PaginatedShiftsResponse> {
    const response = checked((await api.get<Envelope<Shift[] | PaginatedShiftsResponse['data']> & { meta?: PaginatedShiftsResponse['data']['meta'] }>(ROOT, { params })).data);
    const rows = Array.isArray(response.data) ? response.data : response.data?.data;
    const meta = Array.isArray(response.data) ? response.meta : response.data?.meta;
    if (!Array.isArray(rows) || !meta) throw new Error('Unexpected shift listing response.');
    return { ...response, data: { data: rows.map(normalize), meta, links: null } };
  },
  async getById(uuid: string): Promise<Shift> { return normalize(checked((await api.get<Envelope<Shift>>(`${ROOT}/${uuid}`)).data).data); },
  async save({ uuid, payload }: { uuid?: string; payload: Record<string, unknown> }): Promise<Shift> {
    const body = { ...payload };
    if (payload.break_windows !== undefined) {
      body.break_windows = breakWindows(payload.break_windows).map(window => ({
        weekdays: [...new Set(window.days)], start_time: window.start, end_time: window.end,
        paid: window.paid, label: window.label.trim(),
      }));
    }
    const config = { headers: { 'Content-Type': 'application/json' } };
    const response = uuid ? await api.put<Envelope<Shift>>(`${ROOT}/${uuid}`, body, config) : await api.post<Envelope<Shift>>(ROOT, body, config);
    return normalize(checked(response.data).data);
  },
  async create(data: ShiftFormData) { return shiftService.save({ payload: payload(data) }); },
  async update(uuid: string, data: ShiftFormData) { return shiftService.save({ uuid, payload: payload(data) }); },
  async delete(uuid: string) { const response = await api.delete<Envelope<unknown>>(`${ROOT}/${uuid}`); if (response.data) checked(response.data); },
};
