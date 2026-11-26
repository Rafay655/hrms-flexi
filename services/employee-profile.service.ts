// services/employee-profile.service.ts
import { api } from '@/lib/api';
import type {
  EmployeeProfile,
  EmployeeProfileCreateDefaults,
  EmployeeProfileListResponse,
  EmployeeProfileQueryParams,
  CreateEmployeeProfilePayload,
  UpdateEmployeeProfilePayload,
  TransferProvincePayload,
  ProfileHistory,
} from '@/types/employee-profile.types';

export const employeeProfileApi = {
  getCreateDefaults: async (employeeUuid:string,signal?:AbortSignal):Promise<EmployeeProfileCreateDefaults> => {
    const {data}=await api.get<{success:boolean;message?:string;data:EmployeeProfileCreateDefaults}>(`/compliance/employee-profiles/${encodeURIComponent(employeeUuid)}/create-defaults`,{signal});
    if(!data.success||!data.data)throw data;
    return data.data;
  },
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