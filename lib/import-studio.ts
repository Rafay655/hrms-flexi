import {conditionValue,type VisibilityCondition} from "@/lib/onboarding-visibility";
import type { FieldDefinition } from '@/lib/flexi-import';
import type { ImportRow } from '@/services/employee-import.service';
export type ImportOperation='create_only'|'update_only'|'create_or_update';
export type StudioField={key:string;label:string;type:string;required:boolean;editable:boolean;sensitive:boolean;parentKey?:string;sourceKey?:string;description?:string;condition?:VisibilityCondition|null;options?:FieldDefinition['options']};
export type StudioRow={viewId:string;rowNumber:number;status:string;action:string;source:ImportRow};
const controls=new Set(['text','email','phone','tel','textarea','date','number','integer','decimal','boolean','checkbox','toggle','select','radio','lookup','dependent_lookup','string','json','datetime','datetime-local','time','url','numeric','float']);
export function studioFields(fields:FieldDefinition[]):StudioField[]{return fields.filter(field=>field.visible!==false).map(field=>({key:field.key,label:field.label,type:field.type,required:field.required,editable:field.editable!==false&&controls.has(field.type),sensitive:field.sensitive===true,parentKey:field.parent_field_key,sourceKey:field.source_key,description:field.description,condition:field.visibility_condition,options:field.options??field.allowed_values}));}
export function studioRows(rows:ImportRow[]):StudioRow[]{return rows.map(row=>({viewId:`preview-row-${row.row_number}`,rowNumber:row.row_number,status:row.status,action:row.row_action==='new'?'create':row.row_action??'pending',source:row}));}
export function cellValue(row:ImportRow,field:Pick<StudioField,'key'|'label'>):unknown{const raw=row.raw_data??{};return Object.hasOwn(raw,field.key)?raw[field.key]:raw[field.label];}
export function friendlyStatus(status:string):string{const labels:Record<string,string>={pending:'Pending',rolling_back:'Reversing employee changes',uploaded:'Uploaded',validating:'Validating',validation_complete:'Ready for review',pending_approval:'Pending approval',approved:'Approved',processing:'Processing',completed:'Completed',failed:'Failed',rejected:'Rejected',rolled_back:'Rolled back',invalid:'Blocking',valid:'Valid',committed:'Committed',skipped:'Skipped'};return labels[status]??'Status unavailable';}
export const TARGET_IMPORT_FEATURES={templates:true,directEntry:false,allRowEditing:true,recoveryPreview:false} as const;

export function issueCategory(issue:{code?:string;severity?:string;gap?:boolean}):string{
 if(issue.severity==='warning')return 'Warning';
 if(issue.gap||issue.code==='lookup_not_found')return 'Missing reference';
 if(issue.code==='lookup_scope_mismatch')return 'Wrong parent or company';
 if(issue.code?.includes('duplicate')||issue.code?.includes('identity'))return 'Duplicate identity';
 return 'Blocking';
}
export function fieldTypeLabel(type:string):string{const types:Record<string,string>={text:'Text',email:'Email',phone:'Phone',tel:'Phone',textarea:'Long text',date:'Date',number:'Number',integer:'Whole number',decimal:'Decimal',boolean:'Yes / No',checkbox:'Yes / No',toggle:'Yes / No',select:'Selection',radio:'Selection',lookup:'Selection',dependent_lookup:'Linked selection'};return types[type]??'Read-only';}

// A blank spreadsheet parent may use an existing employee value. Unknown lookup
// values must therefore stay visible for server evaluation, rather than guessing IDs.
export function studioFieldVisibility(fields:StudioField[],values:Record<string,unknown>,lookupIds:Record<string,string>):Map<string,boolean|undefined>{
 const byKey=new Map(fields.map(field=>[field.key,field])),memo=new Map<string,boolean|undefined>();
 function visible(key:string,path=new Set<string>()):boolean|undefined{
  if(memo.has(key))return memo.get(key);
  const field=byKey.get(key);if(!field||path.has(key))return undefined;
  if(!field.condition){memo.set(key,true);return true;}
  const next=new Set(path);next.add(key);
  const parent=byKey.get(field.condition.field_key),parentVisible=visible(field.condition.field_key,next);
  let result:boolean|undefined;
  if(parentVisible===false)result=false;
  else if(parent&&parentVisible===true){
   const selected=lookupIds[parent.key];const value=conditionValue(selected??values[parent.key]);
   if(value&&(!['boolean','checkbox','toggle'].includes(parent.type)||['1','0'].includes(value))&&(!parent.sourceKey||selected))result=field.condition.values.some(option=>String(option)===value);
  }
  memo.set(key,result);return result;
 }
 for(const field of fields)visible(field.key);
 return memo;
}
