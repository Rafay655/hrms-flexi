"use client";

/**
 * Loan Policies manager — full CRUD with search, pagination, and modals
 * (View / Edit / Delete). System defaults are view‑only. Data: /loans/policies.
 * UI matches the Bank Branches directory pattern.
 */

import { showApiError } from "@/lib/error-toast";
import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";   // ← changed from sonner
import {
  Eye,
  Pencil,
  Plus,
  Trash2,
  MoreVertical,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoanPolicyForm } from "../../_components/LoanPolicyForm";
import { loanHubService } from "@/services/loan-hub";
import { INTEREST_TYPE_LABELS, num, pkr } from "@/lib/loan-hub";
import type { LoanPolicy } from "@/types/loan-hub";

// ── Debounce hook ────────────────────────────────────
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Component ────────────────────────────────────────
export default function LoanPoliciesManager() {
  const qc = useQueryClient();
  const { data: allPolicies = [], isLoading } = useQuery({
    queryKey: ["loan-hub", "policies"],
    queryFn: () => loanHubService.getPolicies(),
  });

  // ── Filters & Pagination ──────────────────────────
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // ── Modal states ──────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<LoanPolicy | null>(null);
  const [viewItem, setViewItem] = useState<LoanPolicy | null>(null);
  const [deleteItem, setDeleteItem] = useState<LoanPolicy | null>(null);

  // ── Delete mutation ───────────────────────────────
  const del = useMutation({
    mutationFn: (uuid: string) => loanHubService.deletePolicy(uuid),
    onSuccess: () => {
      toast.success("Policy deleted.");
      qc.invalidateQueries({ queryKey: ["loan-hub", "policies"] });
      setDeleteItem(null);
    },
    onError: (e: any) => {
      showApiError(e, { fallbackMessage: e?.response?.data?.message ?? "Could not delete this policy." });
      setDeleteItem(null);
    },
  });

  // ── Helper for loan type name ─────────────────────
  const typeName = (p: LoanPolicy) => p.loan_type?.name ?? `Type #${p.loan_type_id}`;

  // ── Client‑side filtering / pagination ────────────
  const filtered = useMemo(() => {
    let list = allPolicies as LoanPolicy[];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          typeName(p).toLowerCase().includes(q) ||
          (p.loan_type?.code ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allPolicies, debouncedSearch]);

  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / perPage);
  const safePage = Math.max(1, Math.min(page, totalPages || 1));
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const showingFrom = totalEntries > 0 ? (safePage - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(safePage * perPage, totalEntries) : 0;

  // Reset page when search or perPage changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, perPage]);

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Loan Policies
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} policies · Caps, interest and eligibility rules
              </p>
            </div>
            <Button
              className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" /> New Policy
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by loan type name or code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#1E1B4B] focus:ring-[#1E1B4B]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select
                value={perPage.toString()}
                onValueChange={(value) => setPerPage(Number(value))}
              >
                <SelectTrigger className="w-20 border-gray-300">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-600">Showing</span>
                <span className="font-semibold mx-1 text-gray-900">
                  {showingFrom.toLocaleString()}
                </span>
                <span className="text-gray-600">to</span>
                <span className="font-semibold mx-1 text-gray-900">
                  {showingTo.toLocaleString()}
                </span>
                <span className="text-gray-600">of</span>
                <span className="font-semibold mx-1 text-gray-900">
                  {totalEntries.toLocaleString()}
                </span>
                <span className="text-gray-600">entries</span>
              </div>
              {isLoading && (
                <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading...
                </Badge>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
                      SR. NO.
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      LOAN TYPE
                    </th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      AMOUNT RANGE
                    </th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      TENURE
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      INTEREST
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      SCOPE
                    </th>
                    <th className="py-3 px-6 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">Loading policies...</p>
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        No policies found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((p, idx) => (
                      <tr key={p.uuid} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 text-sm text-gray-500">
                          {showingFrom + idx}
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-900">
                          {typeName(p)}
                        </td>
                        <td className="py-4 px-6 text-sm text-right tabular-nums text-gray-700">
                          {pkr(num(p.min_amount))} –{" "}
                          {p.max_amount_absolute != null
                            ? pkr(num(p.max_amount_absolute))
                            : "∞"}
                        </td>
                        <td className="py-4 px-6 text-sm text-right tabular-nums text-gray-700">
                          {p.min_tenure}–{p.max_tenure} mo
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {INTEREST_TYPE_LABELS[p.interest_type]}
                          {p.interest_type !== "interest_free"
                            ? ` · ${num(p.interest_rate)}%`
                            : ""}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.is_system
                                ? "bg-gray-100 text-gray-500"
                                : "bg-brand-100 text-brand-700"
                            }`}
                          >
                            {p.is_system ? "System" : "Company"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewItem(p)}>
                                <Eye className="mr-2 h-3.5 w-3.5" /> View
                              </DropdownMenuItem>
                              {!p.is_system && (
                                <>
                                  <DropdownMenuItem onClick={() => setEditItem(p)}>
                                    <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setDeleteItem(p)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && totalEntries > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-900">{safePage}</span> of{" "}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={safePage === 1}
                      className="border-gray-300"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, safePage - 1))}
                      disabled={safePage === 1}
                      className="border-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center space-x-1 mx-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (safePage <= 3) pageNum = i + 1;
                        else if (safePage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = safePage - 2 + i;
                        return (
                          <Button
                            key={pageNum}
                            variant={safePage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className={
                              safePage === pageNum
                                ? "bg-[#1E1B4B] hover:bg-[#2A2675] border-[#1E1B4B]"
                                : "border-gray-300 hover:bg-gray-100"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                      disabled={safePage === totalPages}
                      className="border-gray-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={safePage === totalPages}
                      className="border-gray-300"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">
                      {showingFrom.toLocaleString()}
                    </span>
                    {" - "}
                    <span className="font-semibold text-gray-900">
                      {showingTo.toLocaleString()}
                    </span>
                    {" of "}
                    <span className="font-semibold text-gray-900">
                      {totalEntries.toLocaleString()}
                    </span>
                    {" entries"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Create / Edit Modal ──────────────────────── */}
      <Dialog
        open={createOpen || editItem !== null}
        onOpenChange={(o) => {
          if (!o) {
            setCreateOpen(false);
            setEditItem(null);
          }
        }}
      >
        <DialogContent className="bg-white sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle className="text-brand-900">
              {editItem ? "Edit Policy" : "New Policy"}
            </DialogTitle>
            <DialogDescription>
              {editItem
                ? "Modify the loan policy details."
                : "Define caps, interest and eligibility rules."}
            </DialogDescription>
          </DialogHeader>
          <LoanPolicyForm
            mode={editItem ? "edit" : "create"}
            item={editItem ?? undefined}
            onClose={() => {
              setCreateOpen(false);
              setEditItem(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ── View Modal ───────────────────────────────── */}
      <Dialog
        open={viewItem !== null}
        onOpenChange={(o) => !o && setViewItem(null)}
      >
        <DialogContent className="bg-white sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-brand-900">
              {viewItem ? `${typeName(viewItem)} policy` : ""}
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <F
                label="Amount"
                value={`${pkr(num(viewItem.min_amount))} – ${
                  viewItem.max_amount_absolute != null
                    ? pkr(num(viewItem.max_amount_absolute))
                    : "∞"
                }`}
              />
              <F
                label="Tenure"
                value={`${viewItem.min_tenure}–${viewItem.max_tenure} months`}
              />
              <F
                label="Interest"
                value={`${INTEREST_TYPE_LABELS[viewItem.interest_type]}${
                  viewItem.interest_type !== "interest_free"
                    ? ` · ${num(viewItem.interest_rate)}%`
                    : ""
                }`}
              />
              <F
                label="Max installment % of gross"
                value={`${num(viewItem.max_emi_pct_of_gross)}%`}
              />
              <F
                label="Max concurrent loans"
                value={String(viewItem.max_concurrent_loans)}
              />
              <F
                label="Min service"
                value={`${viewItem.min_tenure_months} months`}
              />
              <F
                label="Requires guarantor"
                value={viewItem.requires_guarantor ? "Yes" : "No"}
              />
              <F
                label="Allows prepayment"
                value={viewItem.allow_prepayment ? "Yes" : "No"}
              />
            </dl>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewItem(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────── */}
      <AlertDialog
        open={deleteItem !== null}
        onOpenChange={(o) => !o && setDeleteItem(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-brand-900">
              Delete this policy?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-brand-700">
              Applications of {deleteItem && typeName(deleteItem)} will fall back
              to the system‑default policy (if any).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItem && del.mutate(deleteItem.uuid)}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={del.isPending}
            >
              {del.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function F({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="font-medium text-brand-900">{value}</dd>
    </div>
  );
}