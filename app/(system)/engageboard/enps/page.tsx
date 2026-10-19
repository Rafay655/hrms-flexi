"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Gauge } from "lucide-react";
import { EnpsScoreGauge } from "@/components/engageboard/eNPSScoreGauge";
import { EnpsTrendChart } from "@/components/engageboard/eNPSTrendChart";
import { enpsService } from "@/services/engageboard-enps.service";

/**
 * `/engageboard/enps` — 03-design-system.md §3.2. Executive dashboard:
 * `GET /engageboard/enps/dashboard` (scoped server-side to the caller's own
 * department for a Manager, company-wide for HR Admin/C-Suite —
 * `EnpsCampaignPolicy::departmentScopeFor()`, never re-derived client-side).
 */
export default function EnpsDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["engageboard", "enps", "dashboard"],
    queryFn: enpsService.getDashboard,
    staleTime: 30_000,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">EngageBoard · eNPS</nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Employee Net Promoter Score</h1>
          <p className="text-sm text-gray-500">Company-wide sentiment trend and campaign history.</p>
        </div>
        <Link
          href="/engageboard/enps/campaigns"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Gauge className="h-4 w-4" /> Manage Campaigns
        </Link>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Could not load the eNPS dashboard. Please refresh.
        </div>
      )}

      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-[280px] animate-pulse rounded-2xl bg-white/60" />
          <div className="h-[280px] animate-pulse rounded-2xl bg-white/60 lg:col-span-2" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <EnpsScoreGauge
              score={data.current_score && !data.current_score.suppressed ? Number(data.current_score.enps_score) : null}
              delta={data.delta}
              participation={data.participation}
              suppressed={!data.current_score || data.current_score.suppressed}
            />
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs lg:col-span-2">
              <h2 className="mb-3 text-sm font-semibold text-gray-800">Score Trend</h2>
              <EnpsTrendChart data={data.trend} />
            </div>
          </div>

          {data.alerts.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
                <AlertTriangle className="h-4 w-4" /> Segments Needing Attention
              </h2>
              <ul className="flex flex-col gap-1.5">
                {data.alerts.map((alert) => (
                  <li key={alert.uuid} className="flex items-center justify-between text-sm text-amber-800">
                    <span>{alert.segment_value ?? alert.segment_type}</span>
                    <span className="font-semibold tabular-nums">{alert.enps_score}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            href="/engageboard/enps/campaigns"
            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-xs transition-colors hover:bg-brand-100/40"
          >
            <span className="text-sm font-medium text-brand-900">View all campaigns and segment breakdowns</span>
            <ArrowRight className="h-4 w-4 text-gray-300" />
          </Link>
        </>
      )}
    </div>
  );
}
