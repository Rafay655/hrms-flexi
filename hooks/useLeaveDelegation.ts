'use client';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import { leaveRequestService } from '@/services/leave-request.service';
export function useLeaveDelegation(enabled=true){
 const company=useAppSelector(s=>s.auth.company?.id);const user=useAppSelector(s=>s.auth.user?.id);
 return useQuery({queryKey:['leave-requests','capabilities',company,user],queryFn:({signal})=>leaveRequestService.capabilities(signal),enabled:enabled&&!!company&&!!user,retry:false,staleTime:15000,refetchOnWindowFocus:'always',refetchInterval:60000});
}
