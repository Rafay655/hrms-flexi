// hooks/useTaxYears.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxYearApi } from '@/services/tax-year.service';
import type {
  TaxYear,
  CreateTaxYearPayload,
  UpdateTaxYearPayload,
  CloneTaxYearPayload,
  CreateSlabPayload,
  UpdateSlabPayload,
} from '@/types/tax-year.types';

export const TAX_YEARS_QUERY_KEY = 'taxYears';

// ── Tax Years ──────────────────────────────────────
export function useTaxYears() {
  return useQuery({
    queryKey: [TAX_YEARS_QUERY_KEY],
    queryFn: async () => {
      const { data } = await taxYearApi.getTaxYears();
      return data.data;
    },
  });
}

export function useTaxYear(uuid: string) {
  return useQuery({
    queryKey: [TAX_YEARS_QUERY_KEY, uuid],
    queryFn: async () => {
      const { data } = await taxYearApi.getTaxYear(uuid);
      return data.data;
    },
    enabled: !!uuid,
  });
}

export function useCreateTaxYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaxYearPayload) =>
      taxYearApi.createTaxYear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAX_YEARS_QUERY_KEY] });
    },
  });
}

export function useUpdateTaxYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: UpdateTaxYearPayload }) =>
      taxYearApi.updateTaxYear(uuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAX_YEARS_QUERY_KEY] });
    },
  });
}

// No delete hook

export function useActivateTaxYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => taxYearApi.activateTaxYear(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAX_YEARS_QUERY_KEY] });
    },
  });
}

export function useCloseTaxYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => taxYearApi.closeTaxYear(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAX_YEARS_QUERY_KEY] });
    },
  });
}

export function useCloneTaxYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: CloneTaxYearPayload }) =>
      taxYearApi.cloneTaxYear(uuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAX_YEARS_QUERY_KEY] });
    },
  });
}

// ── Slabs ──────────────────────────────────────────
export function useCreateSlab() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taxYearUuid, payload }: { taxYearUuid: string; payload: CreateSlabPayload }) =>
      taxYearApi.createSlab(taxYearUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAX_YEARS_QUERY_KEY] });
    },
  });
}

export function useUpdateSlab() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taxYearUuid,
      slabUuid,
      payload,
    }: {
      taxYearUuid: string;
      slabUuid: string;
      payload: UpdateSlabPayload;
    }) => taxYearApi.updateSlab(taxYearUuid, slabUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAX_YEARS_QUERY_KEY] });
    },
  });
}

export function useDeleteSlab() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taxYearUuid, slabUuid }: { taxYearUuid: string; slabUuid: string }) =>
      taxYearApi.deleteSlab(taxYearUuid, slabUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAX_YEARS_QUERY_KEY] });
    },
  });
}