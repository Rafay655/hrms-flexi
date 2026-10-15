"use client";
import toast from "react-hot-toast";
import { parseApiError } from "./api-error";

const shown = new WeakSet<object>();
const recent = new Map<string, number>();
export function markApiErrorHandled(error: unknown) {
  if (typeof error === "object" && error !== null) shown.add(error);
}
export function showApiError(error: unknown, options: { id?: string | number; fallbackMessage?: unknown; description?: unknown; [key: string]: unknown } = {}) {
  const parsed = parseApiError(error);
  // The login page displays the persisted session notice after navigation.
  if (parsed.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/auth/login")) {
    try { if (sessionStorage.getItem("api-session-expired")) return; } catch { /* Storage is optional. */ }
  }
  if (parsed.cancelled || (typeof error === "object" && error !== null && shown.has(error))) return;
  markApiErrorHandled(error);
  const id = String(options.id ?? `api-error:${parsed.code}:${parsed.message}`);
  const now = Date.now();
  for (const [key, time] of recent) if (now - time >= 5000) recent.delete(key);
  if (recent.has(id)) return;
  recent.set(id, now);
  const fallback = typeof options.fallbackMessage === "string" ? options.fallbackMessage : undefined;
  const mainMessage = parsed.message === "Something went wrong. Please try again." && fallback ? fallback : parsed.message;
  const hint = parsed.hint ?? (typeof options.description === "string" ? options.description : undefined);
  const message = [mainMessage, hint, parsed.requestId && parsed.severity === "critical" ? `Support reference: ${parsed.requestId}` : undefined].filter(Boolean).join("\n");
  toast.error(message, {
    id, duration: parsed.severity === "critical" ? 8000 : 6000,
    style: { maxWidth: "440px", whiteSpace: "pre-line", ...(parsed.severity === "warning" ? { background: "#fffbeb", color: "#92400e" } : parsed.severity === "info" ? { background: "#eff6ff", color: "#1e40af" } : {}) },
    icon: parsed.severity === "warning" ? "⚠" : parsed.severity === "info" ? "ⓘ" : undefined,
  });
}
