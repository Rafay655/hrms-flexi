import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { TemplateFormModal } from "./template-modals";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }));
vi.mock("@/store/hooks", () => ({ useAppSelector: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: { error: vi.fn(), success: vi.fn() } }));
let root: Root, container: HTMLDivElement, client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.append(container);
  root = createRoot(container); client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(api.put).mockResolvedValue({ data: { success: true } });
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); });
function toggle(name: string) {
  return [...document.querySelectorAll<HTMLButtonElement>('[role="switch"]')].find((item) => item.textContent?.startsWith(name))!;
}
it("keeps template values and highlights server validation errors", async () => {
  await render("none");
  vi.mocked(api.put).mockRejectedValue({ response: { status: 422, data: { success: false, error: { code: "VALIDATION_FAILED", message: "Check the template name.", field_errors: { name: ["This name is already used."] } } } } });
  await act(async () => [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Save changes")!.click());
  const input = document.querySelector<HTMLInputElement>("#tpl-name")!;
  expect(input.value).toBe("Confirmation");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(document.body.textContent).toContain("This name is already used.");
  expect(api.put).toHaveBeenCalledTimes(1);
});
async function render(policy: string, mode: "create" | "edit" = "edit") {
  vi.mocked(api.get).mockResolvedValue({ data: { data: {
    uuid: "template", template_key: "confirmation_letter", name: "Confirmation", language: "en", engine: "legacy", body_html: "<p>Hello</p>",
    requires_approval: true, series_tracking: true, signature_policy: policy,
    // Typed policy must win over stale legacy flags in edit responses.
    requires_e_signature: true, requires_employee_acknowledgement: true,
  } } });
  await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(TemplateFormModal, { mode, uuid: "template", onClose: vi.fn(), onSaved: vi.fn() }))));
  await vi.waitFor(async () => { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); }); expect(toggle("E-signature")).toBeTruthy(); });
}
it.each(["none", "internal_signatory", "employee_acknowledgement"])("hydrates and saves %s without conflicting legacy flags", async (policy) => {
  await render(policy);
  expect(toggle("E-signature").getAttribute("aria-checked")).toBe(String(policy === "internal_signatory"));
  expect(toggle("Employee acknowledgement").getAttribute("aria-checked")).toBe(String(policy === "employee_acknowledgement"));
  await act(async () => [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Save changes")!.click());
  const payload = vi.mocked(api.put).mock.calls[0][1];
  expect(payload).toMatchObject({ signature_policy: policy, requires_approval: true, series_tracking: true });
  expect(payload).not.toHaveProperty("requires_e_signature");
  expect(payload).not.toHaveProperty("requires_employee_acknowledgement");
});
it.each(["create", "edit"] as const)("makes toggles mutually exclusive in %s without changing approval", async (mode) => {
  await render("none", mode);
  await act(async () => toggle("E-signature").click());
  expect(toggle("Employee acknowledgement").getAttribute("aria-checked")).toBe("false");
  await act(async () => toggle("Employee acknowledgement").click());
  expect(toggle("E-signature").getAttribute("aria-checked")).toBe("false");
  expect(toggle("Employee acknowledgement").getAttribute("aria-checked")).toBe("true");
  await act(async () => toggle("E-signature").click());
  expect(toggle("Employee acknowledgement").getAttribute("aria-checked")).toBe("false");
  await act(async () => toggle("E-signature").click());
  expect(toggle("E-signature").getAttribute("aria-checked")).toBe("false");
  expect(toggle("Requires approval").getAttribute("aria-checked")).toBe("true");
  expect(toggle("Series tracking").getAttribute("aria-checked")).toBe("true");
});
