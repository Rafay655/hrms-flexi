"use client";

/**
 * _components/DeviceIcon.tsx
 * Renders the appropriate Lucide icon for a session device_type.
 *
 * device_type values (from UserSession):
 *   "web"    → Monitor (laptop/desktop browser)
 *   "mobile" → Smartphone
 *   "api"    → Code2 (API token / SDK)
 *   "cli"    → Terminal
 */

import React from "react";
import { Monitor, Smartphone, Code2, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeviceType } from "@/lib/api/connect-central/sessions";

type Props = {
  deviceType: DeviceType;
  className?: string;
  size?: number;
};

const ICON_MAP: Record<DeviceType, React.ElementType> = {
  web: Monitor,
  mobile: Smartphone,
  api: Code2,
  cli: Terminal,
};

const LABEL_MAP: Record<DeviceType, string> = {
  web: "Browser",
  mobile: "Mobile",
  api: "API",
  cli: "CLI",
};

export default function DeviceIcon({
  deviceType,
  className,
  size = 16,
}: Props) {
  const Icon = ICON_MAP[deviceType] ?? Monitor;
  const label = LABEL_MAP[deviceType] ?? deviceType;

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-muted-foreground", className)}
      title={label}
    >
      <Icon style={{ width: size, height: size }} />
      <span className="text-xs">{label}</span>
    </span>
  );
}
