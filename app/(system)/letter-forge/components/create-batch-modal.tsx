"use client";
import { showApiError } from "@/lib/error-toast";
import { ApiFieldErrors } from "@/components/api-field-errors";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { useBatchEmployees, useCreateLetterBatch } from "@/hooks/use-letter-batches";
import { useAppSelector } from "@/store/hooks";
import { REGISTERED_TEMPLATE_KEYS } from "@/types/letter-forge";
import { getLetterForgeError } from "@/services/letter-forge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import SearchableSelect from "@/components/ui/searchable-select";

export function CreateBatchModal({ onClose, onCreated }: { onClose: () => void; onCreated: (uuid: string) => void }) {
  const employees = useBatchEmployees();
  const create = useCreateLetterBatch();
  const owner = useAppSelector((state) => `${state.auth.company?.id ?? ""}:${state.auth.user?.id ?? ""}`);
  const [template, setTemplate] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [createdUuid, setCreatedUuid] = useState<string | null>(null);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const inFlight = useRef(false);
  const valid = (employees.data ?? []).filter((employee) => Number.isSafeInteger(employee.id) && employee.id > 0);
  const matches = valid.filter((employee) => `${employee.name} ${employee.employee_code} ${employee.id}`.toLowerCase().includes(search.trim().toLowerCase()));
  const busy = create.isPending || Boolean(createdUuid);

  function toggle(id: number) {
    if (selected.includes(id)) setSelected((ids) => ids.filter((value) => value !== id));
    else if (selected.length >= 500) toast.error("A batch can contain at most 500 employees.");
    else setSelected((ids) => [...ids, id]);
  }
  async function dryRun() {
    if (inFlight.current || busy) return;
    if (!template || !selected.length) { toast.error("Choose a template and at least one employee."); return; }
    inFlight.current = true;
    const ids = [...selected].sort((a, b) => a - b);
    const fingerprint = JSON.stringify({ owner, template, ids });
    const storageKey = `letter-forge:batch-attempt:${owner}`;
    try {
      if (attempt.current?.fingerprint !== fingerprint) {
        let previous: { fingerprint?: string; key?: string } | null = null;
        try { previous = JSON.parse(sessionStorage.getItem(storageKey) ?? "null"); } catch { /* unavailable storage */ }
        attempt.current = { fingerprint, key: previous?.fingerprint === fingerprint && typeof previous.key === "string" && previous.key.length <= 100 ? previous.key : crypto.randomUUID() };
        try { sessionStorage.setItem(storageKey, JSON.stringify(attempt.current)); } catch { /* Keep the same key in memory for retries. */ }
      }
      const response = await create.mutateAsync({ template_key: template, employee_ids: ids, dry_run: true, idempotency_key: attempt.current.key });
      setCreatedUuid(response.data.uuid);
      try { sessionStorage.removeItem(storageKey); } catch { /* The saved batch UUID is now the durable reference. */ }
      toast.success("Eligibility preview saved. Review it before committing.");
      onCreated(response.data.uuid);
    } catch (error) { showApiError(error); }
    finally { inFlight.current = false; }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle className="font-semibold">Create a letter batch</DialogTitle>
          <DialogDescription>Send the same letter type to multiple employees.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-5">
          <ApiFieldErrors error={create.error} />
          <div className="space-y-2">
            <label htmlFor="batch-template" className="text-sm font-semibold text-gray-900">Letter type</label>
            <SearchableSelect className="w-full mt-2" id="batch-template" aria-label="Letter type" value={template} onChange={setTemplate} disabled={busy} allowAll={false} placeholder="Choose a letter type" options={REGISTERED_TEMPLATE_KEYS.map((entry) => ({ value: entry.key, label: entry.label }))} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Employees</h2>
              <span aria-live="polite" className="text-xs text-muted-foreground">{selected.length} selected · Max 500</span>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search employees" className="pl-9" placeholder="Search by name or employee code" value={search} disabled={busy} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="flex items-center justify-between gap-2 border-b bg-gray-50 px-3 py-2">
                <Button size="sm" variant="ghost" className="h-7 px-1 text-xs text-brand-800" disabled={busy || employees.isPending || Boolean(employees.error) || !matches.length} onClick={() => {
                  const ids = [...new Set([...selected, ...matches.map((employee) => employee.id)])];
                  if (ids.length > 500) toast.error("More than 500 employees match. Narrow your search or select employees individually.");
                  else setSelected(ids);
                }}>{search.trim() ? "Select search results" : "Select all"}</Button>
                <Button size="sm" variant="ghost" className="h-7 px-1 text-xs text-muted-foreground" disabled={busy || !selected.length} onClick={() => setSelected([])}>Clear selection</Button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {employees.isPending && <p role="status" className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading employees…</p>}
                {employees.error && <div role="alert" className="space-y-2 p-4 text-center"><p className="text-sm text-destructive">{getLetterForgeError(employees.error).message}</p><Button size="sm" variant="outline" onClick={() => void employees.refetch()}>Try again</Button></div>}
                {employees.isSuccess && <div className="divide-y divide-gray-100">{matches.map((employee) => <label key={employee.id} className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${selected.includes(employee.id) ? "bg-brand-100/50" : "hover:bg-gray-50"}`}>
                  <input type="checkbox" className="h-4 w-4 shrink-0 accent-[#322E53]" aria-label={`Select ${employee.name}`} disabled={busy} checked={selected.includes(employee.id)} onChange={() => toggle(employee.id)} />
                  <span className="min-w-0"><span className="block truncate text-sm font-medium text-gray-900">{employee.name}</span><span className="block text-xs text-muted-foreground">{employee.employee_code}</span></span>
                </label>)}{!matches.length && <p className="p-8 text-center text-sm text-muted-foreground">{search.trim() ? "No matching employees. Try another name or code." : "No employees available."}</p>}</div>}
              </div>
            </div>
            {employees.data && valid.length !== employees.data.length && <p className="text-xs text-amber-700">Some employee records are incomplete and cannot be selected. Contact your administrator if someone is missing.</p>}
          </div>
        </div>

        <div className="shrink-0 border-t bg-gray-50 px-6 py-4">
          <p className="mb-3 text-xs text-muted-foreground">Next, review who is eligible. No letters are generated yet.</p>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
            <Button className="bg-[#1E1B4B] hover:bg-[#2A2675]" disabled={busy || employees.isPending || Boolean(employees.error) || !template || !selected.length} onClick={() => void dryRun()}>
              {create.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Checking eligibility…</> : <>Check eligibility<ArrowRight className="h-4 w-4" /></>}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
