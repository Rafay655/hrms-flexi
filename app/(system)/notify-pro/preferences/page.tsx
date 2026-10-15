"use client";

import { showApiError } from "@/lib/error-toast";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BellOff,
  Calendar,
  Check,
  CheckSquare2,
  Clock,
  DollarSign,
  Globe,
  Lock,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RotateCcw,
  Save,
  Settings2,
  Shield,
  Smartphone,
  Bell,
  Users,
} from "lucide-react";

import { preferencesService } from "@/services/preferences.service";
import {
  preferencesKeys,
  usePreferences,
  useUpdatePreference,
  useUpdateQuietHours,
} from "@/hooks/usePreferences";
import type {
  ChannelKey,
  ChannelPrefs,
  NotificationPreferenceItem,
  PrefsGrouped,
} from "@/types/preferences";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ── Local UI types ─────────────────────────────────────────────────────────────

interface QuietHoursLocal {
  enabled: boolean;
  start: string;
  end: string;
  timezone: string;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
// FIX: Replaced near-black #1E1B4B (indigo-950) with #4338CA (indigo-700)
// so buttons, active tabs, and focus rings read as indigo — not black.

const INK = "#4338CA";

type Accent = { chip: string; iconOn: string; ring: string; dot: string };

const ACCENTS: Record<string, Accent> = {
  leave:     { chip: "bg-sky-50 text-sky-700",      iconOn: "bg-sky-600",      ring: "ring-sky-200",      dot: "bg-sky-500" },
  payroll:   { chip: "bg-emerald-50 text-emerald-700", iconOn: "bg-emerald-600",  ring: "ring-emerald-200",  dot: "bg-emerald-500" },
  hr:        { chip: "bg-violet-50 text-violet-700",  iconOn: "bg-violet-600",   ring: "ring-violet-200",   dot: "bg-violet-500" },
  approvals: { chip: "bg-amber-50 text-amber-700",   iconOn: "bg-amber-600",    ring: "ring-amber-200",    dot: "bg-amber-500" },
  security:  { chip: "bg-rose-50 text-rose-700",     iconOn: "bg-rose-600",     ring: "ring-rose-200",     dot: "bg-rose-500" },
  system:    { chip: "bg-slate-100 text-slate-600",  iconOn: "bg-slate-500",    ring: "ring-slate-200",    dot: "bg-slate-400" },
};
const DEFAULT_ACCENT = ACCENTS.system;

// ── Constants ─────────────────────────────────────────────────────────────────

const MODULE_TABS: Array<{
  key: string;
  label: string;
  Icon: React.ElementType;
}> = [
  { key: "leave",     label: "Leave",     Icon: Calendar },
  { key: "payroll",   label: "Payroll",   Icon: DollarSign },
  { key: "hr",        label: "HR",        Icon: Users },
  { key: "approvals", label: "Approvals", Icon: CheckSquare2 },
  { key: "security",  label: "Security",  Icon: Shield },
  { key: "system",    label: "System",    Icon: Settings2 },
];

const MODULE_ALIASES: Record<string, string> = {
  auth: "security",
};

interface ChannelConfig {
  key: ChannelKey;
  label: string;
  shortLabel: string;
  Icon: React.ElementType;
  alwaysOn?: boolean;
  optIn?: boolean;
}

const CHANNELS: ChannelConfig[] = [
  { key: "in_app_enabled",    label: "In-App",   shortLabel: "App",   Icon: Bell,         alwaysOn: true },
  { key: "email_enabled",     label: "Email",    shortLabel: "Email", Icon: Mail },
  { key: "push_enabled",      label: "Push",     shortLabel: "Push",  Icon: Smartphone },
  { key: "sms_enabled",       label: "SMS",      shortLabel: "SMS",   Icon: Phone,        optIn: true },
  { key: "whatsapp_enabled",  label: "WhatsApp", shortLabel: "WA",    Icon: MessageSquare, optIn: true },
];

// FIX: Slightly wider channel columns (48 px) so the switch + optional
// "opt-in" label never clips; status column widened to 24 px so the
// check-spinner doesn't get cut off. Gap tightened to avoid stray space
// that pushed headers and data out of register.
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_repeat(5,48px)_24px] items-center gap-2 sm:gap-3";

const COMMON_TIMEZONES = [
  "UTC",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
];

const isSecurityModule = (m: string) => m === "security";
const isSecurityKey     = (k: string) => k.startsWith("auth.") || k.startsWith("security.");

const IN_APP_REASON_ID = "np-inapp-reason";

// ── Helpers ────────────────────────────────────────────────────────────────────

const extractQuietHours = (data: any): QuietHoursLocal => {
  if (!data || typeof data !== "object") {
    return { enabled: false, start: "22:00", end: "07:00", timezone: "Asia/Karachi" };
  }

  if (data?.quiet_hours) {
    return {
      enabled:    data.quiet_hours.enabled ?? false,
      start:      data.quiet_hours.start?.substring(0, 5) ?? "22:00",
      end:        data.quiet_hours.end?.substring(0, 5) ?? "07:00",
      timezone:   data.quiet_hours.timezone ?? "Asia/Karachi",
    };
  }

  for (const items of Object.values(data)) {
    if (!Array.isArray(items)) continue;
    for (const item of items as any[]) {
      if (item?.preferences?.quiet_hours_start) {
        return {
          enabled:  true,
          start:    item.preferences.quiet_hours_start.substring(0, 5) ?? "22:00",
          end:      item.preferences.quiet_hours_end?.substring(0, 5) ?? "07:00",
          timezone: item.preferences.quiet_hours_timezone ?? "Asia/Karachi",
        };
      }
    }
  }
  return { enabled: false, start: "22:00", end: "07:00", timezone: "Asia/Karachi" };
};

const normalizeTemplates = (templates: any[]): NotificationPreferenceItem[] => {
  return templates.map((t) => {
    const name = t.template_key
      .split(/[._]/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const preferences: ChannelPrefs = {
      in_app_enabled:    t.in_app_enabled ?? true,
      email_enabled:     t.email_enabled ?? false,
      push_enabled:      t.push_enabled ?? false,
      sms_enabled:       t.sms_enabled ?? false,
      whatsapp_enabled:  t.whatsapp_enabled ?? false,
      quiet_hours_start: null,
      quiet_hours_end: null,
      quiet_hours_timezone: null,
    };

    return { template_key: t.template_key, name, preferences };
  });
};

const groupByModule = (items: NotificationPreferenceItem[]): PrefsGrouped => {
  const grouped: PrefsGrouped = {};
  for (const item of items) {
    const rawModule = item.template_key.split(".")[0] || "other";
    const module = MODULE_ALIASES[rawModule] ?? rawModule;
    if (!grouped[module]) grouped[module] = [];
    grouped[module].push(item);
  }
  return grouped;
};

const slugify = (key: string) => key.replace(/[^a-zA-Z0-9-]/g, "-");

// ══════════════════════════════════════════════════════════════════════════════
// QuietHoursCard
// ══════════════════════════════════════════════════════════════════════════════

const QuietHoursCard: React.FC<{ initialState: QuietHoursLocal }> = ({ initialState }) => {
  const [local, setLocal] = useState<QuietHoursLocal>({
    enabled:  initialState.enabled ?? false,
    start:    initialState.start ?? "22:00",
    end:      initialState.end ?? "07:00",
    timezone: initialState.timezone ?? "Asia/Karachi",
  });
  const [dirty, setDirty] = useState(false);
  const prevRef = useRef(initialState);

  useEffect(() => {
    if (prevRef.current !== initialState) {
      setLocal({
        enabled:  initialState.enabled ?? false,
        start:    initialState.start ?? "22:00",
        end:      initialState.end ?? "07:00",
        timezone: initialState.timezone ?? "Asia/Karachi",
      });
      setDirty(false);
      prevRef.current = initialState;
    }
  }, [initialState]);

  const patch = useCallback(<K extends keyof QuietHoursLocal>(key: K, val: QuietHoursLocal[K]) => {
    setLocal((p) => ({ ...p, [key]: val }));
    setDirty(true);
  }, []);

  const { mutate: saveQuietHours, isPending } = useUpdateQuietHours();
  const timeRangeInvalid = local.enabled && local.start && local.end && local.start === local.end;

  const handleSave = () => {
    const payload = local.enabled
      ? { enabled: true, quiet_hours_start: local.start, quiet_hours_end: local.end, quiet_hours_timezone: local.timezone }
      : { enabled: false, quiet_hours_start: null, quiet_hours_end: null, quiet_hours_timezone: local.timezone };

    saveQuietHours(payload, {
      onSuccess: () => {
        setDirty(false);
        toast.success(local.enabled ? "Quiet hours saved." : "Quiet hours turned off.");
      },
      onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Couldn't save quiet hours. Please try again." }),
    });
  };

  return (
    <section
      aria-labelledby="qh-heading"
      className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-start justify-between gap-4 p-6">
        <div className="flex items-center gap-3.5">
          {/* FIX: gradient uses the corrected INK so the icon block
              reads indigo instead of near-black. */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${INK}, #6366F1)` }}
          >
            <BellOff className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="qh-heading" className="text-[15px] font-semibold tracking-tight text-slate-900">
              Do Not Disturb
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Pause non‑critical notifications during specific hours.
            </p>
          </div>
        </div>
        <Switch
          id="dnd-toggle"
          checked={local.enabled}
          onCheckedChange={(v) => patch("enabled", v)}
          aria-label={local.enabled ? "Disable quiet hours" : "Enable quiet hours"}
          className="cursor-pointer"
        />
      </div>

      {local.enabled && (
        <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* FIX: all focus:border & focus:ring colours updated to INK */}
            <div className="space-y-1.5">
              <label htmlFor="qh-start" className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                Start time
              </label>
              <input
                id="qh-start"
                type="time"
                value={local.start ?? ""}
                onChange={(e) => patch("start", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="qh-end" className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                End time
              </label>
              <input
                id="qh-end"
                type="time"
                value={local.end ?? ""}
                onChange={(e) => patch("end", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="qh-tz" className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Globe className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                Timezone
              </label>
              <select
                id="qh-tz"
                value={local.timezone ?? "Asia/Karachi"}
                onChange={(e) => patch("timezone", e.target.value)}
                className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          {timeRangeInvalid && (
            <p className="text-xs text-amber-600">
              Start and end time are the same — quiet hours would cover the full day. That's fine if it's intentional.
            </p>
          )}

          <div className="flex justify-end pt-1">
            {/* FIX: button uses INK-based classes with correct hover
                (indigo-800 #3730A3 instead of the old #2d2a6e). */}
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!dirty || isPending}
              className="cursor-pointer bg-[#4338CA] text-white hover:bg-[#3730A3] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden="true" />Saving…</>
              ) : (
                <><Save className="mr-2 h-3.5 w-3.5" aria-hidden="true" />Save quiet hours</>
              )}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// LockedToggle  (FIX: completely reworked)
// ─────────────────────────────────────────────────────────────────────────────
// Old version stacked a <Lock> icon below the switch which added ~10 px of
// height and pushed the switch upward inside its grid cell — the single
// biggest source of vertical misalignment between locked / always-on /
// normal rows.
//
// New version renders *only* a disabled Switch wrapped in a Tooltip.
// The tooltip alone communicates the "locked" reason; the security row
// already prints a "Security — cannot be disabled" line below the
// notification name, and the in-app reason is available via SR-only text.
// ══════════════════════════════════════════════════════════════════════════════

const LockedToggle: React.FC<{
  checked: boolean;
  label: string;
  reasonId: string;
  tooltipText: string;
}> = ({ checked, label, reasonId, tooltipText }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Switch
        checked={checked}
        aria-label={`${label} — locked`}
        aria-describedby={reasonId}
        disabled
        className="cursor-not-allowed opacity-50"
      />
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[200px] text-center text-xs">
      {tooltipText}
    </TooltipContent>
  </Tooltip>
);

// ══════════════════════════════════════════════════════════════════════════════
// NotificationRow  (FIX: alignment & colour)
// ══════════════════════════════════════════════════════════════════════════════

interface NotificationRowProps {
  item: NotificationPreferenceItem;
  moduleKey: string;
}

const NotificationRow: React.FC<NotificationRowProps> = ({ item, moduleKey }) => {
  const [localPrefs, setLocalPrefs] = useState<ChannelPrefs>(item.preferences);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevValueRef = useRef<Partial<Record<ChannelKey, boolean>>>({});

  useEffect(() => {
    setLocalPrefs(item.preferences);
  }, [item.preferences]);

  const isSecure = isSecurityModule(moduleKey) || isSecurityKey(item.template_key);
  const { mutate: updatePref, isPending } = useUpdatePreference();
  const rowSecurityReasonId = `np-security-reason-${slugify(item.template_key)}`;

  const applyUpdate = useCallback(
    (channelKey: ChannelKey, value: boolean) => {
      updatePref(
        { templateKey: item.template_key, updates: { [channelKey]: value } },
        {
          onSuccess: () => {
            setSaved(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setSaved(false), 2000);
          },
          onError: () => {
            const prevValue = prevValueRef.current[channelKey];
            if (prevValue !== undefined) {
              setLocalPrefs((p) => ({ ...p, [channelKey]: prevValue }));
            }
            toast.error(`Couldn't update "${item.name}".`, {
              action: {
                label: "Retry",
                onClick: () => {
                  setLocalPrefs((p) => ({ ...p, [channelKey]: value }));
                  applyUpdate(channelKey, value);
                },
              },
            });
          },
        },
      );
    },
    [item.template_key, item.name, updatePref],
  );

  const handleToggle = useCallback(
    (channelKey: ChannelKey, value: boolean) => {
      if (isSecure) return;
      if (channelKey === "in_app_enabled") return;

      prevValueRef.current[channelKey] = localPrefs[channelKey];
      setLocalPrefs((p) => ({ ...p, [channelKey]: value }));
      applyUpdate(channelKey, value);
    },
    [isSecure, localPrefs, applyUpdate],
  );

  return (
    <li
      className={cn(
        ROW_GRID,
        "px-4 py-3 transition-colors duration-150",
        saved ? "bg-emerald-50/60" : "hover:bg-slate-50",
      )}
      aria-label={item.name}
    >
      {/* ── Column 1: notification name ── */}
      <div className="min-w-0">
        <p className={cn("truncate text-sm text-slate-800", isSecure ? "font-normal" : "font-medium")}>
          {item.name}
        </p>
        {isSecure && (
          <p id={rowSecurityReasonId} className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
            <Lock className="h-2.5 w-2.5" aria-hidden="true" />
            Security — cannot be disabled
          </p>
        )}
      </div>

      {/* ── Columns 2-6: channel toggles ──
          FIX: every cell now uses the same wrapper
          `flex items-center justify-center relative` so the Switch is
          always vertically & horizontally centred regardless of whether
          it is locked, always-on, or editable. The old code wrapped
          always-on in an extra `flex justify-center` div and stacked a
          Lock icon below the switch in LockedToggle — both shifted the
          switch off the centre line.

          The "opt-in" micro-label is absolutely positioned at the
          bottom of the cell so it never pushes the switch up. */}
      {CHANNELS.map((ch) => {
        const isOn = localPrefs[ch.key];
        const isLocked = isSecure || !!ch.alwaysOn;

        if (isLocked) {
          const tooltipText = isSecure
            ? "Security notifications cannot be disabled for your protection."
            : "In-app notifications cannot be disabled — they power your notification bell.";

          return (
            <div key={ch.key} className="flex items-center justify-center">
              <LockedToggle
                checked={ch.alwaysOn ? true : isOn}
                label={ch.label}
                reasonId={isSecure ? rowSecurityReasonId : IN_APP_REASON_ID}
                tooltipText={tooltipText}
              />
            </div>
          );
        }

        return (
          <div key={ch.key} className="flex items-center justify-center relative">
            <Switch
              checked={isOn}
              onCheckedChange={(v) => handleToggle(ch.key, v)}
              disabled={isPending}
              aria-label={`${ch.label} for ${item.name}`}
              className="cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4338CA] focus-visible:ring-offset-1 disabled:cursor-wait"
            />
            {/* {ch.optIn && !isOn && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-medium text-slate-400">
                opt-in
              </span>
            )} */}
          </div>
        );
      })}

      {/* ── Column 7: status indicator ── */}
      <div aria-live="polite" aria-atomic="true" className="flex items-center justify-center">
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-300" aria-label="Saving" />
        ) : saved ? (
          <Check className="h-4 w-4 animate-in fade-in zoom-in-75 text-emerald-500" aria-label="Saved" />
        ) : null}
      </div>
    </li>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ColumnHeaders  (FIX: matching cell dimensions)
// ══════════════════════════════════════════════════════════════════════════════

const ColumnHeaders: React.FC = () => (
  <div className={cn(ROW_GRID, "border-b border-slate-100 bg-slate-50/60 px-4 py-2.5")}>
    <div />
    {CHANNELS.map((ch) => (
      /* FIX: `flex items-center justify-center` mirrors the data-row
         cell wrapper so the icon+label block is centred in the same
         48 px column the switch sits in. */
      <div key={ch.key} className="flex flex-col items-center justify-center gap-0.5" aria-hidden="true">
        <ch.Icon className="h-3.5 w-3.5 text-slate-400" />
        <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-wider text-slate-400">
          {ch.shortLabel}
        </span>
      </div>
    ))}
    <div />
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// ModulePanel
// ══════════════════════════════════════════════════════════════════════════════

interface ModulePanelProps {
  moduleKey: string;
  items: NotificationPreferenceItem[];
}

const ModulePanel: React.FC<ModulePanelProps> = ({ moduleKey, items }) => {
  const isSecure = isSecurityModule(moduleKey);
  const accent = ACCENTS[moduleKey] ?? DEFAULT_ACCENT;
  const bannerId = "np-security-banner";

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center ring-1 ring-slate-900/[0.06]">
        <Bell className="h-9 w-9 text-slate-200" aria-hidden="true" />
        <p className="mt-3 text-sm text-slate-400">No notification types configured for this module yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {isSecure && (
        <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-3">
          <Shield className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <p id={bannerId} className="text-xs text-amber-700">
            Security notifications are mandatory and cannot be disabled.
          </p>
        </div>
      )}
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <ColumnHeaders />
          {/* FIX: tighter dividers — divide-slate-100 reads lighter so rows
              feel less heavy and the toggle grid reads cleaner. */}
          <ul role="list" className="divide-y divide-slate-100">
            {items.map((item) => (
              <NotificationRow key={item.template_key} item={item} moduleKey={moduleKey} />
            ))}
          </ul>
        </div>
      </div>
      <div className={cn("h-1 w-full", accent.dot)} aria-hidden="true" />
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Loading skeleton
// ══════════════════════════════════════════════════════════════════════════════

const PreferencesSkeleton: React.FC = () => (
  <div className="space-y-6">
    <Skeleton className="h-24 w-full rounded-2xl" />
    <div className="space-y-3">
      <Skeleton className="h-9 w-80 rounded-full" />
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-900/[0.06]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-4 flex-1 rounded" />
            <div className="flex gap-5">
              {CHANNELS.map((ch) => (
                <Skeleton key={ch.key} className="h-[1.15rem] w-8 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// Page
// ══════════════════════════════════════════════════════════════════════════════

export default function NotificationPreferencesPage() {
  const qc = useQueryClient();
  const [resetOpen, setResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { data: apiResponse, isLoading, isError } = usePreferences();
  const responseData = (apiResponse as any)?.data ?? apiResponse;

  const grouped = useMemo<PrefsGrouped>(() => {
    if (!responseData || !responseData.templates) return {};
    const normalized = normalizeTemplates(responseData.templates);
    return groupByModule(normalized);
  }, [responseData]);

  const quietHoursInitial = useMemo<QuietHoursLocal>(() => extractQuietHours(responseData), [responseData]);

  const activeTabs = useMemo(
    () => MODULE_TABS.filter((tab) => (grouped[tab.key]?.length ?? 0) > 0),
    [grouped],
  );

  const allTemplateKeys = useMemo(
    () => Object.values(grouped).flat().map((item) => item.template_key),
    [grouped],
  );

  const handleResetAll = useCallback(async () => {
    setIsResetting(true);
    try {
      const results = await Promise.allSettled(
        allTemplateKeys.map((key) => preferencesService.resetPreference(key)),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed === 0) {
        toast.success("All preferences reset to company defaults.");
      } else {
        toast.warning(`Reset complete with ${failed} error(s). Please retry.`);
      }
      await qc.invalidateQueries({ queryKey: preferencesKeys.list() });
    } catch (apiFailure) {
      showApiError(apiFailure, { fallbackMessage: "Reset failed. Please try again." });
    } finally {
      setIsResetting(false);
      setResetOpen(false);
    }
  }, [allTemplateKeys, qc]);

  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <BellOff className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-700">Failed to load your notification preferences.</p>
        {/* FIX: link colour updated from old #1E1B4B to indigo-700 */}
        <button
          type="button"
          onClick={() => qc.invalidateQueries({ queryKey: preferencesKeys.list() })}
          className="mt-3 cursor-pointer text-sm font-medium text-[#4338CA] underline-offset-4 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <span id={IN_APP_REASON_ID} className="sr-only">
        In-app notifications cannot be disabled — they power your notification bell.
      </span>

      <div className="mx-auto max-w-4xl space-y-6 pb-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Settings</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Notification Preferences</h1>
          <p className="mt-1.5 text-sm text-slate-500">Choose how and when you receive notifications.</p>
        </div>

        {isLoading ? (
          <PreferencesSkeleton />
        ) : (
          <>
            <QuietHoursCard initialState={quietHoursInitial} />

            {activeTabs.length === 0 ? (
              <div className="rounded-2xl bg-white py-20 text-center ring-1 ring-slate-900/[0.06]">
                <Bell className="mx-auto h-9 w-9 text-slate-200" aria-hidden="true" />
                <p className="mt-3 text-sm text-slate-400">No notification templates are configured.</p>
              </div>
            ) : (
              <Tabs defaultValue={activeTabs[0]?.key ?? ""}>
                {/* FIX: TabsList uses flex-wrap + gap so pills never
                    clip or overlap on narrow viewports. */}
                <TabsList className="mb-4 h-auto flex-wrap gap-1.5 rounded-full bg-transparent p-0">
                  {activeTabs.map((tab) => {
                    const accent = ACCENTS[tab.key] ?? DEFAULT_ACCENT;
                    return (
                      <TabsTrigger
                        key={tab.key}
                        value={tab.key}
                        className={cn(
                          // FIX: added `group` so children can style on
                          //     data-[state=active] via group-data variant.
                          // FIX: active bg changed from #1E1B4B → #4338CA.
                          "group flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-none transition-all",
                          "data-[state=active]:border-transparent data-[state=active]:bg-[#4338CA] data-[state=active]:text-white",
                        )}
                      >
                        {/* FIX: when the tab is active the icon circle
                            fades to white/20 so it doesn't clash with the
                            indigo active background. When inactive the
                            per-module accent colour still shows. */}
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-full text-white transition-colors",
                            accent.iconOn,
                            "group-data-[state=active]:bg-white/20",
                          )}
                        >
                          <tab.Icon className="h-2.5 w-2.5" aria-hidden="true" />
                        </span>
                        {tab.label}
                        {isSecurityModule(tab.key) && <Lock className="h-2.5 w-2.5 opacity-50" aria-hidden="true" />}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {activeTabs.map((tab) => (
                  <TabsContent key={tab.key} value={tab.key}>
                    <ModulePanel moduleKey={tab.key} items={grouped[tab.key] ?? []} />
                  </TabsContent>
                ))}
              </Tabs>
            )}

            {allTemplateKeys.length > 0 && (
              <div className="flex items-center justify-end pt-1">
                <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-red-500"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      Reset all preferences to company defaults
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset all notification preferences?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete all your custom channel preferences for{" "}
                        <strong>{allTemplateKeys.length}</strong> notification
                        type{allTemplateKeys.length !== 1 ? "s" : ""}, restoring
                        your account to the company defaults. This action cannot
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          handleResetAll();
                        }}
                        disabled={isResetting}
                        className="bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        {isResetting ? (
                          <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Resetting…</>
                        ) : (
                          "Reset all preferences"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}