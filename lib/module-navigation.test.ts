import { afterEach, expect, it, vi } from "vitest";
import { activeModuleLink, moduleDestination, moduleRoute, savedModuleDestination, MODULE_STORAGE_KEY } from "./module-navigation";
import { getModuleIdForPath } from "./sidebarData";
import sidebar, { setActiveModuleId } from "@/store/sidebarSlice";

afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
const letterForge = getModuleIdForPath("/letter-forge")!;
it("restores the saved module and its dashboard for login", () => {
  localStorage.setItem(MODULE_STORAGE_KEY, String(letterForge));
  expect(savedModuleDestination()).toEqual({ id: letterForge, path: "/letter-forge" });
});
it.each([null, "bad", "10abc", "99999", "-1"])("falls back safely for invalid saved module %s", (value) => {
  expect(moduleDestination(value)).toEqual(moduleDestination(1));
});
it("uses dashboard when no Letter Forge link matches, and preserves detail links", () => {
  expect(moduleRoute("/letter-forge/unknown")?.redirect).toBe("/letter-forge");
  expect(moduleRoute("/letter-forge/templates/uuid/review")?.redirect).toBeUndefined();
  expect(activeModuleLink("/letter-forge/templates/uuid/review", letterForge)).toBe("/letter-forge/templates");
  expect(activeModuleLink("/letter-forge", letterForge)).toBe("/letter-forge");
  expect(moduleRoute("/auth/login")).toBeNull();
});
it("persists module changes without collapsing menus on same-module URL changes", () => {
  const state = sidebar({ activeModuleId: 1, openDropdowns: ["test"] }, setActiveModuleId(letterForge));
  expect(state).toEqual({ activeModuleId: letterForge, openDropdowns: [] });
  expect(localStorage.getItem(MODULE_STORAGE_KEY)).toBe(String(letterForge));
  expect(sidebar({ ...state, openDropdowns: ["open"] }, setActiveModuleId(letterForge)).openDropdowns).toEqual(["open"]);
});
it("continues navigation when local storage is unavailable", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  expect(savedModuleDestination()).toEqual(moduleDestination(1));
  expect(sidebar({ activeModuleId: 1, openDropdowns: [] }, setActiveModuleId(letterForge)).activeModuleId).toBe(letterForge);
});
