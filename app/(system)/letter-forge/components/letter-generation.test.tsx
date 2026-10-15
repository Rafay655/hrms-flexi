import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { LetterGenerationProgress } from "./generate-letter-modal";
import type { LetterRenderStatus } from "@/types/letter-forge";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));
vi.mock("@/store/hooks", () => ({ useAppSelector: vi.fn() }));
let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.append(container);
  root = createRoot(container); client = new QueryClient();
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.useRealTimers(); });

async function render(letter: LetterRenderStatus) {
  await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(LetterGenerationProgress, { result: { data: letter, meta: { language_fallback: { requested: "ur", rendered: "en", note: "Rendered in English." } } } }))));
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
}

it("does not poll letters that are waiting for approval", async () => {
  await render({ uuid: "letter", status: "pending_approval" });
  await act(async () => { await vi.advanceTimersByTimeAsync(20_000); });
  expect(api.get).not.toHaveBeenCalled();
  expect(container.textContent).toContain("Pending approval");
  expect(container.textContent).toContain("Rendered in English.");
});

it("polls generated letters until the PDF path exists, then stops", async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: { data: { uuid: "letter", status: "generated", generated_pdf_path: null } } }).mockResolvedValue({ data: { data: { uuid: "letter", status: "generated", generated_pdf_path: "letter.pdf" } } });
  await render({ uuid: "letter", status: "generated" });
  expect(container.textContent).toContain("Preparing the PDF");
  await act(async () => { await vi.advanceTimersByTimeAsync(1600); });
  expect(container.textContent).toContain("Your PDF is ready");
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
  expect(api.get).toHaveBeenCalledTimes(2);
});

it("stops polling on a failed render", async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { data: { uuid: "letter", status: "failed" } } });
  await render({ uuid: "letter", status: "generated" });
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
  expect(container.textContent).toContain("PDF generation failed");
  expect(api.get).toHaveBeenCalledTimes(1);
});

it("times out without generating a second letter and allows status checks to resume", async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { data: { uuid: "letter", status: "generated", generated_pdf_path: null } } });
  await render({ uuid: "letter", status: "generated" });
  for (let second = 0; second < 61; second++) await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expect(container.textContent).toContain("taking longer than expected");
  const count = vi.mocked(api.get).mock.calls.length;
  await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
  expect(api.get).toHaveBeenCalledTimes(count);
  const retry = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Check status again");
  await act(async () => retry!.click());
  await act(async () => { await vi.advanceTimersByTimeAsync(10); });
  expect(api.get).toHaveBeenCalledTimes(count + 1);
});
