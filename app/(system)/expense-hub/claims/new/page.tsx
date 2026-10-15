"use client";

/**
 * app/(system)/expense-hub/claims/new/page.tsx — the claim builder (UX centrepiece).
 * Picks an employee (uuid, resolved server-side), edits expense line items, then
 * creates a draft and optionally submits it for approval.
 */

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { expenseHubService, type ClaimPayload } from "@/services/expense-hub";
import { searchLetterEmployees, type LetterEmployeeOption } from "@/services/letterforge-employee-search";
import { pkr } from "@/lib/expense-hub";
import type { ClaimLinePayload, ClaimType } from "@/types/expense-hub";

interface DraftLine {
  category_id: string;
  expense_date: string;
  description: string;
  amount_claimed: string;
  payment_method: ClaimLinePayload["payment_method"];
}

const emptyLine = (): DraftLine => ({
  category_id: "",
  expense_date: new Date().toISOString().slice(0, 10),
  description: "",
  amount_claimed: "",
  payment_method: "cash",
});

export default function ClaimBuilderPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [claimType, setClaimType] = useState<ClaimType>("regular");
  const [employee, setEmployee] = useState<LetterEmployeeOption | null>(null);
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);

  const { data: catData } = useQuery({
    queryKey: ["expense-hub", "categories", "active"],
    queryFn: () => expenseHubService.getCategories({ active_only: 1, per_page: 200 }),
    staleTime: 60_000,
  });
  const categories = catData?.items ?? [];

  const { data: results = [] } = useQuery({
    queryKey: ["employee-search", search],
    queryFn: () => searchLetterEmployees(search),
    enabled: search.trim().length >= 2 && !employee,
  });

  const total = useMemo(
    () => lines.reduce((s, l) => s + (parseFloat(l.amount_claimed) || 0), 0),
    [lines],
  );

  const buildPayload = (): ClaimPayload => ({
    employee_id: employee!.uuid, // uuid resolved server-side
    title,
    claim_type: claimType,
    line_items: lines
      .filter((l) => l.category_id && l.amount_claimed)
      .map<ClaimLinePayload>((l) => ({
        category_id: l.category_id,
        line_type: "expense",
        expense_date: l.expense_date,
        description: l.description || undefined,
        amount_claimed: parseFloat(l.amount_claimed),
        payment_method: l.payment_method,
      })),
  });

  const create = useMutation({
    mutationFn: async (submit: boolean) => {
      const claim = await expenseHubService.createClaim(buildPayload());
      if (submit) {
        await expenseHubService.submitClaim(claim.uuid);
      }
      return claim;
    },
    onSuccess: (claim, submit) => {
      toast.success(submit ? "Claim submitted for approval." : "Draft saved.");
      router.push(`/expense-hub/claims/${claim.uuid}`);
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Could not save the claim. Check the form and try again." }),
  });

  const canSave = !!employee && title.trim().length > 0 && lines.some((l) => l.category_id && l.amount_claimed);

  const updateLine = (i: number, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">ExpenseHub · New Claim</nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Build an Expense Claim</h1>
      </div>

      {/* Header */}
      <div className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-600">Claim title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Karachi client visit"
            className="rounded-lg border border-gray-200 px-3 py-2 focus:border-brand-400 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-600">Type</span>
          <select
            value={claimType}
            onChange={(e) => setClaimType(e.target.value as ClaimType)}
            className="rounded-lg border border-gray-200 px-3 py-2 focus:border-brand-400 focus:outline-none"
          >
            <option value="regular">Regular</option>
            <option value="travel">Travel</option>
            <option value="medical">Medical</option>
            <option value="project_based">Project-based</option>
          </select>
        </label>

        <div className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-gray-600">Employee</span>
          {employee ? (
            <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2">
              <span>
                {employee.name} <span className="text-gray-500">· {employee.employee_code}</span>
              </span>
              <button onClick={() => setEmployee(null)} className="text-xs font-medium text-brand-700 hover:underline">
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee by name…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-brand-400 focus:outline-none"
              />
              {results.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-100 bg-white shadow-lg">
                  {results.map((r) => (
                    <li key={r.uuid}>
                      <button
                        onClick={() => {
                          setEmployee(r);
                          setSearch("");
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-brand-50"
                      >
                        <span>{r.name}</span>
                        <span className="text-xs text-gray-500">{r.employee_code}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-900">Line items</h2>
          <button
            onClick={() => setLines((p) => [...p, emptyLine()])}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            <Plus className="h-4 w-4" /> Add line
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {lines.map((l, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-gray-100 p-3 sm:grid-cols-12">
              <select
                value={l.category_id}
                onChange={(e) => updateLine(i, { category_id: e.target.value })}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm sm:col-span-3"
              >
                <option value="">Category…</option>
                {categories.map((c) => (
                  <option key={c.uuid} value={c.uuid}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={l.expense_date}
                onChange={(e) => updateLine(i, { expense_date: e.target.value })}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm sm:col-span-2"
              />
              <input
                value={l.description}
                onChange={(e) => updateLine(i, { description: e.target.value })}
                placeholder="Description"
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm sm:col-span-3"
              />
              <select
                value={l.payment_method}
                onChange={(e) => updateLine(i, { payment_method: e.target.value as DraftLine["payment_method"] })}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm sm:col-span-2"
              >
                <option value="cash">Cash</option>
                <option value="corporate_card">Corporate card</option>
                <option value="personal_card">Personal card</option>
                <option value="bank_transfer">Bank transfer</option>
              </select>
              <div className="flex items-center gap-1 sm:col-span-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={l.amount_claimed}
                  onChange={(e) => updateLine(i, { amount_claimed: e.target.value })}
                  placeholder="Amount"
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-right text-sm tabular-nums"
                />
                {lines.length > 1 && (
                  <button
                    onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}
                    className="text-gray-300 hover:text-red-500"
                    aria-label="Remove line"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <span className="text-gray-500">Total claimed</span>
          <span className="text-lg font-semibold tabular-nums text-brand-900">{pkr(total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => create.mutate(false)}
          disabled={!canSave || create.isPending}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          onClick={() => create.mutate(true)}
          disabled={!canSave || create.isPending}
          className="rounded-lg bg-brand-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Save &amp; submit
        </button>
      </div>
    </div>
  );
}
