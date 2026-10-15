"use client";

/**
 * app/(system)/connect-central/policies/password/page.tsx
 * Password Policy — configure complexity, history, expiry, lockout, and
 * rate-limiting rules for the company.
 *
 * Requires: manage-password-policy permission.
 */

import { showApiError } from "@/lib/error-toast";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  Save,
  RotateCcw,
  CheckCircle2,
  Lock,
  History,
  Timer,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  getPasswordPolicy,
  updatePasswordPolicy,
} from "@/lib/api/connect-central/policies";
import type { PasswordPolicy } from "@/lib/api/connect-central/policies";
import { toast } from "sonner";

// ── Default / mock policy ─────────────────────────────────────────────────────

const DEFAULT_POLICY: PasswordPolicy = {
  min_length: 12,
  require_uppercase: true,
  require_lowercase: true,
  require_numbers: true,
  require_symbols: false,
  history_count: 5,
  expiry_days: 90,
  min_age_days: 1,
  max_failed_attempts: 5,
  lockout_duration_minutes: 30,
  max_login_attempts_per_minute: 10,
  is_active: true,
  updated_at: "2026-05-17T08:00:00Z",
};

// ── Strength calculation ──────────────────────────────────────────────────────

function computeStrength(p: PasswordPolicy): number {
  let s = 0;
  if (p.min_length >= 8) s += 10;
  if (p.min_length >= 12) s += 15;
  if (p.min_length >= 16) s += 10;
  if (p.require_uppercase) s += 15;
  if (p.require_lowercase) s += 10;
  if (p.require_numbers) s += 15;
  if (p.require_symbols) s += 20;
  if (p.history_count >= 3) s += 5;
  return Math.min(s, 100);
}

type StrengthMeta = {
  label: string;
  color: string;
  stroke: string;
  bg: string;
  barColor: string;
};

function getStrengthMeta(score: number): StrengthMeta {
  if (score < 40)
    return {
      label: "Weak",
      color: "text-red-600",
      stroke: "#dc2626",
      bg: "bg-red-100",
      barColor: "bg-red-500",
    };
  if (score < 60)
    return {
      label: "Fair",
      color: "text-amber-600",
      stroke: "#d97706",
      bg: "bg-amber-100",
      barColor: "bg-amber-500",
    };
  if (score < 80)
    return {
      label: "Good",
      color: "text-blue-600",
      stroke: "#2563eb",
      bg: "bg-blue-100",
      barColor: "bg-blue-500",
    };
  if (score < 90)
    return {
      label: "Strong",
      color: "text-indigo-600",
      stroke: "#4f46e5",
      bg: "bg-indigo-100",
      barColor: "bg-indigo-500",
    };
  return {
    label: "Very Strong",
    color: "text-green-600",
    stroke: "#16a34a",
    bg: "bg-green-100",
    barColor: "bg-green-500",
  };
}

// ── Gauge SVG ─────────────────────────────────────────────────────────────────

function PolicyStrengthGauge({ score }: { score: number }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const { label, color, stroke } = getStrengthMeta(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="110" height="110" viewBox="0 0 110 110">
        {/* Track */}
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
        />
        {/* Center text */}
        <text
          x="55"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="18"
          fontWeight="700"
          fill="white"
        >
          {score}%
        </text>
        <text
          x="55"
          y="68"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fill="rgba(255,255,255,0.7)"
        >
          score
        </text>
      </svg>
      <span className={cn("text-sm font-semibold", color)}>{label}</span>
    </div>
  );
}

// ── KPI Chip ──────────────────────────────────────────────────────────────────

function KpiChip({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5 min-w-[130px]">
      <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div>
        <p className="text-[10px] text-white/70 leading-none mb-0.5">{label}</p>
        <p className="text-sm font-bold text-white leading-none">{value}</p>
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <Label
        htmlFor={id}
        className="text-sm font-normal cursor-pointer select-none"
      >
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ── Number field ──────────────────────────────────────────────────────────────

function NumField({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium leading-none">{label}</p>
        {hint && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>
        )}
      </div>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 text-sm text-right"
      />
    </div>
  );
}

// ── Live Preview ──────────────────────────────────────────────────────────────

function LivePreview({ form }: { form: PasswordPolicy }) {
  const bullets: string[] = [];

  bullets.push(`Passwords must be at least ${form.min_length} characters`);

  const reqs: string[] = [];
  if (form.require_uppercase) reqs.push("uppercase");
  if (form.require_lowercase) reqs.push("lowercase");
  if (form.require_numbers) reqs.push("numbers");
  if (form.require_symbols) reqs.push("symbols");
  if (reqs.length > 0)
    bullets.push(`Must include: ${reqs.join(", ")}`);
  else
    bullets.push("No character-type requirements enforced");

  if (form.history_count > 0)
    bullets.push(`Cannot reuse last ${form.history_count} passwords`);

  if (form.min_age_days > 0)
    bullets.push(
      `Password cannot be changed for ${form.min_age_days} day${form.min_age_days !== 1 ? "s" : ""} after reset`
    );

  if (form.expiry_days > 0)
    bullets.push(`Expires every ${form.expiry_days} days`);
  else
    bullets.push("Password never expires");

  bullets.push(
    `Account locked after ${form.max_failed_attempts} failed attempt${form.max_failed_attempts !== 1 ? "s" : ""} for ${form.lockout_duration_minutes} min`
  );

  bullets.push(
    `Max ${form.max_login_attempts_per_minute} login attempt${form.max_login_attempts_per_minute !== 1 ? "s" : ""} per minute`
  );

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-3">
        Live Policy Preview
      </p>
      <p className="text-[11px] text-muted-foreground -mt-2 mb-2">
        Updates as you edit
      </p>
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {bullets.map((b) => (
            <motion.li
              key={b}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="flex items-start gap-2 text-[12px] text-slate-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-indigo-500" />
              {b}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

// ── Strength Preview ──────────────────────────────────────────────────────────

function StrengthPreview({ form }: { form: PasswordPolicy }) {
  const score = computeStrength(form);
  const { label, color, barColor } = getStrengthMeta(score);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Password Strength Preview
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Based on active policy requirements
        </p>
      </div>

      {/* Masked input display */}
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-base tracking-[0.3em] text-muted-foreground select-none">
          ••••••••••••
        </span>
      </div>

      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Score: {score} / 100
          </span>
          <span className={cn("text-xs font-semibold", color)}>{label}</span>
        </div>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
        <Zap className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-[11px] text-amber-800">
          Longer passphrases are easier to remember and harder to crack than
          short complex passwords.
        </p>
      </div>
    </div>
  );
}

// ── Page skeleton ─────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PasswordPolicyPage() {
  const queryClient = useQueryClient();

  const { data: apiPolicy, isLoading } = useQuery({
    queryKey: ["connect-central", "password-policy"],
    queryFn: getPasswordPolicy,
    retry: 1,
  });

  const [form, setForm] = useState<PasswordPolicy>(DEFAULT_POLICY);
  const [original, setOriginal] = useState<PasswordPolicy>(DEFAULT_POLICY);
  const [initialized, setInitialized] = useState(false);

  // Sync API data into local form once (replaces useEffect+setState pattern)
  if (apiPolicy && !initialized) {
    setForm(apiPolicy);
    setOriginal(apiPolicy);
    setInitialized(true);
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(original);

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => {
      // Strip server-managed fields before sending
      const payload = {
        min_length: form.min_length,
        require_uppercase: form.require_uppercase,
        require_lowercase: form.require_lowercase,
        require_numbers: form.require_numbers,
        require_symbols: form.require_symbols,
        history_count: form.history_count,
        expiry_days: form.expiry_days,
        min_age_days: form.min_age_days,
        max_failed_attempts: form.max_failed_attempts,
        lockout_duration_minutes: form.lockout_duration_minutes,
        max_login_attempts_per_minute: form.max_login_attempts_per_minute,
        is_active: form.is_active,
      };
      return updatePasswordPolicy(payload);
    },
    onSuccess: (saved) => {
      setOriginal(saved);
      setForm(saved);
      queryClient.invalidateQueries({
        queryKey: ["connect-central", "password-policy"],
      });
      toast.success("Password policy saved successfully.");
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: "Failed to save password policy. Please try again." });
    },
  });

  const handleReset = () => {
    setForm(original);
  };

  const set = <K extends keyof PasswordPolicy>(key: K, value: PasswordPolicy[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const score = computeStrength(form);
  const { label: strengthLabel } = getStrengthMeta(score);

  if (isLoading) return <PageSkeleton />;

  const lastUpdated = form.updated_at
    ? new Date(form.updated_at).toLocaleString()
    : null;

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-900 flex items-center gap-2">
            <KeyRound
              className="h-5 w-5"
              style={{ color: "var(--cc-accent)" }}
            />
            Password Policy
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Company-wide password complexity, history, expiry, and lockout rules
          </p>
        </div>
        {form.is_active ? (
          <Badge className="self-start text-[10px] bg-green-100 text-green-700 border-0 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        ) : (
          <Badge className="self-start text-[10px] bg-gray-100 text-gray-500 border-0">
            Inactive
          </Badge>
        )}
      </div>

      {/* ── Hero Banner ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Gauge */}
          <PolicyStrengthGauge score={score} />

          <div className="hidden sm:block w-px self-stretch bg-white/20" />

          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            <KpiChip
              label="Min Length"
              value={String(form.min_length)}
              icon={KeyRound}
            />
            <KpiChip
              label="Reuse Blocked"
              value={`${form.history_count} prev passwords`}
              icon={History}
            />
            <KpiChip
              label="Expiry"
              value={form.expiry_days > 0 ? `${form.expiry_days} days` : "Never"}
              icon={Timer}
            />
            <KpiChip
              label="Lockout"
              value={`${form.max_failed_attempts} attempts`}
              icon={Lock}
            />
          </div>

          {/* Strength label (mobile) */}
          <div className="flex items-center gap-1 sm:hidden text-white/90 text-sm font-semibold">
            <Zap className="h-4 w-4" />
            {strengthLabel} ({score}/100)
          </div>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* ── LEFT: Policy Form ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-6">
          {/* Password Complexity */}
          <Section title="Password Complexity">
            <ToggleRow
              id="require_uppercase"
              label="Require uppercase letters (A–Z)"
              checked={form.require_uppercase}
              onCheckedChange={(v) => set("require_uppercase", v)}
            />
            <ToggleRow
              id="require_lowercase"
              label="Require lowercase letters (a–z)"
              checked={form.require_lowercase}
              onCheckedChange={(v) => set("require_lowercase", v)}
            />
            <ToggleRow
              id="require_numbers"
              label="Require numbers (0–9)"
              checked={form.require_numbers}
              onCheckedChange={(v) => set("require_numbers", v)}
            />
            <ToggleRow
              id="require_symbols"
              label="Require symbols (!@#$…)"
              checked={form.require_symbols}
              onCheckedChange={(v) => set("require_symbols", v)}
            />
            <Separator />
            <NumField
              label="Minimum length"
              hint="Characters required (8–32)"
              value={form.min_length}
              min={8}
              max={32}
              onChange={(v) => set("min_length", v)}
            />
          </Section>

          <Separator />

          {/* Password History */}
          <Section title="Password History">
            <NumField
              label="Prevent reuse of last N passwords"
              hint="Set to 0 to disable"
              value={form.history_count}
              min={1}
              max={24}
              onChange={(v) => set("history_count", v)}
            />
            <NumField
              label="Minimum password age (days)"
              hint="Days before a user can change their password (0 = no restriction)"
              value={form.min_age_days}
              min={0}
              max={30}
              onChange={(v) => set("min_age_days", v)}
            />
          </Section>

          <Separator />

          {/* Expiry & Lockout */}
          <Section title="Expiry & Lockout">
            <NumField
              label="Password expires in (days)"
              hint="0 = never expires"
              value={form.expiry_days}
              min={0}
              max={365}
              onChange={(v) => set("expiry_days", v)}
            />
            <NumField
              label="Max failed attempts"
              hint="Before account is locked"
              value={form.max_failed_attempts}
              min={1}
              max={20}
              onChange={(v) => set("max_failed_attempts", v)}
            />
            <NumField
              label="Lockout duration (minutes)"
              hint="Duration of the automatic lockout"
              value={form.lockout_duration_minutes}
              min={1}
              max={1440}
              onChange={(v) => set("lockout_duration_minutes", v)}
            />
            <NumField
              label="Max login attempts per minute"
              hint="Rate-limiting threshold per email"
              value={form.max_login_attempts_per_minute}
              min={1}
              max={60}
              onChange={(v) => set("max_login_attempts_per_minute", v)}
            />
          </Section>
        </div>

        {/* ── RIGHT: Preview cards ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <LivePreview form={form} />
          <StrengthPreview form={form} />
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <Button
            className="gap-1.5 text-sm"
            style={{ backgroundColor: "var(--cc-accent)", color: "#fff" }}
            disabled={isPending || !isDirty}
            onClick={() => save()}
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
          <Button
            variant="outline"
            className="gap-1.5 text-sm"
            disabled={isPending || !isDirty}
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
        {lastUpdated && (
          <p className="text-[11px] text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        )}
      </div>
    </div>
  );
}
