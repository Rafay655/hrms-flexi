"use client";

/**
 * ApplyForm — shared loan/advance application form for the admin "new application"
 * and ESS "apply" pages. Drives a live eligibility pre-check and EMI preview, then
 * creates + submits the application.
 *
 * The admin form uses a searchable employee picker (gap #12) that yields the
 * employee UUID; the backend eligibility/application endpoints accept a UUID or a
 * numeric id. ESS callers pass a fixed `lockEmployeeId` (numeric) and skip the picker.
 */

import { showApiError } from "@/lib/error-toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { loanHubService } from "@/services/loan-hub";
import { searchLetterEmployees, type LetterEmployeeOption } from "@/services/letterforge-employee-search";
import { EmiCalculatorWidget } from "@/components/loan-hub/EmiCalculatorWidget";
import { EligibilityCheckPanel } from "@/components/loan-hub/EligibilityCheckPanel";
import type { EligibilityResult } from "@/types/loan-hub";

const PURPOSES = ["Medical", "Education", "Housing", "Marriage", "Emergency", "Festival", "Vehicle", "Personal", "Other"];

interface ApiError {
  response?: { data?: { message?: string; errors?: { checks?: EligibilityResult["checks"] } } };
}

export function ApplyForm({ lockEmployeeId }: { lockEmployeeId?: number }) {
  const router = useRouter();

  // employeeId holds a UUID (picker) or the locked numeric id (ESS) — backend resolves both.
  const [employeeId, setEmployeeId] = useState<string | number>(lockEmployeeId ?? "");
  const [empQuery, setEmpQuery] = useState("");
  const [empSelected, setEmpSelected] = useState<string | null>(null);
  const [empResults, setEmpResults] = useState<LetterEmployeeOption[]>([]);
  const [loanTypeId, setLoanTypeId] = useState<number>(0);
  const [amount, setAmount] = useState(100000);
  const [tenure, setTenure] = useState(12);
  const [purpose, setPurpose] = useState("Personal");
  const [purposeDetail, setPurposeDetail] = useState("");
  const [recoveryStartMonth, setRecoveryStartMonth] = useState("");

  // Debounced employee search (admin picker only).
  useEffect(() => {
    if (lockEmployeeId != null || empSelected) return;
    const q = empQuery.trim();
    if (q.length < 2) {
      setEmpResults([]);
      return;
    }
    const t = setTimeout(() => {
      searchLetterEmployees(q).then(setEmpResults).catch(() => setEmpResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [empQuery, empSelected, lockEmployeeId]);

  const types = useQuery({ queryKey: ["loan-hub", "types", "active"], queryFn: () => loanHubService.getTypes({ is_active: true }) });

  const hasEmployee = employeeId !== "" && employeeId !== 0;
  const canCheck = hasEmployee && loanTypeId > 0 && amount > 0 && tenure > 0;

  const eligibility = useQuery({
    queryKey: ["loan-hub", "eligibility", employeeId, loanTypeId, amount, tenure],
    queryFn: () => loanHubService.eligibilityCheck({ employee_id: employeeId, loan_type_id: loanTypeId, amount, tenure }),
    enabled: canCheck,
    staleTime: 15_000,
  });

  const submit = useMutation({
    mutationFn: async () => {
      const created = await loanHubService.createApplication({
        employee_id: employeeId,
        loan_type_id: loanTypeId,
        requested_amount: amount,
        requested_tenure_months: tenure,
        purpose: purpose.toLowerCase(),
        purpose_detail: purposeDetail || undefined,
        recovery_start_month: recoveryStartMonth || undefined,
      });
      return loanHubService.submitApplication(created.uuid);
    },
    onSuccess: (app) => {
      toast.success("Application submitted for approval.");
      router.push(`/loan-hub/applications/${app.uuid}`);
    },
    onError: (e: ApiError) => {
      const failed = e.response?.data?.errors?.checks;
      showApiError(e, { fallbackMessage: failed?.length ? `Eligibility failed: ${failed[0].message}` : e.response?.data?.message ?? "Could not submit application." });
    },
  });

  const notEligible = eligibility.data?.passed === false;

  const pickEmployee = (r: LetterEmployeeOption) => {
    setEmployeeId(r.uuid);
    setEmpSelected(`${r.name} · ${r.employee_code}${r.designation ? ` · ${r.designation}` : ""}`);
    setEmpQuery(r.name);
    setEmpResults([]);
  };

  const clearEmployee = () => {
    setEmployeeId("");
    setEmpSelected(null);
    setEmpQuery("");
    setEmpResults([]);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs lg:col-span-3">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">Application Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {lockEmployeeId == null && (
            <div className="relative sm:col-span-2">
              <Field label="Employee">
                {empSelected ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    <span>{empSelected}</span>
                    <button type="button" onClick={clearEmployee} className="cursor-pointer text-xs font-medium text-emerald-700 hover:underline">
                      Change
                    </button>
                  </div>
                ) : (
                  <input
                    value={empQuery}
                    onChange={(e) => setEmpQuery(e.target.value)}
                    className={inputCls}
                    placeholder="Search employee by name or code…"
                    autoComplete="off"
                  />
                )}
              </Field>
              {!empSelected && empResults.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-100 bg-white text-sm shadow-lg">
                  {empResults.map((r) => (
                    <li key={r.uuid}>
                      <button
                        type="button"
                        onClick={() => pickEmployee(r)}
                        className="block w-full cursor-pointer px-3 py-2 text-left hover:bg-brand-100/40"
                      >
                        <span className="font-medium text-gray-800">{r.name}</span>
                        <span className="text-gray-400"> · {r.employee_code}</span>
                        {r.designation && <span className="text-gray-400"> · {r.designation}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <Field label="Loan Type">
            <select value={loanTypeId || ""} onChange={(e) => setLoanTypeId(Number(e.target.value))} className={inputCls}>
              <option value="">Select a type…</option>
              {(types.data ?? []).map((t) => (
                <option key={t.uuid} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Requested Amount (PKR)">
            <input type="number" value={amount} min={0} onChange={(e) => setAmount(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Tenure (months)">
            <input type="number" value={tenure} min={1} onChange={(e) => setTenure(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Purpose">
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputCls}>
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="First Recovery Month">
            <input type="month" value={recoveryStartMonth} onChange={(e) => setRecoveryStartMonth(e.target.value ? `${e.target.value}-01` : "")} className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Details (optional)">
              <textarea value={purposeDetail} onChange={(e) => setPurposeDetail(e.target.value)} rows={2} className={inputCls} />
            </Field>
          </div>
        </div>

        <button
          disabled={!canCheck || submit.isPending || notEligible}
          onClick={() => submit.mutate()}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submit.isPending ? "Submitting…" : "Submit Application"}
        </button>
        {notEligible && (
          <p className="mt-2 text-xs text-red-600">Resolve the eligibility issues before submitting.</p>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:col-span-2">
        <EmiCalculatorWidget defaultAmount={amount} defaultTenure={tenure} onChange={(a, t) => { setAmount(a); setTenure(t); }} />
        {eligibility.data && <EligibilityCheckPanel result={eligibility.data} />}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}
