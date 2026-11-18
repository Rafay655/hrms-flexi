"use client";
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import { employeeImportService } from '@/services/employee-import.service';
import { EmployeeBatchReview } from '../../_components/employee-batch-review';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import LegacyBatchDetail from './legacy-batch-detail';
export default function BatchDetailPage(){
  const {uuid}=useParams<{uuid:string}>();
  const company=useAppSelector(s=>s.auth.company?.id),user=useAppSelector(s=>s.auth.user?.id);
  const detail=useQuery({queryKey:['employee-import',`${company}:${user}`,uuid,'detail'],queryFn:({signal})=>employeeImportService.detail(uuid,signal),retry:false});
  if(detail.isPending)return <AppLoader label="Loading import…" />;
  if(detail.error)return <ApiErrorState error={detail.error} onRetry={()=>void detail.refetch()} />;
  return detail.data?.import_type==='employees'||detail.data?.import_type==='employee'?<EmployeeBatchReview key={`${company}-${user}-${uuid}`} uuid={uuid} />:<LegacyBatchDetail />;
}
