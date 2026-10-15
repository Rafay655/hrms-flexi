// services/employee-profile.service.ts
import { api } from '@/lib/api';
import type {
  EmployeeProfile,
  EmployeeProfileListResponse,
  EmployeeProfileQueryParams,
  CreateEmployeeProfilePayload,
  UpdateEmployeeProfilePayload,
  TransferProvincePayload,
  ProfileHistory,
} from '@/types/employee-profile.types';

export const employeeProfileApi = {
  getProfiles: (params?: EmployeeProfileQueryParams) =>
    api.get<{ data: EmployeeProfileListResponse; meta: any }>('/compliance/employee-profiles', { params }),

  createProfile: (payload: CreateEmployeeProfilePayload) =>
    api.post<{ data: EmployeeProfile }>('/compliance/employee-profiles', payload),

  updateProfile: (employeeUuid: string, payload: UpdateEmployeeProfilePayload) =>
    api.put<{ data: EmployeeProfile }>(`/compliance/employee-profiles/${employeeUuid}`, payload),

  transferProvince: (employeeUuid: string, payload: TransferProvincePayload) =>
    api.post<{ data: any }>(`/compliance/employee-profiles/${employeeUuid}/transfer-province`, payload),

  getHistory: (employeeUuid: string) =>
    api.get<{ data: ProfileHistory[] }>(`/compliance/employee-profiles/${employeeUuid}/history`),
};