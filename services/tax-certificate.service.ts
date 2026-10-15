// services/tax-certificate.service.ts
import { api } from '@/lib/api';
import type {
  TaxCertificate,
  TaxCertificateDetail,
  GenerateCertificatePayload,
  BulkGeneratePayload,
  BulkGenerateResponse,
  CertificateQueryParams,
} from '@/types/tax-certificate.types';

export const taxCertificateApi = {
  getCertificates: (params?: CertificateQueryParams) =>
    api.get<{ data: TaxCertificate[]; meta: any }>('/compliance/tax-certificates', { params }),

  getCertificate: (uuid: string) =>
    api.get<{ data: TaxCertificateDetail }>(`/compliance/tax-certificates/${uuid}`),

  generateCertificate: (payload: GenerateCertificatePayload) =>
    api.post<{ data: any }>('/compliance/tax-certificates/generate', payload),

  bulkGenerate: (payload: BulkGeneratePayload) =>
    api.post<{ data: BulkGenerateResponse }>('/compliance/tax-certificates/bulk-generate', payload),
};