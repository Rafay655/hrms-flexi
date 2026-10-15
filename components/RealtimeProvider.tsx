"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store/store";
import { initRealtime, disconnectRealtime } from "@/lib/realtime";

/**
 * Mount this ONCE near the root of the authenticated app (e.g. in
 * DashboardShell or a top-level layout) — not inside NotificationBell,
 * so only a single Echo/Reverb connection is ever created regardless
 * of how many components want to react to notifications.
 */
export default function RealtimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = useAppSelector((state: RootState) => state.auth.token);
  const userId = useAppSelector((state: RootState) => state.auth.user?.id);

  useEffect(() => {
    if (!token || !userId) return;

    initRealtime(token, userId);

    // Mobile browsers (Android Chrome especially) aggressively suspend
    // background tabs, which can silently break the WebSocket's
    // heartbeat without a clean disconnect event ever firing. When the
    // tab becomes visible again, force a fresh reconnect so we don't
    // sit on a zombie connection that looks "connected" in old state
    // but no longer actually receives broadcasts.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log(
          "👁️ [RealtimeProvider] Tab visible again — forcing realtime reconnect"
        );
        // Force a fresh connection rather than relying on initRealtime's
        // dedup check (which would skip reconnecting since userId is
        // unchanged) — the old connection may be a stale zombie even
        // though userId hasn't changed.
        disconnectRealtime();
        initRealtime(token, userId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      disconnectRealtime();
    };
  }, [token, userId]);

  return <>{children}</>;
}