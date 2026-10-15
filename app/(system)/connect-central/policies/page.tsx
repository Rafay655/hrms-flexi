"use client";

import { showApiError } from "@/lib/error-toast";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  Clock,
  Smartphone,
  Pencil,
  Plus,
  AlertTriangle,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  getSessionPolicies,
  updateSessionPolicy,
  type SessionPolicy,
  type UpdateSessionPolicyPayload,
} from "@/lib/api/connect-central/policies";

// ── Constants ─────────────────────────────────────────────────────────────────

const CC_ACCENT = "#6366F1";

type PolicyRow = SessionPolicy & { label: string };

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  it_admin: "IT Admin",
  hr_manager: "HR Manager",
  hr_officer: "HR Officer",
  manager: "Manager",
  finance: "Finance",
  employee: "Employee",
};

function toPolicyRow(p: SessionPolicy): PolicyRow {
  return { ...p, label: p.role ? (ROLE_LABELS[p.role] ?? p.role) : "Global Default" };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function minutesToHuman(mins: number | null | undefined): string {
  if (!mins) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

type StrictnessLevel = "Strict" | "Standard" | "Flexible";

function getStrictness(p: PolicyRow): StrictnessLevel {
  if (p.require_mfa && p.enforce_single_device) return "Strict";
  if (p.require_mfa || p.enforce_single_device) return "Standard";
  return "Flexible";
}

function StrictnessBadge({ level }: { level: StrictnessLevel }) {
  const styles: Record<StrictnessLevel, string> = {
    Strict: "bg-[#FEE2E2] text-[#991B1B] border-0",
    Standard: "bg-amber-100 text-amber-800 border-0",
    Flexible: "bg-green-100 text-green-800 border-0",
  };
  return <Badge className={cn("text-[10px] font-semibold", styles[level])}>{level}</Badge>;
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 flex items-start gap-3 shadow-sm">
      <div
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${CC_ACCENT}18` }}
      >
        <Icon className="h-4 w-4" style={{ color: CC_ACCENT }} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Edit panel draft type ─────────────────────────────────────────────────────

type DraftPolicy = {
  label: string;
  role: string | null | undefined;
  session_timeout_minutes: number;
  absolute_timeout_minutes: number;
  max_concurrent_sessions: number;
  require_mfa: boolean;
  enforce_single_device: boolean;
  enforce_ip_whitelist: boolean;
  block_on_limit: boolean;
  allowed_devices: string[];
  blocked_devices: string[];
};

function toDraft(p: PolicyRow): DraftPolicy {
  return {
    label: p.label,
    role: p.role,
    session_timeout_minutes: p.session_timeout_minutes,
    absolute_timeout_minutes: p.absolute_timeout_minutes ?? 480,
    max_concurrent_sessions: p.max_concurrent_sessions,
    require_mfa: p.require_mfa,
    enforce_single_device: p.enforce_single_device,
    enforce_ip_whitelist: p.enforce_ip_whitelist,
    block_on_limit: false,
    allowed_devices: ["Desktop"],
    blocked_devices: [],
  };
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SessionPoliciesPage() {
  const queryClient = useQueryClient();
  const { data: apiPolicies, isLoading } = useQuery({
    queryKey: ["cc-session-policies"],
    queryFn: getSessionPolicies,
  });
  const policies: PolicyRow[] = useMemo(
    () => (apiPolicies ?? []).map(toPolicyRow),
    [apiPolicies]
  );
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftPolicy | null>(null);

  const activePolicies = policies.filter((p) => p.is_active).length;
  const rolesCovered = policies.filter((p) => p.role !== null).length;
  const strictestTimeout = Math.min(...policies.map((p) => p.session_timeout_minutes));
  const singleDeviceRoles = policies.filter((p) => p.enforce_single_device).length;

  const mutation = useMutation({
    mutationFn: (vars: { uuid: string; payload: UpdateSessionPolicyPayload }) =>
      updateSessionPolicy(vars.uuid, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cc-session-policies"] });
      toast.success("Session policy saved.");
      setSelectedUuid(null);
      setDraft(null);
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: "Failed to save policy. Please try again." });
    },
  });

  function openEdit(policy: PolicyRow) {
    setSelectedUuid(policy.uuid);
    setDraft(toDraft(policy));
  }

  function closePanel() {
    setSelectedUuid(null);
    setDraft(null);
  }

  function handleSave() {
    if (!draft || !selectedUuid) return;
    const payload: UpdateSessionPolicyPayload = {
      role: draft.role,
      session_timeout_minutes: draft.session_timeout_minutes,
      absolute_timeout_minutes: draft.absolute_timeout_minutes,
      max_concurrent_sessions: draft.max_concurrent_sessions,
      require_mfa: draft.require_mfa,
      enforce_single_device: draft.enforce_single_device,
      enforce_ip_whitelist: draft.enforce_ip_whitelist,
      is_active: true,
    };
    mutation.mutate({ uuid: selectedUuid, payload });
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5" style={{ color: CC_ACCENT }} />
            Session Policies
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Per-role session timeout, MFA, concurrency, and device rules
          </p>
        </div>
        <Button size="sm" style={{ background: CC_ACCENT }} className="text-white gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Policy
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Shield} label="Active Policies" value={activePolicies} sub="currently enforced" />
        <StatCard icon={Users} label="Roles Covered" value={rolesCovered} sub="role-specific rules" />
        <StatCard
          icon={Clock}
          label="Strictest Timeout"
          value={minutesToHuman(strictestTimeout)}
          sub="shortest idle limit"
        />
        <StatCard
          icon={Smartphone}
          label="Single-Device Roles"
          value={singleDeviceRoles}
          sub="enforce single login"
        />
      </div>

      {/* Table + Panel */}
      <div className="flex gap-4 items-start">
        {/* Role Policy Matrix */}
        <div className="flex-1 overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold text-foreground">Role Policy Matrix</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {[
                    "Role",
                    "Max Sessions",
                    "Idle Timeout",
                    "Abs Timeout",
                    "Single Device",
                    "Require 2FA",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      Loading session policies…
                    </td>
                  </tr>
                ) : policies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      No session policies configured yet.
                    </td>
                  </tr>
                ) : (
                  policies.map((policy) => {
                  const level = getStrictness(policy);
                  const isSelected = selectedUuid === policy.uuid;
                  return (
                    <tr
                      key={policy.uuid}
                      className={cn(
                        "border-b last:border-0 transition-colors",
                        isSelected ? "bg-indigo-50/60" : "hover:bg-muted/20"
                      )}
                    >
                      <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
                        {policy.label}
                        {policy.role === null && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(fallback)</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {policy.max_concurrent_sessions}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        {minutesToHuman(policy.session_timeout_minutes)}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        {minutesToHuman(policy.absolute_timeout_minutes)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "text-xs font-medium px-1.5 py-0.5 rounded",
                            policy.enforce_single_device
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-400"
                          )}
                        >
                          {policy.enforce_single_device ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "text-xs font-medium px-1.5 py-0.5 rounded",
                            policy.require_mfa
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-400"
                          )}
                        >
                          {policy.require_mfa ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <StrictnessBadge level={level} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openEdit(policy)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Panel */}
        <AnimatePresence>
          {selectedUuid !== null && draft !== null && (
            <motion.div
              key="edit-panel"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-[340px] shrink-0 rounded-xl border bg-white shadow-sm flex flex-col overflow-hidden"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div>
                  <p className="text-sm font-semibold text-foreground">Edit Session Policy</p>
                  <p className="text-xs text-muted-foreground">{draft.label}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={closePanel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {/* Session Limits */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Session Limits
                  </p>

                  {/* Max Sessions stepper */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max Concurrent Sessions</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          setDraft((d) =>
                            d ? { ...d, max_concurrent_sessions: Math.max(1, d.max_concurrent_sessions - 1) } : d
                          )
                        }
                      >
                        –
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">
                        {draft.max_concurrent_sessions}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          setDraft((d) =>
                            d ? { ...d, max_concurrent_sessions: Math.min(10, d.max_concurrent_sessions + 1) } : d
                          )
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Idle Timeout slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">Idle Timeout</Label>
                      <span className="text-xs font-semibold" style={{ color: CC_ACCENT }}>
                        {minutesToHuman(draft.session_timeout_minutes)}
                      </span>
                    </div>
                    <Slider
                      min={5}
                      max={120}
                      step={5}
                      value={[draft.session_timeout_minutes]}
                      onValueChange={([v]: [number]) =>
                        setDraft((d) => (d ? { ...d, session_timeout_minutes: v } : d))
                      }
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>5 min</span>
                      <span>2h</span>
                    </div>
                  </div>

                  {/* Absolute Timeout slider (hours) */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">Absolute Timeout</Label>
                      <span className="text-xs font-semibold" style={{ color: CC_ACCENT }}>
                        {minutesToHuman(draft.absolute_timeout_minutes)}
                      </span>
                    </div>
                    <Slider
                      min={1}
                      max={24}
                      step={1}
                      value={[Math.round(draft.absolute_timeout_minutes / 60)]}
                      onValueChange={([v]: [number]) =>
                        setDraft((d) => (d ? { ...d, absolute_timeout_minutes: v * 60 } : d))
                      }
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>1h</span>
                      <span>24h</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Security Controls */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Security Controls
                  </p>

                  {(
                    [
                      { key: "enforce_single_device", label: "Single Device", desc: "Allow only one active session" },
                      { key: "require_mfa", label: "Require 2FA", desc: "Enforce multi-factor authentication" },
                      { key: "block_on_limit", label: "Block on Limit", desc: "Block new login when session limit reached" },
                    ] as const
                  ).map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-foreground">{label}</p>
                        <p className="text-[10px] text-muted-foreground">{desc}</p>
                      </div>
                      <Switch
                        size="sm"
                        checked={draft[key]}
                        onCheckedChange={(checked) =>
                          setDraft((d) => (d ? { ...d, [key]: checked } : d))
                        }
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Device Restrictions */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Device Restrictions
                  </p>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Allowed Devices</Label>
                    <div className="space-y-1">
                      {["Desktop", "Mobile", "Tablet"].map((device) => (
                        <label key={device} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-indigo-600"
                            checked={draft.allowed_devices.includes(device)}
                            onChange={(e) => {
                              setDraft((d) => {
                                if (!d) return d;
                                const next = e.target.checked
                                  ? [...d.allowed_devices, device]
                                  : d.allowed_devices.filter((x) => x !== device);
                                return { ...d, allowed_devices: next };
                              });
                            }}
                          />
                          <span className="text-xs text-foreground">{device}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Blocked Environments</Label>
                    <div className="space-y-1">
                      {["Public Browser", "VPN Required"].map((env) => (
                        <label key={env} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-indigo-600"
                            checked={draft.blocked_devices.includes(env)}
                            onChange={(e) => {
                              setDraft((d) => {
                                if (!d) return d;
                                const next = e.target.checked
                                  ? [...d.blocked_devices, env]
                                  : d.blocked_devices.filter((x) => x !== env);
                                return { ...d, blocked_devices: next };
                              });
                            }}
                          />
                          <span className="text-xs text-foreground">{env}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Risk callout */}
                <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Reducing session limits may immediately terminate active sessions for this role.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={closePanel}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-white"
                  style={{ background: CC_ACCENT }}
                  onClick={handleSave}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Saving…" : "Save Policy"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
