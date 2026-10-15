import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import PendingSignaturesPage from "./page";
vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock("@/lib/error-toast", () => ({ showApiError: vi.fn() }));
let root: Root, container: HTMLDivElement, client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.append(container);
  root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.useRealTimers(); });
async function render(rows: unknown[]) {
  vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: rows } });
  await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(PendingSignaturesPage))));
  await act(async () => { await vi.advanceTimersByTimeAsync(10); });
}
it("renders the actual minimal backend response without constructing invalid action URLs", async () => {
  await render([{ uuid: "signatory-1", name: "Ahmed", email: "ahmed@example.com", sign_order: 1, is_parallel: false, status: "pending", otp_expires_at: null }]);
  expect(api.get).toHaveBeenCalledWith("/dms/signature-requests/pending", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  expect(container.textContent).toContain("Ahmed");
  expect(container.textContent).toContain("Request details unavailable");
  expect(container.textContent).not.toContain("undefined");
  expect(api.post).not.toHaveBeenCalled();
});
it("paginates the complete collection and shows actions when request identity is available", async () => {
  await render(Array.from({ length: 11 }, (_, index) => ({ uuid: `s-${index}`, signature_request_uuid: `r-${index}`, name: `Employee ${index}`, email: "employee@example.com", sign_order: 1, status: "notified", document: { title: `Document ${index}`, uuid: `d-${index}` } })));
  expect(container.querySelectorAll("tbody tr")).toHaveLength(10);
  expect(container.querySelector('[aria-label="Actions for Document 0"]')).not.toBeNull();
  await act(async () => (container.querySelector('[aria-label="Next page"]') as HTMLButtonElement).click());
  expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
  expect(container.querySelector("tbody")?.textContent).toContain("Document 10");
  expect(api.get).toHaveBeenCalledTimes(1);
});
it("shows a useful empty state for an empty API collection", async () => {
  await render([]);
  expect(container.textContent).toContain("You have no documents awaiting your signature.");
  expect((container.querySelector('[aria-label="Next page"]') as HTMLButtonElement).disabled).toBe(true);
});
