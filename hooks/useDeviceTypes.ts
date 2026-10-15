import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceTypeService } from '@/services/device-type.service';
import toast from 'react-hot-toast';
import type { DeviceTypeFormData } from '@/types/device-type';

export const deviceTypeKeys = {
  all: ['device-types'] as const,
  lists: () => [...deviceTypeKeys.all, 'list'] as const,
  list: (params: any) => [...deviceTypeKeys.lists(), params] as const,
};

export function useDeviceTypes(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: deviceTypeKeys.list(params || {}),
    queryFn: () => deviceTypeService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateDeviceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeviceTypeFormData) => deviceTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceTypeKeys.lists() });
      toast.success('Device type created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create device type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateDeviceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: DeviceTypeFormData }) =>
      deviceTypeService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceTypeKeys.lists() });
      toast.success('Device type updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update device type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteDeviceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => deviceTypeService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceTypeKeys.lists() });
      toast.success('Device type deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete device type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}