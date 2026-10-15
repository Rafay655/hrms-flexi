import { afterEach, expect, it, vi } from "vitest";
import { api } from "./api";
import { store } from "@/store/store";
vi.mock("@/store/store", () => ({ store: { dispatch: vi.fn() } }));
vi.mock("@/store/authSlice", () => ({ clearAuth: () => ({ type: "clear" }) }));
afterEach(() => vi.clearAllMocks());

it("does not clear authentication when login credentials are rejected", async () => {
  const error = { config: { url: "/auth/login" }, response: { status: 401, data: { success: false, error: { code: "CC_INVALID_CREDENTIALS", message: "Invalid email or password." } } } };
  await expect(api.get("/auth/login", { adapter: async () => { throw error; } })).rejects.toMatchObject({ apiError: { code: "CC_INVALID_CREDENTIALS" } });
  expect(store.dispatch).not.toHaveBeenCalled();
});
it("keeps silent background authentication failures from logging out", async () => {
  await expect(api.get("/device-tokens", { adapter: async () => { throw { config: { url: "/device-tokens" }, response: { status: 401 } }; } })).rejects.toMatchObject({ apiError: { status: 401 } });
  expect(store.dispatch).not.toHaveBeenCalled();
});
it("preserves HTTP metadata while parsing unified errors", async () => {
  const error = { response: { status: 429, headers: { "retry-after": "60" }, data: { error: { code: "LETTERFORGE_BATCH_BACKPRESSURE", message: "Please wait for the running batch." } } } };
  await expect(api.get("/letter-forge/letter-batches", { adapter: async () => { throw error; } })).rejects.toMatchObject({ response: { status: 429, headers: { "retry-after": "60" } }, apiError: { message: "Please wait for the running batch." } });
});
it("adds legacy field aliases without removing unified fields or metadata", async () => {
  const detail = { code: "VALIDATION_FAILED", message: "Check fields", field_errors: { name: ["Required"] }, request_id: "ref-123" };
  await expect(api.post("/employees", {}, { adapter: async () => { throw { response: { status: 422, data: { success: false, error: detail, extra: "retained" } } }; } })).rejects.toMatchObject({ response: { data: { error: detail, extra: "retained", message: "Check fields", errors: { name: ["Required"] } } } });
});
