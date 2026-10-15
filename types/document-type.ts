export interface DocumentType {
  id: number;
  uuid: string;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  requires_expiry: boolean;
  requires_verification: boolean;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  // optional: we may enrich with category name later
  category_name?: string;
}

export interface DocumentTypeFormData {
  name: string;
  category_id: number;
  description: string;
  requires_expiry: boolean;
  requires_verification: boolean;
  is_active: boolean;
}

export interface DocumentTypeApiPayload {
  name: string;
  category_id: number;
  description: string | null;
  requires_expiry: boolean;
  requires_verification: boolean;
  is_active: boolean;
}

export interface PaginatedDocumentTypesResponse {
  success: boolean;
  message: string;
  data: DocumentType[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}