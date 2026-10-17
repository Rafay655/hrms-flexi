'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import { employeeBadgeService } from '@/services/employee-badge.service';
import type { BadgeAssignment, EmployeeBadgeFilters } from '@/types/employee-badge';
export const employeeBadgeKeys = { all: ['employee-badges'] as const };
export function useEmployeeBadges(filters: EmployeeBadgeFilters) {
  const company = useAppSelector(state => state.auth.company?.id);
  const user = useAppSelector(state => state.auth.user?.id);
  return useQuery({ queryKey: [...employeeBadgeKeys.all, company, user, filters], queryFn: ({ signal }) => employeeBadgeService.list(filters, signal), retry: false,
    placeholderData: (previous, query) => query?.queryKey[1] === company && query?.queryKey[2] === user ? previous : undefined });
}
export function useBadgeMutations() {
  const client = useQueryClient();
  const onSuccess = () => { void client.invalidateQueries({ queryKey: employeeBadgeKeys.all }); void client.invalidateQueries({ queryKey: ['employees'] }); };
  const assign = useMutation({ mutationFn: ({ uuid, badge }: { uuid: string; badge: string }) => employeeBadgeService.assign(uuid, badge), retry: false, onSuccess });
  const remove = useMutation({ mutationFn: employeeBadgeService.remove, retry: false, onSuccess });
  const bulk = useMutation({ mutationFn: (rows: BadgeAssignment[]) => employeeBadgeService.bulk(rows), retry: false, onSuccess });
  return { assign, remove, bulk };
}
