"use client";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/store/hooks";
import { getFlexiHqDashboard } from "@/services/flexi-hq-dashboard.service";

export function useFlexiHQDashboard() {
  const company = useAppSelector(state => state.auth.company?.id);
  const user = useAppSelector(state => state.auth.user?.id);
  return useQuery({
    queryKey: ["flexi-hq", "dashboard", user, company],
    queryFn: ({ signal }) => getFlexiHqDashboard(signal),
    enabled: Boolean(user && company),
    placeholderData: undefined,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}
