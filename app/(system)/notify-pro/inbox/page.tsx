"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  useDeleteNotification,
  useInbox,
  useMarkAllRead,
  useMarkRead,
  useUnreadCount,
} from "@/hooks/useNotifyPro";
import type {
  InAppNotification,
  NotificationCategory,
} from "@/types/notify-pro";

// ── Constants ─────────────────────────────────────────────────────────────────

const PER_PAGE_OPTIONS = [10, 15, 25, 50];
const DEFAULT_PER_PAGE = 10;

type CategoryTab = { key: string; label: string };

const CATEGORY_TABS: CategoryTab[] = [
  { key: "all",      label: "All"       },
  { key: "approval", label: "Approvals" },
  { key: "hr",       label: "HR"        },
  { key: "payroll",  label: "Payroll"   },
  { key: "leave",    label: "Leave"     },
  { key: "system",   label: "System"    },
  { key: "security", label: "Security"  },
];

// ── Category colour config ─────────────────────────────────────────────────────

type CategoryCfg = {
  label: string;
  bg:    string;
  text:  string;
  dot:   string;
};

const CATEGORY_CONFIG: Record<NotificationCategory | string, CategoryCfg> = {
  approval: { label: "Approval", bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500"   },
  hr:       { label: "HR",       bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500"    },
  payroll:  { label: "Payroll",  bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  leave:    { label: "Leave",    bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500"  },
  system:   { label: "System",   bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400"   },
  security: { label: "Security", bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"     },
};

const DEFAULT_CFG: CategoryCfg = {
  label: "Notification",
  bg:    "bg-gray-100",
  text:  "text-gray-600",
  dot:   "bg-gray-400",
};

function getCategoryCfg(category: string): CategoryCfg {
  return CATEGORY_CONFIG[category] ?? DEFAULT_CFG;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function InboxSkeleton() {
  return (
    <div
      className="space-y-2"
      aria-busy="true"
      aria-label="Loading notifications…"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 rounded bg-slate-200" />
              <div className="h-3 w-24 rounded bg-slate-100" />
            </div>
            <div className="h-4 w-3/5 rounded bg-slate-200" />
            <div className="h-3 w-4/5 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ category }: { category: string }) {
  const isAll = category === "all";
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        {isAll ? (
          <BellOff className="h-6 w-6 text-slate-400" aria-hidden />
        ) : (
          <Bell className="h-6 w-6 text-slate-400" aria-hidden />
        )}
      </div>
      <p className="mt-3 text-sm font-medium text-slate-700">
        {isAll ? "All caught up!" : "No notifications here"}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {isAll
          ? "You have no notifications right now."
          : `You have no ${category} notifications at this time.`}
      </p>
    </div>
  );
}

interface NotificationCardProps {
  notification:    InAppNotification;
  onMarkRead:      (uuid: string) => void;
  onDelete:        (uuid: string) => void;
  isMarkPending:   boolean;
  isDeletePending: boolean;
}

function NotificationCard({
  notification: n,
  onMarkRead,
  onDelete,
  isMarkPending,
  isDeletePending,
}: NotificationCardProps) {
  const cfg    = getCategoryCfg(n.category);
  const timeAgo = formatDistanceToNow(new Date(n.created_at), { addSuffix: true });

  const handleMarkRead = () => {
    if (!n.is_read) onMarkRead(n.uuid);
  };

  return (
    <li
      // Entire card is keyboard-activatable for mark-as-read when unread
      role="listitem"
      tabIndex={n.is_read ? undefined : 0}
      onClick={handleMarkRead}
      onKeyDown={(e) => {
        if (!n.is_read && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleMarkRead();
        }
      }}
      aria-label={`${n.is_read ? "" : "Unread: "}${n.title}`}
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border p-4 transition-all duration-150 outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#1E1B4B] focus-visible:ring-offset-1",
        n.is_read
          ? "border-slate-200 bg-slate-50/40"
          : [
              "border-[#1E1B4B]/15 bg-white shadow-sm shadow-[#1E1B4B]/5",
              "cursor-pointer hover:border-[#1E1B4B]/25 hover:shadow-md hover:shadow-[#1E1B4B]/8",
            ],
      )}
    >
      {/* ── Unread indicator dot ───────────────────────────────────── */}
      <div className="mt-1.5 shrink-0">
        {n.is_read ? (
          <span
            className="block h-2 w-2 rounded-full border border-slate-200 bg-transparent"
            aria-hidden
          />
        ) : (
          <span
            className={cn("block h-2 w-2 rounded-full", cfg.dot)}
            aria-label="Unread"
          />
        )}
      </div>

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="min-w-0 flex-1 pr-14">
        {/* Category badge + relative time */}
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none",
              cfg.bg,
              cfg.text,
            )}
          >
            {cfg.label}
          </span>
          <span
            className="text-[10px] text-slate-400"
            title={new Date(n.created_at).toLocaleString()}
          >
            {timeAgo}
          </span>
        </div>

        {/* Title */}
        <p
          className={cn(
            "text-sm leading-snug",
            n.is_read
              ? "font-normal text-slate-500"
              : "font-semibold text-slate-800",
          )}
        >
          {n.title}
        </p>

        {/* Body — 2-line clamp */}
        {n.body && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {n.body}
          </p>
        )}

        {/* Action link — stop propagation so li's mark-read doesn't double-fire */}
        {n.action_url && (
          <Link
            href={n.action_url}
            onClick={(e) => {
              e.stopPropagation();
              if (!n.is_read) onMarkRead(n.uuid);
            }}
            className="mt-2 inline-flex items-center gap-0.5 text-xs font-medium text-[#1E1B4B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B] focus-visible:ring-offset-1"
          >
            View details →
          </Link>
        )}
      </div>

      {/* ── Hover / focus actions (positioned absolute, top-right) ─── */}
      <div
        className={cn(
          "absolute right-3 top-3 flex items-center gap-0.5",
          "opacity-0 transition-opacity duration-150",
          "group-hover:opacity-100 group-focus-within:opacity-100",
        )}
      >
        {!n.is_read && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(n.uuid);
            }}
            disabled={isMarkPending}
            aria-label="Mark as read"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 disabled:cursor-wait"
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(n.uuid);
          }}
          disabled={isDeletePending}
          aria-label="Dismiss notification"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 disabled:cursor-wait"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
      </div>
    </li>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function getPageWindow(current: number, last: number): (number | "ellipsis")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages = new Set<number>([1, last, current, current - 1, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= last)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(p);
  });
  return result;
}

const PageIconButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, label, children }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-30"
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent side="top">{label}</TooltipContent>
  </Tooltip>
);

interface InboxPaginationProps {
  page: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

const InboxPagination: React.FC<InboxPaginationProps> = ({
  page,
  lastPage,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
}) => {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const pageWindow = useMemo(() => getPageWindow(page, lastPage), [page, lastPage]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <p className="text-xs text-slate-500">
          Showing <span className="font-medium text-slate-700">{from}</span>–
          <span className="font-medium text-slate-700">{to}</span> of{" "}
          <span className="font-medium text-slate-700">{total}</span> notifications
        </p>
        <div className="h-4 w-px bg-slate-200" />
        <Select value={String(perPage)} onValueChange={(v) => onPerPageChange(Number(v))}>
          <SelectTrigger className="h-8 w-[104px] rounded-lg border-slate-200 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PER_PAGE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {lastPage > 1 && (
        <div className="flex items-center gap-1">
          <PageIconButton onClick={() => onPageChange(1)} disabled={page <= 1} label="First page">
            <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>
          <PageIconButton onClick={() => onPageChange(page - 1)} disabled={page <= 1} label="Previous page">
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>

          <div className="mx-1 flex items-center gap-1">
            {pageWindow.map((p, i) =>
              p === "ellipsis" ? (
                <span key={`e-${i}`} className="px-1.5 text-xs text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={cn(
                    "h-8 min-w-8 rounded-lg px-2.5 text-xs font-medium transition-colors",
                    p === page ? "bg-[#1E1B4B] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <PageIconButton onClick={() => onPageChange(page + 1)} disabled={page >= lastPage} label="Next page">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>
          <PageIconButton onClick={() => onPageChange(lastPage)} disabled={page >= lastPage} label="Last page">
            <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
          </PageIconButton>
        </div>
      )}
    </div>
  );
};

// ── Page Component ─────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [category, setCategory] = useState("all");
  const [page,     setPage]     = useState(1);
  const [perPage,  setPerPage]  = useState(DEFAULT_PER_PAGE);

  useEffect(() => { setPage(1); }, [category]);
  useEffect(() => { setPage(1); }, [perPage]);

  const { data: inbox, isLoading } = useInbox({
    page,
    per_page: perPage,
    category: category === "all" ? undefined : category,
  });

  const { data: unreadCount = 0 } = useUnreadCount();

  const { mutate: markRead,    isPending: isMarkPending    } = useMarkRead();
  const { mutate: markAllRead, isPending: isMarkingAll     } = useMarkAllRead();
  const { mutate: deleteNotif, isPending: isDeletePending  } = useDeleteNotification();

  const notifications = inbox?.data ?? [];
  const meta          = inbox?.meta;
  const totalItems    = meta?.total ?? 0;
  const lastPage      = meta?.last_page ?? 1;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="mx-auto max-w-3xl space-y-5 pb-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Title + live unread badge */}
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#1E1B4B]">Inbox</h1>
            {unreadCount > 0 && (
              <span
                aria-live="polite"
                aria-atomic="true"
                className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#1E1B4B] px-1.5 text-[10px] font-bold leading-none text-white"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          {/* Mark all as read */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead()}
            disabled={unreadCount === 0 || isMarkingAll}
            className={cn(
              "cursor-pointer gap-1.5 rounded-xl text-xs font-medium text-[#1E1B4B]",
              "hover:bg-[#1E1B4B]/5 focus-visible:ring-2 focus-visible:ring-[#1E1B4B] focus-visible:ring-offset-2",
              (unreadCount === 0 || isMarkingAll) && "cursor-not-allowed opacity-50",
            )}
          >
            {isMarkingAll ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Marking…
              </>
            ) : (
              <>
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                Mark all as read
              </>
            )}
          </Button>
        </div>

        <div
          role="tablist"
          aria-label="Notification categories"
          className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
        >
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={category === tab.key}
              aria-controls="inbox-list"
              onClick={() => setCategory(tab.key)}
              className={cn(
                "shrink-0 cursor-pointer whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B] focus-visible:ring-offset-1",
                category === tab.key
                  ? "bg-[#1E1B4B] text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section
          id="inbox-list"
          role="tabpanel"
          aria-label={`${CATEGORY_TABS.find((t) => t.key === category)?.label ?? category} notifications`}
        >
          {isLoading ? (
            <InboxSkeleton />
          ) : notifications.length === 0 ? (
            <EmptyState category={category} />
          ) : (
            <ul role="list" className="space-y-2">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.uuid}
                  notification={notification}
                  onMarkRead={markRead}
                  onDelete={deleteNotif}
                  isMarkPending={isMarkPending}
                  isDeletePending={isDeletePending}
                />
              ))}
            </ul>
          )}
        </section>

        {!isLoading && notifications.length > 0 && (
          <InboxPagination
            page={page}
            lastPage={lastPage}
            total={totalItems}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
        )}
      </div>
    </TooltipProvider>
  );
}