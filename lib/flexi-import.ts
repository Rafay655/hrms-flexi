import type { VisibilityCondition } from "@/lib/onboarding-visibility";
/**
 * FlexiImport wizard — pure, framework-free helpers + shared DTO types.
 *
 * Extracted from app/(system)/flexi-import/new/page.tsx so the data-shaping logic
 * (field-definition normalisation, per-cell error matching, preview-row mapping,
 * column auto-matching, and FlexiMeta entity-aware grouping) is unit-testable in
 * isolation — none of it touches React, the network, or the DOM. Mirrors the
 * lib/audit-trail.ts pattern. See lib/flexi-import.test.ts for coverage (FI-44).
 */

export interface FieldDefinition {
  visibility_condition?: VisibilityCondition | null;
  key: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
  allowed_values?: string[];
  // FI-33: for FlexiMeta, which entity_type(s) a column applies to. Empty/absent
  // means it applies to every entity (entity_type, code, name, is_active). Used to
  // group and badge the union of fields by entity in the column-mapping step.
  entities?: string[];
}

export interface PreviewRow {
  row_number: number;
  fields: Record<string, string>;
  status: "valid" | "invalid";
  errors?: Record<string, string>;
}

/** Shape of one row in the paginated rows endpoint (ImportRowResource). */
export interface ImportRowApi {
  row_number: number;
  raw_data: Record<string, string> | null;
  status: string;
  validation_errors: Array<{ field?: string; message?: string }> | null;
  processing_error: string | null;
}

/**
 * The backend processors emit field definitions as { field_key, available_values,
 * note, entities }. Older/other shapes use { key, allowed_values, description }.
 * Normalise both into the FieldDefinition the wizard consumes so a key/value mismatch
 * can never silently break auto-matching or the target-field dropdown.
 */
export function normalizeFieldDefinition(
  raw: Record<string, unknown>
): FieldDefinition {
  return {
    ...(raw.visibility_condition !== undefined ? {visibility_condition: raw.visibility_condition as VisibilityCondition | null} : {}),
    key: String(raw.key ?? raw.field_key ?? ""),
    label: String(raw.label ?? raw.field_key ?? raw.key ?? ""),
    type: String(raw.type ?? "text"),
    required: Boolean(raw.required),
    description: (raw.description ?? raw.note ?? undefined) as string | undefined,
    allowed_values: (raw.allowed_values ??
      raw.available_values ??
      undefined) as string[] | undefined,
    entities: (raw.entities ?? undefined) as string[] | undefined,
  };
}

export function rowErrorsToMap(
  errs: ImportRowApi["validation_errors"]
): Record<string, string> | undefined {
  if (!Array.isArray(errs) || errs.length === 0) return undefined;
  const out: Record<string, string> = {};
  for (const e of errs) {
    if (e?.field) out[e.field] = e.message ?? "Invalid value";
  }
  return Object.keys(out).length ? out : undefined;
}

export function toPreviewRow(r: ImportRowApi): PreviewRow {
  // valid (pre-process) and committed (successfully imported) are both "correct";
  // invalid (failed validation) and failed (failed processing) are "incorrect".
  const ok = r.status === "valid" || r.status === "committed";
  // Prefer field-level validation errors; fall back to a row-level processing error
  // so a row that failed during the DB write still surfaces its reason.
  const errors =
    rowErrorsToMap(r.validation_errors) ??
    (r.processing_error ? { _row: r.processing_error } : undefined);
  return {
    row_number: r.row_number,
    fields: r.raw_data ?? {},
    status: ok ? "valid" : "invalid",
    errors,
  };
}

/**
 * Resolve whether a given column (a raw CSV header) has a validation error for this
 * row, returning the message. The backend keys errors inconsistently — sometimes by
 * the CSV header / field key (FlexiMeta), sometimes by the human label (employees) —
 * so we match the error against the column, its mapped field key, AND that field's
 * label. This is what lets a bad cell light up in its own column regardless.
 */
export function cellErrorFor(
  row: PreviewRow,
  col: string,
  columnMapping: Record<string, string>,
  fieldDefinitions: FieldDefinition[]
): string | undefined {
  const errs = row.errors;
  if (!errs) return undefined;
  if (errs[col]) return errs[col];
  const fieldKey = columnMapping[col] ?? col;
  if (errs[fieldKey]) return errs[fieldKey];
  const label = fieldDefinitions.find((f) => f.key === fieldKey)?.label;
  if (label && errs[label]) return errs[label];
  return undefined;
}

/** Flatten a row's errors into a "field: message" list for the row-level tooltip. */
export function rowErrorSummary(row: PreviewRow): string {
  if (!row.errors) return "";
  return Object.entries(row.errors)
    .map(([field, msg]) => `${field}: ${msg}`)
    .join("\n");
}

/**
 * Auto-match CSV headers to import fields by case-insensitive comparison on both the
 * field's human label and its system key. Returns a { csvHeader: fieldKey } mapping.
 */
export function autoMatchColumns(
  headers: string[],
  fields: FieldDefinition[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  headers.forEach((header) => {
    const lc = header.toLowerCase();
    const match = fields.find(
      (f) => f.label.toLowerCase() === lc || f.key.toLowerCase() === lc
    );
    if (match) mapping[header] = match.key;
  });
  return mapping;
}

// ─────────────────────────────────────────────────────────────────────────────
// FI-33: FlexiMeta entity-aware column mapping helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The set of FlexiMeta entity types referenced across all field definitions
 * (departments, designations, grade_bands, …). A field whose `entities` covers the
 * full set is universal (entity_type / code / name / is_active); a narrower set is
 * entity-specific. Empty when the import type carries no entity metadata (employees).
 */
export function flexiMetaEntityUniverse(fields: FieldDefinition[]): string[] {
  const all = new Set<string>();
  for (const f of fields) (f.entities ?? []).forEach((e) => all.add(e));
  return Array.from(all).sort();
}

/** Short badge for a field's entity scope, or "" when it applies to every entity. */
export function entityBadgeFor(
  field: FieldDefinition,
  universeSize: number
): string {
  const ents = field.entities ?? [];
  if (ents.length === 0 || ents.length >= universeSize) return "";
  return ents.join(", ");
}

/** Whether a field should be shown under the selected entity filter ("" = all). */
export function fieldMatchesEntity(
  field: FieldDefinition,
  entity: string
): boolean {
  if (!entity) return true;
  const ents = field.entities ?? [];
  // Universal fields (no entities, or those covering everything) always show.
  return ents.length === 0 || ents.includes(entity);
}
