import { describe, expect, it, vi, afterEach } from "vitest";
import { parseApiError } from "./api-error";
import { showApiError } from "./error-toast";
import toast from "react-hot-toast";
vi.mock("react-hot-toast", () => ({ default: { error: vi.fn() } }));
afterEach(() => vi.clearAllMocks());
describe("API errors", () => {
  it("preserves local validation messages passed as strings", () => {
    expect(parseApiError("At least one valid slab is required.").message).toBe("At least one valid slab is required.");
  });
  it("preserves nested validation, hint, code and support reference", () => {
    expect(parseApiError({ response: { status: 422, data: { success: false, error: { code: "VALIDATION_FAILED", message: "Check your inputs.", hint: "Choose an employee.", field_errors: { employee_id: "Required", name: ["Too short"] }, request_id: "ref1" } } } })).toMatchObject({ message: "Check your inputs.", hint: "Choose an employee.", fieldErrors: { employee_id: ["Required"], name: ["Too short"] }, requestId: "ref1" });
  });
  it("supports legacy validation without truncating string messages", () => {
    expect(parseApiError({ response: { status: 422, data: { errors: { name: "Name is required" } } } }).message).toBe("Name is required");
  });
  it("accepts null fields and unknown future codes", () => {
    expect(parseApiError({ success: false, error: { code: "FUTURE_CODE", message: "Try another option", field_errors: null } })).toMatchObject({ code: "FUTURE_CODE", fieldErrors: {}, message: "Try another option" });
  });
  it("hides server internals and uses response headers for support", () => {
    const parsed = parseApiError({ response: { status: 500, headers: { "x-request-id": "safe-ref" }, data: { message: "SQLSTATE secret", error: { message: "stack trace", hint: "private path", field_errors: { sql: "secret" } } } } });
    expect(parsed.message).not.toMatch(/SQLSTATE|stack/); expect(parsed.hint).toBeUndefined(); expect(parsed.fieldErrors).toEqual({}); expect(parsed.requestId).toBe("safe-ref");
  });
  it("distinguishes offline, timeout and cancelled requests", () => {
    expect(parseApiError({ isAxiosError: true, message: "Network Error" }).message).toContain("Unable to connect");
    expect(parseApiError({ isAxiosError: true, code: "ECONNABORTED" }).message).toContain("too long");
    showApiError({ code: "ERR_CANCELED" }); expect(toast.error).not.toHaveBeenCalled();
  });
  it("deduplicates notifications and includes actionable hints", () => {
    const error = { response: { status: 409, data: { error: { code: "RESOURCE_CONFLICT", message: "Changed elsewhere", hint: "Refresh first" } } } };
    showApiError(error); showApiError(error); showApiError({ ...error });
    expect(toast.error).toHaveBeenCalledTimes(1); expect(toast.error).toHaveBeenCalledWith("Changed elsewhere\nRefresh first", expect.any(Object));
  });
});
