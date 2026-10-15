"use client";

import { useDeviceToken } from "@/hooks/useDeviceToken";

export function DeviceTokenProvider({ children }: { children: React.ReactNode }) {
  useDeviceToken(); // simply runs the registration effect
  return <>{children}</>;
}