import type { ReferenceGap, GapReport, ImportOptions, EmployeeImportBatch, GapSuggestion } from '@/services/employee-import.service';
import { parseApiError } from '@/lib/api-error';
export const IMPORT_POLL_STATUSES=new Set(['uploaded','validating','pending_approval','approved','processing','rolling_back']);
export const IMPORT_TERMINAL_STATUSES=new Set(['completed','failed','rejected','rolled_back']);
export function importPollInterval(status:string|undefined,error:unknown,failureCount:number,waiting=false,unchangedChecks=0):number|false{
  const parsed=error?parseApiError(error):null;
  if(parsed?.status&&[401,403,404,409,422].includes(parsed.status))return false;
  if(parsed)return Math.min(30000,3000*Math.pow(2,Math.min(failureCount,4)));
  if(!waiting&&!IMPORT_POLL_STATUSES.has(status??'uploaded'))return false;
  return status==='uploaded'&&unchangedChecks>=20?10000:3000;
}
export function gapIdentity(gap:Pick<ReferenceGap,'source_key'|'parent_id'|'value'>){return JSON.stringify([gap.source_key,gap.parent_id??null,gap.value]);}
export function gapSetupPath(gap:Pick<ReferenceGap,'source_key'>):string{
  const source=gap.source_key.toLowerCase();
  if(source.includes('blood'))return '/flexi-meta/blood-groups';
  if(source.includes('shift'))return '/time-sync/shift-templates';
  if(source.includes('salary_structure'))return '/pay-edge/salary-structures';
  const paths:Record<string,string>={divisions:'/flexi-meta/divisions',departments:'/flexi-meta/departments',designations:'/flexi-meta/designations',branches:'/flexi-meta/branches',grade_bands:'/flexi-meta/grade-bands',employee_types:'/flexi-meta/employee-types',countries:'/flexi-meta/countries',states:'/flexi-meta/provinces',cities:'/flexi-meta/cities'};
  return paths[source]??'/flexi-meta';
}
export function canConfirmImport(batch:{status:string;has_gaps?:boolean;confirmed_at?:string|null;requires_approval?:boolean},gaps:GapReport|undefined,options?:ImportOptions):boolean{
  if(batch.status!=='validation_complete'||batch.confirmed_at||batch.requires_approval||!gaps)return false;
  const unresolved=batch.has_gaps===true||gaps.has_gaps||gaps.tables.some(table=>table.values.some(value=>!value.decision));
  return !unresolved||(options?.import_mode==='skip_errors'&&options.ignore_gaps===true);
}
export function displayImportValue(value:unknown):string{
  if(value===null||value===undefined||value==='')return '—';
  if(Array.isArray(value))return value.map(displayImportValue).join(', ');
  if(typeof value==='object'){const item=value as Record<string,unknown>;return String(item.label??item.name??item.value??'—');}
  return String(value);
}
export function downloadImportFile(blob:Blob,name:string){const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

export type ImportProgressSnapshot=EmployeeImportBatch&{unchangedChecks:number};
export function observeImportProgress(previous:ImportProgressSnapshot|undefined,incoming:EmployeeImportBatch):ImportProgressSnapshot{
 const fingerprint=(batch:EmployeeImportBatch)=>JSON.stringify([batch.status,batch.processed_rows??0,batch.successful_rows??0,batch.failed_rows??0,batch.skipped_rows??0,batch.progress??batch.progress_percentage??0]);
 return {...incoming,unchangedChecks:previous&&fingerprint(previous)===fingerprint(incoming)?(previous.unchangedChecks??0)+1:0};
}
export function importWaitingMessage(status:string,unchangedChecks=0):string|null{
 if(status==='uploaded')return unchangedChecks>=20?'Validation has not started after repeated checks. Ask your backend team to check the imports queue worker and failed jobs.':'File uploaded. Waiting for the server to start validation.';
 if(status==='validating')return unchangedChecks>=20?'Validation is still queued or running, but the server has not reported new progress. Check the imports worker if it stays unchanged.':'The server is validating your file. This page checks for updates automatically.';
 if(status==='pending_approval')return 'Waiting for another eligible approver. This page checks for updates automatically.';
 return null;
}

export function normalizeGapSuggestion(raw:unknown):GapSuggestion|null{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const suggestion=raw as Record<string,unknown>;
 const rawId=suggestion.id??suggestion.existing_id;
 const id=typeof rawId==='number'?rawId:typeof rawId==='string'&&/^\d+$/.test(rawId)?Number(rawId):NaN;
 const label=[suggestion.label,suggestion.name,suggestion.value,suggestion.text].find(value=>typeof value==='string'&&value.trim()&&!['undefined','null'].includes(value.trim().toLowerCase()));
 if(!Number.isSafeInteger(id)||id<=0||typeof label!=='string')return null;
 const confidence=typeof suggestion.confidence==='number'?suggestion.confidence:undefined;
 return {id,label:label.trim(),...(confidence!==undefined&&Number.isFinite(confidence)&&confidence>=0&&confidence<=100?{confidence}:{})};
}

export function gapFieldLabel(gap:{field?:string;source_key:string;source_table?:string}):string{
 return gap.field?.trim()||(gap.source_table||gap.source_key).split('_').filter(Boolean).map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' ');
}

export function hasRetryableImportFailures(batch:EmployeeImportBatch,failedRows:{status:string;created_record_id?:number|string|null}[]):boolean{
 return ['completed','failed'].includes(batch.status)&&['employees','employee'].includes(batch.import_type??'')&&batch.import_mode==='skip_errors'&&failedRows.some(row=>row.status==='failed')&&!failedRows.some(row=>row.created_record_id!==undefined&&row.created_record_id!==null);
}
