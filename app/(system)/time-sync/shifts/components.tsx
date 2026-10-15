"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import {
  ArrowRightLeft,
  Briefcase,
  Calendar,
  Clock3,
  FileText,
  GitBranch,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { cx } from "./utils";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-3xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", className)}>{children}</span>;
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  const sizes = size === "sm" ? "h-9 px-3 text-xs" : "h-10 px-4 text-sm";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        sizes,
        variants[variant]
      )}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
      />
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className="min-h-[100px] w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cx("relative h-6 w-11 rounded-full transition", checked ? "bg-slate-900" : "bg-slate-200")}
      >
        <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-white transition", checked ? "left-5" : "left-0.5")} />
      </button>
    </label>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 md:p-8">
      <div className="w-full max-w-5xl rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">{footer}</div>
      </div>
    </div>
  );
}

const navItems = [
  { href: "/time-sync/overview", label: "Overview", icon: Briefcase },
  { href: "/time-sync/master", label: "Shift Master", icon: Clock3 },
  { href: "/time-sync/templates", label: "Templates", icon: GitBranch },
  { href: "/time-sync/rosters", label: "Rosters", icon: Calendar },
  { href: "/time-sync/entries", label: "Roster Entries", icon: FileText },
  { href: "/time-sync/swaps", label: "Swap Requests", icon: ArrowRightLeft },
  { href: "/time-sync/assignments", label: "Assignments", icon: UserCheck },
  { href: "/time-sync/rules", label: "Rules", icon: ShieldCheck },
];

export function ModuleShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white md:p-8">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">{subtitle}</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition",
                  active ? "bg-slate-900 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
