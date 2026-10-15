import { beforeEach, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { createLetterBatch, getLetterBatches, getLetterBatch, commitLetterBatch, retryFailedLetterBatch } from "./letter-batch";
import { employeeService } from "./employee.service";
vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());

it("forces a persisted dry run, deduplicates employees and keeps the caller key", async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { data: { uuid: "batch" } } });
  await createLetterBatch({ template_key: "confirmation_letter", employee_ids: [12, 12, 13], dry_run: true, idempotency_key: "attempt-1" });
  expect(api.post).toHaveBeenCalledExactlyOnceWith("/letter-forge/letter-batches", { template_key: "confirmation_letter", employee_ids: [12, 13], dry_run: true, idempotency_key: "attempt-1" });
});
it.each([[], [0], [1.5], Array.from({ length: 501 }, (_, i) => i + 1)].map((employee_ids) => ({ employee_ids })))("rejects invalid employee cohorts", async ({ employee_ids }) => {
  await expect(createLetterBatch({ template_key: "confirmation_letter", employee_ids, dry_run: true, idempotency_key: "attempt" })).rejects.toThrow();
  expect(api.post).not.toHaveBeenCalled();
});
it("normalizes Laravel nested pagination and sends supported list filters", async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { data: [{ uuid: "batch" }], current_page: 2, last_page: 3, per_page: 10, total: 24 } } });
  const response = await getLetterBatches({ page: 2, status: "running", per_page: 10, template_key: "" });
  expect(response.data[0].uuid).toBe("batch"); expect(response.meta?.total).toBe(24);
  expect(response.meta?.from).toBeNull();
  expect(api.get).toHaveBeenCalledWith("/letter-forge/letter-batches", { params: { page: 2, status: "running", per_page: 10 }, signal: undefined });
});
it("commits and retries the saved batch rather than creating another cohort", async () => {
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  await commitLetterBatch("batch"); await retryFailedLetterBatch("batch");
  expect(api.post).toHaveBeenNthCalledWith(1, "/letter-forge/letter-batches/batch/commit");
  expect(api.post).toHaveBeenNthCalledWith(2, "/letter-forge/letter-batches/batch/retry-failed");
});
it("passes cancellation to the detail poll request", async () => {
  vi.mocked(api.get).mockResolvedValue({ data: {} });
  const signal = new AbortController().signal; await getLetterBatch("batch", signal);
  expect(api.get).toHaveBeenCalledWith("/letter-forge/letter-batches/batch", { signal });
});
it("loads every employee page with detailed explicitly zero", async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [{ id: 1, name: "First" }], meta: { last_page: 2 } } }).mockResolvedValueOnce({ data: { data: [{ id: 2, name: "Second" }], meta: { last_page: 2 } } });
  expect((await employeeService.getAllForBatches()).map((employee) => employee.id)).toEqual([1, 2]);
  expect(api.get).toHaveBeenNthCalledWith(2, "/people-hub/onboarding", { params: { page: 2, per_page: 100, detailed: 0 }, signal: undefined });
});
