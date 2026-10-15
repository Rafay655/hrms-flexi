"use client";

/**
 * _islands/RecentLoginActivityWidget.tsx
 * Table of the 5 most recent security events scoped to the company.
 * Columns: User (avatar+name), Status badge, Device, Location (flag), Time.
 *
 * Status derivation:
 *   account_locked / failed_login / suspicious_* → "Failed"  (red)
 *   session_revoked / mfa_reset / policy_*       → "Warning" (amber)
 *   everything else                              → "Success" (green)
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { getSecurityEvents } from "@/lib/api/connect-central/security";
import type { SecurityEvent } from "@/lib/api/connect-central/security";
import { Skeleton } from "@/components/ui/skeleton";
/** Convert ISO-3166-1 alpha-2 code to flag emoji inline */
function toFlag(code: string): string {
  const base = 0x1f1e6 - 65;
  return [...code.toUpperCase()].map((c) => String.fromCodePoint(base + c.charCodeAt(0))).join("");
}

// ── Status derivation ─────────────────────────────────────────────────────────

type LoginStatus = "success" | "warning" | "failed";

function deriveStatus(event?: string | null, description?: string | null): LoginStatus {
  // Spatie's `event` column is frequently null (e.g. plain auth-log entries),
  // so guard against null and fall back to the description text.
  const haystack = `${event ?? ""} ${description ?? ""}`.toLowerCase();
  const failed = ["account_locked", "failed_login", "suspicious", "brute_force", "invalid_credentials"];
  const warning = ["session_revoked", "mfa_reset", "policy_violation", "device_limit", "2fa_disabled"];
  if (failed.some((k) => haystack.includes(k))) return "failed";
  if (warning.some((k) => haystack.includes(k))) return "warning";
  return "success";
}

const STATUS_CONFIG: Record<LoginStatus, { label: string; icon: React.ElementType; bg: string; text: string }> = {
  success: { label: "Success", icon: CheckCircle2, bg: "#D1FAE5", text: "#065F46" },
  warning: { label: "Warning", icon: AlertTriangle, bg: "#FEF3C7", text: "#92400E" },
  failed:  { label: "Failed",  icon: XCircle,       bg: "#FEE2E2", text: "#991B1B" },
};

// ── Mock device / location since SecurityEvent doesn't carry them ─────────────

const MOCK_DEVICES = ["Desktop", "Mobile", "Desktop", "Tablet", "Desktop"];
const MOCK_LOCATIONS = [
  { city: "Lahore, Pakistan",     country: "PK" },
  { city: "Karachi, Pakistan",    country: "PK" },
  { city: "New York, USA",        country: "US" },
  { city: "Dubai, UAE",           country: "AE" },
  { city: "Toronto, Canada",      country: "CA" },
];

const DEVICE_ICONS: Record<string, React.ElementType> = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
};

// ── User avatar (initials) ────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Deterministic colour from first char
  const hue = (name.charCodeAt(0) * 37) % 360;

  return (
    <span
      className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
      style={{ backgroundColor: `hsl(${hue},60%,50%)` }}
    >
      {initials}
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LoginStatus }) {
  const { label, icon: Icon, bg, text } = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ backgroundColor: bg, color: text }}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Row component ─────────────────────────────────────────────────────────────

function ActivityRow({ event, index }: { event: SecurityEvent; index: number }) {
  const status = deriveStatus(event.event, event.description);
  const deviceLabel = MOCK_DEVICES[index % MOCK_DEVICES.length];
  const DeviceIcon = DEVICE_ICONS[deviceLabel] ?? Globe;
  const location = MOCK_LOCATIONS[index % MOCK_LOCATIONS.length];
  const userName = event.causer?.name ?? "Unknown User";
  const userEmail = event.causer?.email ?? "";

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="border-b border-brand-100 last:border-0 hover:bg-brand-100/30/60 transition-colors"
    >
      {/* User */}
      <td className="py-3 pr-3 first:pl-0">
        <div className="flex items-center gap-2.5">
          <Avatar name={userName} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand-900 truncate">{userName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="py-3 pr-3">
        <StatusBadge status={status} />
      </td>

      {/* Device */}
      <td className="py-3 pr-3 hidden md:table-cell">
        <div className="flex items-center gap-1.5 text-xs text-brand-700">
          <DeviceIcon className="h-3.5 w-3.5 text-muted-foreground" />
          {deviceLabel}
        </div>
      </td>

      {/* Location */}
      <td className="py-3 pr-3 hidden lg:table-cell">
        <div className="flex items-center gap-1.5 text-xs text-brand-700">
          <span aria-label={`Flag of ${location.country}`}>{toFlag(location.country)}</span>
          <span className="truncate max-w-[110px]">{location.city}</span>
        </div>
      </td>

      {/* Time */}
      <td className="py-3 text-right">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          {relativeTime(event.created_at)}
        </span>
      </td>
    </motion.tr>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-brand-100">
      <td className="py-3 pr-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        </div>
      </td>
      <td className="py-3 pr-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="py-3 pr-3 hidden md:table-cell"><Skeleton className="h-3 w-16" /></td>
      <td className="py-3 pr-3 hidden lg:table-cell"><Skeleton className="h-3 w-28" /></td>
      <td className="py-3 text-right"><Skeleton className="h-3 w-12 ml-auto" /></td>
    </tr>
  );
}

// ── Widget ────────────────────────────────────────────────────────────────────

export default function RecentLoginActivityWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["cc-security-events", { per_page: 5 }],
    queryFn: () => getSecurityEvents({ per_page: 5 }),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const events = data?.data ?? [];

  return (
    <div className="min-w-0 h-full bg-white rounded-xl p-6 shadow-sm border border-brand-200 flex flex-col gap-4">
      {/* Title */}
      <div>
        <p className="text-base font-semibold text-brand-900">Recent Login Activity</p>
        <p className="text-xs text-muted-foreground mt-0.5">Latest security events for your company</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[420px]">
          <thead>
            <tr className="border-b border-brand-200">
              {["User", "Status", "Device", "Location", "Time"].map((h) => (
                <th
                  key={h}
                  className={`pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left pr-3 ${
                    h === "Device" ? "hidden md:table-cell" :
                    h === "Location" ? "hidden lg:table-cell" :
                    h === "Time" ? "text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : events.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    No recent security events
                  </td>
                </tr>
              )
              : events.map((ev, i) => (
                  <ActivityRow key={ev.id} event={ev} index={i} />
                ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t pt-3 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          {data?.meta?.total ?? 0} total events
        </p>
        <a
          href="/connect-central/security"
          className="text-xs font-medium text-brand-800 hover:underline"
        >
          View all login activity →
        </a>
      </div>
    </div>
  );
}
