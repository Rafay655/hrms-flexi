export type BlackoutCategory='audit'|'financial_close'|'peak_period'|'stocktake'|'other';
export interface BlackoutWindow {id:string;name:string;description:string|null;category:string|null;starts_on:string;ends_on:string;leave_types:string[]|null;branches:string[]|null;is_active:boolean;created_at?:string;updated_at?:string;}
export interface BlackoutInput {name:string;description:string;category:string;starts_on:string;ends_on:string;leave_type_ids:string[];branch_ids:string[];is_active:boolean;}
export interface BlackoutFilters {page?:number;per_page?:number;search?:string;category?:string;is_active?:boolean;year?:number;}
export interface BlackoutPage {rows:BlackoutWindow[];meta:{current_page:number;last_page:number;per_page:number;total:number;};}
export interface BlackoutCalendarHit {id:string;name:string;category:string|null;}
export interface BlackoutCalendarWindow extends BlackoutCalendarHit {starts_on:string;ends_on:string;leave_types:(string|number)[]|'all'|null;branches:(string|number)[]|'all'|null;}
export interface BlackoutCalendar {year:number;windows:BlackoutCalendarWindow[];dates:Record<string,BlackoutCalendarHit[]>;}
export interface BlackoutCheckInput {employee_id:string;from_date:string;to_date:string;}
export interface BlackoutCheckResult {blocked:boolean;from_date:string;to_date:string;leave_type:unknown;windows:(BlackoutCalendarHit&{starts_on?:string;ends_on?:string})[];}
