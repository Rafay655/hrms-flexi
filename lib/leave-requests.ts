import type { LeaveRequest, LeaveRequestAction, LeaveRequestFormData } from '@/types/leave-request';
export const leaveStatusOptions=['draft','pending','returned','approved','rejected','cancelled','revoked'].map(value=>({value,label:value.charAt(0).toUpperCase()+value.slice(1)}));
export const leaveStatusLabel=(row:LeaveRequest)=>row.status==='returned'||row.requires_correction?'Correction required':row.status.charAt(0).toUpperCase()+row.status.slice(1).replaceAll('_',' ');
export const leaveStatusTone=(status:string)=>status==='approved'?'bg-emerald-50 text-emerald-700':status==='pending'||status==='returned'?'bg-amber-50 text-amber-800':status==='rejected'||status==='revoked'?'bg-rose-50 text-rose-700':'bg-gray-100 text-gray-700';
export function attendanceGenerated(row:LeaveRequest){return row.request_unit==='minutes'&&!!row.request_origin&&/(attendance|time_sync|timesync|penalty)/i.test(row.request_origin);}
export function leaveRowActions(row:LeaveRequest,scope:'my'|'team',canRevoke:boolean,today:string,nowTime='00:00'):('edit'|LeaveRequestAction)[]{
 const actions:('edit'|LeaveRequestAction)[]=[];
 if(scope==='team'){if(row.status==='pending'){if(row.can_approve===true&&row.department_conflict?.approval_blocked!==true)actions.push('approve');if(row.can_reject===true)actions.push('reject');}return actions;}
 if(row.status==='draft'||row.status==='returned'&&(row.requires_correction||row.can_resubmit))actions.push('edit');
 if(row.status==='draft'||row.status==='returned'&&row.can_resubmit&&typeof row.row_version==='number')actions.push('submit');
 const beforeStart=row.request_unit==='minutes'?row.from_date.slice(0,10)>today||row.from_date.slice(0,10)===today&&!!row.start_time&&row.start_time.slice(0,5)>nowTime:row.from_date.slice(0,10)>today;
 if(!attendanceGenerated(row)&&(['pending','returned'].includes(row.status)||row.status==='approved'&&beforeStart))actions.push('cancel');
 if(row.status==='approved'&&canRevoke)actions.push('revoke');if(row.status==='draft')actions.push('delete');return actions;
}
export function leaveActionBody(action:LeaveRequestAction,reason:string,row:LeaveRequest):Record<string,string|number>{
 const text=reason.trim();if(action==='submit')return typeof row.row_version==='number'?{row_version:row.row_version}:{};
 const revision:Record<string,string|number>={};if(row.approval_owner==='system_flex'&&typeof row.revision==='number')revision.expected_revision=row.revision;
 if(action==='approve')return {...revision,...(text?{notes:text}:{})};if(action==='reject')return {...revision,rejection_reason:text};if(action==='cancel')return text?{cancellation_reason:text}:{};return {};
}
export function leaveQuantity(row:Pick<LeaveRequest,'request_unit'|'duration_minutes'|'total_days_decimal'|'total_days'>){return row.request_unit==='minutes'?`${row.duration_minutes??'—'} min`:`${row.total_days_decimal??row.total_days} days`;}
const fileIds=new WeakMap<File,number>();let nextFileId=0;
export function createLeaveCommandKeys(){let fingerprint='';let key='';return {get(action:string,payload:unknown,file?:File|null){if(file&&!fileIds.has(file))fileIds.set(file,++nextFileId);const next=JSON.stringify([action,payload,file?fileIds.get(file):null]);if(next!==fingerprint){fingerprint=next;key=crypto.randomUUID();}return key;},reset(){fingerprint='';key='';}};}
export function formFingerprint(form:LeaveRequestFormData){return {...form,attachment:form.attachment?{name:form.attachment.name,size:form.attachment.size,lastModified:form.attachment.lastModified}:null};}
