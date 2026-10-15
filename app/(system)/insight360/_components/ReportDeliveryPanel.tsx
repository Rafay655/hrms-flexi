"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookmarkPlus, CalendarClock, FileSpreadsheet, FileText, Send, X } from "lucide-react";
import { insight360Service } from "@/services/insight360";
import type { Insight360Export, Insight360Filter } from "@/types/insight360";

interface Props {
  reportUuid: string;
  filters: Insight360Filter[];
}

const inputClass = "min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900 outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-300";

export function ReportDeliveryPanel({ reportUuid, filters }: Props) {
  const queryClient = useQueryClient();
  const [panel, setPanel] = useState<"save" | "share" | null>(null);
  const [viewName, setViewName] = useState("");
  const [pinned, setPinned] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [allowExport, setAllowExport] = useState(false);
  const recipients = useQuery({ queryKey: ["insight360", "recipients"], queryFn: insight360Service.recipients, enabled: panel === "share" });

  const exportMutation = useMutation({
    mutationFn: (format: Insight360Export["format"]) => insight360Service.requestExport(reportUuid, { format, filters }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["insight360", "exports"] }),
  });
  const saveMutation = useMutation({
    mutationFn: () => insight360Service.saveView(reportUuid, { name: viewName.trim(), filters, is_pinned: pinned }),
    onSuccess: () => { setViewName(""); setPanel(null); queryClient.invalidateQueries({ queryKey: ["insight360", "saved-views"] }); },
  });
  const shareMutation = useMutation({
    mutationFn: () => insight360Service.shareReport(reportUuid, { recipient_user_id: Number(recipientId), can_export: allowExport }),
    onSuccess: () => { setRecipientId(""); setAllowExport(false); setPanel(null); },
  });

  return (
    <section aria-label="Report actions" className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <span className="px-2 text-sm font-semibold text-gray-700">Download</span>
        {([
          { format: "xlsx" as const, label: "Excel", icon: FileSpreadsheet },
          { format: "pdf" as const, label: "PDF", icon: FileText },
          { format: "csv" as const, label: "CSV", icon: FileText },
        ]).map(({ format, label, icon: Icon }) => (
          <button key={format} type="button" onClick={() => exportMutation.mutate(format)} disabled={exportMutation.isPending} className="transition-colors inline-flex min-h-10 items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 text-sm font-semibold text-brand-800 hover:border-brand-300 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-50"><Icon aria-hidden="true" className="h-4 w-4" />{exportMutation.isPending && exportMutation.variables === format ? "Preparing…" : label}</button>
        ))}
        <span aria-hidden="true" className="mx-1 hidden h-7 w-px bg-gray-200 sm:block" />
        <button type="button" onClick={() => setPanel(panel === "save" ? null : "save")} className="transition-colors inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-brand-800 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><BookmarkPlus aria-hidden="true" className="h-4 w-4" /> Save</button>
        <button type="button" onClick={() => setPanel(panel === "share" ? null : "share")} className="transition-colors inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-brand-800 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><Send aria-hidden="true" className="h-4 w-4" /> Share</button>
        <Link href={`/insight360/schedules?report=${encodeURIComponent(reportUuid)}`} className="transition-colors inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-brand-800 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><CalendarClock aria-hidden="true" className="h-4 w-4" /> Schedule</Link>
      </div>

      {(exportMutation.isSuccess || exportMutation.isError) && <div className={`border-t px-5 py-3 text-sm ${exportMutation.isSuccess ? "border-emerald-100 bg-emerald-50 text-emerald-900" : "border-rose-100 bg-rose-50 text-rose-900"}`}>{exportMutation.isSuccess ? <span>Your file is being prepared. <Link href="/insight360/exports" className="font-semibold underline">Open downloads</Link></span> : "The file could not be prepared. Please try again."}</div>}

      {panel === "save" && (
        <form onSubmit={(event) => { event.preventDefault(); if (viewName.trim()) saveMutation.mutate(); }} className="border-t border-gray-200 bg-brand-100 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-brand-900">Save this view</h2><p className="mt-1 text-sm text-gray-600">Your current filters will be remembered.</p></div><button type="button" onClick={() => setPanel(null)} aria-label="Close save panel" className="transition-colors flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><X aria-hidden="true" className="h-4 w-4" /></button></div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-semibold text-gray-800">Name<input autoFocus required maxLength={120} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder="For example, Monthly attendance review" className={`mt-1.5 ${inputClass}`} /></label><label className="flex min-h-11 items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={pinned} onChange={(event) => setPinned(event.target.checked)} className="h-4 w-4 accent-brand-700" />Pin to overview</label><button type="submit" disabled={!viewName.trim() || saveMutation.isPending} className="transition-colors min-h-11 rounded-xl bg-brand-800 px-5 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-50">{saveMutation.isPending ? "Saving…" : "Save view"}</button></div>
          {saveMutation.isError && <p role="alert" className="mt-3 text-sm text-rose-700">This view could not be saved.</p>}
        </form>
      )}

      {panel === "share" && (
        <form onSubmit={(event) => { event.preventDefault(); if (recipientId) shareMutation.mutate(); }} className="border-t border-gray-200 bg-brand-100 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-brand-900">Share securely</h2><p className="mt-1 text-sm text-gray-600">Only colleagues who already have permission to see this data can open it.</p></div><button type="button" onClick={() => setPanel(null)} aria-label="Close share panel" className="transition-colors flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><X aria-hidden="true" className="h-4 w-4" /></button></div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-semibold text-gray-800">Colleague<select autoFocus required value={recipientId} onChange={(event) => setRecipientId(event.target.value)} className={`mt-1.5 ${inputClass}`}><option value="">Select a colleague</option>{(recipients.data ?? []).map((person) => <option key={person.id} value={person.id}>{person.name} · {person.email}</option>)}</select></label><label className="flex min-h-11 items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={allowExport} onChange={(event) => setAllowExport(event.target.checked)} className="h-4 w-4 accent-brand-700" />Allow downloads</label><button type="submit" disabled={!recipientId || shareMutation.isPending} className="transition-colors min-h-11 rounded-xl bg-brand-800 px-5 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-50">{shareMutation.isPending ? "Sharing…" : "Share report"}</button></div>
          {shareMutation.isError && <p role="alert" className="mt-3 text-sm text-rose-700">This colleague may not have access to the report data.</p>}
        </form>
      )}
    </section>
  );
}
