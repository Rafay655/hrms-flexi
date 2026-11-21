import type {FiStatus} from '@/app/(system)/flexi-import/_components/status';

/** Flexi Import dashboard API response. */
export interface ImportDashboardData {
  month: string;
  month_label: string;
  timezone: string;
  snapshot_at: string;
  is_current_month: boolean;
  kpi: {batches_created:number;successful_rows:number;failed_processing_rows:number;processed_rows:number;pending_approvals:number|null;saved_templates:number|null};
  status_total:number;
  status_breakdown:Array<{status:FiStatus;label:string;count:number}>;
  trend:Array<{month:string;label:string;batches_created:number;completed_batches:number}>;
  scope_breakdown:Array<{import_type:string;label:string;count:number}>;
  row_outcomes:{successful:number;failed:number;skipped:number;total:number};
  needs_attention:Array<{key:string;label:string;count:number|null;hint:string}>;
  template_library:{total:number;ready:number;needs_revision:number}|null;
  active_batches:Array<{uuid:string;file_name:string;import_type:string;import_type_label:string;status:FiStatus;total_rows:number;processed_rows:number;progress:number}>;
  recent_batches:Array<{uuid:string;file_name:string;import_type:string;import_type_label:string;status:FiStatus;total_rows:number;processed_rows:number;successful_rows:number;failed_rows:number;skipped_rows:number;initiated_by:{id:string;name:string}|null;created_at:string}>;
}
