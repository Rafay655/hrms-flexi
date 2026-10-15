export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'sent_back';
export type ApprovalModuleType =
  | 'career_event'
  | 'exit'
  | 'leave'
  | 'salary'
  | 'loan'
  | 'ess'
  | 'overtime';

export interface ApprovalRequestStep {
  uuid: string;
  step_number: number;
  status: 'pending' | 'approved' | 'rejected' | 'sent_back';
  approver_role: string | null;
  approver_user_id: number | null;
  approved_by: number | null;
  approved_at: string | null;
  comments: string | null;
}

export interface ApprovalEmployee {
  id: number;
  name: string;
  employee_code: string;
  designation: string | null;
  department: string | null;
  avatar?: string | null;
}

export interface ApprovalUser {
  id: number;
  name: string;
}

export interface ApprovalRequest {
  uuid: string;
  module_type: ApprovalModuleType;
  sub_type: string;
  status: ApprovalStatus;
  current_step: number;
  total_steps: number;
  employee: ApprovalEmployee;
  initiator: ApprovalUser;
  rejected_by: ApprovalUser | null;
  rejection_reason: string | null;
  rejected_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  steps: ApprovalRequestStep[];
  /** Convenience — the step currently awaiting action (step where status=pending). */
  current_step_record: ApprovalRequestStep | null;
  /** Arbitrary approvable payload surfaced from the polymorphic relation (shape varies by module_type). */
  approvable?: Record<string, unknown> | null;
}

export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  high_priority: number;
}

export interface PaginatedApprovalResponse {
  stats: ApprovalStats;
  data: ApprovalRequest[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApprovalQueueParams {
  status?: ApprovalStatus | 'all';
  module_type?: ApprovalModuleType | 'all';
  page?: number;
  per_page?: number;
  search?: string;
  employee_id?: number;
}

export interface ApproveStepPayload {
  comments?: string;
}

export interface RejectPayload {
  reason: string;
}

export interface SendBackPayload {
  reason: string;
  step_number?: number;
}
