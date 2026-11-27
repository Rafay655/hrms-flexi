"use client";
import {useEffect,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {AlertCircle,CheckCircle2,ChevronRight,Columns3} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {Label} from '@/components/ui/label';
import {Modal} from '@/components/shared/directory-ui';
import {AppLoader} from '@/components/ui/app-loader';
import {ApiErrorState} from '@/components/ui/api-error-state';
import type {FormMode} from '@/types/onboarding-form';
import {displayImportValue} from '@/lib/employee-import';
import {studioRows,studioFields,friendlyStatus,issueCategory,fieldTypeLabel} from '@/lib/import-studio';
import {importPrimary} from './import-ui';
import type {FieldDefinition} from '@/lib/flexi-import';
import {editablePreviewRow} from '@/lib/import-preview';
import SearchableSelect from '@/components/ui/searchable-select';
import {fieldForColumn,importFieldValue,previewFieldKey,useImportPreviewSchema,RowCorrectionDialog,readImportPreviewPage,type DraftImportRow,type SavedRowCorrection} from './PreviewRowEditor';
export function ImportRows({uuid,revision,scope,mode,importType='employees',templateUuid,templateVersion,canEdit=false,onQueued,onRefresh,previewFields,columnMapping={},totalRows,onRecheck,rechecking=false,hasDraftCorrections=false,jumpTarget,onJumpHandled}:{uuid:string;revision:number;scope:string;mode?:FormMode;importType?:string;templateUuid?:string|null;templateVersion?:number|null;canEdit?:boolean;previewFields?:FieldDefinition[];columnMapping?:Record<string,string>;totalRows?:number;onRecheck?:()=>void;rechecking?:boolean;hasDraftCorrections?:boolean;jumpTarget?:{rowNumber:number}|null;onJumpHandled?:()=>void;onQueued?:(result:SavedRowCorrection)=>void;onRefresh?:()=>void}){
 const [status,setStatus]=useState(''),[page,setPage]=useState(1),[search,setSearch]=useState(''),[action,setAction]=useState(''),[hidden,setHidden]=useState<string[]>([]),[columnsOpen,setColumnsOpen]=useState(false),[detail,setDetail]=useState<DraftImportRow|null>(null),[editing,setEditing]=useState<DraftImportRow|null>(null),[view,setView]=useState<'data'|'issues'|'changes'>('data'),[warningsOnly,setWarningsOnly]=useState(false);
 const [focusFieldKey,setFocusFieldKey]=useState<string>();
 function openEditor(row:DraftImportRow,fieldKey?:string){setFocusFieldKey(fieldKey);setEditing(row);}
 const [headers,setHeaders]=useState<string[]>([]);
 const [pageSize,setPageSize]=useState(50),[issuesPerPage,setIssuesPerPage]=useState(10);
 const [activeJump,setActiveJump]=useState<{rowNumber:number}|null>(null);
 const focusedJump=useRef<typeof activeJump>(null);
 const previewElement=useRef<HTMLDivElement>(null);
 const targetElement=useRef<HTMLTableRowElement>(null);
 const issuesList=useRef<HTMLDivElement>(null);
 const [issuePager,setIssuePager]=useState({context:'',page:1});
 const rows=useQuery({
  queryKey:['employee-import',scope,uuid,'rows',revision,status,page,pageSize,activeJump?.rowNumber,hasDraftCorrections],
  queryFn:({signal})=>readImportPreviewPage(uuid,{
   ...(status?{status}:{}),
   ...(activeJump?{row_number:activeJump.rowNumber}:{page}),
   per_page:pageSize,
  },signal),
  retry:false,
 });

 useEffect(()=>{
  if(!jumpTarget)return;
  previewElement.current?.scrollIntoView({block:'start'});
  setActiveJump(jumpTarget);
  setIssuePager({context:'',page:1});
  setStatus('');
  setPage(1);
  setSearch('');
  setAction('');
  setWarningsOnly(false);
  setDetail(null);
  setView('data');
  onJumpHandled?.();
 },[jumpTarget,onJumpHandled]);

 useEffect(()=>{
  if(!rows.data)return;
  setHeaders(previous=>{
   const next=[...new Set([...previous,...rows.data.data.flatMap(row=>Object.keys(row.raw_data??{}))])];
   return next.length===previous.length?previous:next;
  });
 },[rows.data]);

 useEffect(()=>{
  const element=targetElement.current;
  if(!element||!activeJump||focusedJump.current===activeJump||rows.isFetching)return;
  focusedJump.current=activeJump;
  element.scrollIntoView({block:'center',inline:'nearest'});
  element.focus({preventScroll:true});
 },[activeJump,rows.data,rows.isFetching]);
 const schema=useImportPreviewSchema(scope,uuid,mode,importType,templateUuid,templateVersion);
 const mergedFields=new Map<string,FieldDefinition&{field_key:string}>();
 for(const field of [...(schema.data??[]),...(previewFields??[])]){
  const key=previewFieldKey(field);
  if(key&&!mergedFields.has(key))mergedFields.set(key,{...field,key,field_key:key,required:field.required??false});
 }
 const metadata=[...mergedFields.values()];
 const definitions=studioFields(metadata);
 const editableKeys=new Set((previewFields??[]).map(previewFieldKey));
 const editorFields=metadata.filter(field=>editableKeys.has(field.field_key));
 const allHeaders=[...new Set([...headers,...(rows.data?.data??[]).flatMap(row=>Object.keys(row.raw_data??{}))])];
 const fields=allHeaders.map(header=>{
  const field=fieldForColumn(header,definitions,columnMapping);
  return {
   key:header,
   requestKey:field?.key??header,
   label:field?.label??header,
   type:field?.type??'text',
   required:field?.required??false,
  };
 });
 const columns=fields.filter(field=>field.required||!hidden.includes(field.key));
 const editable=canEdit&&editorFields.length>0;
 const total=rows.data?.total??(!status?totalRows:undefined);
 const currentPage=rows.data?.page??page;
 const lastPage=rows.data?.lastPage??(total!==undefined?Math.max(1,Math.ceil(total/pageSize)):currentPage+(rows.data?.hasNext?1:0));
 const rowCount=rows.data?.data.length??0;
 const rowStart=rowCount?(currentPage-1)*pageSize+1:0;
 const rowEnd=rowCount?rowStart+rowCount-1:0;
 function goToPage(next:number){setActiveJump(null);setPage(next);setIssuePager({context:'',page:1});}
 const filtered=studioRows(rows.data?.data??[]).filter(row=>(!warningsOnly||row.source.validation_errors?.some(issue=>issue.severity==='warning'))&&(!action||row.action===action)&&(!search||fields.some(field=>String(importFieldValue(row.source,{key:field.requestKey,label:field.label},columnMapping,field.key)??'').toLowerCase().includes(search.toLowerCase()))));
 const pageIssues=(rows.data?.data??[]).flatMap(row=>(row.validation_errors??[]).map(issue=>({row,issue})));
 const issueContext=JSON.stringify([uuid,revision,status,currentPage,pageSize,activeJump?.rowNumber]);
 const issueLastPage=Math.max(1,Math.ceil(pageIssues.length/issuesPerPage));
 const issuePage=Math.min(issuePager.context===issueContext?issuePager.page:1,issueLastPage);
 const issueOffset=(issuePage-1)*issuesPerPage;
 const visibleIssues=pageIssues.slice(issueOffset,issueOffset+issuesPerPage);
 function goToIssuePage(next:number){
  setIssuePager({context:issueContext,page:next});
  if(issuesList.current)issuesList.current.scrollTop=0;
 }
 function setRowStatus(value:string){setStatus(value);goToPage(1);setWarningsOnly(false);}
 return <div ref={previewElement} className="min-w-0 scroll-mt-24 space-y-3"><div className="sticky top-20 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-sm"><Input aria-label="Search current page" placeholder="Search this page…" className="h-9 w-full sm:w-56" value={search} onChange={event=>setSearch(event.target.value)} /><SearchableSelect aria-label="Import row status" widthClass="w-44" value={status} allowAll={false} placeholder="All rows" options={['','invalid','valid','failed','committed','skipped','rolled_back'].map(value=>({value,label:value?friendlyStatus(value):'All rows'}))} onChange={setRowStatus} /><SearchableSelect aria-label="Change type on current page" widthClass="w-52" value={action} allowAll={false} placeholder="All changes on page" options={[['','All changes on page'],['create','New'],['update','Update'],['unchanged','Unchanged']].map(([value,label])=>({value,label}))} onChange={setAction} /><Button size="sm" variant="outline" onClick={()=>{setRowStatus('invalid');setView('issues');}}>Show blocking issues</Button><Button size="sm" variant="outline" onClick={()=>{setStatus('');goToPage(1);setWarningsOnly(!warningsOnly);setView('issues');}}>Warnings on page{warningsOnly?' · on':''}</Button><Button size="sm" variant="outline" onClick={()=>setColumnsOpen(!columnsOpen)}><Columns3 className="mr-2 h-4 w-4" />Columns</Button>{onRecheck&&<Button size="sm" variant="outline" disabled={!canEdit||rechecking||!!editing} onClick={onRecheck}>{rechecking?'Checking the spreadsheet…':'Re-check batch'}</Button>}<label className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
  Rows per page
  <select className="h-9 rounded-md border border-border bg-card px-2 text-foreground" value={pageSize} disabled={rows.isFetching||rows.data?.supportsPageSizing===false} onChange={event=>{setPageSize(Number(event.target.value));goToPage(1);}}>
   {[25,50,100].map(size=><option key={size} value={size}>{size}</option>)}
  </select>
 </label></div>
 {columnsOpen&&<fieldset className="flex flex-wrap gap-4 rounded-lg border border-border p-3"><legend className="px-2 text-xs">Visible columns · required columns stay pinned in the selection</legend>{fields.map(field=><Label key={field.key} className="flex items-center gap-2 text-xs"><Checkbox checked={!hidden.includes(field.key)||field.required} disabled={field.required} onCheckedChange={value=>setHidden(previous=>value?previous.filter(key=>key!==field.key):[...previous,field.key])} />{field.label}</Label>)}</fieldset>}
 <div role="tablist" aria-label="Preview views" className="flex gap-1 border-b border-border">{(['data','issues','changes'] as const).map(value=><button key={value} type="button" role="tab" aria-selected={view===value} onClick={()=>setView(value)} className={`border-b-2 px-4 py-2 text-sm font-medium ${view===value?'border-brand-800 text-brand-800':'border-transparent text-muted-foreground'}`}>{value==='data'?'Data':value==='issues'?'Issues':'Changes'}</button>)}</div>
 <p className="text-xs text-muted-foreground">Search and change filters apply to the current page. Use status filters and page controls to browse the whole file. {editable?'Valid and invalid preview rows can be edited. Save corrections and re-check the batch when you finish.':'This preview is read-only.'}</p>
 {schema.error&&<p role="status" className="rounded-lg border p-3 text-xs text-muted-foreground">Editing metadata is unavailable. Uploaded values remain available in this read-only grid.</p>}
 <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_270px]"><div className="min-w-0">
 {rows.isPending?<AppLoader label="Loading spreadsheet preview…" />:rows.error?<ApiErrorState error={rows.error} onRetry={()=>void rows.refetch()} />:<div className="overflow-hidden rounded-lg border border-border"><div className="max-h-[65vh] overflow-auto"><table data-table-layout="spreadsheet" className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm"><caption className="sr-only">Spreadsheet preview, {view} view. Scroll horizontally for additional columns.</caption><thead className="sticky top-0 z-[3] bg-muted"><tr><th className="sticky left-0 z-[4] min-w-32 border-b border-border bg-muted px-4 py-3">Row / identity</th>{view==='data'?columns.map(field=><th key={field.key} className="min-w-48 border-b border-l border-border px-4 py-3"><span>{field.label}{field.required?' *':''}</span><span className="mt-1 block text-[10px] font-normal text-muted-foreground">{fieldTypeLabel(field.type)}</span></th>):<th className="min-w-96 border-b border-border px-4 py-3">{view==='issues'?'Validation issues':'Before → after'}</th>}<th className="border-b border-border px-4 py-3">Validation / actions</th></tr></thead><tbody>{!filtered.length?<tr><td colSpan={view==='data'?columns.length+2:3} className="p-10 text-center text-muted-foreground">No rows in this view.</td></tr>:filtered.map(item=>{const row=item.source,errors=row.validation_errors??[];return <tr key={item.viewId} ref={activeJump?.rowNumber===row.row_number?targetElement:undefined} tabIndex={activeJump?.rowNumber===row.row_number?-1:undefined} className={activeJump?.rowNumber===row.row_number?'group bg-brand-100 outline outline-2 -outline-offset-2 outline-brand-500':'group hover:bg-muted/20'}><td className="sticky left-0 z-[1] border-b border-border bg-card px-4 py-3 align-top group-hover:bg-muted"><Button size="sm" variant="ghost" className="px-0 text-brand-800" onClick={()=>setDetail(row)}>Row {row.row_number}<ChevronRight className="ml-1 h-3 w-3" /></Button><span className="block max-w-36 truncate text-xs font-medium">{displayImportValue((()=>{const identity=fields.find(field=>['Employee ID','Employee Code','employee_code'].includes(field.label)||field.requestKey==='employee_code');return identity?importFieldValue(row,{key:identity.requestKey,label:identity.label},columnMapping,identity.key):undefined;})())}</span><span className="block text-xs text-muted-foreground">{item.action==='create'?'New':item.action==='update'?'Update':item.action==='unchanged'?'Unchanged':'Pending'}</span></td>{view==='data'?columns.map(field=>{const error=errors.find(error=>error.field===field.key||fieldForColumn(error.field??'',definitions,columnMapping)?.key===field.requestKey);
 const canOpenCell=editable&&editablePreviewRow(row.status)&&editableKeys.has(field.requestKey);return <td key={field.key} tabIndex={0} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();if(canOpenCell)openEditor(row,field.requestKey);else setDetail(row);}else if(['ArrowRight','ArrowLeft'].includes(event.key)){const sibling=event.key==='ArrowRight'?event.currentTarget.nextElementSibling:event.currentTarget.previousElementSibling;if(sibling instanceof HTMLElement){event.preventDefault();sibling.focus();}}}} className={`max-w-72 border-b border-l border-border px-4 py-3 align-top focus:outline-2 focus:outline-brand-500 ${error?'bg-brand-400/10':''}`}><button type="button" onClick={()=>canOpenCell?openEditor(row,field.requestKey):setDetail(row)} className={`min-h-8 w-full rounded-md border px-2 py-1.5 text-left text-xs disabled:cursor-default ${error?'border-brand-400/50 bg-brand-400/10':'border-transparent enabled:hover:border-brand-800/20 enabled:hover:bg-brand-100/40'}`}>{displayImportValue(importFieldValue(row,{key:field.requestKey,label:field.label},columnMapping,field.key))}</button>{error&&<p className="mt-2 flex items-start gap-1 text-xs text-destructive"><AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />{error.message}</p>}</td>;}):<td className="border-b border-border px-4 py-3 align-top">{view==='issues'?errors.length?<ul className="space-y-2">{errors.map((error,index)=><li key={index} className="flex items-start gap-2 text-xs text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{issueCategory(error)}: {error.message}</li>)}</ul>:<span className="text-xs text-muted-foreground">No validation issues reported.</span>:row.value_diff?.length?<ul className="space-y-3">{row.value_diff.map((diff,index)=><li key={index}><p className="text-xs font-medium">{fields.find(field=>field.key===diff.key||field.requestKey===diff.key)?.label??diff.field}</p><p className="mt-1 break-all text-xs"><del className="text-muted-foreground">{displayImportValue(diff.old)}</del> → <strong>{diff.new===null?'Cleared':displayImportValue(diff.new)}</strong></p></li>)}</ul>:<span className="text-xs text-muted-foreground">No field changes reported.</span>}</td>}<td className="border-b border-border px-4 py-3 align-top"><span className="inline-flex items-center gap-1 text-xs font-medium">{['invalid','failed'].includes(row.status)?<AlertCircle className="h-3 w-3 text-destructive" />:<CheckCircle2 className="h-3 w-3 text-brand-700" />}{friendlyStatus(row.status)}</span>{row.processing_error&&<p className="mt-2 text-xs text-destructive">{row.processing_error}</p>}{editable&&editablePreviewRow(row.status)&&mode&&<Button size="sm" variant="outline" className="mt-2" onClick={()=>openEditor(row)}>Edit row</Button>}</td></tr>;})}</tbody></table></div><nav aria-label="Spreadsheet pages" className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
  <span>Page {currentPage} of {lastPage}</span>
  <div className="flex items-center gap-2">
   <Button size="sm" variant="outline" disabled={currentPage<=1||rows.isFetching} onClick={()=>goToPage(currentPage-1)}>Previous</Button>
   <Button size="sm" variant="outline" disabled={currentPage>=lastPage||rows.isFetching} onClick={()=>goToPage(currentPage+1)}>Next</Button>
  </div>
  <span>{rowStart.toLocaleString()}–{rowEnd.toLocaleString()} of {(total??0).toLocaleString()} rows</span>
 </nav></div>}
 </div><aside aria-label="Validation issues" className="min-w-0 rounded-xl border border-border bg-muted/15 p-4 xl:sticky xl:top-40"><div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-brand-900">Validation issues</h3><span className="rounded-full border border-border bg-card px-2 py-1 text-[10px] font-semibold text-muted-foreground">{pageIssues.length} on spreadsheet page</span></div>
 <label className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
  Issues per page
  <select className="h-8 rounded-md border border-border bg-card px-2 text-foreground" value={issuesPerPage} onChange={event=>{setIssuesPerPage(Number(event.target.value));goToIssuePage(1);}}>
   {[10,25,50].map(size=><option key={size} value={size}>{size}</option>)}
  </select>
 </label>
 {rows.isPending?<p className="text-xs text-muted-foreground">Loading validation findings…</p>:rows.error?<p className="text-xs text-muted-foreground">Validation findings are unavailable for this page.</p>:!pageIssues.length?<div className="rounded-lg border border-brand-800/10 bg-brand-100/50 p-3 text-xs leading-5 text-muted-foreground">No validation findings reported on this page. Overall validation and write eligibility come from the server.</div>:<><div ref={issuesList} className="max-h-[58vh] space-y-2 overflow-auto">{visibleIssues.map(({row,issue},index)=>{const target=fieldForColumn(issue.field??'',definitions,columnMapping);const label=target?.label??issue.field??'Row issue';return <button type="button" key={`${row.row_number}-${issueOffset+index}`} onClick={()=>editable&&editablePreviewRow(row.status)&&target&&editableKeys.has(target.key)?openEditor(row,target.key):setDetail(row)} className={`w-full rounded-lg border border-l-[3px] bg-card p-3 text-left transition-colors hover:bg-brand-100/40 ${issue.severity==='warning'?'border-border border-l-brand-500':'border-border border-l-brand-400'}`}><span className="block text-xs font-semibold text-brand-900">Row {row.row_number} · {label}</span><span className="mt-1 block text-[10px] font-semibold text-muted-foreground">{issueCategory(issue)}</span><span className="mt-1.5 block text-xs leading-5 text-muted-foreground">{issue.message}</span></button>;})}</div>
 <nav aria-label="Validation issue pages" className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
  <span aria-live="polite">{issueOffset+1}–{issueOffset+visibleIssues.length} of {pageIssues.length}</span>
  <div className="flex items-center gap-1">
   <Button size="sm" variant="outline" aria-label="Previous validation issues page" disabled={issuePage<=1} onClick={()=>goToIssuePage(issuePage-1)}>Previous</Button>
   <Button size="sm" variant="outline" aria-label="Next validation issues page" disabled={issuePage>=issueLastPage} onClick={()=>goToIssuePage(issuePage+1)}>Next</Button>
  </div>
 </nav></>}</aside></div>

 {detail&&<Modal title={`Spreadsheet row ${detail.row_number}`} description="Server validation and proposed changes for this row." onClose={()=>setDetail(null)} footer={<><Button variant="outline" onClick={()=>setDetail(null)}>Close</Button>{editable&&editablePreviewRow(detail.status)&&<Button className={importPrimary} onClick={()=>{openEditor(detail);setDetail(null);}}>Correct row</Button>}</>}><ul className="space-y-2">{detail.validation_errors?.map((error,index)=><li key={index} className="text-sm text-destructive">{issueCategory(error)}: {error.message}</li>)}</ul><dl className="grid gap-3 sm:grid-cols-2">{fields.map(field=><div key={field.key}><dt className="text-xs font-medium">{field.label}</dt><dd className="break-all text-sm text-muted-foreground">{displayImportValue(importFieldValue(detail,{key:field.requestKey,label:field.label},columnMapping,field.key))}</dd></div>)}</dl></Modal>}
 {editing&&mode&&onQueued&&<RowCorrectionDialog uuid={uuid} scope={scope} mode={mode} templateUuid={templateUuid} templateVersion={templateVersion} canEdit={editable} previewFields={editorFields} columnMapping={columnMapping} focusFieldKey={focusFieldKey} row={editing} onClose={()=>setEditing(null)} onQueued={result=>{setEditing(null);onQueued(result);}} onRefresh={onRefresh??(()=>void rows.refetch())} />}
 </div>;
}
