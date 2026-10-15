"use client";

/**
 * _islands/SecurityEventBadge.tsx
 * Inline badge: event-type icon + human label + severity chip.
 * Used in the Recent Login Activity table and security event lists.
 */

import React from "react";
import {
  Lock,
  ShieldAlert,
  ShieldOff,
  Key,
  LogOut,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  Wifi,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EventSeverity = "high" | "medium" | "low" | "info";

interface EventConfig {
  icon: React.ElementType;
  label: string;
  severity: EventSeverity;
}

const EVENT_MAP: Record<string, EventConfig> = {
  account_locked:      { icon: Lock,         label: "Account Locked",       severity: "high"   },
  failed_login:        { icon: AlertTriangle, label: "Failed Login",         severity: "high"   },
  suspicious_activity: { icon: ShieldAlert,   label: "Suspicious Activity",  severity: "high"   },
  privilege_escalation:{ icon: ShieldOff,     label: "Privilege Escalation", severity: "high"   },
  session_revoked:     { icon: LogOut,        label: "Session Revoked",      severity: "medium" },
  password_changed:    { icon: Key,           label: "Password Changed",     severity: "medium" },
  mfa_reset:           { icon: RefreshCw,     label: "MFA Reset",            severity: "medium" },
  "2fa_disabled":      { icon: ShieldAlert,   label: "2FA Disabled",         severity: "medium" },
  "2fa_confirmed":     { icon: CheckCircle2,  label: "2FA Confirmed",        severity: "low"    },
  login_success:       { icon: CheckCircle2,  label: "Login Success",        severity: "info"   },
  user_created:        { icon: UserPlus,      label: "User Created",         severity: "info"   },
  oauth_connected:     { icon: Wifi,          label: "OAuth Connected",      severity: "info"   },
  session_created:     { icon: Eye,           label: "Session Started",      severity: "info"   },
};

const SEVERITY_STYLES: Record<EventSeverity, { bg: string; text: string; chip: string; chipText: string }> = {
  high:   { bg: "#FEE2E2", text: "#991B1B", chip: "#DC2626", chipText: "#fff" },
  medium: { bg: "#FEF3C7", text: "#92400E", chip: "#D97706", chipText: "#fff" },
  low:    { bg: "#D1FAE5", text: "#065F46", chip: "#10B981", chipText: "#fff" },
  info:   { bg: "#EFF6FF", text: "#1E40AF", chip: "#3B82F6", chipText: "#fff" },
};

interface Props {
  event: string;
  showChip?: boolean;
  className?: string;
}

export default function SecurityEventBadge({ event, showChip = true, className }: Props) {
  // Exact match → partial match → fallback
  const config: EventConfig =
    EVENT_MAP[event] ??
    Object.entries(EVENT_MAP).find(([key]) => event.includes(key))?.[1] ??
    { icon: ShieldAlert, label: event.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), severity: "info" };

  const { icon: Icon, label, severity } = config;
  const { bg, text, chip, chipText } = SEVERITY_STYLES[severity];

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium", className)}
      style={{ backgroundColor: bg, color: text }}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {label}
      {showChip && (
        <span
          className="px-1.5 py-px rounded-full text-[10px] font-semibold"
          style={{ backgroundColor: chip, color: chipText }}
        >
          {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </span>
      )}
    </span>
  );
}
