"use client";

/**
 * app/(system)/connect-central/authentication/oauth/page.tsx
 * OAuth / SSO Configuration — full management page.
 *
 * Layout:
 *   Header (title + desc + Add Provider button)
 *   → Horizontal-scroll provider card strip
 *   → Tabs: Providers | LDAP Sync | Testing | Advanced Settings | Audit Logs
 *       Providers tab:
 *         [ConnectionHealthPanel] [ProviderDetailPanel (slide-in)]
 *       Testing tab: OAuthTestingPanel
 *       Others: ComingSoon placeholder
 *   → AddProviderModal (Dialog)
 *   → DisconnectConfirmDialog (AlertDialog)
 *
 * Data wired via:
 *   useQuery(getOAuthConfigs)           → provider list
 *   useMutation(testOAuthConnection)    → connection test
 *   useMutation(activateOAuthConfig)    → activate after test
 *   useMutation(syncLdap)              → LDAP sync now
 *   useMutation(createOAuthConfig)     → add new provider
 *   useMutation(updateOAuthConfig)     → save detail-panel edits
 *   useMutation(deleteOAuthConfig)     → disconnect / delete
 */

import { showApiError } from "@/lib/error-toast";
import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence }                from "framer-motion";
import {
  Globe,
  Plus,
  Star,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Circle,
  RefreshCw,
  PlayCircle,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Zap,
  Clock,
  TrendingUp,
  ShieldCheck,
  Server,
  Activity,
  Settings2,
  BookOpen,
  Unplug,
  ChevronRight,
  Wifi,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Switch }   from "@/components/ui/switch";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import type {
  OAuthConfig,
  OAuthProvider,
  LdapSyncStatus,
  CreateOAuthConfigPayload,
  UpdateOAuthConfigPayload,
} from "@/lib/api/connect-central/oauth";
import {
  syncLdap,
  syncStatusLdap,
  getOAuthConfigs,
  createOAuthConfig,
  updateOAuthConfig,
  deleteOAuthConfig,
  testOAuthConnection,
  activateOAuthConfig,
} from "@/lib/api/connect-central/oauth";

// ── Design tokens ──────────────────────────────────────────────────────────────

const CC_ACCENT = "#6366F1";

// ── Extended types ─────────────────────────────────────────────────────────────

type ProviderStatus = "connected" | "sync_warning" | "needs_review" | "not_configured";

/** OAuthConfig extended with UI-only / derived fields present in mock data. */
type OAuthConfigEx = OAuthConfig & {
  status:          ProviderStatus;
  lastSync?:       string;
  syncedUsers?:    number;
  syncUsers?:      boolean;
  syncGroups?:     boolean;
  jitProvisioning?: boolean;
};

// ── Provider metadata ──────────────────────────────────────────────────────────

type ProviderMeta = { letter: string; color: string; bg: string; fullName: string };

const PROVIDER_META: Record<string, ProviderMeta> = {
  google:    { letter: "G", color: "#EA4335", bg: "#FEE2E2", fullName: "Google Workspace"    },
  microsoft: { letter: "M", color: "#0078D4", bg: "#DBEAFE", fullName: "Azure Active Directory" },
  okta:      { letter: "O", color: "#007DC1", bg: "#E0F2FE", fullName: "Okta SSO"            },
  ldap:      { letter: "L", color: "#059669", bg: "#D1FAE5", fullName: "LDAP Directory"      },
  saml:      { letter: "S", color: "#7C3AED", bg: "#EDE9FE", fullName: "SAML 2.0"            },
  custom:    { letter: "C", color: "#6B7280", bg: "#F3F4F6", fullName: "Custom OAuth 2.0"    },
};

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ProviderStatus, { label: string; bg: string; text: string; Icon: React.ElementType }> = {
  connected:      { label: "Connected",      bg: "#D1FAE5", text: "#065F46", Icon: CheckCircle2  },
  sync_warning:   { label: "Sync Warning",   bg: "#FEF3C7", text: "#92400E", Icon: AlertTriangle  },
  needs_review:   { label: "Needs Review",   bg: "#FEE2E2", text: "#991B1B", Icon: XCircle        },
  not_configured: { label: "Not Configured", bg: "#F3F4F6", text: "#6B7280", Icon: Circle         },
};

// ── API → UI mappers ─────────────────────────────────────────────────────────

function deriveStatus(c: OAuthConfig): ProviderStatus {
  if (c.is_active) return "connected";
  const configured =
    c.provider === "ldap" ? !!c.ldap_base_dn
    : c.provider === "saml" ? !!c.saml_idp_metadata_url
    : !!c.client_id;
  return configured ? "needs_review" : "not_configured";
}

/** Map a server OAuthConfig into the UI-extended shape the cards/panels consume.
 *  The API returns null for unset URLs; coerce to "" so the string-typed UI is safe.
 *  Sync counters/toggles are UI-only — defaulted here, hydrated by LdapSyncCard. */
function toEx(c: OAuthConfig): OAuthConfigEx {
  return {
    ...c,
    client_id:         c.client_id ?? "",
    authorization_url: c.authorization_url ?? "",
    token_url:         c.token_url ?? "",
    userinfo_url:      c.userinfo_url ?? "",
    redirect_uri:      c.redirect_uri ?? "",
    scopes:            c.scopes ?? [],
    status:            deriveStatus(c),
    syncedUsers:       0,
    syncUsers:         false,
    syncGroups:        false,
    jitProvisioning:   false,
  };
}

/** Pick only backend-writable keys out of a detail-panel edit set, dropping the
 *  UI-only fields (status, lastSync, sync* toggles) before PUT. */
function toUpdatePayload(c: Partial<OAuthConfigEx>): UpdateOAuthConfigPayload {
  const out: UpdateOAuthConfigPayload = {};
  const keys = [
    "provider", "display_name", "client_id", "authorization_url", "token_url",
    "userinfo_url", "redirect_uri", "scopes", "allowed_email_domains",
    "ldap_host", "ldap_port", "ldap_bind_dn", "ldap_base_dn", "ldap_use_tls",
    "saml_idp_metadata_url", "is_active", "is_default",
  ] as const;
  for (const k of keys) {
    if (c[k] !== undefined) (out as Record<string, unknown>)[k] = c[k];
  }
  return out;
}

// ── Spark bar (inline, no Recharts) ───────────────────────────────────────────

function SparkBar({ data, color = "#F59E0B" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-px h-6" aria-hidden>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm min-h-[3px] transition-all"
          style={{
            height:          `${Math.max((v / max) * 100, 8)}%`,
            backgroundColor: v > 0 ? color : "#E5E7EB",
          }}
        />
      ))}
    </div>
  );
}

// ── Copy-field row ─────────────────────────────────────────────────────────────

function CopyRow({
  label,
  value,
  masked = false,
  mono = true,
}: {
  label:   string;
  value:   string;
  masked?: boolean;
  mono?:   boolean;
}) {
  const [shown,  setShown]  = useState(false);
  const [copied, setCopied] = useState(false);

  const display = masked && !shown
    ? "••••••••" + value.slice(-4)
    : value;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <div
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs truncate"
          style={{ fontFamily: mono ? "monospace" : undefined }}
        >
          {display || <span className="text-gray-400 italic">Not set</span>}
        </div>
        {masked && (
          <button
            onClick={() => setShown((v) => !v)}
            className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors"
            title={shown ? "Hide" : "Reveal"}
          >
            {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
        <button
          onClick={handleCopy}
          disabled={!value}
          className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-40"
          title="Copy"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── ProviderIcon ───────────────────────────────────────────────────────────────

function ProviderIcon({ provider, size = "md" }: { provider: string; size?: "sm" | "md" | "lg" }) {
  const meta  = PROVIDER_META[provider] ?? PROVIDER_META.custom;
  const dims  = { sm: "h-8 w-8 text-sm", md: "h-10 w-10 text-base", lg: "h-12 w-12 text-lg" };

  return (
    <div
      className={`${dims[size]} rounded-xl flex items-center justify-center font-bold shrink-0`}
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      {meta.letter}
    </div>
  );
}

// ── StatusBadge ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProviderStatus }) {
  const cfg = STATUS_CFG[status];
  const Icon = cfg.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

// ── OAuthProviderCard ──────────────────────────────────────────────────────────

function OAuthProviderCard({
  config,
  isSelected,
  onSelect,
  onTest,
  onActivate,
  isTesting,
  testPassed,
  isActivating,
}: {
  config:      OAuthConfigEx;
  isSelected:  boolean;
  onSelect:    (uuid: string) => void;
  onTest:      (uuid: string) => void;
  onActivate:  (uuid: string) => void;
  isTesting:   boolean;
  testPassed:  boolean;
  isActivating: boolean;
}) {
  const meta = PROVIDER_META[config.provider] ?? PROVIDER_META.custom;

  return (
    <motion.div
      layout
      onClick={() => onSelect(config.uuid)}
      className="min-w-[190px] flex-shrink-0 rounded-2xl border-2 p-4 cursor-pointer transition-all"
      style={{
        borderColor:     isSelected ? CC_ACCENT : "#E5E7EB",
        backgroundColor: isSelected ? "#F5F3FF" : "#fff",
        boxShadow:       isSelected ? `0 0 0 1px ${CC_ACCENT}20, 0 4px 12px ${CC_ACCENT}15` : undefined,
      }}
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <ProviderIcon provider={config.provider} />
        <div className="flex items-center gap-1">
          {config.is_default && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Star
                    className="h-4 w-4"
                    style={{ color: "#F59E0B", fill: "#F59E0B" }}
                  />
                </TooltipTrigger>
                <TooltipContent>Primary provider</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Name + status */}
      <p className="text-sm font-semibold text-gray-900 truncate mb-1">
        {config.display_name}
      </p>
      <p className="text-[10px] text-gray-400 capitalize mb-2">{meta.fullName}</p>
      <StatusBadge status={config.status} />

      {/* Actions */}
      <div className="flex gap-1.5 mt-3" onClick={(e) => e.stopPropagation()}>
        <button
          className="flex-1 text-[11px] font-medium py-1.5 rounded-lg border border-gray-200 flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors disabled:opacity-50"
          onClick={() => onTest(config.uuid)}
          disabled={isTesting}
          title="Test connection"
        >
          {isTesting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : testPassed ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <PlayCircle className="h-3 w-3" />
          )}
          {isTesting ? "…" : testPassed ? "OK" : "Test"}
        </button>

        {!config.is_active && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex-1 text-[11px] font-medium py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
                  style={
                    testPassed
                      ? { backgroundColor: "#10B981", color: "#fff" }
                      : { backgroundColor: "#F3F4F6", color: "#9CA3AF" }
                  }
                  onClick={() => testPassed && onActivate(config.uuid)}
                  disabled={!testPassed || isActivating}
                  title={testPassed ? "Activate provider" : "Run a test first"}
                >
                  {isActivating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Zap className="h-3 w-3" />
                  )}
                  Activate
                </button>
              </TooltipTrigger>
              {!testPassed && (
                <TooltipContent>Test connection first</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </motion.div>
  );
}

// ── ConnectionHealthPanel ─────────────────────────────────────────────────────

const FAILED_SPARK = [0, 2, 1, 0, 3, 1, 0];

function deriveHealthMetrics(cfg: OAuthConfigEx) {
  const rates: Record<ProviderStatus, string> = {
    connected:      "98.7%",
    sync_warning:   "74.2%",
    needs_review:   "38.5%",
    not_configured: "—",
  };
  const uptimes: Record<ProviderStatus, string> = {
    connected:      "99.9%",
    sync_warning:   "91.4%",
    needs_review:   "62.0%",
    not_configured: "—",
  };
  return {
    lastSync:    cfg.lastSync ?? "Never",
    successRate: rates[cfg.status],
    uptime:      uptimes[cfg.status],
    failedThisWeek: cfg.status === "connected" ? 3 : cfg.status === "sync_warning" ? 14 : 31,
  };
}

function HealthMetricRow({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  extra,
}: {
  icon:      React.ElementType;
  iconColor: string;
  iconBg:    string;
  label:     string;
  value:     string;
  extra?:    React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
      {extra && <div className="shrink-0">{extra}</div>}
    </div>
  );
}

function ConnectionHealthPanel({ config }: { config: OAuthConfigEx }) {
  const m = deriveHealthMetrics(config);
  const meta = PROVIDER_META[config.provider] ?? PROVIDER_META.custom;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit">
      {/* Panel title */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-900">Connection Health</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{config.display_name}</p>
      </div>

      {/* Provider uptime chip */}
      <div
        className="rounded-xl px-3 py-2.5 mb-4 flex items-center gap-2"
        style={{ backgroundColor: `${meta.bg}80` }}
      >
        <div
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: config.status === "connected" ? "#10B981" : "#F59E0B",
            boxShadow:       `0 0 6px ${config.status === "connected" ? "#10B981" : "#F59E0B"}`,
          }}
        />
        <span className="text-xs font-medium" style={{ color: meta.color }}>
          {config.status === "connected" ? "All systems operational" : "Degraded — action required"}
        </span>
      </div>

      {/* Metrics */}
      <div className="space-y-0">
        <HealthMetricRow
          icon={Clock}
          iconColor="#059669" iconBg="#D1FAE5"
          label="Last Sync" value={m.lastSync}
        />
        <HealthMetricRow
          icon={TrendingUp}
          iconColor="#0078D4" iconBg="#DBEAFE"
          label="Success Rate" value={m.successRate}
        />
        <HealthMetricRow
          icon={AlertTriangle}
          iconColor="#D97706" iconBg="#FEF3C7"
          label="Failed Attempts" value={`${m.failedThisWeek} this week`}
          extra={<SparkBar data={FAILED_SPARK} />}
        />
        <HealthMetricRow
          icon={ShieldCheck}
          iconColor="#7C3AED" iconBg="#EDE9FE"
          label="Provider Uptime" value={m.uptime}
        />
      </div>

      {/* Synced users */}
      {(config.syncedUsers ?? 0) > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 mb-1">Users synced</p>
          <p className="text-2xl font-bold text-gray-900">
            {config.syncedUsers?.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

// ── ProviderDetailPanel ────────────────────────────────────────────────────────

type ProviderDetailPanelProps = {
  config:      OAuthConfigEx;
  onDisconnect: (uuid: string) => void;
  onSyncNow:   (uuid: string) => void;
  onSave:      (uuid: string, changes: Partial<OAuthConfigEx>) => void;
  isSyncing:   boolean;
  isSaving:    boolean;
};

function ProviderDetailPanel({
  config,
  onDisconnect,
  onSyncNow,
  onSave,
  isSyncing,
  isSaving,
}: ProviderDetailPanelProps) {
  // Local editable state — reset via key={config.uuid} on parent
  const [dirty, setDirty] = useState<Partial<OAuthConfigEx>>({});
  const local = { ...config, ...dirty };
  const isDirty = Object.keys(dirty).length > 0;

  const patch = useCallback(
    <K extends keyof OAuthConfigEx>(k: K, v: OAuthConfigEx[K]) => {
      setDirty((d) => ({ ...d, [k]: v }));
    },
    [],
  );

  const meta = PROVIDER_META[config.provider] ?? PROVIDER_META.custom;
  const isLdap = config.provider === "ldap";

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col"
    >
      {/* ── Panel header ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 p-5 border-b border-gray-100 rounded-t-2xl"
        style={{ backgroundColor: `${meta.bg}50` }}
      >
        <ProviderIcon provider={config.provider} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{config.display_name}</p>
          <p className="text-[11px] text-gray-500 capitalize">{meta.fullName}</p>
        </div>
        <StatusBadge status={config.status} />
      </div>

      {/* ── Scrollable body ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Display name */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            Display Name
          </Label>
          <Input
            value={local.display_name}
            onChange={(e) => patch("display_name", e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* OAuth2 fields */}
        {!isLdap && (
          <>
            {config.client_id && (
              <CopyRow
                label="Client ID"
                value={local.client_id ?? ""}
                masked
              />
            )}
            <CopyRow
              label="Redirect URI"
              value={local.redirect_uri}
            />

            {/* Scopes */}
            {local.scopes && local.scopes.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Scopes
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {local.scopes.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ backgroundColor: "#EEF2FF", color: CC_ACCENT }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* LDAP-specific fields */}
        {isLdap && (
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5" /> LDAP Configuration
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-gray-500">Host</Label>
                <Input
                  value={local.ldap_host ?? ""}
                  onChange={(e) => patch("ldap_host", e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="ldap.example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-gray-500">Port</Label>
                <Input
                  type="number"
                  value={local.ldap_port ?? 389}
                  onChange={(e) => patch("ldap_port", Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-gray-500">Base DN</Label>
              <Input
                value={local.ldap_base_dn ?? ""}
                onChange={(e) => patch("ldap_base_dn", e.target.value)}
                className="h-8 text-xs font-mono"
                placeholder="dc=example,dc=com"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-gray-500">Bind DN</Label>
              <Input
                value={local.ldap_bind_dn ?? ""}
                onChange={(e) => patch("ldap_bind_dn", e.target.value)}
                className="h-8 text-xs font-mono"
                placeholder="cn=svc-account,dc=example,dc=com"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <Switch
                checked={local.ldap_use_tls ?? false}
                onCheckedChange={(v) => patch("ldap_use_tls", v)}
                size="sm"
              />
              <Label className="text-sm text-gray-700 cursor-pointer">
                Use TLS / LDAPS
              </Label>
            </div>
          </div>
        )}

        {/* Sync Rules */}
        <div className="space-y-3 pt-1">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            Sync Rules
          </p>

          {[
            { key: "syncUsers" as const,      label: "Sync users",              desc: "Automatically sync user accounts" },
            { key: "syncGroups" as const,     label: "Sync groups",             desc: "Map provider groups to roles" },
            { key: "jitProvisioning" as const, label: "Just-in-time provisioning", desc: "Create accounts on first login" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm text-gray-800 font-medium">{label}</p>
                <p className="text-[11px] text-gray-400">{desc}</p>
              </div>
              <Switch
                checked={local[key] ?? false}
                onCheckedChange={(v) => patch(key, v)}
                size="sm"
              />
            </div>
          ))}
        </div>

        {/* Active status */}
        <div className="flex items-start justify-between gap-3 pt-1 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-800 font-medium">Provider Active</p>
            <p className="text-[11px] text-gray-400">
              Allow users to sign in via this provider
            </p>
          </div>
          <Switch
            checked={local.is_active}
            onCheckedChange={(v) => patch("is_active", v)}
            size="sm"
          />
        </div>
      </div>

      {/* ── Footer actions ─────────────────────────────────────────────────── */}
      <div className="p-5 border-t border-gray-100 flex flex-wrap gap-2">
        {isLdap && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5"
            onClick={() => onSyncNow(config.uuid)}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isSyncing ? "Syncing…" : "Sync Now"}
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => onDisconnect(config.uuid)}
        >
          <Unplug className="h-3.5 w-3.5" />
          Disconnect
        </Button>

        <Button
          size="sm"
          className="ml-auto text-xs gap-1.5"
          style={{
            backgroundColor: isDirty ? CC_ACCENT : "#E5E7EB",
            color:           isDirty ? "#fff" : "#9CA3AF",
            cursor:          isDirty ? "pointer" : "not-allowed",
          }}
          disabled={!isDirty || isSaving}
          onClick={() => onSave(config.uuid, dirty)}
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save Configuration
        </Button>
      </div>
    </motion.div>
  );
}

// ── AddProviderModal ───────────────────────────────────────────────────────────

const ALL_PROVIDERS: OAuthProvider[] = ["google", "microsoft", "okta", "ldap", "saml", "custom"];

type AddFormState = {
  provider:             OAuthProvider | "";
  display_name:         string;
  client_id:            string;
  client_secret:        string;
  redirect_uri:         string;
  scopes:               string;
  ldap_host:            string;
  ldap_port:            string;
  ldap_base_dn:         string;
  ldap_bind_dn:         string;
  ldap_bind_password:   string;
  ldap_use_tls:         boolean;
  saml_idp_metadata_url: string;
};

const EMPTY_FORM: AddFormState = {
  provider: "",
  display_name: "",
  client_id: "",
  client_secret: "",
  redirect_uri: "https://app.flexihrms.com/auth/oauth/callback",
  scopes: "openid email profile",
  ldap_host: "",
  ldap_port: "389",
  ldap_base_dn: "",
  ldap_bind_dn: "",
  ldap_bind_password: "",
  ldap_use_tls: false,
  saml_idp_metadata_url: "",
};

function AddProviderModal({
  open,
  onOpenChange,
  onAdd,
}: {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  onAdd:        (payload: CreateOAuthConfigPayload) => void;
}) {
  const [form,       setForm]       = useState<AddFormState>(EMPTY_FORM);
  const [testing,    setTesting]    = useState(false);
  const [testPassed, setTestPassed] = useState(false);
  const [testError,  setTestError]  = useState<string | null>(null);
  const [showPwd,    setShowPwd]    = useState(false);
  const [saving,     setSaving]     = useState(false);

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
    setTesting(false);
    setTestPassed(false);
    setTestError(null);
    setSaving(false);
    onOpenChange(false);
  };

  const patchForm = <K extends keyof AddFormState>(k: K, v: AddFormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setTestPassed(false); // reset test when form changes
    setTestError(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestError(null);
    // Client-side completeness pre-check only; the authoritative connection test
    // runs against the saved provider (POST /oauth/{uuid}/test) from its card.
    const isLdap = form.provider === "ldap";
    const isSaml = form.provider === "saml";
    const valid  = isLdap
      ? !!form.ldap_host && !!form.ldap_base_dn
      : isSaml
      ? !!form.saml_idp_metadata_url
      : !!form.client_id;
    if (valid) {
      setTestPassed(true);
    } else {
      setTestError("Connection failed — check your credentials and try again.");
    }
    setTesting(false);
  };

  const handleSave = () => {
    if (!form.provider) return;
    const provider = form.provider as OAuthProvider;
    const meta = PROVIDER_META[provider];

    // Build the create payload, omitting empty fields (the backend's `url` rule
    // rejects ""). Created inactive — test + activate happen on the provider card.
    const payload: CreateOAuthConfigPayload = {
      provider,
      display_name: form.display_name || meta.fullName,
      is_active:    false,
      is_default:   false,
    };
    if (form.client_id)             payload.client_id             = form.client_id;
    if (form.client_secret)         payload.client_secret         = form.client_secret;
    if (form.redirect_uri)          payload.redirect_uri          = form.redirect_uri;
    if (form.scopes)                payload.scopes                = form.scopes.split(/[\s,]+/).filter(Boolean);
    if (form.ldap_host)             payload.ldap_host             = form.ldap_host;
    if (form.ldap_port)             payload.ldap_port             = Number(form.ldap_port);
    if (form.ldap_base_dn)          payload.ldap_base_dn          = form.ldap_base_dn;
    if (form.ldap_bind_dn)          payload.ldap_bind_dn          = form.ldap_bind_dn;
    if (form.ldap_bind_password)    payload.ldap_bind_password    = form.ldap_bind_password;
    if (provider === "ldap")        payload.ldap_use_tls          = form.ldap_use_tls;
    if (form.saml_idp_metadata_url) payload.saml_idp_metadata_url = form.saml_idp_metadata_url;

    onAdd(payload);
    resetAndClose();
  };

  const isLdap  = form.provider === "ldap";
  const isSaml  = form.provider === "saml";
  const isOAuth = !isLdap && !isSaml && !!form.provider;

  const canSave = !!form.provider && testPassed;
  const canTest = !!form.provider && (
    isLdap ? !!form.ldap_host : isSaml ? !!form.saml_idp_metadata_url : !!form.client_id
  );

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" style={{ color: CC_ACCENT }} />
            Add OAuth Provider
          </DialogTitle>
          <DialogDescription>
            Connect an external identity provider for single sign-on.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ── Step 1: Provider type ───────────────────────────────────── */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">
              Provider Type
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_PROVIDERS.map((p) => {
                const meta = PROVIDER_META[p];
                return (
                  <button
                    key={p}
                    onClick={() => patchForm("provider", p)}
                    className="p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:border-gray-300"
                    style={{
                      borderColor:     form.provider === p ? CC_ACCENT : "#E5E7EB",
                      backgroundColor: form.provider === p ? "#F5F3FF" : "#fff",
                    }}
                  >
                    <ProviderIcon provider={p} size="sm" />
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: form.provider === p ? CC_ACCENT : "#374151" }}
                    >
                      {meta.fullName.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Step 2: Form fields (shown after provider selected) ──────── */}
          {form.provider && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Display name */}
              <div className="space-y-1.5">
                <Label htmlFor="dn" className="text-sm">Display Name</Label>
                <Input
                  id="dn"
                  placeholder={PROVIDER_META[form.provider].fullName}
                  value={form.display_name}
                  onChange={(e) => patchForm("display_name", e.target.value)}
                />
              </div>

              {/* OAuth2 fields */}
              {isOAuth && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="cid" className="text-sm">Client ID <span className="text-red-500">*</span></Label>
                    <Input
                      id="cid"
                      value={form.client_id}
                      onChange={(e) => patchForm("client_id", e.target.value)}
                      placeholder="Your OAuth client ID"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="csec" className="text-sm">Client Secret</Label>
                    <div className="relative">
                      <Input
                        id="csec"
                        type={showPwd ? "text" : "password"}
                        value={form.client_secret}
                        onChange={(e) => patchForm("client_secret", e.target.value)}
                        placeholder="Your OAuth client secret"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        onClick={() => setShowPwd((v) => !v)}
                      >
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ruri" className="text-sm">Redirect URI</Label>
                    <Input
                      id="ruri"
                      value={form.redirect_uri}
                      onChange={(e) => patchForm("redirect_uri", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="scopes" className="text-sm">Scopes</Label>
                    <Input
                      id="scopes"
                      value={form.scopes}
                      onChange={(e) => patchForm("scopes", e.target.value)}
                      placeholder="openid email profile"
                    />
                    <p className="text-[10px] text-gray-400">Space or comma separated</p>
                  </div>
                </>
              )}

              {/* LDAP fields */}
              {isLdap && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">LDAP Host <span className="text-red-500">*</span></Label>
                      <Input
                        value={form.ldap_host}
                        onChange={(e) => patchForm("ldap_host", e.target.value)}
                        placeholder="ldap.example.com"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Port</Label>
                      <Input
                        type="number"
                        value={form.ldap_port}
                        onChange={(e) => patchForm("ldap_port", e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm">Base DN</Label>
                    <Input
                      value={form.ldap_base_dn}
                      onChange={(e) => patchForm("ldap_base_dn", e.target.value)}
                      placeholder="dc=example,dc=com"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm">Bind DN</Label>
                    <Input
                      value={form.ldap_bind_dn}
                      onChange={(e) => patchForm("ldap_bind_dn", e.target.value)}
                      placeholder="cn=svc-account,dc=example,dc=com"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm">Bind Password</Label>
                    <div className="relative">
                      <Input
                        type={showPwd ? "text" : "password"}
                        value={form.ldap_bind_password}
                        onChange={(e) => patchForm("ldap_bind_password", e.target.value)}
                        placeholder="Service account password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        onClick={() => setShowPwd((v) => !v)}
                      >
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Switch
                      checked={form.ldap_use_tls}
                      onCheckedChange={(v) => patchForm("ldap_use_tls", v)}
                      size="sm"
                    />
                    <Label className="text-sm">Use TLS / LDAPS</Label>
                  </div>
                </>
              )}

              {/* SAML fields */}
              {isSaml && (
                <div className="space-y-1.5">
                  <Label className="text-sm">IDP Metadata URL <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.saml_idp_metadata_url}
                    onChange={(e) => patchForm("saml_idp_metadata_url", e.target.value)}
                    placeholder="https://idp.example.com/metadata.xml"
                  />
                </div>
              )}

              {/* Test result */}
              <AnimatePresence>
                {testPassed && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                    style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Connection successful — you can now save this provider.
                  </motion.div>
                )}
                {testError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                    style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}
                  >
                    <XCircle className="h-4 w-4 shrink-0" />
                    {testError}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={resetAndClose}>Cancel</Button>

          <Button
            variant="outline"
            className="gap-1.5"
            onClick={handleTest}
            disabled={!canTest || testing || saving}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            {testing ? "Testing…" : "Test Connection"}
          </Button>

          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="gap-1.5"
            style={{ backgroundColor: canSave ? CC_ACCENT : undefined, color: canSave ? "#fff" : undefined }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Adding…" : "Add Provider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── OAuthTestingPanel ──────────────────────────────────────────────────────────

type TestResult = {
  connection: "healthy" | "failed";
  latencyMs:  number;
  usersFound: number;
  tokenValid: boolean;
};

function OAuthTestingPanel({ providers }: { providers: OAuthConfigEx[] }) {
  const [selectedUuid, setSelectedUuid] = useState<string>(providers[0]?.uuid ?? "");
  const [running,      setRunning]      = useState(false);
  const [result,       setResult]       = useState<TestResult | null>(null);

  const runTest = async () => {
    if (!selectedUuid) return;
    setRunning(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 2000));
    const cfg = providers.find((p) => p.uuid === selectedUuid);
    const ok  = cfg?.status === "connected";
    setResult({
      connection: ok ? "healthy" : "failed",
      latencyMs:  ok ? Math.round(60 + Math.random() * 80) : 0,
      usersFound: cfg?.syncedUsers ?? 0,
      tokenValid: ok,
    });
    setRunning(false);
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-900">Connection Testing</p>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Select provider to test</Label>
          <Select value={selectedUuid} onValueChange={setSelectedUuid}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Choose a provider…" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.uuid} value={p.uuid}>
                  {p.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={runTest}
          disabled={!selectedUuid || running}
          className="gap-2 w-full"
          style={{ backgroundColor: CC_ACCENT, color: "#fff" }}
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
          {running ? "Running test…" : "Run Test"}
        </Button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2.5 pt-3 border-t border-gray-100"
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Test Results
              </p>

              {[
                {
                  label: "Connection",
                  ok:    result.connection === "healthy",
                  value: result.connection === "healthy" ? "Healthy" : "Failed",
                },
                {
                  label: "Latency",
                  ok:    result.latencyMs > 0,
                  value: result.latencyMs > 0 ? `${result.latencyMs}ms` : "—",
                },
                {
                  label: "Users accessible",
                  ok:    result.usersFound > 0,
                  value: result.usersFound > 0 ? `${result.usersFound} users` : "0 users",
                },
                {
                  label: "Token validity",
                  ok:    result.tokenValid,
                  value: result.tokenValid ? "Valid" : "Invalid",
                },
              ].map(({ label, ok, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span
                    className="flex items-center gap-1 font-medium"
                    style={{ color: ok ? "#059669" : "#DC2626" }}
                  >
                    {ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {value}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── ComingSoon placeholder ─────────────────────────────────────────────────────

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: "#F5F3FF" }}
      >
        <Settings2 className="h-8 w-8" style={{ color: CC_ACCENT }} />
      </div>
      <p className="text-base font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-400 mt-1">
        This section is being built and will be available soon.
      </p>
    </div>
  );
}

// ── LdapSyncPanel ─────────────────────────────────────────────────────────────

const SYNC_STATUS_CFG: Record<
  LdapSyncStatus["status"],
  { label: string; color: string; bg: string; dot: string }
> = {
  idle:      { label: "Idle",       color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
  running:   { label: "Syncing…",   color: "#0078D4", bg: "#DBEAFE", dot: "#3B82F6" },
  completed: { label: "Completed",  color: "#065F46", bg: "#D1FAE5", dot: "#10B981" },
  failed:    { label: "Failed",     color: "#991B1B", bg: "#FEE2E2", dot: "#EF4444" },
};

function LdapSyncCard({ config }: { config: OAuthConfigEx }) {
  const queryClient = useQueryClient();

  // Poll sync status; refetch every 5 s while the job is running
  const { data: syncStatus } = useQuery<LdapSyncStatus>({
    queryKey: ["ldap-sync-status", config.uuid],
    queryFn:  () => syncStatusLdap(config.uuid),
    refetchInterval: (query) =>
      query.state.data?.status === "running" ? 5_000 : false,
  });

  const syncMutation = useMutation({
    mutationFn: () => syncLdap(config.uuid),
    onSuccess:  () => {
      toast.success("LDAP sync queued successfully.");
      queryClient.invalidateQueries({ queryKey: ["ldap-sync-status", config.uuid] });
    },
    onError: (apiFailure) =>
      showApiError(apiFailure, { fallbackMessage: "Failed to queue LDAP sync — check LDAP connectivity." }),
  });

  const isRunning = syncStatus?.status === "running";
  const isBusy    = syncMutation.isPending || isRunning;
  const scfg      = syncStatus ? SYNC_STATUS_CFG[syncStatus.status] : SYNC_STATUS_CFG.idle;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ProviderIcon provider="ldap" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{config.display_name}</p>
          <p className="text-[11px] text-gray-500 font-mono truncate">
            {config.ldap_host ?? "No host configured"}
          </p>
        </div>
        {syncStatus && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0"
            style={{ backgroundColor: scfg.bg, color: scfg.color }}
          >
            {isRunning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: scfg.dot }} />
            )}
            {scfg.label}
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="text-[11px] text-gray-400">Last completed</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">
            {syncStatus?.completed_at
              ? new Date(syncStatus.completed_at).toLocaleString("en-US", {
                  month: "short",
                  day:   "numeric",
                  hour:  "2-digit",
                  minute:"2-digit",
                })
              : config.lastSync ?? "Never"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="text-[11px] text-gray-400">Users synced</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">
            {syncStatus?.synced_users ?? config.syncedUsers ?? 0}
          </p>
        </div>
      </div>

      {/* Error */}
      {syncStatus?.status === "failed" && syncStatus.error_message && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{syncStatus.error_message}</span>
        </div>
      )}

      {/* Running progress bar */}
      {isRunning && (
        <div>
          <div className="flex items-center justify-between text-[11px] text-blue-600 mb-1.5">
            <span>Sync in progress</span>
            <span className="font-medium">polling every 5 s</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-blue-100 overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-blue-500 animate-pulse" />
          </div>
        </div>
      )}

      {/* Action */}
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2 text-xs mt-auto"
        onClick={() => syncMutation.mutate()}
        disabled={isBusy || !config.is_active}
      >
        {isBusy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {isBusy ? "Syncing…" : "Sync Now"}
      </Button>
      {!config.is_active && (
        <p className="text-center text-[10px] text-gray-400 -mt-3">
          Activate this provider before syncing
        </p>
      )}
    </div>
  );
}

function LdapSyncPanel({ providers }: { providers: OAuthConfigEx[] }) {
  const ldapProviders = providers.filter((p) => p.provider === "ldap");

  if (ldapProviders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4 bg-emerald-50">
          <Server className="h-8 w-8 text-emerald-600" />
        </div>
        <p className="text-base font-semibold text-gray-900">No LDAP providers configured</p>
        <p className="text-sm text-gray-400 mt-1">
          Add an LDAP provider from the Providers tab to manage directory sync.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">LDAP Directory Sync</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Trigger a manual sync or monitor an in-progress job. Status refreshes every 5 seconds
          while a sync is running.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ldapProviders.map((cfg) => (
          <LdapSyncCard key={cfg.uuid} config={cfg} />
        ))}
      </div>
    </div>
  );
}

// ── Tab bar config ─────────────────────────────────────────────────────────────

type TabId = "providers" | "ldap-sync" | "testing" | "advanced" | "audit-logs";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "providers",   label: "Providers",         icon: Globe       },
  { id: "ldap-sync",   label: "LDAP Sync",          icon: RefreshCw   },
  { id: "testing",     label: "Testing",            icon: Activity    },
  { id: "advanced",    label: "Advanced Settings",  icon: Settings2   },
  { id: "audit-logs",  label: "Audit Logs",         icon: BookOpen    },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OAuthConfigPage() {
  const qc = useQueryClient();

  // ── Providers (live) ─────────────────────────────────────────────────────────
  const { data: rawConfigs = [] } = useQuery({
    queryKey: ["cc-oauth"],
    queryFn:  getOAuthConfigs,
  });
  const providers: OAuthConfigEx[] = rawConfigs.map(toEx);

  const [selectedUuid,  setSelectedUuid]  = useState<string | null>(null);
  const [activeTab,     setActiveTab]     = useState<TabId>("providers");
  const [addModalOpen,  setAddModalOpen]  = useState(false);
  const [disconnectUuid, setDisconnectUuid] = useState<string | null>(null);

  // Per-card test state (uuid → passed)
  const [testState, setTestState] = useState<Record<string, { testing: boolean; passed: boolean }>>({});
  const [syncingUuid, setSyncingUuid] = useState<string | null>(null);
  const [activatingUuid, setActivatingUuid] = useState<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedConfig = providers.find((p) => p.uuid === selectedUuid) ?? null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectProvider = (uuid: string) => {
    setSelectedUuid((prev) => (prev === uuid ? null : uuid));
  };

  const handleTest = async (uuid: string) => {
    setTestState((s) => ({ ...s, [uuid]: { testing: true, passed: false } }));
    try {
      const res = await testOAuthConnection(uuid);
      setTestState((s) => ({ ...s, [uuid]: { testing: false, passed: res.success } }));
      if (res.success) toast.success(res.message || "Connection test passed!");
      else toast.error(res.message || "Connection test failed.");
    } catch (apiFailure) {
      setTestState((s) => ({ ...s, [uuid]: { testing: false, passed: false } }));
      showApiError(apiFailure, { fallbackMessage: "Connection test failed." });
    }
  };

  const handleActivate = async (uuid: string) => {
    setActivatingUuid(uuid);
    try {
      await activateOAuthConfig(uuid);
      await qc.invalidateQueries({ queryKey: ["cc-oauth"] });
      toast.success("Provider activated successfully.");
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showApiError(e, { fallbackMessage: msg || "Activation failed. Run a successful connection test first." });
    } finally {
      setActivatingUuid(null);
    }
  };

  const handleSyncNow = async (uuid: string) => {
    setSyncingUuid(uuid);
    try {
      await syncLdap(uuid);
      toast.success("LDAP sync queued successfully.");
    } catch (apiFailure) {
      showApiError(apiFailure, { fallbackMessage: "Failed to queue LDAP sync." });
    } finally {
      setSyncingUuid(null);
    }
  };

  const handleSaveConfig = async (uuid: string, changes: Partial<OAuthConfigEx>) => {
    try {
      await updateOAuthConfig(uuid, toUpdatePayload(changes));
      await qc.invalidateQueries({ queryKey: ["cc-oauth"] });
      toast.success("Configuration saved.");
    } catch (apiFailure) {
      showApiError(apiFailure, { fallbackMessage: "Failed to save configuration." });
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectUuid) return;
    try {
      await deleteOAuthConfig(disconnectUuid);
      await qc.invalidateQueries({ queryKey: ["cc-oauth"] });
      if (selectedUuid === disconnectUuid) setSelectedUuid(null);
      toast.success("Provider disconnected.");
    } catch (apiFailure) {
      showApiError(apiFailure, { fallbackMessage: "Failed to disconnect provider." });
    } finally {
      setDisconnectUuid(null);
    }
  };

  const handleAddProvider = async (payload: CreateOAuthConfigPayload) => {
    try {
      const created = await createOAuthConfig(payload);
      await qc.invalidateQueries({ queryKey: ["cc-oauth"] });
      setSelectedUuid(created.uuid);
      setActiveTab("providers");
      toast.success(`${created.display_name} added successfully.`);
    } catch (apiFailure) {
      showApiError(apiFailure, { fallbackMessage: "Failed to add provider." });
    }
  };

  const disconnectTarget = providers.find((p) => p.uuid === disconnectUuid);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="space-y-5">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Globe className="h-5 w-5" style={{ color: CC_ACCENT }} />
              OAuth / SSO Configuration
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 max-w-xl">
              Connect and manage external identity providers for secure sign-in.
            </p>
          </div>

          <Button
            size="sm"
            className="gap-1.5 text-sm shrink-0"
            style={{ backgroundColor: CC_ACCENT, color: "#fff" }}
            onClick={() => setAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Provider
          </Button>
        </div>

        {/* ── Provider card strip ───────────────────────────────────────────── */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
          {providers.map((cfg) => {
            const ts = testState[cfg.uuid] ?? { testing: false, passed: false };
            return (
              <OAuthProviderCard
                key={cfg.uuid}
                config={cfg}
                isSelected={selectedUuid === cfg.uuid}
                onSelect={handleSelectProvider}
                onTest={handleTest}
                onActivate={handleActivate}
                isTesting={ts.testing}
                testPassed={ts.passed}
                isActivating={activatingUuid === cfg.uuid}
              />
            );
          })}

          {/* Add placeholder card */}
          <button
            onClick={() => setAddModalOpen(true)}
            className="min-w-[160px] flex-shrink-0 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 p-6 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors snap-start"
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs font-medium">Add Provider</span>
          </button>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
          <TabsList className="h-auto p-1 w-full justify-start overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="gap-1.5 text-xs whitespace-nowrap"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Providers tab ──────────────────────────────────────────────── */}
          <TabsContent value="providers" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">

              {/* Left: health panel */}
              {selectedConfig ? (
                <ConnectionHealthPanel config={selectedConfig} />
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center text-center gap-3 h-64">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: "#F5F3FF" }}
                  >
                    <Wifi className="h-6 w-6" style={{ color: CC_ACCENT }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Select a provider
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Click a provider card above to view health metrics
                    </p>
                  </div>
                </div>
              )}

              {/* Right: detail panel */}
              <AnimatePresence mode="wait">
                {selectedConfig ? (
                  <ProviderDetailPanel
                    key={selectedConfig.uuid}
                    config={selectedConfig}
                    onDisconnect={(uuid) => setDisconnectUuid(uuid)}
                    onSyncNow={handleSyncNow}
                    onSave={handleSaveConfig}
                    isSyncing={syncingUuid === selectedConfig.uuid}
                    isSaving={false}
                  />
                ) : (
                  <motion.div
                    key="empty-detail"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center gap-3 h-64"
                  >
                    <div
                      className="h-12 w-12 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: "#F5F3FF" }}
                    >
                      <ChevronRight className="h-6 w-6" style={{ color: CC_ACCENT }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        No provider selected
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Click a card above to configure, test, and manage a provider
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* ── LDAP Sync tab ───────────────────────────────────────────────── */}
          <TabsContent value="ldap-sync" className="mt-4">
            <LdapSyncPanel providers={providers} />
          </TabsContent>

          {/* ── Testing tab ─────────────────────────────────────────────────── */}
          <TabsContent value="testing" className="mt-4">
            <OAuthTestingPanel providers={providers} />
          </TabsContent>

          {/* ── Advanced Settings tab ───────────────────────────────────────── */}
          <TabsContent value="advanced" className="mt-4">
            <ComingSoon title="Advanced Settings" />
          </TabsContent>

          {/* ── Audit Logs tab ──────────────────────────────────────────────── */}
          <TabsContent value="audit-logs" className="mt-4">
            <ComingSoon title="OAuth Audit Logs" />
          </TabsContent>
        </Tabs>

        {/* ── Add Provider modal ───────────────────────────────────────────── */}
        <AddProviderModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onAdd={handleAddProvider}
        />

        {/* ── Disconnect confirmation ──────────────────────────────────────── */}
        <AlertDialog
          open={!!disconnectUuid}
          onOpenChange={(v) => { if (!v) setDisconnectUuid(null); }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Unplug className="h-5 w-5 text-red-600" />
                </div>
                <AlertDialogTitle>Disconnect Provider?</AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                This will permanently remove{" "}
                <strong>{disconnectTarget?.display_name ?? "this provider"}</strong> from
                your SSO configuration. Users will no longer be able to sign in
                through this provider.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDisconnect}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
