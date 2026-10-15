"use client";

/**
 * _islands/StatCards.tsx
 * 4 animated KPI cards: Total Users, Active Sessions, Locked Accounts,
 * Failed Login Attempts.
 *
 * Each card counts up from 0 on mount. Cards stagger in with framer-motion.
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { animate, motion } from "framer-motion";
import {
  Users,
  MonitorSmartphone,
  Lock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { getSecurityOverview } from "@/lib/api/connect-central/security";
import { Skeleton } from "@/components/ui/skeleton";

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1.2): number {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const controls = animate(0, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) { setCount(Math.round(v)); },
    });
    return () => controls.stop();
  }, [target, duration]);
  return count;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CardData {
  title: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accentBar: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
}

// ── Single animated card ──────────────────────────────────────────────────────

function StatCard({ card, index }: { card: CardData; index: number }) {
  const displayed = useCountUp(card.value);
  const themes = [
    { background: "linear-gradient(135deg, #322E53, #49426E)", color: "#ffffff" },
    { background: "linear-gradient(135deg, #49426E, #5c5490)", color: "#ffffff" },
    { background: "linear-gradient(135deg, #EEC293, #e8b57a)", color: "#322E53" },
    { background: "linear-gradient(135deg, #F3AB9D, #ef9083)", color: "#322E53" },
  ];
  const theme = themes[index % themes.length];

  const DeltaIcon =
    card.deltaDirection === "up"
      ? TrendingUp
      : card.deltaDirection === "down"
      ? TrendingDown
      : Minus;

  const deltaColor =
    card.deltaDirection === "up"
      ? "#10B981"
      : card.deltaDirection === "down"
      ? "#EF4444"
      : "#9CA3AF";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.07,
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="rounded-xl p-5 shadow-lg border-0 relative overflow-hidden flex flex-col gap-3"
      style={theme}
    >
      {/* Icon + value row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium">
            {card.title}
          </p>
          <p className="text-3xl font-semibold mt-1.5 tabular-nums">
            {displayed.toLocaleString()}
          </p>
        </div>

        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: index < 2 ? "rgba(255,255,255,0.12)" : "rgba(50,46,83,0.08)" }}
        >
          <card.icon className="h-5 w-5" style={{ color: theme.color }} />
        </div>
      </div>

      {/* Sub + delta */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] opacity-80">{card.sub}</p>
        {card.delta && (
          <span className="flex items-center gap-1">
            <DeltaIcon className="h-3 w-3" style={{ color: deltaColor }} />
            <span className="text-[11px] font-semibold" style={{ color: deltaColor }}>
              {card.delta}
            </span>
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-brand-100 rounded-xl p-5 shadow-sm border border-brand-200 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-11 w-11 rounded-xl" />
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// ── Exported island ───────────────────────────────────────────────────────────

export default function StatCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["cc-security-overview"],
    queryFn: getSecurityOverview,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
    );
  }

  const cards: CardData[] = [
    {
      title: "Total Users",
      value: data?.total_users ?? 0,
      sub: "All registered accounts",
      icon: Users,
      iconBg: "#EEF2FF",
      iconColor: "#6366F1",
      accentBar: "#6366F1",
    },
    {
      title: "Active Sessions",
      value: data?.active_sessions ?? 0,
      sub: `${data?.mfa_adoption_percent ?? 0}% protected by MFA`,
      icon: MonitorSmartphone,
      iconBg: "#D1FAE5",
      iconColor: "#10B981",
      accentBar: "#10B981",
    },
    {
      title: "Locked Accounts",
      value: data?.locked_accounts ?? 0,
      sub: "Pending manual review",
      icon: Lock,
      iconBg: "#FEE2E2",
      iconColor: "#EF4444",
      accentBar: "#EF4444",
    },
    {
      title: "Failed Login Attempts",
      value: data?.failed_logins_24h ?? 0,
      sub: "Across all accounts",
      icon: AlertTriangle,
      iconBg: "#FEF3C7",
      iconColor: "#F59E0B",
      accentBar: "#F59E0B",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <StatCard key={card.title} card={card} index={i} />
      ))}
    </div>
  );
}
