"use client";
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ExternalLink,CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';
import { Modal } from '@/components/shared/directory-ui';
import { employeeImportService as service,type GapReport,type GapDecision,type GapResolutionResult,type GapTable,type ReferenceGap,type GapExtraField } from '@/services/employee-import.service';
import { gapIdentity,gapSetupPath,displayImportValue,normalizeGapSuggestion,gapFieldLabel } from '@/lib/employee-import';
import { showApiError } from '@/lib/error-toast';
import { ImportErrorFeedback } from './import-error-feedback';
import { importAccent,importPrimary } from './import-ui';
type Draft={action:string;extra:Record<string,string>};
function extraDescriptor(raw:GapExtraField|string):GapExtraField{return typeof raw==='string'?{key:raw,label:raw.replaceAll('_',' ').replace(/^./,s=>s.toUpperCase()),type:raw.includes('date')||raw==='effective_from'?'date':'text',required:true}:raw;}
export function ReferenceGaps({uuid,report,disabled,onResolved,onRefresh,onJumpToRow}:{uuid:string;report:GapReport;disabled:boolean;onResolved:(result:GapResolutionResult)=>void;onRefresh:()=>void;onJumpToRow?:(rowNumber:number)=>void}){
 const [drafts,setDrafts]=useState<Record<string,Draft>>({}),[result,setResult]=useState<GapResolutionResult|null>(null),[confirmCreate,setConfirmCreate]=useState(false);
 const tables=report.tables.map(table=>({...table,values:table.values.map(value=>({...value,suggestion:normalizeGapSuggestion(value.suggestion)}))}));
 const values=tables.flatMap(table=>table.values.map(value=>({table,value,key:gapIdentity(value)})));
 const selected=values.filter(({key})=>drafts[key]?.action);
 const creationCount=selected.filter(({key})=>drafts[key].action==='create').length;
 function update(key:string,patch:Partial<Draft>){setDrafts(previous=>({...previous,[key]:{...(previous[key]??{action:'',extra:{}}),...patch}}));}
 function canCreate(table:GapTable,value:ReferenceGap){return table.creatable&&(!table.needs_parent||value.parent_id!==null);}
 const resolve=useMutation({mutationFn:()=>{
  const decisions:GapDecision[]=selected.map(({table,value,key})=>{
   const draft=drafts[key],base={source_key:table.source_key,value:value.value,...(value.parent_id!==null?{parent_id:value.parent_id}:{})};
   if(draft.action==='use_existing'){
    if(!value.suggestion?.id)throw new Error(`Choose the current suggestion for ${value.value}.`);
    return {...base,action:'use_existing',existing_id:value.suggestion.id};
   }
   if(!canCreate(table,value))throw new Error(`Complete ${gapFieldLabel(value)} in setup, then re-check.`);
   const extras:Record<string,string|number|boolean>={};
   for(const raw of table.extra_fields??[]){const field=extraDescriptor(raw),input=(draft.extra[field.key]??String(field.default??'')).trim();if(field.required&&!input)throw new Error(`${field.label} is required for ${value.value}.`);if(['source_key','value','action','existing_id','parent_id'].includes(field.key))throw new Error('The reference form contains conflicting metadata. Open setup instead.');if(input)extras[field.key]=['number','integer','decimal'].includes(field.type)?Number(input):['boolean','checkbox','toggle'].includes(field.type)?['1','true'].includes(input):input;}
   return {...base,action:'create',...(Object.keys(extras).length?{extra:extras}:{})};
  });
  return service.resolve(uuid,decisions);
 },onSuccess:response=>{
  setResult(response);setConfirmCreate(false);
  const failed=new Set(response.failed.map(f=>JSON.stringify([f.source_key,f.value])));
  setDrafts(previous=>Object.fromEntries(Object.entries(previous).filter(([key])=>{const value=values.find(item=>item.key===key)?.value;return !!value&&failed.has(JSON.stringify([value.source_key,value.value]));})));
  onResolved(response);
 },onError:(error:unknown)=>{showApiError(error);onRefresh();}});
 return <div className="space-y-4">
  <p className="text-xs text-muted-foreground">{report.total_gap_values} missing reference {report.total_gap_values===1?'value':'values'} across {tables.length} {tables.length===1?'source':'sources'}.</p>
  <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-xs leading-5 text-brand-800">Master records are saved when you apply decisions. Canceling or rolling back this employee import does not delete those reference records.</div>
  {tables.length===0?<div className="flex items-center gap-2 rounded-lg border border-brand-800/10 bg-brand-100 p-4 text-sm text-brand-800"><CheckCircle2 className="h-4 w-4" />No missing reference values.</div>:tables.map(table=><div key={table.source_key} className="overflow-hidden rounded-lg border border-border"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-brand-100 px-4 py-3"><h3 className="text-sm font-semibold text-brand-800">{gapFieldLabel(table.values[0]??{source_key:table.source_key,source_table:table.source_table})}</h3><span className="text-xs text-muted-foreground">Reference table: {table.source_table}</span></div>{table.warning&&<p className="border-b border-brand-500/30 bg-brand-500/10 px-4 py-3 text-xs leading-5 text-brand-800">{table.warning}</p>}{table.blocked_reason&&<p className="border-b border-border px-4 py-3 text-xs leading-5 text-muted-foreground">{table.blocked_reason}</p>}<div className="divide-y divide-border">{table.values.map(value=>{
   const key=gapIdentity(value),draft=drafts[key]??{action:'',extra:{}},creatable=canCreate(table,value);
   return <div key={key} className="grid gap-4 p-4 md:grid-cols-2"><div className="min-w-0"><p className="break-words text-sm font-semibold text-foreground">{value.value}</p>{value.suggestion&&<p className="mt-1 text-xs text-muted-foreground">Suggested existing value: <strong className="text-brand-800">{value.suggestion.label}</strong>{value.suggestion.confidence!==undefined&&<span className="ml-2 rounded-md bg-brand-100 px-2 py-0.5 text-brand-700">{value.suggestion.confidence}% match</span>}</p>}{value.row_count!==undefined&&<p className="mt-2 text-xs text-muted-foreground">{value.row_count.toLocaleString()} affected {value.row_count===1?'row':'rows'}</p>}
    {!!value.rows?.length&&<div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
     <span>{value.rows.length===1?'Row sample:':'Row samples:'}</span>
     {onJumpToRow?value.rows.slice(0,50).map(rowNumber=><button type="button" key={rowNumber} disabled={disabled||resolve.isPending}
      className="rounded-sm py-1 font-medium text-brand-800 underline underline-offset-2 disabled:opacity-50"
      onClick={()=>onJumpToRow(Number(rowNumber))}>Jump to row {rowNumber}</button>):<span>{value.rows.slice(0,50).join(', ')}</span>}
     {value.rows.length>50&&<span>…</span>}
    </div>}
    {value.parent_label&&<p className="mt-2 text-xs text-muted-foreground">Under {value.parent_source_key?.replaceAll('_',' ')??'parent'}: {value.parent_label}</p>}{value.message&&<p className="mt-2 text-xs leading-5 text-muted-foreground">{value.message}</p>}{!!value.decision&&<p className="mt-2 text-xs font-medium text-brand-700">A decision is saved. Revalidate to refresh this preview.</p>}</div><div className="min-w-0 space-y-3">
    {(value.suggestion||creatable)&&<SearchableSelect aria-label={`Resolution for ${value.value}`} widthClass="w-full" value={draft.action} allLabel="Select an action…" disabled={disabled||resolve.isPending} options={[...(value.suggestion?[{value:'use_existing',label:`Use existing “${value.suggestion.label}”`}]:[]),...(creatable?[{value:'create',label:`Create “${value.value}”`}]:[])]} onChange={action=>update(key,{action})} />}
    {draft.action==='create'&&creatable&&(table.extra_fields??[]).map(raw=>{const field=extraDescriptor(raw);return <div key={field.key} className="space-y-1.5"><Label htmlFor={`gap-${key}-${field.key}`}>{field.label}{field.required?' *':''}</Label>{field.options?.length?<SearchableSelect aria-label={`${field.label} for ${value.value}`} widthClass="w-full" allowAll={false} value={draft.extra[field.key]??String(field.default??'')} disabled={disabled||resolve.isPending} options={field.options.map(option=>({value:String(option.value??option.id??''),label:option.label}))} onChange={input=>update(key,{extra:{...draft.extra,[field.key]:input}})} />:['boolean','checkbox','toggle'].includes(field.type)?<Checkbox id={`gap-${key}-${field.key}`} aria-label={`${field.label} for ${value.value}`} disabled={disabled||resolve.isPending} checked={['1','true'].includes(draft.extra[field.key]??String(field.default??''))} onCheckedChange={checked=>update(key,{extra:{...draft.extra,[field.key]:checked===true?'1':'0'}})} />:<Input id={`gap-${key}-${field.key}`} type={['date','number','email'].includes(field.type)?field.type:'text'} required={field.required} disabled={disabled||resolve.isPending} value={draft.extra[field.key]??String(field.default??'')} onChange={event=>update(key,{extra:{...draft.extra,[field.key]:event.target.value}})} />}</div>;})}
    {!creatable&&<a href={gapSetupPath(value)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand-800 underline">Open setup<ExternalLink className="h-3 w-3" /></a>}
    {table.needs_parent&&value.parent_id===null&&<p className="text-xs leading-5 text-muted-foreground">Resolve the parent reference first, then revalidate this batch. The parent must be selected in its own setup screen.</p>}
   </div></div>;
  })}</div></div>)}
  {selected.length>0&&<div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{selected.length} selected · Up to 500 decisions per request</p><Button className={importAccent} disabled={disabled||resolve.isPending||selected.length>500} onClick={()=>creationCount?setConfirmCreate(true):resolve.mutate()}>{resolve.isPending?'Applying decisions…':'Apply decisions'}</Button></div>}
  {result&&<div role="status" className="space-y-2 rounded-lg border border-brand-800/15 bg-brand-100 p-4 text-sm text-brand-800"><p>{result.decided} decisions applied · {result.created.length} master records created.</p>{result.failed.length>0?<><p className="font-medium">{result.failed.length} decisions still need attention:</p><ul className="space-y-1 text-xs">{result.failed.map((failure,index)=><li key={index}>{[failure.value,failure.message??failure.error??Object.values(failure.errors??{}).flat().join(' ')].filter(Boolean).join(': ')||'A reference decision could not be applied.'}</li>)}</ul></>:<p className="text-xs">Revalidate the file to refresh row validation and changes.</p>}</div>}
  <ImportErrorFeedback error={resolve.error} />
  {confirmCreate&&<Modal title="Create reference records?" description="These records are saved immediately and are shared wherever this reference source is used." busy={resolve.isPending} onClose={()=>setConfirmCreate(false)} footer={<><Button variant="outline" disabled={resolve.isPending} onClick={()=>setConfirmCreate(false)}>Cancel</Button><Button className={importPrimary} disabled={resolve.isPending||disabled} onClick={()=>resolve.mutate()}>{resolve.isPending?'Applying…':'Create & apply decisions'}</Button></>}><p className="text-sm text-muted-foreground">You are creating {creationCount} new master record{creationCount===1?'':'s'}. They remain if this employee import is canceled or rolled back.</p><ul className="mt-3 space-y-1 text-xs text-foreground">{selected.filter(({key})=>drafts[key].action==='create').map(({value,key})=><li key={key}>{gapFieldLabel(value)}: {displayImportValue(value.value)}</li>)}</ul><ImportErrorFeedback error={resolve.error} /></Modal>}
 </div>;
}
