import { expect, it } from "vitest";
import { buildLetterGenerationPayload, manualLetterFields } from "./letter-generation-fields";
import type { LetterTemplate } from "@/types/letter-forge";

function template(template_key: string, body_html: string, extra: Partial<LetterTemplate> = {}): LetterTemplate {
  return { template_key, body_html, ...extra } as LetterTemplate;
}
it("builds the promotion payload without language or server-owned fields", () => {
  const selected = template("promotion_letter", "{{employee_name}} {{new_designation}} {{new_department}} {{new_grade}} {{new_salary}} {{effective_date}} {{today_date}}");
  const values = { new_designation: "Senior Software Engineer", new_department: "Engineering", new_grade: "B-3", new_salary: "250000", effective_date: "2026-10-15" };
  expect(buildLetterGenerationPayload(selected, 12, { ...values, employee_name: "Override", today_date: "Override" })).toEqual({ template_key: "promotion_letter", employee_id: 12, extra_data: values });
});
it("asks for only NOC purpose and ignores auto tokens even if declared required", () => {
  const selected = template("noc_letter", "{{noc_purpose}} {{company_name}}", { variables: ["{{employee_name}}", "reference_number"], variable_schema: { variables: [{ name: "employee_cnic", label: "CNIC", type: "string", required: true }] } });
  expect(manualLetterFields(selected).map((field) => field.key)).toEqual(["noc_purpose"]);
  expect(buildLetterGenerationPayload(selected, 12, { noc_purpose: "visa application" })).toEqual({ template_key: "noc_letter", employee_id: 12, extra_data: { noc_purpose: "visa application" } });
});
it.each(["salary_certificate", "experience_certificate"])("omits extra_data for %s even if the saved template declares manual tokens", (key) => {
  expect(buildLetterGenerationPayload(template(key, "{{gross_salary}} {{basic_salary}} {{employee_name}}"), 12, { gross_salary: "10000" })).toEqual({ template_key: key, employee_id: 12 });
});
it("detects manual tokens in header, footer and schema without duplicates", () => {
  const fields = manualLetterFields(template("custom_letter", "{{training_name}}", { header_html: "{{training_name}}", footer_html: "{{training_completion_date}}", variables: ["{{training_name}}", "company_email"], variable_schema: { variables: [{ name: "asset_serial", label: "Asset serial", required: false, type: "string" }] } }));
  expect(fields.map((field) => field.key)).toEqual(["training_name", "training_completion_date", "asset_serial"]);
  expect(fields[1].type).toBe("date");
  expect(fields[2].required).toBe(false);
});
it.each([
  { key: "warning_letter", fields: ["incident_date"] },
  { key: "show_cause_notice", fields: ["incident_date"] },
  { key: "probation_extension_letter", fields: ["extension_days", "extension_reason", "probation_end_date"] },
  { key: "confirmation_letter", fields: ["confirmation_effective_date"] },
  { key: "promotion_letter", fields: ["new_designation", "new_department", "new_grade", "new_salary", "effective_date"] },
  { key: "increment_letter", fields: ["new_salary", "effective_date"] },
  { key: "transfer_letter", fields: ["new_department", "effective_date"] },
  { key: "contract_renewal_letter", fields: ["effective_date"] },
  { key: "noc_letter", fields: ["noc_purpose"] },
  { key: "training_certificate", fields: ["training_name", "training_completion_date"] },
  { key: "asset_handover_note", fields: ["asset_name", "asset_serial"] },
  { key: "loan_sanction_letter", fields: ["loan_amount", "loan_type", "emi_amount"] },
  { key: "loan_clearance_letter", fields: ["loan_amount", "loan_type", "emi_amount"] },
  { key: "tax_deduction_certificate", fields: ["total_tax_deducted", "tax_year"] },
])("shows the specified fields for $key even without token metadata", ({ key, fields }) => {
  expect(manualLetterFields(template(key, "")).map((field) => field.key)).toEqual(fields);
});
it("keeps tax year as text and amounts as numbers", () => {
  const fields = manualLetterFields(template("tax_deduction_certificate", ""));
  expect(fields.map((field) => field.type)).toEqual(["number", "text"]);
  expect(buildLetterGenerationPayload(template("tax_deduction_certificate", ""), 12, { total_tax_deducted: "4500", tax_year: "2025-26" }).extra_data?.tax_year).toBe("2025-26");
});
it("requires employee and required manual values, and rejects fractional extension days", () => {
  const selected = template("probation_extension_letter", "{{extension_days}}");
  expect(() => buildLetterGenerationPayload(selected, 0, {})).toThrow("Choose an employee");
  expect(() => buildLetterGenerationPayload(selected, 12, {})).toThrow("required");
  expect(() => buildLetterGenerationPayload(selected, 12, { extension_days: "1.5" })).toThrow("valid");
});
