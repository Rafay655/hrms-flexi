export interface PageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface AmsCategory {
  uuid: string;
  name: string;
  code: string;
  icon: string | null;
  depreciation_method: 'straight_line' | 'wdv' | 'none';
  useful_life_years: number;
  residual_value_pct: number;
  requires_serial: boolean;
  is_active: boolean;
  created_at: string | null;
}

export interface AmsAssetType {
  uuid: string;
  name: string;
  code: string | null;
  brand_make: string | null;
  category: { uuid: string; name: string } | null;
  depreciation_override: 'straight_line' | 'wdv' | 'none' | null;
  useful_life_override: number | null;
  is_active: boolean;
}

export interface AmsVendor {
  uuid: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  ntn_number: string | null;
  vendor_type: string | null;
  is_active: boolean;
}

export type AmsAssetStatus = 'available' | 'assigned' | 'in_repair' | 'disposed' | 'lost';
export type AmsAssetCondition = 'new' | 'good' | 'fair' | 'poor';

export interface AmsAsset {
  uuid: string;
  asset_tag: string;
  name: string;
  make: string | null;
  model: string | null;
  serial_number: string | null;
  category: { uuid: string; name: string } | null;
  asset_type: { uuid: string; name: string } | null;
  vendor: { uuid: string; name: string } | null;
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_expiry: string | null;
  status: AmsAssetStatus;
  condition: AmsAssetCondition;
  qr_code: string | null;
  image_path: string | null;
  depreciation_method: 'straight_line' | 'wdv' | 'none';
  useful_life_years: number;
  residual_value_pct: number;
  valuation_status: ValuationStatus;
  book_value: string | null;
  accumulated_depreciation: string | null;
  current_assignment: { employee_name: string | null; assigned_date: string | null } | null;
  pending_disposal: AmsPendingDisposal | null;
  created_at: string | null;
}

export interface AmsAssignment {
  uuid: string;
  asset: { uuid: string; asset_tag: string; name: string } | null;
  employee: { uuid: string } | null;
  assigned_date: string | null;
  expected_return_date: string | null;
  returned_date: string | null;
  assignment_type: 'permanent' | 'temporary' | 'project';
  condition_at_issue: AmsAssetCondition;
  condition_at_return: 'good' | 'fair' | 'poor' | 'damaged' | null;
  is_overdue: boolean;
  remarks: string | null;
  closure_reason: 'disposed' | 'lost' | null;
}

export interface AmsHandoverNote {
  uuid: string;
  note_type: 'issue' | 'return';
  note_date: string | null;
  asset_ids: number[];
  employee_signed_at: string | null;
  hr_signed_at: string | null;
  is_acknowledged: boolean;
  pdf_path: string | null;
}

export type DisposalMethod = 'sold' | 'scrapped' | 'donated' | 'lost' | 'other';
export type DisposalStatus = 'pending_approval' | 'approved' | 'rejected';
export type MaintenanceOutcome = 'completed' | 'disposed' | 'lost' | 'cancelled' | null;

export interface AmsMaintenanceRecord {
  uuid: string;
  vendor: { uuid: string; name: string } | null;
  description: string;
  started_date: string | null;
  ended_date: string | null;
  outcome: MaintenanceOutcome;
  cost: string | null;
  notes: string | null;
  is_open: boolean;
}

export interface AmsPendingDisposal {
  uuid: string;
  status: DisposalStatus;
  disposal_method: DisposalMethod;
  initiated_at: string | null;
}

export interface AmsDisposal {
  uuid: string;
  asset: { uuid: string; asset_tag: string; name: string } | null;
  disposal_method: DisposalMethod;
  reason: string;
  disposed_at: string | null;
  book_value_at_disposal: string | null;
  sale_proceeds: string | null;
  gain_or_loss: string | null;
  status: DisposalStatus;
  initiated_by: number;
  initiated_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  rejected_by: number | null;
  rejected_at: string | null;
}

export interface AmsDashboardSummary {
  total_assets: number;
  assigned: number;
  available: number;
  in_repair: number;
  disposed: number;
  total_asset_value: number;
  total_book_value: number;
  assets_excluded_from_book_value: number;
}

export interface UtilizationRow {
  category_id: string | null;
  category_name: string | null;
  total: number;
  assigned: number;
  available: number;
  in_repair: number;
  disposed: number;
  lost: number;
  pct_assigned: number | null;
  pct_available: number | null;
}
export interface UtilizationReport {
  rows: UtilizationRow[];
  totals: UtilizationRow;
}

export interface AgingRow {
  asset_uuid: string;
  asset_tag: string;
  name: string;
  category_name: string | null;
  purchase_date: string;
  useful_life_years: number;
  age_years: number;
  pct_life_consumed: number;
}
export interface AgingReport {
  rows: AgingRow[];
  excluded_count: number;
}

export interface WarrantyRow {
  asset_uuid: string;
  asset_tag: string;
  name: string;
  category_name: string | null;
  warranty_expiry: string;
  days_remaining: number;
}
export interface WarrantyReport {
  rows: WarrantyRow[];
  excluded_count: number;
}

export interface DepreciationCategoryRow {
  category_id: string | null;
  category_name: string | null;
  asset_count: number;
  total_purchase_price: string;
  total_book_value: string;
  total_accumulated_depreciation: string;
  excluded_count: number;
}
export interface DepreciationByCategoryReport {
  rows: DepreciationCategoryRow[];
  totals: DepreciationCategoryRow;
}

export interface AssetAlertItem {
  asset_uuid: string;
  asset_tag: string;
  name: string;
  category_name: string | null;
  metric: string;
}
export interface AlertsResponse {
  warranty_expiring: { count: number; items: AssetAlertItem[] };
  aging_outliers: { count: number; items: AssetAlertItem[] };
  near_end_of_life: { count: number; items: AssetAlertItem[] };
}

export interface DepreciationScheduleRow {
  year: number;
  opening_value: string;
  depreciation_charge: string;
  accumulated_depreciation: string;
  closing_value: string;
  months_depreciated: number;
}

export type ValuationStatus = 'available' | 'none' | 'missing_data' | 'invalid_configuration' | 'pre_acquisition';

export interface DepreciationScheduleResponse {
  valuation_status: ValuationStatus;
  depreciation_method: 'straight_line' | 'wdv' | 'none';
  book_value: string | null;
  accumulated_depreciation: string | null;
  schedule: DepreciationScheduleRow[];
}

export type LicenseBillingTerm = 'monthly' | 'annual' | 'perpetual';
export type LicenseExpiryState = 'active' | 'expired';

export interface AmsSoftwareLicense {
  uuid: string;
  name: string;
  publisher_name: string | null;
  vendor: { uuid: string; name: string } | null;
  seats_purchased: number;
  active_assignments: number;
  available_seats: number;
  cost_per_seat: string | null;
  period_cost: string | null;
  billing_term: LicenseBillingTerm;
  purchase_date: string | null;
  expiry_date: string | null;
  expiry_state: LicenseExpiryState;
  notes: string | null;
  created_at: string | null;
}

export interface AmsLicenseAssignment {
  uuid: string;
  employee: { uuid: string } | null;
  asset: { uuid: string; asset_tag: string; name: string } | null;
  assigned_date: string | null;
  assigned_by: number;
  revoked_date: string | null;
  revoked_by: number | null;
}

export interface AmsAssetBundleItem {
  asset_type_uuid: string;
  asset_type_name: string;
  quantity: number;
}

export interface AmsAssetBundle {
  uuid: string;
  name: string;
  description: string | null;
  active: boolean;
  items: AmsAssetBundleItem[];
  created_at: string | null;
}

export type BundleApplicationStatus = 'open' | 'partially_fulfilled' | 'fulfilled' | 'cancelled';

export interface AmsBundleApplicationLineItem {
  uuid: string;
  asset_type_name_snapshot: string;
  quantity_requested: number;
  fulfilled: number;
  outstanding: number;
  eligible_assets?: { uuid: string; asset_tag: string; name: string }[];
}

export interface AmsBundleApplication {
  uuid: string;
  bundle_name_snapshot: string;
  employee?: { uuid: string; name: string | null } | null;
  status: BundleApplicationStatus;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  items?: AmsBundleApplicationLineItem[];
  created_at: string | null;
}
