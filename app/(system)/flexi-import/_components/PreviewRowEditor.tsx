"use client";
import {useState} from 'react';
import {useMutation,useQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import SearchableSelect from '@/components/ui/searchable-select';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox';
import {Modal} from '@/components/shared/directory-ui';
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
import {previewCell,editablePreviewRow} from '@/lib/import-preview';
import {showApiError} from '@/lib/error-toast';

export function RowCorrectionDialog({uuid,scope,mode,row,onClose,onQueued,onRefresh,templateUuid,templateVersion,previewFields,columnMapping={},canEdit=true}:{uuid:string;scope:string;mode:FormMode;row:ImportRow;canEdit?:boolean;previewFields?:FieldDefinition[];columnMapping?:Record<string,string>;templateUuid?:string|null;templateVersion?:number|null;onClose:()=>void;onQueued:(result:QueuedResult)=>void;onRefresh:()=>void}){
 const [history,setHistory]=useState<{values:Record<string,string>;lookups:Record<string,string>}[]>([{values:{},lookups:{}}]),[cursor,setCursor]=useState(0),[conflict,setConflict]=useState(false),[latest,setLatest]=useState<ImportRow|null>(null),[compared,setCompared]=useState(false),[clearApproved,setClearApproved]=useState(false);
 const fields=useQuery({queryKey:['employee-import',scope,uuid,'editable-fields',mode,templateUuid,templateVersion],queryFn:async({signal})=>{if(templateUuid&&templateVersion){const saved=await importStudioService.template(templateUuid,signal,templateVersion);if(!saved.fields?.length)throw new Error('The pinned template field snapshot is unavailable.');return saved.fields;}return service.previewFields(mode,signal);},enabled:previewFields===undefined,retry:false});
 const allDefinitions=studioFields(previewFields??fields.data??[]),draft=history[cursor].values,lookupIds=history[cursor].lookups;
 const original=(key:string,label:string)=>{const value=previewCell(row,{key,label},columnMapping);return value==null?'':typeof value==='boolean'?(value?'1':'0'):typeof value==='object'?JSON.stringify(value):String(value);};
 const visibility=studioFieldVisibility(allDefinitions,Object.fromEntries(allDefinitions.map(field=>[field.key,draft[field.key]??previewCell(row,field,columnMapping)])),lookupIds);
 const definitions=allDefinitions.filter(field=>visibility.get(field.key)!==false);
 const changes=Object.fromEntries(definitions.filter(field=>field.editable&&Object.hasOwn(draft,field.key)&&draft[field.key]!==original(field.key,field.label)).map(field=>[field.key,draft[field.key]]));
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

 const save=useMutation({mutationFn:()=>service.correctRows(uuid,[{row_number:row.row_number,fields:changes}]),retry:false,onSuccess:result=>{onQueued(result);onClose();},onError:async error=>{showApiError(error);if(parseApiError(error).status===409){setConflict(true);setCompared(false);try{const page=Math.max(1,Math.ceil(row.row_number/50));const response=await service.rows(uuid,'',page);setLatest(response.data.find(item=>item.row_number===row.row_number)??null);}catch{setLatest(null);}}onRefresh();}});
 const allowed=canEdit&&Object.keys(changes).length>0&&Object.keys(changes).length<=200&&!invalidClear&&(!clears.length||clearApproved)&&(!conflict||compared&&!!latest&&editablePreviewRow(latest.status));
 return <Modal title={`Correct spreadsheet row ${row.row_number}`} description="Only changed values are saved to the preview. Reference values remain names or employee codes. Saving queues validation of the same batch; records are not committed." busy={save.isPending} onClose={onClose} footer={<><span role="status" aria-live="polite" className="mr-auto text-xs text-muted-foreground">{save.isPending?'Saving corrections…':save.error?'Not saved':Object.keys(changes).length?`${Object.keys(changes).length} unsaved changes`:'No unsaved changes'}</span><Button variant="outline" disabled={save.isPending} onClick={onClose}>Cancel</Button><Button className={importPrimary} disabled={save.isPending||(previewFields===undefined&&(fields.isPending||!!fields.error))||!allowed} onClick={()=>save.mutate()}>{save.isPending?'Saving…':'Save and re-check'}</Button></>}>
 <div className="flex gap-2"><Button size="sm" variant="outline" disabled={cursor===0||save.isPending} onClick={()=>setCursor(cursor-1)}>Undo local edit</Button><Button size="sm" variant="outline" disabled={cursor===history.length-1||save.isPending} onClick={()=>setCursor(cursor+1)}>Redo local edit</Button></div>
 {!canEdit&&<p role="status" className="rounded-lg border p-3 text-sm text-muted-foreground">This preview is now read-only. Your local edits remain visible but cannot be saved.</p>}
 {conflict&&<div role="alert" className="space-y-3 rounded-lg border border-brand-400/50 p-3 text-sm"><p>The preview changed or was frozen. Your local edits are retained. Review the current server values before trying again.</p>{latest?<><dl className="space-y-2">{definitions.filter(field=>Object.hasOwn(changes,field.key)).map(field=><div key={field.key}><dt className="font-medium">{field.label}</dt><dd className="break-all text-xs">Server: {String(previewCell(latest,field,columnMapping)??'Blank')} · Your edit: {changes[field.key]}</dd></div>)}</dl><Label className="flex gap-2"><Checkbox checked={compared} disabled={!editablePreviewRow(latest.status)} onCheckedChange={value=>setCompared(value===true)} />I reviewed these changes and want to reapply my edits.</Label></>:<p>The row was not found in the refreshed page. Close this editor and reopen the latest editable row to continue.</p>}</div>}
 {previewFields===undefined&&fields.isPending?<AppLoader label="Loading editable fields…" />:previewFields===undefined&&fields.error?<ApiErrorState error={fields.error} onRetry={()=>void fields.refetch()} />:<div className="grid gap-4 sm:grid-cols-2">{definitions.map(field=><div key={field.key} className="space-y-2"><Label htmlFor={`correction-${field.key}`}>{field.label}{field.required&&visibility.get(field.key)===true?' *':''}</Label>{field.sourceKey?<ImportLookupInput label={field.label} source={field.sourceKey} value={draft[field.key]??original(field.key,field.label)} parentId={field.parentKey?lookupIds[field.parentKey]:undefined} requiresParent={!!field.parentKey} scope={scope} disabled={!canEdit||save.isPending||!field.editable} onText={value=>edit(field.key,value)} onSelect={option=>edit(field.key,option.label,String(option.id))} />:field.options?.length?<SearchableSelect aria-label={field.label} id={`correction-${field.key}`} widthClass="w-full" allowAll={false} value={draft[field.key]??original(field.key,field.label)} options={field.options.map(option=>typeof option==='string'?{value:option,label:option}:{value:String(option.value??option.id??option.label??''),label:option.label??String(option.value??option.id??'')})} disabled={!canEdit||save.isPending||!field.editable} onChange={value=>edit(field.key,value)} />:['boolean','checkbox','toggle'].includes(field.type)?<Label className="flex gap-2"><Checkbox aria-label={field.label} checked={(draft[field.key]??original(field.key,field.label))==='1'} disabled={!canEdit||save.isPending||!field.editable} onCheckedChange={checked=>edit(field.key,checked===true?'1':'0')} />Yes</Label>:<Input aria-label={field.label} id={`correction-${field.key}`} type={field.type==='date'?'date':'text'} inputMode={['number','integer','decimal'].includes(field.type)?'decimal':undefined} value={draft[field.key]??original(field.key,field.label)} maxLength={5000} disabled={!canEdit||save.isPending||!field.editable} onKeyDown={event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();if(event.shiftKey&&cursor<history.length-1)setCursor(cursor+1);else if(!event.shiftKey&&cursor>0)setCursor(cursor-1);}}} onChange={event=>edit(field.key,event.target.value)} />}{!field.editable&&<p className="text-xs text-muted-foreground">Read-only: this field type is not supported for correction.</p>}{['select','lookup','dependent_lookup','radio'].includes(field.type)&&<p className="text-xs text-muted-foreground">Enter the spreadsheet label, not a database ID. Reference validation runs on the server.</p>}{field.condition&&visibility.get(field.key)===undefined&&<p className="text-xs text-muted-foreground">This field depends on another value. Its applicability will be checked during revalidation.</p>}{field.description&&<p className="text-xs text-muted-foreground">{field.description}</p>}</div>)}</div>}
 {clears.length>0&&<div className="space-y-2 rounded-lg border border-brand-400/40 p-3 text-sm"><p>Clear existing values for: {clears.map(field=>field.label).join(', ')}.</p>{invalidClear?<p className="text-destructive">Required fields cannot be cleared.</p>:<Label className="flex gap-2"><Checkbox checked={clearApproved} onCheckedChange={value=>setClearApproved(value===true)} />I understand these optional values will be cleared.</Label>}</div>}
 <ImportErrorFeedback error={save.error} />
 </Modal>;
}
