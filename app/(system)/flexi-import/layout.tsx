"use client";

/**
 * FlexiImport module shell — pass-through with an access gate.
 *
 * Navigation is provided by the shared (system) sidebar (URL→activeModuleId sync,
 * see components/ui/Sidebar.tsx); the module-local <FINav /> was removed to
 * eliminate the duplicate sidebar (matches the ConnectCentral pattern).
 *
 * The permission gate is preserved: users without any FlexiImport permission are
 * redirected away once the Redux auth store has populated (an empty permissions
 * array is treated as "not yet loaded" to avoid a premature redirect).
 */

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";

const FI_PERMISSIONS = [
  "bulk-import",
  "view-import-history",
  "approve-import-batch",
  "manage-import-templates",
] as const;

export default function FlexiImportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const permissions = useAppSelector((state) => state.auth.permissions);

  const permissionsLoaded = permissions.length > 0;
  const hasAccess = permissions.some((p) =>
    (FI_PERMISSIONS as readonly string[]).includes(p)
  );

  useEffect(() => {
    if (permissionsLoaded && !hasAccess) {
      toast.error("Import management requires HR access.");
      router.replace("/flexi-hq");
    }
  }, [permissionsLoaded, hasAccess, router]);

  // Suppress render while redirecting to avoid a flash of module content.
  if (permissionsLoaded && !hasAccess) return null;

  return <>{children}</>;
}
