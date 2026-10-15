import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { LetterActions } from "./letter-actions";
import type { LetterRecord } from "@/types/generated-letters";
vi.mock("@/lib/api", () => ({ api: { post: vi.fn() } }));
vi.mock("@/store/hooks", () => ({ useAppSelector: vi.fn() }));
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));
let root: Root, container: HTMLDivElement, client: QueryClient;
const base: LetterRecord = { uuid: "letter", status: "dispatched", template_key: "confirmation_letter", employee_id: 1, language: "en", can_download: true };
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); localStorage.clear();
  vi.mocked(useAppSelector).mockImplementation((selector) => selector({ auth: { permissions: ["manage-letters"], roles: [], company: { id: "co" }, user: { id: "user" } } } as never));
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.append(container); root = createRoot(container); client = new QueryClient();
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.useRealTimers(); });
async function render(letter = base) { await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(LetterActions, { letter })))); }
async function click(text: string) { const button = [...document.querySelectorAll("button")].find((item) => item.textContent === text); expect(button, text).toBeTruthy(); await act(async () => button!.click()); await act(async () => { await vi.advanceTimersByTimeAsync(1); }); }
async function reason(value: string) {
  const textarea = document.querySelector("textarea")!;
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, value); textarea.dispatchEvent(new Event("input", { bubbles: true })); });
}
it("waits for dispatch confirmation, preserves a 422 blocker and does not retry", async () => {
  vi.mocked(api.post).mockRejectedValue({ response: { status: 422, data: { message: "Approval must complete first." } } });
  await render({ ...base, status: "generated" });
  await click("Dispatch letter"); expect(api.post).not.toHaveBeenCalled();
  await click("Send by email");
  expect(document.body.textContent).toContain("Approval must complete first.");
  expect(api.post).toHaveBeenCalledTimes(1);
});
it("requires a ten-character reason before revoking access", async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { data: base } });
  await render(); await click("Revoke access"); await reason("short");
  const confirm = [...document.querySelectorAll('[role="dialog"] button')].find((item) => item.textContent === "Revoke access") as HTMLButtonElement;
  expect(confirm.disabled).toBe(true); expect(api.post).not.toHaveBeenCalled();
  await reason("Incorrect designation on letter.");
  await act(async () => confirm.click());
  expect(api.post).toHaveBeenCalledWith("/letter-forge/letters/letter/revoke", { reason: "Incorrect designation on letter." });
});
it("navigates to the replacement returned by supersede", async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { data: { ...base, uuid: "new-letter" } } });
  await render(); await click("Issue corrected replacement"); await reason("Corrected the monthly amount.");
  const confirm = [...document.querySelectorAll('[role="dialog"] button')].find((item) => item.textContent === "Issue corrected replacement") as HTMLButtonElement;
  await act(async () => confirm.click());
  expect(push).toHaveBeenCalledWith("/letter-forge/letters/new-letter");
});
it("keeps the reminder cooldown across remounts", async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { data: { message: "Reminder sent." } } });
  await render({ ...base, acknowledgement_status: "pending" }); await click("Send reminder");
  expect(container.textContent).toContain("Remind again in 3:00");
  await act(async () => root.render(null)); await render({ ...base, acknowledgement_status: "pending" });
  expect(container.textContent).toContain("Remind again in 3:00");
  expect(api.post).toHaveBeenCalledTimes(1);
});
