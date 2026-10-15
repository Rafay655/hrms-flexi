"use client";
import { showApiError } from "@/lib/error-toast";
import { useRef, useState } from "react";
import Link from "next/link";
import { downloadLetter } from "@/services/generated-letters";
import { LetterViewModal, LetterStatusModal } from "./letter-view-modals";
import { Check, X, Eye, FileText, MoreVertical, RefreshCw, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SearchableSelect from "@/components/ui/searchable-select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useGeneratedLetters } from "@/hooks/use-generated-letters";
import { useBatchEmployees } from "@/hooks/use-letter-batches";
import { useLetterAccess } from "@/hooks/use-letter-forge";
import { REGISTERED_TEMPLATE_KEYS } from "@/types/letter-forge";
import type { LetterFilters, LetterRecord } from "@/types/generated-letters";
import { LETTER_STATUSES, label, letterTitle, letterActions } from "@/lib/generated-letter-state";
import { getLetterForgeError } from "@/services/letter-forge";
import { cn } from "@/lib/utils";
import { LetterError, LetterStatus, letterDate } from "./letter-ui";
import { LetterApprovalDialog } from "./letter-approval-dialog";

export function GeneratedLettersDirectory() {
  const [filters, setFilters] = useState<LetterFilters>({ page: 1, per_page: 25 });
  const [decision, setDecision] = useState<{ letter: LetterRecord; action: "approve" | "reject" } | null>(null);
  const [modal, setModal] = useState<{ uuid: string; mode: "view" | "status" } | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const downloadLock = useRef(false);
  async function download(letter: LetterRecord) {
    if (downloadLock.current) return;
    downloadLock.current = true; setDownloading(letter.uuid);
    try { await downloadLetter(letter.uuid, `${letter.template_key}-${letter.uuid}.pdf`); }
    catch (error) { showApiError(error); }
    finally { downloadLock.current = false; setDownloading(null); }
  }
  const access = useLetterAccess();
  const employees = useBatchEmployees();
  const query = useGeneratedLetters(filters);
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const page = meta?.current_page ?? filters.page ?? 1;
  const pages = Math.max(1, meta?.last_page ?? 1);
  const total = meta?.total ?? rows.length;
  const from = rows.length ? meta?.from ?? ((page - 1) * (meta?.per_page ?? filters.per_page ?? 25) + 1) : 0;
  const to = rows.length ? meta?.to ?? (from + rows.length - 1) : 0;
  const first = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, index) => first + index);
  const busy = query.isFetching || !meta;
  const hasFilters = Boolean(filters.status || filters.template_key || filters.employee_id);
  function filter(patch: Partial<LetterFilters>) { setFilters((previous) => ({ ...previous, ...patch, page: 1 })); }
  if (meta && meta.current_page > pages && filters.page !== pages) setFilters({ ...filters, page: pages });
  return <div className="p-3"><Card className="border border-gray-100 shadow-sm"><CardHeader className="border-b"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><CardTitle className="text-2xl font-semibold text-gray-900">Letters Directory</CardTitle><p className="mt-1 text-sm text-gray-500">{total.toLocaleString()} letters</p></div><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className={cn("mr-2 h-4 w-4", query.isFetching && "animate-spin")} />Refresh</Button>{access.canGenerateLetters && <Button asChild size="sm" className="bg-[#1E1B4B] hover:bg-[#2A2675]"><Link href="/letter-forge/templates">Choose template</Link></Button>}</div></div></CardHeader>
    <CardContent className="space-y-4 p-6"><div className="flex flex-wrap items-center gap-3">
      <SearchableSelect aria-label="Filter by employee" allLabel="All employees" searchPlaceholder="Search employee name or code…" widthClass="w-full sm:w-72" value={filters.employee_id ? String(filters.employee_id) : ""} onChange={(value) => filter({ employee_id: value ? Number(value) : undefined })} options={(employees.data ?? []).map((employee) => ({ value: String(employee.id), label: `${employee.name} · ${employee.employee_code}` }))} isLoading={employees.isPending} />
      <SearchableSelect aria-label="Filter by status" allLabel="All statuses" value={filters.status ?? ""} onChange={(value) => filter({ status: value || undefined })} options={LETTER_STATUSES.map((value) => ({ value, label: label(value) }))} />
      <SearchableSelect aria-label="Filter by letter type" allLabel="All letter types" widthClass="w-full sm:w-64" value={filters.template_key ?? ""} onChange={(value) => filter({ template_key: value || undefined })} options={REGISTERED_TEMPLATE_KEYS.map((item) => ({ value: item.key, label: item.label }))} />
      <div className="ml-auto flex items-center gap-2 text-sm text-gray-600"><span>Show</span><SearchableSelect aria-label="Letters per page" allowAll={false} widthClass="w-28" value={String(filters.per_page ?? 25)} onChange={(value) => filter({ per_page: Number(value) })} options={[10, 25, 50, 100].map((value) => ({ value: String(value), label: String(value) }))} /><span>entries</span></div>
      {hasFilters && <Button variant="ghost" size="sm" onClick={() => setFilters({ page: 1, per_page: filters.per_page })}>Clear filters</Button>}
    </div>{employees.error && <LetterError message={`Employee filter: ${getLetterForgeError(employees.error).message}`} retry={() => void employees.refetch()} />}{query.error && <LetterError message={getLetterForgeError(query.error).message} retry={() => void query.refetch()} />}
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-600"><span>Showing <strong className="text-gray-900">{from}</strong> to <strong className="text-gray-900">{to}</strong> of <strong className="text-gray-900">{total.toLocaleString()}</strong> entries</span>{query.isFetching && <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50"><Loader2 className="h-3 w-3 animate-spin" />Loading…</Badge>}</div>
    <div className="overflow-hidden rounded-lg border border-gray-200" aria-busy={query.isFetching}><div className="overflow-x-auto"><table className="w-full min-w-[1100px]"><caption className="sr-only">Generated letters</caption><thead className="border-b border-gray-200 bg-gray-50"><tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700">{["SR. NO.", "Letter", "Employee", "Language", "Status", "Delivery", "Created", "Actions"].map((heading) => <th key={heading} scope="col" className={cn("px-6 py-3", heading === "Actions" && "text-right")}>{heading}</th>)}</tr></thead><tbody className="divide-y divide-gray-100 bg-white">{query.isPending ? <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Loading letters…</p></td></tr> : !rows.length ? <tr><td colSpan={8} className="py-12 text-center"><FileText className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-2 font-medium">{query.isError ? "Unable to load letters" : "No letters found"}</p><p className="text-sm text-muted-foreground">{hasFilters ? "Try another selection or clear your filters." : "Generate a letter from the template action menu."}</p></td></tr> : rows.map((letter, index) => <tr key={letter.uuid} className="group text-sm transition-colors hover:bg-gray-50"><td className="px-6 py-4 font-medium text-muted-foreground">{from + index}</td><td className="px-6 py-4"><div className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-muted-foreground" /><div><button type="button" className="block max-w-[260px] truncate text-left font-semibold text-gray-900 hover:underline" title={letterTitle(letter)} onClick={() => setModal({ uuid: letter.uuid, mode: "view" })}>{letterTitle(letter)}</button><p className="mt-0.5 text-xs text-muted-foreground">{letter.template_key}</p></div></div></td><td className="px-6 py-4"><p>{letter.employee?.name ?? `Employee #${letter.employee_id}`}</p><p className="mt-0.5 text-xs text-muted-foreground">{letter.employee?.employee_code}</p></td><td className="px-6 py-4 uppercase text-muted-foreground">{letter.language}</td><td className="px-6 py-4"><LetterStatus status={letter.status} />{letter.error_message && <p className="mt-1 max-w-60 text-xs text-amber-700">{letter.error_message}</p>}</td><td className="px-6 py-4 capitalize text-muted-foreground">{letter.dispatch_channel ? label(letter.dispatch_channel) : "—"}</td><td className="px-6 py-4 text-muted-foreground">{letterDate(letter.created_at)}</td><td className="px-6 py-4 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${letter.uuid}`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-44"><DropdownMenuItem onSelect={() => setModal({ uuid: letter.uuid, mode: "view" })}><Eye className="mr-2 h-4 w-4" />View details</DropdownMenuItem><DropdownMenuItem disabled={!letterActions(letter).download || Boolean(downloading)} onSelect={() => void download(letter)}><Download className="mr-2 h-4 w-4" />{letter.artifacts_expired_at ? "Artifact expired" : downloading === letter.uuid ? "Downloading…" : "Download PDF"}</DropdownMenuItem><DropdownMenuItem onSelect={() => setModal({ uuid: letter.uuid, mode: "status" })}><Activity className="mr-2 h-4 w-4" />Poll status</DropdownMenuItem>{letter.status === "pending_approval" && access.can("approve-letters") && <><DropdownMenuItem onSelect={() => setDecision({ letter, action: "approve" })}><Check className="mr-2 h-4 w-4" />Approve</DropdownMenuItem><DropdownMenuItem className="text-destructive" onSelect={() => setDecision({ letter, action: "reject" })}><X className="mr-2 h-4 w-4" />Reject</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu></td></tr>)}</tbody></table></div></div>
    <div className="flex flex-col items-center justify-between gap-4 rounded-b-lg border-t border-gray-200 bg-gray-50 px-6 py-4 md:flex-row"><p className="text-sm text-gray-600">Page <strong className="text-gray-900">{page}</strong> of <strong className="text-gray-900">{pages}</strong></p><div className="flex flex-wrap items-center justify-center gap-2"><Button variant="outline" size="sm" aria-label="First page" disabled={busy || page <= 1} onClick={() => setFilters({ ...filters, page: 1 })}><ChevronsLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" aria-label="Previous page" disabled={busy || page <= 1} onClick={() => setFilters({ ...filters, page: page - 1 })}><ChevronLeft className="h-4 w-4" /></Button>{numbers.map((value) => <Button key={value} size="sm" variant={page === value ? "default" : "outline"} aria-label={`Page ${value}`} aria-current={page === value ? "page" : undefined} disabled={busy} className={page === value ? "bg-[#1E1B4B] hover:bg-[#2A2675]" : "border-gray-300 hover:bg-gray-100"} onClick={() => setFilters({ ...filters, page: value })}>{value}</Button>)}<Button variant="outline" size="sm" aria-label="Next page" disabled={busy || page >= pages} onClick={() => setFilters({ ...filters, page: page + 1 })}><ChevronRight className="h-4 w-4" /></Button><Button variant="outline" size="sm" aria-label="Last page" disabled={busy || page >= pages} onClick={() => setFilters({ ...filters, page: pages })}><ChevronsRight className="h-4 w-4" /></Button></div><p className="text-sm text-gray-600">{from} – {to} of {total.toLocaleString()} entries</p></div>
    </CardContent></Card>{modal?.mode === "view" && <LetterViewModal key={modal.uuid} uuid={modal.uuid} onClose={() => { setModal(null); void query.refetch(); }} />}{modal?.mode === "status" && <LetterStatusModal key={modal.uuid} uuid={modal.uuid} onClose={() => { setModal(null); void query.refetch(); }} />}{decision && <LetterApprovalDialog key={`${decision.letter.uuid}-${decision.action}`} {...decision} onClose={() => setDecision(null)} />}</div>;
}
