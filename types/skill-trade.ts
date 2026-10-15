export interface SkillTrade {
  id: number;
  code: string | null;
  name: string;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface SkillTradeFormData {
  code: string;
  name: string;
  status: "active" | "inactive";
}

export interface SkillTradeApiPayload {
  code: string | null;
  name: string;
  status: "active" | "inactive";
}

export interface PaginatedSkillTradesResponse {
  success: boolean;
  message: string;
  data: SkillTrade[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}