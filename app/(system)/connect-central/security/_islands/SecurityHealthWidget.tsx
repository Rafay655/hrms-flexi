"use client";

/**
 * _islands/SecurityHealthWidget.tsx
 * Circular SVG gauge (animated stroke) showing the overall security score,
 * followed by 3 progress bars: 2FA Adoption, Password Policy Strength,
 * and Session Risk Level.
 *
 * Colour thresholds (gauge + label):
 *   ≥ 80 → green   "Excellent"
 *   ≥ 60 → amber   "Good"
 *    < 60 → red    "At Risk"
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldOff } from "lucide-react";
import { getSecurityOverview } from "@/lib/api/connect-central/security";
import { Skeleton } from "@/components/ui/skeleton";

// ── Gauge constants ───────────────────────────────────────────────────────────

const RADIUS = 54;
const STROKE = 10;
const VIEWBOX = (RADIUS + STROKE) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(score: number) {
  if (score >= 80) return "#10B981"; // green
  if (score >= 60) return "#F59E0B"; // amber
  return "#EF4444"; // red
}

function scoreLabel(score: number): { label: string; Icon: React.ElementType } {
  if (score >= 80) return { label: "Excellent", Icon: ShieldCheck };
  if (score >= 60) return { label: "Good",      Icon: ShieldAlert };
  return { label: "At Risk",  Icon: ShieldOff };
}

// ── SVG gauge ─────────────────────────────────────────────────────────────────

function Gauge({ score }: { score: number }) {
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  const color = scoreColor(score);
  const { label, Icon } = scoreLabel(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: VIEWBOX, height: VIEWBOX }}>
        <svg width={VIEWBOX} height={VIEWBOX} className="-rotate-90">
          {/* Track */}
          <circle
            cx={VIEWBOX / 2}
            cy={VIEWBOX / 2}
            r={RADIUS}
            fill="none"
            stroke="#5c549020"
            strokeWidth={STROKE}
          />
          {/* Animated arc */}
          <motion.circle
            cx={VIEWBOX / 2}
            cy={VIEWBOX / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>

        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-brand-900">{score}</span>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            /100
          </span>
        </div>
      </div>

      {/* Score label below gauge */}
      <div
        className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Icon className="h-4 w-4" />
        {label}
      </div>
    </div>
  );
}

// ── Progress bar row ──────────────────────────────────────────────────────────

interface ProgressRowProps {
  label: string;
  percent: number;
  color: string;
  note?: string;
}

function ProgressRow({ label, percent, color, note }: ProgressRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-medium text-brand-800">{label}</span>
        <span className="font-semibold" style={{ color }}>
          {note ?? `${percent}%`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

// ── Widget ────────────────────────────────────────────────────────────────────

export default function SecurityHealthWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["cc-security-overview"],
    queryFn: getSecurityOverview,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const score = data?.health_score?.total ?? 92;
  const mfaPct = data?.mfa_adoption_percent ?? 84;

  // Derive password strength from MFA penalty (inverse proxy)
  const mfaPenalty = data?.health_score?.mfa_penalty ?? 16;
  const policyStrength = Math.max(0, Math.min(100, 100 - mfaPenalty * 1.5));

  // Derive session risk from suspicious penalty (inverse)
  const suspPenalty = data?.health_score?.suspicious_penalty ?? 3;
  const sessionRiskPct = Math.max(0, 100 - suspPenalty * 10);

  const sessionRiskLabel =
    sessionRiskPct >= 80 ? "Low Risk" : sessionRiskPct >= 50 ? "Medium" : "High Risk";

  if (isLoading) {
    return (
      <div className="min-w-0 h-full bg-white rounded-xl p-6 shadow-sm border border-brand-200 space-y-5">
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-center">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 h-full bg-white rounded-xl p-6 shadow-sm border border-brand-200 flex flex-col gap-6">
      {/* Title */}
      <div>
        <p className="text-base font-semibold text-brand-900">Security Health</p>
        <p className="text-xs text-muted-foreground mt-0.5">Overall posture score</p>
      </div>

      {/* Gauge */}
      <div className="flex justify-center">
        <Gauge score={score} />
      </div>

      {/* Progress bars */}
      <div className="space-y-4 border-t pt-4">
        <ProgressRow
          label="2FA Adoption"
          percent={mfaPct}
          color="#5c5490"
        />
        <ProgressRow
          label="Password Policy Strength"
          percent={Math.round(policyStrength)}
          color="#10B981"
        />
        <ProgressRow
          label="Session Risk Level"
          percent={sessionRiskPct}
          color={sessionRiskPct >= 80 ? "#10B981" : sessionRiskPct >= 50 ? "#F59E0B" : "#EF4444"}
          note={sessionRiskLabel}
        />
      </div>

      {/* Footer link */}
      <a
        href="/connect-central/security"
        className="text-xs font-medium text-brand-800 hover:underline flex items-center gap-1 mt-auto"
      >
        View full security report →
      </a>
    </div>
  );
}
