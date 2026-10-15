// types/form-builder.ts

export interface FormBuilder {
  id: number;
  company_id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  is_default: boolean;
  steps_count: number;
  fields_count: number;
  created_at: string;
  updated_at: string;
}

export interface FormBuildersResponse {
  success: boolean;
  message: string;
  data: FormBuilder[];
  meta: {
    company_id: number;
    company_uuid: string;
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
      from: number;
      to: number;
    };
    filters: {
      search: string | null;
      status: string;
    };
  };
}

export interface FormBuildersQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: "all" | "active" | "inactive";
  company_uuid?: string;
}