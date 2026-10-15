"use client";
import { ApiFieldErrors } from "@/components/api-field-errors";
import { showApiError } from "@/lib/error-toast";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useGenerateLetter, useLetterTemplate } from "@/hooks/use-letter-forge";
import { getLetterForgeError, getLetterRenderStatus } from "@/services/letter-forge";
import { renderStage } from "@/lib/letter-publishing";
import type { GenerateLetterResponse, LetterTemplate, LetterRenderStatus } from "@/types/letter-forge";
import { useBatchEmployees } from "@/hooks/use-letter-batches";
import { fieldClass, LetterError } from "./letter-ui";
import SearchableSelect from "@/components/ui/searchable-select";
import { buildLetterGenerationPayload, manualLetterFields } from "@/lib/letter-generation-fields";

export function GenerateLetterModal({ template, onClose }: { template: LetterTemplate; onClose: () => void }) {
  const mutation = useGenerateLetter();
  const employees = useBatchEmployees();
  const savedTemplate = useLetterTemplate(template.uuid);
  const selected = savedTemplate.data?.data;
  const canGenerate = selected?.is_active === true && selected.publish_status === "published";
  const fields = selected ? manualLetterFields(selected) : [];
  const [employeeId, setEmployeeId] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<GenerateLetterResponse | null>(null);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const validation = getLetterForgeError(submitError).fieldErrors;
  const lock = useRef(false);

  async function generate() {
    if (lock.current || mutation.isPending || result || !selected) return;
    if (!canGenerate || savedTemplate.isError || savedTemplate.isFetching) {
      toast.error("The template must be active and published before generating a letter.");
      return;
    }
    setSubmitError(null);
    lock.current = true;
    try {
      const response = await mutation.mutateAsync(buildLetterGenerationPayload(selected, Number(employeeId), values));
      setResult(response);
      toast.success(response.data.status === "pending_approval" ? "Letter submitted for approval." : "Letter created. Preparing the PDF.");
    } catch (error) { setSubmitError(error); showApiError(error); }
    finally { lock.current = false; }
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) onClose(); }}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle className="font-semibold">Generate letter</DialogTitle><DialogDescription>Select an employee and fill in the details needed for this template.</DialogDescription></DialogHeader>
      {result ? <LetterGenerationProgress key={result.data.uuid} result={result} /> : <form id="generate-template-letter" onSubmit={(event) => { event.preventDefault(); void generate(); }} className="space-y-5"><ApiFieldErrors error={submitError} />
        <label className="block space-y-2 text-sm font-medium" htmlFor="generation-template">Template<Input id="generation-template" value={selected?.name ?? template.name} readOnly className="bg-slate-50" /></label>
        <div className="space-y-2"><label className="text-sm font-medium" htmlFor="generation-employee">Employee</label><SearchableSelect id="generation-employee" aria-label="Employee" allowAll={false} widthClass="w-full" placeholder="Select an employee…" searchPlaceholder="Search name or employee code…" value={employeeId} onChange={setEmployeeId} isLoading={employees.isPending} disabled={mutation.isPending} options={(employees.data ?? []).map((employee) => ({ value: String(employee.id), label: `${employee.name} · ${employee.employee_code}` }))} /></div>
        {employees.error && <LetterError message={getLetterForgeError(employees.error).message} retry={() => void employees.refetch()} />}
        {savedTemplate.isPending && <p role="status" className="text-sm text-slate-500">Loading template fields…</p>}
        {savedTemplate.error && <LetterError message={getLetterForgeError(savedTemplate.error).message} retry={() => void savedTemplate.refetch()} />}
        {selected && !canGenerate && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">The template must be active and published before generating a letter. Publish it from the template action menu first.</p>}
        {fields.length > 0 && <section className="space-y-4 border-t pt-4"><h3 className="text-sm font-semibold">Letter details</h3><div className="grid gap-4 sm:grid-cols-2">{fields.map((field) => <label key={field.key} className={`block space-y-2 text-sm font-medium ${field.multiline ? "sm:col-span-2" : ""}`} htmlFor={`generation-${field.key}`}><span>{field.label}{field.required ? " *" : " (optional)"}</span>{field.multiline ? <textarea id={`generation-${field.key}`} aria-invalid={Boolean(validation[`extra_data.${field.key}`] || validation[field.key])} className={`${fieldClass} min-h-24`} required={field.required} value={values[field.key] ?? ""} disabled={mutation.isPending} onChange={(event) => setValues((previous) => ({ ...previous, [field.key]: event.target.value }))} /> : <Input id={`generation-${field.key}`} aria-invalid={Boolean(validation[`extra_data.${field.key}`] || validation[field.key])} type={field.type} placeholder={field.placeholder} required={field.required} min={field.type === "number" ? 0 : undefined} step={field.type === "number" ? field.key === "extension_days" ? 1 : "any" : undefined} value={values[field.key] ?? ""} disabled={mutation.isPending} onChange={(event) => setValues((previous) => ({ ...previous, [field.key]: event.target.value }))} />}</label>)}</div></section>}
        {selected && !fields.length && <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">No additional details needed. Employee and company information will be filled automatically.</p>}
      </form>}
      <DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={onClose}>Close</Button>{!result && <Button type="submit" form="generate-template-letter" disabled={mutation.isPending || !employeeId || !canGenerate || savedTemplate.isError || savedTemplate.isFetching}>{mutation.isPending ? "Generating…" : "Generate letter"}</Button>}</DialogFooter>
    </DialogContent>
  </Dialog>;
}

export function LetterGenerationProgress({ result }: { result: { data: LetterRenderStatus; meta?: GenerateLetterResponse["meta"] } }) {
  const [startedAt, setStartedAt] = useState(Date.now);
  const [timedOut, setTimedOut] = useState(false);
  const [paused, setPaused] = useState(false);
  const initialStage = renderStage(result.data);
  const status = useQuery({
    queryKey: ["letter-forge", "render-status", result.data.uuid],
    queryFn: ({ signal }) => getLetterRenderStatus(result.data.uuid, signal),
    enabled: (query) => initialStage === "waiting" && !timedOut && !paused
      && (!query.state.data || renderStage(query.state.data.data) === "waiting"),
    retry: false,
    refetchOnWindowFocus: initialStage === "waiting" && !timedOut && !paused,
    refetchInterval: (query) => {
      if (timedOut || paused || query.state.error || Date.now() - startedAt >= 60_000 || (query.state.data && renderStage(query.state.data.data) !== "waiting")) return false;
      return Math.min(1500 * 1.6 ** Math.max(0, query.state.dataUpdateCount - 1), 8000);
    },
  });
  const letter = status.data?.data ?? result.data;
  const stage = renderStage(letter);
  useEffect(() => {
    if (stage !== "waiting" || paused || timedOut || status.isError) return;
    const timer = setTimeout(() => setTimedOut(true), Math.max(0, 60_000 - (Date.now() - startedAt)));
    return () => clearTimeout(timer);
  }, [stage, paused, timedOut, startedAt, status.isError]);
  const fallback = result.meta?.language_fallback;
  return <div className="space-y-4">
    <p className="break-all text-sm">Letter reference: <strong>{letter.uuid}</strong></p>
    {fallback && <p role="status" className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">{fallback.note || `Requested ${fallback.requested}; rendered in ${fallback.rendered}.`}</p>}
    <p role="status">{stage === "approval" ? "Pending approval. The letter must be approved before PDF generation continues." : stage === "ready" ? "Your PDF is ready." : stage === "failed" ? letter.error_message || "PDF generation failed. Please contact HR support with the letter reference." : stage === "stopped" ? `Letter ${letter.status}.` : timedOut ? "The PDF is taking longer than expected. Check again later using this letter reference; do not generate another copy." : paused ? "Status checks paused." : "Preparing the PDF… You can close this window while processing continues."}</p>
    {status.error && <p className="text-sm text-destructive">{getLetterForgeError(status.error).message}</p>}
    {stage === "waiting" && (paused || timedOut || status.isError) && <Button variant="outline" disabled={status.isFetching} onClick={() => { setStartedAt(Date.now()); setTimedOut(false); setPaused(false); if (!paused && !timedOut) void status.refetch(); }}>Check status again</Button>}
    {stage === "waiting" && !paused && !timedOut && !status.isError && <Button variant="outline" onClick={() => setPaused(true)}>Pause status checks</Button>}
  </div>;
}
