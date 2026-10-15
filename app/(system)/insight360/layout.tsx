"use client";

import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

export default function Insight360Layout({ children }: { children: ReactNode }) {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const permissionsLoaded = permissions.length > 0;
  const hasAccess = permissions.some((permission) => permission.startsWith("insight360."));

  if (permissionsLoaded && !hasAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <section className="max-w-lg rounded-xl border border-brand-300 bg-white p-8 text-center shadow-sm">
          <ShieldAlert aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-brand-700" />
          <h1 className="text-xl font-semibold text-brand-900">Insight360 access required</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Ask an administrator to grant the <code className="rounded bg-brand-100 px-1.5 py-0.5 text-brand-800">insight360.view</code> permission, then sign out and back in.
          </p>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
