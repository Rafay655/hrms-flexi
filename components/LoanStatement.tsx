import React, { useMemo } from "react";
import {
  X,
  FileText,
  Landmark,
  Wallet,
  Calendar,
  CheckCircle2,
  Clock3,
} from "lucide-react";

interface LoanStatementProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
}

const formatPKR = (value: number) => `PKR ${value.toLocaleString()}`;

const getLoanSeed = (loanId: string) => {
  const digits = loanId.replace(/\D/g, "");
  return Number(digits.slice(-3) || 1);
};

export const LoanStatement: React.FC<LoanStatementProps> = ({
  isOpen,
  onClose,
  loanId,
}) => {
  const loanData = useMemo(() => {
    const seed = getLoanSeed(loanId);
    const principalOptions = [50000, 150000, 500000, 2500000];
    const principal = principalOptions[seed % 4];
    const emi = Math.round(principal / 12);
    const remainingInst = seed % 10;
    const paidInst = 12 - remainingInst;
    const outstanding = remainingInst <= 0 ? 0 : emi * remainingInst;
    const employeeNames = [
      "Arsalan Khan",
      "Saira Ahmed",
      "Umar Farooq",
      "Zainab Bibi",
      "Mustafa Kamal",
    ];
    const loanTypes = [
      "Salary Advance",
      "Personal",
      "Emergency",
      "Car",
      "House",
    ];

    return {
      loanId,
      empId: `EMP-${1000 + (seed % 99)}`,
      empName: employeeNames[seed % employeeNames.length],
      loanType: loanTypes[seed % loanTypes.length],
      principal,
      emi,
      remainingInst,
      paidInst,
      outstanding,
      startDate: "Jan 01, 2025",
      nextRecoveryDate: "May 31, 2026",
      status: outstanding === 0 ? "Closed" : "Active",
      schedule: Array.from({ length: 12 }).map((_, index) => {
        const instNo = index + 1;
        const recovered = instNo <= paidInst;
        const monthNames = [
          "Jan 2025",
          "Feb 2025",
          "Mar 2025",
          "Apr 2025",
          "May 2025",
          "Jun 2025",
          "Jul 2025",
          "Aug 2025",
          "Sep 2025",
          "Oct 2025",
          "Nov 2025",
          "Dec 2025",
        ];

        return {
          installmentNo: instNo,
          month: monthNames[index] || `Month ${instNo}`,
          amount: emi,
          status: recovered
            ? "Recovered"
            : instNo === paidInst + 1
            ? "Due Next"
            : "Upcoming",
        };
      }),
    };
  }, [loanId]);

  if (!isOpen || !loanId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/35 px-4">
      <div className="w-full max-w-6xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-brand-900">Loan Statement</h3>
              <p className="mt-0.5 text-sm text-brand-700">
                Detailed repayment breakdown and recovery schedule
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[78vh] overflow-y-auto px-6 py-5">
          {/* Top Info */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Loan ID
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-900">
                {loanData.loanId}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Employee
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-900">
                {loanData.empName}
              </p>
              <p className="mt-0.5 text-xs text-brand-700">{loanData.empId}</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Loan Type
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-900">
                {loanData.loanType}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Status
              </p>
              <span
                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  loanData.status === "Closed"
                    ? "border-gray-200 bg-gray-100 text-gray-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {loanData.status}
              </span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Principal
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Landmark className="h-4 w-4 text-brand-800" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-brand-900">
                {formatPKR(loanData.principal)}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Outstanding
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Wallet className="h-4 w-4 text-brand-800" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-brand-900">
                {formatPKR(loanData.outstanding)}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Monthly EMI
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Calendar className="h-4 w-4 text-brand-800" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-brand-900">
                {formatPKR(loanData.emi)}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Remaining
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Clock3 className="h-4 w-4 text-brand-800" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-brand-900">
                {loanData.remainingInst} months
              </p>
            </div>
          </div>

          {/* Meta Bar */}
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm">
              <span className="text-brand-700">Start Date: </span>
              <span className="font-semibold text-brand-900">{loanData.startDate}</span>
            </div>

            <div className="text-sm">
              <span className="text-brand-700">Next Recovery: </span>
              <span className="font-semibold text-brand-900">
                {loanData.nextRecoveryDate}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{loanData.paidInst}</span>
                Recovered
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {loanData.remainingInst}
                </span>
                Pending
              </div>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
              <h4 className="text-sm font-semibold text-brand-900">
                Repayment Schedule
              </h4>
              <p className="mt-0.5 text-sm text-brand-700">
                Installment-wise recovery history and upcoming deductions
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="border-b border-gray-200 bg-white">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Installment
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Month
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {loanData.schedule.map((row) => (
                    <tr key={row.installmentNo} className="hover:bg-brand-100/50">
                      <td className="px-5 py-4 text-sm font-medium text-brand-900">
                        #{row.installmentNo}
                      </td>
                      <td className="px-5 py-4 text-sm text-brand-800">
                        {row.month}
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-brand-900">
                        {formatPKR(row.amount)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            row.status === "Recovered"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : row.status === "Due Next"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-gray-200 bg-gray-100 text-gray-700"
                          }`}
                        >
                          {row.status === "Recovered" && (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          {row.status === "Due Next" && (
                            <Clock3 className="h-3.5 w-3.5" />
                          )}
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Note */}
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-brand-900">
              Recovery Note
            </h4>
            <p className="mt-1 text-sm leading-6 text-brand-700">
              Loan recovery is usually processed automatically through payroll deduction.
              In case of early settlement, adjustment, or manual closure, update the
              statement and payroll deduction together to keep balances aligned.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};