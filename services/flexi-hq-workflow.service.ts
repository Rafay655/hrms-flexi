import { api } from "@/lib/api";

const BASE = "/flexi-hq";

export interface WorkflowDefinition {
  uuid: string;
  module_key: string;
  action_key: string;
  trigger_event: string | null;
  name: string;
  description: string | null;
  status: "draft" | "active" | "inactive" | "archived";
  version: number;
  priority: number;
  is_default: boolean;
  steps_count?: number;
  steps?: WorkflowStep[];
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowStep {
  uuid: string;
  step_order: number;
  step_key: string;
  step_name: string;
  step_type: "approval" | "notification" | "field_update" | "system_action" | "webhook" | "end";
  approval_mode: "sequential" | "parallel" | "any_one" | "all";
  approver_type: string | null;
  approver_ref: string | null;
  required_approval_count?: number | null;
  sla_hours?: number | null;
  reminder_minutes?: number | null;
  escalation_type?: string | null;
  escalation_ref?: string | null;
  allow_return?: boolean;
  allow_delegate?: boolean;
  allow_skip?: boolean;
  allow_self_approval?: boolean;
}

export interface WorkflowPayload {
  module_key: string;
  action_key: string;
  trigger_event?: string | null;
  name: string;
  description?: string | null;
  priority?: number;
  status?: "draft" | "active" | "inactive" | "archived";
  is_default?: boolean;
  version?: number;
  condition_mode?: "all" | "any" | "custom";
  conditions_json?: Record<string, unknown> | null;
  metadata_json?: Record<string, unknown> | null;
}

export interface WorkflowStepPayload {
  step_order: number;
  step_key: string;
  step_name: string;
  step_type?: WorkflowStep["step_type"];
  approval_mode?: WorkflowStep["approval_mode"];
  approver_type?: string | null;
  approver_ref?: string | null;
  required_approval_count?: number | null;
  sla_hours?: number | null;
  reminder_minutes?: number | null;
  escalation_type?: string | null;
  escalation_ref?: string | null;
  allow_return?: boolean;
  allow_delegate?: boolean;
  allow_skip?: boolean;
  allow_self_approval?: boolean;
}

export interface WorkflowInstance {
  uuid: string;
  workflow_definition_id?: number;
  module_key?: string;
  action_key?: string;
  entity_type?: string;
  entity_id?: string | number;
  status: string;
  current_step_id?: number | null;
  started_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApprovalRule {
  uuid: string;
  module_key: string;
  action_key: string;
  name: string;
  rule_name?: string;
  approver_type: string;
  approver_ref: string | null;
  fallback_approver_type?: string | null;
  fallback_approver_ref?: string | null;
  escalation_type?: string | null;
  escalation_ref?: string | null;
  conditions_json?: Record<string, unknown> | null;
  priority: number;
  is_active: boolean;
  created_at?: string;
}

export interface ApprovalRulePayload {
  module_key: string;
  action_key: string;
  name: string;
  priority?: number;
  conditions_json?: Record<string, unknown> | null;
  approver_type: string;
  approver_ref?: string | null;
  fallback_approver_type?: string | null;
  fallback_approver_ref?: string | null;
  escalation_type?: string | null;
  escalation_ref?: string | null;
  is_active?: boolean;
}

export interface PendingApproval {
  uuid?: string;
  step_uuid?: string;
  workflow_name?: string;
  module_key?: string;
  action_key?: string;
  status?: string;
  assigned_at?: string;
  sla_due_at?: string | null;
  due_at?: string | null;
  step_name?: string;
  assigned_role?: string | null;
  instance?: {
    uuid?: string;
    module_key?: string;
    action_key?: string;
    status?: string;
    definition?: {
      name?: string;
    } | null;
  } | null;
  definition?: {
    name?: string;
  } | null;
}

export interface ApprovalResolutionResult {
  rule: ApprovalRule | null;
  approvers: Array<{
    id: number;
    name?: string;
    email?: string;
  }>;
}

function unwrapList<T>(payload: unknown): T[] {
  const root = payload as { data?: unknown };
  const data = root.data;

  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const inner = data as { data?: unknown; items?: unknown };
    if (Array.isArray(inner.data)) return inner.data as T[];
    if (Array.isArray(inner.items)) return inner.items as T[];
  }

  return [];
}

export async function getWorkflows(): Promise<WorkflowDefinition[]> {
  const { data } = await api.get(`${BASE}/workflows`);
  return unwrapList<WorkflowDefinition>(data);
}

export async function createWorkflow(payload: WorkflowPayload): Promise<WorkflowDefinition> {
  const { data } = await api.post(`${BASE}/workflows`, payload);
  return data.data as WorkflowDefinition;
}

export async function updateWorkflow(uuid: string, payload: Partial<WorkflowPayload>): Promise<WorkflowDefinition> {
  const { data } = await api.put(`${BASE}/workflows/${uuid}`, payload);
  return data.data as WorkflowDefinition;
}

export async function deleteWorkflow(uuid: string): Promise<void> {
  await api.delete(`${BASE}/workflows/${uuid}`);
}

export async function activateWorkflow(uuid: string): Promise<WorkflowDefinition> {
  const { data } = await api.post(`${BASE}/workflows/${uuid}/activate`);
  return data.data as WorkflowDefinition;
}

export async function deactivateWorkflow(uuid: string): Promise<WorkflowDefinition> {
  const { data } = await api.post(`${BASE}/workflows/${uuid}/deactivate`);
  return data.data as WorkflowDefinition;
}

export async function cloneWorkflow(uuid: string): Promise<WorkflowDefinition> {
  const { data } = await api.post(`${BASE}/workflows/${uuid}/clone`);
  return data.data as WorkflowDefinition;
}

export async function createWorkflowStep(uuid: string, payload: WorkflowStepPayload): Promise<WorkflowStep> {
  const { data } = await api.post(`${BASE}/workflows/${uuid}/steps`, payload);
  return data.data as WorkflowStep;
}

export async function updateWorkflowStep(
  uuid: string,
  stepUuid: string,
  payload: Partial<WorkflowStepPayload>,
): Promise<WorkflowStep> {
  const { data } = await api.put(`${BASE}/workflows/${uuid}/steps/${stepUuid}`, payload);
  return data.data as WorkflowStep;
}

export async function deleteWorkflowStep(uuid: string, stepUuid: string): Promise<void> {
  await api.delete(`${BASE}/workflows/${uuid}/steps/${stepUuid}`);
}

export async function getWorkflowInstances(): Promise<WorkflowInstance[]> {
  const { data } = await api.get(`${BASE}/workflow-instances`);
  return unwrapList<WorkflowInstance>(data);
}

export async function getApprovalMatrix(): Promise<ApprovalRule[]> {
  const { data } = await api.get(`${BASE}/approval-matrix`);
  return unwrapList<ApprovalRule>(data);
}

export async function createApprovalRule(payload: ApprovalRulePayload): Promise<ApprovalRule> {
  const { data } = await api.post(`${BASE}/approval-matrix`, payload);
  return data.data as ApprovalRule;
}

export async function updateApprovalRule(uuid: string, payload: Partial<ApprovalRulePayload>): Promise<ApprovalRule> {
  const { data } = await api.put(`${BASE}/approval-matrix/${uuid}`, payload);
  return data.data as ApprovalRule;
}

export async function deleteApprovalRule(uuid: string): Promise<void> {
  await api.delete(`${BASE}/approval-matrix/${uuid}`);
}

export async function testApprovalResolution(payload: {
  module_key: string;
  action_key: string;
  payload?: Record<string, unknown>;
}): Promise<ApprovalResolutionResult> {
  const { data } = await api.post(`${BASE}/approval-matrix/test-resolution`, payload);
  return data.data as ApprovalResolutionResult;
}

export async function getPendingApprovals(): Promise<PendingApproval[]> {
  const { data } = await api.get(`${BASE}/approvals/pending`);
  const payload = data?.data;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

export async function getSubmittedApprovals(): Promise<PendingApproval[]> {
  const { data } = await api.get(`${BASE}/approvals/submitted`);
  return unwrapList<PendingApproval>(data);
}

export async function getTeamApprovals(): Promise<PendingApproval[]> {
  const { data } = await api.get(`${BASE}/approvals/team`);
  return unwrapList<PendingApproval>(data);
}

export async function approveWorkflowStep(stepUuid: string, remarks?: string): Promise<unknown> {
  const { data } = await api.post(`${BASE}/approvals/${stepUuid}/approve`, { remarks });
  return data.data;
}

export async function rejectWorkflowStep(stepUuid: string, remarks: string): Promise<unknown> {
  const { data } = await api.post(`${BASE}/approvals/${stepUuid}/reject`, { remarks });
  return data.data;
}

export async function returnWorkflowStep(stepUuid: string, remarks: string): Promise<unknown> {
  const { data } = await api.post(`${BASE}/approvals/${stepUuid}/return`, { remarks });
  return data.data;
}

export async function getOverdueWorkflowItems(): Promise<PendingApproval[]> {
  const { data } = await api.get(`${BASE}/workflow-sla/overdue`);
  return unwrapList<PendingApproval>(data);
}
