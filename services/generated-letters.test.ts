import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import {
  approveLetter,
  rejectLetter,
  dispatchLetter,
  downloadLetter,
  getGeneratedLetters,
  remindLetter,
  revokeLetter,
  supersedeLetter,
} from "./generated-letters";
import { letterActions } from "@/lib/generated-letter-state";
import type { LetterRecord } from "@/types/generated-letters";
vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("approves by UUID without inventing a request body", async () => {
  vi.mocked(api.post).mockResolvedValue({
    data: { data: { status: "approved" } },
  });
  await approveLetter("letter");
  expect(api.post).toHaveBeenCalledExactlyOnceWith(
    "/letter-forge/letters/letter/approve",
  );
});
it("sends the backend rejection_reason field and refuses blank reasons", async () => {
  await expect(rejectLetter("letter", "   ")).rejects.toThrow(
    "rejection reason",
  );
  expect(api.post).not.toHaveBeenCalled();
  vi.mocked(api.post).mockResolvedValue({
    data: { data: { status: "rejected" } },
  });
  await rejectLetter("letter", "Wrong employee selected.");
  expect(api.post).toHaveBeenCalledExactlyOnceWith(
    "/letter-forge/letters/letter/reject",
    { rejection_reason: "Wrong employee selected." },
  );
});
it("sends status, template, numeric employee and page size together", async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
  await getGeneratedLetters({
    status: "dispatched",
    template_key: "warning_letter",
    employee_id: 101,
    per_page: 25,
  });
  expect(api.get).toHaveBeenCalledExactlyOnceWith("/letter-forge/letters", {
    params: {
      status: "dispatched",
      template_key: "warning_letter",
      employee_id: 101,
      per_page: 25,
    },
    signal: undefined,
  });
});
it.each(["email", "in_app", "print", "none"] as const)(
  "dispatches through %s with the explicit channel",
  async (channel) => {
    vi.mocked(api.post).mockResolvedValue({
      data: { data: { status: "dispatched" } },
    });
    await dispatchLetter("uuid", channel);
    expect(api.post).toHaveBeenCalledExactlyOnceWith(
      "/letter-forge/letters/uuid/dispatch",
      { channel },
    );
  },
);
it("uses revoke and preserves the audit reason verbatim", async () => {
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  const reason = "  Wrong designation was recorded.  ";
  await revokeLetter("uuid", reason);
  expect(api.post).toHaveBeenCalledExactlyOnceWith(
    "/letter-forge/letters/uuid/revoke",
    { reason },
  );
});
it("rejects a short reason without sending a request", async () => {
  await expect(revokeLetter("uuid", "short")).rejects.toThrow("10–1,000");
  expect(api.post).not.toHaveBeenCalled();
});
it("returns the replacement UUID and passes fresh values", async () => {
  vi.mocked(api.post).mockResolvedValue({
    data: { data: { uuid: "replacement" } },
  });
  const payload = {
    reason: "Corrected the monthly amount.",
    extra_data: { monthly_amount: "95,000" },
  };
  expect((await supersedeLetter("original", payload)).data.uuid).toBe(
    "replacement",
  );
  expect(api.post).toHaveBeenCalledExactlyOnceWith(
    "/letter-forge/letters/original/supersede",
    payload,
  );
});
it("posts a reminder without an invented payload", async () => {
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  await remindLetter("uuid");
  expect(api.post).toHaveBeenCalledExactlyOnceWith(
    "/letter-forge/letters/uuid/remind",
  );
});
it("unwraps nested collection data and keeps pagination", async () => {
  const meta = { current_page: 2, last_page: 3, total: 60, per_page: 25 };
  vi.mocked(api.get).mockResolvedValue({
    data: { success: true, data: { data: [{ uuid: "letter" }], meta } },
  });
  const response = await getGeneratedLetters({ page: 2, status: "dispatched" });
  expect(response.data).toEqual([{ uuid: "letter" }]);
  expect(response.meta).toEqual(meta);
});
it("downloads a blob only from the authenticated endpoint and releases its URL", async () => {
  vi.useFakeTimers();
  const blob = new Blob(["pdf"], { type: "application/pdf" });
  vi.mocked(api.get).mockResolvedValue({ data: blob });
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:test"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => undefined);
  await downloadLetter("uuid", "letter.pdf");
  expect(api.get).toHaveBeenCalledExactlyOnceWith(
    "/letter-forge/letters/uuid/download",
    { responseType: "blob" },
  );
  expect(click).toHaveBeenCalledOnce();
  expect(document.querySelector("a[download]")).toBeNull();
  await vi.advanceTimersByTimeAsync(1000);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
});
it("decodes an expired artifact error returned as a blob", async () => {
  const blob = new Blob([]);
  Object.defineProperty(blob, "text", {
    value: async () => JSON.stringify({ message: "Artifact expired." }),
  });
  vi.mocked(api.get).mockRejectedValue({
    response: { status: 404, data: blob },
  });
  await expect(downloadLetter("uuid", "letter.pdf")).rejects.toThrow(
    "Artifact expired.",
  );
});
it("blocks expired downloads and dispatch before rendering, and allows replacing revoked letters", () => {
  const base: LetterRecord = {
    uuid: "uuid",
    status: "generated",
    employee_id: 1,
    template_key: "confirmation_letter",
    language: "en",
  };
  expect(letterActions(base).dispatch).toBe(false);
  expect(
    letterActions({ ...base, generated_pdf_path: "private-path" }).dispatch,
  ).toBe(true);
  expect(
    letterActions({
      ...base,
      can_download: true,
      artifacts_expired_at: "2026-09-30",
    }).download,
  ).toBe(false);
  expect(letterActions({ ...base, status: "revoked" }).supersede).toBe(true);
  expect(letterActions({ ...base, status: "superseded" }).revoke).toBe(false);
});
