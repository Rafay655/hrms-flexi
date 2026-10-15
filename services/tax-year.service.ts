// services/tax-year.service.ts
import { api } from '@/lib/api';
import type {
  TaxYear,
  CreateTaxYearPayload,
  UpdateTaxYearPayload,
  CloneTaxYearPayload,
  TaxYearSlab,
  CreateSlabPayload,
  UpdateSlabPayload,
} from '@/types/tax-year.types';

export const taxYearApi = {
  // ── Tax Years ──────────────────────────────────────
  getTaxYears: () =>
    api.get<{ data: TaxYear[]; meta: any }>('/compliance/tax-years'),

  createTaxYear: (payload: CreateTaxYearPayload) =>
    api.post<{ data: TaxYear }>('/compliance/tax-years', payload),

  getTaxYear: (uuid: string) =>
    api.get<{ data: TaxYear }>(`/compliance/tax-years/${uuid}`),

  updateTaxYear: (uuid: string, payload: UpdateTaxYearPayload) =>
    api.put<{ data: TaxYear }>(`/compliance/tax-years/${uuid}`, payload),

  // No delete endpoint – remove delete method

  activateTaxYear: (uuid: string) =>
    api.post<{ data: TaxYear }>(`/compliance/tax-years/${uuid}/activate`),

  closeTaxYear: (uuid: string) =>
    api.post<{ data: TaxYear }>(`/compliance/tax-years/${uuid}/close`),

  cloneTaxYear: (uuid: string, payload: CloneTaxYearPayload) =>
    api.post<{ data: TaxYear }>(`/compliance/tax-years/${uuid}/clone`, payload),

  // ── Slabs ──────────────────────────────────────────
  getSlabs: (taxYearUuid: string) =>
    api.get<{ data: TaxYearSlab[] }>(`/compliance/tax-years/${taxYearUuid}/slabs`),

  createSlab: (taxYearUuid: string, payload: CreateSlabPayload) =>
    api.post<{ data: TaxYearSlab }>(`/compliance/tax-years/${taxYearUuid}/slabs`, payload),

  updateSlab: (taxYearUuid: string, slabUuid: string, payload: UpdateSlabPayload) =>
    api.put<{ data: TaxYearSlab }>(`/compliance/tax-years/${taxYearUuid}/slabs/${slabUuid}`, payload),

  deleteSlab: (taxYearUuid: string, slabUuid: string) =>
    api.delete(`/compliance/tax-years/${taxYearUuid}/slabs/${slabUuid}`),
};