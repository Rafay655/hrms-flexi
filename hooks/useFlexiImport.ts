/**
 * hooks/useFlexiImport.ts
 * FlexiImport Module 1.7 — TanStack Query hooks.
 *
 * KEY BEHAVIOUR — 3-second polling:
 *   useImportBatch() uses `refetchInterval` to poll every 3 s while the batch
 *   is in an active state (uploaded | validating | processing). The interval is
 *   returned as `false` once a terminal status is reached, stopping the poll
 *   automatically without manual cleanup.
 *
 * Do NOT add manual setTimeout / setInterval in page components — use this hook.
 */

import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { flexiImportService } from '@/services/flexi-import.service';
import { isBatchActive } from '@/types/flexi-import';
import type { BatchListParams } from '@/types/flexi-import';

// ── Query key factory ──────────────────────────────────────────────────────────

export const importKeys = {
  all: ['flexi-import'] as const,
  lists:     ()           => [...importKeys.all, 'list']                as const,
  list:      (p: BatchListParams) => [...importKeys.lists(), p]         as const,
  detail:    (uuid: string) => [...importKeys.all, 'detail', uuid]      as const,
  fieldDefs: (type: string) => [...importKeys.all, 'field-defs', type]  as const,
  columnMaps:(type?: string) => [...importKeys.all, 'column-maps', type ?? 'all'] as const,
  dashboard: ()           => [...importKeys.all, 'dashboard']           as const,
};

// ── Queries ────────────────────────────────────────────────────────────────────

/**
 * Paginated batch list with 30-second background stale time.
 * Uses `placeholderData` so the table doesn't flash on page navigation.
 */
export function useBatchList(params: BatchListParams = {}) {
  return useQuery({
    queryKey: importKeys.list(params),
    queryFn:  () => flexiImportService.getBatchList(params),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

/**
 * Full batch detail — the primary polling hook.
 *
 * `refetchInterval` dynamically returns:
 *   • 3_000 ms  → while status is 'uploaded' | 'validating' | 'processing'
 *   • false     → for every other status (terminal or settled)
 *
 * staleTime is 0 so the cache is never considered fresh; every mount gets a
 * re-fetch, ensuring the UI is always up-to-date when a user navigates back.
 */
export function useImportBatch(uuid: string | null) {
  return useQuery({
    queryKey: importKeys.detail(uuid ?? ''),
    queryFn:  () => flexiImportService.getBatchDetail(uuid!),
    enabled:  !!uuid,
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return isBatchActive(status) ? 3_000 : false;
    },
  });
}

/**
 * Field definitions for an import type (required/optional fields, enum values).
 * 5-minute stale time — field definitions almost never change mid-session.
 */
export function useFieldDefinitions(importType: string | null) {
  return useQuery({
    queryKey: importKeys.fieldDefs(importType ?? ''),
    queryFn:  () => flexiImportService.getFieldDefinitions(importType!),
    enabled:  !!importType,
    staleTime: 5 * 60_000,
  });
}

/**
 * Saved column-mapping templates for an import type.
 * Scoped by import_type when provided; returns all templates otherwise.
 */
export function useColumnMaps(importType?: string) {
  return useQuery({
    queryKey: importKeys.columnMaps(importType),
    queryFn:  () => flexiImportService.getColumnMaps(importType),
    staleTime: 60_000,
  });
}

/**
 * Dashboard KPI aggregate + recent-batch list.
 * 60-second stale time matches the existing page's staleTime.
 */
export function useImportDashboard() {
  return useQuery({
    queryKey: importKeys.dashboard(),
    queryFn:  flexiImportService.getDashboard,
    staleTime: 60_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

/**
 * Triggers ProcessImportBatchJob.
 * Seeds the detail cache immediately so polling starts from the latest state.
 */
export function useProcessBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => flexiImportService.process(uuid),
    onSuccess: (batch) => {
      qc.setQueryData(importKeys.detail(batch.uuid), batch);
      qc.invalidateQueries({ queryKey: importKeys.lists() });
      qc.invalidateQueries({ queryKey: importKeys.dashboard() });
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: 'Failed to start processing. Please try again.' });
    },
  });
}

/**
 * Dispatches RollbackImportBatchJob.
 * 24-hour window is enforced server-side; a 422 response triggers the error toast.
 */
export function useRollbackBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => flexiImportService.rollback(uuid),
    onSuccess: (batch) => {
      toast.success('Rollback queued. Records will be removed shortly.');
      qc.setQueryData(importKeys.detail(batch.uuid), batch);
      qc.invalidateQueries({ queryKey: importKeys.lists() });
      qc.invalidateQueries({ queryKey: importKeys.dashboard() });
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: 'Rollback failed. The 24-hour window may have expired.' });
    },
  });
}

/**
 * Updates a saved column-map template (name, mapping, or is_default flag).
 */
export function useUpdateColumnMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { name?: string; mapping?: Record<string, string>; is_default?: boolean };
    }) => flexiImportService.updateColumnMap(id, payload),
    onSuccess: () => {
      toast.success('Column mapping template updated.');
      qc.invalidateQueries({ queryKey: importKeys.columnMaps() });
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: 'Failed to update mapping template.' });
    },
  });
}

/**
 * Sets a column-map template as the default for its import_type.
 */
export function useSetDefaultColumnMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flexiImportService.setDefaultColumnMap(id),
    onSuccess: () => {
      toast.success('Default template updated.');
      qc.invalidateQueries({ queryKey: importKeys.columnMaps() });
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: 'Failed to set default template.' });
    },
  });
}

/**
 * Hard-deletes a column-map template.
 */
export function useDeleteColumnMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flexiImportService.deleteColumnMap(id),
    onSuccess: () => {
      toast.success('Mapping template deleted.');
      qc.invalidateQueries({ queryKey: importKeys.columnMaps() });
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: 'Failed to delete mapping template.' });
    },
  });
}
