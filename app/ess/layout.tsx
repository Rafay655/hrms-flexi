/**
 * ESS Portal layout — URL prefix /ess.
 *
 * Static shell for now: no backend, no auth check, no data fetching. Renders
 * ESSShell (sidebar + topbar) around whatever page is routed into `children`.
 * All "me" data (name, role, employee id, company) lives as dummy data inside
 * ESSShell itself until there's a real GET /v1/ess/me to wire up.
 */

import React from "react";
import ESSShell from "./ESSShell";

export default function EssLayout({ children }: { children: React.ReactNode }) {
  return <ESSShell>{children}</ESSShell>;
}
