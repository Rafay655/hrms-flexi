"use client";

import { showApiError } from "@/lib/error-toast";
import React, {
  useState, useCallback, useMemo, useRef, useEffect,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef, flexRender, getCoreRowModel, useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Shield, ShieldCheck, Crown, Server, Users, User, Briefcase, Landmark,
  DollarSign, Wallet, CalendarClock, Clock3, Network, Settings2, Sparkles,
  Eye, Plus, Pencil, Trash2, CheckCircle2, Download, LayoutGrid,
  Lock, AlertTriangle, Search, XCircle, Save, RotateCcw, ChevronDown,
  ChevronUp, X, Filter, Check, Minus, RefreshCw, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getAccessMatrix,
  updateRolePermissions,
  createRole,
  updateRole,
  deleteRole,
} from "@/lib/api/connect-central/access";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

export interface ApiPermission {
  id: number;
  name: string;
  description: string | null;
  action: string;
}
export interface ApiGroup  { label: string; permissions: ApiPermission[] }
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

export interface MatrixMeta {
  isEnabled: (role: string, permName: string) => boolean;
  isChanged: (role: string, permName: string) => boolean;
  onToggle:  (role: string, permName: string) => void;
  selectedRole: string;
  isLocked: boolean;
}

// ----------------------------------------------------------------------
// Design tokens & icons
// ----------------------------------------------------------------------

const ACCENT = "#6366F1";
const NAVY   = "#181B2E";

const ACTION_ICON: Record<string, React.ElementType> = {
  view: Eye, create: Plus, edit: Pencil, delete: Trash2,
  approve: CheckCircle2, export: Download,
};
const ACTION_COLOR: Record<string, string> = {
  view: "#6FA8FF", create: "#22C58B", edit: "#F5B84F",
  delete: "#F26D6D", approve: "#9B8CFF", export: "#2DD4BF",
};
const actionIcon  = (a: string) => ACTION_ICON[a] ?? Sparkles;
const actionColor = (a: string) => ACTION_COLOR[a] ?? "#94A3B8";

const ROLE_ICON_RULES: [RegExp, React.ElementType][] = [
  [/super/i, Crown], [/^admin$/i, Shield], [/it[_\s-]?admin/i, Server],
  [/finance/i, Landmark], [/hr/i, Users], [/manager/i, Briefcase],
  [/employee/i, User],
];
const roleIcon = (name: string) =>
  ROLE_ICON_RULES.find(([re]) => re.test(name))?.[1] ?? User;

const MODULE_ICON: Record<string, React.ElementType> = {
  Compliance: ShieldCheck, ConnectCentral: Network, ExpenseHub: Wallet,
  FlexiMeta: Sparkles, General: LayoutGrid, LeaveEase: CalendarClock,
  LoanHub: Landmark, PayEdge: DollarSign, PeopleHub: Users,
  SystemFlex: Settings2, TimeSync: Clock3,
};
const moduleIcon = (key: string) => MODULE_ICON[key] ?? LayoutGrid;

// ----------------------------------------------------------------------
// Row builder (flat rows for matrix)
// ----------------------------------------------------------------------

interface MatrixRow {
  id: string;
  moduleKey: string;
  moduleLabel: string;
  groupLabel: string;
  Icon: React.ElementType;
  byAction: Record<string, ApiPermission[]>;
  allPermissionNames: string[];
}

function buildRows(modules: ApiModule[]): MatrixRow[] {
  const rows: MatrixRow[] = [];
  for (const mod of modules) {
    for (const group of mod.groups) {
      const byAction: Record<string, ApiPermission[]> = {};
      for (const p of group.permissions) (byAction[p.action] ??= []).push(p);
      rows.push({
        id: `${mod.module}::${group.label}`,
        moduleKey: mod.module,
        moduleLabel: mod.label,
        groupLabel: group.label,
        Icon: moduleIcon(mod.module),
        byAction,
        allPermissionNames: group.permissions.map(p => p.name),
      });
    }
  }
  return rows;
}

// ----------------------------------------------------------------------
// Cell components
// ----------------------------------------------------------------------

function GroupCell({ row }: { row: MatrixRow }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
        <row.Icon className="h-3.5 w-3.5 text-gray-400" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-700 truncate">{row.groupLabel}</p>
        <p className="text-[9px] text-gray-400 truncate">{row.moduleLabel}</p>
      </div>
    </div>
  );
}

function buildColumns(actions: string[]): ColumnDef<MatrixRow>[] {
  return [
    {
      id: "group",
      header: () => (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Group
        </span>
      ),
      cell: ({ row }) => <GroupCell row={row.original} />,
    },
    ...actions.map((action): ColumnDef<MatrixRow> => ({
      id: action,
      header: () => {
        const Icon = actionIcon(action);
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center">
                <Icon className="h-3.5 w-3.5" style={{ color: actionColor(action) }} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] capitalize">
              {action}
            </TooltipContent>
          </Tooltip>
        );
      },
      cell: ({ row, table }) => {
        const m = table.options.meta as MatrixMeta;
        const perms = row.original.byAction[action] ?? [];
        return (
          <ActionCell
            perms={perms}
            role={m.selectedRole}
            isEnabled={m.isEnabled}
            isChanged={m.isChanged}
            onToggle={m.onToggle}
            isLocked={m.isLocked}
          />
        );
      },
    })),
  ];
}

// ----------------------------------------------------------------------
// Custom hook (unchanged)
// ----------------------------------------------------------------------

function buildPermMap(roles: ApiRole[]): Map<string, Set<string>> {
  return new Map(roles.map(r => [r.name, new Set(r.permissions)]));
}

function useAccessMatrix() {
  const [rolePerms, setRolePerms]         = useState<Map<string, Set<string>>>(new Map());
  const [originalPerms, setOriginalPerms] = useState<Map<string, Set<string>>>(new Map());
  const [isSaving, setIsSaving]           = useState(false);
  const [lastSavedAt, setLastSavedAt]     = useState<Date | null>(null);
  const syncedRef = useRef(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery<AccessMatrixResponse>({
    queryKey: ["connect-central-access-matrix"],
    queryFn: getAccessMatrix,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (data && !syncedRef.current) {
      syncedRef.current = true;
      const map = buildPermMap(data.roles);
      setRolePerms(new Map([...map].map(([k, v]) => [k, new Set(v)])));
      setOriginalPerms(map);
    }
  }, [data]);

  const { mutateAsync: doSave } = useMutation({
    mutationFn: updateRolePermissions,
  });

  // Role CRUD mutations
  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connect-central-access-matrix"] });
      toast.success("Role created successfully.");
    },
    onError: (err: any) => showApiError(err, { fallbackMessage: err?.message || "Failed to create role." }),
  });

  const updateMutation = useMutation({
    mutationFn: updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connect-central-access-matrix"] });
      toast.success("Role updated.");
    },
    onError: (err: any) => showApiError(err, { fallbackMessage: err?.message || "Failed to update role." }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connect-central-access-matrix"] });
      toast.success("Role deleted.");
    },
    onError: (err: any) => showApiError(err, { fallbackMessage: err?.message || "Failed to delete role." }),
  });

  const dirtyKeys = useMemo<Set<string>>(() => {
    const dirty = new Set<string>();
    for (const [role, perms] of rolePerms) {
      const orig = originalPerms.get(role) ?? new Set<string>();
      for (const p of perms) if (!orig.has(p)) dirty.add(`${role}::${p}`);
      for (const p of orig)  if (!perms.has(p)) dirty.add(`${role}::${p}`);
    }
    return dirty;
  }, [rolePerms, originalPerms]);

  const dirtyRoles = useMemo(
    () => [...new Set([...dirtyKeys].map(k => k.split("::")[0]))],
    [dirtyKeys],
  );
  const isDirty    = dirtyKeys.size > 0;
  const dirtyCount = dirtyKeys.size;

  const toggle = useCallback((role: string, permName: string) => {
    setRolePerms(prev => {
      const next  = new Map(prev);
      const perms = new Set(prev.get(role) ?? []);
      perms.has(permName) ? perms.delete(permName) : perms.add(permName);
      next.set(role, perms);
      return next;
    });
  }, []);

  const isEnabled = useCallback(
    (role: string, permName: string) => (rolePerms.get(role) ?? new Set()).has(permName),
    [rolePerms],
  );
  const isChanged = useCallback(
    (role: string, permName: string) => dirtyKeys.has(`${role}::${permName}`),
    [dirtyKeys],
  );

  const save = useCallback(async () => {
    const roles = dirtyRoles;
    if (roles.length === 0 || !data) return;

    const snap = new Map([...originalPerms].map(([k, v]) => [k, new Set(v)]));

    setOriginalPerms(prev => {
      const next = new Map(prev);
      for (const role of roles) next.set(role, new Set(rolePerms.get(role)));
      return next;
    });

    setIsSaving(true);
    try {
      await Promise.all(roles.map(async (role) => {
        const permissions = [...(rolePerms.get(role) ?? new Set<string>())];
        await doSave({ role, permissions });
      }));
      setLastSavedAt(new Date());
      toast.success(
        roles.length === 1
          ? `Permissions saved for ${roles[0].replace(/_/g, " ")}.`
          : `Permissions saved for ${roles.length} roles.`,
      );
    } catch (apiFailure) {
      setOriginalPerms(snap);
      showApiError(apiFailure, { fallbackMessage: "Failed to save permissions. Changes reverted." });
    } finally {
      setIsSaving(false);
    }
  }, [dirtyRoles, doSave, originalPerms, rolePerms, data]);

  const discard = useCallback(() => {
    setRolePerms(prev => {
      const next = new Map(prev);
      for (const role of dirtyRoles) next.set(role, new Set(originalPerms.get(role)));
      return next;
    });
  }, [dirtyRoles, originalPerms]);

  const changeSummary = useMemo(
    () => [...dirtyKeys].map(dk => {
      const [role, permName] = dk.split("::");
      const enabled = (rolePerms.get(role) ?? new Set()).has(permName);
      return { role, permName, enabled };
    }),
    [dirtyKeys, rolePerms],
  );

  return {
    data, isLoading, isError, refetch,
    isDirty, dirtyCount, dirtyRoles, changeSummary, lastSavedAt,
    toggle, save, discard, isEnabled, isChanged, isSaving,
    createMutation, updateMutation, deleteMutation,
  };
}

// ----------------------------------------------------------------------
// ActionCell (unchanged)
// ----------------------------------------------------------------------

function ActionCell({
  perms, role, isEnabled, isChanged, onToggle, isLocked,
}: {
  perms: ApiPermission[]; role: string;
  isEnabled: (r: string, p: string) => boolean;
  isChanged: (r: string, p: string) => boolean;
  onToggle:  (r: string, p: string) => void;
  isLocked: boolean;
}) {
  if (!perms.length) {
    return <div className="flex justify-center"><span className="text-gray-200 select-none text-sm">—</span></div>;
  }

  if (perms.length === 1) {
    const p = perms[0];
    const enabled = isEnabled(role, p.name);
    const dirty   = isChanged(role, p.name);
    return (
      <div className="flex justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => !isLocked && onToggle(role, p.name)}
              disabled={isLocked}
              aria-pressed={enabled}
              aria-label={`${enabled ? "Disable" : "Enable"} ${p.name}`}
              className={cn(
                "h-[18px] w-[18px] rounded-[5px] flex items-center justify-center border-2 transition-all duration-100",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1",
                enabled ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-300 hover:border-indigo-400",
                dirty && "ring-2 ring-amber-400 ring-offset-1",
                isLocked && "opacity-40 pointer-events-none",
              )}
            >
              {enabled && <Check className="h-2.5 w-2.5 stroke-[3]" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] max-w-[220px] font-mono">
            {isLocked ? "System role — locked" : p.name}{dirty && " · unsaved"}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  const grantedCount = perms.filter(p => isEnabled(role, p.name)).length;
  const anyDirty      = perms.some(p => isChanged(role, p.name));
  const state: "all" | "some" | "none" =
    grantedCount === perms.length ? "all" : grantedCount === 0 ? "none" : "some";

  return (
    <div className="flex justify-center">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isLocked}
            aria-label={`${perms.length} permissions — ${grantedCount} granted`}
            className={cn(
              "h-[18px] w-[18px] rounded-[5px] flex items-center justify-center border-2 transition-all duration-100",
              state === "all"  && "bg-indigo-600 border-indigo-600 text-white",
              state === "some" && "bg-indigo-100 border-indigo-400 text-indigo-600",
              state === "none" && "bg-white border-gray-300 hover:border-indigo-400",
              anyDirty && "ring-2 ring-amber-400 ring-offset-1",
              isLocked && "opacity-40 pointer-events-none",
            )}
          >
            {state === "all"  && <Check className="h-2.5 w-2.5 stroke-[3]" />}
            {state === "some" && <Minus className="h-2.5 w-2.5 stroke-[3]" />}
          </button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-64 p-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1 pb-1.5">
            {perms.length} permissions on this action
          </p>
          <div className="space-y-0.5">
            {perms.map(p => {
              const enabled = isEnabled(role, p.name);
              const dirty   = isChanged(role, p.name);
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => !isLocked && onToggle(role, p.name)}
                  disabled={isLocked}
                  className="w-full flex items-center gap-2 px-1.5 py-1.5 rounded-lg hover:bg-gray-50 text-left"
                >
                  <span className={cn(
                    "h-4 w-4 rounded flex items-center justify-center border-2 shrink-0",
                    enabled ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-300",
                    dirty && "ring-2 ring-amber-400 ring-offset-1",
                  )}>
                    {enabled && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </span>
                  <span className="text-[11px] font-mono text-gray-600 truncate">{p.name}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ----------------------------------------------------------------------
// Module Sidebar (unchanged)
// ----------------------------------------------------------------------

function ModuleSidebar({
  modules,
  selectedModule,
  onSelect,
}: {
  modules: ApiModule[];
  selectedModule: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex flex-col w-[200px] shrink-0 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-gray-50 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Modules
        </p>
      </div>
      <div className="flex-1 overflow-y-auto py-1 min-h-0">
        <LayoutGroup>
          <ul className="px-2 space-y-0.5">
            {modules.map((mod) => {
              const Icon = moduleIcon(mod.module);
              const isActive = mod.module === selectedModule;
              return (
                <li key={mod.module} className="relative">
                  <button
                    type="button"
                    onClick={() => onSelect(mod.module)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors relative z-10",
                      "hover:bg-gray-50",
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
                      <Icon className="h-3.5 w-3.5 text-gray-500" />
                    </span>
                    <span className={cn(
                      "text-xs font-semibold truncate",
                      isActive ? "text-indigo-600" : "text-gray-700",
                    )}>
                      {mod.label}
                    </span>
                  </button>
                  {isActive && (
                    <motion.div
                      layoutId="active-module"
                      className="absolute inset-0 rounded-xl bg-indigo-50 border border-indigo-200"
                      style={{ zIndex: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </LayoutGroup>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// PermissionMatrix (unchanged)
// ----------------------------------------------------------------------

function PermissionMatrix({
  rows, columns, selectedRole, isLocked, isEnabled, isChanged, onToggle, isLoading, actionsCount,
}: {
  rows: MatrixRow[]; columns: ColumnDef<MatrixRow>[]; selectedRole: string; isLocked: boolean;
  isEnabled: (r: string, p: string) => boolean; isChanged: (r: string, p: string) => boolean;
  onToggle: (r: string, p: string) => void; isLoading: boolean; actionsCount: number;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const table = useReactTable<MatrixRow>({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { isEnabled, isChanged, onToggle, selectedRole, isLocked } as MatrixMeta,
  });

  const { rows: tableRows } = table.getRowModel();
  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 12,
  });
  const virtualItems  = virtualizer.getVirtualItems();
  const totalSize     = virtualizer.getTotalSize();
  const paddingTop    = virtualItems.length ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

  const totalCols = 1 + actionsCount;

  if (isLoading) {
    return (
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4 space-y-2.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
            <Skeleton className="h-3 w-36" />
            <div className="flex gap-6 ml-auto">
              {Array.from({ length: actionsCount || 6 }).map((_, j) => <Skeleton key={j} className="h-[18px] w-[18px] rounded" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
      <table className="w-full border-collapse table-fixed">
        <thead className="sticky top-0 z-20 bg-white">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id} className="border-b border-gray-100">
              {hg.headers.map(header => {
                const isGroup = header.id === "group";
                return (
                  <th
                    key={header.id}
                    className={cn(
                      "py-3",
                      isGroup
                        ? "sticky left-0 z-30 bg-white pl-4 pr-3 min-w-[200px] text-left"
                        : "w-[48px] text-center px-1",
                    )}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr>
              <td colSpan={totalCols} style={{ height: paddingTop }} />
            </tr>
          )}
          {virtualItems.map(vi => {
            const row = tableRows[vi.index];
            return (
              <tr
                key={row.id}
                className="border-b border-gray-50 last:border-0 hover:bg-indigo-50/30 transition-colors duration-75"
                style={{ height: vi.size }}
              >
                {row.getVisibleCells().map(cell => {
                  const isGroup = cell.column.id === "group";
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        isGroup
                          ? "sticky left-0 z-10 bg-white/95 pl-4 pr-3 py-2.5 backdrop-blur-sm"
                          : "py-2.5 px-1 w-[48px]",
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td colSpan={totalCols} style={{ height: paddingBottom }} />
            </tr>
          )}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
          <Filter className="h-5 w-5 opacity-40" />
          <p className="text-xs">No groups found</p>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Role Row with edit/delete actions (updated)
// ----------------------------------------------------------------------

function RoleRow({
  role, active, dirty, onClick, onEdit, onDelete,
}: {
  role: ApiRole; active: boolean; dirty: boolean; onClick: () => void;
  onEdit: () => void; onDelete: () => void;
}) {
  const Icon = roleIcon(role.name);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        "group relative w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 flex items-start gap-2.5 mb-0.5",
        active ? "shadow-sm" : "hover:bg-gray-50",
        role.locked && !active && "opacity-70",
      )}
      style={active ? { backgroundColor: NAVY } : undefined}
    >
      <button type="button" onClick={onClick} className="flex items-start gap-2.5 flex-1 min-w-0">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5 transition-colors", active ? "bg-white/15" : "bg-gray-100 group-hover:bg-gray-200")}>
          <Icon className={cn("h-4 w-4", active ? "text-white" : "text-gray-500")} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn("text-xs font-semibold truncate", active ? "text-white" : "text-gray-800")}>
              {role.display_name}
            </span>
            {role.locked && <Lock className={cn("h-2.5 w-2.5 shrink-0", active ? "text-white/50" : "text-gray-300")} />}
            {dirty && !role.locked && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />}
          </div>
          <p className={cn("text-[10px] leading-snug mt-0.5 truncate", active ? "text-white/60" : "text-gray-400")}>
            {role.locked ? "Cannot modify system role" : (role.description || "No description")}
          </p>
          <p className={cn("text-[10px] font-medium mt-0.5", active ? "text-white/40" : "text-gray-300")}>
            {role.users_count} {role.users_count === 1 ? "user" : "users"} · {role.permissions.length} perms
          </p>
        </div>
      </button>

      {/* Actions dropdown – visible on hover or when menuOpen */}
      {!role.locked && (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
                menuOpen && "opacity-100",
                active ? "text-white/70 hover:text-white" : "text-gray-400 hover:text-gray-600",
              )}
              aria-label="Role actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-32 p-1.5">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onEdit(); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-gray-100 text-gray-700"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-red-50 text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Role Selector with Create button (updated)
// ----------------------------------------------------------------------

function RoleSelector({
  roles, selectedRole, onSelect, dirtyRoles, search, onSearchChange,
  onCreateRole, onEditRole, onDeleteRole,
}: {
  roles: ApiRole[]; selectedRole: string; onSelect: (n: string) => void;
  dirtyRoles: string[]; search: string; onSearchChange: (v: string) => void;
  onCreateRole: () => void;
  onEditRole: (role: ApiRole) => void;
  onDeleteRole: (role: ApiRole) => void;
}) {
  const q = search.trim().toLowerCase();
  const filtered = roles.filter(r =>
    r.display_name.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  const system = filtered.filter(r => r.is_system);
  const custom = filtered.filter(r => !r.is_system);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm shrink-0" style={{ width: 260 }}>
      <div className="px-4 pt-4 pb-3 border-b border-gray-50 shrink-0 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Role Selector</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
          <Input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Filter roles…"
            className="h-8 pl-8 text-xs rounded-lg"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1.5 px-1.5 min-h-0">
        {system.length > 0 && <p className="px-2.5 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-wider text-gray-300">System</p>}
        {system.map(r => (
          <RoleRow
            key={r.id}
            role={r}
            active={r.name === selectedRole}
            dirty={dirtyRoles.includes(r.name)}
            onClick={() => onSelect(r.name)}
            onEdit={() => onEditRole(r)}
            onDelete={() => onDeleteRole(r)}
          />
        ))}
        {custom.length > 0 && <p className="px-2.5 pt-3 pb-1 text-[9px] font-semibold uppercase tracking-wider text-gray-300">Custom</p>}
        {custom.map(r => (
          <RoleRow
            key={r.id}
            role={r}
            active={r.name === selectedRole}
            dirty={dirtyRoles.includes(r.name)}
            onClick={() => onSelect(r.name)}
            onEdit={() => onEditRole(r)}
            onDelete={() => onDeleteRole(r)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-[11px] text-gray-300">No roles match "{search}"</p>
        )}
      </div>
      <div className="p-2 border-t border-gray-100">
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5 text-xs h-8"
          onClick={onCreateRole}
        >
          <Plus className="h-3.5 w-3.5" />
          Create Role
        </Button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Create / Edit Role Modals
// ----------------------------------------------------------------------

function CreateRoleModal({
  open,
  onOpenChange,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; description: string }) => Promise<void>;
  isSaving: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onSave({ name: name.trim(), description: description.trim() });
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-indigo-500" />
            Create New Role
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Role Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Finance Officer"
              className="h-9 text-sm"
              disabled={isSaving}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="resize-none h-20 text-sm"
              disabled={isSaving}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm" disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!name.trim() || isSaving}
            style={{ backgroundColor: ACCENT, color: "white" }}
          >
            {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditRoleModal({
  open,
  onOpenChange,
  role,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: ApiRole | null;
  onSave: (data: { id: number; display_name: string; description: string }) => Promise<void>;
  isSaving: boolean;
}) {
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (role) {
      setDisplayName(role.display_name);
      setDescription(role.description || "");
    }
  }, [role]);

  const handleSubmit = async () => {
    if (!role || !displayName.trim()) return;
    await onSave({
      id: role.id,
      display_name: displayName.trim(),
      description: description.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-indigo-500" />
            Edit Role
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Display Name *</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
              className="h-9 text-sm"
              disabled={isSaving}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="resize-none h-20 text-sm"
              disabled={isSaving}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm" disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!displayName.trim() || isSaving}
            style={{ backgroundColor: ACCENT, color: "white" }}
          >
            {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteRoleConfirmModal({
  open,
  role,
  onOpenChange,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  role: ApiRole | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  if (!role) return null;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-500" />
            Delete "{role.display_name}"?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This role will be permanently removed. Users assigned to this role will lose all associated permissions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white border-0"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Delete Role
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ----------------------------------------------------------------------
// UnsavedChangesPanel, MatrixLegend (unchanged)
// ----------------------------------------------------------------------

interface ChangeItem { role: string; permName: string; enabled: boolean }

function UnsavedChangesPanel({
  dirtyCount, changeSummary, onSave, onDiscardRequest, isSaving,
}: {
  dirtyCount:       number;
  changeSummary:    ChangeItem[];
  onSave:           () => void;
  onDiscardRequest: () => void;
  isSaving:         boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const PREVIEW = 5;
  const visible = showAll ? changeSummary : changeSummary.slice(0, PREVIEW);
  const hasMore = changeSummary.length > PREVIEW;

  return (
    <div className="flex flex-col rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm overflow-hidden h-full">
      <div className="px-4 pt-4 pb-3 border-b border-amber-100 flex items-center gap-2 shrink-0">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        <p className="text-xs font-semibold text-amber-800 flex-1 truncate">Unsaved Changes</p>
        <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4 border-0 shrink-0">{dirtyCount}</Badge>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 min-h-0">
        <AnimatePresence initial={false}>
          {visible.map(({ role, permName, enabled }) => (
            <motion.div
              key={`${role}::${permName}`}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 2 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.16 }}
              className="flex items-start gap-2 py-1"
            >
              {enabled
                ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                : <XCircle      className="h-3 w-3 text-red-400     shrink-0 mt-0.5" />}
              <p className="text-[10px] text-amber-900 leading-snug min-w-0">
                <span className="font-semibold capitalize">{role.replace(/_/g, " ")}</span>
                <span className="opacity-60"> · {permName}</span>
                <span className={cn("ml-1 font-semibold", enabled ? "text-emerald-600" : "text-red-500")}>
                  {enabled ? "on" : "off"}
                </span>
              </p>
            </motion.div>
          ))}
        </AnimatePresence>

        {hasMore && (
          <button type="button" onClick={() => setShowAll(v => !v)} className="flex items-center gap-1 text-[10px] text-amber-600 font-medium hover:underline mt-1 py-0.5">
            {showAll ? <><ChevronUp className="h-3 w-3" />Show less</> : <><ChevronDown className="h-3 w-3" />View all {changeSummary.length} changes</>}
          </button>
        )}
      </div>

      <div className="px-3 pb-4 pt-3 border-t border-amber-100 space-y-2 shrink-0">
        <Button size="sm" className="w-full gap-1.5 text-xs text-white" style={{ backgroundColor: ACCENT }} onClick={onSave} disabled={isSaving || dirtyCount === 0}>
          {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {isSaving ? "Saving…" : "Save Permissions"}
        </Button>
        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs border-amber-200 text-amber-700 hover:bg-amber-100" onClick={onDiscardRequest} disabled={isSaving}>
          <RotateCcw className="h-3.5 w-3.5" />
          Discard Changes
        </Button>
      </div>
    </div>
  );
}

function DiscardConfirmModal({
  open, dirtyCount, onOpenChange, onConfirm,
}: {
  open: boolean; dirtyCount: number;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-500" />
            Discard {dirtyCount} change{dirtyCount !== 1 ? "s" : ""}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            All unsaved permission changes will be permanently discarded and cannot be recovered.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={onConfirm}>
            Discard all changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MatrixLegend() {
  const items = [
    { visual: <span className="h-[18px] w-[18px] rounded border-2 bg-indigo-600 border-indigo-600 flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white stroke-[3]" /></span>, label: "Allowed" },
    { visual: <span className="h-[18px] w-[18px] rounded border-2 border-gray-300 bg-white" />, label: "Not Allowed" },
    { visual: <span className="h-[18px] w-[18px] rounded border-2 bg-indigo-100 border-indigo-400 flex items-center justify-center"><Minus className="h-2.5 w-2.5 text-indigo-600 stroke-[3]" /></span>, label: "Mixed (multiple perms)" },
    { visual: <span className="text-gray-200 text-sm leading-none select-none w-5 text-center">—</span>, label: "N/A" },
    { visual: <span className="h-[18px] w-[18px] rounded border-2 border-gray-300 bg-white ring-2 ring-amber-400 ring-offset-1" />, label: "Changed" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-4 px-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Legend</span>
      {items.map(({ visual, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          {visual}
          <span className="text-[10px] text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AccessManagerPage() {
  const hook = useAccessMatrix();
  const { data } = hook;

  const [selectedRole, setSelectedRole]         = useState("");
  const [selectedModule, setSelectedModule]     = useState("");
  const [roleSearch, setRoleSearch]             = useState("");
  const [permSearch, setPermSearch]             = useState("");
  const [showChangedOnly, setShowChangedOnly]   = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);

  // Role CRUD modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ApiRole | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<ApiRole | null>(null);

  useEffect(() => {
    if (data && !selectedRole) {
      const firstAssignable = data.roles.find(r => !r.locked) ?? data.roles[0];
      if (firstAssignable) setSelectedRole(firstAssignable.name);
    }
    if (data && !selectedModule && data.modules.length) {
      setSelectedModule(data.modules[0].module);
    }
  }, [data, selectedRole, selectedModule]);

  const selectedRoleObj = data?.roles.find(r => r.name === selectedRole);
  const isLocked = selectedRoleObj?.locked ?? false;

  useEffect(() => {
    if (!hook.isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hook.isDirty]);

  const allRows = useMemo(() => (data ? buildRows(data.modules) : []), [data]);
  const columns = useMemo(() => buildColumns(data?.actions ?? []), [data?.actions]);

  const filteredRows = useMemo(() => {
    let rows = allRows.filter(r => r.moduleKey === selectedModule);
    const q = permSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter(r =>
        r.groupLabel.toLowerCase().includes(q) ||
        r.allPermissionNames.some(n => n.toLowerCase().includes(q))
      );
    }
    if (showChangedOnly) {
      rows = rows.filter(r =>
        r.allPermissionNames.some(n => hook.isChanged(selectedRole, n))
      );
    }
    return rows;
  }, [allRows, selectedModule, permSearch, showChangedOnly, selectedRole, hook]);

  const totalPermissions = useMemo(
    () => allRows.reduce((sum, r) => sum + r.allPermissionNames.length, 0),
    [allRows],
  );

  const lastUpdatedStr = hook.lastSavedAt
    ? hook.lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Not yet saved";

  const handleDiscard = useCallback(() => {
    hook.discard();
    setDiscardModalOpen(false);
    setShowChangedOnly(false);
  }, [hook]);

  // Role CRUD handlers
  const handleCreateRole = async (data: { name: string; description: string }) => {
    await hook.createMutation.mutateAsync({
      name: data.name,
      description: data.description,
      permissions: [], // will set via matrix later
    });
  };

  const handleEditRole = async (data: { id: number; display_name: string; description: string }) => {
    // We need the role's current permissions to keep them unchanged.
    const role = data ? data.id : null;
    if (!role) return;
    await hook.updateMutation.mutateAsync({
      id: data.id,
      display_name: data.display_name,
      description: data.description,
      permissions: selectedRoleObj?.permissions ?? [], // retain current perms
    } as any);
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    await hook.deleteMutation.mutateAsync(deletingRole.id);
    // If deleted role was selected, reset selection
    if (selectedRole === deletingRole.name && data) {
      const firstAssignable = data.roles.find(r => !r.locked && r.id !== deletingRole.id) ?? data.roles[0];
      if (firstAssignable) setSelectedRole(firstAssignable.name);
    }
    setDeleteModalOpen(false);
    setDeletingRole(null);
  };

  if (hook.isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-gray-400">
        <AlertTriangle className="h-6 w-6" />
        <p className="text-sm">Couldn't load the access matrix.</p>
        <Button size="sm" variant="outline" onClick={() => hook.refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 h-[calc(100vh-88px)] min-h-0">
        {/* Header */}
        <div className="flex items-start justify-between shrink-0 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" style={{ color: ACCENT }} />
              Access Manager
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage role → permission assignments across all ConnectCentral modules.
            </p>
          </div>
          {hook.isDirty && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="text-xs gap-1.5 border border-amber-300 bg-amber-50 text-amber-700 shadow-none py-1">
                <AlertTriangle className="h-3 w-3" />
                {hook.dirtyCount} unsaved change{hook.dirtyCount !== 1 ? "s" : ""}
              </Badge>
            </motion.div>
          )}
        </div>

        {/* Stats */}
        {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          <StatCard key="roles" label="Roles" value={data?.roles.length ?? "—"} sub={`${data?.roles.filter(r => !r.locked).length ?? 0} assignable`} Icon={Shield} accent={ACCENT} />
          <StatCard key="modules" label="Modules" value={data?.modules.length ?? "—"} sub={`${allRows.length} groups`} Icon={LayoutGrid} accent="#06B6D4" />
          <StatCard key="perms" label="Total Permissions" value={totalPermissions || "—"} sub={`${selectedRoleObj?.permissions.length ?? 0} granted to this role`} Icon={ShieldCheck} accent="#22C58B" />
          <StatCard key="pending" label="Pending Changes" value={hook.dirtyCount} sub={hook.dirtyCount > 0 ? "Awaiting save" : `Saved · ${lastUpdatedStr}`} Icon={AlertTriangle} accent={hook.dirtyCount > 0 ? "#F59E0B" : "#10B981"} />
        </div> */}

        {/* Main layout */}
        <div className="flex gap-4 flex-1 min-h-0">
          <RoleSelector
            roles={data?.roles ?? []}
            selectedRole={selectedRole}
            onSelect={setSelectedRole}
            dirtyRoles={hook.dirtyRoles}
            search={roleSearch}
            onSearchChange={setRoleSearch}
            onCreateRole={() => setCreateModalOpen(true)}
            onEditRole={(role) => { setEditingRole(role); setEditModalOpen(true); }}
            onDeleteRole={(role) => { setDeletingRole(role); setDeleteModalOpen(true); }}
          />

          <ModuleSidebar
            modules={data?.modules ?? []}
            selectedModule={selectedModule}
            onSelect={setSelectedModule}
          />

          <div className="flex-1 flex flex-col min-w-0 gap-3">
            <div className="flex items-center justify-end gap-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                <Input
                  value={permSearch}
                  onChange={e => setPermSearch(e.target.value)}
                  placeholder="Search groups…"
                  className="h-8 w-48 pl-8 text-xs rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                <Label htmlFor="show-changed" className="text-[11px] text-gray-500 cursor-pointer select-none">Changed only</Label>
                <Switch id="show-changed" checked={showChangedOnly} onCheckedChange={setShowChangedOnly} disabled={!hook.isDirty} className="scale-[0.85] origin-right" />
              </div>
            </div>

            <AnimatePresence>
              {isLocked && selectedRoleObj && (
                <motion.div
                  key="locked-banner"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 shrink-0"
                >
                  <Lock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span>
                    <strong className="text-gray-700">{selectedRoleObj.display_name}</strong> permissions are
                    locked and cannot be modified through the UI.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <PermissionMatrix
              rows={filteredRows}
              columns={columns}
              selectedRole={selectedRole}
              isLocked={isLocked}
              isEnabled={hook.isEnabled}
              isChanged={hook.isChanged}
              onToggle={hook.toggle}
              isLoading={hook.isLoading}
              actionsCount={data?.actions.length ?? 6}
            />

            <div className="shrink-0 pb-1">
              <MatrixLegend />
            </div>
          </div>

          <AnimatePresence>
            {hook.isDirty && (
              <motion.div
                key="unsaved-panel"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                className="shrink-0 flex"
                style={{ width: 248 }}
              >
                <UnsavedChangesPanel
                  dirtyCount={hook.dirtyCount}
                  changeSummary={hook.changeSummary}
                  onSave={hook.save}
                  onDiscardRequest={() => setDiscardModalOpen(true)}
                  isSaving={hook.isSaving}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Discard confirmation */}
      <DiscardConfirmModal
        open={discardModalOpen}
        dirtyCount={hook.dirtyCount}
        onOpenChange={setDiscardModalOpen}
        onConfirm={handleDiscard}
      />

      {/* Role CRUD modals */}
      <CreateRoleModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSave={handleCreateRole}
        isSaving={hook.createMutation.isPending}
      />

      <EditRoleModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        role={editingRole}
        onSave={handleEditRole}
        isSaving={hook.updateMutation.isPending}
      />

      <DeleteRoleConfirmModal
        open={deleteModalOpen}
        role={deletingRole}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteRole}
        isDeleting={hook.deleteMutation.isPending}
      />
    </TooltipProvider>
  );
}