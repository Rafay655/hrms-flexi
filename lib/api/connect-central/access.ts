import { showApiError } from "@/lib/error-toast";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";


export type CCRole =
  | "admin"
  | "it_admin"
  | "hr_manager"
  | "hr_officer"
  | "manager"
  | "finance"
  | "employee";

export type RoleDetail = {
  name: CCRole | string;
  guard_name: string;
  permissions: string[];
  users_count: number;
};

export type CCPermission = {
  name: string;
  guard_name: string;
};

export type UserWithRoles = {
  uuid: string;
  name: string;
  email: string;
  company_id: number;
  is_active: boolean;
  roles: string[];
  direct_permissions: string[];
};

export type UpdatePermissionsPayload = {
  role: string;
  permissions: string[];
};

export type AssignRolePayload = {
  user_uuid: string;
  role: CCRole | string;
};

// ── Existing API functions ────────────────────────────────────────────────────

export async function getRoles(): Promise<RoleDetail[]> {
  const { data } = await api.get<{ success: boolean; data: RoleDetail[] }>(
    "/connect-central/access/roles"
  );
  return data.data;
}

export async function getPermissions(): Promise<CCPermission[]> {
  const { data } = await api.get<{ success: boolean; data: CCPermission[] }>(
    "/connect-central/access/permissions"
  );
  return data.data;
}

export async function updateRolePermissions(
  payload: UpdatePermissionsPayload
): Promise<RoleDetail> {
  const { data } = await api.put<{ success: boolean; data: RoleDetail }>(
    "/connect-central/access/permissions-sync",
    payload
  );
  return data.data;
}

export async function getUsers(): Promise<UserWithRoles[]> {
  const { data } = await api.get<{ success: boolean; data: UserWithRoles[] }>(
    "/connect-central/access/users"
  );
  return data.data;
}

export async function assignRole(
  payload: AssignRolePayload
): Promise<UserWithRoles> {
  const { data } = await api.post<{ success: boolean; data: UserWithRoles }>(
    "/connect-central/access/assign-role",
    payload
  );
  return data.data;
}

// ── Account Locks ─────────────────────────────────────────────────────────────

export type AccountLock = {
  uuid: string;
  user: { id: number; name: string; email: string };
  lock_reason: "failed_attempts" | "admin_action" | "suspicious_activity";
  lock_notes: string | null;
  locked_at: string;
  auto_unlock_at: string | null;
  failed_attempt_count: number;
  is_high_risk: boolean;
};

export async function getAccountLocks(): Promise<AccountLock[]> {
  const { data } = await api.get<{ success: boolean; data: AccountLock[] }>(
    "/connect-central/account-locks"
  );
  return data.data;
}

export async function unlockAccount(
  uuid: string,
  unlock_notes?: string
): Promise<AccountLock> {
  const { data } = await api.post<{ success: boolean; data: AccountLock }>(
    `/connect-central/account-locks/${uuid}/unlock`,
    { unlock_notes }
  );
  return data.data;
}

export async function unlockAllAccounts(): Promise<{ unlocked_count: number }> {
  const { data } = await api.post<{
    success: boolean;
    data: { unlocked_count: number };
  }>("/connect-central/account-locks/unlock-all");
  return data.data;
}

// ── Access Matrix ────────────────────────────────────────────────────────────

export interface ApiPermission {
  id: number;
  name: string;
  description: string | null;
  action: string;
}
export interface ApiGroup { label: string; permissions: ApiPermission[] }
export interface ApiModule { module: string; label: string; groups: ApiGroup[] }
export interface ApiRole {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  is_system: boolean;
  users_count: number;
  locked: boolean;
  permissions: string[];
}
export interface AccessMatrixResponse {
  roles: ApiRole[];
  modules: ApiModule[];
  actions: string[];
}

export async function getAccessMatrix(): Promise<AccessMatrixResponse> {
  const { data } = await api.get<{ success: boolean; data: AccessMatrixResponse }>(
    "/connect-central/access/matrix"
  );
  return data.data;
}

// ── Role CRUD (new) ──────────────────────────────────────────────────────────

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRolePayload {
  id: number;
  display_name: string;
  description?: string;
  permissions?: string[];
}

export async function createRole(payload: CreateRolePayload) {
  const { data } = await api.post<{ success: boolean; data: any }>(
    "/connect-central/access/roles",
    payload
  );
  return data.data;
}

export async function updateRole(payload: UpdateRolePayload) {
  const { id, ...rest } = payload;
  const { data } = await api.put<{ success: boolean; data: any }>(
    `/connect-central/access/roles/${id}`,
    rest
  );
  return data.data;
}

export async function deleteRole(id: number) {
  const { data } = await api.delete<{ success: boolean; data: any }>(
    `/connect-central/access/roles/${id}`
  );
  return data.data;
}

// ── Mutation hooks for Role CRUD ─────────────────────────────────────────────

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRole,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["connect-central-access-matrix"] });
      toast.success(`Role "${data?.display_name ?? data?.name}" created.`);
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error?.message || "Failed to create role." });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRole,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["connect-central-access-matrix"] });
      toast.success(`Role "${data?.display_name ?? data?.name}" updated.`);
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error?.message || "Failed to update role." });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["connect-central-access-matrix"] });
      toast.success(`Role (ID: ${id}) deleted.`);
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error?.message || "Failed to delete role." });
    },
  });
}