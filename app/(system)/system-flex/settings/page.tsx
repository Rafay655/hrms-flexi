"use client";

/**
 * app/(system)/system-flex/settings/page.tsx
 * SystemFlex — Company Settings
 *
 * Six-tab panel: Leave · Payroll · Attendance · Notifications · Loan · General
 *
 * URL param:  ?group=<tab-id>  pre-selects the matching tab (e.g. from LeaveEase
 *             deep-link: /system-flex/settings?group=leave).
 *
 * Data flow:
 *   GET    /system-flex/settings/company          → Setting[]
 *   PUT    /system-flex/settings/company/:key     → { value }
 *   DELETE /system-flex/settings/company/:key     → restore default
 *
 * UX contract:
 *   • Dirty state tracked per key. "Save Changes" enabled only when ≥1 key in
 *     the active tab has been changed.
 *   • Optimistic updates applied immediately on save; rolled back on API error.
 *   • Sensitive settings (is_sensitive=true) render "••••••••" + Reveal toggle.
 *   • Amber dot appears on tab trigger when that tab has unsaved changes.
 *   • Reset fires an AlertDialog before calling DELETE.
 */

import { showApiError } from "@/lib/error-toast";
import React, {
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  Loader2,
  RotateCcw,
  Save,
  Settings2,
} from "lucide-react";

import {
  getCompanySettingsGrouped,
  updateCompanySetting,
  resetCompanySetting,
} from "@/services/system-flex.service";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Types ─────────────────────────────────────────────────────────────────────

type ValueType = "boolean" | "integer" | "string";

interface Setting {
  key: string;
  group: string;
  label: string;
  description: string;
  value_type: ValueType;
  value: unknown;
  default_value: unknown;
  is_sensitive: boolean;
}

/**
 * Backend shape (SF-D1/D2 fix): AdminSuiteController.getCompanySettings() returns
 * CompanySettingsService.getAll() — a NESTED map, not a flat array:
 *   { group: { "group.full_key": { value, label, description, value_type, is_sensitive } } }
 * It exposes no separate `default_value`; we fall back to the current value for the
 * reset-preview only (the DELETE + refetch is authoritative).
 */
interface RawSetting {
  value: unknown;
  label: string;
  description: string | null;
  value_type: ValueType;
  is_sensitive: boolean;
}

interface GroupedSettingsResponse {
  data: Record<string, Record<string, RawSetting>>;
}

/** Flatten the grouped backend response into the flat Setting[] the page consumes. */
function flattenSettings(
  grouped: Record<string, Record<string, RawSetting>>,
): Setting[] {
  const flat: Setting[] = [];
  for (const [group, items] of Object.entries(grouped ?? {})) {
    for (const [key, item] of Object.entries(items ?? {})) {
      flat.push({
        key,
        group,
        label: item.label,
        description: item.description ?? "",
        value_type: item.value_type,
        value: item.value,
        default_value: item.value, // backend exposes no separate default
        is_sensitive: item.is_sensitive,
      });
    }
  }
  return flat;
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: "leave",         label: "Leave",         icon: Calendar   },
  { id: "payroll",       label: "Payroll",        icon: CreditCard },
  { id: "attendance",    label: "Attendance",     icon: Clock      },
  { id: "notifications", label: "Notifications",  icon: Bell       },
  { id: "loan",          label: "Loan",           icon: Landmark   },
  { id: "general",       label: "General",        icon: Settings2  },
] as const;

type TabId = (typeof TABS)[number]["id"];

const VALID_TAB_IDS = new Set<string>(TABS.map((t) => t.id));

// Number of skeleton rows shown per tab while loading
const SKELETON_COUNTS: Record<TabId, number> = {
  leave: 5,
  payroll: 5,
  attendance: 5,
  notifications: 5,
  loan: 5,
  general: 5,
};

// ── UX copy ───────────────────────────────────────────────────────────────────
// Client-side label + description overrides for every known setting key.
// The API-provided label/description is used as fallback for any key not listed here.

const SETTING_META: Record<string, { label: string; description: string }> = {
  // ── Leave ──────────────────────────────────────────────────────────────────
  "leave.annual_days_default": {
    label: "Default Annual Leave Days",
    description:
      "Paid leave days each employee receives at the start of the year. This applies to new accrual cycles only — existing balances are not retroactively adjusted.",
  },
  "leave.max_carry_forward": {
    label: "Maximum Carry-Forward Days",
    description:
      "How many unused leave days employees may roll over into the next calendar year. Set to 0 to enforce a strict use-it-or-lose-it policy.",
  },
  "leave.require_approval": {
    label: "Require Manager Approval",
    description:
      "When on, every leave request must be approved before it is confirmed. Turning this off auto-approves all requests — suitable only for small, high-trust teams.",
  },
  "leave.allow_half_day": {
    label: "Allow Half-Day Requests",
    description:
      "Lets employees request morning-only or afternoon-only leave, deducting 0.5 days from their balance. Disable if your payroll system does not support fractional leave.",
  },
  "leave.blackout_notice_days": {
    label: "Blackout Period Advance Notice (Days)",
    description:
      "Minimum days of notice required to request leave during high-demand periods such as month-end close. Per-team overrides can be configured inside LeaveEase policies.",
  },
  // ── Payroll ────────────────────────────────────────────────────────────────
  "payroll.run_day": {
    label: "Monthly Payroll Run Day",
    description:
      "Calendar day (1–28) on which the payroll batch is automatically initiated each month. Choose a day that gives finance enough time to review before the bank transfer deadline.",
  },
  "payroll.auto_tax_deduction": {
    label: "Automatic Income Tax Deduction",
    description:
      "Calculates and deducts income tax from every salary slip based on the applicable slab. Disable only if your company handles tax externally or uses a third-party payroll bureau.",
  },
  "payroll.overtime_rate_multiplier": {
    label: "Overtime Rate Multiplier",
    description:
      "Multiplies the employee's base hourly rate by this factor for overtime hours. The legal minimum in most jurisdictions is 1.5 — confirm with your legal team before lowering this.",
  },
  "payroll.bank_api_key": {
    label: "Bank Transfer API Key",
    description:
      "Credential used to initiate direct bank transfers for salary disbursement. Treat it like a password — rotate every 90 days and share only with authorised finance staff.",
  },
  "payroll.salary_slip_auto_email": {
    label: "Email Salary Slips Automatically",
    description:
      "Sends each employee a PDF salary slip to their registered work email on payroll run completion. Disable if your company distributes slips through a separate channel.",
  },
  // ── Attendance ─────────────────────────────────────────────────────────────
  "attendance.grace_period_minutes": {
    label: "Clock-In Grace Period (Minutes)",
    description:
      "Minutes after the scheduled shift start before a clock-in is flagged as late. A short grace period (5–10 min) reduces noise in attendance reports without penalising minor delays.",
  },
  "attendance.require_biometric": {
    label: "Require Biometric Check-In",
    description:
      "Enforces fingerprint or face-ID check-in at the registered kiosk. Without this, employees can clock in from the mobile app anywhere. Enable for roles that must be physically on-site.",
  },
  "attendance.auto_mark_absent": {
    label: "Auto-Mark Absent After (Hours)",
    description:
      "If an employee has not clocked in within this many hours of their shift start, the system automatically records an absence. Set high (e.g., 4 h) to avoid false absences for flexible roles.",
  },
  "attendance.working_hours_per_day": {
    label: "Standard Working Hours Per Day",
    description:
      "Official full-time working day length used for overtime calculation, leave deductions, and payroll reports. Changing this does not automatically update existing employment contracts.",
  },
  "attendance.overtime_threshold_minutes": {
    label: "Overtime Starts After (Minutes Beyond Shift)",
    description:
      "How many minutes past the standard shift end an employee must work before overtime pay kicks in. A small buffer (15–30 min) avoids overtime charges from minor overruns.",
  },
  // ── Notifications ──────────────────────────────────────────────────────────
  "notifications.email_enabled": {
    label: "Send Email Notifications",
    description:
      "Enables all system-generated emails — leave approvals, payroll slips, and security alerts. Turning this off silences all email output company-wide; use only during maintenance windows.",
  },
  "notifications.sms_enabled": {
    label: "Send SMS Notifications",
    description:
      "Enables SMS alerts for critical events such as account locks or large payroll runs. Requires a valid SMS Gateway API Key. Each SMS incurs a cost — enable only for roles that need real-time alerts.",
  },
  "notifications.sms_api_key": {
    label: "SMS Gateway API Key",
    description:
      "Credential for your SMS provider (e.g., Twilio, Nexmo). Required when SMS notifications are enabled. Rotate this key immediately if you suspect unauthorised usage.",
  },
  "notifications.digest_frequency": {
    label: "Manager Digest Frequency",
    description:
      "How often managers receive a summary of pending approvals and team activity. \"daily\" sends at 08:00 PKT; \"weekly\" sends every Monday at 08:00 PKT.",
  },
  "notifications.admin_alert_email": {
    label: "Admin Alert Email Address",
    description:
      "Address that receives critical system alerts — queue failures, backup errors, and security events. Use a shared inbox rather than a personal address to avoid a single point of failure.",
  },
  // ── Loan ───────────────────────────────────────────────────────────────────
  "loan.max_loan_amount": {
    label: "Maximum Employee Loan Amount (PKR)",
    description:
      "Upper ceiling for any single loan issued to an employee. Finance approval is still required for amounts approaching this limit when dual-approval is enabled. Review annually against inflation.",
  },
  "loan.max_installments": {
    label: "Maximum Repayment Installments (Months)",
    description:
      "Longest repayment schedule allowed, counted in monthly installments. Longer terms reduce employee burden but increase the company's outstanding credit exposure at any given time.",
  },
  "loan.interest_rate": {
    label: "Annual Interest Rate (%)",
    description:
      "Interest charged on employee loans per annum. Many companies set this to 0% as a benefit. Non-zero rates may have tax implications — consult your tax advisor before changing this.",
  },
  "loan.require_hr_approval": {
    label: "Require HR Approval",
    description:
      "Adds HR as a mandatory approver on all loan requests. This lets HR verify employment standing and eligibility before the request reaches finance.",
  },
  "loan.require_finance_approval": {
    label: "Require Finance Approval",
    description:
      "Adds Finance as a mandatory approver. For larger organisations, dual approval (HR + Finance) is recommended to prevent unauthorised disbursements.",
  },
  // ── General ────────────────────────────────────────────────────────────────
  "general.company_timezone": {
    label: "Company Timezone",
    description:
      "Default timezone for scheduled jobs, cron tasks, and timestamp display across the system. Should match your primary office location. Employees in other regions use this as the reference for shared deadlines.",
  },
  "general.date_format": {
    label: "Date Display Format",
    description:
      "How dates appear across the system (e.g., DD/MM/YYYY for Pakistan, MM/DD/YYYY for the US). This is display-only — the database always stores ISO 8601 internally.",
  },
  "general.fiscal_year_start_month": {
    label: "Fiscal Year Start Month",
    description:
      "Month number (1–12) when your financial year begins. Drives leave accrual resets, payroll summaries, and annual reports. Change this only at the start of a new fiscal cycle.",
  },
  "general.session_timeout_minutes": {
    label: "Idle Session Timeout (Minutes)",
    description:
      "Minutes of inactivity before a logged-in user is automatically signed out. Shorter values (15–30 min) improve security; longer values (120+ min) are friendlier for field staff on shared devices.",
  },
  "general.maintenance_mode": {
    label: "Maintenance Mode",
    description:
      "Blocks all non-admin logins and shows a maintenance banner to other users. Use during database migrations or major deployments — and remember to turn this off when done.",
  },
};

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
        <Skeleton className="h-4 w-10" />
      </div>
    </div>
  );
}

// ── SettingRow ────────────────────────────────────────────────────────────────

interface SettingRowProps {
  setting: Setting;
  effectiveValue: unknown;
  isDirty: boolean;
  isRevealed: boolean;
  onRevealToggle: () => void;
  onChange: (value: unknown) => void;
  onResetClick: () => void;
}

function SettingRow({
  setting,
  effectiveValue,
  isDirty,
  isRevealed,
  onRevealToggle,
  onChange,
  onResetClick,
}: SettingRowProps) {
  const meta = SETTING_META[setting.key];
  const label = meta?.label ?? setting.label ?? setting.key;
  const description = meta?.description ?? setting.description ?? "";
  const inputId = `setting-${setting.key.replace(/\./g, "-")}`;

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-6 py-5 border-b border-border last:border-0 transition-colors duration-150",
        isDirty && "-mx-6 px-6 bg-amber-50/60 dark:bg-amber-950/20"
      )}
    >
      {/* Left column: label + description */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Label
            htmlFor={inputId}
            className="text-sm font-semibold text-foreground cursor-pointer leading-none"
          >
            {label}
          </Label>
          {isDirty && (
            <Badge
              variant="outline"
              className="py-0 px-1.5 text-[10px] font-medium text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-700"
            >
              Unsaved
            </Badge>
          )}
          {setting.is_sensitive && (
            <Badge
              variant="outline"
              className="py-0 px-1.5 text-[10px] font-medium text-slate-500 border-slate-200 dark:border-slate-700"
            >
              Sensitive
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-prose">
          {description}
        </p>
      </div>

      {/* Right column: input control + reset */}
      <div className="flex items-center gap-3 shrink-0 pt-0.5">
        {/* Boolean → Switch */}
        {setting.value_type === "boolean" ? (
          <Switch
            id={inputId}
            checked={Boolean(effectiveValue)}
            onCheckedChange={(checked) => onChange(checked)}
            aria-label={label}
          />
        ) : setting.is_sensitive && !isRevealed ? (
          /* Sensitive + hidden */
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-40 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground tracking-[0.3em] select-none"
              aria-label={`${label} — value hidden`}
              id={inputId}
            >
              ••••••••
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRevealToggle}
              className="h-9 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
              aria-label={`Reveal ${label}`}
            >
              <Eye className="h-3.5 w-3.5" />
              Reveal
            </Button>
          </div>
        ) : (
          /* String / integer (or sensitive + revealed) */
          <div className="flex items-center gap-2">
            <Input
              id={inputId}
              type={setting.value_type === "integer" ? "number" : "text"}
              value={String(effectiveValue ?? "")}
              onChange={(e) =>
                onChange(
                  setting.value_type === "integer"
                    ? Number(e.target.value)
                    : e.target.value
                )
              }
              className="h-9 w-44 text-sm"
              aria-label={label}
              {...(setting.value_type === "integer"
                ? { min: 0, step: 1 }
                : {})}
            />
            {setting.is_sensitive && isRevealed && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRevealToggle}
                className="h-9 px-2 text-muted-foreground hover:text-foreground"
                aria-label={`Hide ${label}`}
              >
                <EyeOff className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        {/* Reset to default */}
        <button
          type="button"
          onClick={onResetClick}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors whitespace-nowrap"
          aria-label={`Reset "${label}" to its default value`}
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>
    </div>
  );
}

// ── SettingsContent (inner — uses useSearchParams) ────────────────────────────

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Resolve initial tab from URL param; fall back to "leave"
  const rawGroup = searchParams.get("group") ?? "leave";
  const [activeTab, setActiveTab] = useState<TabId>(
    VALID_TAB_IDS.has(rawGroup) ? (rawGroup as TabId) : "leave"
  );

  // Per-key dirty values: key → new value (presence means changed)
  const [dirtyValues, setDirtyValues] = useState<Record<string, unknown>>({});

  // Per-key reveal state for sensitive settings
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  // Setting targeted for reset (drives the AlertDialog)
  const [resetTarget, setResetTarget] = useState<Setting | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery<Setting[]>({
    queryKey: ["system-flex", "settings", "company"],
    queryFn: () =>
      getCompanySettingsGrouped().then((g) =>
        flattenSettings(g as Record<string, Record<string, RawSetting>>)
      ),
    staleTime: 60_000,
  });

  // Group settings by their "group" field
  const grouped = useMemo<Partial<Record<TabId, Setting[]>>>(() => {
    if (!data) return {};
    return data.reduce<Partial<Record<TabId, Setting[]>>>((acc, s) => {
      const g = s.group as TabId;
      if (!acc[g]) acc[g] = [];
      acc[g]!.push(s);
      return acc;
    }, {});
  }, [data]);

  const tabSettings = grouped[activeTab] ?? [];

  // Keys in the active tab that have been changed
  const dirtyTabKeys = tabSettings
    .filter((s) => s.key in dirtyValues)
    .map((s) => s.key);
  const tabIsDirty = dirtyTabKeys.length > 0;

  // ── Save mutation ──────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () =>
      Promise.all(
        dirtyTabKeys.map((key) =>
          updateCompanySetting(key, dirtyValues[key])
        )
      ),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["system-flex", "settings", "company"],
      });
      const previous = queryClient.getQueryData<Setting[]>([
        "system-flex",
        "settings",
        "company",
      ]);
      if (previous) {
        queryClient.setQueryData<Setting[]>(
          ["system-flex", "settings", "company"],
          previous.map((s) =>
            s.key in dirtyValues ? { ...s, value: dirtyValues[s.key] } : s
          )
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["system-flex", "settings", "company"],
          context.previous
        );
      }
      showApiError(_err, { ...({
        description:
          "Your changes could not be saved. The values have been reverted to what was last confirmed.",
      }), fallbackMessage: "Save failed" });
    },
    onSuccess: () => {
      // Clear only this tab's dirty keys
      setDirtyValues((prev) => {
        const next = { ...prev };
        dirtyTabKeys.forEach((k) => delete next[k]);
        return next;
      });
      queryClient.invalidateQueries({
        queryKey: ["system-flex", "settings", "company"],
      });
      const tabLabel = TABS.find((t) => t.id === activeTab)?.label ?? "Settings";
      toast.success(`${tabLabel} settings saved`);
    },
  });

  // ── Reset mutation ─────────────────────────────────────────────────────────
  const resetMutation = useMutation({
    mutationFn: (key: string) => resetCompanySetting(key),
    onMutate: async (key) => {
      await queryClient.cancelQueries({
        queryKey: ["system-flex", "settings", "company"],
      });
      const previous = queryClient.getQueryData<Setting[]>([
        "system-flex",
        "settings",
        "company",
      ]);
      if (previous) {
        queryClient.setQueryData<Setting[]>(
          ["system-flex", "settings", "company"],
          previous.map((s) =>
            s.key === key ? { ...s, value: s.default_value } : s
          )
        );
      }
      // Remove from dirty state (the reset value is now authoritative)
      setDirtyValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["system-flex", "settings", "company"],
          context.previous
        );
      }
      showApiError(_err, { ...({
        description: "Could not restore the default value. Please try again.",
      }), fallbackMessage: "Reset failed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["system-flex", "settings", "company"],
      });
      toast.success("Setting reset to default");
      setResetTarget(null);
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getEffectiveValue = (s: Setting): unknown =>
    s.key in dirtyValues ? dirtyValues[s.key] : s.value;

  const handleChange = (
    key: string,
    newValue: unknown,
    originalValue: unknown
  ) => {
    // If the user reverted to the original, remove from dirty tracking
    if (newValue === originalValue) {
      setDirtyValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setDirtyValues((prev) => ({ ...prev, [key]: newValue }));
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("group", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const toggleReveal = useCallback((key: string) => {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Company Settings</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Configure system-wide defaults for all modules. Changes apply across
          the entire company — individual overrides can be set inside each
          module where supported.
        </p>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Failed to load settings.{" "}
            <button
              type="button"
              className="underline hover:no-underline font-medium"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["system-flex", "settings", "company"],
                })
              }
            >
              Try again
            </button>
          </span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Tab list */}
        <TabsList className="mb-0 h-auto flex-wrap gap-1 bg-muted p-1 rounded-lg">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            // Dot if this tab has any unsaved changes
            const tabHasDirty = (grouped[tab.id] ?? []).some(
              (s) => s.key in dirtyValues
            );
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {tab.label}
                {tabHasDirty && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0"
                    aria-label={`${tab.label} has unsaved changes`}
                  />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab panels */}
        {TABS.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="mt-3 focus:outline-none"
          >
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              {/* Panel header row */}
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  <tab.icon
                    className="h-4 w-4 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {tab.label} Settings
                  </span>
                  {tab.id === activeTab && tabIsDirty && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium ml-1">
                      · {dirtyTabKeys.length}{" "}
                      {dirtyTabKeys.length === 1 ? "unsaved change" : "unsaved changes"}
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

              {/* Setting rows */}
              <div className="px-6">
                {isLoading ? (
                  // Skeleton shimmer
                  Array.from({ length: SKELETON_COUNTS[tab.id] }).map(
                    (_, i) => <SkeletonRow key={i} />
                  )
                ) : (grouped[tab.id] ?? []).length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No settings are configured for this group yet.
                  </p>
                ) : (
                  (grouped[tab.id] ?? []).map((setting) => (
                    <SettingRow
                      key={setting.key}
                      setting={setting}
                      effectiveValue={getEffectiveValue(setting)}
                      isDirty={setting.key in dirtyValues}
                      isRevealed={!!revealed[setting.key]}
                      onRevealToggle={() => toggleReveal(setting.key)}
                      onChange={(newValue) =>
                        handleChange(setting.key, newValue, setting.value)
                      }
                      onResetClick={() => setResetTarget(setting)}
                    />
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* ── Reset-to-default confirm dialog ─────────────────────────────────── */}
      <AlertDialog
        open={resetTarget !== null}
        onOpenChange={(open) => {
          if (!open && !resetMutation.isPending) setResetTarget(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <RotateCcw />
            </AlertDialogMedia>
            <AlertDialogTitle>Reset to default?</AlertDialogTitle>
            <AlertDialogDescription>
              {resetTarget && (
                <>
                  <span className="font-medium text-foreground">
                    {SETTING_META[resetTarget.key]?.label ?? resetTarget.label}
                  </span>{" "}
                  will be restored to its system default value:{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                    {String(resetTarget.default_value)}
                  </code>
                  . Your current value will be permanently discarded.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetMutation.isPending}>
              Keep current value
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={resetMutation.isPending}
              onClick={() => {
                if (resetTarget) resetMutation.mutate(resetTarget.key);
              }}
            >
              {resetMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Reset to default"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Page export (Suspense boundary for useSearchParams) ───────────────────────

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
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
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
