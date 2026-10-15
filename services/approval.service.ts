import { api } from '@/lib/api';
import type {
  PaginatedApprovalResponse,
  ApprovalRequest,
  ApprovalQueueParams,
  ApproveStepPayload,
  RejectPayload,
  SendBackPayload,
} from '@/types/approval';
import type {
  ApprovalChain,
  CreateChainPayload,
  UpdateChainPayload,
  ApiRole,
  ChainModuleType,
} from '@/types/approval-chain';

const BASE = '/people-hub/approvals';

export const approvalService = {
  /**
   * GET /people-hub/approvals
   * Returns the paginated approval queue plus aggregate stats.
   */
  getQueue: async (params?: ApprovalQueueParams): Promise<PaginatedApprovalResponse> => {
    // Strip 'all' sentinel values — the backend expects omitted params for "no filter"
    const cleaned: Record<string, unknown> = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== 'all') cleaned[k] = v;
      }
    }
    const { data } = await api.get(BASE, { params: cleaned });
    return data.data;
  },

  /**
   * GET /people-hub/approvals/:uuid
   */
  getById: async (uuid: string): Promise<ApprovalRequest> => {
    const { data } = await api.get(`${BASE}/${uuid}`);
    return data.data;
  },

  /**
   * POST /people-hub/approvals/:uuid/steps/:stepUuid/approve
   * The approving user approves a specific workflow step.
   */
  approveStep: async (
    uuid: string,
    stepUuid: string,
    payload: ApproveStepPayload = {},
  ): Promise<ApprovalRequest> => {
    const { data } = await api.post(`${BASE}/${uuid}/steps/${stepUuid}/approve`, payload);
    return data.data;
  },

  /**
   * POST /people-hub/approvals/:uuid/reject
   * Permanently rejects the approval request.
   */
  reject: async (uuid: string, payload: RejectPayload): Promise<ApprovalRequest> => {
    const { data } = await api.post(`${BASE}/${uuid}/reject`, payload);
    return data.data;
  },

  /**
   * POST /people-hub/approvals/:uuid/send-back
   * Returns the request to the submitter or a prior step for rework.
   */
  sendBack: async (uuid: string, payload: SendBackPayload): Promise<ApprovalRequest> => {
    const { data } = await api.post(`${BASE}/${uuid}/send-back`, payload);
    return data.data;
  },

  /**
   * POST /people-hub/approvals/:uuid/cancel
   * Cancels the request (initiator or admin only).
   */
  cancel: async (uuid: string): Promise<void> => {
    await api.post(`${BASE}/${uuid}/cancel`);
  },

  // ── Approval Chain CRUD ────────────────────────────────────────────────────

  /**
   * GET /people-hub/approval-chains
   * Returns all chains for the authenticated company.
   * Filtering by module_type is done client-side (backend has no filter param).
   */
  getChains: async (): Promise<ApprovalChain[]> => {
    const { data } = await api.get('/people-hub/approval-chains');
    return data.data;
  },

  /** GET /people-hub/approval-chains/:uuid */
  getChainById: async (uuid: string): Promise<ApprovalChain> => {
    const { data } = await api.get(`/people-hub/approval-chains/${uuid}`);
    return data.data;
  },

  /** POST /people-hub/approval-chains */
  createChain: async (payload: CreateChainPayload): Promise<ApprovalChain> => {
    const { data } = await api.post('/people-hub/approval-chains', payload);
    return data.data;
  },

  /** PUT /people-hub/approval-chains/:uuid */
  updateChain: async (uuid: string, payload: UpdateChainPayload): Promise<ApprovalChain> => {
    const { data } = await api.put(`/people-hub/approval-chains/${uuid}`, payload);
    return data.data;
  },

  /** DELETE /people-hub/approval-chains/:uuid */
  deleteChain: async (uuid: string): Promise<void> => {
    await api.delete(`/people-hub/approval-chains/${uuid}`);
  },

  // ── Role lookup (for step builder) ─────────────────────────────────────────

  /**
   * GET /connect-central/access/roles
   * Returns all non-super_admin roles. Requires view-roles or manage-roles permission.
   */
  getRoles: async (): Promise<ApiRole[]> => {
    const { data } = await api.get('/connect-central/access/roles');
    return data.data;
  },
};
