import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, FolderOpen, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProjectEdgeStatePanel({
  kind,
  title,
  description,
  action,
}: {
  kind: "empty" | "error" | "access";
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  const icons: Record<typeof kind, LucideIcon> = {
    empty: FolderOpen,
    error: AlertTriangle,
    access: LockKeyhole,
  };
  const Icon = icons[kind];

  return (
    <section className="pe-card border border-dashed px-6 py-14 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-600">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      {action ? (
        action.href ? (
          <Button asChild className="mt-5 min-h-11">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button className="mt-5 min-h-11" onClick={action.onClick}>{action.label}</Button>
        )
      ) : null}
    </section>
  );
}
