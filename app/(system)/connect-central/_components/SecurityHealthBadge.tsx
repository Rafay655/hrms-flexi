"use client";

/**
 * _components/SecurityHealthBadge.tsx
 * A pill badge that renders the current security health score.
 *
 * Colour mapping:
 *   ≥ 80 → --cc-success (green)   "Healthy"
 *   ≥ 60 → --cc-warning (amber)   "Fair"
 *    < 60 → --cc-danger  (red)    "At Risk"
 */

import React from "react";
import { ShieldCheck, ShieldAlert, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  score: number | null;
  className?: string;
};

export default function SecurityHealthBadge({ score, className }: Props) {
  if (score === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          "bg-gray-100 text-gray-500",
          className
        )}
      >
        <ShieldOff className="h-3.5 w-3.5" />
        Loading…
      </span>
    );
  }

  const level =
    score >= 80 ? "healthy" : score >= 60 ? "fair" : "risk";

  const config: Record<
    string,
    { label: string; bg: string; text: string; Icon: React.ElementType }
  > = {
    healthy: {
      label: "Security Healthy",
      bg: "#D1FAE5",
      text: "#065F46",
      Icon: ShieldCheck,
    },
    fair: {
      label: "Security Fair",
      bg: "#FEF3C7",
      text: "#92400E",
      Icon: ShieldAlert,
    },
    risk: {
      label: "Security At Risk",
      bg: "#FEE2E2",
      text: "#991B1B",
      Icon: ShieldOff,
    },
  };

  const { label, bg, text, Icon } = config[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        className
      )}
      style={{ backgroundColor: bg, color: text }}
    >
      <Icon className="h-3.5 w-3.5" />
      {label} — {score}/100
    </span>
  );
}
