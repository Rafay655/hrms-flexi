"use client";

import { useQuery } from "@tanstack/react-query";
import { getComplianceDashboard } from "@/services/compliance-dashboard.service";

export const complianceDashboardKeys = {
  all: ["dms", "compliance", "dashboard"] as const,
};

export function useComplianceDashboard() {
  return useQuery({
    queryKey: complianceDashboardKeys.all,
    queryFn: getComplianceDashboard,
    staleTime: 30 * 1000,
  });
}