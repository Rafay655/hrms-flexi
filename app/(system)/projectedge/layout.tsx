"use client";

import type { ReactNode } from "react";
import { ProjectEdgeStatePanel } from "@/components/projectedge/StatePanel";
import { useAppSelector } from "@/store/hooks";
import "./projectedge.css";

export default function ProjectEdgeLayout({ children }: { children: ReactNode }) {
  const authenticated = useAppSelector((state) => Boolean(state.auth.user || state.auth.token));
  const permissions = useAppSelector((state) => state.auth.permissions);
  const hasAccess = permissions.some((permission) => permission.startsWith("projectedge."));

  if (authenticated && !hasAccess) {
    return (
      <div className="projectedge-shell min-w-0">
        <ProjectEdgeStatePanel
          kind="access"
          title="ProjectEdge access required"
          description="Your account does not currently have a ProjectEdge permission. Ask an administrator to grant the appropriate project access, then sign in again."
        />
      </div>
    );
  }

  return (
    <div className="projectedge-shell min-w-0">
      <a
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 motion-reduce:transition-none"
        href="#projectedge-main"
      >
        Skip to ProjectEdge content
      </a>
      <div className="min-w-0 scroll-mt-24 focus:outline-none" id="projectedge-main" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
