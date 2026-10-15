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
  getAll: async (params?: { per_page?: number; detailed?: number }): Promise<Employee[]> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data.data;   // assuming response { success, data: Employee[], meta }
  },
};
