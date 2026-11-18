export type ImportDashboardData={
 total_imports_month:number;successful_rows_month:number;failed_rows_month:number;pending_approval_count:number;
 recent_batches:{uuid:string;import_type:string;status:string;total_rows:number;successful_rows:number|null;failed_rows:number|null;initiated_by:string|null;created_at:string;completed_at:string|null}[];
};
function record(value:unknown):Record<string,unknown>{return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};}
function displayText(value:unknown,depth=0):string{
 if(typeof value==='string')return value;
 if(typeof value==='number'&&Number.isFinite(value))return String(value);
 if(depth>=3)return '';
 const data=record(value);
 for(const key of ['name','label','value','code']){if(data[key]!==undefined){const label=displayText(data[key],depth+1);if(label)return label;}}
 return '';
}
function count(value:unknown):number{const number=typeof value==='string'||typeof value==='number'?Number(value):NaN;return Number.isFinite(number)&&number>=0?number:0;}
export function normalizeImportDashboard(value:unknown):ImportDashboardData{
 const data=record(value);
 return {
  total_imports_month:count(data.total_imports_month),successful_rows_month:count(data.successful_rows_month),failed_rows_month:count(data.failed_rows_month),pending_approval_count:count(data.pending_approval_count),
  recent_batches:(Array.isArray(data.recent_batches)?data.recent_batches:[]).map(item=>{
   const row=record(item),actor=row.initiated_by;
   return {uuid:displayText(row.uuid),import_type:displayText(row.import_type)||'Employee import',status:(displayText(row.status)||'unknown').toLowerCase().replaceAll(' ','_'),total_rows:count(row.total_rows),successful_rows:row.successful_rows==null?null:count(row.successful_rows),failed_rows:row.failed_rows==null?null:count(row.failed_rows),initiated_by:typeof actor==='string'?actor:displayText(record(actor).name)||null,created_at:displayText(row.created_at),completed_at:row.completed_at==null?null:displayText(row.completed_at)};
  }).filter(row=>!!row.uuid),
 };
}
