export type PunchType = 'in' | 'out' | 'break_start' | 'break_end';
export type GpsLocation = { lat: number; lng: number; accuracy_meters: number; capturedAt: number };

export interface RawPunch {
  id: string;
  employee_id: string;
  employee: { id: string; employee_code: string; name: string } | null;
  punched_at: string | null;
  punch_type: PunchType | string;
  source: string;
  lat: number | string | null;
  lng: number | string | null;
  accuracy_meters: number | string | null;
  is_geofence_valid: boolean | null;
  geofence_distance_meters?: number | string | null;
  is_processed: boolean;
  mock_location_flag?: boolean;
  device_id?: string | null;
  device?: { id?: string; friendly_name?: string | null; device_name?: string | null } | null;
}
export interface PunchListFilters {
  date: string;
  page: number;
  per_page: number;
  punch_type?: string;
  source?: string;
  date_from?: string;
  date_to?: string;
  device_id?: string;
  is_processed?: '0' | '1' | '';
  search?: string;
}
export interface PunchListResponse {
  success: boolean;
  message: string;
  data: RawPunch[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
}
export interface WebPunchInput {
  client_idempotency_key: string;
  punch_type: PunchType;
  lat: number;
  lng: number;
  accuracy_meters: number;
  device_info: { user_agent: string; timezone: string };
}
export interface WebPunchResponse { success: boolean; message: string; data: RawPunch }
