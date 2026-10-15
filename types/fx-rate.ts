export interface Currency {
  id: number;
  name: string;
  iso_code: string;
  symbol: string;
  decimal_places: number;
  status: string;
}

export interface FxRate {
  id: number;
  from_currency: Currency;
  to_currency: Currency;
  exchange_rate: string; // API returns string
  rate_date: string;
  inverse_rate?: string;
}

export interface FxRateFormData {
  from_currency_id: number | "";
  to_currency_id: number | "";
  exchange_rate: number; // form uses number
  rate_date: string;
}

export interface FxRateApiPayload {
  from_currency_id: number;
  to_currency_id: number;
  exchange_rate: number;
  rate_date: string;
}

export interface PaginatedFxRatesResponse {
  success: boolean;
  message: string;
  data: FxRate[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}