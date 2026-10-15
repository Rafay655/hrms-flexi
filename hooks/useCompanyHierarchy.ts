import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hierarchyService } from "@/services/hierarchy.service";
import type { SaveHierarchyPayload } from "@/services/hierarchy.service";

export const companyHierarchyQueryKeys = {
  all: ["company-hierarchy"] as const,

  detail: (companyId: string | number) =>
    [...companyHierarchyQueryKeys.all, "detail", companyId] as const,

  unassigned: (companyId: string | number) =>
    [...companyHierarchyQueryKeys.all, "unassigned", companyId] as const,
};

export function useCompanyHierarchy(companyId?: string | number) {
  return useQuery({
    queryKey: companyHierarchyQueryKeys.detail(companyId ?? ""),
    queryFn: () =>
      hierarchyService.getCompanyHierarchy(companyId as string | number),
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUnassignedHierarchy(companyId?: string | number) {
  return useQuery({
    queryKey: companyHierarchyQueryKeys.unassigned(companyId ?? ""),
    queryFn: () =>
      hierarchyService.getUnassignedHierarchy(companyId as string | number),
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 5,
  });
}



export function useSaveCompanyHierarchy(companyId?: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveHierarchyPayload) =>
      hierarchyService.saveCompanyHierarchy(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyHierarchyQueryKeys.detail(companyId ?? ""),
      });

      queryClient.invalidateQueries({
        queryKey: companyHierarchyQueryKeys.unassigned(companyId ?? ""),
      });
    },
  });
}