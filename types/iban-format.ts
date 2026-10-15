export interface IbanFormat {
  id: number;
  country: string;
  regex_pattern: string;
  example: string | null;
  status: "active" | "inactive";
  created_at?: string;
}

export interface IbanFormatFormData {
  country: string;
  regex_pattern: string;
  example: string;
  status: "active" | "inactive";
}

export interface IbanFormatApiPayload {
  country: string;
  regex_pattern: string;
  example: string | null;
  status: "active" | "inactive";
}

export interface PaginatedIbanFormatsResponse {
  success: boolean;
  message: string;
  data: IbanFormat[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}