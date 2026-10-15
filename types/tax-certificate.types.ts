// types/tax-certificate.types.ts

export interface TaxCertificate {
  id: string;
  certificate_number: string;
  tax_year_id: string;
  tax_year_label: string;
  employee_uuid: string;
  employee_name: string;
  status: 'draft' | 'generated' | 'published' | 'archived' | 'failed';
  total_taxable_income: number;
  total_tax_deducted: number;
  total_tax_paid: number;
  total_gross_salary: number;
  basic_salary: number;
  house_rent_allowance: number;
  medical_allowance: number;
  bonus_amount: number;
  arrears_amount: number;
  other_allowances: number;
  exemption_type: string;
  exemption_amount: number;
  surcharge_amount: number;
  is_ready: boolean;
  is_failed: boolean;
  failure_reason: string | null;
  generated_at: string | null;
  downloaded_at: string | null;
  created_at: string;
}

export interface TaxCertificateDetail {
  certificate_uuid: string;
  certificate_number: string;
  status: string;
  generated_at: string;
  downloaded_at: string | null;
  tax_year: {
    uuid: string;
    label: string;
    from_date: string;
    to_date: string;
  };
  employee: {
    uuid: string;
    name: string;
    address: string;
    cnic: string;
    ntn: string;
    designation: string;
  };
  amount: string;
  amount_in_words: string;
  value_amount: string;
  value_amount_words: string;
  section: string;
  nature: string;
  total_taxable_income: string;
  total_tax_deducted: string;
  total_gross_salary: string;
  salary_breakdown: {
    basic_salary: string;
    house_rent_allowance: string;
    medical_allowance: string;
    bonus_amount: string;
    arrears_amount: string;
    other_allowances: string;
  };
  exemption: {
    type: string;
    amount: string;
  };
  surcharge_amount: string;
  company: {
    name: string;
    address: string;
    ntn: string;
    phone: string;
    email: string;
  };
  signer: {
    name: string;
    designation: string;
    signature_url: string;
    seal_url: string;
  };
  issue_date: string;
  serial_number: string;
}

export interface GenerateCertificatePayload {
  employee_uuid: string;
  tax_year_id: string;
}

export interface BulkGeneratePayload {
  tax_year_id: string;
}

export interface BulkGenerateResponse {
  total_employees: number;
  generated: number;
  skipped: number;
  tax_year_label: string;
  certificate_uuids: string[];
}

export interface CertificateQueryParams {
  tax_year_id?: string;
  status?: string;
  employee_uuid?: string;
  department?: string;
  legal_entity_id?: string;
  page?: number;
  per_page?: number;
  search?: string;
}