import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import toast from "react-hot-toast";
import { createErrorCaches } from "./query-errors";
import { showApiError } from "./error-toast";

vi.mock("react-hot-toast", () => ({ default: { error: vi.fn() } }));
afterEach(() => { vi.clearAllMocks(); vi.useRealTimers(); });
const failure = (message: string) => ({ response: { status: 422, data: { error: { code: "VALIDATION_FAILED", message } } } });
function client() { return new QueryClient({ ...createErrorCaches(), defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); }

it("reports failures across modules once per continuous polling failure", async () => {
  const qc = client();
  try {
    for (let i = 0; i < 2; i++) {
      const error = failure("Payroll data unavailable");
      await expect(qc.fetchQuery({ queryKey: ["payroll"], queryFn: async () => { throw error; } })).rejects.toBe(error);
      showApiError(error); // Existing page callback must not duplicate the cache toast.
    }
    expect(toast.error).toHaveBeenCalledTimes(1);
  } finally { qc.clear(); }
});
it("allows a fresh notification after query recovery", async () => {
  const qc = client();
  try {
    await qc.fetchQuery({ queryKey: ["recovery"], queryFn: async () => { throw failure("First failure"); } }).catch(() => {});
    await qc.fetchQuery({ queryKey: ["recovery"], queryFn: async () => "ok" });
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 6000);
    await qc.fetchQuery({ queryKey: ["recovery"], queryFn: async () => { throw failure("Second failure"); } }).catch(() => {});
    expect(toast.error).toHaveBeenCalledTimes(2);
  } finally { vi.restoreAllMocks(); qc.clear(); }
});
it("preserves mutation error callbacks and prevents a second toast", async () => {
  const qc = client(), error = failure("Document is locked");
  const onError = vi.fn((err) => showApiError(err));
  try {
    const mutation = qc.getMutationCache().build(qc, { mutationFn: async () => { throw error; }, onError });
    await expect(mutation.execute(undefined)).rejects.toBe(error);
    expect(onError).toHaveBeenCalledWith(error, undefined, undefined, expect.anything());
    expect(toast.error).toHaveBeenCalledTimes(1);
  } finally { qc.clear(); }
});
it("honors silent background queries", async () => {
  const qc = client(), error = failure("Background failure");
  try {
    await qc.fetchQuery({ queryKey: ["silent"], meta: { silentError: true }, queryFn: async () => { throw error; } }).catch(() => {});
    showApiError(error);
    expect(toast.error).not.toHaveBeenCalled();
  } finally { qc.clear(); }
});
