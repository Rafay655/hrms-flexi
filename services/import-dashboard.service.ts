import {api} from '@/lib/api';
import {importData} from '@/services/employee-import.service';
import type {ImportDashboardData} from '@/types/import-dashboard';

export async function getImportDashboard(month?:string,signal?:AbortSignal):Promise<ImportDashboardData>{
  const response=await api.get('/flexi-import/dashboard',{params:month?{month}:undefined,signal});
  const data=importData<ImportDashboardData>(response.data);
  if(!data?.kpi||!data?.row_outcomes)throw new Error('Import dashboard data is unavailable.');
  return {...data,status_breakdown:data.status_breakdown??[],trend:data.trend??[],scope_breakdown:data.scope_breakdown??[],needs_attention:data.needs_attention??[],active_batches:data.active_batches??[],recent_batches:data.recent_batches??[]};
}
