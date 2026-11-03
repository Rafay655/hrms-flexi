import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/store/hooks';
import { showApiError } from '@/lib/error-toast';
import { compOffService,type CompOffFormData } from '@/services/comp-off.service';
import type { CompOffFilters } from '@/types/comp-off';
export const compOffKeys={all:['comp-off'] as const,lists:()=>['comp-off','list'] as const,list:(params:CompOffFilters)=>['comp-off','list',params] as const,my:(params:CompOffFilters)=>['comp-off','my',params] as const};
export function useCompOffs(params?:CompOffFilters,enabled=true){const company=useAppSelector(s=>s.auth.company?.id);const user=useAppSelector(s=>s.auth.user?.id);return useQuery({queryKey:[...compOffKeys.list(params||{}),company,user],queryFn:({signal})=>compOffService.getAll(params,signal),enabled,retry:false});}
export function useMyCompOffs(params?:CompOffFilters,enabled=true){const company=useAppSelector(s=>s.auth.company?.id);const user=useAppSelector(s=>s.auth.user?.id);const filters={status:params?.status};return useQuery({queryKey:[...compOffKeys.my(filters),company,user],queryFn:({signal})=>compOffService.getMy(filters,signal),enabled,retry:false});}
export function useCreateCompOff(){const client=useQueryClient();return useMutation({mutationFn:(data:CompOffFormData)=>compOffService.create(data),retry:false,onSuccess:()=>{void client.invalidateQueries({queryKey:compOffKeys.all});void client.invalidateQueries({queryKey:['leave-ease']});toast.success('Comp-off record created');},onError:(error:unknown)=>showApiError(error)});}
