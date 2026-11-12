import type { BalanceRow } from './leave-balance';
export interface OpeningFilters {year:number;page?:number;per_page?:number;employee_id?:string;leave_type_id?:string;search?:string;}
export interface OpeningPage {rows:BalanceRow[];meta:{current_page:number;last_page:number;per_page:number;total:number};}
export interface OpeningReportRow {row:number|null;employee_code:string;leave_type_code:string;opening_balance:number|string|null;carried_forward:number|string|null;errors:string[];}
export interface OpeningImportReport {dry_run:boolean;rows_total:number|null;rows_valid:number|null;rows_invalid:number;applied:number;rows:OpeningReportRow[];raw:Record<string,unknown>;}
export interface OpeningImportResponse {success:boolean;message:string;data:OpeningImportReport;}
