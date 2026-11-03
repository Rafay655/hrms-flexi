export type LeaveRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'revoked' | 'returned';
export type HalfDaySession = 'morning' | 'afternoon';
export interface LeaveDepartmentConflict {
 checked: boolean; has_conflict: boolean; advisory_only: boolean; approval_blocked: boolean;
 priority_rank?: number; higher_priority_count?: number; priority_rule?: string;
 conflicts: {request_id:string;employee_id:string;employee_name:string;from_date:string;to_date:string;overlap_from_date:string;overlap_to_date:string;status:string;has_priority_over_current?:boolean;is_half_day?:boolean;half_day_session?:HalfDaySession|null;applied_at?:string}[];
}
export interface LeaveRequest {
 id:string; uuid:string; company_id:number; employee_id:number|string;
 employee_name?:string;
 employee?:{id:string;uuid?:string;employee_code:string;name?:string};
 leave_type:{id:string;uuid:string;name:string;code:string;is_paid:boolean};
 reviewer?:{id:string;uuid?:string;name:string}|null;
 approved_by_user?:{id:string;uuid:string;name:string}|null;
 from_date:string; to_date:string; is_half_day:boolean; half_day_session:HalfDaySession|null;
 total_days:number; total_days_decimal?:string; reason:string|null; attachment_path:string|null;
 status:LeaveRequestStatus; rejection_reason:string|null; approved_at:string|null; cancelled_at:string|null; cancellation_reason:string|null; balance_deducted:boolean;
 row_version?:number; revision?:number; requires_correction?:boolean; correction_reason?:string|null; can_resubmit?:boolean;
 approval_nominee?:{employee_id:string;user_id:string;name:string}|null;
 department_conflict?:LeaveDepartmentConflict|null;
 attendance_reconciliation?:AttendanceReconciliation|null; approval_owner?:string|null; approval_version_id?:string|number|null;
 request_unit?:'days'|'minutes'; start_time?:string|null; end_time?:string|null; duration_minutes?:number|null;
 short_leave_quote?:Record<string,unknown>|null; short_leave_effect?:Record<string,unknown>|null; request_origin?:string|null;
 can_approve?:boolean; can_reject?:boolean; task_id?:string|number|null;
 submitted_at?:string|null; created_at?:string; updated_at?:string;
}
export interface LeaveRequestFormData {
 employee_id?:string; leave_type_id:string; from_date:string; to_date:string;
 is_half_day:boolean; half_day_session:HalfDaySession|''; reason:string; attachment:File|null;
 reviewer_id?:string; nominee_employee_id?:string; row_version?:number;
 request_unit?:'days'|'minutes';start_time?:string;end_time?:string;evidence_only?:boolean;
}
export interface LeaveRequestFilters {page?:number;per_page?:number;search?:string;status?:string;leave_type_id?:string;from_date?:string;to_date?:string}
export interface LeaveRequestMeta {current_page:number;last_page:number;per_page:number;total:number;from?:number|null;to?:number|null}
export interface LeaveRequestList {success:boolean;message:string;data:{data:LeaveRequest[];meta:LeaveRequestMeta}}
export interface LeaveNominee {id:string;employee_code:string;name:string;user_id:string}
export type LeaveRequestAction = 'submit'|'approve'|'reject'|'cancel'|'revoke'|'delete';

export interface AttendanceReconciliation {effect_id:string;status:string;attempts?:number;revision?:number;can_retry:boolean;error:string|{message?:string}|null;completed_at?:string|null}
export interface ShortLeavePolicy {max_duration_minutes?:number;free_allowance_period?:string;free_remaining?:number;allow_employee_requests:boolean;auto_approval?:string}
export interface LeaveApplyType {id:string;uuid?:string;name:string;code:string;is_paid:boolean;request_unit:'days'|'minutes';allow_half_day:boolean;requires_attachment?:boolean;min_days_notice?:number;short_leave_policy?:ShortLeavePolicy|null}
export interface LeaveRequestOptions {employee:{id:string;name:string};leave_types:LeaveApplyType[];reviewer?:{id:string;name:string}|null;half_day_sessions:HalfDaySession[];max_attachment_mb?:number;can_nominate_approver:boolean}
export interface LeavePreview {valid?:boolean;request_unit:'days'|'minutes';total_days:number;duration_minutes?:number;short_leave_quote?:Record<string,unknown>|null;from_date?:string;to_date?:string;balance_deducted?:boolean}
export interface LeaveDelegation {is_temporary_approver:boolean;can_approve_team_leave:boolean;can_approve_team_regularization:boolean;can_approve_team_shift_swap:boolean;delegations?:{manager_user_id:number|string;leave_id:string;from_date:string;to_date:string}[]}
export interface DelegatedLeaveTask {task_id:number|string;source_type:string;request_id:string;can_approve:boolean;can_reject:boolean;request?:Partial<LeaveRequest>;manager_user_id?:number|string}
export interface LeaveWorkflow {completed?:boolean;failed?:boolean;state?:string;task_id?:string|number;instance_id?:string|number}
export interface LeaveDecisionResponse {success:boolean;message?:string;data?:LeaveRequest;workflow?:LeaveWorkflow}
export interface LeaveBulkItemResult {id?:string;type?:string;success:boolean;http_status?:number;result?:unknown;error?:unknown;message?:string}
export interface LeaveBulkResponse {success:boolean;message?:string;data:{items:LeaveBulkItemResult[];failed:number}}
