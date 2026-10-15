"use client";

/**
 * ConnectCentral — Security Events (full paginated log).  [CC-04]
 *
 * The dashboard surfaces only the 5 most-recent events; this page renders the
 * complete, paginated, filterable feed from
 * GET /connect-central/security-dashboard/events.
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Shield, ChevronLeft, ChevronRight, Search, ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getSecurityEvents,
  type SecurityEvent,
} from "@/lib/api/connect-central/security";

const CC_ACCENT = "#6366F1";
const PER_PAGE = 20;

// ── Severity heuristic ──────────────────────────────────────────────────────
type Severity = "high" | "medium" | "low";

const HIGH = /lock|revok|deactiv|permission|role|disabled|escalat/i;
const MEDIUM = /fail|denied|invalid|suspicious|expired/i;

function severityOf(ev: SecurityEvent): Severity {
  const text = `${ev.description ?? ""} ${ev.event ?? ""}`;
  if (HIGH.test(text)) return "high";
  if (MEDIUM.test(text)) return "medium";
  return "low";
}

const SEVERITY_STYLES: Record<Severity, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-gray-100 text-gray-600",
};

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function SecurityEventsPage() {
  const [page, setPage] = useState(1);
  const [eventInput, setEventInput] = useState("");
  const [eventFilter, setEventFilter] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["cc-security-events", { page, event: eventFilter }],
    queryFn: () =>
      getSecurityEvents({
        page,
        per_page: PER_PAGE,
        ...(eventFilter ? { event: eventFilter } : {}),
      }),
    placeholderData: keepPreviousData,
  });

  const events = data?.data ?? [];
  const meta = data?.meta;
  const lastPage = meta?.last_page ?? 1;

  function applyFilter() {
    setEventFilter(eventInput.trim());
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5" style={{ color: CC_ACCENT }} />
            Security Events
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Full audit feed for your company — most recent first
          </p>
        </div>
        <Link href="/connect-central/security">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={eventInput}
            onChange={(e) => setEventInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilter()}
            placeholder="Filter by event (e.g. created, updated)…"
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Button size="sm" onClick={applyFilter} style={{ background: CC_ACCENT }} className="text-white">
          Apply
        </Button>
        {eventFilter && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEventInput("");
              setEventFilter("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Time", "Event", "Description", "User", "Stream"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    Loading security events…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center text-sm text-red-600">
                    Failed to load security events.
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    No security events found.
                  </td>
                </tr>
              ) : (
                events.map((ev) => {
                  const sev = severityOf(ev);
                  return (
                    <tr key={ev.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        {fmt(ev.created_at)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "text-[11px] font-semibold px-1.5 py-0.5 rounded",
                            SEVERITY_STYLES[sev]
                          )}
                        >
                          {ev.event ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-foreground">{ev.description ?? "—"}</td>
                     <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
  {ev.causer?.name ?? ev.causer?.email ?? "System"}
</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{ev.log_name}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-3 py-2.5">
          <p className="text-xs text-muted-foreground">
            {meta ? `${meta.total} total · page ${meta.current_page} of ${lastPage}` : "—"}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
