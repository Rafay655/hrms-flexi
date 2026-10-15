"use client";

/**
 * NotificationBell — Global bell icon with unread badge.
 *
 * Sits in DashboardHeader (every authenticated page). Polls
 * GET /api/v1/notify-pro/inbox/unread-count every 30 seconds.
 * On click, opens InboxDrawer (Radix Dialog-based Sheet).
 *
 * Accessibility:
 *   - aria-label reflects live unread count
 *   - aria-haspopup="dialog" signals the drawer to screen readers
 *   - focus-visible ring matches brand colour
 */

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { notifyProService } from "@/services/notify-pro.service";
import InboxDrawer from "./InboxDrawer";

const NotificationBell: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Poll unread count every 30 s; refetch when the tab regains focus.
  const { data: count = 0 } = useQuery({
    queryKey: ["notify-pro", "unread-count"],
    queryFn: notifyProService.getUnreadCount,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });

  // Cap badge at 99+; hide when zero.
  const displayCount = count > 99 ? "99+" : count > 0 ? String(count) : null;

  const ariaLabel =
    count > 0
      ? `Notifications — ${count > 99 ? "99+" : count} unread`
      : "Notifications — no unread";

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-[#1E1B4B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E1B4B] focus-visible:ring-offset-2 md:flex"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />

        {/* Unread badge — hidden when count is zero */}
        {displayCount && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white"
          >
            {displayCount}
          </span>
        )}
      </button>

      <InboxDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};

export default NotificationBell;
