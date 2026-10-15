"use client";

/**
 * InboxDrawer — Slide-in notification inbox panel.
 *
 * Built on shadcn Sheet (Radix Dialog). Opens from the right.
 * Width: 420px on sm+; full-width on mobile.
 *
 * Features:
 *   - 5 category tabs: All / Approvals / HR / Payroll / System
 *   - TanStack Query for inbox data + mark-read / delete mutations
 *   - Unread indicator dot per notification; bold title for unread
 *   - "Mark all read" button in header (visible only when unread exist)
 *   - Per-item delete (Trash icon, visible on group-hover)
 *   - Load-more pagination (page-based, 20 per page)
 *   - Skeleton loading state + empty state with icon
 *   - Focus trap via Radix Dialog; Escape closes the sheet natively
 *
 * Accessibility:
 *   - Tabs use role="tablist" / role="tab" / aria-selected / aria-controls
 *   - Notification list is role="list" / role="listitem"
 *   - Each notification button has a descriptive aria-label
 *   - All icon-only buttons have aria-label
 *   - focus-visible rings on every interactive element
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckSquare2,
  Users,
  Banknote,
  Cpu,
  X,
  CheckCheck,
  Trash2,
  Loader2,
  Inbox,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { notifyProService } from "@/services/notify-pro.service";
import type { InAppNotification, NotificationCategory } from "@/types/notify-pro";

// ── Tab configuration ─────────────────────────────────────────────────────────

type TabKey = "all" | NotificationCategory;

interface TabConfig {
  key: TabKey;
  label: string;
  Icon: React.ElementType;
  /** Tailwind classes for the icon bubble in notification cards */
  bubbleClass: string;
}

const TABS: TabConfig[] = [
  {
    key: "all",
    label: "All",
    Icon: Bell,
    bubbleClass: "text-slate-500 bg-slate-100",
  },
  {
    key: "approval",
    label: "Approvals",
    Icon: CheckSquare2,
    bubbleClass: "text-indigo-600 bg-indigo-50",
  },
  {
    key: "hr",
    label: "HR",
    Icon: Users,
    bubbleClass: "text-purple-600 bg-purple-50",
  },
  {
    key: "payroll",
    label: "Payroll",
    Icon: Banknote,
    bubbleClass: "text-emerald-600 bg-emerald-50",
  },
  {
    key: "system",
    label: "System",
    Icon: Cpu,
    bubbleClass: "text-amber-600 bg-amber-50",
  },
];

/** Lookup by category key for notification card icons. */
const CATEGORY_MAP = Object.fromEntries(
  TABS.filter((t) => t.key !== "all").map((t) => [t.key, t]),
) as Record<NotificationCategory, TabConfig>;

const PER_PAGE = 20;

// ── InboxDrawer ───────────────────────────────────────────────────────────────

interface InboxDrawerProps {
  open: boolean;
  onClose: () => void;
}

const InboxDrawer: React.FC<InboxDrawerProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // ── Tab change — reset page ─────────────────────────────────────────────
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setPage(1);
  };

  // ── Inbox query ─────────────────────────────────────────────────────────
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["notify-pro", "inbox", activeTab, page],
    queryFn: () =>
      notifyProService.getInbox({
        page,
        per_page: PER_PAGE,
        ...(activeTab !== "all" ? { category: activeTab } : {}),
      }),
    enabled: open,
    staleTime: 15_000,
  });

  const notifications: InAppNotification[] = data?.data ?? [];
  const hasMore =
    (data?.meta.current_page ?? 1) < (data?.meta.last_page ?? 1);

  // ── Shared invalidation ─────────────────────────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notify-pro", "inbox"] });
    queryClient.invalidateQueries({ queryKey: ["notify-pro", "unread-count"] });
  };

  // ── Mutations ───────────────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: notifyProService.markRead,
    onSuccess: invalidate,
  });

  const markAllMutation = useMutation({
    mutationFn: notifyProService.markAllRead,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: notifyProService.deleteNotification,
    onSuccess: invalidate,
  });

  // ── Derived ─────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const hasUnread = unreadCount > 0;

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleItemClick = (notification: InAppNotification) => {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.uuid);
    }
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <SheetHeader className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-base font-semibold text-[#1E1B4B]">
              Notifications
            </SheetTitle>
            {hasUnread && (
              <span
                aria-label={`${unreadCount} unread`}
                className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white"
              >
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Mark all read */}
            {hasUnread && (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                aria-label="Mark all as read"
                title="Mark all as read"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#1E1B4B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B] disabled:opacity-50"
              >
                {markAllMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Close */}
            <SheetClose asChild>
              <button
                type="button"
                aria-label="Close notifications"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#1E1B4B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B]"
              >
                <X className="h-4 w-4" />
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* ── Category Tabs ───────────────────────────────────────────────── */}
        <div
          role="tablist"
          aria-label="Notification categories"
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-100 px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                aria-controls="np-inbox-panel"
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B]",
                  isActive
                    ? "bg-[#1E1B4B] text-white"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                <tab.Icon className="h-3 w-3" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Notification List ───────────────────────────────────────────── */}
        <div
          id="np-inbox-panel"
          role="tabpanel"
          aria-label={`${TABS.find((t) => t.key === activeTab)?.label ?? "All"} notifications`}
          className="flex-1 overflow-y-auto"
        >
          {isLoading ? (
            <LoadingSkeleton />
          ) : notifications.length === 0 ? (
            <EmptyState category={activeTab} />
          ) : (
            <ul role="list" className="divide-y divide-slate-50">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.uuid}
                  notification={notification}
                  onClick={handleItemClick}
                  onDelete={(uuid) => deleteMutation.mutate(uuid)}
                  isDeleting={
                    deleteMutation.variables === notification.uuid &&
                    deleteMutation.isPending
                  }
                />
              ))}

              {/* Load more */}
              {hasMore && (
                <li className="flex justify-center py-5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isFetching}
                    className="flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#1E1B4B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B] disabled:opacity-60"
                  >
                    {isFetching ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      "Load more"
                    )}
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── NotificationItem ──────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: InAppNotification;
  onClick: (n: InAppNotification) => void;
  onDelete: (uuid: string) => void;
  isDeleting: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  onDelete,
  isDeleting,
}) => {
  const tabCfg =
    CATEGORY_MAP[notification.category] ?? CATEGORY_MAP["system"];
  const Icon = tabCfg?.Icon ?? Bell;
  const bubbleClass = tabCfg?.bubbleClass ?? "text-slate-500 bg-slate-100";

  return (
    <li
      className={cn(
        "group relative flex items-start gap-3 px-5 py-4 transition-colors",
        notification.is_read
          ? "bg-white hover:bg-slate-50/50"
          : "bg-indigo-50/30 hover:bg-indigo-50/60",
      )}
    >
      {/* Unread dot */}
      {!notification.is_read && (
        <span
          aria-hidden="true"
          className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#1E1B4B]"
        />
      )}

      {/* Category icon bubble */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          bubbleClass,
        )}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content — full-width clickable area */}
      <button
        type="button"
        className="min-w-0 flex-1 cursor-pointer text-left focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#1E1B4B]"
        onClick={() => onClick(notification)}
        aria-label={`${notification.title}${!notification.is_read ? " (unread)" : ""}`}
      >
        <p
          className={cn(
            "truncate text-sm leading-snug",
            notification.is_read
              ? "font-normal text-slate-700"
              : "font-semibold text-[#1E1B4B]",
          )}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {notification.body}
        </p>
        <time
          dateTime={notification.created_at}
          className="mt-1 block text-[10px] text-slate-400"
        >
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </time>
      </button>

      {/* Dismiss button — appears on group hover / focus */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.uuid);
        }}
        disabled={isDeleting}
        aria-label={`Dismiss: ${notification.title}`}
        className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-400 group-hover:opacity-100 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-400 disabled:pointer-events-none"
      >
        {isDeleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </li>
  );
};

// ── Loading Skeleton ──────────────────────────────────────────────────────────

const LoadingSkeleton: React.FC = () => (
  <div aria-label="Loading notifications" className="divide-y divide-slate-50">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="flex animate-pulse items-start gap-3 px-5 py-4"
      >
        <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-2 w-1/4 rounded bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  category: TabKey;
}

const EmptyState: React.FC<EmptyStateProps> = ({ category }) => {
  const label =
    category === "all"
      ? "No notifications yet."
      : `No ${TABS.find((t) => t.key === category)?.label.toLowerCase() ?? category} notifications.`;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <Inbox className="h-8 w-8 text-slate-400" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">All caught up</p>
        <p className="mt-1 text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
};

export default InboxDrawer;
