'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLoader } from '@/components/ui/app-loader';
import { attendancePolicyService } from '@/services/attendance-policy.service';
import type { AttendancePolicy } from '@/types/attendance-policy';
import { showApiError } from '@/lib/error-toast';

export function PolicySimulationModal({ policy, onClose }: { policy: AttendancePolicy; onClose: () => void }) {
  const [input, setInput] = useState({ shift_start_time: '09:00', shift_end_time: '18:00', punch_in: '10:25', punch_out: '18:10', break_minutes: '60' });
  const simulation = useMutation({ mutationFn: attendancePolicyService.simulate, retry: false, onError: error => showApiError(error) });
  const result = simulation.data?.result;
  return <Dialog open onOpenChange={open => { if (!open && !simulation.isPending) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Simulate attendance policy</DialogTitle><DialogDescription>{policy.policy_name} · Preview the backend calculation for a sample shift.</DialogDescription></DialogHeader><form onSubmit={event => { event.preventDefault(); simulation.mutate({ ...input, break_minutes: Number(input.break_minutes), policy_uuid: policy.id }); }} className="space-y-4"><fieldset disabled={simulation.isPending} className="grid gap-4 sm:grid-cols-2">{([{ key: 'shift_start_time', label: 'Shift start' }, { key: 'shift_end_time', label: 'Shift end' }, { key: 'punch_in', label: 'Clock-in' }, { key: 'punch_out', label: 'Clock-out' }, { key: 'break_minutes', label: 'Break (minutes)' }] as const).map(field => <div key={field.key} className="space-y-1.5"><Label htmlFor={`sim-${field.key}`}>{field.label}</Label><Input id={`sim-${field.key}`} required type={field.key === 'break_minutes' ? 'number' : 'time'} min={field.key === 'break_minutes' ? 0 : undefined} max={field.key === 'break_minutes' ? 1440 : undefined} step={field.key === 'break_minutes' ? 1 : 60} value={input[field.key]} onChange={event => { setInput(previous => ({ ...previous, [field.key]: event.target.value })); simulation.reset(); }} /></div>)}</fieldset>{result && <div aria-live="polite" className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"><p className="text-sm font-semibold capitalize text-brand-900">{result.status.replaceAll('_', ' ')}</p><dl className="grid grid-cols-3 gap-3 text-xs">{[{ label: 'Worked', value: result.work_minutes }, { label: 'Late', value: result.late_minutes }, { label: 'Early out', value: result.early_out_minutes }].map(item => <div key={item.label}><dt className="text-gray-500">{item.label}</dt><dd className="mt-1 font-semibold">{item.value} min</dd></div>)}</dl>{result.note && <p className="border-t border-gray-200 pt-3 text-xs text-gray-600">{result.note}</p>}</div>}<DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={simulation.isPending}>Close</Button><Button type="submit" disabled={simulation.isPending} className="bg-[#1E1B4B] hover:bg-[#2A2675]">{simulation.isPending ? <AppLoader variant="inline" label="Simulating…" /> : 'Run simulation'}</Button></DialogFooter></form></DialogContent></Dialog>;
}
