"use client";

/**
 * _islands/SecurityBanner.tsx
 * Hero banner for the Security Command Center.
 *
 * Design: dark gradient (#1E2139 → #2D3058), shield glow, 3 KPI count-ups,
 *         live-pulse indicator when data is fresh.
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { animate } from "framer-motion";
import { ShieldCheck, Users, MonitorSmartphone, KeyRound } from "lucide-react";
import { getSecurityOverview } from "@/lib/api/connect-central/security";

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1.4): number {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (target === 0) return;
    const controls = animate(0, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        setCount(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [target, duration]);

  return count;
}

// ── KPI bubble ────────────────────────────────────────────────────────────────

interface KpiBubbleProps {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  isLoading: boolean;
}

function KpiBubble({ icon: Icon, label, value, suffix = "", color, isLoading }: KpiBubbleProps) {
  const displayed = useCountUp(value);

  return (
    <div className="flex flex-col items-center sm:items-start min-w-[100px]">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <p
          className="text-xs font-medium"
          style={{ color: "rgba(255,255,255,0.75)" }}
        >
          {label}
        </p>
      </div>

      {isLoading ? (
        <div className="mt-1.5 h-8 w-20 rounded-lg bg-white/10 animate-pulse" />
      ) : (
        <p className="text-3xl font-semibold leading-none mt-1" style={{ color }}>
          {displayed.toLocaleString()}
          {suffix}
        </p>
      )}
    </div>
  );
}

// ── Live pulse ────────────────────────────────────────────────────────────────

function LivePulse({ timestamp }: { timestamp: string }) {
  // Date.now() compares the API snapshot age against wall clock — intentional impure read.
  // eslint-disable-next-line react-hooks/purity
  const age = Date.now() - new Date(timestamp).getTime();
  const fresh = age < 65_000; // within one cache window

  return (
    <div className="flex items-center gap-2 mt-3">
      <span className="relative flex h-2 w-2">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ backgroundColor: fresh ? "#10B981" : "#F59E0B" }}
        />
        <span
          className="relative inline-flex rounded-full h-2 w-2"
          style={{ backgroundColor: fresh ? "#10B981" : "#F59E0B" }}
        />
      </span>
      <span
        className="text-xs font-medium"
        style={{ color: fresh ? "#6EE7B7" : "#FCD34D" }}
      >
        {fresh ? "Live · Updated just now" : "Refreshing soon…"}
      </span>
    </div>
  );
}

// ── Banner ────────────────────────────────────────────────────────────────────

export default function SecurityBanner() {
  const { data, isLoading } = useQuery({
    queryKey: ["cc-security-overview"],
    queryFn: getSecurityOverview,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const kpis: KpiBubbleProps[] = [
    {
      icon: Users,
      label: "Active Users",
      value: data?.total_users ?? 0,
      color: "#f7c9b9",
      isLoading,
    },
    {
      icon: MonitorSmartphone,
      label: "Active Sessions",
      value: data?.active_sessions ?? 0,
      color: "#EEC293",
      isLoading,
    },
    {
      icon: KeyRound,
      label: "2FA Adoption",
      value: data?.mfa_adoption_percent ?? 0,
      suffix: "%",
      color: "#F3AB9D",
      isLoading,
    },
  ];

  return (
    <div
      className="rounded-xl p-6 md:p-8 overflow-hidden relative shadow-sm"
      style={{
        background:
          "linear-gradient(135deg, #322E53 0%, #49426E 60%, #5c5490 100%)",
      }}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow blob */}
      <div
        className="absolute -top-16 -right-16 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: "#EEC293" }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
        {/* Icon + title */}
        <div className="flex items-start gap-4 flex-1">
          {/* Shield with glow */}
          <div className="relative shrink-0">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(238,194,147,0.16)" }}
            >
              <ShieldCheck className="h-7 w-7 relative z-10" style={{ color: "#EEC293" }} />
            </div>
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{ boxShadow: "0 0 24px rgba(238,194,147,0.15)" }}
            />
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Security Command Center
            </h1>
            <p className="text-sm mt-1" style={{ color: "#f7c9b9" }}>
              Your environment is secure and operating normally.
            </p>
            {data?.generated_at && <LivePulse timestamp={data.generated_at} />}
            {isLoading && (
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-white/20 animate-pulse" />
                <span className="text-xs text-white/40">Loading snapshot…</span>
              </div>
            )}
          </div>
        </div>

        {/* KPI trio */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 lg:gap-12 shrink-0">
          {kpis.map((kpi) => (
            <KpiBubble key={kpi.label} {...kpi} />
          ))}
        </div>
      </div>
    </div>
  );
}
