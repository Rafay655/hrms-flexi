export type CompOffStatus = 'pending_approval' | 'approved' | 'rejected' | 'expired';
export type CreditType = 'full_day' | 'half_day';
export interface CompOff {
 id:string; uuid:string; company_id?:number; employee_id?:number|string;
 employee?:{id:string;uuid?:string;employee_code:string;name?:string;full_name?:string}|null;
 approved_by_user?:{id:string;uuid?:string;name:string}|null;
 holiday_date:string; hours_worked:number|string; shift_duration:number|string; credit_type:CreditType; credit_days:number|string|null;
 status:CompOffStatus; approved_at?:string|null; expires_at:string|null; expiry_processed?:boolean;
 source_event_data?:Record<string,unknown>|null; rejection_reason?:string|null; notes?:string|null; created_at?:string; updated_at?:string;
}
export interface CompOffFilters {page?:number;per_page?:number;search?:string;status?:string;}
export interface CompOffMeta {current_page:number;from:number|null;last_page:number;per_page:number;to:number|null;total:number;}
export interface PaginatedCompOffsResponse {success:boolean;message:string;data:{data:CompOff[];links?:unknown;meta:CompOffMeta};}
export interface MyCompOffsResponse {success:boolean;message:string;data:CompOff[];}
