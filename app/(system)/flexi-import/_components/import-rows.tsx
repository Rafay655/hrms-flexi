"use client";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import SearchableSelect from '@/components/ui/searchable-select';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import { employeeImportService as service } from '@/services/employee-import.service';
import { displayImportValue } from '@/lib/employee-import';
import { ImportPagination } from './import-ui';
export function ImportRows({uuid,revision,scope}:{uuid:string;revision:number;scope:string}){
 const [status,setStatus]=useState(''),[page,setPage]=useState(1);
 const rows=useQuery({queryKey:['employee-import',scope,uuid,'rows',revision,status,page],queryFn:({signal})=>service.rows(uuid,status,page,signal),retry:false});
 return <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Server preview · 50 rows per page</p><SearchableSelect aria-label="Import row status" widthClass="w-full sm:w-48" value={status} allLabel="All rows" options={['invalid','valid','failed','committed','skipped','rolled_back'].map(value=>({value,label:value.charAt(0).toUpperCase()+value.slice(1).replaceAll('_',' ')}))} onChange={value=>{setStatus(value);setPage(1);}} /></div>
 {rows.isPending?<AppLoader label="Loading employee preview…" />:rows.error?<ApiErrorState error={rows.error} onRetry={()=>void rows.refetch()} />:<div className="overflow-hidden rounded-lg border border-border"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><caption className="sr-only">Employee changes and validation</caption><thead className="border-b bg-muted/40"><tr>{['Employee / row','Action','Change preview','Validation'].map(label=><th key={label} scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{!rows.data?.data.length?<tr><td colSpan={4} className="p-10 text-center text-sm text-muted-foreground">No rows in this view.</td></tr>:rows.data.data.map(row=>{
 const code=row.raw_data?.['Employee ID']??row.raw_data?.['Employee Code'];
 const name=row.raw_data?.['Name']??[row.raw_data?.['First Name'],row.raw_data?.['Last Name']].filter(Boolean).join(' ');
 const action=row.row_action==='create'?'New':row.row_action?row.row_action.charAt(0).toUpperCase()+row.row_action.slice(1):'Pending';
 const errors=row.validation_errors??[];
 return <tr key={row.row_number} className="text-sm transition-colors hover:bg-muted/20"><td className="px-5 py-4 align-top"><p className="font-medium text-foreground">{code?displayImportValue(code):`Row ${row.row_number}`}</p>{!!name&&<p className="mt-1 text-xs text-muted-foreground">{displayImportValue(name)}</p>}<p className="mt-1 text-xs text-muted-foreground">Spreadsheet row {row.row_number}</p><details className="mt-2"><summary className="cursor-pointer text-xs text-brand-700">View row values</summary><dl className="mt-2 max-h-52 max-w-64 space-y-2 overflow-auto">{Object.entries(row.raw_data??{}).map(([key,value])=><div key={key}><dt className="text-xs font-medium">{key}</dt><dd className="break-words text-xs text-muted-foreground">{displayImportValue(value)}</dd></div>)}</dl></details></td>
 <td className="px-5 py-4 align-top"><Badge variant="outline" className={action==='New'?'border-brand-500/50 bg-brand-500/15 text-brand-800':'border-brand-800/15 bg-brand-100 text-brand-800'}>{action}</Badge></td>
 <td className="max-w-sm px-5 py-4 align-top">{row.value_diff?.length?<ul className="space-y-3">{row.value_diff.map((diff,index)=><li key={`${diff.key}-${index}`}><p className="text-xs font-medium text-foreground">{diff.field}</p><p className="mt-1 flex flex-wrap items-center gap-2 text-xs"><span className="break-all text-muted-foreground line-through">{displayImportValue(diff.old)}</span><span aria-label="changes to" className="text-brand-700">→</span><span className="break-all font-medium text-brand-800">{diff.new===null?'Cleared':displayImportValue(diff.new)}</span></p></li>)}</ul>:<p className="text-xs text-muted-foreground">{action==='Unchanged'?'No changes to save':action==='New'?'New employee profile':'No changed values reported'}</p>}</td>
 <td className="max-w-sm px-5 py-4 align-top"><Badge variant="outline" className={['invalid','failed'].includes(row.status)?'border-brand-400/50 bg-brand-400/15 text-destructive':'border-border bg-muted/30 text-foreground'}>{row.status.replaceAll('_',' ')}</Badge>{errors.length>0&&<ul className="mt-2 space-y-2 text-xs text-destructive">{errors.map((error,index)=><li key={index}>{[error.field,error.message].filter(Boolean).join(': ')}</li>)}</ul>}{row.processing_error&&<p className="mt-2 text-xs text-destructive">{row.processing_error}</p>}</td></tr>;
 })}</tbody></table></div><ImportPagination page={rows.data?.page??page} count={rows.data?.data.length??0} total={rows.data?.total} lastPage={rows.data?.lastPage} hasNext={rows.data?.hasNext??false} onPage={setPage} disabled={rows.isFetching} /></div>}
 </div>;
}
