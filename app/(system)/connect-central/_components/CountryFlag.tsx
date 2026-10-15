"use client";

/**
 * _components/CountryFlag.tsx
 * Renders a country flag emoji + the country name derived from an IP address.
 *
 * In production, pass `countryCode` (ISO 3166-1 alpha-2) and optionally
 * `countryName`. The flag is derived by converting the code to regional
 * indicator Unicode characters (e.g. "PK" → 🇵🇰).
 *
 * When no country data is available, renders a globe emoji as fallback.
 */

import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** ISO 3166-1 alpha-2 code, e.g. "PK", "US", "GB". */
  countryCode?: string | null;
  /** Human-readable country name, e.g. "Pakistan". */
  countryName?: string | null;
  /** IP address — shown as tooltip or fallback label. */
  ipAddress?: string;
  className?: string;
};

/**
 * Converts a 2-letter ISO country code to its flag emoji.
 * Works by mapping each ASCII letter to the corresponding Regional Indicator Symbol.
 */
function codeToFlag(code: string): string {
  const base = 0x1f1e6 - 65; // 'A'.charCodeAt(0) = 65
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(base + c.charCodeAt(0)))
    .join("");
}

export default function CountryFlag({
  countryCode,
  countryName,
  ipAddress,
  className,
}: Props) {
  if (!countryCode) {
    return (
      <span
        className={cn("inline-flex items-center gap-1 text-sm", className)}
        title={ipAddress}
      >
        🌐 {ipAddress ?? "Unknown"}
      </span>
    );
  }

  const flag = codeToFlag(countryCode);
  const label = countryName ?? countryCode;

  return (
    <span
      className={cn("inline-flex items-center gap-1 text-sm", className)}
      title={ipAddress ? `${label} — ${ipAddress}` : label}
    >
      <span aria-label={`Flag of ${label}`}>{flag}</span>
      <span>{label}</span>
    </span>
  );
}
