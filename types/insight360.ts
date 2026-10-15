export type Insight360Readiness = "ready" | "partial" | "blocked" | "unavailable";

export type Insight360Sensitivity = "internal" | "employee" | "pii" | "salary";

export interface Insight360Report {
  key: string;
  name: string;
  category: string;
  source_modules: string[];
  refresh_tier: "live" | "on_demand" | "cached_15m" | "nightly";
  sensitivity: Insight360Sensitivity;
  readiness: Insight360Readiness;
  status: "proposed" | "active" | "archived";
}

export interface Insight360Provider {
  key: string;
  label: string;
  source_module: string;
  readiness: Exclude<Insight360Readiness, "blocked">;
  capabilities: string[];
  field_count: number;
  queryable: boolean;
}

export interface Insight360Field {
  key: string;
  label: string;
  type: string;
  kind: "dimension" | "measure";
  sensitivity: Insight360Sensitivity;
  operators: string[];
  aggregations: string[];
  queryable: boolean;
}

export interface Insight360Filter {
  field: string;
  operator: string;
  value?: unknown;
}

export interface Insight360Sort {
  field: string;
  direction: "asc" | "desc";
}

export interface Insight360DefinitionShape {
  fields: string[];
  group_by?: string[];
  aggregations?: Array<{
    field: string;
    function: "count" | "count_distinct" | "sum" | "avg" | "min" | "max";
    alias?: string;
  }>;
  filters?: Insight360Filter[];
  sorts?: Insight360Sort[];
}

export interface Insight360ReportDefinition {
  uuid: string;
  report_key: string;
  name: string;
  description: string | null;
  category: string;
  primary_provider: string;
  definition: Insight360DefinitionShape;
  sensitivity: Insight360Sensitivity;
  refresh_tier: "live" | "on_demand" | "cached_15m" | "nightly";
  status: "draft" | "active" | "archived";
  version: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export type Insight360DefinitionPayload = Omit<
  Insight360ReportDefinition,
  "uuid" | "version" | "is_system" | "created_at" | "updated_at"
>;

export interface Insight360PageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Insight360Preview {
  run: {
    uuid: string;
    status: "complete" | "failed";
    duration_ms: number;
    data_as_of: string;
  };
  columns: string[];
  rows: Array<Record<string, unknown>>;
  meta: Insight360PageMeta;
}

export interface Insight360Recipient {
  id: number;
  name: string;
  email: string;
}

export interface Insight360Export {
  uuid: string;
  run_uuid: string;
  report_name: string;
  format: "csv" | "xlsx" | "pdf";
  status: "pending" | "processing" | "complete" | "failed" | "expired";
  file_name: string | null;
  file_size_bytes: number | null;
  download_url: string | null;
  expires_at: string | null;
  downloaded_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface Insight360SavedView {
  uuid: string;
  name: string;
  filters: Insight360Filter[];
  sorts: Insight360Sort[];
  is_pinned: boolean;
  report: { uuid: string; name: string; category: string };
  created_at: string;
}

export interface Insight360Share {
  uuid: string;
  can_export: boolean;
  expires_at: string | null;
  recipient?: Insight360Recipient;
  report: { uuid: string; name: string; sensitivity: Insight360Sensitivity };
}

export interface Insight360Schedule {
  uuid: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  day_of_week: number | null;
  day_of_month: number | null;
  run_time: string;
  timezone: string;
  format: "csv" | "xlsx" | "pdf";
  recipient_user_ids: number[];
  filters: Insight360Filter[];
  is_active: boolean;
  last_run_at: string | null;
  last_status: string | null;
  next_run_at: string | null;
  report: { uuid: string; name: string; sensitivity: Insight360Sensitivity };
}

export interface Insight360SchedulePayload {
  report_uuid: string;
  name: string;
  frequency: Insight360Schedule["frequency"];
  day_of_week?: number | null;
  day_of_month?: number | null;
  run_time: string;
  timezone: string;
  format: Insight360Export["format"];
  recipient_user_ids: number[];
  filters?: Insight360Filter[];
  is_active?: boolean;
}

export type Insight360WidgetType = "kpi" | "bar" | "line" | "donut" | "table";

export interface Insight360WidgetDescriptor {
  uuid: string;
  widget_key: string;
  name: string;
  description: string | null;
  widget_type: Insight360WidgetType;
  primary_provider: string;
  sensitivity: Insight360Sensitivity;
  refresh_tier: "live" | "cached_15m" | "nightly";
  display_config: {
    category_key?: string;
    value_key?: string;
    format?: "number" | "minutes" | "currency";
    currency?: string;
  };
}

export interface Insight360WidgetData extends Insight360WidgetDescriptor {
  data: {
    columns: string[];
    rows: Array<Record<string, unknown>>;
  };
  freshness: {
    cache_state: "live" | "hit" | "miss" | "refreshed";
    data_as_of: string | null;
    expires_at: string | null;
  };
}

export interface Insight360LayoutItem {
  widget_key: string;
  order: number;
  column_span: 1 | 2;
  is_visible: boolean;
}

export interface Insight360Dashboard {
  layout: {
    uuid: string | null;
    name: string;
    is_default: boolean;
    items: Insight360LayoutItem[];
  };
  widgets: Insight360WidgetData[];
  scope: { company_id: number; user_id: number };
}

export interface Insight360TrendMetric {
  key: "headcount_total" | "workforce_cost" | "absenteeism_rate";
  label: string;
  unit: "employees" | "PKR" | "percent";
  sensitivity: Insight360Sensitivity;
  latest_value: number | null;
  change: number | null;
  data_as_of: string | null;
  points: Array<{
    uuid: string;
    date: string;
    value: number;
    numerator: number | null;
    denominator: number | null;
    source_count: number;
    status: "reconciled" | "variance";
  }>;
}

export interface Insight360Trends {
  metrics: Insight360TrendMetric[];
  window: { from: string; to: string };
  source_note: string;
}

export interface Insight360Forecast {
  uuid: string;
  as_of_date: string;
  horizon_days: number;
  current_headcount: number;
  expected_exits: number;
  projected_headcount: number;
  confidence: "low" | "medium" | "high";
  basis: Record<string, unknown>;
  computed_at: string;
}

export interface Insight360Forecasts {
  forecasts: Insight360Forecast[];
  method_note: string;
}

export interface Insight360RefreshJob {
  uuid: string;
  job_type: "snapshots" | "attrition" | "catalogue";
  status: "running" | "success" | "failed";
  records_processed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

export interface Insight360ExternalShare {
  uuid: string;
  public_url: string;
  shared_with_email: string | null;
  can_export: boolean;
  expires_at: string;
}

export interface Insight360PredictiveOverview {
  model: {
    uuid: string;
    key: string;
    name: string;
    version: number;
    description: string;
    factors: Array<{ key: string; label: string; weight: number; window_days: number | null }>;
    thresholds: { low_max: number; medium_max: number; high_min: number };
    approved_at: string | null;
  };
  as_of_date: string | null;
  summary: { scored: number; low: number; medium: number; high: number; average_coverage: number };
  forecast: null | {
    uuid: string;
    horizon_days: number;
    current_headcount: number;
    expected_exits: number;
    projected_headcount: number;
    confidence: "low" | "medium" | "high";
    basis: Record<string, unknown>;
    computed_at: string;
  };
  scores: Array<{
    uuid: string;
    employee_code: string | null;
    score: number;
    risk_level: "low" | "medium" | "high";
    coverage_percent: number;
    factors: Array<{
      key: string;
      label: string;
      weight: number;
      raw_value: number;
      display_value: string;
      normalized_risk: number;
      contribution: number;
      window_days: number | null;
    }>;
    missing_signals: string[];
    computed_at: string;
  }>;
  guardrail: string;
}

export interface Insight360BenchmarkOverview {
  benchmarks: Array<{
    uuid: string;
    metric_key: string;
    name: string;
    peer_group: string;
    benchmark_value: number;
    actual_value: number | null;
    variance: number | null;
    variance_percent: number | null;
    unit: string;
    confidence: "low" | "medium" | "high";
    effective_from: string;
    effective_to: string | null;
    source_name: string;
    source_url: string | null;
    data_as_of: string | null;
  }>;
  source_note: string;
}

export interface Insight360KpiTarget {
  uuid: string;
  metric_key: string;
  name: string;
  direction: "higher_is_better" | "lower_is_better";
  target_value: number;
  warning_value: number;
  critical_value: number;
  unit: string;
  is_active: boolean;
  owner: Insight360Recipient | null;
}

export interface Insight360KpiBreach {
  uuid: string;
  target: { uuid: string; name: string; metric_key: string; unit: string } | null;
  snapshot_date: string | null;
  observed_value: number;
  status: "on_track" | "warning" | "critical";
  comparison: { direction: string; target: number; warning: number; critical: number; variance_to_target: number };
  evaluated_at: string;
  notified_at: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
}

export interface Insight360KpiOverview {
  targets: Insight360KpiTarget[];
  breaches: Insight360KpiBreach[];
  metric_catalogue: Array<{ key: string; label: string; unit: string; sensitivity: Insight360Sensitivity }>;
}

export interface Insight360CatalogueWaveReport {
  key: string;
  name: string;
  category: string;
  readiness: "ready" | "blocked";
  blocker: string | null;
  refresh_tier: "live" | "on_demand" | "cached_15m" | "nightly";
  sensitivity: Insight360Sensitivity;
  definition_uuid: string | null;
  grain: string | null;
  formula: string | null;
  sources: string[];
  caveat: string | null;
  can_manage?: boolean;
  can_signoff?: boolean;
  technical_status: "pending" | "passed" | "failed" | "blocked";
  signoff_status: "pending_sme" | "approved" | "rejected" | "not_applicable";
  signed_off_at: string | null;
  reconciliation: null | {
    status: "passed" | "failed";
    source_row_count: number;
    materialized_row_count: number;
    maximum_variance: number;
    quality_checks: {
      duplicate_row_keys: number;
      missing_employee_codes: number;
      missing_employee_names: number;
      null_metric_values: number;
    };
    data_as_of: string;
    reconciled_at: string;
  };
}

export interface Insight360CatalogueWaveOverview {
  summary: {
    total: number;
    source_ready: number;
    blocked: number;
    technically_passed: number;
    sme_approved: number;
  };
  reports: Insight360CatalogueWaveReport[];
  permissions: { can_manage: boolean; can_signoff: boolean };
}

export interface Insight360CatalogueInventoryReport {
  key: string;
  name: string;
  category: string;
  release_status: "released" | "blocked" | "replaced";
  dependency: string | null;
  replaced_by: string | null;
  launch_candidate: boolean;
  executable: boolean;
}

export interface Insight360CatalogueInventory {
  summary: {
    total: number;
    released: number;
    blocked: number;
    replaced: number;
    launch_candidates: number;
    executable_launch_reports: number;
    closed: number;
  };
  categories: Record<string, number>;
  reports: Insight360CatalogueInventoryReport[];
}

export interface Insight360ReleaseCheck {
  key: string;
  category: string;
  label: string;
  target: string;
  severity: "release_blocker" | "required";
  is_automated: boolean;
  status: "pending" | "passed" | "failed" | "waived";
  evidence: string | null;
  verified_by: string | null;
  verified_at: string | null;
}

export interface Insight360ReleaseReadiness {
  summary: {
    total: number;
    passed: number;
    pending: number;
    failed: number;
    waived: number;
    open_release_blockers: number;
    release_ready: boolean;
  };
  permissions: { can_manage: boolean };
  checks: Insight360ReleaseCheck[];
}

export interface Insight360ReleaseAuditRun {
  uuid: string;
  status: "pending" | "running" | "complete" | "failed";
  sample_size: number;
  metrics: null | {
    dashboard: { samples: number; p50_ms: number; p95_ms: number; max_ms: number; widget_count: number };
    preview: { samples: number; p50_ms: number; p95_ms: number; max_ms: number; report_key: string; row_limit: number };
    integrity: { tenant_linkage_mismatches: number; duplicate_row_keys: number; latest_reconciliations: number; failed_latest_reconciliations: number };
    queue: { pending_jobs: number; stale_jobs: number; failed_jobs: number };
  };
  checks: Record<string, { status: "pending" | "passed" | "failed"; evidence: string }> | null;
  requested_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface Insight360Overview {
  summary: {
    launch_reports: number;
    source_providers: number;
    ready_providers: number;
    blocked_reports: number;
  };
  reports: Insight360Report[];
  providers: Insight360Provider[];
  permissions: {
    can_create: boolean;
    can_export: boolean;
    can_manage_dashboards: boolean;
  };
}
