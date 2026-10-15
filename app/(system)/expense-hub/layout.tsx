"use client";

/**
 * ExpenseHub module shell — pass-through with an access gate (mirrors LoanHub).
 * Any expense.* / expense-*.manage / travel.request permission grants access.
 */

import React from "react";
import { useAppSelector } from "@/store/hooks";

function hasExpenseAccess(p: string): boolean {
  return p.startsWith("expense.") || p.startsWith("expense-") || p === "travel.request";
}

export default function ExpenseHubLayout({ children }: { children: React.ReactNode }) {
  const permissions = useAppSelector((state) => state.auth.permissions);

  const permissionsLoaded = permissions.length > 0;
  const hasAccess = permissions.some(hasExpenseAccess);

  if (permissionsLoaded && !hasAccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-10 text-center">
        <h2 className="text-lg font-semibold text-brand-900">ExpenseHub access required</h2>
        <p className="max-w-md text-sm text-gray-500">
          Your account doesn&apos;t have any ExpenseHub permission. Ask an administrator to grant an{" "}
          <code className="rounded bg-gray-100 px-1 text-brand-700">expense.*</code> permission (for example{" "}
          <code className="rounded bg-gray-100 px-1 text-brand-700">expense.claim</code>), then sign out and back in.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
