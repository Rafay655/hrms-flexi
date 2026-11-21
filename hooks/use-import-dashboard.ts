"use client";
import {useQuery} from '@tanstack/react-query';
import {useAppSelector} from '@/store/hooks';
import {parseApiError} from '@/lib/api-error';
import {getImportDashboard} from '@/services/import-dashboard.service';

export function useImportDashboard(month?:string){
  const company=useAppSelector(state=>state.auth.company?.id),user=useAppSelector(state=>state.auth.user?.id);
  return useQuery({queryKey:['flexi-import','dashboard',company,user,month],queryFn:({signal})=>getImportDashboard(month,signal),retry:false,staleTime:30000,refetchInterval:query=>query.state.error&&[401,403,404,422].includes(parseApiError(query.state.error).status??0)?false:query.state.data?.active_batches.length?5000:false});
}
