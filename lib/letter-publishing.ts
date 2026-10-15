import type { TemplateVersion, LetterRenderStatus } from "@/types/letter-forge";

export function canReviewVersion(version: TemplateVersion, userId: string | undefined): boolean {
  if (!userId || version.status !== "review_required") return false;
  if ([version.maker?.uuid, version.submitter?.uuid, String(version.created_by), String(version.submitted_by)].includes(userId)) return false;
  return version.can_review === true;
}

export function changedVersionFields(current: TemplateVersion, previous?: TemplateVersion): string[] | null {
  if (!current.content || (previous && !previous.content)) return null;
  return Object.keys(current.content).filter((key) => {
    const field = key as keyof NonNullable<TemplateVersion["content"]>;
    return JSON.stringify(current.content?.[field] ?? null) !== JSON.stringify(previous?.content?.[field] ?? null);
  });
}

export function renderStage(letter: LetterRenderStatus): "waiting" | "approval" | "ready" | "failed" | "stopped" {
  if (letter.status === "failed") return "failed";
  if (letter.status === "pending_approval") return "approval";
  if (["rejected", "cancelled", "recalled", "revoked", "superseded"].includes(letter.status)) return "stopped";
  if (letter.generated_pdf_path || letter.can_download) return "ready";
  return "waiting";
}

export function parseLetterExtraData(text: string): Record<string, string | number | boolean> {
  const value: unknown = text.trim() ? JSON.parse(text) : {};
  if (!value || Array.isArray(value) || typeof value !== "object" || Object.values(value).some((item) => !["string", "number", "boolean"].includes(typeof item))) {
    throw new Error("Extra data must be a flat object containing only text, numbers, or true/false values.");
  }
  return value as Record<string, string | number | boolean>;
}
