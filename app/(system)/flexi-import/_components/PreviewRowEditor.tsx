"use client";
import {useEffect,useRef,useState} from 'react';
import {useMutation,useQuery} from '@tanstack/react-query';
import {api} from '@/lib/api';
import {Button} from '@/components/ui/button';
import SearchableSelect from '@/components/ui/searchable-select';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox';
import {BatchModal as Modal} from './batch-workspace-ui';
import {AppLoader} from '@/components/ui/app-loader';
import {ApiErrorState} from '@/components/ui/api-error-state';
import {employeeImportService as service,type ImportRow,type QueuedResult} from '@/services/employee-import.service';
import type {FormMode} from '@/types/onboarding-form';
import {studioFields,studioFieldVisibility} from '@/lib/import-studio';
import {parseApiError} from '@/lib/api-error';
import {importPrimary} from './import-ui';
import {ImportErrorFeedback} from './import-error-feedback';
import {importStudioService} from '@/services/import-studio.service';
import {ImportLookupInput} from './import-lookup-input';
import type {FieldDefinition} from '@/lib/flexi-import';
import {editablePreviewRow} from '@/lib/import-preview';
import {showApiError} from '@/lib/error-toast';

export const rowCorrectionMutationKey = (scope:string,uuid:string) => ['employee-import',scope,uuid,'save-row-correction'];

export type DraftImportRow = ImportRow & {draft_corrections?:Record<string,string|null>|null};
export type SavedRowCorrection = QueuedResult & {has_unvalidated_corrections?:boolean};

type PreviewField = {key:string;label:string};
type ColumnMapping = Record<string,string>;

export function previewFieldKey(field:{key?:string;field_key?:string}) {
 return field.field_key??field.key??'';
}

function comparableColumn(value:string) {
 return value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
}

export function fieldForColumn<T extends PreviewField>(header:string,fields:T[],mapping:ColumnMapping):T|undefined {
 const key=mapping[header]??header;
 const exact=fields.find(field=>field.key===key);
 if(exact)return exact;
 const normalized=comparableColumn(key);
 if(!normalized)return undefined;
 const matches=fields.filter(field=>[field.key,field.label].some(alias=>comparableColumn(alias)===normalized));
 return matches.length===1?matches[0]:undefined;
}

export function importFieldValue(row:DraftImportRow,field:PreviewField,mapping:ColumnMapping,header?:string) {
 const saved=row.draft_corrections;
 if(saved&&Object.hasOwn(saved,field.key))return saved[field.key];
 const raw:Record<string,unknown>=row.raw_data??{};
 const mapped=Object.keys(mapping).find(column=>mapping[column]===field.key&&Object.hasOwn(raw,column));
 const labelAlias=Object.hasOwn(mapping,field.label)&&mapping[field.label]!==field.key?undefined:field.label;
 for(const alias of [header,mapped,field.key,labelAlias]){
  if(alias!==undefined&&Object.hasOwn(raw,alias))return raw[alias];
 }
 const label=comparableColumn(field.label);
 const matches=Object.keys(raw).filter(column=>!Object.hasOwn(mapping,column)&&comparableColumn(column)===label);
 return matches.length===1?raw[matches[0]]:undefined;
}

export function useImportPreviewSchema(scope:string,uuid:string,mode:FormMode|undefined,importType:string,templateUuid?:string|null,templateVersion?:number|null) {
 return useQuery({
  queryKey:['employee-import',scope,uuid,'preview-schema',mode,importType,templateUuid,templateVersion],
  queryFn:async({signal})=>{
   if(templateUuid&&templateVersion){
    const saved=await importStudioService.template(templateUuid,signal,templateVersion);
    if(!saved.fields?.length)throw new Error('The saved template has no field definitions.');
    return saved.fields;
   }
   return service.previewFields(mode!,signal,importType);
  },
  enabled:!!mode,
  retry:false,
 });
}

type RowsRequest = {status?:string;page?:number;per_page?:number;row_number?:number};
type RowsPagination = {current_page:number;last_page:number;per_page:number;total:number};

export async function readImportPreviewPage(uuid:string,params:RowsRequest,signal?:AbortSignal) {
 const {data:response}=await api.get(`/flexi-import/batches/${uuid}/rows`,{params,signal});
 const collection=response.data;
 const data=(Array.isArray(collection)?collection:collection?.data??[]) as DraftImportRow[];
 const pagination=(response.meta??collection?.meta) as RowsPagination|undefined;
 if(!pagination&&params.row_number===undefined&&(params.per_page??50)===50){
  const legacy=await service.rows(uuid,params.status??'',params.page??1,signal);
  return {data,page:legacy.page??params.page??1,lastPage:legacy.lastPage,perPage:50,total:legacy.total,hasNext:legacy.hasNext,supportsPageSizing:false};
 }
 if(!pagination||pagination.per_page!==(params.per_page??50)){
  throw new Error('Preview pagination is unavailable. Refresh the batch after the backend update.');
 }
 if(params.row_number!==undefined&&!data.some(row=>row.row_number===params.row_number)){
  throw new Error(`Row ${params.row_number} is unavailable. Refresh the batch and try again.`);
 }
 return {data,page:pagination.current_page,lastPage:pagination.last_page,perPage:pagination.per_page,total:pagination.total,hasNext:pagination.current_page<pagination.last_page,supportsPageSizing:true};
}

export function RowCorrectionDialog({uuid,scope,mode,row,onClose,onQueued,onRefresh,templateUuid,templateVersion,previewFields,columnMapping={},focusFieldKey,canEdit=true}:{uuid:string;scope:string;mode:FormMode;row:DraftImportRow;canEdit?:boolean;previewFields?:FieldDefinition[];columnMapping?:ColumnMapping;focusFieldKey?:string;templateUuid?:string|null;templateVersion?:number|null;onClose:()=>void;onQueued:(result:SavedRowCorrection)=>void;onRefresh:()=>void}){
 const [history,setHistory]=useState<{values:Record<string,string>;lookups:Record<string,string>}[]>([{values:{},lookups:{}}]),[cursor,setCursor]=useState(0),[conflict,setConflict]=useState(false),[latest,setLatest]=useState<DraftImportRow|null>(null),[compared,setCompared]=useState(false),[clearApproved,setClearApproved]=useState(false);
 const fields=useImportPreviewSchema(scope,uuid,previewFields===undefined?mode:undefined,'employees',templateUuid,templateVersion);
 const allDefinitions=studioFields(previewFields??fields.data??[]);
 const {values:draft,lookups:lookupIds}=history[cursor];
 const original=(field:PreviewField)=>{
  const value=importFieldValue(row,field,columnMapping);
  return value==null?'':typeof value==='boolean'?(value?'1':'0'):typeof value==='object'?JSON.stringify(value):String(value);
 };
 const visibility=studioFieldVisibility(allDefinitions,Object.fromEntries(allDefinitions.map(field=>[
  field.key,draft[field.key]??importFieldValue(row,field,columnMapping),
 ])),lookupIds);
 const definitions=allDefinitions.filter(field=>visibility.get(field.key)!==false||field.key===focusFieldKey&&row.validation_errors?.some(
  issue=>fieldForColumn(issue.field??'',allDefinitions,columnMapping)?.key===field.key,
 ));
 const focusedField=useRef<HTMLDivElement>(null);
 const formHeading=useRef<HTMLParagraphElement>(null);
 const targetVisible=!!focusFieldKey&&definitions.some(field=>field.key===focusFieldKey);
 useEffect(()=>{
  if(!focusFieldKey)return;
  const frame=requestAnimationFrame(()=>{
   const target=focusedField.current??formHeading.current;
   target?.scrollIntoView({block:'center',inline:'nearest'});
   const input=target?.querySelector<HTMLElement>('input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')
    ??target?.querySelector<HTMLElement>('button:not(:disabled)');
   (input??target)?.focus({preventScroll:true});
  });
  return ()=>cancelAnimationFrame(frame);
 },[focusFieldKey,targetVisible]);
 const changes=Object.fromEntries(definitions.filter(field=>field.editable&&Object.hasOwn(draft,field.key)&&draft[field.key]!==original(field)).map(field=>[field.key,draft[field.key]]));
 const clears=definitions.filter(field=>changes[field.key]==='{clear}');
 const invalidClear=clears.some(field=>field.required);
 function edit(key:string,value:string,lookupId?:string){
  const children=new Set<string>();
  let parents=[key];
  while(parents.length){const next=definitions.filter(field=>field.parentKey&&parents.includes(field.parentKey)&&!children.has(field.key)).map(field=>field.key);for(const child of next)children.add(child);parents=next;}
  const changed={...draft,[key]:value};for(const child of children)changed[child]='';
  const lookups=Object.fromEntries(Object.entries(lookupIds).filter(([field])=>field!==key&&!children.has(field)));if(lookupId)lookups[key]=lookupId;
  setHistory(previous=>[...previous.slice(0,cursor+1),{values:changed,lookups}]);setCursor(cursor+1);setClearApproved(false);
 }

 const save=useMutation({mutationKey:rowCorrectionMutationKey(scope,uuid),mutationFn:async():Promise<SavedRowCorrection>=>{
  const {data:response}=await api.patch(`/flexi-import/batches/${uuid}/rows`,{
   revalidate:false,
   changes:[{row_number:row.row_number,fields:changes}],
  });
  return response.data;
 },retry:false,onSuccess:result=>{onQueued(result);onClose();},onError:async error=>{showApiError(error);if(parseApiError(error).status===409){setConflict(true);setCompared(false);try{const response=await readImportPreviewPage(uuid,{row_number:row.row_number});setLatest(response.data.find(item=>item.row_number===row.row_number)??null);}catch{setLatest(null);}}onRefresh();}});
 const allowed=canEdit&&Object.keys(changes).length>0&&Object.keys(changes).length<=200&&!invalidClear&&(!clears.length||clearApproved)&&(!conflict||compared&&!!latest&&editablePreviewRow(latest.status));
 return <Modal title={`Correct spreadsheet row ${row.row_number}`} description="Only changed values are saved to the preview. Reference values remain names or employee codes. Save your edits, then re-check the batch after you finish editing." busy={save.isPending} onClose={onClose} footer={<><span role="status" aria-live="polite" className="mr-auto text-xs text-muted-foreground">{save.isPending?'Saving corrections…':save.error?'Not saved':Object.keys(changes).length?`${Object.keys(changes).length} unsaved changes`:'No unsaved changes'}</span><Button variant="outline" disabled={save.isPending} onClick={onClose}>Cancel</Button><Button className={importPrimary} disabled={save.isPending||(previewFields===undefined&&(fields.isPending||!!fields.error))||!allowed} onClick={()=>save.mutate()}>{save.isPending?'Saving…':'Save correction'}</Button></>}>
 {focusFieldKey&&!targetVisible&&<p ref={formHeading} tabIndex={-1} className="rounded-md border p-3 text-sm">
  {allDefinitions.find(field=>field.key===focusFieldKey)?.label??'This column'} is unavailable for editing on this row.
 </p>}
 <div className="flex gap-2"><Button size="sm" variant="outline" disabled={cursor===0||save.isPending} onClick={()=>setCursor(cursor-1)}>Undo local edit</Button><Button size="sm" variant="outline" disabled={cursor===history.length-1||save.isPending} onClick={()=>setCursor(cursor+1)}>Redo local edit</Button></div>
 {!canEdit&&<p role="status" className="rounded-lg border p-3 text-sm text-muted-foreground">This preview is now read-only. Your local edits remain visible but cannot be saved.</p>}
 {conflict&&<div role="alert" className="space-y-3 rounded-lg border border-brand-400/50 p-3 text-sm"><p>The preview changed or was frozen. Your local edits are retained. Review the current server values before trying again.</p>{latest?<><dl className="space-y-2">{definitions.filter(field=>Object.hasOwn(changes,field.key)).map(field=><div key={field.key}><dt className="font-medium">{field.label}</dt><dd className="break-all text-xs">Server: {String(importFieldValue(latest,field,columnMapping)??'Blank')} · Your edit: {changes[field.key]}</dd></div>)}</dl><Label className="flex gap-2"><Checkbox checked={compared} disabled={!editablePreviewRow(latest.status)} onCheckedChange={value=>setCompared(value===true)} />I reviewed these changes and want to reapply my edits.</Label></>:<p>The row was not found in the refreshed page. Close this editor and reopen the latest editable row to continue.</p>}</div>}
 {previewFields===undefined&&fields.isPending?<AppLoader label="Loading editable fields…" />:previewFields===undefined&&fields.error?<ApiErrorState error={fields.error} onRetry={()=>void fields.refetch()} />:<div className="grid gap-4 sm:grid-cols-2">{definitions.map(field=>{
  const value=draft[field.key]??original(field);
  const issues=(row.validation_errors??[]).filter(issue=>fieldForColumn(issue.field??'',allDefinitions,columnMapping)?.key===field.key);
  const targeted=field.key===focusFieldKey;
  const inactive=visibility.get(field.key)===false;
  const disabled=!canEdit||save.isPending||!field.editable||inactive;
  const options=(field.options??[]).map(option=>typeof option==='string'?{value:option,label:option}:{value:String(option.value??option.id??option.label??''),label:option.label??String(option.value??option.id??'')});
  const selected=options.find(option=>option.value===value)??options.find(option=>option.label===value);
  return <div key={field.key} ref={targeted?focusedField:undefined} tabIndex={targeted?-1:undefined} className={targeted?'space-y-2 outline-none [&_input]:bg-[#EEC293]/15 [&_input]:border-[#C58D55]/50 [&_input]:focus-visible:ring-0 [&_textarea]:bg-[#EEC293]/15 [&_textarea]:border-[#C58D55]/50 [&_textarea]:focus-visible:ring-0 [&_[role=combobox]]:bg-[#EEC293]/15 [&_[role=combobox]]:border-[#C58D55]/50 [&_[role=combobox]]:focus-visible:ring-0':'space-y-2'}><Label htmlFor={`correction-${field.key}`}>{field.label}{field.required&&visibility.get(field.key)===true?' *':''}</Label>{field.sourceKey?<ImportLookupInput label={field.label} source={field.sourceKey} value={value} parentId={field.parentKey?lookupIds[field.parentKey]:undefined} requiresParent={!!field.parentKey} scope={scope} disabled={disabled} onText={value=>edit(field.key,value)} onSelect={option=>edit(field.key,option.label,String(option.id))} />:field.options?.length?<SearchableSelect aria-label={field.label} id={`correction-${field.key}`} widthClass="w-full" allowAll={false} value={selected?.value??value} options={value&&!selected?[{value,label:value},...options]:options} disabled={disabled} onChange={value=>edit(field.key,value)} />:['boolean','checkbox','toggle'].includes(field.type)?<Label className="flex gap-2"><Checkbox aria-label={field.label} checked={['1','true','yes'].includes(value.trim().toLowerCase())} disabled={disabled} onCheckedChange={checked=>edit(field.key,checked===true?'1':'0')} />Yes</Label>:<Input aria-label={field.label} id={`correction-${field.key}`} type={field.type==='date'&&(!value||/^\d{4}-\d{2}-\d{2}$/.test(value))?'date':'text'} inputMode={['number','integer','decimal'].includes(field.type)?'decimal':undefined} value={value} maxLength={5000} disabled={disabled} onKeyDown={event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();if(event.shiftKey&&cursor<history.length-1)setCursor(cursor+1);else if(!event.shiftKey&&cursor>0)setCursor(cursor-1);}}} onChange={event=>edit(field.key,event.target.value)} />}{issues.length>0&&<ul className="space-y-1 text-xs text-destructive" aria-label="Field validation issues">{issues.map((issue,index)=><li key={index}>{issue.message}</li>)}</ul>}{inactive&&<p className="text-xs text-muted-foreground">This field is disabled by another value in this row.</p>}{!field.editable&&<p className="text-xs text-muted-foreground">Read-only: this field type is not supported for correction.</p>}{['select','lookup','dependent_lookup','radio'].includes(field.type)&&<p className="text-xs text-muted-foreground">Enter the spreadsheet label, not a database ID. Reference validation runs on the server.</p>}{field.condition&&visibility.get(field.key)===undefined&&<p className="text-xs text-muted-foreground">This field depends on another value. Its applicability will be checked during revalidation.</p>}{field.description&&<p className="text-xs text-muted-foreground">{field.description}</p>}</div>;
 })}</div>}
 {clears.length>0&&<div className="space-y-2 rounded-lg border border-brand-400/40 p-3 text-sm"><p>Clear existing values for: {clears.map(field=>field.label).join(', ')}.</p>{invalidClear?<p className="text-destructive">Required fields cannot be cleared.</p>:<Label className="flex gap-2"><Checkbox checked={clearApproved} onCheckedChange={value=>setClearApproved(value===true)} />I understand these optional values will be cleared.</Label>}</div>}
 <ImportErrorFeedback error={save.error} />
 </Modal>;
}
