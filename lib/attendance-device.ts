import type { AttendanceDevice, AttendanceDeviceFormData, DeviceDriver, SyncProtocol, SystemAttribute } from '@/types/attendance-device';

export const SYNC_PROTOCOLS: { value: SyncProtocol; label: string }[] = [
  { value: 'push_api', label: 'Push API' }, { value: 'pull_api', label: 'Pull API' }, { value: 'db_api', label: 'DB API' },
];
export const DEVICE_DRIVERS: { value: DeviceDriver; label: string }[] = [
  { value: 'zkteco_sdk', label: 'ZKTeco SDK' }, { value: 'rest_api', label: 'REST API' },
  { value: 'csv_import', label: 'CSV Import' }, { value: 'db_direct', label: 'DB Direct' }, { value: 'generic_webhook', label: 'Generic Webhook' },
];
export const SYSTEM_ATTRIBUTES: { value: SystemAttribute; label: string }[] = [
  { value: 'employee_id', label: 'Employee ID' }, { value: 'punched_at', label: 'Punched at' },
  { value: 'punch_type', label: 'Punch type' }, { value: 'device_identifier', label: 'Device identifier' },
];
export function deviceForm(device?: AttendanceDevice): AttendanceDeviceFormData {
  return {
    hardware_device_id: device?.hardware_device_id ?? '', friendly_name: device?.friendly_name ?? '',
    device_name: device?.device_name ?? '', device_type_id: device?.device_type_id ?? '',
    model_make: device?.model_make ?? '', serial_number: device?.serial_number ?? '',
    branch_id: device?.branch_id ?? '', internal_location_name: device?.internal_location_name ?? '',
    sync_protocol: device?.sync_protocol ?? '', device_driver: device?.device_driver ?? '',
    ip_address: device?.ip_address ?? '', port: device?.port?.toString() ?? '',
    db_host: device?.db_host ?? '', db_port: device?.db_port?.toString() ?? '', db_name: device?.db_name ?? '',
    db_username: device?.db_username ?? '', db_password: '', sync_cursor: device?.sync_cursor?.toString() ?? '',
    sync_frequency_minutes: device?.sync_frequency_minutes?.toString() ?? '', ip_whitelist: device?.ip_whitelist ?? '',
    deduplication_window_minutes: device?.deduplication_window_minutes?.toString() ?? '',
    auto_retry_on_failure: device?.auto_retry_on_failure ?? false, sync_enabled: device?.sync_enabled ?? true,
    is_active: device?.is_active ?? true, mappings: device?.mappings?.map(mapping => ({ ...mapping })) ?? [],
  };
}
export const canSyncDevice = (device: AttendanceDevice) => device.is_active && device.sync_enabled && (device.device_driver === 'db_direct' || device.sync_protocol === 'pull_api');
export function syncUnavailableReason(device: AttendanceDevice) {
  if (!device.is_active || !device.sync_enabled) return 'Enable the device and sync before running manual sync.';
  if (!canSyncDevice(device)) return 'Manual sync requires a DB Direct driver or Pull API protocol.';
  return '';
}
export function validateDeviceForm(form: AttendanceDeviceFormData): string | null {
  if (!form.hardware_device_id.trim() || !form.friendly_name.trim()) return 'Hardware device ID and friendly name are required.';
  if (!SYNC_PROTOCOLS.some(item => item.value === form.sync_protocol) || !DEVICE_DRIVERS.some(item => item.value === form.device_driver)) return 'Select a sync protocol and device driver.';
  const limits = { hardware_device_id: 100, friendly_name: 150, device_name: 100, model_make: 100, serial_number: 100, internal_location_name: 150, db_host: 45, db_name: 100, db_username: 100, db_password: 255, ip_whitelist: 5000 } as const;
  for (const [key, max] of Object.entries(limits)) if (String(form[key as keyof typeof limits]).length > max) return `${key.replaceAll('_', ' ')} must be ${max} characters or fewer.`;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if ([form.branch_id, form.device_type_id].some(value => value && !uuid.test(value))) return 'Select a valid branch and device type UUID.';
  for (const [value, min, max, label] of [
    [form.port, 1, 65535, 'Port'], [form.db_port, 1, 65535, 'Database port'],
    [form.sync_cursor, 0, Number.MAX_SAFE_INTEGER, 'Sync cursor'], [form.sync_frequency_minutes, 1, 1440, 'Sync frequency'],
    [form.deduplication_window_minutes, 1, 120, 'Deduplication window'],
  ] as const) if (value !== '' && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < min || Number(value) > max)) return `${label} must be an integer between ${min} and ${max}.`;
  for (const mapping of form.mappings) {
    if (!SYSTEM_ATTRIBUTES.some(item => item.value === mapping.system_attribute) || !mapping.device_key.trim()) return 'Each mapping needs a system attribute and device key.';
    if (mapping.device_key.length > 100 || (mapping.default_value?.length ?? 0) > 100 || (mapping.notes?.length ?? 0) > 255) return 'Mapping keys and defaults allow 100 characters; notes allow 255.';
  }
  return null;
}
// Preserve timezone-less timestamps as supplied: the API does not state their timezone.
export function deviceDate(value?: string | null) { return value || 'Never'; }
