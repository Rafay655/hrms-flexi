import { api } from '@/lib/api';
import type {
  EmployeeGeofence,
  EmployeeGeofenceFormData,
  EmployeeGeofenceApiPayload,
  PaginatedEmployeeGeofencesResponse,
} from '@/types/employee-geofence';

const BASE_PATH = '/time-sync/employee-geofences';

const toApiPayload = (data: EmployeeGeofenceFormData): EmployeeGeofenceApiPayload => ({
  branch_id: data.branch_id || null,
  zone_name: data.zone_name.trim(),
  latitude: parseFloat(data.latitude),
  longitude: parseFloat(data.longitude),
  radius_meters: data.radius_meters,
  zone_type: data.zone_type as EmployeeGeofenceApiPayload['zone_type'],
  wifi_ssid_list: data.wifi_ssid_list.length > 0 ? data.wifi_ssid_list : null,
  is_active: data.is_active,
  effective_from: data.effective_from,
  effective_to: data.effective_to || null,
});

export const employeeGeofenceService = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string; is_active?: number }) => {
    const { data } = await api.get<PaginatedEmployeeGeofencesResponse>(BASE_PATH, { params });
    return data;
  },

  getById: async (uuid: string) => {
    const response = await api.get(`${BASE_PATH}/${uuid}`);
    return response.data.data as EmployeeGeofence;
  },

  create: async (payload: EmployeeGeofenceFormData) => {
    const response = await api.post(BASE_PATH, toApiPayload(payload));
    return response.data.data;
  },

  update: async (uuid: string, payload: EmployeeGeofenceFormData) => {
    const response = await api.put(`${BASE_PATH}/${uuid}`, toApiPayload(payload));
    return response.data.data;
  },

  delete: async (uuid: string) => {
    await api.delete(`${BASE_PATH}/${uuid}`);
  },
};