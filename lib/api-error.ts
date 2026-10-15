import { ERROR_CATALOG, type ErrorCode, type ErrorSeverity } from "@/types/api-errors.generated";

export interface ParsedApiError {
  code: string;
  message: string;
  hint?: string;
  requestId?: string;
  status?: number;
  severity: ErrorSeverity;
  fieldErrors: Record<string, string[]>;
  cancelled: boolean;
}
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === "string" && value.trim() ? value : undefined;
export function parseApiError(error: unknown): ParsedApiError {
  const err = record(error), response = record(err.response), body = record(response.data ?? (err.success === false ? error : undefined));
  const detail = record(body.error), headers = record(response.headers);
  const status = typeof response.status === "number" ? response.status : typeof detail.status === "number" ? detail.status : undefined;
  const code = text(detail.code) ?? text(headers["x-error-code"]) ?? (status ? "LEGACY_ERROR" : "NETWORK_ERROR");
  const catalog = Object.prototype.hasOwnProperty.call(ERROR_CATALOG, code) ? ERROR_CATALOG[code as ErrorCode] : undefined;
  const cancelled = err.code === "ERR_CANCELED" || err.name === "AbortError" || err.__CANCEL__ === true;
  const serverFailure = status !== undefined && status >= 500;
  const fieldErrors: Record<string, string[]> = {};
  if (!serverFailure) for (const [key, value] of Object.entries(record(detail.field_errors ?? body.errors))) {
    const messages = (Array.isArray(value) ? value : [value]).filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
    if (messages.length) fieldErrors[key] = messages;
  }
  const fallbacks: Record<number, string> = {
    401: "Your session has expired. Please sign in again.", 403: "You do not have permission to perform this action.",
    404: "This record could not be found. Refresh and try again.", 409: "This action conflicts with the current record. Refresh and try again.",
    422: "Please check the highlighted fields and try again.", 429: "Too many requests. Please wait before trying again.",
  };
  const timeout = err.code === "ECONNABORTED" || err.code === "ETIMEDOUT";
  const message = serverFailure
    ? catalog?.message ?? "Something went wrong on the server. Please try again later."
    : text(detail.message) ?? Object.values(fieldErrors)[0]?.[0] ?? text(body.message)
      ?? catalog?.message ?? (status ? fallbacks[status] ?? "This action could not be completed. Please try again."
        : timeout ? "The request took too long. Please try again."
        : err.isAxiosError ? "Unable to connect. Check your connection and try again."
        : error instanceof Error ? error.message : text(error) ?? "Something went wrong. Please try again.");
  const severity = detail.severity;
  return { code, message, status, cancelled, fieldErrors,
    hint: serverFailure ? undefined : text(detail.hint),
    requestId: text(detail.request_id) ?? text(headers["x-request-id"]),
    severity: serverFailure ? "critical" : ["info", "warning", "error", "critical"].includes(String(severity)) ? severity as ErrorSeverity : catalog?.severity ?? "error",
  };
}
