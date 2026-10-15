import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { LetterStatusModal } from "./letter-view-modals";
vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));
vi.mock("@/store/hooks", () => ({ useAppSelector: vi.fn() }));
let root: Root, container: HTMLDivElement, client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.append(container); root = createRoot(container); client = new QueryClient();
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.useRealTimers(); });
async function render() {
  await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(LetterStatusModal, { uuid: "letter", onClose: vi.fn() }))));
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
}
it("polls the status endpoint and stops when dispatched", async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: { data: { uuid: "letter", status: "generated", generated_pdf_path: null } } }).mockResolvedValue({ data: { data: { uuid: "letter", status: "dispatched", generated_pdf_path: "private.pdf", dispatched_at: "2026-09-21T07:57:28.000000Z", recalled_at: null } } });
  await render();
  expect(api.get).toHaveBeenCalledWith("/letter-forge/letters/letter/status", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
  expect(document.body.textContent).toContain("final status");
  await act(async () => { await vi.advanceTimersByTimeAsync(9000); });
  expect(api.get).toHaveBeenCalledTimes(2);
});
it("stops on error and lets the user resume", async () => {
  vi.mocked(api.get).mockRejectedValueOnce({ response: { data: { message: "Status unavailable" } } }).mockResolvedValue({ data: { data: { uuid: "letter", status: "pending_approval" } } });
  await render();
  await act(async () => { await vi.advanceTimersByTimeAsync(9000); });
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(document.body.textContent).toContain("Status unavailable");
  await act(async () => [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Resume polling")!.click());
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(api.get).toHaveBeenCalledTimes(2);
});
it("stops polling when the modal unmounts", async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { data: { uuid: "letter", status: "pending_signature" } } });
  await render(); await act(async () => root.render(null));
  await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
  expect(api.get).toHaveBeenCalledTimes(1);
});
