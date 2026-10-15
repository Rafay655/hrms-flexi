export interface DocumentCategory {
  id: number;
  uuid: string;
  company_id: number;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  document_types_count: number; // extra relation count
}

export interface DocumentCategoryFormData {
  name: string;
  icon: string;
  description: string;
  is_active: boolean;
}

export interface DocumentCategoryApiPayload {
  name: string;
  icon: string;
  description: string | null;
  is_active: boolean;
}

// The API returns a plain array, not paginated
export type DocumentCategoryListResponse = {
  success: boolean;
  message: string;
  data: DocumentCategory[];
};