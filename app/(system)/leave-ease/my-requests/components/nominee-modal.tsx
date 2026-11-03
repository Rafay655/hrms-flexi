'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SearchableSelect from '@/components/ui/searchable-select';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import { useAppSelector } from '@/store/hooks';
import { leaveRequestService as service } from '@/services/leave-request.service';
import { showApiError } from '@/lib/error-toast';
import type { LeaveRequest } from '@/types/leave-request';
export function LeaveNomineeModal({row,onClose,onChanged}:{row:LeaveRequest;onClose:()=>void;onChanged:()=>void}){
 const client=useQueryClient();
 const company=useAppSelector(s=>s.auth.company?.id);const user=useAppSelector(s=>s.auth.user?.id);const [value,setValue]=useState(row.approval_nominee?.employee_id||'');
 const options=useQuery({queryKey:['leave-requests','options',company,user],queryFn:({signal})=>service.options(signal),retry:false});
 const nominees=useQuery({queryKey:['leave-requests','nominees',company,user],queryFn:({signal})=>service.nominees(signal),enabled:options.data?.can_nominate_approver===true,retry:false});
 const change=useMutation({mutationFn:()=>service.changeNominee(row.uuid,value||null),retry:false,onSuccess:async()=>{await client.invalidateQueries({queryKey:['leave-requests','detail']});await client.invalidateQueries({queryKey:['leave-requests','approver-detail']});toast.success('Approval nominee updated');onChanged();onClose();},onError:error=>{showApiError(error);onChanged();}});
 const allowed=options.data?.can_nominate_approver===true&&row.request_unit!=='minutes'&&['draft','pending','returned','approved'].includes(row.status);
 return <Dialog open onOpenChange={v=>{if(!v&&!change.isPending)onClose();}}><DialogContent><DialogHeader><DialogTitle>Change approval nominee</DialogTitle><DialogDescription>Choose an eligible employee or remove the current nominee.</DialogDescription></DialogHeader>{options.isPending||allowed&&nominees.isPending?<AppLoader label="Loading eligible nominees…" />:options.error?<ApiErrorState error={options.error} onRetry={()=>void options.refetch()} />:!allowed?<p className="text-sm text-gray-500">Nomination is not available for this request or signed-in applicant.</p>:nominees.error?<ApiErrorState error={nominees.error} onRetry={()=>void nominees.refetch()} />:<><SearchableSelect aria-label="New approval nominee" widthClass="w-full" allLabel="No nominee" value={value} disabled={change.isPending} options={(nominees.data||[]).map(p=>({value:p.id,label:`${p.name} (${p.employee_code})`}))} onChange={setValue} /><p className="text-xs text-gray-500">Delegation applies only during approved day-leave dates. The backend rechecks authority on every decision.</p></>}<DialogFooter><Button variant="outline" disabled={change.isPending} onClick={onClose}>Cancel</Button><Button className="bg-[#1E1B4B] hover:bg-[#2A2675]" disabled={!allowed||!!nominees.error||nominees.isPending||change.isPending} onClick={()=>change.mutate()}>{change.isPending?'Saving…':'Save nominee'}</Button></DialogFooter></DialogContent></Dialog>;
}
