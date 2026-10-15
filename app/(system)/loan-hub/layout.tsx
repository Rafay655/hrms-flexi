"use client";

/**
 * LoanHub module shell — pass-through with an access gate (matches the FlexiImport
 * pattern). Navigation is provided by the shared (system) sidebar.
 *
 * Any LoanHub permission grants access (employees reach the ESS pages via
 * loanhub.loan.view-own). An empty permissions array is treated as "not yet loaded"
 * to avoid a premature redirect before the Redux auth store hydrates.
 */

import React from "react";
import { useAppSelector } from "@/store/hooks";

const LOAN_PERMISSION_PREFIX = "loanhub.";

export default function LoanHubLayout({ children }: { children: React.ReactNode }) {
  const permissions = useAppSelector((state) => state.auth.permissions);

  const permissionsLoaded = permissions.length > 0;
  const hasAccess = permissions.some((p) => p.startsWith(LOAN_PERMISSION_PREFIX));

  // Show a clear, in-place message instead of bouncing to the "/" landing page (which
  // looked like a random "back to login / click-me" redirect). The user stays in the
  // app shell and is told exactly what's missing + how to fix it.
  if (permissionsLoaded && !hasAccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-10 text-center">
        <h2 className="text-lg font-semibold text-brand-900">LoanHub access required</h2>
        <p className="max-w-md text-sm text-gray-500">
          Your account doesn&apos;t have any LoanHub permission. Ask an administrator to grant a{" "}
          <code className="rounded bg-gray-100 px-1 text-brand-700">loanhub.*</code> permission
          (for example <code className="rounded bg-gray-100 px-1 text-brand-700">loanhub.loan.view-own</code>),
          then sign out and back in.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
