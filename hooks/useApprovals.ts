import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { approvalService } from '@/services/approval.service';
import type {
  ApprovalQueueParams,
  ApproveStepPayload,
  RejectPayload,
  SendBackPayload,
} from '@/types/approval';
import type { CreateChainPayload, UpdateChainPayload } from '@/types/approval-chain';

// ── Key factory ────────────────────────────────────────────────────────────────

export const approvalKeys = {
  all: ['approvals'] as const,
  lists: () => [...approvalKeys.all, 'list'] as const,
  list: (params: ApprovalQueueParams) => [...approvalKeys.lists(), params] as const,
  details: () => [...approvalKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...approvalKeys.details(), uuid] as const,
};

// ── Queries ────────────────────────────────────────────────────────────────────

/**
 * Fetches the paginated approval queue with aggregate stats.
 * Use `placeholderData` so the table doesn't flash while navigating pages.
 */
export function useApprovalQueue(params: ApprovalQueueParams = {}) {
  return useQuery({
    queryKey: approvalKeys.list(params),
    queryFn: () => approvalService.getQueue(params),
    placeholderData: (prev) => prev,
    staleTime: 30_000, // 30 s — queue can be polled by multiple approvers
  });
}

/**
 * Fetches a single approval request by UUID (for the detail panel / modal).
 */
export function useApprovalDetail(uuid: string | null) {
  return useQuery({
    queryKey: approvalKeys.detail(uuid ?? ''),
    queryFn: () => approvalService.getById(uuid!),
    enabled: !!uuid,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

/**
 * Approve the current pending step of an approval request.
 * Invalidates all approval list queries so the queue refreshes.
 */
export function useApproveStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      uuid,
      stepUuid,
      payload,
    }: {
      uuid: string;
      stepUuid: string;
      payload?: ApproveStepPayload;
    }) => approvalService.approveStep(uuid, stepUuid, payload),
    onSuccess: (_, { uuid }) => {
      toast.success('Step approved successfully');
      qc.invalidateQueries({ queryKey: approvalKeys.lists() });
      qc.invalidateQueries({ queryKey: approvalKeys.detail(uuid) });
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: 'Failed to approve step. Please try again.' });
    },
  });
}

/**
 * Permanently reject an approval request.
 */
export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: RejectPayload }) =>
      approvalService.reject(uuid, payload),
    onSuccess: (_, { uuid }) => {
      toast.success('Request rejected');
      qc.invalidateQueries({ queryKey: approvalKeys.lists() });
      qc.invalidateQueries({ queryKey: approvalKeys.detail(uuid) });
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: 'Failed to reject request. Please try again.' });
    },
  });
}

/**
 * Send an approval request back for rework.
 */
export function useSendBack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: SendBackPayload }) =>
      approvalService.sendBack(uuid, payload),
    onSuccess: (_, { uuid }) => {
      toast.success('Request sent back for rework');
      qc.invalidateQueries({ queryKey: approvalKeys.lists() });
      qc.invalidateQueries({ queryKey: approvalKeys.detail(uuid) });
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: 'Failed to send back request. Please try again.' });
    },
  });
}

/**
 * Cancel an approval request (initiator or admin).
 */
export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => approvalService.cancel(uuid),
    onSuccess: (_, uuid) => {
      toast.success('Request cancelled');
      qc.invalidateQueries({ queryKey: approvalKeys.lists() });
      qc.invalidateQueries({ queryKey: approvalKeys.detail(uuid) });
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: 'Failed to cancel request. Please try again.' });
    },
  });
}

// ── Approval Chain hooks ───────────────────────────────────────────────────────

export const chainKeys = {
  all: ['approval-chains'] as const,
  lists: () => [...chainKeys.all, 'list'] as const,
};

/** Returns all approval chains for the company (client filters by module_type). */
export function useApprovalChains() {
  return useQuery({
    queryKey: chainKeys.lists(),
    queryFn: approvalService.getChains,
    staleTime: 60_000,
  });
}

export function useCreateChain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChainPayload) => approvalService.createChain(payload),
    onSuccess: () => {
      toast.success('Approval chain created');
      qc.invalidateQueries({ queryKey: chainKeys.lists() });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showApiError(e, { fallbackMessage: msg || 'Failed to create approval chain' });
    },
  });
}

export function useUpdateChain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: UpdateChainPayload }) =>
      approvalService.updateChain(uuid, payload),
    onSuccess: () => {
      toast.success('Approval chain updated');
      qc.invalidateQueries({ queryKey: chainKeys.lists() });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showApiError(e, { fallbackMessage: msg || 'Failed to update approval chain' });
    },
  });
}

export function useDeleteChain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => approvalService.deleteChain(uuid),
    onSuccess: () => {
      toast.success('Approval chain deleted');
      qc.invalidateQueries({ queryKey: chainKeys.lists() });
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: 'Failed to delete approval chain' });
    },
  });
}

// ── Role lookup (for step builder) ────────────────────────────────────────────

export const roleKeys = {
  all: ['roles'] as const,
};

/** Fetches all roles from ConnectCentral for use in the step role selector. */
export function useRoles() {
  return useQuery({
    queryKey: roleKeys.all,
    queryFn: approvalService.getRoles,
    staleTime: 5 * 60_000, // roles change rarely
  });
}
