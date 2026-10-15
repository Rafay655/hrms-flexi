export interface Region {
  id: number;
  name: string;
  status: string;
}

export interface RegionFormData {
  name: string;
  status: string;
}

export interface PaginatedRegionsResponse {
  data: Region[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}