import { describe, it, expect, beforeEach } from "vitest";
import reducer, { setAuth, clearAuth, type AuthUser } from "./authSlice";

const makeUser = (companyId: string | null): AuthUser => ({
  id: "u1",
  name: "Test User",
  email: "t@example.com",
  phone: null,
  avatar: null,
  user_type: "super_admin",
  must_change_password: false,
  is_active: true,
  last_login_at: null,
  tenant: null,
  company: companyId
    ? { id: companyId, name: "Acme", timezone: null, currency: null, logo: null }
    : null,
  roles: ["super_admin"],
  permissions: ["view-employees"],
  created_at: "2026-01-01",
});

describe("authSlice", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "is_authenticated=; Max-Age=0; path=/";
    document.cookie = "companyId=; Max-Age=0; path=/";
  });

  it("setAuth populates state from the login payload", () => {
    const state = reducer(undefined, setAuth({ token: "tok-123", user: makeUser("co-1") }));
    expect(state.token).toBe("tok-123");
    expect(state.user?.email).toBe("t@example.com");
    expect(state.company?.id).toBe("co-1");
    expect(state.roles).toContain("super_admin");
    expect(state.permissions).toContain("view-employees");
  });

  it("H-3: mirrors ONLY token + companyId to localStorage (no duplicated keys)", () => {
    reducer(undefined, setAuth({ token: "tok-123", user: makeUser("co-1") }));
    expect(localStorage.getItem("accessToken")).toBe("tok-123");
    expect(localStorage.getItem("companyId")).toBe("co-1");
    // Redundant manual keys are no longer written — redux-persist owns them.
    expect(localStorage.getItem("authUser")).toBeNull();
    expect(localStorage.getItem("roles")).toBeNull();
    expect(localStorage.getItem("permissions")).toBeNull();
  });

  it("H-2: sets the is_authenticated marker cookie and NEVER the raw token", () => {
    reducer(undefined, setAuth({ token: "tok-123", user: makeUser("co-1") }));
    expect(document.cookie).toContain("is_authenticated=1");
    expect(document.cookie).not.toContain("tok-123");
    expect(document.cookie).not.toContain("accessToken");
  });

  it("super-admin with no company clears any stale companyId", () => {
    localStorage.setItem("companyId", "stale");
    reducer(undefined, setAuth({ token: "tok-123", user: makeUser(null) }));
    expect(localStorage.getItem("companyId")).toBeNull();
  });

  it("clearAuth resets state and wipes auth storage + marker cookie", () => {
    reducer(undefined, setAuth({ token: "tok-123", user: makeUser("co-1") }));
    const state = reducer(undefined, clearAuth());
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.roles).toEqual([]);
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("companyId")).toBeNull();
    expect(document.cookie).not.toContain("is_authenticated=1");
  });
});
