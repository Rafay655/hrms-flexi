import React from "react";

/**
 * SystemFlex module shell — pass-through.
 *
 * Navigation is provided by the shared (system) sidebar, which swaps to the
 * System Flex menu via the URL→activeModuleId sync (see components/ui/Sidebar.tsx).
 * The module-local <SFNav /> was removed to eliminate the duplicate sidebar
 * (matches the ConnectCentral pattern).
 */
export default function SystemFlexLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
