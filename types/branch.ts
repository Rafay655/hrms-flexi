export interface Branch {
  id: string;
  name: string;
  code: string;
  branch_type: 'head_office' | 'regional_office' | 'branch' | 'factory' | 'warehouse' | 'field_office';
  is_active: boolean;
  address_line_1?: string | null;
  address_line_2?: string | null;
  country?: { id: number; name: string } | null;
  state?: { id: number; name: string } | null;
  city?: { id: number; name: string } | null;
  postal_code?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  geofence_radius_meters?: number | null;
  timezone?: string | null;
  compliance_region?: 'punjab' | 'sindh' | 'kpk' | 'balochistan' | 'federal' | null;
  phone?: string | null;
  email?: string | null;
  branch_head_employee_id?: number | null;
}

export interface BranchFormData {
  name: string;
  code: string;
  branch_type: Branch['branch_type'] | '';
  is_active: boolean;
  address_line_1: string;
  address_line_2: string;
  country_id: number | '';
  state_id: number | '';
  city_id: number | '';
  postal_code: string;
  latitude: string;
  longitude: string;
  geofence_radius_meters: string;
  timezone: string;
  compliance_region: Branch['compliance_region'] | '';
  phone: string;
  email: string;
  branch_head_employee_id: number | '';
}

export interface BranchApiPayload {
  name: string;
  code: string;
  branch_type: Branch['branch_type'];
  is_active: boolean;
  address_line_1: string | null;
  address_line_2: string | null;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_meters: number | null;
  timezone: string | null;
  compliance_region: Branch['compliance_region'] | null;
  phone: string | null;
  email: string | null;
  branch_head_employee_id: null;
}

export interface PaginatedBranchesResponse {
  success: boolean;
  message: string;
  data: {
    data: Branch[];
    links: any;
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      per_page: number;
      to: number;
      total: number;
    };
  };
}