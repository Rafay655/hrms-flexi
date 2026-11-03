'use client';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { leaveRequestService as service } from '@/services/leave-request.service';
import type { AttendanceReconciliation, LeaveRequest } from '@/types/leave-request';
import { createLeaveCommandKeys } from '@/lib/leave-requests';
import { showApiError } from '@/lib/error-toast';
export function AttendanceEffect({row,canOperate,onChanged}:{row:LeaveRequest;canOperate:boolean;onChanged:()=>void}){
 const effect=row.attendance_reconciliation;const [open,setOpen]=useState(false);const [reason,setReason]=useState('');const [keys]=useState(createLeaveCommandKeys);
 const retry=useMutation({mutationFn:()=>service.retryAttendance(row.uuid,effect!.effect_id,reason.trim(),keys.get('attendance-retry',{uuid:row.uuid,effect_id:effect!.effect_id,reason:reason.trim()})),retry:false,onSuccess:response=>{keys.reset();toast.success(response.message||'Attendance retry requested');setOpen(false);onChanged();},onError:error=>{showApiError(error);onChanged();}});
 if(!effect)return null;const message=typeof effect.error==='string'?effect.error:effect.error?.message;
 return <section className="space-y-2 rounded-lg border border-gray-200 p-4"><h3 className="text-sm font-semibold">Attendance effect</h3><p className="text-sm capitalize">{effect.status.replaceAll('_',' ')}</p><p className="text-xs text-gray-500">Source approval and attendance processing are separate.</p>{message&&<p className="text-xs text-rose-600">{message}</p>}<p className="break-all text-xs text-gray-400">Effect: {effect.effect_id}</p>{canOperate&&effect.can_retry&&<Button variant="outline" size="sm" onClick={()=>setOpen(true)}>Retry attendance effect</Button>}<Dialog open={open} onOpenChange={v=>{if(!retry.isPending)setOpen(v);}}><DialogContent><DialogHeader><DialogTitle>Retry attendance effect</DialogTitle><DialogDescription>This retries attendance processing, not approval or balance deduction.</DialogDescription></DialogHeader><Label htmlFor="effect-retry-reason">Reason *</Label><Input id="effect-retry-reason" value={reason} maxLength={1000} onChange={e=>setReason(e.target.value)} /><DialogFooter><Button variant="outline" disabled={retry.isPending} onClick={()=>setOpen(false)}>Cancel</Button><Button disabled={retry.isPending||reason.trim().length<5} onClick={()=>retry.mutate()}>{retry.isPending?'Requesting…':'Retry effect'}</Button></DialogFooter></DialogContent></Dialog></section>;
}
export const effectInProgress=(effect?:AttendanceReconciliation|null)=>effect?.status==='pending'||effect?.status==='processing';
