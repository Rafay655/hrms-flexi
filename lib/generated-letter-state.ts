import type { LetterRecord } from "@/types/generated-letters";
export const LETTER_STATUSES = ["generated", "pending_approval", "approved", "rejected", "pending_signature", "signed", "dispatched", "revoked", "superseded", "failed", "recalled"] as const;
export function letterActions(letter: LetterRecord) {
  const downloadable = !letter.artifacts_expired_at && Boolean(letter.can_download || letter.generated_pdf_path || letter.signed_pdf_path);
  return {
    download: downloadable,
    dispatch: letter.status === "pending_signature" || (downloadable && ["generated", "approved", "signed"].includes(letter.status)),
    remind: letter.status === "pending_signature" || (letter.status === "dispatched" && letter.acknowledgement_status === "pending"),
    revoke: letter.can_revoke ?? letter.status === "dispatched",
    supersede: letter.can_supersede ?? ["dispatched", "revoked"].includes(letter.status),
  };
}
export function letterTitle(letter: LetterRecord) { return letter.template?.name ?? letter.template_key.replaceAll("_", " "); }
export function label(value: string) { return value.replaceAll("_", " "); }
export const REMINDER_COOLDOWN = 3 * 60 * 1000;
