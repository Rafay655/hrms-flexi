"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Bell,
  BellDot,
  Loader2,
  AlertCircle,
  ChevronRight,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Notification {
  id: number;
  uuid: string;
  company_id: number;
  user_id: number;
  template_key: string;
  title: string;
  body: string;
  action_url: string | null;
  icon: string | null;
  category: string;
  is_read: boolean;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface InboxResponse {
  success: boolean;
  message: string;
  data: Notification[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ── API function ──────────────────────────────────────────────────────────────

const fetchInbox = async (): Promise<Notification[]> => {
  const { data } = await api.get<InboxResponse>("/notify-pro/inbox", {
    params: { per_page: 10 },
  });
  return data.data;
};

// ── Component ────────────────────────────────────────────────────────────────
// NOTE: this component no longer manages its own Pusher/Echo connection.
// The shared connection is initialized once by <RealtimeProvider> (see
// components/RealtimeProvider.tsx), which dispatches a
// "notification-received" CustomEvent on window whenever a new
// notification arrives. This component just listens for that event.
// This avoids creating a duplicate websocket connection per bell
// instance and keeps a single source of truth for the connection.

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["inbox-notifications"],
    queryFn: fetchInbox,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  // ── Listen for real-time notifications dispatched by RealtimeProvider ──

  useEffect(() => {
    const handleNewNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;

      console.log("🔔 [NotificationBell] notification-received:", data);
      refetch();

      toast.custom(
        (t) => (
          <div
            className={cn(
              "flex w-[360px] max-w-[92vw] items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg ring-1 ring-black/5 transition-all",
              t.visible
                ? "animate-in slide-in-from-top-2 fade-in"
                : "animate-out slide-out-to-right-4 fade-out"
            )}
          >
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E1B4B]/10">
              <BellDot className="h-4 w-4 text-[#1E1B4B]" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-900">
                {data?.title || "New notification"}
              </p>
              {data?.body && (
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-slate-500">
                  {data.body}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
        { duration: 4500 }
      );
    };

    window.addEventListener("notification-received", handleNewNotification);

    return () => {
      window.removeEventListener(
        "notification-received",
        handleNewNotification
      );
    };
  }, [refetch]);

  // ── UI handlers ─────────────────────────────────────────────────────────────

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleNotificationClick = (uuid: string) => {
    router.push(`/notify-pro/inbox/${uuid}`);
    setOpen(false);
  };

  const handleViewAll = () => {
    router.push("/notify-pro/inbox");
    setOpen(false);
  };

  const BellIcon = unreadCount > 0 ? BellDot : Bell;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
    

      <DropdownMenu open={open} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#322E53] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            aria-label="Notifications"
          >
            <BellIcon className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 px-0.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="font-sidebar w-[380px] max-w-[calc(100vw-24px)] overflow-hidden rounded-none border border-slate-200/80 bg-white p-0 shadow-lg shadow-slate-900/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-[13px] font-semibold text-slate-900">
              Notifications
            </h3>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleViewAll}
                className="text-xs font-medium text-[#1E1B4B] hover:underline"
              >
                View all
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[min(400px,60dvh)] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="mt-2 text-sm text-slate-500">
                  Failed to load notifications.
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-2 text-xs font-medium text-[#1E1B4B] hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  No notifications
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {notifications.map((notification) => (
                  <li key={notification.uuid}>
                    <button
                      type="button"
                      onClick={() =>
                        handleNotificationClick(notification.uuid)
                      }
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#322E53]/[0.04] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#322E53]",
                        !notification.is_read && "bg-[#322E53]/[0.025]"
                      )}
                    >
                      <span aria-hidden="true" className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${notification.is_read ? "bg-transparent" : "bg-[#322E53]"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[12px] font-medium leading-5 text-slate-800">
                          {notification.title}
                        </p>
                        {notification.body && (
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-slate-500">
                            {notification.body}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                          <span>
                            {formatDistanceToNow(
                              new Date(notification.created_at),
                              { addSuffix: true }
                            )}
                          </span>
                          {notification.icon && (
                            <>
                              <span className="inline-block h-1 w-1 rounded-full bg-slate-300" />
                              <span>📌 {notification.icon}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewAll}
                className="w-full justify-center gap-1 text-xs font-medium text-slate-600 hover:text-[#1E1B4B]"
              >
                View all notifications
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}