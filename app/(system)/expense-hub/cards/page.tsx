"use client";

/**
 * app/(system)/expense-hub/cards/page.tsx — corporate cards + statement reconciliation.
 * Data: /expense-hub/cards + /expense-hub/cards/transactions. Bulk import of a
 * statement is available via FlexiImport (import type "corporate_card_transactions").
 */

import { showApiError } from "@/lib/error-toast";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { expenseHubService } from "@/services/expense-hub";
import { currencyService } from "@/services/currency.service";
import { useExpenseList } from "@/lib/use-expense-list";
import { FilterSelect, ListToolbar, Pagination } from "@/components/expense-hub/ListControls";

export default function CardsPage() {
  const qc = useQueryClient();
  const [recStatus, setRecStatus] = useState("");

  const { data: cardsData } = useQuery({
    queryKey: ["expense-hub", "cards"],
    queryFn: () => expenseHubService.getCards({ per_page: 100 }),
  });
  const cards = cardsData?.items ?? [];

  const {
    items: txns,
    meta: txnMeta,
    isFetching: txnFetching,
    search: txnSearch,
    setSearch: setTxnSearch,
    setPage: setTxnPage,
    resetPage: resetTxnPage,
  } = useExpenseList(["expense-hub", "card-txns"], expenseHubService.getCardTransactions, {
    filters: { status: recStatus || undefined },
  });

  const { data: currencies } = useQuery({ queryKey: ["currencies", "all"], queryFn: () => currencyService.getAll({ per_page: 200 }) });
  const currencyList = currencies?.data ?? [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ card_holder_name: "", last_four: "", card_type: "visa", issuing_bank: "", currency_id: "" });

  const create = useMutation({
    mutationFn: () =>
      expenseHubService.createCard({
        card_holder_name: form.card_holder_name,
        last_four: form.last_four,
        card_type: form.card_type,
        issuing_bank: form.issuing_bank || null,
        currency_id: form.currency_id ? Number(form.currency_id) : null,
      }),
    onSuccess: () => {
      toast.success("Card added.");
      setOpen(false);
      setForm({ card_holder_name: "", last_four: "", card_type: "visa", issuing_bank: "", currency_id: "" });
      qc.invalidateQueries({ queryKey: ["expense-hub", "cards"] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) => showApiError(e, { fallbackMessage: e.response?.data?.message ?? "Could not add the card." }),
  });

  const reconStatusTone: Record<string, string> = {
    matched: "bg-emerald-50 text-emerald-700",
    unmatched: "bg-amber-50 text-amber-700",
    disputed: "bg-red-50 text-red-600",
  };

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">ExpenseHub · Corporate Cards</nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Corporate Cards</h1>
          <p className="text-sm text-gray-500">Card registry + statement reconciliation against claims.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/flexi-import" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Upload className="h-4 w-4" /> Import statement
          </Link>
          <Button onClick={() => setOpen(true)} className="gap-1.5 bg-brand-800 text-white hover:bg-brand-900">
            <Plus className="h-4 w-4" /> Add Card
          </Button>
        </div>
      </div>

      {/* Cards */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-brand-900">Cards</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.length === 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500 shadow-xs">
              <CreditCard className="mx-auto mb-2 h-6 w-6 text-gray-300" />No cards yet.
            </div>
          )}
          {cards.map((c) => (
            <div key={c.uuid} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-brand-900">{c.card_holder_name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{c.status}</span>
              </div>
              <p className="mt-1 font-mono text-sm text-gray-500">•••• {c.last_four} <span className="uppercase">· {c.card_type}</span></p>
              {c.issuing_bank && <p className="text-xs text-gray-500">{c.issuing_bank}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Transactions */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-brand-900">Statement Transactions</h2>
        <ListToolbar search={txnSearch} onSearch={setTxnSearch} placeholder="Search merchant or reference…">
          <FilterSelect label="Reconciliation" value={recStatus} onChange={(v) => { setRecStatus(v); resetTxnPage(); }} options={[{ value: "unmatched", label: "Unmatched" }, { value: "matched", label: "Matched" }, { value: "disputed", label: "Disputed" }]} />
        </ListToolbar>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Reconciliation</th>
              </tr>
            </thead>
            <tbody>
              {txns.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No transactions. Import a statement via FlexiImport.</td></tr>
              )}
              {txns.map((t) => (
                <tr key={t.uuid} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 text-gray-500">{t.transaction_date}</td>
                  <td className="px-4 py-3 text-gray-700">{t.merchant ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{t.amount}</td>
                  <td className="px-4 py-3 text-gray-500">{t.reference ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${reconStatusTone[t.reconciliation_status] ?? "bg-gray-100 text-gray-500"}`}>
                      {t.reconciliation_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={txnMeta} onPage={setTxnPage} isFetching={txnFetching} />
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add corporate card</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1"><Label htmlFor="card-holder">Card holder</Label><Input id="card-holder" value={form.card_holder_name} onChange={(e) => setForm({ ...form, card_holder_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1"><Label htmlFor="card-last4">Last 4</Label><Input id="card-last4" maxLength={4} value={form.last_four} onChange={(e) => setForm({ ...form, last_four: e.target.value })} /></div>
              <div className="grid gap-1">
                <Label htmlFor="card-type">Type</Label>
                <select id="card-type" value={form.card_type} onChange={(e) => setForm({ ...form, card_type: e.target.value })} className="rounded-md border border-gray-200 px-3 py-2 text-sm focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100">
                  {["visa", "mastercard", "amex", "unionpay", "other"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid gap-1"><Label htmlFor="card-bank">Issuing bank</Label><Input id="card-bank" value={form.issuing_bank} onChange={(e) => setForm({ ...form, issuing_bank: e.target.value })} /></div>
              <div className="grid gap-1">
                <Label htmlFor="card-cur">Currency</Label>
                <select id="card-cur" value={form.currency_id} onChange={(e) => setForm({ ...form, currency_id: e.target.value })} className="rounded-md border border-gray-200 px-3 py-2 text-sm focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100">
                  <option value="">—</option>
                  {currencyList.map((c) => <option key={c.id} value={c.id}>{c.iso_code}</option>)}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending || form.last_four.length !== 4 || !form.card_holder_name} className="cursor-pointer bg-brand-800 text-white hover:bg-brand-900">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
