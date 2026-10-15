import { useQuery } from '@tanstack/react-query';
import { fetchFormBuilders } from '@/services/form-builder';
import type { FormBuildersQueryParams } from '@/types/form-builder';

export const useFormBuilders = (params: FormBuildersQueryParams) => {
  return useQuery({
    queryKey: ['form-builders', params],
    queryFn: () => fetchFormBuilders(params),
    staleTime: 1000 * 60 * 2,
  });
};