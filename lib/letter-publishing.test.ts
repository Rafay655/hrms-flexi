import { expect, it } from "vitest";
import { canReviewVersion, changedVersionFields, parseLetterExtraData, renderStage } from "./letter-publishing";
import type { TemplateVersion } from "@/types/letter-forge";

const version = { status: "review_required", can_review: true, created_by: 12, submitted_by: 13, maker: { uuid: "maker", name: "Maker" }, submitter: { uuid: "submitter", name: "Submitter" } } as TemplateVersion;
it("blocks makers, submitters, unknown identities and non-review versions", () => {
  expect(canReviewVersion(version, "maker")).toBe(false);
  expect(canReviewVersion(version, "submitter")).toBe(false);
  expect(canReviewVersion(version, "12")).toBe(false);
  expect(canReviewVersion(version, undefined)).toBe(false);
  expect(canReviewVersion({ ...version, can_review: undefined }, "checker")).toBe(false);
  expect(canReviewVersion({ ...version, status: "draft" }, "checker")).toBe(false);
  expect(canReviewVersion(version, "checker")).toBe(true);
});
it("compares frozen content and reports unavailable history honestly", () => {
  const content = { body_html: "old", header_html: null, footer_html: null, sample_values: {}, source_schema_json: null };
  expect(changedVersionFields({ ...version, content: { ...content, body_html: "new" } }, { ...version, content })).toEqual(["body_html"]);
  expect(changedVersionFields(version, version)).toBeNull();
});
it("accepts only scalar extra-data values", () => {
  expect(parseLetterExtraData('{"days":3,"name":"Ahmed","confirmed":true}')).toEqual({ days: 3, name: "Ahmed", confirmed: true });
  for (const input of ['[]', 'null', '{"nested":{}}', '{"items":[]}', '{"nil":null}']) expect(() => parseLetterExtraData(input)).toThrow();
});
it("waits for an artifact even if status remains generated", () => {
  expect(renderStage({ uuid: "x", status: "generated", generated_pdf_path: null })).toBe("waiting");
  expect(renderStage({ uuid: "x", status: "generated", generated_pdf_path: "letters/x.pdf" })).toBe("ready");
  expect(renderStage({ uuid: "x", status: "pending_approval" })).toBe("approval");
  expect(renderStage({ uuid: "x", status: "failed" })).toBe("failed");
  expect(renderStage({ uuid: "x", status: "revoked", generated_pdf_path: "x.pdf" })).toBe("stopped");
});
