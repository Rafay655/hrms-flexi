import { api } from '@/lib/api';
import type {
  AlertsResponse, AgingReport, AmsAsset, AmsAssetBundle, AmsAssetType, AmsAssignment, AmsBundleApplication, AmsCategory, AmsDashboardSummary,
  AmsDisposal, AmsHandoverNote, AmsLicenseAssignment, AmsMaintenanceRecord, AmsSoftwareLicense, AmsVendor,
  DepreciationByCategoryReport, DepreciationScheduleResponse, Paginated, UtilizationReport, WarrantyReport,
} from '@/types/ams.types';

const BASE = '/ams';

export const amsService = {
  // ── Categories ────────────────────────────────────────────
  getCategories: async (params?: { search?: string; active_only?: boolean; page?: number; per_page?: number }) => {
    const { data } = await api.get<Paginated<AmsCategory>>(`${BASE}/categories`, { params });
    return data;
  },
  createCategory: async (payload: Partial<AmsCategory>) => {
    const { data } = await api.post(`${BASE}/categories`, payload);
    return data.data as AmsCategory;
  },
  updateCategory: async (uuid: string, payload: Partial<AmsCategory>) => {
    const { data } = await api.put(`${BASE}/categories/${uuid}`, payload);
    return data.data as AmsCategory;
  },
  deleteCategory: async (uuid: string) => {
    await api.delete(`${BASE}/categories/${uuid}`);
  },
  getAssetTypesForCategory: async (categoryUuid: string) => {
    const { data } = await api.get(`${BASE}/categories/${categoryUuid}/types`);
    return data.data as AmsAssetType[];
  },
  createAssetType: async (payload: { category_uuid: string; name: string; brand_make?: string }) => {
    const { data } = await api.post(`${BASE}/asset-types`, payload);
    return data.data as AmsAssetType;
  },

  // ── Vendors ───────────────────────────────────────────────
  getVendors: async (params?: { search?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<Paginated<AmsVendor>>(`${BASE}/vendors`, { params });
    return data;
  },
  createVendor: async (payload: Partial<AmsVendor>) => {
    const { data } = await api.post(`${BASE}/vendors`, payload);
    return data.data as AmsVendor;
  },
  updateVendor: async (uuid: string, payload: Partial<AmsVendor>) => {
    const { data } = await api.put(`${BASE}/vendors/${uuid}`, payload);
    return data.data as AmsVendor;
  },
  deleteVendor: async (uuid: string) => {
    await api.delete(`${BASE}/vendors/${uuid}`);
  },

  // ── Assets ────────────────────────────────────────────────
  getAssets: async (params?: { search?: string; status?: string; category_id?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<Paginated<AmsAsset>>(`${BASE}/assets`, { params });
    return data;
  },
  getAsset: async (uuid: string) => {
    const { data } = await api.get(`${BASE}/assets/${uuid}`);
    return data.data as AmsAsset;
  },
  getAssetDepreciationSchedule: async (uuid: string) => {
    const { data } = await api.get(`${BASE}/assets/${uuid}/depreciation-schedule`);
    return data.data as DepreciationScheduleResponse;
  },
  createAsset: async (payload: Record<string, unknown>) => {
    const { data } = await api.post(`${BASE}/assets`, payload);
    return data.data as AmsAsset;
  },
  updateAsset: async (uuid: string, payload: Record<string, unknown>) => {
    const { data } = await api.put(`${BASE}/assets/${uuid}`, payload);
    return data.data as AmsAsset;
  },
  deleteAsset: async (uuid: string) => {
    await api.delete(`${BASE}/assets/${uuid}`);
  },

  // ── Assignments ───────────────────────────────────────────
  getAssignments: async (params?: { active_only?: boolean; overdue_only?: boolean; page?: number; per_page?: number }) => {
    const { data } = await api.get<Paginated<AmsAssignment>>(`${BASE}/assignments`, { params });
    return data;
  },
  createAssignment: async (payload: {
    asset_uuid: string; employee_uuid: string; assigned_date: string;
    expected_return_date?: string; assignment_type?: string; condition_at_issue: string; remarks?: string;
  }) => {
    const { data } = await api.post(`${BASE}/assignments`, payload);
    return data.data as AmsAssignment;
  },
  returnAssignment: async (uuid: string, payload: { condition_at_return: string; returned_date?: string }) => {
    const { data } = await api.put(`${BASE}/assignments/${uuid}/return`, payload);
    return data.data as AmsAssignment;
  },
  transferAssignment: async (uuid: string, payload: { new_employee_uuid: string; assigned_date: string; condition_at_issue: string; condition_at_return?: string }) => {
    const { data } = await api.put(`${BASE}/assignments/${uuid}/transfer`, payload);
    return data.data as AmsAssignment;
  },
  getEmployeeAssets: async (employeeUuid: string) => {
    const { data } = await api.get(`${BASE}/employees/${employeeUuid}/assets`);
    return data.data as AmsAssignment[];
  },
  getPendingReturns: async (employeeUuid: string) => {
    const { data } = await api.get(`${BASE}/employees/${employeeUuid}/assets/pending-return`);
    return data.data as AmsAssignment[];
  },

  // ── Handover notes ────────────────────────────────────────
  getHandoverNotes: async (params?: { page?: number; per_page?: number }) => {
    const { data } = await api.get<Paginated<AmsHandoverNote>>(`${BASE}/handover-notes`, { params });
    return data;
  },
  getHandoverNote: async (uuid: string) => {
    const { data } = await api.get(`${BASE}/handover-notes/${uuid}`);
    return data.data as AmsHandoverNote;
  },
  signHandoverNote: async (uuid: string, signature: string) => {
    const { data } = await api.post(`${BASE}/handover-notes/${uuid}/sign`, { signature });
    return data.data as AmsHandoverNote;
  },
  hrSignHandoverNote: async (uuid: string) => {
    const { data } = await api.post(`${BASE}/handover-notes/${uuid}/hr-sign`);
    return data.data as AmsHandoverNote;
  },
  /**
   * The PDF endpoint requires auth:sanctum, and the frontend authenticates via a
   * bearer token injected by an axios interceptor (lib/api.ts) — a plain <a href>
   * navigation carries none of that and 401s. Fetch the file as a blob through the
   * authenticated axios instance and trigger a client-side save instead, matching
   * downloadDocument()'s established pattern in services/dms.service.ts.
   */
  downloadHandoverNotePdf: async (uuid: string): Promise<void> => {
    const response = await api.get(`${BASE}/handover-notes/${uuid}/pdf`, { responseType: 'blob' });

    const disposition = (response.headers['content-disposition'] as string | undefined) ?? '';
    const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
    const filename = match ? decodeURIComponent(match[1]) : `handover-note-${uuid}.pdf`;

    const blobUrl = window.URL.createObjectURL(response.data as Blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  // ── Dashboard & ESS ───────────────────────────────────────
  getDashboardSummary: async () => {
    const { data } = await api.get(`${BASE}/dashboard/summary`);
    return data.data as AmsDashboardSummary;
  },
  getMyAssets: async () => {
    const { data } = await api.get(`${BASE}/my-assets`);
    return data.data as AmsAssignment[];
  },

  // ── Reports (Phase 2D) ───────────────────────────────────
  getUtilizationReport: async (categoryId?: string) => {
    const { data } = await api.get(`${BASE}/reports/utilization`, { params: { category_id: categoryId } });
    return data.data as UtilizationReport;
  },
  getAgingReport: async (categoryId?: string) => {
    const { data } = await api.get(`${BASE}/reports/aging`, { params: { category_id: categoryId } });
    return data.data as AgingReport;
  },
  getWarrantyExpiryReport: async (categoryId?: string) => {
    const { data } = await api.get(`${BASE}/reports/warranty-expiry`, { params: { category_id: categoryId } });
    return data.data as WarrantyReport;
  },
  getDepreciationByCategoryReport: async (categoryId?: string) => {
    const { data } = await api.get(`${BASE}/reports/depreciation-by-category`, { params: { category_id: categoryId } });
    return data.data as DepreciationByCategoryReport;
  },
  getDashboardAlerts: async () => {
    const { data } = await api.get(`${BASE}/dashboard/alerts`);
    return data.data as AlertsResponse;
  },

  /**
   * Same reasoning as downloadHandoverNotePdf() above: lib/api.ts attaches
   * auth as an Authorization: Bearer header, not a cookie, so a plain <a>
   * navigation carries no credential and 401s. Blob-download through the
   * authenticated api instance instead.
   */
  downloadReportCsv: async (
    slug: 'utilization' | 'aging' | 'warranty-expiry' | 'depreciation-by-category',
    categoryId?: string,
  ): Promise<void> => {
    const response = await api.get(`${BASE}/reports/${slug}`, {
      params: { category_id: categoryId, format: 'csv' },
      responseType: 'blob',
    });

    const disposition = (response.headers['content-disposition'] as string | undefined) ?? '';
    const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
    const filename = match ? decodeURIComponent(match[1]) : `ams-${slug}.csv`;

    const blobUrl = window.URL.createObjectURL(response.data as Blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  // ── Maintenance ───────────────────────────────────────────
  getAssetMaintenance: async (assetUuid: string, params?: { page?: number; per_page?: number }) => {
    const { data } = await api.get<Paginated<AmsMaintenanceRecord>>(`${BASE}/assets/${assetUuid}/maintenance`, { params });
    return data;
  },
  createMaintenance: async (assetUuid: string, payload: { vendor_uuid?: string; description: string; started_date: string; ended_date?: string; cost?: number; notes?: string }) => {
    const { data } = await api.post(`${BASE}/assets/${assetUuid}/maintenance`, payload);
    return data.data as AmsMaintenanceRecord;
  },
  completeMaintenance: async (uuid: string, payload?: { cost?: number; notes?: string }) => {
    const { data } = await api.put(`${BASE}/maintenance/${uuid}/complete`, payload ?? {});
    return data.data as AmsMaintenanceRecord;
  },
  cancelMaintenance: async (uuid: string, payload?: { cost?: number; notes?: string }) => {
    const { data } = await api.put(`${BASE}/maintenance/${uuid}/cancel`, payload ?? {});
    return data.data as AmsMaintenanceRecord;
  },

  // ── Disposals ─────────────────────────────────────────────
  getAssetDisposals: async (assetUuid: string, params?: { page?: number; per_page?: number }) => {
    const { data } = await api.get<Paginated<AmsDisposal>>(`${BASE}/assets/${assetUuid}/disposals`, { params });
    return data;
  },
  initiateDisposal: async (assetUuid: string, payload: { disposal_method: string; reason: string; disposed_at: string; sale_proceeds?: number }) => {
    const { data } = await api.post(`${BASE}/assets/${assetUuid}/disposals`, payload);
    return data.data as AmsDisposal;
  },
  getDisposalQueue: async (params?: { status?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<Paginated<AmsDisposal>>(`${BASE}/disposals`, { params });
    return data;
  },
  approveDisposal: async (uuid: string) => {
    const { data } = await api.put(`${BASE}/disposals/${uuid}/approve`);
    return data.data as { disposal: AmsDisposal; asset: AmsAsset };
  },
  rejectDisposal: async (uuid: string, rejection_reason: string) => {
    const { data } = await api.put(`${BASE}/disposals/${uuid}/reject`, { rejection_reason });
    return data.data as { disposal: AmsDisposal; asset: AmsAsset };
  },

  // ── Software Licenses (Phase 2C) ───────────────────────────
  getLicenses: async (params?: {
    search?: string; vendor_id?: string; billing_term?: string;
    expiry_state?: 'active' | 'expired'; has_available_seats?: boolean;
    page?: number; per_page?: number;
  }) => {
    const { data } = await api.get<Paginated<AmsSoftwareLicense>>(`${BASE}/licenses`, { params });
    return data;
  },
  getLicense: async (uuid: string) => {
    const { data } = await api.get(`${BASE}/licenses/${uuid}`);
    return data.data as AmsSoftwareLicense;
  },
  createLicense: async (payload: Record<string, unknown>) => {
    const { data } = await api.post(`${BASE}/licenses`, payload);
    return data.data as AmsSoftwareLicense;
  },
  updateLicense: async (uuid: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`${BASE}/licenses/${uuid}`, payload);
    return data.data as AmsSoftwareLicense;
  },
  deleteLicense: async (uuid: string) => {
    await api.delete(`${BASE}/licenses/${uuid}`);
  },
  getLicenseAssignments: async (licenseUuid: string, params?: { active_only?: boolean; page?: number; per_page?: number }) => {
    const { data } = await api.get<Paginated<AmsLicenseAssignment>>(`${BASE}/licenses/${licenseUuid}/assignments`, { params });
    return data;
  },
  assignLicense: async (licenseUuid: string, payload: { employee_uuid?: string; asset_uuid?: string; assigned_date: string }) => {
    const { data } = await api.post(`${BASE}/licenses/${licenseUuid}/assignments`, payload);
    return data.data as { assignment: AmsLicenseAssignment; license: AmsSoftwareLicense };
  },
  revokeLicenseAssignment: async (uuid: string, revoked_date: string) => {
    const { data } = await api.patch(`${BASE}/license-assignments/${uuid}/revoke`, { revoked_date });
    return data.data as { assignment: AmsLicenseAssignment; license: AmsSoftwareLicense };
  },

  // ── Onboarding Asset Bundles (Phase 3B) ────────────────────
  getBundles: async (params?: { search?: string; active_only?: boolean; page?: number; per_page?: number }) => {
    const { data } = await api.get<Paginated<AmsAssetBundle>>(`${BASE}/bundles`, { params });
    return data;
  },
  getBundle: async (uuid: string) => {
    const { data } = await api.get(`${BASE}/bundles/${uuid}`);
    return data.data as AmsAssetBundle;
  },
  createBundle: async (payload: { name: string; description?: string; active: boolean; items: { asset_type_uuid: string; quantity: number }[] }) => {
    const { data } = await api.post(`${BASE}/bundles`, payload);
    return data.data as AmsAssetBundle;
  },
  updateBundle: async (uuid: string, payload: { name: string; description?: string; active: boolean; items: { asset_type_uuid: string; quantity: number }[] }) => {
    const { data } = await api.put(`${BASE}/bundles/${uuid}`, payload);
    return data.data as AmsAssetBundle;
  },
  deactivateBundle: async (uuid: string) => {
    await api.delete(`${BASE}/bundles/${uuid}`);
  },
  getBundleApplications: async (params?: { status?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<Paginated<AmsBundleApplication>>(`${BASE}/bundle-applications`, { params });
    return data;
  },
  applyBundle: async (payload: { bundle_uuid: string; employee_uuid: string }) => {
    const { data } = await api.post(`${BASE}/bundle-applications`, payload);
    return data.data as AmsBundleApplication;
  },
  getBundleApplication: async (uuid: string) => {
    const { data } = await api.get(`${BASE}/bundle-applications/${uuid}`);
    return data.data as AmsBundleApplication;
  },
  confirmFulfillment: async (applicationUuid: string, itemUuid: string, payload: { asset_uuid: string; condition_at_issue: string; assigned_date?: string }) => {
    const { data } = await api.post(`${BASE}/bundle-applications/${applicationUuid}/items/${itemUuid}/confirm`, payload);
    return data.data as AmsBundleApplication;
  },
  cancelApplication: async (uuid: string, reason?: string) => {
    const { data } = await api.post(`${BASE}/bundle-applications/${uuid}/cancel`, { reason });
    return data.data as AmsBundleApplication;
  },
};
