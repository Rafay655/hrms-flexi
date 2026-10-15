export type ZoneType = 'office' | 'warehouse' | 'site' | 'client' | 'flexible';

export interface EmployeeGeofence {
  id: string;              // UUID
  internal_id: number;
  company_id: number;
  branch_id: string | null;
  branch?: {
    id: string;
    name: string;
    code: string;
    branch_type: string;
    latitude?: string;
    longitude?: string;
    geofence_radius_meters?: number;
    timezone?: string;
    compliance_region?: string;
  } | null;
  zone_name: string;
  latitude: string;
  longitude: string;
  radius_meters: number;
  zone_type: ZoneType;
  wifi_ssid_list: string[];
  is_active: boolean;
  effective_from: string;   // YYYY-MM-DD
  effective_to: string | null;
  assignments_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeGeofenceFormData {
  branch_id: string;       // UUID or empty string
  zone_name: string;
  latitude: string;
  longitude: string;
  radius_meters: number;
  zone_type: ZoneType | '';
  wifi_ssid_list: string[];
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
}

export interface EmployeeGeofenceApiPayload {
  branch_id: string | null;
  zone_name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  zone_type: ZoneType;
  wifi_ssid_list: string[] | null;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
}

export interface PaginatedEmployeeGeofencesResponse {
  success: boolean;
  message: string;
  data: EmployeeGeofence[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}