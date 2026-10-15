/**
 * services/flexi-import.service.ts
 * FlexiImport Module 1.7 — API client.
 *
 * All methods delegate to the shared axios instance at @/lib/api.
 * URL prefix: /flexi-import  (backend: routes/flexi-import.php → /api/v1/flexi-import/*)
 *
 * The existing page components use /flexi-import/batches as the list/detail base;
 * this service mirrors that convention for consistency with the scaffolded UI.
 */

import { api } from '@/lib/api';
import type {
  ImportBatch,
  ImportRow,
  ImportColumnMap,
  FieldDefinition,
  PaginatedBatchResponse,
  BatchListParams,
  UploadBatchPayload,
} from '@/types/flexi-import';

const BASE = '/flexi-import';

export const flexiImportService = {
  // ── Batch lifecycle ────────────────────────────────────────────────────────

  /**
   * POST /flexi-import/batches
   * Uploads a CSV/XLSX file with its column mapping and batch config.
   * The backend immediately dispatches ValidateImportBatchJob after creation.
   */
  upload: async (payload: UploadBatchPayload): Promise<ImportBatch> => {
    const fd = new FormData();
    fd.append('file', payload.file);
    fd.append('import_type', payload.import_type);
    if (payload.import_mode)       fd.append('import_mode', payload.import_mode);
    if (payload.require_approval !== undefined) {
      fd.append('require_approval', payload.require_approval ? '1' : '0');
    }
    if (payload.column_mapping)    fd.append('column_mapping', JSON.stringify(payload.column_mapping));
    if (payload.column_map_id)     fd.append('column_map_id', payload.column_map_id);

    const { data } = await api.post(`${BASE}/batches`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  /**
   * GET /flexi-import/batches
   * Paginated list of all batches for the authenticated company.
   */
  getBatchList: async (params?: BatchListParams): Promise<PaginatedBatchResponse> => {
    const cleaned: Record<string, unknown> = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') cleaned[k] = v;
      }
    }
    const { data } = await api.get(`${BASE}/batches`, { params: cleaned });
    // Backend may wrap in data.data or return the paginated object directly
    return data.data ?? data;
  },

  /**
   * GET /flexi-import/batches/{uuid}
   * Full batch detail including field_labels, column_mapping, approval status.
   */
  getBatchDetail: async (uuid: string): Promise<ImportBatch> => {
    const { data } = await api.get(`${BASE}/batches/${uuid}`);
    return data.data;
  },

  /**
   * GET /flexi-import/batches/{uuid}/status
   * Lightweight status poll — returns progress counters.
   * Prefer getBatchDetail when full data is needed.
   */
  getBatchStatus: async (uuid: string): Promise<ImportBatch> => {
    const { data } = await api.get(`${BASE}/batches/${uuid}/status`);
    return data.data;
  },

  /**
   * POST /flexi-import/validate-mapping
   * Stateless server-side mapping validation (no batch UUID): the backend route
   * is /flexi-import/validate-mapping and expects { import_type, column_mapping,
   * csv_headers } in the body, returning the mapping report. The previous
   * /batches/{uuid}/validate-mapping URL and ImportBatch return type did not exist
   * on the backend and 404'd on every call (A-057).
   */
  validateMapping: async (body: {
    import_type: string;
    column_mapping: Record<string, string>;
    csv_headers: string[];
  }): Promise<{
    valid: boolean;
    unmapped_required_fields: string[];
    unknown_csv_columns: string[];
  }> => {
    const { data } = await api.post(`${BASE}/validate-mapping`, body);
    return data.data;
  },

  /**
   * POST /flexi-import/batches/{uuid}/process
   * Dispatches ProcessImportBatchJob; batch transitions to 'processing'.
   */
  process: async (uuid: string): Promise<ImportBatch> => {
    const { data } = await api.post(`${BASE}/batches/${uuid}/process`);
    return data.data;
  },

  /**
   * POST /flexi-import/batches/{uuid}/rollback
   * Dispatches RollbackImportBatchJob; enforces the 24-hour window server-side.
   */
  rollback: async (uuid: string): Promise<ImportBatch> => {
    const { data } = await api.post(`${BASE}/batches/${uuid}/rollback`);
    return data.data;
  },

  /**
   * GET /flexi-import/batches/{uuid}/error-report
   * Returns the first page of invalid/failed rows for inline display.
   */
  getErrorReport: async (uuid: string): Promise<ImportRow[]> => {
    const { data } = await api.get(`${BASE}/batches/${uuid}/error-report`);
    return data.data ?? data;
  },

  /**
   * GET /flexi-import/batches/{uuid}/error-report  (responseType: blob)
   * Returns raw CSV bytes for a client-side download trigger.
   */
  downloadErrorReport: async (uuid: string): Promise<Blob> => {
    const response = await api.get(`${BASE}/batches/${uuid}/error-report`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ── Field definitions ──────────────────────────────────────────────────────

  /**
   * GET /flexi-import/fields/{import_type}
   * Returns all expected fields for the import type, including required flag,
   * allowed values for enum types, and FK source/label columns.
   */
  getFieldDefinitions: async (importType: string): Promise<FieldDefinition[]> => {
    const { data } = await api.get(`${BASE}/fields/${importType}`);
    return data.data ?? data;
  },

  // ── Column-map templates ───────────────────────────────────────────────────

  /**
   * GET /flexi-import/column-maps?import_type=employees
   */
  getColumnMaps: async (importType?: string): Promise<ImportColumnMap[]> => {
    const { data } = await api.get(`${BASE}/column-maps`, {
      params: importType ? { import_type: importType } : undefined,
    });
    return data.data ?? data;
  },

  /**
   * POST /flexi-import/column-maps
   * Persist a column mapping as a reusable named template. Matches the backend
   * SaveColumnMapRequest shape. Previously callers hit api.post() inline because
   * this function was missing from the service surface (A-063).
   */
  createColumnMap: async (payload: {
    name: string;
    import_type: string;
    column_mapping: Record<string, string>;
    is_default?: boolean;
  }): Promise<ImportColumnMap> => {
    const { data } = await api.post(`${BASE}/column-maps`, payload);
    return data.data;
  },

  /**
   * PUT /flexi-import/column-maps/{id}
   */
  updateColumnMap: async (
    id: string,
    payload: { name?: string; mapping?: Record<string, string>; is_default?: boolean },
  ): Promise<ImportColumnMap> => {
    const { data } = await api.put(`${BASE}/column-maps/${id}`, payload);
    return data.data;
  },

  /**
   * Set a column map as the default. There is no dedicated /set-default route —
   * the update endpoint flips is_default and unsets the previous default for the
   * same import_type server-side (ImportController::columnMapUpdate).
   */
  setDefaultColumnMap: async (id: string): Promise<ImportColumnMap> => {
    const { data } = await api.put(`${BASE}/column-maps/${id}`, { is_default: true });
    return data.data;
  },

  /**
   * DELETE /flexi-import/column-maps/{id}
   */
  deleteColumnMap: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/column-maps/${id}`);
  },

  // ── Dashboard ──────────────────────────────────────────────────────────────

  /**
   * GET /flexi-import/dashboard
   * Returns KPI aggregate + last-5 recent batches.
   */
  getDashboard: async (): Promise<unknown> => {
    const { data } = await api.get(`${BASE}/dashboard`);
    return data.data;
  },
};
