"use client";
import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {importStudioService} from '@/services/import-studio.service';
import {AppLoader} from '@/components/ui/app-loader';
import {ApiErrorState} from '@/components/ui/api-error-state';
import {Button} from '@/components/ui/button';
import {displayImportValue} from '@/lib/employee-import';
export function ImportAudit({uuid,scope,active}:{uuid:string;scope:string;active:boolean}){
 const [page,setPage]=useState(1);
 const query=useQuery({queryKey:['import-studio',scope,uuid,'audit',page],queryFn:({signal})=>importStudioService.audit(uuid,page,signal),enabled:active,retry:false,refetchOnWindowFocus:false});
 return <section className="space-y-3 rounded-xl border bg-card p-4"><h3 className="font-semibold text-brand-900">Import audit trail</h3>{query.isPending?<AppLoader label="Loading audit events…" />:query.error?<ApiErrorState error={query.error} onRetry={()=>void query.refetch()} />:!query.data?.events.length?<p className="text-sm text-muted-foreground">No audit events were returned.</p>:<ol className="space-y-3">{query.data.events.map((event,index)=><li key={index} className="space-y-1 rounded-lg border p-3"><p className="text-sm font-medium">{displayImportValue(event.message??event.event??event.action)}</p><p className="text-xs text-muted-foreground">{displayImportValue(event.actor??event.actor_name??event.user)} · {displayImportValue(event.created_at??event.timestamp)}</p></li>)}</ol>}<div className="flex justify-between gap-2"><Button size="sm" variant="outline" disabled={page===1||query.isFetching} onClick={()=>setPage(page-1)}>Previous events</Button><span className="text-xs text-muted-foreground">Page {page}</span><Button size="sm" variant="outline" disabled={!query.data?.has_more||query.isFetching} onClick={()=>setPage(page+1)}>More events</Button></div></section>;
}
