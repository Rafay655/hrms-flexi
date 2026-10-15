/**
 * lib/stores/connect-central/permissionStore.ts
 * RTK slice — ConnectCentral permission cache.
 *
 * Caches the 13 CC-specific permissions for the authenticated user so that
 * UI elements can gate themselves without an extra API round-trip on every
 * render. Mirrors the 300s server-side cache TTL (AccessControlService).
 *
 * The 13 permissions:
 *   manage-users, view-users, manage-roles, view-roles,
 *   manage-company-sessions, view-company-sessions, revoke-sessions,
 *   manage-session-policies, manage-2fa, manage-oauth,
 *   manage-password-policy, view-audit-security, manage-account-locks
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
export type CCPermission =
  | "manage-users"
  | "view-users"
  | "manage-roles"
  | "view-roles"
  | "manage-company-sessions"
  | "view-company-sessions"
  | "revoke-sessions"
  | "manage-session-policies"
  | "manage-2fa"
  | "manage-oauth"
  | "manage-password-policy"
  | "view-audit-security"
  | "manage-account-locks";

type CCPermissionState = {
  permissions: CCPermission[];
  roles: string[];
  /** ISO timestamp of last cache fill. Invalidate after 300s. */
  cachedAt: string | null;
};

const initialState: CCPermissionState = {
  permissions: [],
  roles: [],
  cachedAt: null,
};

const ccPermissionSlice = createSlice({
  name: "ccPermission",
  initialState,
  reducers: {
    setPermissions(
      state,
      action: PayloadAction<{ permissions: CCPermission[]; roles: string[] }>
    ) {
      state.permissions = action.payload.permissions;
      state.roles = action.payload.roles;
      state.cachedAt = new Date().toISOString();
    },
    clearPermissions(state) {
      state.permissions = [];
      state.roles = [];
      state.cachedAt = null;
    },
  },
});

export const { setPermissions, clearPermissions } = ccPermissionSlice.actions;

export default ccPermissionSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectCCPermissions = (state: RootState) =>
  state.ccPermission.permissions;

export const selectCCRoles = (state: RootState) => state.ccPermission.roles;

/** Returns true if the user has the given CC permission. */
export const selectCan =
  (permission: CCPermission) =>
  (state: RootState): boolean =>
    state.ccPermission.permissions.includes(permission);

/** Returns true if the permission cache is older than 300s. */
export const selectArePermissionsStale = (state: RootState): boolean => {
  const ts = state.ccPermission.cachedAt;
  if (!ts) return true;
  return Date.now() - new Date(ts).getTime() > 300_000;
};
