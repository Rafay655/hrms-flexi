/**
 * app/(system)/connect-central/security/page.tsx
 * Security Command Center — Server Component shell.
 *
 * Renders static structure immediately; each Client Component island
 * handles its own data fetching + loading skeleton via React Query.
 *
 * Layout (matches reference screen 1 - ChatGPT Image May 11 12:02 AM):
 *   ┌─────────────────────────────────────────────────────┐
 *   │  SecurityBanner (dark hero, 3 KPIs, live pulse)     │
 *   ├──────────┬──────────┬──────────┬────────────────────┤
 *   │ TotalU.  │ Sessions │ Locked   │ Failed Logins      │  ← StatCards
 *   ├──────────┴──────────┴──────────┴────────────────────┤
 *   │ SecurityHealth  │ SessionsByDevice │ RecentActivity  │  ← Bottom trio
 *   └─────────────────┴──────────────────┴────────────────┘
 *
 * Requires: view-audit-security permission.
 */

import React, { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// ── Client Component islands ──────────────────────────────────────────────────

import SecurityBanner           from "./_islands/SecurityBanner";
import StatCards                from "./_islands/StatCards";
import SecurityHealthWidget     from "./_islands/SecurityHealthWidget";
import SessionsByDeviceWidget   from "./_islands/SessionsByDeviceWidget";
import RecentLoginActivityWidget from "./_islands/RecentLoginActivityWidget";

// ── Skeleton fallbacks ────────────────────────────────────────────────────────

function BannerSkeleton() {
  return (
    <div className="rounded-2xl p-8 bg-[#322E53] space-y-4 animate-pulse">
      <div className="flex gap-4">
        <div className="h-14 w-14 rounded-2xl bg-white/10" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-56 rounded-lg bg-white/10" />
          <div className="h-4 w-80 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function StatCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SecurityDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col gap-6 bg-white p-4 md:p-8">
      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      <Suspense fallback={<BannerSkeleton />}>
        <SecurityBanner />
      </Suspense>

      {/* ── 4 stat cards ────────────────────────────────────────────────────── */}
      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCards />
      </Suspense>

      {/* ── Bottom trio ─────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Suspense fallback={<WidgetSkeleton />}>
          <SecurityHealthWidget />
        </Suspense>

        <Suspense fallback={<WidgetSkeleton />}>
          <SessionsByDeviceWidget />
        </Suspense>

        <Suspense fallback={<WidgetSkeleton />}>
          <RecentLoginActivityWidget />
        </Suspense>
      </div>
    </div>
  );
}
