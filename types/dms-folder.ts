export interface DmsFolder {
  uuid: string;
  name: string;
  slug: string;
  folder_type: 'personal' | 'shared' | 'system';
  is_system: boolean;
  sort_order: number;
  parent_id: number | null;
  children_count: number;
  children?: DmsFolder[]; // for tree structure
  created_at: string;
  // additional fields from response might include id, company_id, employee_id, etc.
  // We'll map what we need.
  id?: number; // optional
  company_id?: number;
  employee_id?: number | null;
  created_by?: number | null;
  updated_by?: number | null;
  deleted_by?: number | null;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DmsFolderFormData {
  name: string;
  slug: string;
  parent_id?: number | null; // for create subfolder
  folder_type?: 'personal' | 'shared' | 'system';
  is_system?: boolean;
}

export interface DmsFolderApiPayload {
  name: string;
  slug: string;
  parent_id?: number | null;
  folder_type?: 'personal' | 'shared' | 'system';
  is_system?: boolean;
}