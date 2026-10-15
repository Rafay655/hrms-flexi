"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Smartphone,
  Code2,
  Terminal,
  ShieldCheck,
  ShieldOff,
  RotateCcw,
  MapPin,
  Clock,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SessionRevokeDialog from "../_components/SessionRevokeDialog";
import CountryFlag from "../_components/CountryFlag";
import {
  getMyActiveSessions,
  revokeMySession,
  revokeAllMySessions,
} from "@/lib/api/connect-central/sessions";
import type { DeviceType, OwnSession } from "@/lib/api/connect-central/sessions";

// ── Extended session shape (API + client-side meta) ───────────────────────────

interface SessionRow {
  uuid: string;
  deviceName: string;
  deviceLabel: string; // "Web · Safari · macOS"
  device_type: DeviceType;
  ip_address: string;
  country_code: string;
  country_name: string;
  city: string;
  last_activity_at: string;
  created_at: string;
  trusted: boolean;
}

// ── API → SessionRow mapping ──────────────────────────────────────────────────

function toSessionRow(s: OwnSession): SessionRow {
  const typeLabel = s.device_type.charAt(0).toUpperCase() + s.device_type.slice(1);
  return {
    uuid: s.uuid,
    deviceName: s.device_name ?? "Unknown device",
    deviceLabel: [typeLabel, s.device_name].filter(Boolean).join(" · "),
    device_type: s.device_type,
    ip_address: s.ip_address,
    country_code: "",
    country_name: s.location_country ?? "",
    city: s.location_city ?? "",
    last_activity_at: s.last_activity_at,
    created_at: s.created_at,
    trusted: false,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 45) return "Active now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 172800) return "Yesterday";
  return `${Math.floor(s / 86400)}d ago`;
}

function lastSyncedLabel(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 30_000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  return `${Math.floor(diff / 60_000)}m ago`;
}

const DEVICE_ICON: Record<DeviceType, React.ElementType> = {
  web: Monitor,
  mobile: Smartphone,
  api: Code2,
  cli: Terminal,
};

// ── Current session card ──────────────────────────────────────────────────────

function CurrentSessionCard({ session }: { session: SessionRow }) {
  const Icon = DEVICE_ICON[session.device_type] ?? Monitor;
  const activityLabel = relativeTime(session.last_activity_at);

  return (
    <div
      className="rounded-2xl p-5 border-l-4"
      style={{
        backgroundColor: "#EEF2FF",
        borderLeftColor: "var(--cc-accent)",
        border: "1px solid #C7D2FE",
        borderLeft: "4px solid var(--cc-accent)",
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--cc-accent)" }}
        >
          Current Session
        </span>
        {session.trusted && (
          <Badge
            className="text-[10px] gap-1"
            style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}
          >
            <ShieldCheck className="h-3 w-3" />
            Trusted device
          </Badge>
        )}
      </div>

      <div className="flex items-start gap-4">
        {/* Device avatar */}
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(99,102,241,0.12)" }}
        >
          <Icon className="h-7 w-7" style={{ color: "var(--cc-accent)" }} />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{session.deviceName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{session.deviceLabel}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
            <span className="font-mono">{session.ip_address}</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <CountryFlag
                countryCode={session.country_code}
                countryName={session.city}
              />
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {activityLabel}
            </span>
          </div>
        </div>

        {/* Cannot-revoke button with tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  className="h-8 text-xs gap-1.5 opacity-40 cursor-not-allowed"
                >
                  <ShieldOff className="h-3.5 w-3.5" />
                  Revoke
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="left">
              <Info className="h-3 w-3 inline mr-1" />
              Cannot revoke current session
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// ── Other session card ────────────────────────────────────────────────────────

function OtherSessionCard({
  session,
  onRevoke,
  revoking,
}: {
  session: SessionRow;
  onRevoke: () => void;
  revoking: boolean;
}) {
  const Icon = DEVICE_ICON[session.device_type] ?? Monitor;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-4">
      {/* Device avatar */}
      <div className="h-11 w-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-gray-500" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{session.deviceName}</p>
        <p className="text-xs text-gray-400 mt-0.5">{session.deviceLabel}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-400">
          <span className="font-mono">{session.ip_address}</span>
          <span className="flex items-center gap-1">
            <CountryFlag
              countryCode={session.country_code}
              countryName={`${session.city}, ${session.country_name}`}
            />
          </span>
          <span>{relativeTime(session.last_activity_at)}</span>
        </div>
      </div>

      {/* Revoke button */}
      <Button
        size="sm"
        variant="outline"
        className="h-8 text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shrink-0"
        onClick={onRevoke}
        disabled={revoking}
      >
        <ShieldOff className="h-3.5 w-3.5" />
        Revoke
      </Button>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function SessionSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-4">
      <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyOtherSessions() {
  return (
    <div className="text-center py-14 rounded-2xl border-2 border-dashed border-gray-200">
      <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
        <ShieldCheck className="h-8 w-8 text-green-500" />
      </div>
      <p className="text-sm font-semibold text-gray-900">No other active sessions</p>
      <p className="text-xs text-gray-400 mt-1">
        All other sessions have been signed out.
      </p>
      <p className="text-xs text-gray-400 mt-0.5">
        Your account is only active on this device.
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MySessionsPage() {
  const queryClient = useQueryClient();

  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: apiSessions, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["cc-my-sessions"],
    queryFn: getMyActiveSessions,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const currentUuid = apiSessions?.find((s) => s.is_current)?.uuid ?? null;
  const sessions: SessionRow[] = (apiSessions ?? []).map(toSessionRow);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const { mutateAsync: doRevoke, isPending: revoking } = useMutation({
    mutationFn: (uuid: string) => revokeMySession(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cc-my-sessions"] });
      setRevokeTarget(null);
    },
  });

  const { mutateAsync: doRevokeAll, isPending: revokingAll } = useMutation({
    mutationFn: revokeAllMySessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cc-my-sessions"] });
      setRevokeAllOpen(false);
    },
  });

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentSession = currentUuid ? sessions.find((s) => s.uuid === currentUuid) : undefined;
  const otherSessions = currentUuid ? sessions.filter((s) => s.uuid !== currentUuid) : sessions;

  const revokeTargetSession = sessions.find((s) => s.uuid === revokeTarget);
  const sessionCount = sessions.length;

  return (
    <TooltipProvider>
      <div className="space-y-5 max-w-3xl">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Active Sessions</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage where your account is currently signed in.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
            <Button
              size="sm"
              className="gap-1.5 text-xs text-white"
              style={{ backgroundColor: "var(--cc-navy)" }}
              onClick={() => setRevokeAllOpen(true)}
              disabled={otherSessions.length === 0 || revokingAll}
            >
              <ShieldOff className="h-3.5 w-3.5" />
              Revoke All Other Sessions
            </Button>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span>{sessionCount} active session{sessionCount !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <RotateCcw className="h-2.5 w-2.5" />
                Last synced {lastSyncedLabel(dataUpdatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Current session ─────────────────────────────────────────────── */}
        {isLoading ? (
          <SessionSkeleton />
        ) : currentSession ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <CurrentSessionCard session={currentSession} />
          </motion.div>
        ) : null}

        {/* ── Other sessions ──────────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Other active sessions
          </p>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <SessionSkeleton key={i} />)}
            </div>
          ) : otherSessions.length === 0 ? (
            <EmptyOtherSessions />
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {otherSessions.map((session, i) => (
                  <motion.div
                    key={session.uuid}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <OtherSessionCard
                      session={session}
                      onRevoke={() => setRevokeTarget(session.uuid)}
                      revoking={revoking && revokeTarget === session.uuid}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── Dialogs ─────────────────────────────────────────────────────── */}

        {/* Single revoke */}
        <SessionRevokeDialog
          open={!!revokeTarget}
          onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}
          sessionInfo={
            revokeTargetSession
              ? `${revokeTargetSession.deviceName} · ${revokeTargetSession.ip_address}`
              : undefined
          }
          onConfirm={() => doRevoke(revokeTarget!)}
          loading={revoking}
        />

        {/* Revoke all others */}
        <SessionRevokeDialog
          open={revokeAllOpen}
          onOpenChange={setRevokeAllOpen}
          sessionInfo={`all other sessions (${otherSessions.length} device${otherSessions.length !== 1 ? "s" : ""})`}
          onConfirm={() => doRevokeAll()}
          loading={revokingAll}
        />
      </div>
    </TooltipProvider>
  );
}
