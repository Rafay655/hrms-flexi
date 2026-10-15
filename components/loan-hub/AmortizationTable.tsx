"use client";

import { num, pkr } from "@/lib/loan-hub";
import { LoanStatusBadge } from "./LoanStatusBadge";

type Row = {
  emi_number: number;
  due_date: string | null;
  emi_amount: number | string;
  principal_component: number | string;
  interest_component: number | string;
  closing_balance: number | string;
  status?: string;
};

/**
 * AmortizationTable — §7.3 full schedule with principal / interest split.
 * Highlights paid / overdue rows.
 */
export function AmortizationTable({ rows }: { rows: Row[] }) {
  if (!rows.length) {
    return <p className="px-4 py-8 text-center text-sm text-gray-400">No schedule generated yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Due</th>
            <th className="px-3 py-2 text-right font-medium">Installment</th>
            <th className="px-3 py-2 text-right font-medium">Principal</th>
            <th className="px-3 py-2 text-right font-medium">Interest</th>
            <th className="px-3 py-2 text-right font-medium">Balance</th>
            {rows[0].status !== undefined && <th className="px-3 py-2 font-medium">Status</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((r) => (
            <tr
              key={r.emi_number}
              className={
                r.status === "paid"
                  ? "bg-emerald-50/40"
                  : r.status === "missed"
                    ? "bg-red-50/40"
                    : "hover:bg-gray-50"
              }
            >
              <td className="px-3 py-2 tabular-nums text-gray-500">{r.emi_number}</td>
              <td className="px-3 py-2 text-gray-600">{r.due_date ?? "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-800">{pkr(r.emi_amount, { decimals: true })}</td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-600">{pkr(r.principal_component, { decimals: true })}</td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-500">
                {num(r.interest_component) > 0 ? pkr(r.interest_component, { decimals: true }) : "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-600">{pkr(r.closing_balance, { decimals: true })}</td>
              {r.status !== undefined && (
                <td className="px-3 py-2">
                  <LoanStatusBadge status={r.status} kind="emi" />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
