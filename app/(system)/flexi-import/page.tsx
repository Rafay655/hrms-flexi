"use client";
import Link from 'next/link';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Frame} from '@/components/shared/directory-ui';
import {AppLoader} from '@/components/ui/app-loader';
import {ApiErrorState} from '@/components/ui/api-error-state';
import {useAppSelector} from '@/store/hooks';
import {api} from '@/lib/api';
import {normalizeImportDashboard} from '@/lib/flexi-import-dashboard';
import {friendlyStatus} from '@/lib/import-studio';
import {ImportStat,importPrimary} from './_components/import-ui';
export default function FlexiImportDashboard(){
 const company=useAppSelector(state=>state.auth.company?.id),user=useAppSelector(state=>state.auth.user?.id);
 const dashboard=useQuery({queryKey:['flexi-import','dashboard',company,user],queryFn:async({signal})=>{const response=await api.get('/flexi-import/dashboard',{signal});if(response.data.success===false)throw response.data;return response.data.data;},select:normalizeImportDashboard,staleTime:60000});
 const data=dashboard.data;
 return <Frame title="Import overview" description="Prepare files, resolve pending work and track actual import results." actions={<><Button variant="outline" asChild><Link href="/flexi-import/templates">Importer templates</Link></Button><Button className={importPrimary} asChild><Link href="/flexi-import/new">New Import</Link></Button></>}>
 {dashboard.isPending?<AppLoader label="Loading import overview…" />:dashboard.error?<ApiErrorState error={dashboard.error} onRetry={()=>void dashboard.refetch()} />:<><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><ImportStat label="Imports this month" value={data?.total_imports_month??0} /><ImportStat label="Successful rows this month" value={data?.successful_rows_month??0} /><ImportStat label="Failed rows this month" value={data?.failed_rows_month??0} />{data?.can_view_pending_approvals&&<ImportStat label="Pending approvals" value={data.pending_approval_count} />}</div>
 <section className="overflow-hidden rounded-xl border border-border"><div className="flex items-center justify-between gap-3 border-b border-border p-4"><h2 className="font-semibold">Recent imports</h2><Button variant="outline" size="sm" asChild><Link href="/flexi-import/batches">View history</Link></Button></div>{!data?.recent_batches.length?<div className="space-y-4 p-10 text-center"><p className="text-sm text-muted-foreground">No imports yet. Start an import.</p><Button className={importPrimary} asChild><Link href="/flexi-import/new">New Import</Link></Button></div>:<div className="overflow-auto"><table className="w-full min-w-[750px] text-left text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr>{['Type','Status','Rows / result','Creator','Created',''].map((label,index)=><th key={index} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{data.recent_batches.map(batch=><tr key={batch.uuid} className="hover:bg-muted/20"><td className="px-4 py-3 font-medium">{batch.import_type}</td><td className="px-4 py-3">{friendlyStatus(batch.status)}</td><td className="px-4 py-3"><p>{batch.total_rows} source rows</p>{['completed','failed','rolled_back'].includes(batch.status)?<p className="mt-1 text-xs text-muted-foreground">{batch.successful_rows??'—'} successful · {batch.failed_rows??'—'} failed · {batch.skipped_rows??'—'} skipped</p>:<p className="mt-1 text-xs text-muted-foreground">Preview / queued · not committed</p>}</td><td className="px-4 py-3">{batch.initiated_by??'—'}</td><td className="px-4 py-3 text-xs text-muted-foreground">{batch.created_at?new Date(batch.created_at).toLocaleDateString():'—'}</td><td className="px-4 py-3"><Button size="sm" variant="outline" asChild><Link href={`/flexi-import/batches/${encodeURIComponent(batch.uuid)}`}>Open</Link></Button></td></tr>)}</tbody></table></div>}</section></>}
 </Frame>;
}
