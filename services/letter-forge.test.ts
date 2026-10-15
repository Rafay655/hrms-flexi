import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import {
  activateLetterTemplate, deactivateLetterTemplate, deleteLetterTemplate,
  previewLetterTemplate, updateLetterTemplate, getLetterForgeError,
} from "./letter-forge";

vi.mock("@/lib/api", () => ({ api: { post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

describe("Letter Forge template API contract", () => {
  beforeEach(() => vi.resetAllMocks());

  it("posts a saved-template preview and preserves HTML and placeholders", async () => {
    const response = { success: true, message: "Success", data: {
      html: "<p>Dear <strong>Ahmed Raza</strong></p>",
      variables_used: ["{{today_date}}", "{{reference_number}}", "{{employee_name}}"],
    } };
    vi.mocked(api.post).mockResolvedValue({ data: response });
    expect(await previewLetterTemplate("template-uuid")).toEqual(response);
    expect(api.post).toHaveBeenCalledExactlyOnceWith("/letter-forge/templates/template-uuid/preview");
  });

  it.each([
    ["activate", activateLetterTemplate], ["deactivate", deactivateLetterTemplate],
  ] as const)("posts %s without an invented payload", async (action, request) => {
    const response = { success: true, data: { uuid: "template-uuid", is_active: action === "activate" } };
    vi.mocked(api.post).mockResolvedValue({ data: response });
    expect(await request("template-uuid")).toEqual(response);
    expect(api.post).toHaveBeenCalledExactlyOnceWith(`/letter-forge/templates/template-uuid/${action}`);
  });

  it("deletes by UUID and tolerates an empty 204 response", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 204, data: undefined });
    await expect(deleteLetterTemplate("template-uuid")).resolves.toBeUndefined();
    expect(api.delete).toHaveBeenCalledExactlyOnceWith("/letter-forge/templates/template-uuid");
  });

  it("updates within the letter-forge namespace", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { success: true } });
    await updateLetterTemplate("template-uuid", { name: "Updated template" });
    expect(api.put).toHaveBeenCalledExactlyOnceWith("/letter-forge/templates/template-uuid", { name: "Updated template" });
  });

  it("preserves activation failures and exposes the backend validation message", async () => {
    const error = { response: { status: 422, data: { errors: { body_html: ["Unknown variable."] } } } };
    vi.mocked(api.post).mockRejectedValue(error);
    await expect(activateLetterTemplate("template-uuid")).rejects.toBe(error);
    expect(getLetterForgeError(error).message).toBe("Unknown variable.");
  });
});
