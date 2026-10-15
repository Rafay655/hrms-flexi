export interface DeviceType {
  id: string;
  uuid: string;
  code: string;
  name: string;
  manufacturer: string | null;
  communication_protocol: DeviceTypeProtocol;
  is_biometric: boolean;
  supported_functions: DeviceTypeFunction[];
  status: DeviceTypeStatus;
  created_at?: string;
  updated_at?: string;
}

export type DeviceTypeProtocol = 'zkteco_sdk' | 'rest_api' | 'csv_import' | 'standalone_app';
export type DeviceTypeFunction = 'fingerprint' | 'face' | 'card' | 'pin';
export type DeviceTypeStatus = 'active' | 'inactive';

export interface DeviceTypeFormData {
  code: string;
  name: string;
  manufacturer: string;
  communication_protocol: DeviceTypeProtocol | '';
  is_biometric: boolean;
  supported_functions: DeviceTypeFunction[];
  status: DeviceTypeStatus;
}

export interface DeviceTypeApiPayload {
  code: string;
  name: string;
  manufacturer: string | null;
  communication_protocol: DeviceTypeProtocol;
  is_biometric: boolean;
  supported_functions: DeviceTypeFunction[] | null;
  status: DeviceTypeStatus;
}

export interface PaginatedDeviceTypesResponse {
  success: boolean;
  message: string;
  data: {
    data: DeviceType[];
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