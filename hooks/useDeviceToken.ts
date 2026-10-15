"use client";

import { useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { registerDeviceToken } from "@/services/device-tokens";
import { useAuth } from "@/hooks/useAuth";
import { getMessaging, getToken } from "firebase/messaging";
import { app } from "@/lib/firebase";
import { UAParser } from "ua-parser-js";

interface DeviceInfo {
  platform: "web";
  device_name: string;
  device_model: string;
  os_version: string;
  app_version: string;
}

/**
 * Fallback parser using the raw UA string.
 * Note: on modern Chromium browsers (esp. Android), the UA string is
 * "frozen"/reduced by the browser itself for privacy reasons, so
 * os_version and device_model may come back generic (e.g. "10", "K").
 * This is a browser-level limitation, not a parsing bug.
 */
function getDeviceInfoFromUA(): DeviceInfo {
  let device_name = "Web Browser";
  let device_model = "Web";
  let os_version = "";

  if (typeof navigator !== "undefined") {
    const parser = new UAParser(navigator.userAgent);
    const result = parser.getResult();

    const browserName = result.browser.name || "Browser";
    const osName = result.os.name || "";
    const osVer = result.os.version || "";

    // result.device holds vendor/model/type (e.g. "Samsung" / "SM-G991B")
    const deviceVendor = result.device.vendor || "";
    const deviceModel = result.device.model || "";

    device_name = `${browserName} on ${osName}`.trim();
    device_model =
      [deviceVendor, deviceModel].filter(Boolean).join(" ") ||
      osName ||
      navigator.platform ||
      "Web";
    os_version = osVer;
  }

  return {
    platform: "web",
    device_name,
    device_model,
    os_version,
    app_version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  };
}

/**
 * Preferred path: User-Agent Client Hints (Chromium only).
 * Returns the REAL device model + OS version, since these are
 * deliberate opt-in high-entropy values, unlike the frozen UA string.
 * Falls back to UA-string parsing on unsupported browsers (Safari, Firefox)
 * or if the call fails for any reason.
 */
async function getDeviceInfo(): Promise<DeviceInfo> {
  const fallback = getDeviceInfoFromUA();

  if (typeof navigator === "undefined") return fallback;

  const uaData = (navigator as any).userAgentData;
  if (!uaData?.getHighEntropyValues) return fallback;

  try {
    const hints = await uaData.getHighEntropyValues([
      "model",
      "platformVersion",
      "platform",
      "fullVersionList",
    ]);

    const model: string | undefined = hints.model || undefined;
    const platformVersion: string | undefined = hints.platformVersion || undefined;
    const platformName: string | undefined = hints.platform || undefined;

    return {
      ...fallback,
      device_model: model && model.trim() ? model.trim() : fallback.device_model,
      os_version: platformVersion || fallback.os_version,
      device_name:
        platformName && fallback.device_name
          ? fallback.device_name.replace(/on .+$/, `on ${platformName}`)
          : fallback.device_name,
    };
  } catch {
    // Client Hints denied/unsupported at runtime — use UA-string fallback
    return fallback;
  }
}

export function useDeviceToken() {
  const { user, isAuthenticated } = useAuth();

  const mutation = useMutation({
    mutationFn: registerDeviceToken,
    onSuccess: () => console.log("Device token registered."),
    onError: (error) => console.error("Failed to register device token:", error),
  });

  const { mutate: sendToken } = mutation;

  const registerToken = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const messaging = getMessaging(app);

    try {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      if (!token) return;

      const info = await getDeviceInfo();
      console.log("[useDeviceToken] registering with info:", info); // TEMP DEBUG
      sendToken({
        token,
        platform: info.platform,
        device_name: info.device_name,
        device_model: info.device_model,
        os_version: info.os_version,
        app_version: info.app_version,
      });
    } catch (err) {
      console.warn("Failed to get FCM token:", err);
    }
  }, [isAuthenticated, user, sendToken]);

  useEffect(() => {
    registerToken();
  }, [registerToken]);

  // Token refresh listener
 useEffect(() => {
  if (!isAuthenticated) return;   // 👈 prevent listener on public pages
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const messaging = getMessaging(app);
  if (!messaging) return;

  const unsubscribe = (messaging as any).onTokenChanged?.(
    async (newToken: string | null) => {
      if (newToken) {
        const info = await getDeviceInfo();
        sendToken({
          token: newToken,
          platform: info.platform,
          device_name: info.device_name,
          device_model: info.device_model,
          os_version: info.os_version,
          app_version: info.app_version,
        });
      }
    }
  );

  return () => {
    if (typeof unsubscribe === "function") unsubscribe();
  };
}, [isAuthenticated, sendToken]);   // 👈 include isAuthenticated

  return { registerToken };
}
