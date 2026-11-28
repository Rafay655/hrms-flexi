import { afterEach, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { getFlexiHqDashboard } from "./flexi-hq-dashboard.service";
vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));
afterEach(() => vi.resetAllMocks());
it("passes the signal without dashboard filters and preserves unavailable counts", async () => {
 const data = { stats: { total_companies: 1 }, org_snapshot: [], attention: [{ key: "fields_without_validation", available: false, count: null }], headcount_by_grade: [{ grade_id: null, level: null, headcount: 2 }] };
 vi.mocked(api.get).mockResolvedValue({ data: { success: true, data } });
 const signal = new AbortController().signal;
 expect(await getFlexiHqDashboard(signal)).toEqual(data);
 expect(api.get).toHaveBeenCalledWith("/flexi-hq/dashboard", { signal });
});
it("preserves unsuccessful envelopes and rejects missing dashboard data", async () => {
 const error = { success: false, error: { status: 403, message: "Company unavailable" } };
 vi.mocked(api.get).mockResolvedValueOnce({ data: error }).mockResolvedValueOnce({ data: { success: true, data: null } });
 await expect(getFlexiHqDashboard()).rejects.toEqual(error);
 await expect(getFlexiHqDashboard()).rejects.toThrow("Dashboard data is unavailable.");
});

it("retains all extended sections when unwrapping the standard response", async () => {
 const dashboard = { stats: { total_companies: 1 }, org_snapshot: [], forms: { total_fields: 0, breakdown: [] }, workflows: { active: 0, items: [] }, attention: [{ key: "draft_workflows", available: true, count: 0 }, { key: "unpublished_form_changes", available: false, count: null }] };
 vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: dashboard } });
 const result = await getFlexiHqDashboard();
 expect(result.forms).toEqual(dashboard.forms);
 expect(result.workflows).toEqual(dashboard.workflows);
 expect(result.attention).toEqual(dashboard.attention);
});
