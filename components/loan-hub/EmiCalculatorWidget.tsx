"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calculator } from "lucide-react";
import { loanHubService } from "@/services/loan-hub";
import { INTEREST_TYPE_LABELS, pkr } from "@/lib/loan-hub";
import type { InterestType } from "@/types/loan-hub";
import { AmortizationTable } from "./AmortizationTable";

/**
 * EmiCalculatorWidget — §7.3 real-time EMI calculator. Calls GET
 * /loans/emi-calculator and renders the summary + amortization preview.
 *
 * When `lockType`/`rate` are supplied (driven by a loan-type policy), the interest
 * controls are hidden — the applicant only adjusts amount + tenure.
 */
export function EmiCalculatorWidget({
  defaultAmount = 100000,
  defaultTenure = 12,
  lockType,
  lockRate,
  minAmount,
  maxAmount,
  onChange,
}: {
  defaultAmount?: number;
  defaultTenure?: number;
  lockType?: InterestType;
  lockRate?: number;
  minAmount?: number;
  maxAmount?: number;
  onChange?: (amount: number, tenure: number) => void;
}) {
  const [amount, setAmount] = useState(defaultAmount);
  const [tenure, setTenure] = useState(defaultTenure);
  const [interestType, setInterestType] = useState<InterestType>(lockType ?? "interest_free");
  const [rate, setRate] = useState(lockRate ?? 0);

  const effectiveType = lockType ?? interestType;
  const effectiveRate = lockType ? (lockRate ?? 0) : rate;
  const valid = amount > 0 && tenure > 0;

  const { data, isFetching } = useQuery({
    queryKey: ["loan-hub", "emi-calc", amount, tenure, effectiveType, effectiveRate],
    queryFn: () =>
      loanHubService.emiCalculator({ amount, tenure, interest_type: effectiveType, rate: effectiveRate }),
    enabled: valid,
    staleTime: 30_000,
  });

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          <Calculator className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-gray-800">Installment Calculator</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={`Amount (PKR)${minAmount != null && maxAmount != null ? ` · ${pkr(minAmount)}–${pkr(maxAmount)}` : ""}`}>
          <input
            type="number"
            value={amount}
            min={0}
            onChange={(e) => {
              const v = Number(e.target.value);
              setAmount(v);
              onChange?.(v, tenure);
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm tabular-nums focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
          />
        </Field>
        <Field label="Tenure (months)">
          <input
            type="number"
            value={tenure}
            min={1}
            onChange={(e) => {
              const v = Number(e.target.value);
              setTenure(v);
              onChange?.(amount, v);
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm tabular-nums focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
          />
        </Field>

        {!lockType && (
          <>
            <Field label="Interest type">
              <select
                value={interestType}
                onChange={(e) => setInterestType(e.target.value as InterestType)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              >
                {Object.entries(INTEREST_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            {interestType !== "interest_free" && (
              <Field label="Annual rate (%)">
                <input
                  type="number"
                  value={rate}
                  min={0}
                  step="0.01"
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm tabular-nums focus:border-brand-400 focus:outline-none"
                />
              </Field>
            )}
          </>
        )}
      </div>

      {/* Summary */}
      {data && (
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-brand-100/40 p-3 sm:grid-cols-4">
          <Summary label="Monthly Installment" value={pkr(data.emi_amount)} highlight />
          <Summary label="Total interest" value={pkr(data.total_interest)} />
          <Summary label="Total repayable" value={pkr(data.total_repayable)} />
          <Summary label="Installments" value={String(data.tenure_months)} />
        </div>
      )}

      {/* Schedule preview */}
      {data && data.schedule.length > 0 && (
        <details className="mt-3 rounded-xl border border-gray-100">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-brand-700">
            View amortization schedule ({data.schedule.length} installments)
          </summary>
          <div className="max-h-72 overflow-y-auto">
            <AmortizationTable rows={data.schedule} />
          </div>
        </details>
      )}

      {isFetching && !data && <p className="mt-3 text-xs text-gray-400">Calculating…</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function Summary({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className={`tabular-nums font-semibold ${highlight ? "text-base text-brand-900" : "text-sm text-gray-700"}`}>
        {value}
      </p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  );
}
