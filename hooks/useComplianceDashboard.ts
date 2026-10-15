// hooks/useComplianceDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { getComplianceSummary } from '@/services/compliance-summary.service';

export const DASHBOARD_QUERY_KEY = 'complianceDashboard';

export function useComplianceDashboard() {
  return useQuery({
    queryKey: [DASHBOARD_QUERY_KEY],
    queryFn: ({ signal }) => getComplianceSummary(signal),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
