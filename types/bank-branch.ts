export interface BankBranch {
  id: number;
  bank_id: number;
  bank?: { id: number; name: string; code: string } | null;
  code: string;
  name: string;
  country: string | null;
  city: string | null;
  status: "active" | "inactive";
  created_at?: string;
}

export interface BankBranchFormData {
  bank_id: number | "";
  code: string;
  name: string;
  country: string;
  city: string;
  status: "active" | "inactive";
}

export interface BankBranchApiPayload {
  bank_id: number;
  code: string;
  name: string;
  country: string | null;
  city: string | null;
  status: "active" | "inactive";
}

export interface PaginatedBankBranchesResponse {
  success: boolean;
  message: string;
  data: BankBranch[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}