import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employee.service';

export function useEmployees(params?: { per_page?: number; detailed?: number }) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => employeeService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}