import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/store/hooks';
import { showApiError } from '@/lib/error-toast';
import { leaveEncashmentService } from '@/services/leave-encashment.service';
import type { LeaveEncashmentFormData,EncashmentFilters } from '@/types/leave-encashment';
export const leaveEncashmentKeys={all:['leave-encashments'] as const,lists:()=>['leave-encashments','list'] as const,list:(params:EncashmentFilters)=>['leave-encashments','list',params] as const};
export function useLeaveEncashments(params:EncashmentFilters){const user=useAppSelector(s=>s.auth.user?.id);const company=useAppSelector(s=>s.auth.company?.id);return useQuery({queryKey:[...leaveEncashmentKeys.list(params),company,user],queryFn:({signal})=>leaveEncashmentService.getAll(params,signal),enabled:!!company,retry:false});}
export function useCreateLeaveEncashment(){const client=useQueryClient();return useMutation({mutationFn:(data:LeaveEncashmentFormData)=>leaveEncashmentService.create(data),retry:false,onSuccess:()=>{void client.invalidateQueries({queryKey:leaveEncashmentKeys.all});void client.invalidateQueries({queryKey:['leave-ease']});toast.success('Encashment created');},onError:(error:unknown)=>showApiError(error)});}
