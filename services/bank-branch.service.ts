import { api } from '@/lib/api';
import type {
  BankBranch,
  BankBranchFormData,
  BankBranchApiPayload,
  PaginatedBankBranchesResponse,
} from '@/types/bank-branch';

const BASE_PATH = '/flexi-meta/employee/bank-branches';

const toApiPayload = (data: BankBranchFormData): BankBranchApiPayload => ({
  bank_id: Number(data.bank_id),
  code: data.code.trim(),
  name: data.name.trim(),
  country: data.country.trim() || null,
  city: data.city.trim() || null,
  status: data.status,
});

export const bankBranchService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedBankBranchesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (id: number): Promise<BankBranch> => {
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  create: async (payload: BankBranchFormData): Promise<BankBranch> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (id: number, payload: BankBranchFormData): Promise<BankBranch> => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, toApiPayload(payload));
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};