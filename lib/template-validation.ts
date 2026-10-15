import type { TemplateEngine } from "@/types/letter-forge";

/**
 * The 41 registered legacy tokens (LetterTypeRegistry::VARIABLE_REGISTRY).
 * Keep this list in sync with the backend registry — this is the same
 * whitelist the API validates against when engine = "legacy".
 */
const LEGACY_TOKEN_WHITELIST = new Set<string>([
  // Letter metadata
  "letter_date",
  "letter_type_name",
  "reference_number",
  // Employee base
  "employee_name",
  "employee_code",
  "employee_cnic",
  "designation",
  "department",
  "grade_band",
  "branch",
  "joining_date",
  "employment_type",
  "reporting_manager",
  // Probation
  "probation_end_date",
  "confirmation_effective_date",
  "extension_days",
  "extension_reason",
  // Career events
  "new_designation",
  "new_department",
  "new_grade",
  "new_salary",
  "effective_date",
  // Payroll
  "gross_salary",
  "basic_salary",
  "total_tax_deducted",
  "tax_year",
  // Performance
  "performance_outcome_reference",
  "performance_cycle_name",
  "performance_final_score",
  "performance_rating_code",
  "performance_rating_label",
  "performance_released_at",
  "performance_release_hash",
  // Finance / loans
  "loan_amount",
  "loan_type",
  "emi_amount",
  // Disciplinary
  "incident_date",
  "warning_count",
  // On-demand / training
  "noc_purpose",
  "training_name",
  "training_completion_date",
  // Assets
  "asset_name",
  "asset_serial",
  // Company / signatory
  "company_name",
  "company_address",
  "company_phone",
  "company_email",
  "company_logo_url",
  "authorized_signatory_name",
  "authorized_signatory_title",
  "hr_manager_name",
  // System
  "today_date",
]);

// Blade syntax {{ $var }} — rejected by both engines.
const BLADE_PATTERN = /\{\{\s*\$[A-Za-z_]/;

// <script> tags — rejected by both engines.
const SCRIPT_PATTERN = /<\s*script\b/i;

// Legacy {{ token }} placeholders.
const TOKEN_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

// Mustache section openers/closers {{#name}} {{^name}} {{/name}}.
const MUSTACHE_SECTION_PATTERN = /\{\{\s*[#^/]\s*([\w.]+)\s*\}\}/g;

// Dotted catalog keys inside any Mustache placeholder.
const DOTTED_KEY_PATTERN = /\{\{\s*[#^/]?\s*([a-z_][\w]*\.[a-z_][\w.]*)\s*\}\}/gi;

export interface TemplateValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Client-side preflight. Matches the backend rules described in the
 * LetterForge technical notes so we can fail fast before POSTing.
 *
 * Legacy engine:
 *   - every {{token}} must be in the 41-token whitelist
 *   - Blade syntax and <script> are rejected
 *
 * Mustache engine:
 *   - raw keys are exempt (that's the point of LG-P0-08)
 *   - dotted keys are checked for shape only; the backend catalog is the
 *     source of truth for whether a dotted key actually exists
 *   - Blade syntax and <script> are rejected
 */
export function validateTemplateBody(
  body: string,
  engine: TemplateEngine,
): TemplateValidationResult {
  const errors: string[] = [];
  const text = body ?? "";

  if (BLADE_PATTERN.test(text)) {
    errors.push(
      "Blade syntax ({{ $var }}) is not supported by either engine. Use {{employee_name}} or {{employee.name}}.",
    );
  }

  if (SCRIPT_PATTERN.test(text)) {
    errors.push("<script> tags are not allowed in template bodies.");
  }

  if (engine === "legacy") {
    const tokens = new Set<string>();
    for (const match of text.matchAll(TOKEN_PATTERN)) {
      const key = match[1];
      if (key && !key.includes(".")) tokens.add(key);
    }
    const unknown = [...tokens].filter((t) => !LEGACY_TOKEN_WHITELIST.has(t));
    if (unknown.length) {
      errors.push(
        `Unregistered variables on the legacy engine: ${unknown
          .map((u) => `{{${u}}}`)
          .join(", ")}`,
      );
    }
  } else {
    // Mustache: flag dotted keys that don't look like a plausible catalog key.
    const dotted = new Set<string>();
    for (const match of text.matchAll(DOTTED_KEY_PATTERN)) {
      if (match[1]) dotted.add(match[1]);
    }
    const suspicious = [...dotted].filter((k) => !/^[a-z_][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(k));
    if (suspicious.length) {
      errors.push(`Suspicious catalog keys: ${suspicious.join(", ")}`);
    }

    // Sanity check: sections must be balanced.
    const openers: string[] = [];
    for (const match of text.matchAll(MUSTACHE_SECTION_PATTERN)) {
      const token = match[0];
      const name = match[1];
      if (token.startsWith("{{/")) {
        if (openers.length === 0 || openers[openers.length - 1] !== name) {
          errors.push(`Unbalanced Mustache section: unexpected {{/${name}}}.`);
          break;
        }
        openers.pop();
      } else {
        openers.push(name);
      }
    }
    if (openers.length) {
      errors.push(
        `Unbalanced Mustache section: missing {{/${openers[openers.length - 1]}}}.`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}