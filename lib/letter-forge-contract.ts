import type { ApiEnvelope, PaginationMeta } from "../types/letter-forge";
export function normalizeLetterList<T>(envelope: ApiEnvelope<unknown>): ApiEnvelope<T[]> {
  const nested = envelope.data as { data?: T[]; meta?: PaginationMeta } & Partial<PaginationMeta>;
  const rows = Array.isArray(envelope.data) ? envelope.data : nested?.data;
  if (!Array.isArray(rows)) throw new Error("Unexpected Letter Forge list response.");
  const meta = envelope.meta ?? nested?.meta ?? (nested?.current_page !== undefined ? {
    current_page: nested.current_page, last_page: nested.last_page ?? 1, per_page: nested.per_page ?? rows.length,
    total: nested.total ?? rows.length, from: nested.from ?? null, to: nested.to ?? null,
  } : undefined);
  return { ...envelope, data: rows as T[], meta };
}
export function parseSseEvent(block: string): { event: string; text?: string; message?: string } | null {
  const lines = block.split("\n"); const event = lines.find(line => line.startsWith("event:"))?.slice(6).trim();
  const data = lines.filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).join("\n");
  if (!event || !data) return null;
  return { ...JSON.parse(data), event };
}
export function parseLetterVariables(text: string): Record<string, string | number | boolean | null> {
  const value: unknown = JSON.parse(text || "{}");
  if (!value || Array.isArray(value) || typeof value !== "object" || Object.values(value).some(item => item !== null && !["string", "number", "boolean"].includes(typeof item))) throw new Error("Variables must be a JSON object containing text, numbers, booleans or null.");
  return value as Record<string, string | number | boolean | null>;
}
