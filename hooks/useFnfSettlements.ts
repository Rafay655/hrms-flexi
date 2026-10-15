// hooks/useFnfSettlements.ts

import { useQuery } from "@tanstack/react-query";
import { fetchFnfSettlements, fetchExits, fetchFnfSettlement } from "@/services/fnf-settlements";

export function useFnfSettlements(params: {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["fnf-settlements", params],
    queryFn: () => fetchFnfSettlements(params),
    staleTime: 60_000,
  });
}

export function useExits(params?: {
  page?: number;
  per_page?: number;
}) {
  return useQuery({
    queryKey: ["exits", params],
    queryFn: () => fetchExits(params),
    staleTime: 60_000,
  });
}

export function useFnfSettlement(id: string | null) {
  return useQuery({
    queryKey: ["fnf-settlement", id],
    queryFn: () => fetchFnfSettlement(id!),
    enabled: !!id,
  });
}