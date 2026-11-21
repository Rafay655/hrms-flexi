import type {FieldDefinition} from '@/lib/flexi-import';
import type {ImportRow} from '@/services/employee-import.service';
import {studioFields,type StudioField} from '@/lib/import-studio';

const normalized=(value:string)=>value.trim().toLowerCase().replace(/[\s_-]+/g,' ');
export function previewCell(row:ImportRow,field:Pick<StudioField,'key'|'label'>,mapping:Record<string,string>={}):unknown{
 const raw=row.raw_data??{};
 if(Object.hasOwn(raw,field.key))return raw[field.key];
 const mapped=Object.keys(mapping).filter(header=>mapping[header]===field.key&&Object.hasOwn(raw,header));
 if(mapped.length===1)return raw[mapped[0]];
 if(Object.hasOwn(raw,field.label))return raw[field.label];
 const matches=Object.keys(raw).filter(header=>normalized(header)===normalized(field.label));
 return matches.length===1?raw[matches[0]]:undefined;
}
export function spreadsheetColumns(headers:string[],metadata:FieldDefinition[],mapping:Record<string,string>={}):Array<StudioField&{requestKey?:string}>{
 const definitions=studioFields(metadata);
 return headers.map(header=>{
  const match=definitions.find(field=>field.key===(mapping[header]??header))??definitions.find(field=>normalized(field.label)===normalized(header));
  return {...match,key:header,label:match?.label??header,type:match?.type??'text',required:match?.required??false,editable:match?.editable??false,sensitive:match?.sensitive??false,requestKey:match?.key};
 });
}
export function editablePreviewRow(status:string){return status==='valid'||status==='invalid';}
