import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { getDmsDashboard } from "./dms-dashboard";
vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));
describe("DMS dashboard API", () => {
  beforeEach(() => vi.resetAllMocks());
  it("preserves zero counters, nullable references and empty batches", async () => {
    const data = { month: "2026-10", kpi: { documents_uploaded: 21, verified_documents: 0 }, recent_batches: [], recent_documents: [{ uuid: "document-uuid", reference_number: null }] };
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, message: "Success", data } });
    const signal = new AbortController().signal;
    expect(await getDmsDashboard("2026-10", signal)).toEqual(data);
    expect(api.get).toHaveBeenCalledExactlyOnceWith("/dms/dashboard", { params: { month: "2026-10" }, signal });
  });
  it("lets the backend choose the initial reporting month", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: {} } });
    await getDmsDashboard(undefined);
    expect(api.get).toHaveBeenCalledWith("/dms/dashboard", { params: undefined, signal: undefined });
  });
  it("rejects unsuccessful envelopes without rendering demo data", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: false, message: "Access denied", data: null } });
    await expect(getDmsDashboard("2026-10")).rejects.toThrow("Access denied");
  });
  it("propagates transport failures", async () => {
    const error = new Error("Unavailable");
    vi.mocked(api.get).mockRejectedValue(error);
    await expect(getDmsDashboard("2026-10")).rejects.toBe(error);
  });
});
