import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceDeviceService } from '@/services/attendance-device.service';
import toast from 'react-hot-toast';
import type { AttendanceDeviceFormData } from '@/types/attendance-device';

export const attendanceDeviceKeys = {
  all: ['attendance-devices'] as const,
  lists: () => [...attendanceDeviceKeys.all, 'list'] as const,
  list: (params: any) => [...attendanceDeviceKeys.lists(), params] as const,
};

export function useAttendanceDevices(params?: { page?: number; per_page?: number; search?: string; is_active?: number }) {
  return useQuery({
    queryKey: attendanceDeviceKeys.list(params || {}),
    queryFn: () => attendanceDeviceService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateAttendanceDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AttendanceDeviceFormData) => attendanceDeviceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceDeviceKeys.lists() });
      toast.success('Device created successfully');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create device' }),
  });
}

export function useUpdateAttendanceDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: AttendanceDeviceFormData }) =>
      attendanceDeviceService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceDeviceKeys.lists() });
      toast.success('Device updated successfully');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update device' }),
  });
}

export function useDeleteAttendanceDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => attendanceDeviceService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceDeviceKeys.lists() });
      toast.success('Device deleted successfully');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to delete device' }),
  });
}