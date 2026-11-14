import { api } from '@/lib/api';
import type { Employee } from '@/types/shift-assignment';
import { normalizeLetterList } from '@/lib/letter-forge-contract';
import type { ApiEnvelope } from '@/types/letter-forge';

const BASE_PATH = '/people-hub/onboarding';

export const employeeService = {
  getAllForBatches: async (signal?: AbortSignal): Promise<Employee[]> => {
    const employees: Employee[] = [];
    let page = 1;
    let lastPage = 1;
    do {
      const { data } = await api.get<ApiEnvelope<unknown>>(BASE_PATH, { params: { page, per_page: 100, detailed: 0 }, signal });
      const result = normalizeLetterList<Employee>(data);
      employees.push(...result.data);
      lastPage = result.meta?.last_page ?? 1;
      page++;
    } while (page <= lastPage);
    return [...new Map(employees.map((employee) => [employee.id, employee])).values()];
  },
  getAll: async <T = Employee>(params?: { per_page?: number; detailed?: number }, signal?: AbortSignal): Promise<T[]> => {
    const rows: T[] = [];
    let page = 1;
    let lastPage = 1;
    do {
      const { data } = await api.get(BASE_PATH, { params: { ...params, page }, signal });
      if (data.success === false) throw new Error(data.message || 'Unable to load employees.');
      const records = Array.isArray(data.data) ? data.data : data.data?.data;
      if (!Array.isArray(records)) throw new Error('Unexpected employee listing response.');
      rows.push(...records);
      const meta = data.meta ?? data.pagination ?? data.data?.meta;
      lastPage = Number(meta?.last_page ?? 1);
      page++;
    } while (page <= lastPage);
    return rows;
  },
};
