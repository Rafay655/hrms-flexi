import { api } from '@/lib/api';
import type { ExceptionFilters, ExceptionListResponse } from '@/types/attendance-exception';

export const attendanceExceptionService = {
  async list(filters: ExceptionFilters, signal?: AbortSignal): Promise<ExceptionListResponse> {
    const { data } = await api.get<ExceptionListResponse>('/time-sync/anomalies', { params: filters, signal });
    if (!data.success) throw new Error(data.message || 'Exceptions inbox is unavailable.');
    if (!Array.isArray(data.data) || !data.meta) throw new Error('Unexpected exceptions inbox response.');
    return data;
  },
};
