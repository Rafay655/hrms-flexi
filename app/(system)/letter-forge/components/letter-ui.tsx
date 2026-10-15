import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { label } from "@/lib/generated-letter-state";

export const primaryButton = "bg-[#1E1B4B] text-white hover:bg-[#2A2675]";
export const fieldClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50";
export function LetterPageHeader({ title, description, back, children }: { title: string; description: string; back?: { href: string; label: string }; children?: ReactNode }) {
  return <header className="space-y-4">{back && <Link className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-700" href={back.href}><ArrowLeft size={15} />{back.label}</Link>}<div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-start gap-3"><div className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><FileText size={24} /></div><div><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">Letter Forge</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p></div></div>{children && <div className="flex flex-wrap gap-2">{children}</div>}</div></header>;
}
export function LetterPanel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div><div className="p-5">{children}</div></section>;
}
export function LetterStatus({ status }: { status: string }) {
  const tone = ["dispatched", "signed", "acknowledged", "published"].includes(status) ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : ["failed", "rejected", "revoked", "recalled"].includes(status) ? "bg-rose-50 text-rose-700 ring-rose-200" : status.startsWith("pending") || status === "review_required" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-indigo-50 text-indigo-700 ring-indigo-200";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${tone}`}>{label(status)}</span>;
}
export function LetterError({ message, retry }: { message: string; retry?: () => void }) {
  return <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={18} /><span className="flex-1">{message}</span>{retry && <Button variant="outline" size="sm" onClick={retry}>Try again</Button>}</div>;
}
export function LetterEmpty({ title, description }: { title: string; description: string }) {
  return <div className="flex flex-col items-center gap-2 py-14 text-center"><FileText className="mb-2 text-slate-300" size={36} /><h2 className="font-semibold text-slate-800">{title}</h2><p className="max-w-md text-sm text-slate-500">{description}</p></div>;
}
export function letterDate(value?: string | null) { return value ? new Date(value).toLocaleString() : "—"; }
