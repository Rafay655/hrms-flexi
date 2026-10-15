"use client";

/**
 * _components/RiskBadge.tsx
 * Colour-coded risk level pill: Low / Medium / High.
 * Used in the security events table and session listing.
 */

import React from "react";
import { cn } from "@/lib/utils";

export type RiskLevel = "low" | "medium" | "high";

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; bg: string; text: string; dot: string }
> = {
  low: {
    label: "Low",
    bg: "#D1FAE5",
    text: "#065F46",
    dot: "#10B981",
  },
  medium: {
    label: "Medium",
    bg: "#FEF3C7",
    text: "#92400E",
    dot: "#F59E0B",
  },
  high: {
    label: "High",
    bg: "#FEE2E2",
    text: "#991B1B",
    dot: "#EF4444",
  },
};

type Props = {
  level: RiskLevel;
  className?: string;
};

export default function RiskBadge({ level, className }: Props) {
  const { label, bg, text, dot } = RISK_CONFIG[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        className
      )}
      style={{ backgroundColor: bg, color: text }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: dot }}
      />
      {label}
    </span>
  );
}

/**
 * Derive a RiskLevel from a revocation_reason or event description.
 * Convenience helper used by event tables.
 */
export function deriveRiskLevel(event: string): RiskLevel {
  const high = [
    "suspicious_activity",
    "privilege_escalation",
    "brute_force",
    "account_locked",
  ];
  const medium = [
    "policy_violation",
    "mfa_reset",
    "password_changed",
    "device_limit_exceeded",
  ];

  if (high.some((k) => event.includes(k))) return "high";
  if (medium.some((k) => event.includes(k))) return "medium";
  return "low";
}
