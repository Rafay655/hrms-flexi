// hooks/useTaxCertificates.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxCertificateApi } from '@/services/tax-certificate.service';
import type {
  TaxCertificate,
  TaxCertificateDetail,
  GenerateCertificatePayload,
  BulkGeneratePayload,
  CertificateQueryParams,
} from '@/types/tax-certificate.types';

export const TAX_CERTIFICATES_QUERY_KEY = 'taxCertificates';

export function useTaxCertificates(params?: CertificateQueryParams) {
  return useQuery({
    queryKey: [TAX_CERTIFICATES_QUERY_KEY, params],
    queryFn: async () => {
      const { data } = await taxCertificateApi.getCertificates(params);
      return {
        data: data.data,
        meta: data.meta,
      };
    },
  });
}

export function useTaxCertificate(uuid: string) {
  return useQuery({
    queryKey: [TAX_CERTIFICATES_QUERY_KEY, uuid],
    queryFn: async () => {
      const { data } = await taxCertificateApi.getCertificate(uuid);
      return data.data;
    },
    enabled: !!uuid,
  });
}

export function useGenerateCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateCertificatePayload) =>
      taxCertificateApi.generateCertificate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAX_CERTIFICATES_QUERY_KEY] });
    },
  });
}

export function useBulkGenerateCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkGeneratePayload) =>
      taxCertificateApi.bulkGenerate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAX_CERTIFICATES_QUERY_KEY] });
    },
  });
}