"use client";

import { num, pkr } from "@/lib/loan-hub";
import type { LoanTransactionRow } from "@/types/loan-hub";

const TYPE_LABELS: Record<string, string> = {
  disbursement: "Disbursement",
  emi_payment: "Installment Payment",
  partial_payment: "Partial Payment",
  prepayment: "Prepayment",
  penalty: "Penalty",
  interest_rebate: "Interest Rebate",
  ff_deduction: "F&F Deduction",
  write_off: "Write-off",
  adjustment: "Adjustment",
  reversal: "Reversal",
};

/**
 * LoanTransactionLedger — §7.3 double-entry ledger: date, description, debit,
 * credit, running balance.
 */
export function LoanTransactionLedger({ rows }: { rows: LoanTransactionRow[] }) {
  if (!rows.length) {
    return <p className="px-4 py-8 text-center text-sm text-gray-400">No transactions yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 text-right font-medium">Debit</th>
            <th className="px-3 py-2 text-right font-medium">Credit</th>
            <th className="px-3 py-2 text-right font-medium">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((t) => (
            <tr key={t.uuid} className="hover:bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap text-gray-600">{t.transaction_date ?? "—"}</td>
              <td className="px-3 py-2">
                <span className="font-medium text-gray-800">{TYPE_LABELS[t.transaction_type] ?? t.transaction_type}</span>
                {t.description && <span className="ml-1 block text-xs text-gray-400">{t.description}</span>}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-red-600">
                {num(t.debit_amount) > 0 ? pkr(t.debit_amount, { decimals: true }) : "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-emerald-600">
                {num(t.credit_amount) > 0 ? pkr(t.credit_amount, { decimals: true }) : "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-800">
                {pkr(t.running_balance, { decimals: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
