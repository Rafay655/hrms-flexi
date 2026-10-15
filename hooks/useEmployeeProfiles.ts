// hooks/useEmployeeProfiles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeProfileApi } from '@/services/employee-profile.service';
import type {
  EmployeeProfile,
  EmployeeProfileQueryParams,
  CreateEmployeeProfilePayload,
  UpdateEmployeeProfilePayload,
  TransferProvincePayload,
  ProfileHistory,
} from '@/types/employee-profile.types';

export const EMPLOYEE_PROFILES_QUERY_KEY = 'employeeProfiles';

export function useEmployeeProfiles(params?: EmployeeProfileQueryParams) {
  return useQuery({
    queryKey: [EMPLOYEE_PROFILES_QUERY_KEY, params],
    queryFn: async () => {
      const response = await employeeProfileApi.getProfiles(params);
      return {
        data: response.data.data.data,
        meta: response.data.meta,
        paginator: response.data.data,
      };
    },
  });
}

export function useCreateEmployeeProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeeProfilePayload) =>
      employeeProfileApi.createProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEE_PROFILES_QUERY_KEY] });
    },
  });
}

export function useUpdateEmployeeProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeUuid, payload }: { employeeUuid: string; payload: UpdateEmployeeProfilePayload }) =>
      employeeProfileApi.updateProfile(employeeUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEE_PROFILES_QUERY_KEY] });
    },
  });
}

export function useTransferProvince() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeUuid, payload }: { employeeUuid: string; payload: TransferProvincePayload }) =>
      employeeProfileApi.transferProvince(employeeUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEE_PROFILES_QUERY_KEY] });
    },
  });
}

export function useEmployeeProfileHistory(employeeUuid: string) {
  return useQuery({
    queryKey: ['employeeProfileHistory', employeeUuid],
    queryFn: async () => {
      const response = await employeeProfileApi.getHistory(employeeUuid);
      return response.data.data;
    },
    enabled: !!employeeUuid,
  });
}