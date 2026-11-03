import { beforeEach, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { buildLeaveRequestFormData, leaveRequestService, leaveRequestValues } from './leave-request.service';
import { createLeaveCommandKeys, leaveActionBody, leaveRowActions } from '@/lib/leave-requests';
import type { LeaveRequest, LeaveRequestFormData } from '@/types/leave-request';
vi.mock('@/lib/api',()=>({api:{get:vi.fn(),post:vi.fn(),put:vi.fn(),delete:vi.fn()}}));
const form:LeaveRequestFormData={leave_type_id:'type-uuid',from_date:'2026-11-10',to_date:'2026-11-10',is_half_day:true,half_day_session:'morning',reason:' Appointment ',attachment:null,nominee_employee_id:'employee-uuid',reviewer_id:'',row_version:0};
const row={uuid:'request-uuid',id:'request-uuid',leave_type:{uuid:'type-uuid',id:'type-uuid',name:'Annual leave',code:'AL'},employee_name:'Test Employee',from_date:'2026-11-10',to_date:'2026-11-10',reason:'Appointment',status:'pending',row_version:0,can_approve:true,can_reject:true,approval_owner:'system_flex',revision:2} as LeaveRequest;
beforeEach(()=>{vi.clearAllMocks();vi.mocked(api.post).mockResolvedValue({data:{success:true,data:row}});vi.mocked(api.put).mockResolvedValue({data:{success:true,data:row}});});
it('creates for the authenticated employee and sends the nominee employee identifier',()=>{
 const body=buildLeaveRequestFormData(form);
 expect(body.has('employee_id')).toBe(false);expect(body.get('nominee_employee_id')).toBe('employee-uuid');expect(body.get('half_day_session')).toBe('morning');expect(body.get('reason')).toBe('Appointment');expect(body.has('row_version')).toBe(false);
});
it('retains row_version zero and excludes create-only fields on updates',()=>{
 const values=leaveRequestValues({...form,employee_id:'another-employee'},true);
 expect(values).toMatchObject({row_version:0,half_day_session:'morning'});expect(values).not.toHaveProperty('employee_id');expect(values).not.toHaveProperty('nominee_employee_id');
 expect(leaveRequestValues({...form,is_half_day:false},true).half_day_session).toBeNull();
});
it('uses multipart POST with PUT override for replacement attachments',async()=>{
 const file=new File(['pdf'],'proof.pdf',{type:'application/pdf'});await leaveRequestService.update(row.uuid,{...form,attachment:file});
 const [url,body]=vi.mocked(api.post).mock.calls[0];expect(url).toBe('/leave-ease/requests/request-uuid');expect(body).toBeInstanceOf(FormData);expect((body as FormData).get('_method')).toBe('PUT');expect((body as FormData).get('row_version')).toBe('0');expect((body as FormData).get('attachment')).toBe(file);expect(api.put).not.toHaveBeenCalled();
});
it('uses JSON PUT when no attachment is replaced',async()=>{
 await leaveRequestService.update(row.uuid,form);expect(api.put).toHaveBeenCalledWith('/leave-ease/requests/request-uuid',expect.objectContaining({row_version:0}));expect(api.post).not.toHaveBeenCalled();
});
it('uses exact workflow fields and never includes the excluded return action',()=>{
 expect(leaveActionBody('submit','',row)).toEqual({row_version:0});expect(leaveActionBody('approve',' noted ',row)).toEqual({notes:'noted',expected_revision:2});expect(leaveActionBody('reject',' reason ',row)).toEqual({rejection_reason:'reason',expected_revision:2});expect(leaveActionBody('cancel',' reason ',row)).toEqual({cancellation_reason:'reason'});expect(leaveActionBody('revoke',' reason ',row)).toEqual({});
 expect(leaveRowActions({...row,department_conflict:{checked:true,has_conflict:true,advisory_only:true,approval_blocked:false,conflicts:[]}},'team',false,'2026-11-02')).toContain('approve');
 expect(leaveRowActions({...row,department_conflict:{checked:true,has_conflict:true,advisory_only:false,approval_blocked:true,conflicts:[]}},'team',false,'2026-11-02')).not.toContain('approve');
 expect(leaveRowActions(row,'team',false,'2026-11-02')).not.toContain('return');expect(leaveRowActions({...row,status:'approved'},'my',false,'2026-11-11')).not.toContain('cancel');expect(leaveRowActions({...row,status:'approved'},'my',false,'2026-11-02')).not.toContain('revoke');
});
it('searches and paginates the complete pending queue rather than just one page',async()=>{
 vi.mocked(api.get).mockImplementation(async(_url,config)=>{const page=(config?.params as {page?:number}|undefined)?.page||1;return {data:{success:true,message:'OK',data:{data:[{...row,uuid:`request-${page}`,employee_name:page===1?'First Employee':'Second Employee'}],meta:{current_page:page,last_page:2,per_page:100,total:2}}}};});
 const result=await leaveRequestService.getPending({page:1,per_page:10,search:'Second'});expect(api.get).toHaveBeenCalledTimes(2);expect(result.data.meta.total).toBe(1);expect(result.data.data[0].employee_name).toBe('Second Employee');
});
it('rejects unsuccessful API envelopes instead of reporting success',async()=>{
 vi.mocked(api.post).mockResolvedValue({data:{success:false,message:'Request is locked'}});await expect(leaveRequestService.create(form)).rejects.toThrow('Request is locked');
});

it('uses the applicant portal and actionable team inbox rather than general scoped lists',async()=>{
 vi.mocked(api.get).mockResolvedValue({data:{success:true,data:{items:[row],meta:{current_page:1,last_page:1,per_page:10,total:1}}}});
 await leaveRequestService.getAll({page:1,per_page:10});expect(api.get).toHaveBeenLastCalledWith('/leave-ease/my/requests',expect.anything());
 await leaveRequestService.getPending({page:1,per_page:10,status:'approved'});expect(api.get).toHaveBeenLastCalledWith('/leave-ease/team/approvals',expect.objectContaining({params:expect.objectContaining({type:'leave',status:'approved'})}));
});
it('sends a supplied idempotency key on apply, but never double-submits',async()=>{
 await leaveRequestService.create(form,'stable-action-key');expect(api.post).toHaveBeenCalledTimes(1);expect(api.post).toHaveBeenCalledWith('/leave-ease/requests',expect.anything(),expect.objectContaining({headers:expect.objectContaining({'Idempotency-Key':'stable-action-key'})}));
});
it('strips forbidden and day-only fields from minute requests',()=>{
 const values=leaveRequestValues({...form,request_unit:'minutes',start_time:'09:00',end_time:'10:00',employee_id:'other-person',reviewer_id:'other-user'});
 expect(values).toMatchObject({start_time:'09:00',end_time:'10:00',to_date:form.from_date});for(const field of ['employee_id','reviewer_id','is_half_day','half_day_session','nominee_employee_id','request_unit'])expect(values).not.toHaveProperty(field);
});
it('omits null optional multipart fields and preserves evidence-only measured updates',()=>{
 const body=buildLeaveRequestFormData({...form,is_half_day:false},true);expect(body.has('half_day_session')).toBe(false);
 expect(leaveRequestValues({...form,evidence_only:true},true)).toEqual({reason:'Appointment',row_version:0});
});
it('does not offer edit on pending or resubmit on terminal rejected requests',()=>{
 expect(leaveRowActions(row,'my',false,'2026-11-02')).not.toContain('edit');expect(leaveRowActions({...row,status:'rejected',can_resubmit:true},'my',false,'2026-11-02')).not.toContain('submit');
});
it('treats a failed workflow as a failure even on HTTP 200',async()=>{
 vi.mocked(api.post).mockResolvedValue({data:{success:true,message:'Workflow failed',data:row,workflow:{failed:true}}});await expect(leaveRequestService.action(row.uuid,'approve',{},'key')).rejects.toThrow('Workflow failed');
});
it('uses the nominee-safe approver detail route and current action flags',async()=>{
 vi.mocked(api.get).mockResolvedValue({data:{success:true,data:{summary:{can_approve:false,can_reject:true,task_id:45},request:row}}});const detail=await leaveRequestService.getApproverDetail(row.uuid);expect(api.get).toHaveBeenCalledWith('/leave-ease/team/approvals/leave/request-uuid',expect.anything());expect(detail.can_approve).toBe(false);expect(detail.can_reject).toBe(true);
});

it('retains an idempotency key for the same retry and rotates it for changed inputs',()=>{
 const keys=createLeaveCommandKeys();const first=keys.get('apply',{reason:'Original'});expect(keys.get('apply',{reason:'Original'})).toBe(first);expect(keys.get('apply',{reason:'Changed'})).not.toBe(first);
 const file=new File(['evidence'],'proof.pdf',{type:'application/pdf'});const withFile=keys.get('apply',{reason:'Original'},file);expect(keys.get('apply',{reason:'Original'},file)).toBe(withFile);expect(keys.get('apply',{reason:'Original'},new File(['evidence'],'proof.pdf',{type:'application/pdf'}))).not.toBe(withFile);
});
it('uses the workflow revision rather than the editable row version for a decision',()=>{
 expect(leaveActionBody('approve','',{...row,row_version:99,revision:3})).toEqual({expected_revision:3});expect(leaveActionBody('submit','',{...row,status:'returned',row_version:0})).toEqual({row_version:0});expect(leaveActionBody('revoke','ignored',row)).toEqual({});
});
it('honors minute-based cancellation boundaries and server approval permissions',()=>{
 const minute={...row,status:'approved',request_unit:'minutes',from_date:'2026-11-02',start_time:'10:00'} as LeaveRequest;expect(leaveRowActions(minute,'my',false,'2026-11-02','09:59')).toContain('cancel');expect(leaveRowActions(minute,'my',false,'2026-11-02','10:00')).not.toContain('cancel');expect(leaveRowActions({...row,can_approve:false,can_reject:false},'team',false,'2026-11-02')).toEqual([]);
});
