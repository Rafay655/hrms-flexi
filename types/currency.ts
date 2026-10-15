export interface Currency {
  id: number;
  name: string;
  iso_code: string;
  symbol: string;
  decimal_places: number;
  status: "active" | "inactive";
  created_at?: string; // if API returns it
}

export interface CurrencyFormData {
  name: string;
  iso_code: string;
  symbol: string;
  decimal_places: number;
  status: "active" | "inactive";
}

export interface CurrencyApiPayload {
  name: string;
  iso_code: string;
  symbol: string;
  decimal_places: number;
  status: "active" | "inactive";
}

export interface PaginatedCurrenciesResponse {
  success: boolean;
  message: string;
  data: Currency[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}