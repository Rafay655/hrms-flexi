export interface CarryForwardRule {id:string;leave_type:{id:string;name:string;code:string;carry_forward_allowed:boolean|null}|null;max_days:number|null;expires:boolean;expiry_months:number|null;is_active:boolean;notes:string|null;created_at:string|null;updated_at:string|null;}
export interface CarryForwardInput {leave_type_id:string;max_days:number|null;expires:boolean;expiry_months:number|null;is_active:boolean;notes:string;}
export interface CarryForwardFilters {page?:number;per_page?:number;leave_type_id?:string;is_active?:0|1;search?:string;}
export interface CarryForwardPage {rows:CarryForwardRule[];meta:{current_page:number;last_page:number;per_page:number;total:number};}
