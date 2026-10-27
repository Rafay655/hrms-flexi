'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import { myRegularizationsService, correctionOptions, type RegularizationPayload } from '@/services/my-regularizations.service';
import { employeeService } from '@/services/employee.service';
import { exceptionLabel, regularizationTypeForException } from '@/lib/attendance-exception';
import { showApiError } from '@/lib/error-toast';
import type { AttendanceException } from '@/types/attendance-exception';

const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function ExceptionRegularizationModal({ exception, company, timeZone, onClose }: { exception: AttendanceException; company?: string; timeZone: string; onClose: () => void }) {
  const [type, setType] = useState(() => regularizationTypeForException(exception.type) ?? 'full_replacement');
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [reason, setReason] = useState('');
  const [documentPath, setDocumentPath] = useState('');
  const [error, setError] = useState('');
  const client = useQueryClient();
  const date = exception.date.slice(0, 10);
  const directId = [exception.employee.uuid, exception.employee.id, exception.employee_id].find(uuid);
  // The self-service attendance-day endpoint does not identify a target employee.
  // Resolve the exception's employee instead of displaying the signed-in user's punches.
  const employees = useQuery({ queryKey: ['exception-regularization-employees', company], queryFn: ({ signal }) => employeeService.getAllForBatches(signal), enabled: !directId, retry: false });
  const employee = employees.data?.find(item => item.employee_code === exception.employee.employee_code);
  const employeeId = directId ?? (uuid(employee?.uuid) ? employee.uuid : undefined);
  const needsIn = ['add_in', 'modify_in', 'full_replacement'].includes(type);
  const needsOut = ['add_out', 'modify_out', 'full_replacement'].includes(type);
  const save = useMutation({ mutationFn: myRegularizationsService.save, retry: false, onError: failure => showApiError(failure), onSuccess: response => {
    toast.success(response.message || 'Regularization request submitted');
    void client.invalidateQueries({ queryKey: ['time-sync', 'regularizations'] });
    void client.invalidateQueries({ queryKey: ['attendance-exceptions'] });
    onClose();
  } });
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (save.isPending) return;
    if (!employeeId) { setError('The employee profile could not be identified. Please refresh and try again.'); return; }
    if (!reason.trim()) { setError('Enter a reason for the correction.'); return; }
    const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
    if ((needsIn && !validTime(clockIn)) || (needsOut && !validTime(clockOut))) { setError('Enter the requested punch times.'); return; }
    if (needsIn && needsOut && clockOut < clockIn) { setError('Clock-out must be on or after clock-in for this attendance date.'); return; }
    const payload: RegularizationPayload = { employee_id: employeeId, attendance_date: date, correction_type: type, requested_in: needsIn ? `${date} ${clockIn}:00` : null, requested_out: needsOut ? `${date} ${clockOut}:00` : null, reason: reason.trim(), supporting_doc_path: documentPath.trim() || null };
    save.mutate({ payload });
  }
  return <Dialog open onOpenChange={open => { if (!open && !save.isPending) onClose(); }}><DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"><DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-14 text-left"><DialogTitle>Request regularization</DialogTitle><DialogDescription>Request an attendance correction for this exception.</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate><fieldset disabled={save.isPending} className="min-h-0 space-y-4 overflow-y-auto px-6 py-5">
      <div className="rounded-lg border bg-brand-100/60 p-4"><p className="text-sm font-semibold text-brand-900">{exception.employee.name}</p><p className="mt-1 text-xs text-muted-foreground">{exception.employee.employee_code} · {date}</p><p className="mt-2 text-xs text-brand-700">{exceptionLabel(exception.type)} · {exception.exception_code || exception.id}</p></div>
      {!directId && employees.isPending && <AppLoader variant="inline" label="Loading employee profile…" />}
      {employees.isError && !directId && <ApiErrorState error={employees.error} onRetry={() => void employees.refetch()} />}
      {!employeeId && !employees.isPending && !employees.isError && <p role="alert" className="text-sm text-red-600">Employee profile unavailable. A request cannot be submitted for this employee.</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="space-y-1.5"><Label htmlFor="exception-correction">Correction type *</Label><select id="exception-correction" className="h-9 w-full rounded-md border bg-white px-3 text-sm" value={type} onChange={event => { setType(event.target.value); setError(''); }}>{correctionOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      <div className="grid gap-4 sm:grid-cols-2">{needsIn && <div className="min-w-0 space-y-1.5"><Label htmlFor="exception-clock-in">Requested clock-in *</Label><Input id="exception-clock-in" type="time" required value={clockIn} onChange={event => { setClockIn(event.target.value); setError(''); }} /></div>}{needsOut && <div className="min-w-0 space-y-1.5"><Label htmlFor="exception-clock-out">Requested clock-out *</Label><Input id="exception-clock-out" type="time" required value={clockOut} onChange={event => { setClockOut(event.target.value); setError(''); }} /></div>}</div>
      <p className="text-xs text-muted-foreground">Times use {timeZone} and the attendance date shown above.</p>
      <div className="space-y-1.5"><Label htmlFor="exception-reason">Reason *</Label><Textarea id="exception-reason" required maxLength={2000} rows={3} placeholder="Explain why the attendance record needs correction…" value={reason} onChange={event => { setReason(event.target.value); setError(''); }} /></div>
      <div className="space-y-1.5"><Label htmlFor="exception-document">Supporting document path (optional)</Label><Input id="exception-document" maxLength={500} placeholder="Path of an already uploaded document" value={documentPath} onChange={event => setDocumentPath(event.target.value)} /></div>
      <p className="text-xs text-muted-foreground">Submitting creates a regularization request for review. It does not resolve this exception.</p>
    </fieldset><DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4"><Button type="button" variant="outline" disabled={save.isPending} onClick={onClose}>Cancel</Button><Button type="submit" disabled={save.isPending || !employeeId} className="bg-brand-900 hover:bg-brand-800">{save.isPending ? <AppLoader variant="inline" label="Submitting…" /> : 'Submit request'}</Button></DialogFooter></form>
  </DialogContent></Dialog>;
}
