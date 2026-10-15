"use client";

import { SignModal, SignatureDocumentModal } from "./sign-modal";
import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Search,
  FileText,
  Eye,
  Loader2,
  PenLine,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  declineSignature,
  getPendingSignatures,
} from "@/services/dms.service";
import type { DmsEsignSignatory } from "@/types/dms";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Input } from "@/components/ui/input";
import SearchableSelect from "@/components/ui/searchable-select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Declining closes the request only after the server confirms success.

interface DeclineDialogProps {
  signatory: DmsEsignSignatory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DeclineDialog({ signatory, open, onOpenChange }: DeclineDialogProps) {
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  // Derived: clear reason text whenever the dialog closes.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setReason("");
  }

  const declineMutation = useMutation({
    mutationFn: () => declineSignature(signatory!.signature_request_uuid, signatory!.uuid, reason),
    onSuccess: () => {
      toast.success("Signature request declined.");
      queryClient.invalidateQueries({ queryKey: ["dms"] });
      queryClient.invalidateQueries({ queryKey: ["letter-forge", "letters"] });
      onOpenChange(false);
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Failed to decline." });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!declineMutation.isPending) onOpenChange(next); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Decline signing
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to decline signing{" "}
            <span className="font-medium text-foreground">
              {signatory?.document?.title ?? "this document"}
            </span>
            . Please provide a reason.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2">
          <Label htmlFor="decline-reason" className="mb-1.5 block text-sm">
            Reason *
          </Label>
          <Textarea
            id="decline-reason"
            placeholder="e.g. Incorrect terms, wrong version…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={declineMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => { event.preventDefault(); declineMutation.mutate(); }}
            disabled={reason.trim().length < 1 || declineMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {declineMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Decline signing
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// The API returns the complete current-user collection, so filters and pagination are local.
export default function PendingSignaturesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [signTarget, setSignTarget] = useState<DmsEsignSignatory | null>(null);
  const [viewTarget, setViewTarget] = useState<DmsEsignSignatory | null>(null);
  const [declineTarget, setDeclineTarget] = useState<DmsEsignSignatory | null>(null);
  const { data: signatories = [], isPending, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["dms", "pending-signatures"],
    queryFn: ({ signal }) => getPendingSignatures(signal),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  useEffect(() => {
    if (error) showApiError(error, { id: "dms-pending-signatures" });
  }, [error]);

  const filtered = signatories.filter((item) => {
    const text = [item.document?.title, item.document?.document_type?.name, item.name, item.email, item.requested_by_name].filter(Boolean).join(" ").toLowerCase();
    return (!status || item.status === status) && text.includes(search.trim().toLowerCase());
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * perPage;
  const rows = filtered.slice(offset, offset + perPage);
  const from = rows.length ? offset + 1 : 0;
  const to = offset + rows.length;
  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstPage + index);
  const selectedSignatory = signTarget && (signatories.find((item) => item.uuid === signTarget.uuid) ?? signTarget);
  const hasFilters = Boolean(search || status);
  function clearFilters() { setSearch(""); setStatus(""); setPage(1); }

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="text-2xl font-semibold text-gray-900">Pending Signatures Directory</CardTitle>
              <p className="mt-1 text-sm text-gray-500">{signatories.length.toLocaleString()} requests • Documents awaiting your signature</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search pending signatures" placeholder="Search documents, signatories or email…" className="pl-10" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <SearchableSelect aria-label="Requests per page" allowAll={false} widthClass="w-28" value={String(perPage)} options={[10, 25, 50, 100].map((value) => ({ value: String(value), label: String(value) }))} onChange={(value) => { setPerPage(Number(value)); setPage(1); }} />
              <span>entries</span>
            </div>
            <div className="basis-full" />
            <SearchableSelect aria-label="Filter by status" allLabel="All statuses" value={status} options={[{ value: "pending", label: "Pending" }, { value: "notified", label: "Notified" }]} widthClass="w-full sm:w-56" onChange={(value) => { setStatus(value); setPage(1); }} />
            {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>}
          </div>
          <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-600">
            <span>Showing <strong className="text-gray-900">{from}</strong> to <strong className="text-gray-900">{to}</strong> of <strong className="text-gray-900">{filtered.length.toLocaleString()}</strong> entries</span>
            {isFetching && <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50"><Loader2 className="h-3 w-3 animate-spin" />Loading…</Badge>}
          </div>
          {isError && signatories.length > 0 && <p role="alert" className="text-sm text-destructive">Refresh failed. Showing previously loaded requests.</p>}
          <div className="overflow-hidden rounded-lg border border-gray-200" aria-busy={isFetching}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <caption className="sr-only">Pending document signatures</caption>
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    {["SR. NO.", "Document", "Signatory", "Signing order", "Status", "Actions"].map((label) => <th key={label} scope="col" className={cn("px-6 py-3", label === "Actions" && "text-right")}>{label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {isPending ? <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Loading pending signatures…</p></td></tr>
                    : isError && !signatories.length ? <tr><td colSpan={6} className="py-12 text-center"><AlertTriangle className="mx-auto mb-2 h-6 w-6 text-destructive" /><p className="mb-3 text-sm text-muted-foreground">Unable to load pending signatures.</p><Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>Retry</Button></td></tr>
                    : !rows.length ? <tr><td colSpan={6} className="py-12 text-center"><FileText className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-2 font-medium">No pending signatures found</p><p className="text-sm text-muted-foreground">{hasFilters ? "Try another search or clear your filters." : "You have no documents awaiting your signature."}</p>{hasFilters && <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>Clear filters</Button>}</td></tr>
                    : rows.map((item, index) => (
                      <tr key={item.uuid} className="group text-sm transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-muted-foreground">{offset + index + 1}</td>
                        <td className="px-6 py-4"><div className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-muted-foreground" /><div><p className="max-w-[280px] truncate font-semibold text-gray-900" title={item.document?.title}>{item.document?.title ?? "Document details unavailable"}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.document?.document_type?.name ?? "—"}</p>{item.requested_by_name && <p className="text-xs text-muted-foreground">Requested by {item.requested_by_name}</p>}</div></div></td>
                        <td className="px-6 py-4"><p className="font-medium text-gray-900">{item.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.email}</p></td>
                        <td className="px-6 py-4 text-muted-foreground"><p>{item.sign_order}{item.total_signatories ? ` of ${item.total_signatories}` : ""}</p><p className="mt-0.5 text-xs">{item.is_parallel ? "Parallel" : "Sequential"}</p></td>
                        <td className="px-6 py-4"><Badge variant="outline" className={cn("capitalize", item.status === "notified" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-amber-200 bg-amber-50 text-amber-700")}>{item.status}</Badge></td>
                        <td className="px-6 py-4 text-right">
                          {item.signature_request_uuid || item.document?.uuid ? <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${item.document?.title ?? item.name}`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem disabled={!item.document?.uuid} onSelect={() => setViewTarget(item)}><Eye className="mr-2 h-4 w-4" />View document</DropdownMenuItem>
                              <DropdownMenuItem disabled={!item.signature_request_uuid} onSelect={() => setSignTarget(item)}><PenLine className="mr-2 h-4 w-4" />Sign document</DropdownMenuItem>
                              <DropdownMenuItem disabled={!item.signature_request_uuid} className="text-destructive focus:text-destructive" onSelect={() => setDeclineTarget(item)}><XCircle className="mr-2 h-4 w-4" />Decline signing</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu> : <span className="text-xs text-muted-foreground" title="The API must include signature_request_uuid to enable signing actions.">Request details unavailable</span>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" aria-label="First page" disabled={isFetching || currentPage <= 1} onClick={() => setPage(1)}><ChevronsLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" aria-label="Previous page" disabled={isFetching || currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              {pages.map((value) => <Button key={value} size="sm" variant={value === currentPage ? "default" : "outline"} aria-label={`Page ${value}`} aria-current={value === currentPage ? "page" : undefined} disabled={isFetching} className={value === currentPage ? "bg-[#1E1B4B] hover:bg-[#2A2675]" : "border-gray-300 hover:bg-gray-100"} onClick={() => setPage(value)}>{value}</Button>)}
              <Button variant="outline" size="sm" aria-label="Next page" disabled={isFetching || currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" aria-label="Last page" disabled={isFetching || currentPage >= totalPages} onClick={() => setPage(totalPages)}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
            <p className="text-sm text-gray-600">{from} – {to} of {filtered.length.toLocaleString()} entries</p>
          </div>
        </CardContent>
      </Card>
      {viewTarget && <SignatureDocumentModal signatory={viewTarget} onClose={() => setViewTarget(null)} />}
      {selectedSignatory && <SignModal key={selectedSignatory.uuid} signatory={selectedSignatory} open onOpenChange={(open) => { if (!open) setSignTarget(null); }} onSigned={() => setSignTarget(null)} />}
      <DeclineDialog signatory={declineTarget} open={Boolean(declineTarget)} onOpenChange={(open) => { if (!open) setDeclineTarget(null); }} />
    </div>
  );
}
