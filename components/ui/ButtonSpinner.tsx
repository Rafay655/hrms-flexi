"use client";

import React from "react";

export default function ButtonSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={[
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white",
        className,
      ].join(" ")}
      aria-label="Loading"
    />
  );
}