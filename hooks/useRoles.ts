// hooks/useRoles.ts
import { useQuery } from "@tanstack/react-query";
import { roleService } from "@/services/roleService"; // adjust to your actual service layer

export const roleKeys = {
  all: ["roles"] as const,
  list: () => [...roleKeys.all, "list"] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () => roleService.getAll(),
    staleTime: 5 * 60 * 1000, // roles rarely change, safe to cache longer
  });
}