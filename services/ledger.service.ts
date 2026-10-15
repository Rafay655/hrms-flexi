import { api } from '@/lib/api';
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

// The API returns a paginator object inside data.data
interface Paginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  // other fields like links, first_page_url etc. are not needed
}

export const ledgerApi = {
  getEntries: (params?: LedgerQueryParams) =>
    api.get<{
      data: Paginator<LedgerEntry>;
      meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
      };
    }>('/compliance/ledger', { params }),

  markIncluded: (payload: MarkIncludedPayload) =>
    api.post<{ data: any }>('/compliance/ledger/mark-included', payload),

  markRemitted: (payload: MarkRemittedPayload) =>
    api.post<{ data: any }>('/compliance/ledger/mark-remitted', payload),

  reconcile: (payload: ReconcilePayload) =>
    api.post<{ data: any }>('/compliance/ledger/reconcile', payload),

  adjust: (payload: AdjustPayload) =>
    api.post<{ data: LedgerEntry }>('/compliance/ledger/adjust', payload),

  reverse: (payload: ReversePayload) =>
    api.post<{ data: LedgerEntry }>('/compliance/ledger/reverse', payload),

  uploadChallan: ({ ledger_uuid, challan_file, challan_no, description }: UploadChallanPayload) => {
    const formData = new FormData();
    formData.append('challan_file', challan_file);
    formData.append('challan_no', challan_no);
    if (description) formData.append('description', description);
    return api.post(`/compliance/ledger/${ledger_uuid}/challan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};