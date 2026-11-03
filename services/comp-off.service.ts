import { api } from '@/lib/api';
import type { CompOff, CompOffFilters, CreditType, PaginatedCompOffsResponse, MyCompOffsResponse } from '@/types/comp-off';
const BASE='/leave-ease/comp-off';
export interface CompOffFormData {employee_id:string;holiday_date:string;hours_worked:number;shift_duration:number;credit_type?:CreditType|null;expires_at:string|null;source_event_data?:Record<string,unknown>|null;}
function checked<T extends {success?:boolean;message?:string}>(body:T):T {if(body.success===false)throw new Error(body.message||'Unable to complete the comp-off request.');return body;}
function row(value:CompOff):CompOff {return {...value,uuid:value.uuid||value.id};}
export const compOffService={
 getAll:async(params?:CompOffFilters,signal?:AbortSignal):Promise<PaginatedCompOffsResponse>=>{const {data}=await api.get<PaginatedCompOffsResponse>(BASE,{params,signal});checked(data);if(!Array.isArray(data.data?.data)||!data.data.meta)throw new Error('Invalid comp-off list response.');return {...data,data:{...data.data,data:data.data.data.map(row)}};},
 getMy:async(params?:CompOffFilters,signal?:AbortSignal):Promise<MyCompOffsResponse>=>{const {data}=await api.get<MyCompOffsResponse>(`${BASE}/my`,{params:params?.status?{status:params.status}:undefined,signal});checked(data);if(!Array.isArray(data.data))throw new Error('Invalid personal comp-off response.');return {...data,data:data.data.map(row)};},
 create:async(payload:CompOffFormData)=>{const {employee_id,holiday_date,hours_worked,shift_duration,credit_type,expires_at,source_event_data}=payload;const {data}=await api.post<{success:boolean;message:string;data:CompOff}>(BASE,{employee_id,holiday_date,hours_worked,shift_duration,...(credit_type?{credit_type}:{}),expires_at,...(source_event_data?{source_event_data}:{})});return row(checked(data).data);},
 decide:async(uuid:string,decision:'approve'|'reject',text:string)=>{const clean=text.trim();if(decision==='reject'&&(clean.length<5||clean.length>500))throw new Error('Rejection reason must contain 5–500 characters.');if(decision==='approve'&&clean.length>500)throw new Error('Notes may not exceed 500 characters.');const {data}=await api.post<{success:boolean;message:string;data:CompOff}>(`${BASE}/${uuid}/${decision}`,decision==='reject'?{rejection_reason:clean}:clean?{notes:clean}:{});return row(checked(data).data);},
};
