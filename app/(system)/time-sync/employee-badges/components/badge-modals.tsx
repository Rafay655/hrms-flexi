'use client';
import { useRef, useState, type ReactNode } from 'react';
import { IdCard, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ApiFieldErrors } from '@/components/api-field-errors';
import { parseApiError } from '@/lib/api-error';
import { badgeAssignments, MAX_BADGE_ASSIGNMENTS, validateBadge } from '@/lib/employee-badges';
import { useEmployees } from '@/hooks/useEmployees';
import { useBadgeMutations } from '@/hooks/use-employee-badges';
import type { BadgeAssignment, BadgeAssignmentRow, EmployeeBadge } from '@/types/employee-badge';
export const badgeButton = 'bg-[#1E1B4B] text-white hover:bg-[#2A2675]';
export function BadgeError({ error, retry }: { error: unknown; retry?: () => void }) {
  if (!error) return null;
  return <div role="alert" className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p>{parseApiError(error).message}</p><ApiFieldErrors error={error} />{retry && <Button type="button" variant="outline" size="sm" onClick={retry}>Retry</Button>}</div>;
}
function BadgeModal({ title, description, children, footer, busy, onClose, wide }: { title: string; description: string; children: ReactNode; footer: ReactNode; busy: boolean; onClose: () => void; wide?: boolean }) {
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent showCloseButton={!busy} className={`flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 ${wide ? 'sm:max-w-4xl' : 'sm:max-w-xl'}`}>
    <DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-14 text-left"><div className="flex items-center gap-3"><div className="rounded-lg bg-indigo-50 p-2 text-[#1E1B4B]"><IdCard className="h-5 w-5" /></div><div><DialogTitle className="text-lg">{title}</DialogTitle><DialogDescription className="mt-1">{description}</DialogDescription></div></div></DialogHeader>
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">{children}</div><DialogFooter className="border-t bg-muted/30 px-6 py-4">{footer}</DialogFooter>
  </DialogContent></Dialog>;
}
export function EditBadgeModal({ employee, onClose }: { employee: EmployeeBadge; onClose: () => void }) {
  const [badge, setBadge] = useState(employee.device_badge_id ?? '');
  const [validation, setValidation] = useState<string | null>(null);
  const { assign } = useBadgeMutations();
  function save() {
    const error = validateBadge(badge); setValidation(error); if (error || assign.isPending) return;
    assign.mutate({ uuid: employee.id, badge }, { onSuccess: response => { toast.success(response.message || 'Badge saved.'); onClose(); } });
  }
  return <BadgeModal title={employee.has_device_badge ? 'Edit employee badge' : 'Assign employee badge'} description={`${employee.full_name} · ${employee.employee_code}`} busy={assign.isPending} onClose={onClose} footer={<><Button variant="outline" disabled={assign.isPending} onClick={onClose}>Cancel</Button><Button className={badgeButton} disabled={assign.isPending} type="submit" form="single-badge-form">{assign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{assign.isPending ? 'Saving…' : 'Save badge'}</Button></>}>
    <BadgeError error={assign.error} />{validation && <p role="alert" className="text-sm text-red-700">{validation}</p>}
    <form id="single-badge-form" onSubmit={event => { event.preventDefault(); save(); }} className="space-y-2"><Label htmlFor="employee-device-badge">Device badge ID</Label><Input id="employee-device-badge" type="text" value={badge} onChange={event => setBadge(event.target.value)} maxLength={50} disabled={assign.isPending} autoComplete="off" placeholder="e.g. 0042 or A10361" /><p className="text-xs text-muted-foreground">Use the exact badge enrolled on the device. Leading zeros are preserved. To clear a badge, use Remove badge.</p></form>
  </BadgeModal>;
}
export function RemoveBadgeModal({ employee, onClose }: { employee: EmployeeBadge; onClose: () => void }) {
  const { remove } = useBadgeMutations();
  return <BadgeModal title="Remove employee badge" description={`${employee.full_name} · ${employee.employee_code}`} busy={remove.isPending} onClose={onClose} footer={<><Button variant="outline" disabled={remove.isPending} onClick={onClose}>Cancel</Button><Button className="bg-red-600 text-white hover:bg-red-700" disabled={remove.isPending} onClick={() => { if (!remove.isPending) remove.mutate(employee.id, { onSuccess: response => { toast.success(response?.message || 'Badge removed.'); onClose(); } }); }}>{remove.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{remove.isPending ? 'Removing…' : 'Remove badge'}</Button></>}>
    <p className="text-sm">Remove badge <strong className="font-mono">{employee.device_badge_id}</strong> from this employee?</p><p className="text-sm text-muted-foreground">This removes the badge mapping, not the employee record.</p><BadgeError error={remove.error} />
  </BadgeModal>;
}
export function BulkBadgeModal({ onClose }: { onClose: () => void }) {
  const employees = useEmployees({ per_page: 1000, detailed: 0 });
  const options = (employees.data ?? []).map(employee => ({ value: employee.employee_code, label: `${employee.name} · ${employee.employee_code}` }));
  const nextKey = useRef(1);
  const [rows, setRows] = useState<BadgeAssignmentRow[]>([{ key: '0', employee_code: '', mode: 'assign', badge: '' }]);
  const [preview, setPreview] = useState<BadgeAssignment[] | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const { bulk } = useBadgeMutations();
  const busy = bulk.isPending;
  function patch(key: string, value: Partial<BadgeAssignmentRow>) { setRows(previous => previous.map(row => row.key === key ? { ...row, ...value } : row)); setValidation(null); }
  function review() {
    try { setPreview(badgeAssignments(rows)); setValidation(null); bulk.reset(); }
    catch (error) { setValidation(error instanceof Error ? error.message : 'Check the assignments.'); }
  }
  function save() {
    if (!preview || busy) return;
    bulk.mutate(preview, { onSuccess: response => { toast.success(response.message || 'Badge assignments saved.'); onClose(); } });
  }
  return <BadgeModal wide title="Assign employee badges" description="Assign or remove badges for one or more employees in a single batch." busy={busy} onClose={onClose} footer={<><Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>{preview ? <><Button variant="outline" disabled={busy} onClick={() => setPreview(null)}>Back to editing</Button><Button className={badgeButton} disabled={busy} onClick={save}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{busy ? 'Applying…' : `Apply ${preview.length} ${preview.length === 1 ? 'change' : 'changes'}`}</Button></> : <Button className={badgeButton} disabled={!rows.length || employees.isPending || employees.isError} onClick={review}>Review assignments</Button>}</>}>
    <BadgeError error={bulk.error} />{validation && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{validation}</p>}
    {preview ? <div className="space-y-4"><p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm">Review {preview.length} changes before applying. {preview.filter(row => row.device_badge_id === null).length} will remove an existing badge mapping. The backend validates the complete batch before saving.</p><div className="overflow-hidden rounded-lg border"><table className="w-full table-fixed break-words text-sm"><thead className="bg-gray-50 text-left"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Badge ID</th></tr></thead><tbody className="divide-y">{preview.map(row => <tr key={row.employee_code}><td className="px-4 py-3">{options.find(option => option.value === row.employee_code)?.label ?? row.employee_code}</td><td className="px-4 py-3">{row.device_badge_id === null ? 'Remove badge' : 'Assign badge'}</td><td className="px-4 py-3 font-mono">{row.device_badge_id ?? '—'}</td></tr>)}</tbody></table></div></div> : <>
      <p className="text-xs text-muted-foreground">Select employees from the directory and enter badge IDs exactly as enrolled on the machine. Each request supports up to 1000 employees.</p><BadgeError error={employees.error} retry={() => void employees.refetch()} />
      {rows.map((row, index) => <div key={row.key} className="space-y-3 rounded-lg border p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Assignment {index + 1}</p><Button type="button" variant="ghost" size="icon" aria-label={`Remove assignment ${index + 1}`} onClick={() => setRows(previous => previous.filter(item => item.key !== row.key))}><Trash2 className="h-4 w-4 text-red-600" /></Button></div><div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
        <div className="min-w-0 space-y-1.5"><Label htmlFor={`badge-employee-${row.key}`}>Employee</Label><SearchableSelect id={`badge-employee-${row.key}`} aria-label={`Assignment ${index + 1} employee`} allowAll={false} widthClass="w-full" options={options} isLoading={employees.isPending} value={row.employee_code} onChange={value => patch(row.key, { employee_code: value })} placeholder="Select employee" searchPlaceholder="Search name or employee code…" /></div>
        <div className="space-y-1.5"><Label htmlFor={`badge-mode-${row.key}`}>Action</Label><SearchableSelect id={`badge-mode-${row.key}`} aria-label={`Assignment ${index + 1} action`} allowAll={false} widthClass="w-full" value={row.mode} options={[{ value: 'assign', label: 'Assign badge' }, { value: 'remove', label: 'Remove badge' }]} onChange={value => patch(row.key, { mode: value as 'assign' | 'remove' })} /></div>
        <div className="space-y-1.5"><Label htmlFor={`badge-value-${row.key}`}>Badge ID</Label><Input id={`badge-value-${row.key}`} aria-label={`Assignment ${index + 1} badge ID`} type="text" autoComplete="off" maxLength={50} value={row.badge} disabled={row.mode === 'remove'} placeholder={row.mode === 'remove' ? 'Mapping will be removed' : 'e.g. 0042'} onChange={event => patch(row.key, { badge: event.target.value })} /></div>
      </div></div>)}
      <Button type="button" variant="outline" disabled={rows.length >= MAX_BADGE_ASSIGNMENTS} onClick={() => setRows(previous => [...previous, { key: String(nextKey.current++), employee_code: '', mode: 'assign', badge: '' }])}><Plus className="mr-2 h-4 w-4" />Add employee</Button><span className="ml-3 text-xs text-muted-foreground">{rows.length} / 1000 rows</span>
    </>}
  </BadgeModal>;
}
