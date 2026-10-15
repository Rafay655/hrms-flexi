import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { BatchDetailModal } from "../components/batch-detail-modal";

const state = vi.hoisted(() => ({ commit: vi.fn(), retry: vi.fn(), batch: {} as Record<string, unknown> }));
vi.mock("next/navigation", () => ({ useParams: () => ({ uuid: "batch" }) }));
vi.mock("@/hooks/use-letter-batches", () => ({
  useLetterBatch: () => ({ data: { data: state.batch }, isPending: false, isFetching: false, refetch: vi.fn() }),
  useBatchEmployees: () => ({ data: [{ id: 1, name: "Ahmed", employee_code: "EMP1" }] }),
  useLetterBatchActions: () => ({ commit: { mutateAsync: state.commit, isPending: false }, retry: { mutateAsync: state.retry, isPending: false } }),
}));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));
let root: Root; let container: HTMLDivElement;
beforeEach(() => {
  vi.resetAllMocks(); state.commit.mockResolvedValue({});
  state.batch = { uuid: "batch", template_key: "confirmation_letter", status: "dry_run", total_count: 2, queued_count: 1, skipped_count: 1, failed_count: 0, succeeded_count: 0, is_committable: true, is_terminal: false, created_at: "2026-09-29T00:00:00Z", items: [{ uuid: "item1", employee_id: 1, status: "queued" }, { uuid: "item2", employee_id: 2, status: "skipped", failure_reason: "duplicate_active_letter" }] };
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const button = (text: string) => Array.from(document.querySelectorAll("button")).find((node) => node.textContent === text)!;
it("shows eligibility and skip reasons before requiring explicit commit acknowledgement", async () => {
  await act(async () => root.render(createElement(BatchDetailModal, { uuid: "batch", onClose: vi.fn() })));
  expect(document.body.textContent).toContain("1 of 2 eligible"); expect(document.body.textContent).toContain("duplicate active letter");
  expect(state.commit).not.toHaveBeenCalled();
  await act(async () => button("Commit 1 eligible employees").click());
  expect(button("Confirm").disabled).toBe(true);
  await act(async () => (document.querySelector('input[type="checkbox"]') as HTMLInputElement).click());
  await act(async () => button("Confirm").click());
  expect(state.commit).toHaveBeenCalledTimes(1);
});
it("does not allow commit when the per-employee preview is missing", async () => {
  delete state.batch.items;
  await act(async () => root.render(createElement(BatchDetailModal, { uuid: "batch", onClose: vi.fn() })));
  expect(button("Commit 1 eligible employees").disabled).toBe(true);
  expect(state.commit).not.toHaveBeenCalled();
});
