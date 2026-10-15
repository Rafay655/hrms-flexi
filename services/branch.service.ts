import { api } from '@/lib/api';
import type {
  Branch,
  BranchFormData,
  BranchApiPayload,
  PaginatedBranchesResponse,
} from '@/types/branch';

const BASE_PATH = '/flexi-meta/company/branches';

const toApiPayload = (data: BranchFormData): BranchApiPayload => ({
  name: data.name.trim(),
  code: data.code.trim(),
  branch_type: data.branch_type as BranchApiPayload['branch_type'],
  is_active: data.is_active,
  address_line_1: data.address_line_1.trim() || null,
  address_line_2: data.address_line_2.trim() || null,
  country_id: data.country_id === '' ? null : Number(data.country_id),
  state_id: data.state_id === '' ? null : Number(data.state_id),
  city_id: data.city_id === '' ? null : Number(data.city_id),
  postal_code: data.postal_code.trim() || null,
  latitude: data.latitude ? parseFloat(data.latitude) : null,
  longitude: data.longitude ? parseFloat(data.longitude) : null,
  geofence_radius_meters: data.geofence_radius_meters ? parseInt(data.geofence_radius_meters) : null,
  timezone: data.timezone.trim() || null,
  compliance_region: data.compliance_region || null,
  phone: data.phone.trim() || null,
  email: data.email.trim() || null,
  branch_head_employee_id: null,
});

export const branchService = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: number;
  }): Promise<PaginatedBranchesResponse> => {
    const { data } = await api.get(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string): Promise<Branch> => {
    const { data } = await api.get(`${BASE_PATH}/${uuid}`);
    return data;
  },

  create: async (payload: BranchFormData): Promise<Branch> => {
    const { data } = await api.post(BASE_PATH, toApiPayload(payload));
    return data;
  },

  update: async (uuid: string, payload: BranchFormData): Promise<Branch> => {
    const { data } = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return data;
  },

  delete: async (uuid: string): Promise<void> => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};