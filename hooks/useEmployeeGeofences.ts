import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeGeofenceService } from '@/services/employee-geofence.service';
import toast from 'react-hot-toast';
import type { EmployeeGeofenceFormData } from '@/types/employee-geofence';

export const employeeGeofenceKeys = {
  all: ['employee-geofences'] as const,
  lists: () => [...employeeGeofenceKeys.all, 'list'] as const,
  list: (params: any) => [...employeeGeofenceKeys.lists(), params] as const,
};

export function useEmployeeGeofences(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: number;
}) {
  return useQuery({
    queryKey: employeeGeofenceKeys.list(params || {}),
    queryFn: () => employeeGeofenceService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateEmployeeGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmployeeGeofenceFormData) => employeeGeofenceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeGeofenceKeys.lists() });
      toast.success('Geofence created');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create' }),
  });
}

export function useUpdateEmployeeGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: EmployeeGeofenceFormData }) =>
      employeeGeofenceService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeGeofenceKeys.lists() });
      toast.success('Geofence updated');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update' }),
  });
}

export function useDeleteEmployeeGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => employeeGeofenceService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeGeofenceKeys.lists() });
      toast.success('Geofence deleted');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to delete' }),
  });
}