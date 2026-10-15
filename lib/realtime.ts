import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Laravel Echo needs Pusher available on window when using the
// 'reverb' broadcaster (Reverb speaks the Pusher protocol).
if (typeof window !== "undefined") {
  (window as any).Pusher = Pusher;
}

let echo: Echo<any> | null = null;
let currentUserId: number | string | null = null;

export function initRealtime(authToken: string, userId: number | string) {
  if (typeof window === "undefined") return null;

  // Avoid tearing down and recreating the connection if nothing changed
  // (e.g. component re-renders calling this again with the same user).
  if (echo && currentUserId === userId) {
    return echo;
  }

  if (echo) {
    echo.disconnect();
    echo = null;
  }

  echo = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost:
      process.env.NEXT_PUBLIC_REVERB_HOST || "flexiapi.myflexihr.com",
    // NOTE: currently plain ws:// on port 8080 — no TLS in front of
    // Reverb yet. Switch to wsPort/wssPort 443 + forceTLS: true once
    // SSL is set up on the Reverb server.
  wsPort: 443,
wssPort: 443,
forceTLS: true,
enabledTransports: ["wss"],
    authEndpoint: "https://flexiapi.myflexihr.com/api/broadcasting/auth",
    auth: {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    },
  });

  currentUserId = userId;

  const channel = echo.private(`user.${userId}`);

  // 🧪 DEBUG — confirm the private channel subscription actually
  // succeeds (not just that Echo/Pusher connected). Access the
  // underlying pusher-js channel/connection via the connector.
  const pusherConnector = (echo.connector as any)?.pusher;

  if (pusherConnector) {
    pusherConnector.connection.bind("state_change", (states: any) => {
      console.log(
        "🔌 [realtime] connection state:",
        states.previous,
        "->",
        states.current
      );
    });

    pusherConnector.connection.bind("error", (err: any) => {
      console.error("🚨 [realtime] connection error", err);
    });

    const rawChannel = pusherConnector.channel(`private-user.${userId}`);
    if (rawChannel) {
      rawChannel.bind("pusher:subscription_succeeded", () => {
        console.log(
          "✅ [realtime] Subscription succeeded for private-user." + userId
        );
      });
      rawChannel.bind("pusher:subscription_error", (status: any) => {
        console.error(
          "❌ [realtime] Subscription FAILED for private-user." + userId,
          status
        );
      });
    }
  } else {
    console.warn(
      "⚠️ [realtime] Could not access underlying pusher connector for debug binds"
    );
  }

  channel.listen(".notification.created", (data: any) => {
    console.log("🔔 [realtime] notification.created received:", data);
    window.dispatchEvent(
      new CustomEvent("notification-received", { detail: data })
    );
  });

  console.log(`✅ [realtime] Reverb connected for user ${userId}`);

  return echo;
}

export function disconnectRealtime() {
  if (echo) {
    echo.disconnect();
    echo = null;
    currentUserId = null;
    console.log("🔌 [realtime] Disconnected");
  }
}

export function getEcho() {
  return echo;
}
