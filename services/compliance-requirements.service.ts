import type { AxiosError } from "axios";
import { api } from "@/lib/api"; // ⚠️ adjust to your axios instance

// ── Types ─────────────────────────────────────────────────────────────────────

export type ComplianceFrequency =
  | "annual"
  | "half_yearly"
  | "quarterly"
  | "monthly"
  | "weekly"
  | "ad_hoc";

export interface DocumentTypeRef {
  id: number;
  name: string;
}

export interface ComplianceRequirement {
  id: number;
  uuid: string;
  company_id: number;
  title: string;
  description: string | null;
  document_type_id: number | null;
  frequency: ComplianceFrequency;
  is_mandatory: boolean;
  reminder_days_before: number;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  document_type: DocumentTypeRef | null;
}

export interface ListComplianceParams {
  page?: number;
  per_page?: number;
  search?: string;
  frequency?: ComplianceFrequency;
  is_active?: boolean;
  is_mandatory?: boolean;
  document_type_id?: number;
}

/** Payload for POST / PUT /dms/compliance-requirements */
export interface ComplianceRequirementPayload {
  title: string;
  description?: string | null;
  document_type_id?: number | null;
  frequency: ComplianceFrequency;
  is_mandatory: boolean;
  reminder_days_before: number;
  is_active: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

function normalizeList<T>(payload: unknown): T[] {
  const raw = unwrap(payload as ApiEnvelope<unknown>);
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidate =
      obj.data ??
      obj.items ??
      obj.results ??
      obj.requirements ??
      obj.compliance_requirements;
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

// ── LIST ──────────────────────────────────────────────────────────────────────
// GET /dms/compliance-requirements

export async function getComplianceRequirements(
  params?: ListComplianceParams,
): Promise<ComplianceRequirement[]> {
  const { data } = await api.get("/dms/compliance-requirements", { params });
  return normalizeList<ComplianceRequirement>(data);
}

// ── SHOW ──────────────────────────────────────────────────────────────────────
// GET /dms/compliance-requirements/{uuid}

export async function getComplianceRequirement(
  uuid: string,
): Promise<ComplianceRequirement> {
  const { data } = await api.get<ApiEnvelope<ComplianceRequirement>>(
    `/dms/compliance-requirements/${uuid}`,
  );
  return unwrap<ComplianceRequirement>(data);
}

// ── CREATE ────────────────────────────────────────────────────────────────────
// POST /dms/compliance-requirements

export async function createComplianceRequirement(
  payload: ComplianceRequirementPayload,
): Promise<ComplianceRequirement> {
  const { data } = await api.post<ApiEnvelope<ComplianceRequirement>>(
    "/dms/compliance-requirements",
    payload,
  );
  return unwrap<ComplianceRequirement>(data);
}

// ── UPDATE ────────────────────────────────────────────────────────────────────
// PUT /dms/compliance-requirements/{uuid}

export async function updateComplianceRequirement(
  uuid: string,
  payload: Partial<ComplianceRequirementPayload>,
): Promise<ComplianceRequirement> {
  const { data } = await api.put<ApiEnvelope<ComplianceRequirement>>(
    `/dms/compliance-requirements/${uuid}`,
    payload,
  );
  return unwrap<ComplianceRequirement>(data);
}

// ── DELETE ────────────────────────────────────────────────────────────────────
// DELETE /dms/compliance-requirements/{uuid}

export async function deleteComplianceRequirement(uuid: string): Promise<void> {
  await api.delete(`/dms/compliance-requirements/${uuid}`);
}

export type { AxiosError };