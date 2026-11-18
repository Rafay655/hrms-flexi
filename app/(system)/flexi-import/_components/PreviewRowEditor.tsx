"use client";
import {useState} from 'react';
import {useMutation,useQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Modal} from '@/components/shared/directory-ui';
import {AppLoader} from '@/components/ui/app-loader';
import {ApiErrorState} from '@/components/ui/api-error-state';
import {employeeImportService as service,type ImportRow,type QueuedResult} from '@/services/employee-import.service';
import type {FormMode} from '@/types/onboarding-form';
import {ImportPagination,importPrimary} from './import-ui';
import {ImportErrorFeedback} from './import-error-feedback';
import {showApiError} from '@/lib/error-toast';

export function PreviewRowEditor({uuid,scope,mode,revision,onQueued,onRefresh}:{uuid:string;scope:string;mode:FormMode;revision:number;onQueued:(result:QueuedResult)=>void;onRefresh:()=>void}){
 const [page,setPage]=useState(1),[row,setRow]=useState<ImportRow|null>(null),[draft,setDraft]=useState<Record<string,string>>({});
 const fields=useQuery({queryKey:['employee-import',scope,uuid,'editable-fields',mode],queryFn:({signal})=>service.previewFields(mode,signal),retry:false});
 const rows=useQuery({queryKey:['employee-import',scope,uuid,'editable-rows',revision,page],queryFn:({signal})=>service.rows(uuid,'invalid',page,signal),retry:false});
 const definitions=fields.data??[];
 const original=(key:string,label:string)=>{const raw=row?.raw_data??{};const value=Object.hasOwn(raw,key)?raw[key]:raw[label];return value==null?'':String(value);};
 const changes=Object.fromEntries(definitions.filter(field=>Object.hasOwn(draft,field.key)&&draft[field.key]!==original(field.key,field.label)).map(field=>[field.key,draft[field.key]]));
 const save=useMutation({mutationFn:()=>service.correctRows(uuid,[{row_number:row!.row_number,fields:changes}]),retry:false,onSuccess:result=>{setRow(null);setDraft({});onQueued(result);},onError:error=>{showApiError(error);onRefresh();}});
 function open(item:ImportRow){save.reset();setDraft({});setRow(item);}
 return <div className="space-y-3 rounded-lg border border-border p-4"><div><h3 className="text-sm font-semibold">Correct invalid rows</h3><p className="mt-1 text-xs text-muted-foreground">Edit spreadsheet values without uploading again. Reference values use names or employee codes. Saving queues validation; it does not save employees.</p></div>
 {rows.isPending?<AppLoader label="Loading invalid rows…" />:rows.error?<ApiErrorState error={rows.error} onRetry={()=>void rows.refetch()} />:<><div className="divide-y divide-border">{rows.data?.data.filter(item=>item.status==='invalid').map(item=><div key={item.row_number} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">Spreadsheet row {item.row_number}</p><ul className="mt-1 space-y-1 text-xs text-destructive">{item.validation_errors?.map((error,index)=><li key={index}>{error.message}</li>)}</ul></div><Button size="sm" variant="outline" onClick={()=>open(item)}>Edit row</Button></div>)}{!rows.data?.data.length&&<p className="py-3 text-sm text-muted-foreground">No invalid rows.</p>}</div><ImportPagination page={page} count={rows.data?.data.length??0} total={rows.data?.total} lastPage={rows.data?.lastPage} hasNext={rows.data?.hasNext??false} onPage={setPage} disabled={rows.isFetching} /></>}
 {row&&<Modal title={`Correct spreadsheet row ${row.row_number}`} description="Only changed fields will be sent. Keep reference values as human-readable names, including manager employee codes." busy={save.isPending} onClose={()=>setRow(null)} footer={<><Button variant="outline" disabled={save.isPending} onClick={()=>setRow(null)}>Cancel</Button><Button className={importPrimary} disabled={save.isPending||fields.isPending||!!fields.error||!Object.keys(changes).length||Object.keys(changes).length>200} onClick={()=>save.mutate()}>{save.isPending?'Saving…':'Save and re-check'}</Button></>}>
 {fields.isPending?<AppLoader label="Loading editable fields…" />:fields.error?<ApiErrorState error={fields.error} onRetry={()=>void fields.refetch()} />:<div className="grid gap-4 sm:grid-cols-2">{definitions.map(field=><div key={field.key} className="space-y-2"><Label htmlFor={`correction-${field.key}`}>{field.label}</Label><Input id={`correction-${field.key}`} value={draft[field.key]??original(field.key,field.label)} maxLength={5000} disabled={save.isPending} onChange={event=>setDraft(previous=>({...previous,[field.key]:event.target.value}))} />{field.description&&<p className="text-xs text-muted-foreground">{field.description}</p>}</div>)}</div>}
 <ImportErrorFeedback error={save.error} />
 </Modal>}
 </div>;
}
