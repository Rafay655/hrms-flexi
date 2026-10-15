/** Module types matching the backend ph_approval_chains.module_type column. */
export type ChainModuleType =
  | 'career_event'
  | 'exit'
  | 'leave'
  | 'salary'
  | 'loan'
  | 'ess'
  | 'overtime';

/**
 * A single step in an approval chain, as returned by ApprovalChainStepResource.
 * Fields match ph_approval_chain_steps columns exactly.
 */
export interface ChainStep {
  step_number: number;
  /** Machine-readable role name, e.g. "hr_manager" */
  role_key: string;
  /** Human-readable label shown to approvers, e.g. "HR Manager" */
  role_label: string;
  /** Deadline in hours — null means no SLA enforced */
  sla_hours: number | null;
  is_required: boolean;
}

/**
 * Full approval chain, as returned by ApprovalChainResource.
 * steps is eager-loaded and always present in list/show responses.
 */
export interface ApprovalChain {
  uuid: string;
  module_type: ChainModuleType;
  sub_type: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  steps: ChainStep[];
  created_at: string;
}

// ── Payload types (sent to backend) ──────────────────────────────────────────

/** Step payload for create/update — step_number is assigned by the backend (array index). */
export interface ChainStepPayload {
  role_key: string;
  role_label: string;
  sla_hours?: number | null;
  is_required?: boolean;
}

/** POST /people-hub/approval-chains */
export interface CreateChainPayload {
  module_type: ChainModuleType;
  sub_type?: string | null;
  name: string;
  description?: string | null;
  is_active: boolean;
  steps: ChainStepPayload[];
}

/** PUT /people-hub/approval-chains/:uuid */
export interface UpdateChainPayload {
  name?: string;
  description?: string | null;
  is_active?: boolean;
  steps?: ChainStepPayload[];
}

// ── Role type (from GET /connect-central/access/roles) ───────────────────────

export interface ApiRole {
  name: string;
  permissions: string[];
  users_count?: number;
}
