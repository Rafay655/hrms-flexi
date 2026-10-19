"use client";

/** Shared pieces of the FlexiDesk settings screens (flexidesk.settings.manage). */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const fieldInput = "w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
export const primaryButton = "rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
export const secondaryButton = "rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

const TABS = [
  { href: "/flexi-desk/settings/categories", label: "Categories" },
  { href: "/flexi-desk/settings/routing", label: "Routing rules" },
  { href: "/flexi-desk/settings/sla", label: "SLA" },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings" className="flex gap-1 border-b border-gray-200">
      {TABS.map((t) => {
        const active = pathname?.startsWith(t.href);

        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined} className={`-mb-px border-b-2 px-3 py-2 text-sm ${active ? "border-indigo-600 font-medium text-indigo-700" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} role="alert" className="mt-1 text-xs text-red-700">{message}</p> : null;
}

/** A labelled field. The label wraps the control so it is announced, and an error is tied to it. */
export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-gray-500">
      {label}
      <div className="mt-1 text-sm text-gray-900">{children}</div>
      {hint && !error && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
      <FieldError id={`${label}-error`} message={error} />
    </label>
  );
}

export function SettingsShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      <header>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-600">{intro}</p>
      </header>
      <SettingsTabs />
      {children}
    </div>
  );
}
