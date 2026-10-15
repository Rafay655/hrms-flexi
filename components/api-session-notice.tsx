"use client";
import { useEffect } from "react";
import { showApiError } from "@/lib/error-toast";

export function ApiSessionNotice() {
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("api-session-expired")) return;
      sessionStorage.removeItem("api-session-expired");
      showApiError({ response: { status: 401 } }, { id: "session-expired" });
    } catch { /* Session storage is optional. */ }
  }, []);
  return null;
}
