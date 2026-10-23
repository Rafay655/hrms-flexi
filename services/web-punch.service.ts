import { api } from '@/lib/api';
import type { PunchListFilters, PunchListResponse, WebPunchInput, WebPunchResponse } from '@/types/web-punch';

function checked<T extends { success: boolean; message: string }>(response: T): T {
  if (!response.success) throw new Error(response.message || 'The punch request could not be completed.');
  return response;
}

export const webPunchService = {
  async list(filters: PunchListFilters, signal?: AbortSignal) {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined));
    const response = checked((await api.get<PunchListResponse>('/time-sync/punches', { params, signal })).data);
    if (!Array.isArray(response.data)) throw new Error('Unexpected punch history response.');
    return response;
  },
  async clockIn(date: string, employeeId: string, signal?: AbortSignal): Promise<PunchListResponse> {
    // Keep employee_id out of the request; identify this employee in the returned records.
    // Check all pages so another employee's first record cannot produce a false lock.
    let page = 1;
    while (true) {
      const response = await webPunchService.list({ date, punch_type: 'in', per_page: 1000, page }, signal);
      const match = response.data.find(punch => (punch.employee_id || punch.employee?.id) === employeeId && punch.punch_type === 'in' && punch.punched_at?.slice(0, 10) === date);
      if (match || page >= response.meta.last_page) return {
        ...response, data: match ? [match] : [],
        meta: { current_page: 1, per_page: 1, last_page: 1, total: match ? 1 : 0 },
      };
      page++;
    }
  },
  async submit(input: WebPunchInput) {
    const body = new FormData();
    body.append('client_idempotency_key', input.client_idempotency_key);
    body.append('punch_type', input.punch_type);
    body.append('lat', String(input.lat));
    body.append('lng', String(input.lng));
    body.append('accuracy_meters', String(input.accuracy_meters));
    body.append('device_info[user_agent]', input.device_info.user_agent);
    body.append('device_info[timezone]', input.device_info.timezone);
    // Let the browser supply its multipart boundary, overriding api's JSON default.
    return checked((await api.post<WebPunchResponse>('/time-sync/punches/web', body, { headers: { 'Content-Type': undefined } })).data);
  },
};
