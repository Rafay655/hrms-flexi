export interface HealthCondition {
  id: number;
  name: string;
  status: "active" | "inactive";
}

export interface HealthConditionFormData {
  name: string;
  status: "active" | "inactive";
}

export interface HealthConditionApiPayload {
  name: string;
  status: "active" | "inactive";
}

export interface PaginatedHealthConditionsResponse {
  success: boolean;
  message: string;
  data: HealthCondition[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}