'use client';
import { useState, type ReactNode } from 'react';
import { Loader2, Plus, Trash2, Server } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import SearchableSelect from '@/components/ui/searchable-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ApiFieldErrors } from '@/components/api-field-errors';
import { parseApiError } from '@/lib/api-error';
import { useBranches } from '@/hooks/useBranches';
import { deviceTypeService } from '@/services/device-type.service';
import { useAttendanceDevice, useCreateAttendanceDevice, useUpdateAttendanceDevice, useDeviceScope } from '@/hooks/useAttendanceDevices';
import { deviceForm, validateDeviceForm, SYNC_PROTOCOLS, DEVICE_DRIVERS, SYSTEM_ATTRIBUTES } from '@/lib/attendance-device';
import type { AttendanceDevice, AttendanceDeviceFormData, DeviceMapping, SyncProtocol, DeviceDriver, SystemAttribute } from '@/types/attendance-device';

export const primaryButton = 'bg-[#1E1B4B] text-white hover:bg-[#2A2675]';
export function DeviceError({ error, retry }: { error: unknown; retry?: () => void }) {
  if (!error) return null;
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p>{parseApiError(error).message}</p><ApiFieldErrors error={error} />{retry && <Button type="button" variant="outline" size="sm" className="mt-2" onClick={retry}>Retry</Button>}</div>;
}
export function DeviceModal({ title, description, children, footer, onClose, busy = false, wide = false }: { title: string; description: string; children: ReactNode; footer: ReactNode; onClose: () => void; busy?: boolean; wide?: boolean }) {
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent showCloseButton={!busy} className={`flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 ${wide ? 'sm:max-w-4xl' : 'sm:max-w-2xl'}`}>
    <DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-14 text-left"><div className="flex items-center gap-3"><div className="rounded-lg bg-indigo-50 p-2 text-[#1E1B4B]"><Server className="h-5 w-5" /></div><div><DialogTitle className="text-lg">{title}</DialogTitle><DialogDescription className="mt-1">{description}</DialogDescription></div></div></DialogHeader>
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">{children}</div>
    <DialogFooter className="border-t bg-muted/30 px-6 py-4">{footer}</DialogFooter>
  </DialogContent></Dialog>;
}
export function DeviceFormModal({ uuid, onClose }: { uuid?: string; onClose: () => void }) {
  const query = useAttendanceDevice(uuid ?? null);
  if (!uuid) return <DeviceFormEditor onClose={onClose} />;
  if (query.isPending || query.isError) return <DeviceModal title="Edit device" description="Load the latest saved configuration." onClose={onClose} footer={<Button variant="outline" onClick={onClose}>Close</Button>}>{query.isPending ? <p role="status" className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading device…</p> : <DeviceError error={query.error} retry={() => void query.refetch()} />}</DeviceModal>;
  return <DeviceFormEditor key={uuid} device={query.data} onClose={onClose} />;
}
function DeviceFormEditor({ device, onClose }: { device?: AttendanceDevice; onClose: () => void }) {
  const [form, setForm] = useState(() => deviceForm(device));
  const [validation, setValidation] = useState<string | null>(null);
  const [mappingsChanged, setMappingsChanged] = useState(false);
  const create = useCreateAttendanceDevice();
  const update = useUpdateAttendanceDevice();
  const busy = create.isPending || update.isPending;
  const scope = useDeviceScope();
  const branches = useBranches({ per_page: 1000 });
  // Device types retain pagination so all available choices can be selected.
  const types = useQuery({ queryKey: ['attendance-device-type-options', ...scope], queryFn: async () => {
    const rows = []; let page = 1;
    while (true) { const result = await deviceTypeService.getAll({ page, per_page: 100 }); rows.push(...result.data.data); if (page >= result.data.meta.last_page) break; page++; }
    return rows;
  } });
  const branchOptions = (branches.data?.data?.data ?? []).map(branch => ({ value: branch.id, label: branch.name }));
  const typeOptions = (types.data ?? []).map(type => ({ value: type.uuid || type.id, label: type.name }));
  if (device?.branch_id && !branchOptions.some(option => option.value === device.branch_id)) branchOptions.push({ value: device.branch_id, label: device.branch?.name || 'Current branch' });
  if (device?.device_type_id && !typeOptions.some(option => option.value === device.device_type_id)) typeOptions.push({ value: device.device_type_id, label: device.device_type?.name || 'Current device type' });
  function set<K extends keyof AttendanceDeviceFormData>(key: K, value: AttendanceDeviceFormData[K]) { setForm(previous => ({ ...previous, [key]: value })); }
  function mapping(index: number, patch: Partial<DeviceMapping>) { setMappingsChanged(true); set('mappings', form.mappings.map((item, i) => i === index ? { ...item, ...patch } : item)); }
  function save() {
    const error = validateDeviceForm(form); setValidation(error); if (error || busy) return;
    if (device) update.mutate({ uuid: device.id, data: form, includeMappings: mappingsChanged }, { onSuccess: onClose });
    else create.mutate(form, { onSuccess: onClose });
  }
  function field(key: keyof AttendanceDeviceFormData, label: string, options: { maxLength?: number; type?: string; min?: number; max?: number; placeholder?: string; hint?: string; required?: boolean } = {}) {
    const { hint, ...props } = options;
    return <div className="space-y-1.5"><Label htmlFor={`device-${key}`}>{label}{options.required ? ' *' : ''}</Label><Input id={`device-${key}`} {...props} step={options.type === 'number' ? 1 : undefined} autoComplete={options.type === 'password' ? 'new-password' : 'off'} value={String(form[key])} onChange={event => set(key, event.target.value as AttendanceDeviceFormData[typeof key])} />{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>;
  }
  return <DeviceModal wide title={device ? 'Edit attendance device' : 'Create attendance device'} description={device ? device.friendly_name : 'Configure a device, its connection and punch mappings.'} onClose={onClose} busy={busy} footer={<><Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button className={primaryButton} disabled={busy} type="submit" form="attendance-device-form">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{busy ? 'Saving…' : device ? 'Save changes' : 'Create device'}</Button></>}>
    {validation && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{validation}</p>}
    <DeviceError error={create.error || update.error} />
    <form id="attendance-device-form" onSubmit={event => { event.preventDefault(); save(); }}><fieldset disabled={busy} className="space-y-6">
      <section className="space-y-4"><h3 className="border-b pb-2 text-sm font-semibold text-[#1E1B4B]">Device information</h3><div className="grid gap-4 sm:grid-cols-2">
        {field('friendly_name', 'Friendly name', { required: true, maxLength: 150 })}{field('hardware_device_id', 'Hardware device ID', { required: true, maxLength: 100 })}
        {field('device_name', 'Device name', { maxLength: 100 })}{field('model_make', 'Model / make', { maxLength: 100 })}{field('serial_number', 'Serial number', { maxLength: 100 })}
        <div className="space-y-1.5"><Label htmlFor="device-type">Device type</Label><SearchableSelect id="device-type" aria-label="Device type" options={typeOptions} value={form.device_type_id} onChange={value => set('device_type_id', value)} allLabel="None" widthClass="w-full" isLoading={types.isPending} disabled={busy} /><DeviceError error={types.error} retry={() => void types.refetch()} /></div>
        <div className="space-y-1.5"><Label htmlFor="device-branch">Branch</Label><SearchableSelect id="device-branch" aria-label="Branch" options={branchOptions} value={form.branch_id} onChange={value => set('branch_id', value)} allLabel="None" widthClass="w-full" isLoading={branches.isPending} disabled={busy} /><DeviceError error={branches.error} retry={() => void branches.refetch()} /></div>
        {field('internal_location_name', 'Internal location', { maxLength: 150 })}
      </div></section>
      <section className="space-y-4"><h3 className="border-b pb-2 text-sm font-semibold text-[#1E1B4B]">Connection and synchronization</h3><div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="device-protocol">Sync protocol *</Label><SearchableSelect id="device-protocol" aria-label="Sync protocol" allowAll={false} options={SYNC_PROTOCOLS} value={form.sync_protocol} onChange={value => set('sync_protocol', value as SyncProtocol)} widthClass="w-full" disabled={busy} /></div>
        <div className="space-y-1.5"><Label htmlFor="device-driver">Device driver *</Label><SearchableSelect id="device-driver" aria-label="Device driver" allowAll={false} options={DEVICE_DRIVERS} value={form.device_driver} onChange={value => set('device_driver', value as DeviceDriver)} widthClass="w-full" disabled={busy} /></div>
        {field('ip_address', 'IP address', { placeholder: 'e.g. 192.168.1.10' })}{field('port', 'Port', { type: 'number', min: 1, max: 65535 })}
        {field('sync_frequency_minutes', 'Sync frequency in minutes', { type: 'number', min: 1, max: 1440 })}{field('deduplication_window_minutes', 'Deduplication window in minutes', { type: 'number', min: 1, max: 120 })}
      </div><div className="space-y-1.5"><Label htmlFor="device-whitelist">IP whitelist</Label><Textarea id="device-whitelist" maxLength={5000} value={form.ip_whitelist} onChange={event => set('ip_whitelist', event.target.value)} /></div></section>
      {form.device_driver === 'db_direct' && <section className="space-y-4 rounded-lg border border-indigo-100 bg-indigo-50/30 p-4"><div><h3 className="text-sm font-semibold text-[#1E1B4B]">Database connection</h3><p className="mt-1 text-xs text-muted-foreground">Connect to the device&apos;s remote punch database. Saved passwords are never returned.</p></div><div className="grid gap-4 sm:grid-cols-2">
        {field('db_host', 'Database host', { maxLength: 45, hint: 'Optional; leave blank to use the server default.' })}{field('db_port', 'Database port', { type: 'number', min: 1, max: 65535 })}
        {field('db_name', 'Database name', { maxLength: 100 })}{field('db_username', 'Database username', { maxLength: 100 })}
        {field('db_password', device?.db_password_set ? 'Replace saved password' : 'Database password', { type: 'password', maxLength: 255, hint: device ? 'Leave blank to keep the stored password.' : 'The password is stored securely by the backend.' })}
        {field('sync_cursor', 'Sync cursor', { type: 'number', min: 0, hint: 'Changing this affects which remote rows are fetched next.' })}
      </div></section>}
      <section className="flex flex-wrap gap-5">{([['is_active', 'Active device'], ['sync_enabled', 'Sync enabled'], ['auto_retry_on_failure', 'Auto retry on failure']] as const).map(([key, label]) => <label key={key} className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={form[key]} onCheckedChange={value => set(key, value === true)} disabled={busy} />{label}</label>)}</section>
      <section className="space-y-3"><div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-[#1E1B4B]">Punch field mappings</h3><p className="mt-1 text-xs text-muted-foreground">Map device fields to attendance attributes. Saving changes replaces all mappings.</p></div><Button type="button" variant="outline" size="sm" onClick={() => { setMappingsChanged(true); set('mappings', [...form.mappings, { system_attribute: 'employee_id', device_key: '', is_required: false, default_value: null, notes: null }]); }}><Plus className="mr-2 h-4 w-4" />Add mapping</Button></div>
        {!form.mappings.length && <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">No field mappings configured.</p>}
        {form.mappings.map((item, index) => <div key={index} className="space-y-3 rounded-lg border p-4"><div className="flex items-center justify-between"><p className="text-sm font-medium">Mapping {index + 1}</p><Button type="button" variant="ghost" size="icon" aria-label={`Remove mapping ${index + 1}`} onClick={() => { setMappingsChanged(true); set('mappings', form.mappings.filter((_, i) => i !== index)); }}><Trash2 className="h-4 w-4 text-red-600" /></Button></div><div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label htmlFor={`mapping-attribute-${index}`}>System attribute *</Label><SearchableSelect id={`mapping-attribute-${index}`} aria-label={`Mapping ${index + 1} system attribute`} allowAll={false} options={SYSTEM_ATTRIBUTES} value={item.system_attribute} onChange={value => mapping(index, { system_attribute: value as SystemAttribute })} widthClass="w-full" disabled={busy} /></div>
          <div className="space-y-1"><Label htmlFor={`mapping-key-${index}`}>Device key *</Label><Input id={`mapping-key-${index}`} maxLength={100} value={item.device_key} onChange={event => mapping(index, { device_key: event.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor={`mapping-default-${index}`}>Default value</Label><Input id={`mapping-default-${index}`} maxLength={100} value={item.default_value ?? ''} onChange={event => mapping(index, { default_value: event.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor={`mapping-notes-${index}`}>Notes</Label><Input id={`mapping-notes-${index}`} maxLength={255} value={item.notes ?? ''} onChange={event => mapping(index, { notes: event.target.value })} /></div>
        </div><label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={item.is_required} onCheckedChange={value => mapping(index, { is_required: value === true })} disabled={busy} />Required field</label></div>)}
      </section>
    </fieldset></form>
  </DeviceModal>;
}
