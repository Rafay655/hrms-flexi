import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { getLetterDashboard } from "./generated-letters";
vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));
describe("Letter Forge dashboard request", () => {
  beforeEach(() => vi.resetAllMocks());
  it("requests the selected month and preserves the response including zero values", async () => {
    const response = { success: true, data: { month: "2026-10", kpi: { letters_generated: 10, dispatched: 0 }, status_breakdown: [{ status: "signed", count: 7 }, { status: "approved", count: 3 }] } };
    vi.mocked(api.get).mockResolvedValue({ data: response });
    const signal = new AbortController().signal;
    expect(await getLetterDashboard(signal, "2026-10")).toEqual(response);
    expect(api.get).toHaveBeenCalledExactlyOnceWith("/letter-forge/dashboard", { signal, params: { month: "2026-10" } });
  });
  it("propagates request failures instead of supplying demo data", async () => {
    const error = new Error("Unavailable");
    vi.mocked(api.get).mockRejectedValue(error);
    await expect(getLetterDashboard()).rejects.toBe(error);
  });
});
