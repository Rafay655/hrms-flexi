"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConnectCentralRoot() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/connect-central/security");
  }, [router]);

  return null;
}
