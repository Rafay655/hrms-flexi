import { api } from '@/lib/api';
import { normalizeGapSuggestion } from '@/lib/employee-import';
import { normalizeFieldDefinition, type FieldDefinition } from '@/lib/flexi-import';
import type { FormMode } from '@/types/onboarding-form';

export type TemplateSelection = { form_mode: FormMode; required_only: boolean };
export type EmployeeImportBatch = {
  uuid: string; status: string; import_type?: string; form_mode?: FormMode; file_name?: string;
  total_rows?: number; processed_rows?: number; successful_rows?: number; failed_rows?: number; skipped_rows?: number;
  valid_rows?: number; invalid_rows?: number; has_gaps?: boolean; requires_approval?: boolean; confirmed_at?: string | null;
  is_rollbackable?: boolean; rollback_window_open?: boolean; error_message?: string | null; rejection_reason?: string | null;
  import_mode?: string; send_welcome_email?: boolean; progress?: number; progress_percentage?: number;
  initiated_by?: number | string | { id?: number | string; uuid?: string; name?: string };
  workflow?: Record<string, unknown> | null;
};
export type GapSuggestion = { id: number; label: string; confidence?: number };
export type GapExtraField = { key: string; label: string; type: string; required: boolean; options?: GapSuggestion[] };
export type ReferenceGap = {
  field?: string; value: string; source_key: string; source_table?: string; message?: string;
  parent_source_key: string | null; parent_id: number | null; parent_label: string | null;
  suggestion: GapSuggestion | null; decision?: unknown; rows?: number[]; row_count?: number;
};
export type GapTable = { source_key: string; source_table: string; creatable: boolean; blocked_reason: string | null; warning: string | null; needs_parent: boolean; extra_fields: GapExtraField[]; values: ReferenceGap[] };
export type GapReport = { batch_uuid?: string; status: string; has_gaps: boolean; total_gap_values: number; tables: GapTable[] };
export type GapDecision = { source_key: string; value: string; parent_id?: number; action: 'use_existing'; existing_id: number } | { source_key: string; value: string; parent_id?: number; action: 'create'; [key: string]: unknown };
export type GapFailure = { source_key?: string; value?: string; message?: string; error?: string; errors?: Record<string,string[]|string> };
export type GapResolutionResult = { created: { source_key: string; value: string; id: number }[]; failed: GapFailure[]; decided: number };
export type ImportOptions = { import_mode: 'all_or_nothing' | 'skip_errors'; send_welcome_email: boolean; ignore_gaps: boolean };
export type ImportRow = {
  row_number: number; raw_data: Record<string, unknown> | null; status: string;
  validation_errors: { field?: string; message?: string }[] | null; processing_error: string | null;
  row_action?: 'new'|'create'|'update'|'unchanged'|string; matched_employee_id?: number|null;
  value_diff?: { key: string; field: string; role?: string|null; old: unknown; new: unknown }[];
};
export type ImportRows = { data: ImportRow[]; page: number; hasNext: boolean; total?: number; lastPage?: number };
export type ImportSummary = {
  status: string; total_rows: number; valid_rows: number; invalid_rows: number;
  new_rows?: number; update_rows?: number; unchanged_rows?: number; salary_changes?: number;
  requires_approval?: boolean; send_welcome_email?: boolean; import_mode?: string;
  gap_summary?: { has_gaps: boolean; gap_values: number; gap_tables: string[]; decisions_made: number };
  errors_by_field?: Record<string, unknown>; sample_errors?: unknown[];
};
export type QueuedResult = { uuid?: string; batch_uuid?: string; status?: string };
export type ImportHistory = { data: EmployeeImportBatch[]; page: number; hasNext: boolean; total?: number; lastPage?: number };
const ROOT='/flexi-import';
export function importData<T>(value: { success?: boolean; data?: T; message?: string; error?: unknown }): T {
  if(value.success===false)throw value;
  return value.data as T;
}
function paginated<T>(raw: T[]|{data:T[];meta?:Record<string,number>},outer:Record<string,unknown>,page:number,size:number){
  const data=Array.isArray(raw)?raw:raw?.data;
  if(!Array.isArray(data))throw new Error('Unexpected import listing response.');
  const meta=(Array.isArray(raw)?outer.meta:raw.meta??outer.meta) as Record<string,number>|undefined;
  return {data,page:meta?.current_page??page,hasNext:meta?.last_page!==undefined?page<meta.last_page:data.length===size,...(meta?.total!==undefined?{total:meta.total}:{}),...(meta?.last_page!==undefined?{lastPage:meta.last_page}:{})};
}
export const employeeImportService = {
  async fields(mode:FormMode,requiredOnly=false,signal?:AbortSignal):Promise<FieldDefinition[]> {
    const {data}=await api.get(`${ROOT}/fields/employees`,{params:{form_mode:mode,required_only:requiredOnly?1:0},signal});
    const raw=importData<unknown>(data);
    if(!Array.isArray(raw))throw new Error('Unexpected import field response.');
    return raw.map(field=>normalizeFieldDefinition(field as Record<string,unknown>));
  },
  async template(selection:TemplateSelection,format:'xlsx'|'csv'='xlsx',type:'create'|'update'='create'):Promise<Blob>{
    return (await api.get(`${ROOT}/templates/employees/download`,{params:{form_mode:selection.form_mode,required_only:type==='update'?0:selection.required_only?1:0,...(format==='csv'?{format}:{}),...(type==='update'?{type}:{} )},responseType:'blob'})).data;
  },
  async validateMapping(mode:FormMode,headers:string[],mapping:Record<string,string>){
    const {data}=await api.post(`${ROOT}/validate-mapping`,{import_type:'employees',form_mode:mode,csv_headers:headers,column_mapping:mapping});
    return importData<{valid:boolean;unmapped_required_fields:string[];unknown_csv_columns:string[]}>(data);
  },
  async upload(file:File,mode:FormMode,mapping?:Record<string,string>,sendWelcomeEmail=false):Promise<EmployeeImportBatch>{
    const body=new FormData();body.append('file',file);body.append('import_type','employees');body.append('form_mode',mode);body.append('auto_process','0');body.append('send_welcome_email',sendWelcomeEmail?'1':'0');
    if(mapping)for(const [header,key] of Object.entries(mapping))if(key)body.append(`column_mapping[${header}]`,key);
    const {data}=await api.post(`${ROOT}/batches`,body,{headers:{'Content-Type':undefined}});
    const result=importData<EmployeeImportBatch>(data);if(!result?.uuid)throw new Error('The upload did not return a batch UUID.');return result;
  },
  async detail(uuid:string,signal?:AbortSignal):Promise<EmployeeImportBatch>{return importData((await api.get(`${ROOT}/batches/${uuid}`,{signal})).data);},
  async status(uuid:string,signal?:AbortSignal):Promise<EmployeeImportBatch>{return importData((await api.get(`${ROOT}/batches/${uuid}/status`,{signal})).data);},
  async summary(uuid:string,signal?:AbortSignal):Promise<ImportSummary>{return importData((await api.get(`${ROOT}/batches/${uuid}/summary`,{signal})).data);},
  async rows(uuid:string,status:string,page:number,signal?:AbortSignal):Promise<ImportRows>{
    const {data}=await api.get(`${ROOT}/batches/${uuid}/rows`,{params:{...(status?{status}:{}),page},signal});
    return paginated(importData<ImportRow[]|{data:ImportRow[];meta?:Record<string,number>}>(data),data,page,50);
  },
  async history(params:{page:number;per_page:number;import_type?:string;status?:string;date_from?:string;date_to?:string},signal?:AbortSignal):Promise<ImportHistory>{
    const {data}=await api.get(`${ROOT}/batches`,{params:{import_type:'employees',...params},signal});
    return paginated(importData<EmployeeImportBatch[]|{data:EmployeeImportBatch[];meta?:Record<string,number>}>(data),data,params.page,params.per_page);
  },
  async gaps(uuid:string,signal?:AbortSignal):Promise<GapReport>{
    const report=importData<GapReport>((await api.get(`${ROOT}/batches/${uuid}/gaps`,{signal})).data);
    return {...report,tables:report.tables.map(table=>({...table,values:table.values.map(value=>({...value,suggestion:normalizeGapSuggestion(value.suggestion)}))}))};
  },
  async resolve(uuid:string,decisions:GapDecision[]):Promise<GapResolutionResult>{
    const identities=decisions.map(d=>JSON.stringify([d.source_key,d.parent_id??null,d.value]));
    if(!decisions.length||decisions.length>500||new Set(identities).size!==identities.length)throw new Error('Select between 1 and 500 distinct gap decisions.');
    return importData((await api.post(`${ROOT}/batches/${uuid}/gaps/resolve`,{decisions})).data);
  },
  async revalidate(uuid:string):Promise<QueuedResult|null>{return importData((await api.post(`${ROOT}/batches/${uuid}/revalidate`,{})).data);},
  async process(uuid:string,options:ImportOptions):Promise<QueuedResult|null>{return importData((await api.post(`${ROOT}/batches/${uuid}/process`,options)).data);},
  async rollback(uuid:string):Promise<QueuedResult|null>{return importData((await api.post(`${ROOT}/batches/${uuid}/rollback`,{})).data);},
  async approve(uuid:string,comments:string):Promise<QueuedResult|null>{return importData((await api.post(`${ROOT}/batches/${uuid}/approve`,{comments})).data);},
  async reject(uuid:string,reason:string):Promise<QueuedResult|null>{return importData((await api.post(`${ROOT}/batches/${uuid}/reject`,{reason})).data);},
};
