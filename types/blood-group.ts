export interface BloodGroup {
  id: number;
  name: string;
  status: "active" | "inactive";
}

export interface BloodGroupFormData {
  name: string;
  status: "active" | "inactive";
}

export interface BloodGroupApiPayload {
  name: string;
  status: "active" | "inactive";
}

export interface PaginatedBloodGroupsResponse {
  success: boolean;
  message: string;
  data: BloodGroup[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}