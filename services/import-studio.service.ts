import {api} from '@/lib/api';
import {normalizeFieldDefinition,type FieldDefinition} from '@/lib/flexi-import';
import type {FormMode} from '@/types/onboarding-form';
import {importData,type EmployeeImportBatch} from './employee-import.service';
export type ImportDestination={entity:string;title:string;group:string;import_type:string;operations:string[]};
export type ImportScope={import_type:string;title:string;operations:string[];destinations?:ImportDestination[]};
export type StudioSchema={import_type:string;schema_version:string;title?:string;operations?:string[];fields:FieldDefinition[]};
export type SavedImporter={template_uuid:string;version:number;name:string;import_type:string;operation:string;form_mode:FormMode;schema_version:string;selected_field_keys:string[];fields?:FieldDefinition[];download_available?:boolean;column_mapping?:Record<string,string>;column_map_uuid?:string|null;updated_at?:string;owner?:string};
export type SaveImporter=Pick<SavedImporter,'name'|'import_type'|'operation'|'form_mode'|'schema_version'|'selected_field_keys'> & {column_map_uuid?:string|null};
export type ImportAudit={events:Record<string,unknown>[];has_more:boolean};
const ROOT='/flexi-import';
function list<T>(value:T[]|{data:T[]}):T[]{if(Array.isArray(value))return value;if(Array.isArray(value?.data))return value.data;throw new Error('Unexpected Studio list response.');}
export function attachmentName(header:unknown,fallback:string){if(typeof header!=='string')return fallback;const encoded=header.match(/filename\*=UTF-8''([^;]+)/i);if(encoded){try{return decodeURIComponent(encoded[1]).replace(/[\\/]/g,'_');}catch{return fallback;}}return header.match(/filename="?([^";]+)"?/i)?.[1]?.replace(/[\\/]/g,'_')??fallback;}
export type TemplateFilters={q?:string;import_type?:string;owner_id?:string;status?:string;version?:number;page?:number;per_page?:number};
export type TemplatePage={data:SavedImporter[];current_page:number;last_page:number;total:number};
function savedTemplate(raw:SavedImporter):SavedImporter{return {...raw,fields:Array.isArray(raw.fields)?raw.fields.map(field=>normalizeFieldDefinition(field as unknown as Record<string,unknown>)).filter(field=>field.visible!==false):undefined};}
export function savedTemplateAvailable(template:SavedImporter){return template.download_available===true&&!!template.fields?.length;}
export const importStudioService={
 async scopes(signal?:AbortSignal):Promise<ImportScope[]>{return list(importData<ImportScope[]|{data:ImportScope[]}>((await api.get(`${ROOT}/import-types`,{signal})).data));},
 async schema(type:string,operation:string,mode:FormMode,signal?:AbortSignal):Promise<StudioSchema>{const raw=importData<{import_type:string;schema_version:string;title?:string;operations?:string[];fields:Record<string,unknown>[]}>( (await api.get(`${ROOT}/schemas/${encodeURIComponent(type)}`,{params:{operation,form_mode:mode},signal})).data);if(!Array.isArray(raw.fields))throw new Error('Schema fields were not returned.');return {...raw,fields:raw.fields.filter(field=>field.visible!==false&&field.hidden!==true&&field.can_view!==false).map(normalizeFieldDefinition)};},
 async templates(signal?:AbortSignal):Promise<SavedImporter[]>{return list(importData<SavedImporter[]|{data:SavedImporter[]}>((await api.get(`${ROOT}/importer-templates`,{signal})).data));},
 async templatePage(params:TemplateFilters,signal?:AbortSignal):Promise<TemplatePage>{const data=importData<TemplatePage>((await api.get(`${ROOT}/importer-templates`,{params,signal})).data);if(!Array.isArray(data.data))throw new Error('Unexpected template pagination response.');return {...data,data:data.data.map(savedTemplate)};},
 async template(uuid:string,signal?:AbortSignal,version?:number):Promise<SavedImporter>{return savedTemplate(importData((await api.get(`${ROOT}/importer-templates/${encodeURIComponent(uuid)}`,{signal,...(version!==undefined?{params:{version}}:{})})).data));},
 async downloadSaved(uuid:string,version:number){
  if(!uuid||!Number.isInteger(version)||version<1)throw new Error('Select a valid saved template version before exporting.');
  try{const response=await api.get<Blob>(`${ROOT}/importer-templates/${encodeURIComponent(uuid)}/download`,{params:{version},responseType:'blob'});if(response.data.type?.includes('json'))throw JSON.parse(await response.data.text());return {blob:response.data,filename:attachmentName(response.headers?.['content-disposition'],`import-template-v${version}.xlsx`)};}
  catch(error){const failure=error as {response?:{data?:unknown}};if(failure?.response?.data instanceof Blob){try{failure.response.data=JSON.parse(await failure.response.data.text());}catch{/* Preserve a non-JSON transport error. */}}throw error;}
 },
 async save(payload:SaveImporter):Promise<SavedImporter>{return importData((await api.post(`${ROOT}/importer-templates`,payload)).data);},
 async update(uuid:string,payload:Partial<SaveImporter>&{expected_version:number;schema_version:string}):Promise<SavedImporter>{return importData((await api.post(`${ROOT}/importer-templates/${encodeURIComponent(uuid)}/versions`,payload)).data);},
 async download(type:string,mode:FormMode,requiredOnly:boolean,format:'xlsx'|'csv'='xlsx',update=false){
  try {const response=await api.get<Blob>(`${ROOT}/templates/${encodeURIComponent(type)}/download`,{params:{form_mode:mode,required_only:requiredOnly?1:0,...(format==='csv'?{format}:{}),...(update?{type:'update'}:{})},responseType:'blob'});
  if(response.data.type?.includes('json'))throw JSON.parse(await response.data.text());
  return {blob:response.data,filename:attachmentName(response.headers?.['content-disposition'],`${type}-${mode}.${format}`)};
  }catch(error){const failure=error as {response?:{data?:unknown}};if(failure?.response?.data instanceof Blob){try{failure.response.data=JSON.parse(await failure.response.data.text());}catch{/* Keep the original transport error if the attachment is not JSON. */}}throw error;}
 },
 async validateMapping(type:string,mode:FormMode,headers:string[],mapping:Record<string,string>){return importData<{valid:boolean;unmapped_required_fields:string[];unknown_csv_columns:string[]}>((await api.post(`${ROOT}/validate-mapping`,{import_type:type,form_mode:mode,csv_headers:headers,column_mapping:mapping})).data);},
 async upload(file:File,type:string,mode:FormMode,mapping:Record<string,string>|undefined,onProgress:(value:number)=>void,pinned?:{template_uuid:string;template_version:number;send_welcome_email?:boolean}):Promise<EmployeeImportBatch>{if(pinned&&(!pinned.template_uuid||!Number.isInteger(pinned.template_version)||pinned.template_version<1))throw new Error('A saved template UUID and version must be supplied together.');const body=new FormData();body.append('file',file);body.append('import_type',type);body.append('auto_process','0');body.append('form_mode',mode);if(pinned){body.append('template_uuid',pinned.template_uuid);body.append('template_version',String(pinned.template_version));if(type==='employees')body.append('send_welcome_email',pinned.send_welcome_email?'1':'0');}if(mapping&&!pinned)for(const [header,key] of Object.entries(mapping))body.append(`column_mapping[${header}]`,key);const result=importData<EmployeeImportBatch>((await api.post(`${ROOT}/batches`,body,{headers:{'Content-Type':undefined},onUploadProgress:event=>{if(event.total)onProgress(Math.round(event.loaded/event.total*100));}})).data);if(!result?.uuid)throw new Error('The upload did not return a batch UUID.');return result;},
 async audit(uuid:string,page:number,signal?:AbortSignal):Promise<ImportAudit>{return importData((await api.get(`${ROOT}/batches/${uuid}/audit`,{params:{page},signal})).data);},
 async schemaLookup(type:string,field:string,q:string,page:number,parentId?:string,signal?:AbortSignal):Promise<{options:{id:number|string;label:string;value:string}[];has_more:boolean}>{return importData((await api.get(`${ROOT}/schemas/${encodeURIComponent(type)}/lookups/${encodeURIComponent(field)}`,{params:{q,page,...(parentId?{parent_id:parentId}:{})},signal})).data);},
 async lookup(source:string,q:string,page:number,parentId?:string,signal?:AbortSignal):Promise<{options:{id:number|string;label:string}[];has_more:boolean}>{return importData((await api.get(`${ROOT}/lookups/${encodeURIComponent(source)}`,{params:{q,page,...(parentId?{parent_id:parentId}:{})},signal})).data);},
};
