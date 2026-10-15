import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerApi } from '@/services/ledger.service';
import type {
  LedgerEntry,
  LedgerQueryParams,
  MarkIncludedPayload,
  MarkRemittedPayload,
  ReconcilePayload,
  AdjustPayload,
  ReversePayload,
  UploadChallanPayload,
} from '@/types/ledger.types';

export const LEDGER_QUERY_KEY = 'ledger';

interface LedgerQueryResult {
  data: LedgerEntry[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export function useLedger(params?: LedgerQueryParams) {
  return useQuery<LedgerQueryResult>({
    queryKey: [LEDGER_QUERY_KEY, params],
    queryFn: async () => {
      const response = await ledgerApi.getEntries(params);
      // response.data.data is the paginator object
      const paginator = response.data.data;
      return {
        data: paginator.data,
        meta: {
          total: paginator.total,
          per_page: paginator.per_page,
          current_page: paginator.current_page,
          last_page: paginator.last_page,
        },
      };
    },
  });
}

// ... rest mutations unchanged

// ── Mutations ──────────────────────────────────────────
export function useMarkIncluded() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MarkIncludedPayload) => ledgerApi.markIncluded(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEDGER_QUERY_KEY] });
    },
  });
}

export function useMarkRemitted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MarkRemittedPayload) => ledgerApi.markRemitted(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEDGER_QUERY_KEY] });
    },
  });
}

export function useReconcile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReconcilePayload) => ledgerApi.reconcile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEDGER_QUERY_KEY] });
    },
  });
}

export function useAdjust() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdjustPayload) => ledgerApi.adjust(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEDGER_QUERY_KEY] });
    },
  });
}

export function useReverse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReversePayload) => ledgerApi.reverse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEDGER_QUERY_KEY] });
    },
  });
}

export function useUploadChallan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadChallanPayload) => ledgerApi.uploadChallan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEDGER_QUERY_KEY] });
    },
  });
}