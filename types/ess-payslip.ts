/**
 * types/ess-payslip.ts
 * ESS Payslips (ESS-PAY-01/02) — DTOs for the employee's own payslips.
 *
 * Mirrors app/Http/Resources/PayEdge/PayslipDocumentResource.php.
 *
 * ⚠️ These describe PayEdge-owned endpoints that ESS CONSUMES:
 *   - GET /v1/pay-edge/employees/{employeeUuid}/payslips   (payedge.payslip.view-own)
 *   - GET /v1/pay-edge/payslips/{payslipUuid}/download      (returns a 5-min signed URL)
 *
 * SECURITY — the list endpoint takes an employee UUID in the PATH. That UUID must come from
 * GET /v1/ess/me (the authenticated principal), NEVER from user input. The backend
 * (BankFileController::employeePayslips) re-verifies ownership server-side and 403s a mismatch
 * — do not rely on the client to be the only gate. See INVARIANT 4.
 *
 * (The sibling TAX-CERTIFICATE endpoint is deliberately NOT wired here: it lacks the ownership
 * check this payslip path has — confirmed exploitable 2026-07-18, flagged to the PayEdge owner.
 * No ESS tax-cert UI until that endpoint is fixed.)
 */

/** One payslip document. Times are ISO strings or null; period_label is backend-formatted. */
export type PayslipRow = {
  id: string;
  employee_name: string | null;
  period_month: number;
  period_year: number;
  period_label: string | null;
  is_emailed: boolean;
  emailed_at: string | null;
  download_count: number;
  created_at: string | null;
};

/** GET /pay-edge/employees/{uuid}/payslips — flat { data: [...] } envelope. */
export type MyPayslipsResponse = { data: PayslipRow[] };

/**
 * GET /pay-edge/payslips/{uuid}/download — the JSON that precedes the actual file.
 *
 * `download_url` is a temporary (5-minute) SIGNED URL to the serve route that streams the PDF
 * inline. Ownership was already checked when this URL was minted (the service scopes the query
 * by employee_id), so the signed URL is safe to open directly.
 */
export type PayslipDownload = {
  payslip_id: string;
  download_url: string;
  filename: string;
  expires_in_seconds: number;
  download_count: number;
};
