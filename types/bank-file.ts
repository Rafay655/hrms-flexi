// types/bank-file.ts

export interface BankFile {
  id: string;
  period_id: string;
  bank_id: number;
  file_format: string;
  filename: string;
  total_amount: string;
  transaction_count: number;
  status: string;
  generated_by: string;
  generated_at: string;
}

export interface BankFileDetail {
  file_path: string;
  file_format: string;
  filename: string;
  mime_type: string;
  total_amount: string;
  transaction_count: number;
}

export interface BankFilesResponse {
  success: boolean;
  message: string;
  data: BankFile[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}