// store/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AuthCompany = {
  id: string;
  name: string | null;
  timezone: string | null;
  currency: string | null;
  logo: string | null;
};

export type AuthTenant = {
  id?: string;
  name?: string;
} | null;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  user_type: string;
  must_change_password: boolean;
  is_active: boolean;
  last_login_at: string | null;
  tenant: AuthTenant;
  company: AuthCompany | null;
  roles: string[];
  permissions: string[];
  created_at: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  company: AuthCompany | null;
  roles: string[];
  permissions: string[];
};

type LoginPayload = {
  token: string;
  user: AuthUser;
};

const initialState: AuthState = {
  token: null,
  user: null,
  company: null,
  roles: [],
  permissions: [],
};

const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === "undefined") return;

  const expires = new Date(Date.now() + days * 864e5).toUTCString();

  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/; SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<LoginPayload>) => {
      const { token, user } = action.payload;

      const company = user.company ?? null;
      const roles = user.roles ?? [];
      const permissions = user.permissions ?? [];

      state.token = token;
      state.user = user;
      state.company = company;
      state.roles = roles;
      state.permissions = permissions;

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("authUser", JSON.stringify(user));
        localStorage.setItem("authCompany", JSON.stringify(company));
        localStorage.setItem("roles", JSON.stringify(roles));
        localStorage.setItem("permissions", JSON.stringify(permissions));

        setCookie("accessToken", token);

        if (company?.id) {
          setCookie("companyId", company.id);
          localStorage.setItem("companyId", company.id);
        }
      }
    },

    clearAuth: (state) => {
      state.token = null;
      state.user = null;
      state.company = null;
      state.roles = [];
      state.permissions = [];

      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authUser");
        localStorage.removeItem("authCompany");
        localStorage.removeItem("companyId");
        localStorage.removeItem("roles");
        localStorage.removeItem("permissions");

        deleteCookie("accessToken");
        deleteCookie("companyId");
      }
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;