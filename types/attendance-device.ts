export type SyncProtocol = 'push_api' | 'pull_api' | 'db_api';
export type DeviceDriver = 'zkteco_sdk' | 'rest_api' | 'csv_import' | 'db_direct' | 'generic_webhook';
export type SystemAttribute = 'employee_id' | 'punched_at' | 'punch_type' | 'device_identifier';

export interface DeviceMapping {
  system_attribute: SystemAttribute;
  device_key: string;
  is_required: boolean;
  default_value: string | null;
  notes: string | null;
}

export interface AttendanceDevice {
  id: string;               // UUID
  internal_id: number;
  company_id: number;
  hardware_device_id: string;
  friendly_name: string;
  device_name: string | null;
  device_type_id: string | null;    // UUID
  device_type?: {
    id: string;
    internal_id: number;
    code: string;
    name: string;
    manufacturer: string;
    communication_protocol: string;
    is_biometric: boolean;
  } | null;
  model_make: string | null;
  serial_number: string | null;
  branch_id: string | null;         // UUID
  branch?: {
    id: string;
    internal_id: number;
    name: string;
    code: string;
    branch_type: string;
    is_active: boolean;
    // ... etc
  } | null;
  internal_location_name: string | null;
  db_host: string | null;
  db_port: number | null;
  db_name: string | null;
  db_username: string | null;
  db_password_set: boolean;
  sync_cursor: number | null;
  webhook_endpoint: string | null;
  api_key_available: boolean;
  last_synced_at: string | null;
  last_sync_count: number | null;
  sync_protocol: SyncProtocol;
  device_driver: DeviceDriver;
  ip_address: string | null;
  port: number | null;
  sync_frequency_minutes: number | null;
  ip_whitelist: string | null;
  deduplication_window_minutes: number | null;
  auto_retry_on_failure: boolean;
  sync_enabled: boolean;
  is_active: boolean;
  mappings: DeviceMapping[];
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceDeviceFormData {
  hardware_device_id: string;
  friendly_name: string;
  device_name: string;
  device_type_id: string;           // UUID (empty string for none)
  model_make: string;
  serial_number: string;
  branch_id: string;                // UUID (empty string for none)
  internal_location_name: string;
  sync_protocol: SyncProtocol | '';
  device_driver: DeviceDriver | '';
  ip_address: string;
  db_host: string;
  db_port: string;
  db_name: string;
  db_username: string;
  db_password: string;
  sync_cursor: string;
  port: string;                     // number as string for input
  sync_frequency_minutes: string;
  ip_whitelist: string;
  deduplication_window_minutes: string;
  auto_retry_on_failure: boolean;
  sync_enabled: boolean;
  is_active: boolean;
  mappings: DeviceMapping[];
}

export interface AttendanceDeviceFilters { page?: number; per_page?: number; search?: string; is_active?: number }
export interface DeviceEnvelope<T> { success: boolean; message: string; data: T }
export interface DeviceListResponse extends DeviceEnvelope<AttendanceDevice[]> {
  meta: { current_page: number; per_page: number; total: number; last_page: number; from?: number | null; to?: number | null };
}
export type DeviceOperationResult = Record<string, unknown>;
export interface RotateDeviceKeyResponse extends DeviceEnvelope<AttendanceDevice> { one_time_api_key: string }
