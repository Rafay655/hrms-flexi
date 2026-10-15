import type { LetterTemplate } from "@/types/letter-forge";

// Only these tokens may become employee-specific inputs. All other tokens stay server-owned.
export const MANUAL_LETTER_TOKENS = [
  "probation_end_date", "confirmation_effective_date", "extension_days", "extension_reason",
  "new_designation", "new_department", "new_grade", "new_salary", "effective_date",
  "gross_salary", "basic_salary", "total_tax_deducted", "tax_year", "loan_amount", "loan_type", "emi_amount",
  "incident_date", "noc_purpose", "training_name", "training_completion_date", "asset_name", "asset_serial",
] as const;
type ManualToken = typeof MANUAL_LETTER_TOKENS[number];
const LETTER_TYPE_FIELDS: Partial<Record<string, readonly ManualToken[]>> = {
  warning_letter: ["incident_date"],
  show_cause_notice: ["incident_date"],
  probation_extension_letter: ["extension_days", "extension_reason", "probation_end_date"],
  confirmation_letter: ["confirmation_effective_date"],
  promotion_letter: ["new_designation", "new_department", "new_grade", "new_salary", "effective_date"],
  increment_letter: ["new_salary", "effective_date"],
  transfer_letter: ["new_department", "effective_date"],
  contract_renewal_letter: ["effective_date"],
  salary_certificate: [],
  experience_certificate: [],
  noc_letter: ["noc_purpose"],
  training_certificate: ["training_name", "training_completion_date"],
  asset_handover_note: ["asset_name", "asset_serial"],
  loan_sanction_letter: ["loan_amount", "loan_type", "emi_amount"],
  loan_clearance_letter: ["loan_amount", "loan_type", "emi_amount"],
  tax_deduction_certificate: ["total_tax_deducted", "tax_year"],
};
const dates = new Set(["probation_end_date", "confirmation_effective_date", "effective_date", "incident_date", "training_completion_date"]);
const amounts = new Set(["new_salary", "gross_salary", "basic_salary", "total_tax_deducted", "loan_amount", "emi_amount"]);
function tokenName(value: string) { return value.replace(/[{}]/g, "").trim(); }
export function manualLetterFields(template: LetterTemplate) {
  const content = [template.body_html, template.header_html, template.footer_html].filter(Boolean).join("\n");
  const used = new Set([
    ...(template.variables ?? []).map(tokenName),
    ...(template.variable_schema?.variables ?? []).map((entry) => tokenName(entry.name)),
    ...Array.from(content.matchAll(/\{\{\{?\s*[#^&]?\s*([a-zA-Z_][\w]*)\s*\}\}\}?/g), (match) => match[1]),
  ]);
  // Explicit workflow rules win over missing, stale or unrelated template tokens.
  const configured = LETTER_TYPE_FIELDS[template.template_key];
  const keys = configured ?? MANUAL_LETTER_TOKENS.filter((key) => used.has(key));
  return keys.map((key) => {
    const schema = template.variable_schema?.variables.find((entry) => tokenName(entry.name) === key);
    return {
      key,
      label: key === "noc_purpose" ? "NOC purpose" : key === "emi_amount" ? "EMI amount" : (!configured && schema?.label) || key.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()),
      type: dates.has(key) ? "date" : amounts.has(key) || key === "extension_days" ? "number" : "text",
      required: configured ? true : schema?.required ?? true,
      placeholder: key === "tax_year" ? "e.g. 2025-26" : undefined,
      multiline: key === "extension_reason" || key === "noc_purpose",
    };
  });
}
export function buildLetterGenerationPayload(template: LetterTemplate, employeeId: number, values: Record<string, string>) {
  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) throw new Error("Choose an employee.");
  const extra: Record<string, string> = {};
  for (const field of manualLetterFields(template)) {
    const value = (values[field.key] ?? "").trim();
    if (!value) { if (field.required) throw new Error(`${field.label} is required.`); continue; }
    if (field.type === "number" && (!Number.isFinite(Number(value)) || Number(value) < 0 || (field.key === "extension_days" && !Number.isInteger(Number(value))))) throw new Error(`Enter a valid ${field.label.toLowerCase()}.`);
    extra[field.key] = value;
  }
  return { template_key: template.template_key, employee_id: employeeId, ...(Object.keys(extra).length ? { extra_data: extra } : {}) };
}
