"use client";

/**
 * app/(system)/system-flex/system/page.tsx
 * SystemFlex — System Settings (platform-wide, super_admin only)
 *
 * Data flow:
 *   GET  /system-flex/settings/system          → { group: { key: { value, ... } } }
 *   PUT  /system-flex/settings/system/:key      → { value }
 *
 * Differences from Company Settings (settings/page.tsx):
 *   • Groups are derived dynamically from the response — system settings are not a
 *     fixed six-tab set.
 *   • There is NO reset endpoint (no DELETE route), so no reset control.
 *   • Sensitive values arrive pre-masked from the server as "***" (SystemSetting has
 *     no is_sensitive column; masking is by key-name pattern). They render as a
 *     write-only password field; an empty field is treated as "no change" and is
 *     never sent (the backend requires a non-empty value on write).
 *   • Super-admin only: the backend double-gates (manage-system-settings + super_admin),
 *     and this page hides the data from anyone who is not a super_admin.
 */

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Lock, Save, SlidersHorizontal } from "lucide-react";

import {
  getSystemSettings,
  updateSystemSetting,
} from "@/services/system-flex.service";
import { useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// ── Types ─────────────────────────────────────────────────────────────────────

type ValueType = "boolean" | "integer" | "string";

interface RawSystemSetting {
  value: unknown;
  label: string;
  description: string | null;
  value_type: ValueType;
  is_public: boolean;
}

interface SystemSetting {
  key: string;
  group: string;
  label: string;
  description: string;
  value_type: ValueType;
  value: unknown;
  is_public: boolean;
}

/** Server masks sensitive values to this literal. */
const MASK = "***";

function isMasked(s: SystemSetting): boolean {
  return s.value === MASK;
}

/** Flatten the grouped backend response into a flat SystemSetting[]. */
function flatten(
  grouped: Record<string, Record<string, RawSystemSetting>>,
): SystemSetting[] {
  const flat: SystemSetting[] = [];
  for (const [group, items] of Object.entries(grouped ?? {})) {
    for (const [key, item] of Object.entries(items ?? {})) {
      flat.push({
        key,
        group,
        label: item.label,
        description: item.description ?? "",
        value_type: item.value_type,
        value: item.value,
        is_public: item.is_public,
      });
    }
  }
  return flat;
}

/** Humanise a group slug, e.g. "system_flex" → "System Flex". */
function humanise(group: string): string {
  return group
    .split(/[._-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── SkeletonRow ───────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-start justify-between gap-6 py-5 border-b border-border last:border-0">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-3 w-full max-w-sm" />
        <Skeleton className="h-3 w-3/4 max-w-xs" />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>
    </div>
  );
}

// ── SettingRow ────────────────────────────────────────────────────────────────

interface RowProps {
  setting: SystemSetting;
  effectiveValue: unknown;
  isDirty: boolean;
  onChange: (value: unknown) => void;
}

function SettingRow({ setting, effectiveValue, isDirty, onChange }: RowProps) {
  const inputId = `sys-${setting.key.replace(/\./g, "-")}`;
  const masked = isMasked(setting);

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-6 py-5 border-b border-border last:border-0 transition-colors duration-150",
        isDirty && "-mx-6 px-6 bg-amber-50/60 dark:bg-amber-950/20",
      )}
    >
      {/* Left: label + key + description */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Label
            htmlFor={inputId}
            className="text-sm font-semibold text-foreground cursor-pointer leading-none"
          >
            {setting.label || setting.key}
          </Label>
          <code className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono text-muted-foreground">
            {setting.key}
          </code>
          {isDirty && (
            <Badge
              variant="outline"
              className="py-0 px-1.5 text-[10px] font-medium text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-700"
            >
              Unsaved
            </Badge>
          )}
          {masked && (
            <Badge
              variant="outline"
              className="py-0 px-1.5 text-[10px] font-medium text-slate-500 border-slate-200 dark:border-slate-700"
            >
              Sensitive
            </Badge>
          )}
        </div>
        {setting.description && (
          <p className="text-xs text-muted-foreground leading-relaxed max-w-prose">
            {setting.description}
          </p>
        )}
      </div>

      {/* Right: input control */}
      <div className="flex items-center gap-3 shrink-0 pt-0.5">
        {setting.value_type === "boolean" ? (
          <Switch
            id={inputId}
            checked={Boolean(effectiveValue)}
            onCheckedChange={(checked) => onChange(checked)}
            aria-label={setting.label}
          />
        ) : masked ? (
          <Input
            id={inputId}
            type="password"
            value={isDirty ? String(effectiveValue ?? "") : ""}
            placeholder="•••••••• (set to change)"
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-44 text-sm"
            aria-label={setting.label}
          />
        ) : (
          <Input
            id={inputId}
            type={setting.value_type === "integer" ? "number" : "text"}
            value={String(effectiveValue ?? "")}
            onChange={(e) =>
              onChange(
                setting.value_type === "integer"
                  ? Number(e.target.value)
                  : e.target.value,
              )
            }
            className="h-9 w-44 text-sm"
            aria-label={setting.label}
            {...(setting.value_type === "integer" ? { min: 0, step: 1 } : {})}
          />
        )}
      </div>
    </div>
  );
}

// ── Access denied ─────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="rounded-xl border border-border bg-background px-6 py-16 text-center">
      <Lock className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-3 text-sm font-semibold text-foreground">
        Super admin access required
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Platform-wide system settings are restricted to super administrators.
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SystemSettingsPage() {
  const roles = useAppSelector((s: RootState) => s.auth.roles);
  const isSuperAdmin = (roles ?? []).includes("super_admin");

  const queryClient = useQueryClient();

  // Per-key dirty values: key → new value (presence means changed)
  const [dirtyValues, setDirtyValues] = useState<Record<string, unknown>>({});
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<SystemSetting[]>({
    queryKey: ["system-flex", "settings", "system"],
    queryFn: () =>
      getSystemSettings().then((g) =>
        flatten(g as Record<string, Record<string, RawSystemSetting>>),
      ),
    enabled: isSuperAdmin,
    staleTime: 60_000,
  });

  const groups = useMemo<string[]>(() => {
    const set = new Set<string>();
    (data ?? []).forEach((s) => set.add(s.group));
    return Array.from(set).sort();
  }, [data]);

  const grouped = useMemo<Record<string, SystemSetting[]>>(() => {
    const out: Record<string, SystemSetting[]> = {};
    (data ?? []).forEach((s) => {
      (out[s.group] ??= []).push(s);
    });
    return out;
  }, [data]);

  const currentTab =
    activeTab && groups.includes(activeTab) ? activeTab : (groups[0] ?? null);

  const tabSettings = currentTab ? (grouped[currentTab] ?? []) : [];
  const dirtyTabKeys = tabSettings
    .filter((s) => s.key in dirtyValues)
    .map((s) => s.key);
  const tabIsDirty = dirtyTabKeys.length > 0;

  // ── Save mutation (per active tab) ──────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () =>
      Promise.all(
        dirtyTabKeys.map((key) => updateSystemSetting(key, dirtyValues[key])),
      ),
    onSuccess: () => {
      setDirtyValues((prev) => {
        const next = { ...prev };
        dirtyTabKeys.forEach((k) => delete next[k]);
        return next;
      });
      queryClient.invalidateQueries({
        queryKey: ["system-flex", "settings", "system"],
      });
      toast.success("System settings saved");
    },
    onError: (apiFailure) =>
      showApiError(apiFailure, { ...({
        description: "Your changes could not be saved. Please try again.",
      }), fallbackMessage: "Save failed" }),
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getEffectiveValue = (s: SystemSetting): unknown => {
    if (s.key in dirtyValues) return dirtyValues[s.key];
    // Masked values are write-only — never surface "***" into an editable field.
    return isMasked(s) ? "" : s.value;
  };

  const handleChange = (s: SystemSetting, newValue: unknown) => {
    // For masked settings the baseline is "" (empty = no change); otherwise it is
    // the current value. Reverting to baseline drops the key from dirty tracking.
    const baseline = isMasked(s) ? "" : s.value;
    setDirtyValues((prev) => {
      const next = { ...prev };
      if (newValue === baseline) delete next[s.key];
      else next[s.key] = newValue;
      return next;
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Platform-wide defaults applied to every company. Changes here affect all
          tenants — edit with care. Restricted to super administrators.
        </p>
      </div>

      {!isSuperAdmin ? (
        <AccessDenied />
      ) : (
        <>
          {isError && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Failed to load system settings.{" "}
                <button
                  type="button"
                  className="underline hover:no-underline font-medium"
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["system-flex", "settings", "system"],
                    })
                  }
                >
                  Try again
                </button>
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-8 w-28 rounded-md" />
              </div>
              <div className="px-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-xl border border-border bg-background px-6 py-16 text-center text-sm text-muted-foreground">
              No system settings are configured.
            </div>
          ) : (
            <Tabs
              value={currentTab ?? undefined}
              onValueChange={(v) => setActiveTab(v)}
            >
              <TabsList className="mb-0 h-auto flex-wrap gap-1 bg-muted p-1 rounded-lg">
                {groups.map((g) => {
                  const hasDirty = (grouped[g] ?? []).some(
                    (s) => s.key in dirtyValues,
                  );
                  return (
                    <TabsTrigger
                      key={g}
                      value={g}
                      className="flex items-center gap-1.5 text-xs sm:text-sm"
                    >
                      <SlidersHorizontal
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      {humanise(g)}
                      {hasDirty && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0"
                          aria-label={`${humanise(g)} has unsaved changes`}
                        />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {groups.map((g) => (
                <TabsContent
                  key={g}
                  value={g}
                  className="mt-3 focus:outline-none"
                >
                  <div className="rounded-xl border border-border bg-background overflow-hidden">
                    {/* Panel header */}
                    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-muted/30">
                      <div className="flex items-center gap-2 min-w-0">
                        <SlidersHorizontal
                          className="h-4 w-4 text-muted-foreground shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-semibold text-foreground">
                          {humanise(g)}
                        </span>
                        {g === currentTab && tabIsDirty && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium ml-1">
                            · {dirtyTabKeys.length}{" "}
                            {dirtyTabKeys.length === 1
                              ? "unsaved change"
                              : "unsaved changes"}
                          </span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        disabled={!tabIsDirty || saveMutation.isPending}
                        onClick={() => saveMutation.mutate()}
                        className={cn("gap-1.5 shrink-0 transition-all", {
                          "opacity-40 cursor-not-allowed": !tabIsDirty,
                        })}
                        style={
                          tabIsDirty
                            ? {
                                backgroundColor: "var(--brand-500)",
                                color: "var(--brand-800)",
                              }
                            : {}
                        }
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save Changes
                      </Button>
                    </div>

                    {/* Rows */}
                    <div className="px-6">
                      {(grouped[g] ?? []).length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                          No settings in this group.
                        </p>
                      ) : (
                        (grouped[g] ?? []).map((setting) => (
                          <SettingRow
                            key={setting.key}
                            setting={setting}
                            effectiveValue={getEffectiveValue(setting)}
                            isDirty={setting.key in dirtyValues}
                            onChange={(newValue) =>
                              handleChange(setting, newValue)
                            }
                          />
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </>
      )}
    </>
  );
}
