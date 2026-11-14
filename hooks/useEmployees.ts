import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employee.service';
import { useAppSelector } from '@/store/hooks';
import type { Employee } from '@/types/shift-assignment';

export function useEmployees<T = Employee>(params?: { per_page?: number; detailed?: number }) {
  const company = useAppSelector(state => state.auth.company?.id);
  const user = useAppSelector(state => state.auth.user?.id);
  return useQuery({
    queryKey: ['employees', params, company, user],
    queryFn: ({ signal }) => employeeService.getAll<T>(params, signal),
    staleTime: 5 * 60 * 1000,
  });
}
