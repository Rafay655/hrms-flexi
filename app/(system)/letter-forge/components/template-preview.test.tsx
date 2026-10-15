import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { LetterTemplate } from "@/types/letter-forge";
import { TemplateActionModal } from "./template-modals";

vi.mock("@/lib/api", () => ({ api: { post: vi.fn() } }));
vi.mock("@/store/hooks", () => ({ useAppSelector: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: { error: vi.fn(), success: vi.fn() } }));

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;
const template = { uuid: "confirmation-uuid", name: "Confirmation letter", language: "en" } as LetterTemplate;
const response = { data: { success: true, message: "Success", data: {
  html: "<p>Dear <strong>Ahmed Raza</strong>,</p><p>Congratulations on this achievement.</p>",
  variables_used: ["{{today_date}}", "{{employee_name}}", "{{confirmation_effective_date}}"],
} } };

beforeEach(() => {
  vi.resetAllMocks();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
});

async function renderPreview(selected = template) {
  await act(async () => {
    root.render(createElement(StrictMode, null,
      createElement(QueryClientProvider, { client },
        createElement(TemplateActionModal, { key: selected.uuid, template: selected, action: "preview", onClose: vi.fn(), onSaved: vi.fn() }))));
  });
}

async function settle(assertion: () => void) {
  await vi.waitFor(async () => {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
    assertion();
  });
}

it.each([false, true])("publishes only after confirmation and reports review routing: %s", async (reviewRequired) => {
  const onSaved = vi.fn();
  if (reviewRequired) vi.mocked(api.post).mockRejectedValueOnce({ response: { status: 409 } });
  vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: { version: 2 } } });
  await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(TemplateActionModal, { template, action: "publish", onClose: vi.fn(), onSaved }))));
  expect(api.post).not.toHaveBeenCalled();
  const button = [...document.querySelectorAll("button")].find((item) => item.textContent === "Publish template")!;
  await act(async () => button.click());
  await settle(() => expect(onSaved).toHaveBeenCalledWith(reviewRequired ? "Submitted for review. The server requires approval before publication." : "Template published successfully."));
  expect(api.post).toHaveBeenNthCalledWith(1, "/letter-forge/templates/confirmation-uuid/publish");
  if (reviewRequired) expect(api.post).toHaveBeenNthCalledWith(2, "/letter-forge/templates/confirmation-uuid/submit-review");
});

it("leaves loading and renders the API HTML and variables after a Strict Mode remount", async () => {
  let complete!: (value: typeof response) => void;
  vi.mocked(api.post).mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
  await renderPreview();
  expect(document.body.textContent).toContain("Loading preview");
  await act(async () => complete(response));
  await settle(() => expect(document.querySelector("iframe")?.getAttribute("srcdoc")).toContain(response.data.data.html));
  expect(document.body.textContent).not.toContain("Loading preview");
  for (const variable of response.data.data.variables_used) expect(document.body.textContent).toContain(variable);
  expect(document.querySelector("iframe")?.getAttribute("sandbox")).toBe("");
  expect(api.post).toHaveBeenCalledExactlyOnceWith("/letter-forge/templates/confirmation-uuid/preview");
});

it("shows an error toast and successfully retries preview", async () => {
  vi.mocked(api.post).mockRejectedValueOnce({ response: { data: { message: "Preview unavailable" } } }).mockResolvedValueOnce(response);
  await renderPreview();
  await settle(() => expect(toast.error).toHaveBeenCalledWith("Preview unavailable", expect.any(Object)));
  const retry = Array.from(document.querySelectorAll("button")).find((button) => button.textContent === "Retry preview");
  expect(retry).toBeDefined();
  await act(async () => retry!.click());
  await settle(() => expect(document.querySelector("iframe")?.getAttribute("srcdoc")).toContain("Ahmed Raza"));
  expect(document.body.textContent).not.toContain("Loading preview");
});

it("does not show another template's HTML when switching templates", async () => {
  vi.mocked(api.post).mockResolvedValueOnce(response).mockResolvedValueOnce({ data: { ...response.data, data: { html: "<p>Second template</p>", variables_used: [] } } });
  await renderPreview();
  await settle(() => expect(document.querySelector("iframe")?.getAttribute("srcdoc")).toContain("Ahmed Raza"));
  await renderPreview({ ...template, uuid: "second-uuid" });
  await settle(() => expect(document.querySelector("iframe")?.getAttribute("srcdoc")).toContain("Second template"));
  expect(document.querySelector("iframe")?.getAttribute("srcdoc")).not.toContain("Ahmed Raza");
});
