// hooks/useAuthRedirect.ts
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const PUBLIC_PREFIXES = ["/auth/login", "/auth/forgot-password", "/auth/reset-password"];

function getCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function useAuthRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getCookie("accessToken");
    const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

    if (!token && !isPublic) {
      router.replace("/auth/login");
    }
    if (token && pathname.startsWith("/auth/login")) {
      router.replace("/flexi-hq");
    }
  }, [pathname, router]);
}