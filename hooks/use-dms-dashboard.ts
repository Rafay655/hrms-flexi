"use client";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/store/hooks";
import { getDmsDashboard } from "@/services/dms-dashboard";
export function useDmsDashboard(month?: string) {
  const company = useAppSelector(state => state.auth.company?.id);
  const user = useAppSelector(state => state.auth.user?.id);
  return useQuery({ queryKey: ["dms", "dashboard", company, user, month], queryFn: ({ signal }) => getDmsDashboard(month, signal), retry: false });
}
