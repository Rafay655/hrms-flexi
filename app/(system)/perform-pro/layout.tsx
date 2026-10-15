"use client";

import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

export default function PerformProLayout({ children }: { children: ReactNode }) {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const loaded = permissions.length > 0;
  const hasAccess = permissions.some((permission) => permission.startsWith("performpro."));

  if (loaded && !hasAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <section className="max-w-lg rounded-3xl border border-brand-300 bg-white p-8 text-center shadow-sm">
          <ShieldAlert aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-brand-700" />
          <h1 className="text-xl font-semibold text-brand-900">PerformPro access required</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Ask an administrator to grant the appropriate PerformPro permissions, then sign in again.
          </p>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
