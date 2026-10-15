import { expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { getComplianceSummary } from "./compliance-summary.service";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));

it("loads the statutory summary endpoint and unwraps its envelope once", async () => {
  const summary = {
    compliance_seal: 78,
    metrics: { pending_remittances: 3, min_wage_violations: 0, missing_profiles: 2, certificates_pending: 1 },
    active_tax_year: { label: "2026–27", closes_on: "2027-06-30" },
    pending_by_fund: { income_tax: 3 },
    upcoming_deadlines: [],
    area_status: [],
  };
  vi.mocked(api.get).mockResolvedValue({ data: { success: true, message: "Success", data: summary } });
  const signal = new AbortController().signal;
  expect(await getComplianceSummary(signal)).toEqual(summary);
  expect(api.get).toHaveBeenCalledWith("/compliance/dashboard/summary", { signal });
});
