import { beforeEach, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { publishTemplate, reviewTemplate, retireTemplateVersion, getTemplateVersions, generateLetter, getLetterRenderStatus, previewLetterTemplate } from "./letter-forge";

vi.mock("@/lib/api", () => ({ api: { post: vi.fn(), get: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());

it("publishes directly without submitting another review", async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: { version: 2 } } });
  expect((await publishTemplate("uuid")).routedToReview).toBe(false);
  expect(api.post).toHaveBeenCalledExactlyOnceWith("/letter-forge/templates/uuid/publish");
});
it("routes a publish 409 to submit-review", async () => {
  vi.mocked(api.post).mockRejectedValueOnce({ response: { status: 409 } }).mockResolvedValueOnce({ data: { success: true, data: { version: 2, status: "review_required" } } });
  expect((await publishTemplate("uuid")).routedToReview).toBe(true);
  expect(api.post).toHaveBeenNthCalledWith(2, "/letter-forge/templates/uuid/submit-review");
});
it.each([403, 422, 500])("does not submit-review after a %s failure", async (status) => {
  const error = { response: { status } };
  vi.mocked(api.post).mockRejectedValue(error);
  await expect(publishTemplate("uuid")).rejects.toBe(error);
  expect(api.post).toHaveBeenCalledTimes(1);
});
it("surfaces a failed fallback rather than reporting review success", async () => {
  const error = { response: { status: 422 } };
  vi.mocked(api.post).mockRejectedValueOnce({ response: { status: 409 } }).mockRejectedValueOnce(error);
  await expect(publishTemplate("uuid")).rejects.toBe(error);
});
it("sends review decisions and retirement to their exact endpoints", async () => {
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  await reviewTemplate("uuid", { decision: "reject", note: "Incorrect notice period." });
  expect(api.post).toHaveBeenLastCalledWith("/letter-forge/templates/uuid/review", { decision: "reject", note: "Incorrect notice period." });
  await reviewTemplate("uuid", { decision: "approve" });
  expect(api.post).toHaveBeenLastCalledWith("/letter-forge/templates/uuid/review", { decision: "approve" });
  await retireTemplateVersion("uuid", 12);
  expect(api.post).toHaveBeenLastCalledWith("/letter-forge/templates/uuid/versions/12/retire");
});
it("loads the history envelope and previews the selected frozen version", async () => {
  const response = { data: { versions: [{ id: 5 }] } };
  vi.mocked(api.get).mockResolvedValue({ data: response });
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  const signal = new AbortController().signal;
  expect(await getTemplateVersions("uuid", signal)).toBe(response);
  expect(api.get).toHaveBeenCalledWith("/letter-forge/templates/uuid/versions", { signal });
  await previewLetterTemplate("uuid", 5);
  expect(api.post).toHaveBeenCalledWith("/letter-forge/templates/uuid/preview", { version_id: 5 });
});
it("preserves generation fallback metadata and passes cancellation to polling", async () => {
  const response = { data: { uuid: "letter" }, meta: { language_fallback: { requested: "ur", rendered: "en", note: "English used." } } };
  vi.mocked(api.post).mockResolvedValue({ data: response });
  vi.mocked(api.get).mockResolvedValue({ data: { data: { status: "generated", generated_pdf_path: null } } });
  expect(await generateLetter({ template_key: "warning_letter", employee_id: 412 })).toBe(response);
  const signal = new AbortController().signal;
  await getLetterRenderStatus("letter", signal);
  expect(api.get).toHaveBeenCalledWith("/letter-forge/letters/letter/status", { signal, timeout: 15000 });
});
