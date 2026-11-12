import { api } from '@/lib/api';
import type { LeaveEncashment,LeaveEncashmentFormData,EncashmentFilters,PaginatedLeaveEncashmentsResponse } from '@/types/leave-encashment';
const BASE='/leave-ease/encashment';
function checked<T extends {success?:boolean;message?:string}>(body:T):T {if(body.success===false)throw new Error(body.message||'The encashment request failed.');return body;}
export const leaveEncashmentService={
 getAll:async(params:EncashmentFilters,signal?:AbortSignal):Promise<PaginatedLeaveEncashmentsResponse>=>{
  const {employee_id,leave_type_id,year,status,payroll_included,sort_by,sort_dir,page,per_page}=params;
  const fetch=async(current=page,size=per_page):Promise<PaginatedLeaveEncashmentsResponse>=>{const {data}=await api.get(BASE,{params:{employee_id,leave_type_id,year,status,payroll_included,sort_by,sort_dir,page:current,per_page:size},signal});checked(data);const rows=Array.isArray(data.data)?data.data:data.data?.data;const meta=data.meta||data.data?.meta;if(!Array.isArray(rows)||!meta)throw new Error('Invalid encashment listing response.');return {...data,data:rows.map((row:LeaveEncashment)=>({...row,uuid:row.uuid||row.id})),meta};};
  const text=params.search?.trim().toLowerCase();if(!text)return fetch();
  const pool=new Map<string,LeaveEncashment>();let current=1;while(true){const result=await fetch(current,100);for(const row of result.data)pool.set(row.uuid,row);if(current>=result.meta.last_page)break;if(result.meta.current_page!==current||!result.data.length)throw new Error('Unable to search the complete encashment list.');current++;}
  const found=[...pool.values()].filter(row=>[row.employee?.name,row.employee?.employee_code,row.leave_type?.name,row.leave_type?.code,row.year,row.status,row.days_encashed,row.amount].join(' ').toLowerCase().includes(text));const size=per_page||15;const last=Math.max(1,Math.ceil(found.length/size));const selected=Math.max(1,Math.min(page||1,last));
  return {success:true,message:'Encashments retrieved.',data:found.slice((selected-1)*size,selected*size),meta:{current_page:selected,last_page:last,per_page:size,total:found.length}};
 },
 create:async(payload:LeaveEncashmentFormData)=>{const rate=payload.rate_per_day.trim();if(rate!==''&&(!Number.isFinite(Number(rate))||Number(rate)<0))throw new Error('Rate per day must be zero or greater.');const {data}=await api.post(BASE,{employee_id:payload.employee_id,leave_type_id:payload.leave_type_id,year:payload.year,days_encashed:payload.days_encashed,rate_per_day:rate===''?null:Number(rate)});return checked(data);},
 decide:async(uuid:string,decision:'approve'|'reject',reason='')=>{const text=reason.trim();if(decision==='reject'&&(text.length<5||text.length>500))throw new Error('Rejection reason must contain 5–500 characters.');const {data}=await api.post(BASE+'/'+uuid+'/'+decision,decision==='reject'?{rejection_reason:text}:{});return checked(data);},
};
