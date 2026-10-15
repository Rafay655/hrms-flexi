import { api } from "@/lib/api";
import type {
  Insight360Field,
  Insight360DefinitionPayload,
  Insight360Overview,
  Insight360PageMeta,
  Insight360Preview,
  Insight360Provider,
  Insight360Report,
  Insight360ReportDefinition,
  Insight360Filter,
  Insight360Sort,
  Insight360Export,
  Insight360Recipient,
  Insight360SavedView,
  Insight360Schedule,
  Insight360SchedulePayload,
  Insight360Share,
  Insight360Dashboard,
  Insight360LayoutItem,
  Insight360WidgetData,
  Insight360WidgetDescriptor,
  Insight360Trends,
  Insight360PredictiveOverview,
  Insight360BenchmarkOverview,
  Insight360KpiOverview,
  Insight360KpiTarget,
  Insight360KpiBreach,
  Insight360CatalogueWaveOverview,
  Insight360CatalogueInventory,
  Insight360ReleaseReadiness,
  Insight360ReleaseAuditRun,
  Insight360Forecasts,
  Insight360RefreshJob,
  Insight360ExternalShare,
} from "@/types/insight360";

const BASE = "/insight360";

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export const insight360Service = {
  catalogueWave: (): Promise<Insight360CatalogueWaveOverview> =>
    api.get<{ data: Insight360CatalogueWaveOverview }>(`${BASE}/catalogue/wave-1`).then(unwrap<Insight360CatalogueWaveOverview>),
  refreshCatalogueWave: (report_key?: string): Promise<{ status: string }> =>
    api.post<{ data: { status: string } }>(`${BASE}/catalogue/wave-1/refresh`, report_key ? { report_key } : {}).then(unwrap<{ status: string }>),
  signOffCatalogueReport: (reportKey: string, note: string): Promise<{ report_key: string; signoff_status: string; signed_off_at: string }> =>
    api.post<{ data: { report_key: string; signoff_status: string; signed_off_at: string } }>(`${BASE}/catalogue/wave-1/${encodeURIComponent(reportKey)}/sign-off`, { note }).then(unwrap<{ report_key: string; signoff_status: string; signed_off_at: string }>),
  catalogueWaveTwo: (): Promise<Insight360CatalogueWaveOverview> =>
    api.get<{ data: Insight360CatalogueWaveOverview }>(`${BASE}/catalogue/wave-2`).then(unwrap<Insight360CatalogueWaveOverview>),
  refreshCatalogueWaveTwo: (report_key?: string): Promise<{ status: string }> =>
    api.post<{ data: { status: string } }>(`${BASE}/catalogue/wave-2/refresh`, report_key ? { report_key } : {}).then(unwrap<{ status: string }>),
  signOffCatalogueWaveTwoReport: (reportKey: string, note: string): Promise<{ report_key: string; signoff_status: string; signed_off_at: string }> =>
    api.post<{ data: { report_key: string; signoff_status: string; signed_off_at: string } }>(`${BASE}/catalogue/wave-2/${encodeURIComponent(reportKey)}/sign-off`, { note }).then(unwrap<{ report_key: string; signoff_status: string; signed_off_at: string }>),
  catalogueWaveThree: (): Promise<Insight360CatalogueWaveOverview> =>
    api.get<{ data: Insight360CatalogueWaveOverview }>(`${BASE}/catalogue/wave-3`).then(unwrap<Insight360CatalogueWaveOverview>),
  refreshCatalogueWaveThree: (report_key?: string): Promise<{ status: string }> =>
    api.post<{ data: { status: string } }>(`${BASE}/catalogue/wave-3/refresh`, report_key ? { report_key } : {}).then(unwrap<{ status: string }>),
  signOffCatalogueWaveThreeReport: (reportKey: string, note: string): Promise<{ report_key: string; signoff_status: string; signed_off_at: string }> =>
    api.post<{ data: { report_key: string; signoff_status: string; signed_off_at: string } }>(`${BASE}/catalogue/wave-3/${encodeURIComponent(reportKey)}/sign-off`, { note }).then(unwrap<{ report_key: string; signoff_status: string; signed_off_at: string }>),
  releaseInventory: (): Promise<Insight360CatalogueInventory> =>
    api.get<{ data: Insight360CatalogueInventory }>(`${BASE}/release/inventory`).then(unwrap<Insight360CatalogueInventory>),
  releaseReadiness: (): Promise<Insight360ReleaseReadiness> =>
    api.get<{ data: Insight360ReleaseReadiness }>(`${BASE}/release/readiness`).then(unwrap<Insight360ReleaseReadiness>),
  updateReleaseCheck: (checkKey: string, payload: { status: "passed" | "failed" | "waived"; evidence: string }): Promise<{ key: string; status: string; evidence: string; verified_at: string }> =>
    api.put<{ data: { key: string; status: string; evidence: string; verified_at: string } }>(`${BASE}/release/checks/${encodeURIComponent(checkKey)}`, payload).then(unwrap<{ key: string; status: string; evidence: string; verified_at: string }>),
  releaseAudits: (): Promise<{ runs: Insight360ReleaseAuditRun[] }> =>
    api.get<{ data: { runs: Insight360ReleaseAuditRun[] } }>(`${BASE}/release/audits`).then(unwrap<{ runs: Insight360ReleaseAuditRun[] }>),
  runReleaseAudit: (sample_size = 5): Promise<Insight360ReleaseAuditRun> =>
    api.post<{ data: Insight360ReleaseAuditRun }>(`${BASE}/release/audits`, { sample_size }).then(unwrap<Insight360ReleaseAuditRun>),
  intelligenceTrends: (params?: { metric_key?: string; from?: string; to?: string }): Promise<Insight360Trends> =>
    api.get<{ data: Insight360Trends }>(`${BASE}/intelligence/trends`, { params }).then(unwrap<Insight360Trends>),
  absenteeismTrend: (params?: { from?: string; to?: string }): Promise<Insight360Trends> =>
    api.get<{ data: Insight360Trends }>(`${BASE}/analytics/absenteeism-trend`, { params }).then(unwrap<Insight360Trends>),
  forecasts: (): Promise<Insight360Forecasts> =>
    api.get<{ data: Insight360Forecasts }>(`${BASE}/analytics/forecasts`).then(unwrap<Insight360Forecasts>),
  refreshJobs: (params?: { job_type?: Insight360RefreshJob["job_type"]; status?: Insight360RefreshJob["status"]; per_page?: number }): Promise<{ items: Insight360RefreshJob[]; meta: Insight360PageMeta }> =>
    api.get<{ data: Insight360RefreshJob[]; meta: Insight360PageMeta }>(`${BASE}/analytics/refresh-jobs`, { params })
      .then((response) => ({ items: response.data.data, meta: response.data.meta })),
  refreshSnapshots: (payload: { from?: string; to?: string } = {}): Promise<{ status: string }> =>
    api.post<{ data: { status: string } }>(`${BASE}/intelligence/snapshots/refresh`, payload).then(unwrap<{ status: string }>),
  predictiveOverview: (params?: { risk?: string; per_page?: number }): Promise<Insight360PredictiveOverview> =>
    api.get<{ data: Insight360PredictiveOverview }>(`${BASE}/intelligence/predictive`, { params }).then(unwrap<Insight360PredictiveOverview>),
  refreshPredictive: (payload: { as_of_date?: string } = {}): Promise<{ status: string }> =>
    api.post<{ data: { status: string } }>(`${BASE}/intelligence/predictive/refresh`, payload).then(unwrap<{ status: string }>),
  benchmarkOverview: (): Promise<Insight360BenchmarkOverview> =>
    api.get<{ data: Insight360BenchmarkOverview }>(`${BASE}/intelligence/benchmarks`).then(unwrap<Insight360BenchmarkOverview>),
  importBenchmarks: (benchmarks: Array<Record<string, unknown>>): Promise<{ imported: number }> =>
    api.post<{ data: { imported: number } }>(`${BASE}/intelligence/benchmarks/import`, { benchmarks }).then(unwrap<{ imported: number }>),
  kpiOverview: (): Promise<Insight360KpiOverview> =>
    api.get<{ data: Insight360KpiOverview }>(`${BASE}/intelligence/kpis`).then(unwrap<Insight360KpiOverview>),
  createKpiTarget: (payload: Omit<Insight360KpiTarget, "uuid" | "unit" | "owner"> & { owner_user_id: number }): Promise<Insight360KpiTarget> =>
    api.post<{ data: Insight360KpiTarget }>(`${BASE}/intelligence/kpis`, payload).then(unwrap<Insight360KpiTarget>),
  updateKpiTarget: (uuid: string, payload: Partial<Omit<Insight360KpiTarget, "uuid" | "unit" | "owner">> & { owner_user_id?: number }): Promise<Insight360KpiTarget> =>
    api.put<{ data: Insight360KpiTarget }>(`${BASE}/intelligence/kpis/${uuid}`, payload).then(unwrap<Insight360KpiTarget>),
  deleteKpiTarget: (uuid: string): Promise<void> => api.delete(`${BASE}/intelligence/kpis/${uuid}`).then(() => undefined),
  evaluateKpis: (): Promise<{ status: string }> =>
    api.post<{ data: { status: string } }>(`${BASE}/intelligence/kpis/evaluate`).then(unwrap<{ status: string }>),
  resolveKpiBreach: (uuid: string, resolution_note: string): Promise<Insight360KpiBreach> =>
    api.post<{ data: Insight360KpiBreach }>(`${BASE}/intelligence/kpi-breaches/${uuid}/resolve`, { resolution_note }).then(unwrap<Insight360KpiBreach>),
  dashboard: (): Promise<Insight360Dashboard> =>
    api.get<{ data: Insight360Dashboard }>(`${BASE}/dashboard`).then(unwrap<Insight360Dashboard>),
  dashboardWidgets: (): Promise<Insight360WidgetDescriptor[]> =>
    api.get<{ data: Insight360WidgetDescriptor[] }>(`${BASE}/dashboard/widgets`).then(unwrap<Insight360WidgetDescriptor[]>),
  dashboardWidget: (widgetKey: string): Promise<Insight360WidgetData> =>
    api.get<{ data: Insight360WidgetData }>(`${BASE}/dashboard/widgets/${encodeURIComponent(widgetKey)}`).then(unwrap<Insight360WidgetData>),
  saveDashboardLayout: (payload: { name?: string; items: Insight360LayoutItem[] }): Promise<Insight360Dashboard> =>
    api.put<{ data: Insight360Dashboard }>(`${BASE}/dashboard/layout`, payload).then(unwrap<Insight360Dashboard>),
  resetDashboardLayout: (): Promise<Insight360Dashboard> =>
    api.post<{ data: Insight360Dashboard }>(`${BASE}/dashboard/reset-layout`).then(unwrap<Insight360Dashboard>),
  refreshDashboardWidget: (widgetKey: string): Promise<Insight360WidgetData> =>
    api.post<{ data: Insight360WidgetData }>(`${BASE}/dashboard/widgets/${encodeURIComponent(widgetKey)}/refresh`).then(unwrap<Insight360WidgetData>),
  overview: (): Promise<Insight360Overview> =>
    api.get<{ data: Insight360Overview }>(BASE).then(unwrap<Insight360Overview>),
  reports: (): Promise<Insight360Report[]> =>
    api.get<{ data: Insight360Report[] }>(`${BASE}/reports`).then(unwrap<Insight360Report[]>),
  providers: (): Promise<Insight360Provider[]> =>
    api.get<{ data: Insight360Provider[] }>(`${BASE}/providers`).then(unwrap<Insight360Provider[]>),
  fields: (provider: string): Promise<Insight360Field[]> =>
    api
      .get<{ data: Insight360Field[] }>(`${BASE}/providers/${encodeURIComponent(provider)}/fields`)
      .then(unwrap<Insight360Field[]>),
  definitions: (params?: Record<string, unknown>): Promise<{ items: Insight360ReportDefinition[]; meta: Insight360PageMeta }> =>
    api.get<{ data: Insight360ReportDefinition[]; meta: Insight360PageMeta }>(`${BASE}/definitions`, { params })
      .then((response) => ({ items: response.data.data, meta: response.data.meta })),
  definition: (uuid: string): Promise<Insight360ReportDefinition> =>
    api.get<{ data: Insight360ReportDefinition }>(`${BASE}/definitions/${uuid}`).then(unwrap<Insight360ReportDefinition>),
  createDefinition: (payload: Insight360DefinitionPayload): Promise<Insight360ReportDefinition> =>
    api.post<{ data: Insight360ReportDefinition }>(`${BASE}/definitions`, payload).then(unwrap<Insight360ReportDefinition>),
  updateDefinition: (uuid: string, payload: Partial<Insight360DefinitionPayload>): Promise<Insight360ReportDefinition> =>
    api.put<{ data: Insight360ReportDefinition }>(`${BASE}/definitions/${uuid}`, payload).then(unwrap<Insight360ReportDefinition>),
  deleteDefinition: (uuid: string): Promise<void> =>
    api.delete(`${BASE}/definitions/${uuid}`).then(() => undefined),
  preview: (uuid: string, payload: { page?: number; per_page?: number; filters?: Insight360Filter[]; sorts?: Insight360Sort[] }): Promise<Insight360Preview> =>
    api.post<{ data: Insight360Preview }>(`${BASE}/definitions/${uuid}/preview`, payload).then(unwrap<Insight360Preview>),
  recipients: (): Promise<Insight360Recipient[]> =>
    api.get<{ data: Insight360Recipient[] }>(`${BASE}/recipients`).then(unwrap<Insight360Recipient[]>),
  requestExport: (uuid: string, payload: { format: Insight360Export["format"]; filters?: Insight360Filter[]; sorts?: Insight360Sort[] }): Promise<Insight360Export> =>
    api.post<{ data: Insight360Export }>(`${BASE}/definitions/${uuid}/exports`, payload).then(unwrap<Insight360Export>),
  exports: (params?: Record<string, unknown>): Promise<{ items: Insight360Export[]; meta: Insight360PageMeta }> =>
    api.get<{ data: Insight360Export[]; meta: Insight360PageMeta }>(`${BASE}/exports`, { params })
      .then((response) => ({ items: response.data.data, meta: response.data.meta })),
  exportStatus: (uuid: string): Promise<Insight360Export> =>
    api.get<{ data: Insight360Export }>(`${BASE}/exports/${uuid}`).then(unwrap<Insight360Export>),
  downloadExport: async (url: string, fileName: string): Promise<void> => {
    const response = await api.get<Blob>(url, { responseType: "blob" });
    const objectUrl = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(objectUrl);
  },
  saveView: (uuid: string, payload: { name: string; filters?: Insight360Filter[]; sorts?: Insight360Sort[]; is_pinned?: boolean }): Promise<Insight360SavedView> =>
    api.post<{ data: Insight360SavedView }>(`${BASE}/definitions/${uuid}/saved-views`, payload).then(unwrap<Insight360SavedView>),
  savedViews: (): Promise<{ items: Insight360SavedView[]; meta: Insight360PageMeta }> =>
    api.get<{ data: Insight360SavedView[]; meta: Insight360PageMeta }>(`${BASE}/saved-views`)
      .then((response) => ({ items: response.data.data, meta: response.data.meta })),
  deleteSavedView: (uuid: string): Promise<void> => api.delete(`${BASE}/saved-views/${uuid}`).then(() => undefined),
  shareReport: (uuid: string, payload: { recipient_user_id: number; can_export: boolean; expires_at?: string | null }): Promise<Insight360Share> =>
    api.post<{ data: Insight360Share }>(`${BASE}/definitions/${uuid}/shares`, payload).then(unwrap<Insight360Share>),
  shareExternally: (uuid: string, payload: { email?: string; expires_at?: string; can_export?: boolean }): Promise<Insight360ExternalShare> =>
    api.post<{ data: Insight360ExternalShare }>(`${BASE}/definitions/${uuid}/external-shares`, payload).then(unwrap<Insight360ExternalShare>),
  receivedShares: (): Promise<{ items: Insight360Share[]; meta: Insight360PageMeta }> =>
    api.get<{ data: Insight360Share[]; meta: Insight360PageMeta }>(`${BASE}/shares/received`)
      .then((response) => ({ items: response.data.data, meta: response.data.meta })),
  schedules: (): Promise<{ items: Insight360Schedule[]; meta: Insight360PageMeta }> =>
    api.get<{ data: Insight360Schedule[]; meta: Insight360PageMeta }>(`${BASE}/schedules`)
      .then((response) => ({ items: response.data.data, meta: response.data.meta })),
  createSchedule: (payload: Insight360SchedulePayload): Promise<Insight360Schedule> =>
    api.post<{ data: Insight360Schedule }>(`${BASE}/schedules`, payload).then(unwrap<Insight360Schedule>),
  updateSchedule: (uuid: string, payload: Partial<Insight360SchedulePayload>): Promise<Insight360Schedule> =>
    api.put<{ data: Insight360Schedule }>(`${BASE}/schedules/${uuid}`, payload).then(unwrap<Insight360Schedule>),
  deleteSchedule: (uuid: string): Promise<void> => api.delete(`${BASE}/schedules/${uuid}`).then(() => undefined),
  runScheduleNow: (uuid: string): Promise<void> => api.post(`${BASE}/schedules/${uuid}/run-now`).then(() => undefined),
};
