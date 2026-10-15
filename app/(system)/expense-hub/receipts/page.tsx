"use client";

/**
 * app/(system)/expense-hub/receipts/page.tsx — receipt store (over DMS) + upload.
 * Data: /expense-hub/receipts. Upload is multipart; duplicates are blocked server-side.
 */

import { showApiError } from "@/lib/error-toast";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ReceiptText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { expenseHubService } from "@/services/expense-hub";
import { searchLetterEmployees, type LetterEmployeeOption } from "@/services/letterforge-employee-search";
import { useExpenseList } from "@/lib/use-expense-list";
import { FilterSelect, ListToolbar, Pagination } from "@/components/expense-hub/ListControls";

export default function ReceiptsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [recStatus, setRecStatus] = useState("");

  const {
    items: data,
    meta: pageMeta,
    isLoading,
    isFetching,
    search: listSearch,
    setSearch: setListSearch,
    setPage,
    resetPage,
  } = useExpenseList(["expense-hub", "receipts"], expenseHubService.getReceipts, {
    filters: { status: recStatus || undefined },
  });

  const [open, setOpen] = useState(false);
  const [employee, setEmployee] = useState<LetterEmployeeOption | null>(null);
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState({ receipt_number: "", receipt_date: "", vendor: "", amount: "" });
  const [file, setFile] = useState<File | null>(null);

  const { data: results = [] } = useQuery({
    queryKey: ["employee-search", search],
    queryFn: () => searchLetterEmployees(search),
    enabled: search.trim().length >= 2 && !employee,
  });

  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("file", file!);
      if (employee) fd.append("employee_id", employee.uuid);
      if (meta.receipt_number) fd.append("receipt_number", meta.receipt_number);
      if (meta.receipt_date) fd.append("receipt_date", meta.receipt_date);
      if (meta.vendor) fd.append("vendor", meta.vendor);
      if (meta.amount) fd.append("amount", meta.amount);
      return expenseHubService.uploadReceipt(fd);
    },
    onSuccess: () => {
      toast.success("Receipt uploaded.");
      setOpen(false);
      setFile(null);
      setEmployee(null);
      setMeta({ receipt_number: "", receipt_date: "", vendor: "", amount: "" });
      qc.invalidateQueries({ queryKey: ["expense-hub", "receipts"] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      showApiError(e, { fallbackMessage: e.response?.data?.message ?? "Could not upload the receipt (possible duplicate)." }),
  });

  return (
    <div className="flex flex-col gap-4 bg-brand-100/40 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">ExpenseHub · Receipts</nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Receipts</h1>
          <p className="text-sm text-gray-500">Stored in DMS; duplicates (same number, date, amount) are blocked.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="cursor-pointer gap-1.5 bg-brand-800 text-white hover:bg-brand-900">
          <Upload className="h-4 w-4" /> Upload Receipt
        </Button>
      </div>

      <ListToolbar search={listSearch} onSearch={setListSearch} placeholder="Search receipt # or vendor…">
        <FilterSelect label="Status" value={recStatus} onChange={(v) => { setRecStatus(v); resetPage(); }} options={[{ value: "attached", label: "Attached" }, { value: "flagged_duplicate", label: "Duplicate" }, { value: "pending", label: "Pending" }]} />
      </ListToolbar>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 w-12">#</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Receipt #</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Loading…</td></tr>}
            {!isLoading && data.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500"><ReceiptText className="mx-auto mb-2 h-6 w-6 text-gray-300" />No receipts match your filters.</td></tr>
            )}
            {data.map((r, i) => (
              <tr key={r.uuid} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 tabular-nums text-gray-400">{(pageMeta?.from ?? 1) + i}</td>
                <td className="px-4 py-3 text-gray-700">{r.original_filename ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-brand-800">{r.receipt_number ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{r.receipt_date ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{r.vendor ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.amount ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${r.is_duplicate ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                    {r.is_duplicate ? "Duplicate" : "Attached"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination meta={pageMeta} onPage={setPage} isFetching={isFetching} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload receipt</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label htmlFor="rcpt-emp">Employee (optional — defaults to you)</Label>
              {employee ? (
                <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm">
                  <span>{employee.name}</span>
                  <button onClick={() => setEmployee(null)} className="cursor-pointer text-xs font-medium text-brand-700 hover:underline">Change</button>
                </div>
              ) : (
                <div className="relative">
                  <Input id="rcpt-emp" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee…" />
                  {results.length > 0 && (
                    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-100 bg-white shadow-lg">
                      {results.map((r) => (
                        <li key={r.uuid}>
                          <button onClick={() => { setEmployee(r); setSearch(""); }} className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm hover:bg-brand-50">
                            <span>{r.name}</span><span className="text-xs text-gray-500">{r.employee_code}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="rcpt-file">File (jpg, png, pdf)</Label>
              <input id="rcpt-file" ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf,.webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1"><Label htmlFor="rcpt-num">Receipt #</Label><Input id="rcpt-num" value={meta.receipt_number} onChange={(e) => setMeta({ ...meta, receipt_number: e.target.value })} /></div>
              <div className="grid gap-1"><Label htmlFor="rcpt-date">Date</Label><Input id="rcpt-date" type="date" value={meta.receipt_date} onChange={(e) => setMeta({ ...meta, receipt_date: e.target.value })} /></div>
              <div className="grid gap-1"><Label htmlFor="rcpt-vendor">Vendor</Label><Input id="rcpt-vendor" value={meta.vendor} onChange={(e) => setMeta({ ...meta, vendor: e.target.value })} /></div>
              <div className="grid gap-1"><Label htmlFor="rcpt-amt">Amount</Label><Input id="rcpt-amt" type="number" value={meta.amount} onChange={(e) => setMeta({ ...meta, amount: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => upload.mutate()} disabled={upload.isPending || !file} className="cursor-pointer bg-brand-800 text-white hover:bg-brand-900">Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
