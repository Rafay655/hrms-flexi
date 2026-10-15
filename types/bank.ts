export interface Bank {
  id: number;
  code: string;
  name: string;
  country: string | null;
  status: "active" | "inactive";
  created_at?: string;
}

export interface BankFormData {
  code: string;
  name: string;
  country: string;
  status: "active" | "inactive";
}

export interface BankApiPayload {
  code: string;
  name: string;
  country: string | null;
  status: "active" | "inactive";
}

export interface PaginatedBanksResponse {
  success: boolean;
  message: string;
  data: Bank[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}