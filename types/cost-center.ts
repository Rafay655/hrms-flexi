export interface CostCenter {
  id: number;
  code: string;
  name: string;
  parent: {
    id: number;
    code: string;
    name: string;
    type: string;
    manager_employee_id: number | null;
    budget: string | null;
    status: string;
  } | null;
  type: "cost_center" | "profit_center" | "investment_center";
  manager_employee_id: number | null;
  budget: string | null;
  currency: {
    id: number;
    name: string;
    iso_code: string;
    symbol: string;
    decimal_places: number;
    status: string;
  } | null;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface CostCenterFormData {
  code: string;
  name: string;
  parent_id: number | "";
  type: CostCenter['type'] | "";
  manager_employee_id: number | "";
  budget: string;
  currency_id: number | "";
  status: "active" | "inactive";
}

export interface CostCenterApiPayload {
  code: string;
  name: string;
  parent_id: number | null;
  type: CostCenter['type'];
  manager_employee_id: null;
  budget: number | null;
  currency_id: number | null;
  status: "active" | "inactive";
}

export interface PaginatedCostCentersResponse {
  success: boolean;
  message: string;
  data: CostCenter[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}