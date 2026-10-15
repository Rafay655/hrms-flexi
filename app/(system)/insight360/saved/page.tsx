"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ComponentType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FolderOpen,
  Info,
  LockKeyhole,
  Pin,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
  type LucideProps,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { insight360Service } from "@/services/insight360";
import type { Insight360SavedView, Insight360Share } from "@/types/insight360";
import {
  categoryDisplayName,
  ErrorPanel,
  LoadingPanel,
  reportDisplayName,
  ScopeIndicator,
} from "../_components/Insight360Ui";

type Tab = "saved" | "shared" | "all";
type IconComponent = ComponentType<LucideProps>;

const SUMMARY_STYLES = {
  purple: { border: "border-l-brand-700", icon: "bg-brand-100 text-brand-600" },
  orange: { border: "border-l-amber-400", icon: "bg-amber-50 text-amber-600" },
  lavender: { border: "border-l-brand-600", icon: "bg-brand-100 text-brand-600" },
  coral: { border: "border-l-rose-300", icon: "bg-rose-50 text-rose-500" },
} as const;

const PAGE_REFERENCE_TIME = Date.now();

function SummaryCard({ title, value, description, icon: Icon, tone }: { title: string; value: number; description: string; icon: IconComponent; tone: keyof typeof SUMMARY_STYLES }) {
  const style = SUMMARY_STYLES[tone];
  return <article className={`flex min-h-36 items-center gap-4 rounded-xl border border-gray-200 border-l-[3px] ${style.border} bg-white p-5 shadow-[0_1px_3px_rgba(30,26,58,0.04)]`}><span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${style.icon}`}><Icon aria-hidden="true" className="h-7 w-7" /></span><div><p className="text-sm font-semibold text-brand-900">{title}</p><p className="mt-1 text-3xl font-bold tracking-tight text-brand-900">{value.toLocaleString()}</p><p className="mt-2 text-xs leading-5 text-gray-600">{description}</p></div></article>;
}

function SelectFilter({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label htmlFor={id} className="relative block min-w-0 rounded-lg border border-gray-200 bg-white px-3 pt-1.5 focus-within:border-brand-700 focus-within:ring-2 focus-within:ring-brand-700/15"><span className="block text-xs font-medium leading-3 text-gray-600">{label}</span><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full cursor-pointer appearance-none bg-transparent pr-7 text-xs font-medium text-brand-900 outline-none">{children}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 h-3.5 w-3.5 text-brand-700" /></label>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function isExpiringSoon(share: Insight360Share, now = PAGE_REFERENCE_TIME): boolean {
  if (!share.expires_at) return false;
  const remaining = new Date(share.expires_at).getTime() - now;
  return remaining > 0 && remaining <= 7 * 24 * 60 * 60 * 1000;
}

function SavedTable({ items, onDelete }: { items: Insight360SavedView[]; onDelete: (view: Insight360SavedView) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[850px] table-fixed text-left text-xs"><caption className="sr-only">Reports saved by me</caption><thead className="border-b border-gray-200 bg-brand-100 text-brand-900"><tr><th className="w-[20%] px-5 py-3 font-semibold">Saved Report</th><th className="w-[18%] px-3 py-3 font-semibold">Base Report</th><th className="w-[12%] px-3 py-3 font-semibold">Category</th><th className="w-[15%] px-3 py-3 font-semibold">Configuration</th><th className="w-[13%] px-3 py-3 font-semibold">Saved Date</th><th className="w-[9%] px-3 py-3 font-semibold">State</th><th className="w-[9%] px-3 py-3 font-semibold">Action</th><th className="w-[4%] px-3 py-3"><span className="sr-only">Delete</span></th></tr></thead><tbody>{items.map((view) => <tr key={view.uuid} className="transition-colors border-b border-gray-200 last:border-b-0 hover:bg-brand-100"><td className="px-5 py-3"><span className="flex items-start gap-3"><Bookmark aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" /><span className="font-semibold leading-4 text-brand-900">{view.name}</span></span></td><td className="px-3 py-3 leading-4 text-gray-700">{reportDisplayName(view.report.name)}</td><td className="px-3 py-3 text-gray-700">{categoryDisplayName(view.report.category)}</td><td className="px-3 py-3"><span className="inline-flex rounded bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700">{view.filters.length} filter{view.filters.length === 1 ? "" : "s"} · {view.sorts.length} sort{view.sorts.length === 1 ? "" : "s"}</span></td><td className="px-3 py-3 text-gray-700">{formatDate(view.created_at)}</td><td className="px-3 py-3">{view.is_pinned ? <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"><Pin aria-hidden="true" className="h-3 w-3" />Pinned</span> : <span className="inline-flex rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Saved</span>}</td><td className="px-3 py-3"><Link href={`/insight360/definitions/${view.report.uuid}`} className="transition-colors inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold text-brand-700 hover:border-brand-600 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Continue</Link></td><td className="px-3 py-3"><button type="button" onClick={() => onDelete(view)} aria-label={`Delete ${view.name}`} className="transition-colors flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-gray-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"><Trash2 aria-hidden="true" className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>;
}

function SharedCard({ share, now = PAGE_REFERENCE_TIME }: { share: Insight360Share; now?: number }) {
  const expired = Boolean(share.expires_at && new Date(share.expires_at).getTime() <= now);
  return <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(30,26,58,0.04)]"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600"><Bookmark aria-hidden="true" className="h-4 w-4" /></span><div className="min-w-0"><h3 className="font-bold leading-5 text-brand-900">{reportDisplayName(share.report.name)}</h3>{isExpiringSoon(share) && <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-rose-700"><Clock3 aria-hidden="true" className="h-3 w-3" />Expiring soon</span>}</div></div><dl className="mt-4 space-y-2 text-xs"><div className="flex items-center justify-between gap-4"><dt className="inline-flex items-center gap-2 text-gray-600"><ShieldCheck aria-hidden="true" className="h-4 w-4" />Sensitivity</dt><dd className="font-medium capitalize text-brand-900">{share.report.sensitivity.replaceAll("_", " ")}</dd></div><div className="flex items-center justify-between gap-4"><dt className="inline-flex items-center gap-2 text-gray-600">{share.can_export ? <Download aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}Access rights</dt><dd className="font-medium text-brand-900">{share.can_export ? "Export allowed" : "View only"}</dd></div><div className="flex items-center justify-between gap-4"><dt className="inline-flex items-center gap-2 text-gray-600"><Clock3 aria-hidden="true" className="h-4 w-4" />Expiry</dt><dd className={`font-medium ${expired ? "text-red-700" : "text-brand-900"}`}>{share.expires_at ? formatDate(share.expires_at) : "No expiry"}</dd></div></dl><Link href={`/insight360/definitions/${share.report.uuid}`} aria-disabled={expired} className={`transition-colors mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md border px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${expired ? "pointer-events-none border-gray-200 bg-brand-100 text-gray-400" : "cursor-pointer border-brand-600 text-brand-700 hover:bg-brand-100"}`}>{expired ? "Access expired" : "Open shared report"}</Link></article>;
}

export default function Insight360SavedPage() {
  const queryClient = useQueryClient();
  const company = useAppSelector((state) => state.auth.company);
  const filterRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("saved");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [state, setState] = useState("all");
  const [rights, setRights] = useState("all");
  const [expiry, setExpiry] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Insight360SavedView | null>(null);
  const saved = useQuery({ queryKey: ["insight360", "saved-views"], queryFn: insight360Service.savedViews });
  const shared = useQuery({ queryKey: ["insight360", "shares", "received"], queryFn: insight360Service.receivedShares });
  const remove = useMutation({ mutationFn: insight360Service.deleteSavedView, onSuccess: () => { setDeleteTarget(null); queryClient.invalidateQueries({ queryKey: ["insight360", "saved-views"] }); } });

  const savedItems = useMemo(() => saved.data?.items ?? [], [saved.data?.items]);
  const sharedItems = useMemo(() => shared.data?.items ?? [], [shared.data?.items]);
  const categories = useMemo(() => Array.from(new Set(savedItems.map((item) => item.report.category))).sort((a, b) => categoryDisplayName(a).localeCompare(categoryDisplayName(b))), [savedItems]);
  const filteredSaved = useMemo(() => savedItems.filter((view) => {
    const term = query.trim().toLowerCase();
    return (!term || `${view.name} ${view.report.name} ${view.report.category}`.toLowerCase().includes(term)) && (category === "all" || view.report.category === category) && (state === "all" || (state === "pinned" ? view.is_pinned : !view.is_pinned));
  }).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "oldest" ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime() : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [savedItems, query, category, state, sort]);
  const filteredShared = useMemo(() => sharedItems.filter((share) => {
    const term = query.trim().toLowerCase();
    const expired = Boolean(share.expires_at && new Date(share.expires_at).getTime() <= PAGE_REFERENCE_TIME);
    const expiryMatch = expiry === "all" || (expiry === "expiring" && isExpiringSoon(share)) || (expiry === "none" && !share.expires_at) || (expiry === "active" && !expired);
    return (!term || share.report.name.toLowerCase().includes(term)) && (rights === "all" || (rights === "export" ? share.can_export : !share.can_export)) && expiryMatch;
  }), [sharedItems, query, rights, expiry]);
  const pinnedCount = savedItems.filter((item) => item.is_pinned).length;
  const expiringCount = sharedItems.filter(isExpiringSoon).length;
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredSaved.length / perPage));
  const safePage = Math.min(page, totalPages);
  const visibleSaved = filteredSaved.slice((safePage - 1) * perPage, safePage * perPage);

  if (saved.isLoading || shared.isLoading) return <div className="bg-white p-6"><LoadingPanel label="Loading your reports" /></div>;
  if (saved.error || shared.error) return <div className="bg-white p-6"><ErrorPanel message="Saved and shared reports could not be loaded." /></div>;

  return <div className="min-h-full bg-brand-100 text-brand-900"><div className="space-y-5">
    <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 xl:flex-row xl:items-center xl:justify-between"><div><h1 className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">My Reports</h1><p className="mt-1.5 text-sm text-gray-600">Resume saved report configurations and open reports shared with you.</p></div><div className="flex flex-wrap items-center gap-3"><ScopeIndicator companyName={company?.name} /><Link href="/insight360/catalogue" className="transition-colors inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><Search aria-hidden="true" className="h-4 w-4" />Find a Report</Link><button type="button" onClick={() => filterRef.current?.focus()} className="transition-colors inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><SlidersHorizontal aria-hidden="true" className="h-4 w-4" />Search or Filter</button></div></header>

    <section aria-label="My report summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SummaryCard title="Saved by Me" value={savedItems.length} description="Personal saved report configurations." icon={Bookmark} tone="purple" /><SummaryCard title="Pinned Reports" value={pinnedCount} description="Priority reports marked for quick access." icon={Pin} tone="orange" /><SummaryCard title="Shared with Me" value={sharedItems.length} description="Reports other authorised users shared with you." icon={Share2} tone="lavender" /><SummaryCard title="Expiring Shares" value={expiringCount} description="Shared access ending within the next seven days." icon={Clock3} tone="coral" /></section>

    <section aria-label="My reports navigation and filters"><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div className="flex overflow-x-auto"><button type="button" onClick={() => { setTab("saved"); setPage(1); }} className={`inline-flex min-h-12 min-w-52 cursor-pointer items-center justify-center gap-3 rounded-t-xl border px-5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${tab === "saved" ? "border-b-white border-gray-200 bg-white text-brand-700 shadow-[inset_0_3px_0_var(--brand-700)]" : "border-gray-200 bg-brand-100 text-gray-600"}`}><Bookmark aria-hidden="true" className="h-4 w-4" />Saved by Me <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs">{savedItems.length}</span></button><button type="button" onClick={() => { setTab("shared"); setPage(1); }} className={`inline-flex min-h-12 min-w-52 cursor-pointer items-center justify-center gap-3 rounded-t-xl border px-5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${tab === "shared" ? "border-b-white border-gray-200 bg-white text-brand-700 shadow-[inset_0_3px_0_var(--brand-700)]" : "border-gray-200 bg-brand-100 text-gray-600"}`}><Share2 aria-hidden="true" className="h-4 w-4" />Shared with Me <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs">{sharedItems.length}</span></button><button type="button" onClick={() => { setTab("all"); setPage(1); }} className={`inline-flex min-h-12 min-w-44 cursor-pointer items-center justify-center gap-3 rounded-t-xl border px-5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${tab === "all" ? "border-b-white border-gray-200 bg-white text-brand-700 shadow-[inset_0_3px_0_var(--brand-700)]" : "border-gray-200 bg-brand-100 text-gray-600"}`}><FolderOpen aria-hidden="true" className="h-4 w-4" />All Reports <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs">{savedItems.length + sharedItems.length}</span></button></div><p className="mb-3 flex max-w-md items-start gap-2 text-xs leading-5 text-gray-600"><Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />Saved views are personal configurations. Shared reports are provided by other authorised users.</p></div><div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-[0_3px_12px_rgba(30,26,58,0.05)] lg:grid-cols-[minmax(260px,1.6fr)_repeat(4,minmax(135px,0.8fr))] xl:grid-cols-[minmax(280px,1.8fr)_repeat(5,minmax(135px,0.8fr))]"><label className="relative"><span className="sr-only">Search my reports</span><Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" /><input ref={filterRef} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search saved-report or base-report name…" className="h-12 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-10 text-xs outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/15" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-1 top-0 flex h-12 w-10 cursor-pointer items-center justify-center"><X aria-hidden="true" className="h-4 w-4" /></button>}</label><SelectFilter id="my-category" label="Category" value={category} onChange={(value) => { setCategory(value); setPage(1); }}><option value="all">All categories</option>{categories.map((item) => <option key={item} value={item}>{categoryDisplayName(item)}</option>)}</SelectFilter><SelectFilter id="my-state" label="Saved State" value={state} onChange={(value) => { setState(value); setPage(1); }}><option value="all">All</option><option value="saved">Saved</option><option value="pinned">Pinned</option></SelectFilter><SelectFilter id="my-rights" label="Access Rights" value={rights} onChange={setRights}><option value="all">All</option><option value="view">View only</option><option value="export">Export allowed</option></SelectFilter><SelectFilter id="my-expiry" label="Expiry" value={expiry} onChange={setExpiry}><option value="all">All</option><option value="active">Active</option><option value="expiring">Expiring soon</option><option value="none">No expiry</option></SelectFilter><SelectFilter id="my-sort" label="Sort" value={sort} onChange={setSort}><option value="recent">Recently saved</option><option value="oldest">Oldest first</option><option value="name">Report name</option></SelectFilter></div></section>

    {(tab === "saved" || tab === "all") && <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]"><section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_3px_12px_rgba(30,26,58,0.05)]"><div className="border-b border-gray-200 px-5 py-4"><h2 className="text-base font-bold text-brand-900">Saved by Me ({filteredSaved.length})</h2></div>{filteredSaved.length === 0 ? <div className="p-10 text-center"><Bookmark aria-hidden="true" className="mx-auto h-8 w-8 text-brand-600" /><h3 className="mt-3 font-bold">No saved reports match</h3><p className="mt-1 text-sm text-gray-600">Save a report from its results page or change these filters.</p></div> : <SavedTable items={visibleSaved} onDelete={setDeleteTarget} />} {filteredSaved.length > 0 && <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-3 text-xs text-gray-600"><span>{(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filteredSaved.length)} of {filteredSaved.length} saved views</span><nav aria-label="Saved report pages" className="flex items-center gap-1"><button type="button" disabled={safePage === 1} onClick={() => setPage(Math.max(1, safePage - 1))} aria-label="Previous saved report page" className="transition-colors flex h-10 w-10 cursor-pointer items-center justify-center rounded-md hover:bg-brand-100 disabled:opacity-35"><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((item) => <button key={item} type="button" onClick={() => setPage(item)} aria-current={safePage === item ? "page" : undefined} className={`transition-colors flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-md px-2 font-semibold ${safePage === item ? "bg-brand-700 text-white" : "hover:bg-brand-100"}`}>{item}</button>)}<button type="button" disabled={safePage === totalPages} onClick={() => setPage(Math.min(totalPages, safePage + 1))} aria-label="Next saved report page" className="transition-colors flex h-10 w-10 cursor-pointer items-center justify-center rounded-md hover:bg-brand-100 disabled:opacity-35"><ChevronRight aria-hidden="true" className="h-4 w-4" /></button></nav></footer>}</section><aside className="rounded-xl border border-gray-200 bg-white shadow-[0_3px_12px_rgba(30,26,58,0.05)]"><div className="flex items-center justify-between border-b border-gray-200 px-4 py-4"><h2 className="font-bold">Shared with Me ({filteredShared.length})</h2><button type="button" onClick={() => setTab("shared")} className="min-h-9 cursor-pointer text-xs font-semibold text-brand-700 hover:underline">View all →</button></div><div className="space-y-3 p-3">{filteredShared.length === 0 ? <p className="p-4 text-center text-xs text-gray-600">No shared reports match.</p> : filteredShared.slice(0, 2).map((share) => <SharedCard key={share.uuid} share={share} />)}</div></aside></div>}

    {tab === "shared" && <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_3px_12px_rgba(30,26,58,0.05)]"><div className="flex items-center justify-between"><div><h2 className="text-base font-bold">Shared with Me ({filteredShared.length})</h2><p className="mt-1 text-xs text-gray-600">Access rights and expiry are controlled by the person who shared each report.</p></div><LockKeyhole aria-hidden="true" className="h-5 w-5 text-brand-600" /></div>{filteredShared.length === 0 ? <div className="p-10 text-center text-sm text-gray-600">No shared reports match these filters.</div> : <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredShared.map((share) => <SharedCard key={share.uuid} share={share} />)}</div>}</section>}

    {deleteTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}><section role="dialog" aria-modal="true" aria-labelledby="delete-saved-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-700"><Trash2 aria-hidden="true" className="h-5 w-5" /></div><h2 id="delete-saved-title" className="mt-4 text-lg font-bold">Delete saved report?</h2><p className="mt-2 text-sm leading-6 text-gray-600">“{deleteTarget.name}” will be removed from your saved reports. The underlying report will not be deleted.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDeleteTarget(null)} className="min-h-11 cursor-pointer rounded-lg border border-gray-200 px-4 text-sm font-semibold">Cancel</button><button type="button" onClick={() => remove.mutate(deleteTarget.uuid)} disabled={remove.isPending} className="transition-colors min-h-11 cursor-pointer rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50">{remove.isPending ? "Deleting…" : "Delete saved report"}</button></div></section></div>}
  </div></div>;
}
