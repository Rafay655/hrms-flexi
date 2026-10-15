"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useState, useMemo } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Unlock,
  ShieldAlert,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  MapPin,
  Clock,
  Activity,
  AlertTriangle,
  Users,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  getAccountLocks,
  unlockAccount,
  unlockAllAccounts,
  type AccountLock,
} from "@/lib/api/connect-central/access";
import { cn } from "@/lib/utils";

// ── Extended type with UI-only fields ─────────────────────────────────────────

type AccountLockEx = AccountLock & {
  failed_attempts: number;
  ip_address: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function relTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function relFuture(iso: string): string {
  const diff = Math.floor((new Date(iso).getTime() - Date.now()) / 1000);
  if (diff <= 0) return "Now";
  if (diff < 60) return `in ${diff}s`;
  if (diff < 3600) return `in ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `in ${Math.floor(diff / 3600)}h`;
  return `in ${Math.floor(diff / 86400)}d`;
}

function toFlag(code: string): string {
  const base = 0x1f1e6 - 65;
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(base + c.charCodeAt(0)))
    .join("");
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

type LockStatus = "High Risk" | "Pending Unlock" | "Locked";

function deriveStatus(lock: AccountLockEx): LockStatus {
  if (lock.failed_attempts >= 6) return "High Risk";
  if (lock.auto_unlock_at && new Date(lock.auto_unlock_at) > new Date())
    return "Pending Unlock";
  return "Locked";
}

type RiskLevel = "High" | "Medium" | "Low";

function deriveRisk(lock: AccountLockEx): RiskLevel {
  if (lock.failed_attempts >= 6) return "High";
  if (lock.failed_attempts >= 3) return "Medium";
  return "Low";
}

const REASON_LABELS: Record<AccountLock["lock_reason"], string> = {
  failed_attempts: "Too Many Attempts",
  admin_action: "Admin Lock",
  suspicious_activity: "Suspicious",
};

// ── API → AccountLockEx mapping ───────────────────────────────────────────────

function toLockEx(l: AccountLock): AccountLockEx {
  return {
    ...l,
    failed_attempts: l.failed_attempt_count,
    ip_address: "",
  };
}

const MOCK_FAILED_ATTEMPTS_TODAY = 147;

const LOCATIONS = [
  { city: "Lahore", code: "PK" },
  { city: "Karachi", code: "PK" },
  { city: "Dubai", code: "AE" },
];

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

function KpiCard({ label, value, icon, color, bg }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 shadow-sm">
      <div
        className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: bg }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LockStatus }) {
  if (status === "High Risk")
    return (
      <Badge className="text-[10px] bg-red-900 text-red-100 hover:bg-red-900">
        High Risk
      </Badge>
    );
  if (status === "Pending Unlock")
    return (
      <Badge className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">
        Pending
      </Badge>
    );
  return (
    <Badge className="text-[10px] bg-red-100 text-red-700 hover:bg-red-100">
      Locked
    </Badge>
  );
}

// ── Reason Badge ──────────────────────────────────────────────────────────────

function ReasonBadge({ reason }: { reason: AccountLock["lock_reason"] }) {
  const label = REASON_LABELS[reason];
  const cls =
    reason === "suspicious_activity"
      ? "bg-orange-100 text-orange-700 hover:bg-orange-100"
      : reason === "admin_action"
        ? "bg-purple-100 text-purple-700 hover:bg-purple-100"
        : "bg-red-100 text-red-700 hover:bg-red-100";
  return <Badge className={cn("text-[10px]", cls)}>{label}</Badge>;
}

// ── Risk Badge ────────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: RiskLevel }) {
  if (level === "High")
    return (
      <Badge className="bg-red-600 text-white hover:bg-red-600">High</Badge>
    );
  if (level === "Medium")
    return (
      <Badge className="bg-amber-500 text-white hover:bg-amber-500">
        Medium
      </Badge>
    );
  return (
    <Badge className="bg-green-600 text-white hover:bg-green-600">Low</Badge>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

interface DetailPanelProps {
  lock: AccountLockEx;
  onUnlock: (uuid: string) => void;
  isUnlocking: boolean;
  onClose: () => void;
}

function AccountLockDetailPanel({
  lock,
  onUnlock,
  isUnlocking,
  onClose,
}: DetailPanelProps) {
  const status = deriveStatus(lock);
  const risk = deriveRisk(lock);

  const recentAttempts = useMemo(() => {
    const base = new Date(lock.locked_at).getTime();
    return Array.from({ length: Math.min(lock.failed_attempts, 5) }, (_, i) => ({
      time: new Date(base - i * 8 * 60_000).toISOString(),
      ip: lock.ip_address,
    }));
  }, [lock]);

  return (
    <motion.div
      key={lock.uuid}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.18 }}
      className="w-[300px] shrink-0 rounded-xl border border-border bg-card shadow-sm flex flex-col overflow-hidden"
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold">Lock Details</span>
        <button
          onClick={onClose}
          className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-red-700">
              {initials(lock.user.name)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{lock.user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {lock.user.email}
            </p>
          </div>
        </div>

        {/* Risk level */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Risk Level</span>
          <RiskBadge level={risk} />
        </div>

        {/* Failed attempts */}
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-3xl font-bold text-red-600">
            {lock.failed_attempts}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Failed Attempts
          </p>
        </div>

        {/* Lock info */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reason</span>
            <ReasonBadge reason={lock.lock_reason} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={status} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Locked</span>
            <span className="font-medium">{relTime(lock.locked_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Auto-Unlock</span>
            <span className="font-medium">
              {lock.auto_unlock_at &&
              new Date(lock.auto_unlock_at) > new Date()
                ? relFuture(lock.auto_unlock_at)
                : "Manual required"}
            </span>
          </div>
        </div>

        {/* Recent failed attempts timeline */}
        <div>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Recent Attempts
          </p>
          <div className="space-y-1.5">
            {recentAttempts.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs bg-muted/40 rounded px-2 py-1"
              >
                <span className="text-muted-foreground">{relTime(a.time)}</span>
                <span className="font-mono text-[10px]">{a.ip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Recent Locations
          </p>
          <div className="space-y-1.5">
            {LOCATIONS.map((loc) => (
              <div
                key={loc.city}
                className="flex items-center gap-2 text-xs bg-muted/40 rounded px-2 py-1"
              >
                <span>{toFlag(loc.code)}</span>
                <span>
                  {loc.city}, {loc.code}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unlock button */}
      <div className="p-4 border-t border-border">
        <Button
          className="w-full gap-1.5 bg-green-600 hover:bg-green-700 text-white"
          size="sm"
          disabled={isUnlocking}
          onClick={() => onUnlock(lock.uuid)}
        >
          <Unlock className="h-3.5 w-3.5" />
          {isUnlocking ? "Unlocking…" : "Unlock Account"}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Column helper ─────────────────────────────────────────────────────────────

const col = createColumnHelper<AccountLockEx>();

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AccountLocksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "locked_at", desc: true },
  ]);
  const [selected, setSelected] = useState<AccountLockEx | null>(null);
  const [unlockAllOpen, setUnlockAllOpen] = useState(false);

  // ── API queries ──────────────────────────────────────────────────────────────

  const { data: apiLocks, isLoading } = useQuery({
    queryKey: ["account-locks"],
    queryFn: getAccountLocks,
  });

  const locks = useMemo(() => (apiLocks ?? []).map(toLockEx), [apiLocks]);

  const unlockMutation = useMutation({
    mutationFn: (uuid: string) => unlockAccount(uuid),
    onSuccess: (_data, uuid) => {
      queryClient.invalidateQueries({ queryKey: ["account-locks"] });
      if (selected?.uuid === uuid) setSelected(null);
      toast.success("Account unlocked successfully");
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: "Failed to unlock account" });
    },
  });

  const unlockAllMutation = useMutation({
    mutationFn: () => unlockAllAccounts(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["account-locks"] });
      setSelected(null);
      setUnlockAllOpen(false);
      toast.success(`${data.unlocked_count} accounts unlocked`);
    },
    onError: (apiFailure) => {
      showApiError(apiFailure, { fallbackMessage: "Failed to unlock all accounts" });
    },
  });

  // ── Derived stats ────────────────────────────────────────────────────────────

  const highRiskCount = useMemo(
    () => locks.filter((l) => l.failed_attempts >= 6).length,
    [locks]
  );
  const pendingUnlockCount = useMemo(
    () =>
      locks.filter(
        (l) =>
          l.auto_unlock_at && new Date(l.auto_unlock_at) > new Date()
      ).length,
    [locks]
  );

  // ── Filtered rows ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return locks;
    return locks.filter(
      (l) =>
        l.user.name.toLowerCase().includes(q) ||
        l.user.email.toLowerCase().includes(q)
    );
  }, [locks, search]);

  // ── Column definitions ───────────────────────────────────────────────────────

  const columns = useMemo(
    () => [
      col.accessor("user", {
        id: "user",
        header: "User",
        enableSorting: false,
        cell: (info) => {
          const u = info.getValue();
          return (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-indigo-700">
                  {initials(u.name)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{u.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {u.email}
                </p>
              </div>
            </div>
          );
        },
      }),
      col.accessor("failed_attempts", {
        header: "Attempts",
        cell: (info) => {
          const v = info.getValue();
          return (
            <span
              className={cn(
                "inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded text-xs font-bold",
                v >= 6
                  ? "bg-red-600 text-white"
                  : "bg-red-100 text-red-700"
              )}
            >
              {v}
            </span>
          );
        },
      }),
      col.accessor("lock_reason", {
        header: "Reason",
        cell: (info) => <ReasonBadge reason={info.getValue()} />,
      }),
      col.accessor("ip_address", {
        header: "IP Address",
        cell: (info) => (
          <span className="font-mono text-[11px] text-muted-foreground">
            {info.getValue()}
          </span>
        ),
      }),
      col.accessor("locked_at", {
        header: "Locked",
        cell: (info) => (
          <span className="text-xs text-muted-foreground">
            {relTime(info.getValue())}
          </span>
        ),
      }),
      col.accessor("auto_unlock_at", {
        header: "Auto-Unlock",
        cell: (info) => {
          const v = info.getValue();
          if (!v || new Date(v) <= new Date())
            return (
              <span className="text-xs text-muted-foreground">Manual</span>
            );
          return (
            <span className="text-xs text-amber-600 font-medium">
              {relFuture(v)}
            </span>
          );
        },
      }),
      col.display({
        id: "status",
        header: "Status",
        cell: (info) => <StatusBadge status={deriveStatus(info.row.original)} />,
      }),
      col.display({
        id: "actions",
        header: "",
        cell: (info) => (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] gap-1 border-green-200 text-green-700 hover:bg-green-50 px-2"
            disabled={unlockMutation.isPending}
            onClick={(e) => {
              e.stopPropagation();
              unlockMutation.mutate(info.row.original.uuid);
            }}
          >
            <Unlock className="h-3 w-3" />
            Unlock
          </Button>
        ),
      }),
    ],
    [unlockMutation]
  );

  // ── Table instance ────────────────────────────────────────────────────────────

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* ── Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-600" />
            Account Locks
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and review locked user accounts across your organisation
          </p>
        </div>
        {locks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => setUnlockAllOpen(true)}
            disabled={unlockAllMutation.isPending}
          >
            <Unlock className="h-3.5 w-3.5" />
            Unlock All ({locks.length})
          </Button>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Locked Accounts"
          value={locks.length}
          icon={<Lock className="h-5 w-5" />}
          color="#DC2626"
          bg="#FEE2E2"
        />
        <KpiCard
          label="Failed Attempts Today"
          value={MOCK_FAILED_ATTEMPTS_TODAY}
          icon={<ShieldAlert className="h-5 w-5" />}
          color="#D97706"
          bg="#FEF3C7"
        />
        <KpiCard
          label="Auto-Unlocks Pending"
          value={pendingUnlockCount}
          icon={<Clock className="h-5 w-5" />}
          color="#7C3AED"
          bg="#EDE9FE"
        />
        <KpiCard
          label="High-Risk Locks"
          value={highRiskCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="#991B1B"
          bg="#FEE2E2"
        />
      </div>

      {/* ── Two-column body ── */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* ── Table column ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto rounded-xl border border-border bg-card shadow-sm">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Users className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground font-medium">
                  No locked accounts
                </p>
                <p className="text-xs text-muted-foreground">
                  {search
                    ? "No results match your search"
                    : "All accounts are currently active"}
                </p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr
                      key={hg.id}
                      className="border-b border-border bg-muted/30"
                    >
                      {hg.headers.map((h) => (
                        <th
                          key={h.id}
                          className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                        >
                          {h.isPlaceholder ? null : (
                            <div
                              className={cn(
                                "flex items-center gap-1",
                                h.column.getCanSort() &&
                                  "cursor-pointer select-none hover:text-foreground transition-colors"
                              )}
                              onClick={h.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                h.column.columnDef.header,
                                h.getContext()
                              )}
                              {h.column.getIsSorted() === "asc" && (
                                <ChevronUp className="h-3 w-3" />
                              )}
                              {h.column.getIsSorted() === "desc" && (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => {
                    const isHighRisk = row.original.failed_attempts >= 6;
                    const isSelected = selected?.uuid === row.original.uuid;
                    return (
                      <tr
                        key={row.id}
                        onClick={() =>
                          setSelected(
                            isSelected ? null : row.original
                          )
                        }
                        className={cn(
                          "border-b border-border/50 cursor-pointer transition-colors",
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/30"
                            : "hover:bg-muted/40",
                          isHighRisk && "border-l-2 border-l-red-600"
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-3 py-2.5">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Detail Panel ── */}
        <AnimatePresence>
          {selected && (
            <AccountLockDetailPanel
              key={selected.uuid}
              lock={selected}
              onUnlock={(uuid) => unlockMutation.mutate(uuid)}
              isUnlocking={unlockMutation.isPending}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Unlock All Dialog ── */}
      <AlertDialog open={unlockAllOpen} onOpenChange={setUnlockAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-red-600" />
              Unlock All Accounts
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately unlock all{" "}
              <strong>{locks.length} locked accounts</strong>. Users will
              regain access instantly. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unlockAllMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
              disabled={unlockAllMutation.isPending}
              onClick={() => unlockAllMutation.mutate()}
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  unlockAllMutation.isPending && "animate-spin"
                )}
              />
              {unlockAllMutation.isPending
                ? "Unlocking…"
                : "Confirm Unlock All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
