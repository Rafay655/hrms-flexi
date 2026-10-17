'use client';
import { useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { attendanceDeviceService } from '@/services/attendance-device.service';
import { attendanceDeviceKeys, useAttendanceDevice } from '@/hooks/useAttendanceDevices';
import { deviceDate, syncUnavailableReason } from '@/lib/attendance-device';
import type { DeviceOperationResult } from '@/types/attendance-device';
import { DeviceError, DeviceModal, primaryButton } from './device-form-modal';
export type DeviceAction = 'test' | 'sync' | 'rotate-key' | 'delete';
export function DeviceBadge({ active, children }: { active: boolean; children: ReactNode }) {
  return <Badge variant="outline" className={active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-100 text-gray-600'}>{children}</Badge>;
}
function Values({ rows }: { rows: [string, ReactNode][] }) {
  return <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-gray-900">{value ?? '—'}</dd></div>)}</dl>;
}
export function DeviceDetailModal({ uuid, onClose, onEdit }: { uuid: string; onClose: () => void; onEdit: () => void }) {
  const query = useAttendanceDevice(uuid);
  const device = query.data;
  return <DeviceModal wide title="Device details" description={device?.friendly_name ?? 'Current attendance device configuration.'} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Close</Button><Button className={primaryButton} disabled={!device || query.isError} onClick={onEdit}>Edit device</Button></>}>
    {query.isPending ? <p role="status">Loading device…</p> : query.isError ? <DeviceError error={query.error} retry={() => void query.refetch()} /> : device && <>
      <div className="flex flex-wrap gap-2"><DeviceBadge active={device.is_active}>{device.is_active ? 'Active' : 'Inactive'}</DeviceBadge><DeviceBadge active={device.sync_enabled}>Sync {device.sync_enabled ? 'enabled' : 'disabled'}</DeviceBadge></div>
      <section className="space-y-4"><h3 className="border-b pb-2 text-sm font-semibold text-[#1E1B4B]">Device information</h3><Values rows={[
        ['Friendly name', device.friendly_name], ['Hardware device ID', device.hardware_device_id], ['Device name', device.device_name], ['Device type', device.device_type?.name],
        ['Model / make', device.model_make], ['Serial number', device.serial_number], ['Branch', device.branch?.name], ['Internal location', device.internal_location_name], ['Device UUID', device.id],
      ]} /></section>
      <section className="space-y-4"><h3 className="border-b pb-2 text-sm font-semibold text-[#1E1B4B]">Connection and synchronization</h3><Values rows={[
        ['Sync protocol', device.sync_protocol], ['Device driver', device.device_driver], ['IP address', device.ip_address], ['Port', device.port], ['Webhook endpoint', device.webhook_endpoint],
        ['Frequency in minutes', device.sync_frequency_minutes], ['Deduplication window in minutes', device.deduplication_window_minutes], ['IP whitelist', device.ip_whitelist],
        ['Auto retry', device.auto_retry_on_failure ? 'Enabled' : 'Disabled'], ['API key', device.api_key_available ? 'Available' : 'Not available'],
        ['Last synced', deviceDate(device.last_synced_at)], ['Last sync count', device.last_sync_count ?? '—'],
      ]} /></section>
      {device.device_driver === 'db_direct' && <section className="space-y-4"><h3 className="border-b pb-2 text-sm font-semibold text-[#1E1B4B]">Database connection</h3><Values rows={[
        ['Database host', device.db_host], ['Database port', device.db_port], ['Database name', device.db_name], ['Database username', device.db_username], ['Password', device.db_password_set ? 'Stored securely' : 'Not set'], ['Sync cursor', device.sync_cursor],
      ]} /></section>}
      <section className="space-y-3"><h3 className="border-b pb-2 text-sm font-semibold text-[#1E1B4B]">Punch field mappings</h3>{!device.mappings.length ? <p className="text-sm text-muted-foreground">No field mappings configured.</p> : device.mappings.map((mapping, index) => <div key={index} className="rounded-lg border p-3"><p className="text-sm font-medium">{mapping.system_attribute} ← {mapping.device_key}</p><p className="mt-1 text-xs text-muted-foreground">{mapping.is_required ? 'Required' : 'Optional'} · Default: {mapping.default_value ?? '—'}</p>{mapping.notes && <p className="mt-1 text-xs text-muted-foreground">{mapping.notes}</p>}</div>)}</section>
      <Values rows={[["Created", deviceDate(device.created_at)], ["Updated", deviceDate(device.updated_at)]]} />
    </>}
  </DeviceModal>;
}
const actionInfo = {
  test: { title: 'Test device connection', button: 'Test connection', description: 'Run a read-only connectivity probe against the saved configuration. No punches will be imported.' },
  sync: { title: 'Sync attendance device', button: 'Sync now', description: 'Fetch new punches using the saved configuration and cursor. This updates attendance data and the sync cursor.' },
  'rotate-key': { title: 'Rotate device API key', button: 'Rotate API key', description: 'Replace the current key. Update any integration using the previous key. The new key is shown only once.' },
  delete: { title: 'Delete attendance device', button: 'Delete device', description: 'Delete this device configuration. This action cannot be undone.' },
} as const;
// Operational drivers have different result fields. Keep them readable without caching secrets.
function safeResult(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(safeResult);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, field]) => [key, /password|secret|token|api_key|connection_string/i.test(key) ? '[hidden]' : safeResult(field)]));
  return value;
}
export function DeviceActionModal({ uuid, action, onClose }: { uuid: string; action: DeviceAction; onClose: () => void }) {
  const query = useAttendanceDevice(uuid);
  const client = useQueryClient();
  const [copied, setCopied] = useState(false);
  const info = actionInfo[action];
  const operation = useMutation({
    mutationFn: async (): Promise<{ message: string; data?: DeviceOperationResult; one_time_api_key?: string }> => {
      if (action === 'delete') { await attendanceDeviceService.delete(uuid); return { message: 'Device deleted successfully.' }; }
      if (action === 'rotate-key') {
        const result = await attendanceDeviceService.rotateKey(uuid);
        return { message: result.message, one_time_api_key: result.one_time_api_key };
      }
      return action === 'test' ? attendanceDeviceService.test(uuid) : attendanceDeviceService.sync(uuid);
    },
    retry: false,
    gcTime: 0,
    onSuccess: () => { if (action !== 'test') void client.invalidateQueries({ queryKey: attendanceDeviceKeys.all }); },
  });
  const busy = operation.isPending;
  const result = operation.data;
  const syncReason = action === 'sync' && query.data ? syncUnavailableReason(query.data) : '';
  async function copyKey() {
    if (!result?.one_time_api_key) return;
    try { await navigator.clipboard.writeText(result.one_time_api_key); setCopied(true); } catch { toast.error('Could not copy. Select the key and copy it manually.'); }
  }
  return <DeviceModal title={info.title} description={query.data?.friendly_name ?? 'Attendance device action'} onClose={onClose} busy={busy} footer={result ? <Button className={primaryButton} onClick={onClose}>Done</Button> : <><Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button className={action === 'delete' ? 'bg-red-600 text-white hover:bg-red-700' : primaryButton} disabled={busy || !query.data || query.isError || Boolean(syncReason)} onClick={() => { if (!busy) operation.mutate(); }}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{busy ? 'Please wait…' : info.button}</Button></>}>
    {query.isPending && <p role="status">Loading saved device…</p>}<DeviceError error={query.error} retry={() => void query.refetch()} />
    {!result && <p className="text-sm text-muted-foreground">{info.description}</p>}
    {syncReason && !result && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{syncReason}</p>}
    <DeviceError error={operation.error} />
    {busy && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />{action === 'sync' ? 'Importing attendance punches…' : 'Processing device request…'}</p>}
    {result && <div className="space-y-4" role="status"><div className={`rounded-lg border p-4 text-sm ${action === 'test' && result.data?.connected === false ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{result.message}</div>
      {action === 'rotate-key' && <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4" />Save the new API key now</p><p className="text-xs text-muted-foreground">It will not be available after closing this dialog.</p>{result.one_time_api_key ? <><Input aria-label="New one-time API key" value={result.one_time_api_key} readOnly className="font-mono text-xs" onFocus={event => event.target.select()} /><Button variant="outline" onClick={() => void copyKey()}><Copy className="mr-2 h-4 w-4" />{copied ? 'Copied' : 'Copy key'}</Button></> : <p className="text-sm text-red-700">The server did not return the new key. Contact your backend engineer before updating the integration.</p>}</div>}
      {result.data && <div><p className="mb-2 text-sm font-medium">{action === 'test' ? 'Connection probe results' : 'Sync results'}</p><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-4 text-xs">{JSON.stringify(safeResult(result.data), null, 2)}</pre></div>}
    </div>}
  </DeviceModal>;
}
