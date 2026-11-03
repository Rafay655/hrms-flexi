import { api } from '@/lib/api';
import type { LeaveRequest, LeaveRequestFormData, LeaveRequestFilters, LeaveRequestList, LeaveRequestMeta, LeaveNominee, LeaveRequestAction, LeaveRequestOptions, LeavePreview, LeaveDelegation, DelegatedLeaveTask, LeaveDecisionResponse, LeaveBulkResponse } from '@/types/leave-request';
const BASE='/leave-ease/requests';const PORTAL='/leave-ease';
type Envelope<T>={success:boolean;message?:string;data:T;workflow?:LeaveDecisionResponse['workflow']};
function checked<T extends {success?:boolean;message?:string;workflow?:{failed?:boolean}}>(body:T):T {if(body.success===false||body.workflow?.failed)throw Object.assign(new Error(body.message||'The workflow could not complete this decision. Refresh the request before trying again.'),{workflowFailed:body.workflow?.failed===true});return body;}
const numeric=(value:unknown)=>typeof value==='number'||typeof value==='string'?Number(value):undefined;
function normalizeRow(value:unknown):LeaveRequest {
 const raw=value as Record<string,unknown>;const row=raw as unknown as LeaveRequest;
 if(!raw||typeof raw!=='object')throw new Error('Invalid leave request response.');
 if(typeof raw.leave_type==='object'&&raw.leave_type!==null)return {...row,uuid:String(raw.uuid||raw.id)};
 const employee=(raw.employee||{}) as {id?:string;name?:string;employee_code?:string};
 return {...row,id:String(raw.id||raw.uuid),uuid:String(raw.uuid||raw.id),employee_id:employee.id||'',employee_name:employee.name||row.employee_name,leave_type:{id:String(raw.leave_type_id||''),uuid:String(raw.leave_type_id||''),name:typeof raw.leave_type==='string'?raw.leave_type:'Leave request',code:'',is_paid:false},from_date:String(raw.from_date||raw.date||''),to_date:String(raw.to_date||''),is_half_day:!!raw.is_half_day,half_day_session:row.half_day_session||null,total_days:numeric(raw.total_days)??0,reason:row.reason||null,status:row.status,attachment_path:row.attachment_path||null};
}
function normalizeList(body:Envelope<{items?:unknown[];data?:unknown[];meta?:LeaveRequestMeta;summary?:unknown}|unknown[]>):LeaveRequestList {
 checked(body);const raw=body.data;const rows=Array.isArray(raw)?raw:raw.items||raw.data; if(!Array.isArray(rows))throw new Error('The leave list is missing from the response.');
 const meta=Array.isArray(raw)?undefined:raw.meta;
 return {success:true,message:body.message||'',data:{data:rows.map(normalizeRow),meta:meta||{current_page:1,last_page:1,per_page:Math.max(1,rows.length),total:rows.length,from:rows.length?1:0,to:rows.length}}};
}
export function leaveRequestValues(data:LeaveRequestFormData,edit=false):Record<string,string|number|boolean|null|undefined>{
 if(edit&&data.evidence_only)return {reason:data.reason.trim(),...(typeof data.row_version==='number'?{row_version:data.row_version}:{})};
 const minutes=data.request_unit==='minutes';
 return {leave_type_id:data.leave_type_id,from_date:data.from_date,to_date:minutes?data.from_date:data.to_date,...(minutes?{start_time:data.start_time,end_time:data.end_time}:{is_half_day:data.is_half_day,...(data.is_half_day?{half_day_session:data.half_day_session}:edit?{half_day_session:null}:{})}),reason:data.reason.trim(),...(edit?typeof data.row_version==='number'?{row_version:data.row_version}:{}:!minutes&&data.nominee_employee_id?{nominee_employee_id:data.nominee_employee_id}:{})};
}
export function buildLeaveRequestFormData(data:LeaveRequestFormData,edit=false){const body=new FormData();for(const [key,value] of Object.entries(leaveRequestValues(data,edit)))if(value!=null)body.append(key,typeof value==='boolean'?value?'1':'0':String(value));if(data.attachment)body.append('attachment',data.attachment);if(edit)body.append('_method','PUT');return body;}
function upload(data:LeaveRequestFormData,edit=false){return data.attachment?{body:buildLeaveRequestFormData(data,edit),headers:{'Content-Type':undefined}}:{body:leaveRequestValues(data,edit),headers:{'Content-Type':'application/json'}};}
function idem(key?:string){return key?{'Idempotency-Key':key}:{};}
export const leaveRequestService={
 getAll:async(params?:LeaveRequestFilters,signal?:AbortSignal)=>{const {data}=await api.get(`${PORTAL}/my/requests`,{params,signal});return normalizeList(data);},
 getPending:async(params:LeaveRequestFilters={},signal?:AbortSignal):Promise<LeaveRequestList>=>{
  const hasLocalFilters=!!params.search||!!params.leave_type_id;const fetch=async(page:number,per:number)=>{const {data}=await api.get(`${PORTAL}/team/approvals`,{params:{type:'leave',status:params.status||'pending',page,per_page:per},signal});return normalizeList(data);};
  if(!hasLocalFilters)return fetch(params.page||1,params.per_page||10);
  const rows=new Map<string,LeaveRequest>();let page=1;while(true){const response=await fetch(page,100);for(const row of response.data.data)rows.set(row.uuid,row);if(page>=response.data.meta.last_page)break;if(response.data.meta.current_page!==page||!response.data.data.length)throw new Error('Unable to load the complete approval queue.');page++;}
  const text=(params.search||'').toLowerCase();const candidates=[...rows.values()];
  if(params.leave_type_id){for(let i=0;i<candidates.length;i++)if(!candidates[i].leave_type.id)candidates[i]=await leaveRequestService.getApproverDetail(candidates[i].uuid,signal);}
  const result=candidates.filter(r=>(!params.leave_type_id||r.leave_type.id===params.leave_type_id)&&(!text||`${r.employee_name||''} ${r.leave_type.name} ${r.reason||''}`.toLowerCase().includes(text)));
  const size=params.per_page||10;const last=Math.max(1,Math.ceil(result.length/size));const current=Math.min(params.page||1,last);const start=(current-1)*size;
  return {success:true,message:'',data:{data:result.slice(start,start+size),meta:{current_page:current,last_page:last,per_page:size,total:result.length,from:result.length?start+1:0,to:Math.min(start+size,result.length)}}};
 },
 options:async(signal?:AbortSignal)=>{const {data}=await api.get<Envelope<LeaveRequestOptions>>(`${PORTAL}/my/request-options`,{signal});return checked(data).data;},
 lookupBalances:async(signal?:AbortSignal)=>{const {data}=await api.get<Envelope<Record<string,unknown>[]>>(`${PORTAL}/leave-types/lookup`,{params:{include_balance:true},signal});return checked(data).data;},
 balances:async(year:number,signal?:AbortSignal)=>{const {data}=await api.get<Envelope<{items:Record<string,unknown>[];summary?:unknown}>>(`${PORTAL}/my/balances`,{params:{year},signal});return checked(data).data;},
 preview:async(payload:LeaveRequestFormData,signal?:AbortSignal)=>{const request=upload(payload);const {data}=await api.post<Envelope<LeavePreview>>(`${PORTAL}/my/requests/preview`,request.body,{headers:request.headers,signal});return checked(data).data;},
 nominees:async(signal?:AbortSignal)=>{const {data}=await api.get<Envelope<LeaveNominee[]>>(`${PORTAL}/approval-delegation/nominees`,{signal});return checked(data).data;},
 capabilities:async(signal?:AbortSignal)=>{const {data}=await api.get<Envelope<LeaveDelegation>>(`${PORTAL}/approval-delegation`,{signal});return checked(data).data;},
 delegatedTasks:async(page=1,per_page=10,signal?:AbortSignal)=>{const {data}=await api.get<Envelope<{items:DelegatedLeaveTask[];total:number;page:number;per_page:number}>>(`${PORTAL}/approval-delegation/tasks`,{params:{page,per_page},signal});return checked(data).data;},
 getById:async(uuid:string,signal?:AbortSignal)=>{const {data}=await api.get<Envelope<LeaveRequest>>(`${BASE}/${uuid}`,{signal});return normalizeRow(checked(data).data);},
 getApproverDetail:async(uuid:string,signal?:AbortSignal)=>{const {data}=await api.get<Envelope<{summary:{can_approve?:boolean;can_reject?:boolean;task_id?:number|string};request:LeaveRequest}>>(`${PORTAL}/team/approvals/leave/${uuid}`,{signal});const body=checked(data).data;return {...normalizeRow(body.request),can_approve:body.summary.can_approve===true,can_reject:body.summary.can_reject===true,task_id:body.summary.task_id};},
 create:async(payload:LeaveRequestFormData,key?:string)=>{const request=upload(payload);const {data}=await api.post<Envelope<LeaveRequest>>(BASE,request.body,{headers:{...request.headers,...idem(key)}});return normalizeRow(checked(data).data);},
 draft:async(payload:LeaveRequestFormData)=>{const request=upload(payload);const {data}=await api.post<Envelope<LeaveRequest>>(`${PORTAL}/my/requests/drafts`,request.body,{headers:request.headers});return normalizeRow(checked(data).data);},
 update:async(uuid:string,payload:LeaveRequestFormData)=>{const request=upload(payload,true);const response=payload.attachment?await api.post(`${BASE}/${uuid}`,request.body,{headers:request.headers}):await api.put(`${BASE}/${uuid}`,request.body);return normalizeRow(checked(response.data).data);},
 changeNominee:async(uuid:string,employeeId:string|null)=>{const {data}=await api.patch<Envelope<unknown>>(`${BASE}/${uuid}/nominee`,{nominee_employee_id:employeeId});checked(data);return data;},
 action:async(uuid:string,action:LeaveRequestAction,body:Record<string,string|number>={},key?:string):Promise<LeaveDecisionResponse>=>{const response=action==='delete'?await api.delete(`${BASE}/${uuid}`):await api.post(`${BASE}/${uuid}/${action}`,body,{headers:idem(key)});return response.data?checked(response.data):{success:true,message:'Draft deleted'};},
 retryAttendance:async(uuid:string,effectId:string,reason:string,key:string)=>{const {data}=await api.post<LeaveDecisionResponse>(`${BASE}/${uuid}/attendance-reconciliation/retry`,{effect_id:effectId,reason},{headers:idem(key)});return checked(data);},
 downloadAttachment:async(uuid:string)=>{const response=await api.get<Blob>(`${PORTAL}/my/requests/${uuid}/attachment`,{responseType:'blob'});return {blob:response.data,disposition:response.headers['content-disposition'] as string|undefined};},
 bulkDecision:async(decision:'approve'|'reject',ids:string[],reason?:string)=>{if(decision==='reject'&&(!reason||reason.trim().length<5||reason.trim().length>2000))throw new Error('Provide a rejection reason of 5–2000 characters.');if(!ids.length||ids.length>50||new Set(ids).size!==ids.length)throw new Error('Select up to 50 unique requests.');const {data}=await api.post<LeaveBulkResponse>(`${PORTAL}/team/approvals/bulk-decision`,{decision,items:ids.map(id=>({type:'leave',id})),...(decision==='reject'?{reason}:{} )});if(data.success===false)throw new Error(data.message||'Bulk decision failed');return data;},
 delete:async(uuid:string)=>{await leaveRequestService.action(uuid,'delete');},
};
