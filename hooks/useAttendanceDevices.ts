'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceDeviceService } from '@/services/attendance-device.service';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import type { AttendanceDeviceFormData, AttendanceDeviceFilters } from '@/types/attendance-device';
export const attendanceDeviceKeys = {
  all: ['attendance-devices'] as const,
  lists: () => ['attendance-devices', 'list'] as const,
  list: (params: AttendanceDeviceFilters) => ['attendance-devices', 'list', params] as const,
};
export function useDeviceScope() {
  const company = useAppSelector(state => state.auth.company?.id);
  const user = useAppSelector(state => state.auth.user?.id);
  return [company, user] as const;
}
export function useAttendanceDevices(params: AttendanceDeviceFilters = {}) {
  const scope = useDeviceScope();
  return useQuery({ queryKey: [...attendanceDeviceKeys.list(params), ...scope], queryFn: ({ signal }) => attendanceDeviceService.getAll(params, signal),
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey.slice(-2).every((value, index) => value === scope[index]) ? previous : undefined });
}
export function useAttendanceDevice(uuid: string | null) {
  const scope = useDeviceScope();
  return useQuery({ queryKey: [...attendanceDeviceKeys.all, 'detail', uuid, ...scope], queryFn: ({ signal }) => attendanceDeviceService.getById(uuid!, signal), enabled: Boolean(uuid), staleTime: 0 });
}
export function useCreateAttendanceDevice() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (form: AttendanceDeviceFormData) => attendanceDeviceService.create(form), retry: false,
    onSuccess: () => { void client.invalidateQueries({ queryKey: attendanceDeviceKeys.all }); toast.success('Device created successfully'); } });
}
export function useUpdateAttendanceDevice() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ uuid, data, includeMappings }: { uuid: string; data: AttendanceDeviceFormData; includeMappings?: boolean }) => attendanceDeviceService.update(uuid, data, includeMappings), retry: false,
    onSuccess: () => { void client.invalidateQueries({ queryKey: attendanceDeviceKeys.all }); toast.success('Device updated successfully'); } });
}
export function useDeleteAttendanceDevice() {
  const client = useQueryClient();
  return useMutation({ mutationFn: attendanceDeviceService.delete, retry: false,
    onSuccess: () => { void client.invalidateQueries({ queryKey: attendanceDeviceKeys.all }); toast.success('Device deleted successfully'); } });
}
