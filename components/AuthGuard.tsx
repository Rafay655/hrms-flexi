"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

const PUBLIC_PREFIXES = [
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export default function AuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    const isPublic = PUBLIC_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );

    // Do NOT redirect if we are on a public page
    if (!token && !isPublic) {
      router.replace("/auth/login");
    }

    if (token && pathname.startsWith("/auth/login")) {
      router.replace("/flexi-hq");
    }
  }, [token, pathname, router]);

  return null;
}