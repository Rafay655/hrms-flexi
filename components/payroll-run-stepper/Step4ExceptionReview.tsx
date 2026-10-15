// components/payroll-run-stepper/Step4Review.tsx
"use client";

import React, { forwardRef, useImperativeHandle } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calculator,
  Wallet,
  TrendingUp,
  TrendingDown,
  Briefcase,
  BarChart4,
  Users,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import type { StepHandle } from "@/types/stepper";

/* ----------------------------------------------------------------------- */
/* Types (matching the API response)                                        */
/* ----------------------------------------------------------------------- */

interface CalculationSummary {
  workflow_id: string;
  total_employees: number;
  succeeded: number;
  failed: number;
  errors: any[];
  totals: {
    total_gross: number;
    total_deductions: number;
    total_net: number;
    total_employer_cost: number;
    employee_count: number;
  };
}

interface Totals {
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_employer_cost: number;
  employee_count: number;
}

interface EarningsBreakdown {
  basic_salary: number;
  standard_allowances: number;
  overtime_payouts: number;
  bonuses_incentives: number;
  expense_reimbursements: number;
  total: number;
}

interface DeductionsBreakdown {
  provident_fund_ee: number;
  income_tax_fbr: number;
  eobi_contribution: number;
  loan_emis: number;
  other_recoveries: number;
  total: number;
}

interface EmployerProvisions {
  pf_employer: number;
  eobi_employer: number;
  gratuity: number;
}

interface ReviewResponse {
  calculation_summary: CalculationSummary;
  workflow_totals: Totals;
  period_totals: Totals;
  earnings_breakdown: EarningsBreakdown;
  deductions_breakdown: DeductionsBreakdown;
  employer_provisions: EmployerProvisions;
  variance_report: {
    period_id: string;
    previous_period_id: string | null;
    message: string;
    summary: any;
    employees: any[];
  };
  component_variance: {
    period_id: string;
    previous_period_id: string | null;
    components: any[];
  };
}

/* ----------------------------------------------------------------------- */
/* Props                                                                    */
/* ----------------------------------------------------------------------- */

interface Step4Props {
  workflowUuid?: string;
}

/* ----------------------------------------------------------------------- */
/* Helpers                                                                  */
/* ----------------------------------------------------------------------- */

function formatPKR(value: number) {
  return `PKR ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function SectionHeader({
  title,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  icon: React.ElementType;
  tone?: "default" | "positive" | "negative";
}) {
  const toneClasses =
    tone === "positive"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "negative"
      ? "bg-rose-50 text-rose-700"
      : "bg-indigo-50 text-[#1E1B4B]";

  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex h-7 w-7 items-center justify-center rounded-md ${toneClasses}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  emphasis,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3.5 py-3 ${
        emphasis
          ? "border-[#1E1B4B]/15 bg-[#1E1B4B]/[0.04]"
          : "border-gray-100 bg-gray-50/70"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3 w-3 ${emphasis ? "text-[#1E1B4B]" : "text-gray-400"}`} />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
      </div>
      <p className="mt-1 text-base font-semibold tabular-nums text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  percentage,
  barColorClass,
}: {
  label: string;
  value: number;
  percentage: string;
  barColorClass: string;
}) {
  const pctNum = parseFloat(percentage);

  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium text-gray-900 tabular-nums">
            {formatPKR(value)}
          </span>
          <span className="w-10 text-right text-[11px] tabular-nums text-gray-400">
            {percentage}
          </span>
        </div>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${barColorClass}`}
          style={{ width: `${Math.min(Math.max(pctNum, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Step Component                                                           */
/* ----------------------------------------------------------------------- */

const Step4Review = forwardRef<StepHandle, Step4Props>(
  function Step4Review({ workflowUuid }, ref) {
    const { data, isLoading, isError } = useQuery({
      queryKey: ["payroll-review", workflowUuid],
      queryFn: async () => {
        const { data } = await api.post(
          `/pay-edge/payroll-workflows/${workflowUuid}/review`
        );
        return data.data as ReviewResponse;
      },
      enabled: !!workflowUuid,
    });

    useImperativeHandle(ref, () => ({
      beforeNext: async () => {
        // No action required, just move forward
        return Promise.resolve();
      },
    }));

    if (!workflowUuid) {
      return (
        <div className="py-8 text-center text-sm text-gray-500">
          No workflow selected. Please complete previous steps first.
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      );
    }

    if (isError || !data) {
      return (
        <div className="py-8 text-center text-sm text-red-500">
          Failed to load payroll review. Please try again.
        </div>
      );
    }

    const {
      calculation_summary,
      workflow_totals,
      earnings_breakdown,
      deductions_breakdown,
      employer_provisions,
      variance_report,
    } = data;

    const hasErrors = calculation_summary.failed > 0 || calculation_summary.errors.length > 0;

    // Percentages for breakdowns
    const earningsPct = (value: number) =>
      earnings_breakdown.total > 0
        ? `${((value / earnings_breakdown.total) * 100).toFixed(1)}%`
        : "0%";
    const deductionsPct = (value: number) =>
      deductions_breakdown.total > 0
        ? `${((value / deductions_breakdown.total) * 100).toFixed(1)}%`
        : "0%";

    return (
      <div className="space-y-6">
        {/* Calculation status */}
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 ${
            hasErrors
              ? "border-rose-200 bg-rose-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          {hasErrors ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          )}
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              {hasErrors
                ? `${calculation_summary.failed} employee(s) failed`
                : "All employees calculated successfully"}
            </p>
            <p className="text-sm text-gray-600">
              {calculation_summary.succeeded} succeeded · {calculation_summary.failed} failed ·{" "}
              {calculation_summary.errors.length} error(s)
            </p>
          </div>
          <div className="hidden items-center gap-1.5 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-500 sm:flex">
            <Calculator className="h-3.5 w-3.5" />
            {calculation_summary.total_employees} total
          </div>
        </div>

        {/* Totals */}
        <Card>
          <SectionHeader title="Payroll Totals" icon={Wallet} />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Gross Pay"
              value={formatPKR(workflow_totals.total_gross)}
              sub={`${workflow_totals.employee_count} employees`}
              icon={TrendingUp}
            />
            <StatTile
              label="Deductions"
              value={formatPKR(workflow_totals.total_deductions)}
              icon={TrendingDown}
            />
            <StatTile
              label="Net Payout"
              value={formatPKR(workflow_totals.total_net)}
              icon={Wallet}
              emphasis
            />
            <StatTile
              label="Employer Cost"
              value={formatPKR(workflow_totals.total_employer_cost)}
              icon={Briefcase}
            />
          </div>
        </Card>

        {/* Earnings + Deductions side by side, equal height */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
          <Card className="flex h-full flex-col">
            <SectionHeader title="Earnings Breakdown" icon={TrendingUp} tone="positive" />
            <div className="mt-4 flex-1 space-y-0.5">
              <BreakdownRow
                label="Basic Salary"
                value={earnings_breakdown.basic_salary}
                percentage={earningsPct(earnings_breakdown.basic_salary)}
                barColorClass="bg-emerald-400"
              />
              <BreakdownRow
                label="Standard Allowances"
                value={earnings_breakdown.standard_allowances}
                percentage={earningsPct(earnings_breakdown.standard_allowances)}
                barColorClass="bg-emerald-400"
              />
              <BreakdownRow
                label="Overtime Payouts"
                value={earnings_breakdown.overtime_payouts}
                percentage={earningsPct(earnings_breakdown.overtime_payouts)}
                barColorClass="bg-emerald-400"
              />
              <BreakdownRow
                label="Bonuses & Incentives"
                value={earnings_breakdown.bonuses_incentives}
                percentage={earningsPct(earnings_breakdown.bonuses_incentives)}
                barColorClass="bg-emerald-400"
              />
              <BreakdownRow
                label="Expense Reimbursements"
                value={earnings_breakdown.expense_reimbursements}
                percentage={earningsPct(earnings_breakdown.expense_reimbursements)}
                barColorClass="bg-emerald-400"
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-sm font-semibold">
              <span className="text-gray-900">Total Earnings</span>
              <span className="font-mono tabular-nums text-emerald-700">
                {formatPKR(earnings_breakdown.total)}
              </span>
            </div>
          </Card>

          <Card className="flex h-full flex-col">
            <SectionHeader title="Deductions Breakdown" icon={TrendingDown} tone="negative" />
            <div className="mt-4 flex-1 space-y-0.5">
              <BreakdownRow
                label="Provident Fund (EE)"
                value={deductions_breakdown.provident_fund_ee}
                percentage={deductionsPct(deductions_breakdown.provident_fund_ee)}
                barColorClass="bg-rose-400"
              />
              <BreakdownRow
                label="Income Tax (FBR)"
                value={deductions_breakdown.income_tax_fbr}
                percentage={deductionsPct(deductions_breakdown.income_tax_fbr)}
                barColorClass="bg-rose-400"
              />
              <BreakdownRow
                label="EOBI Contribution"
                value={deductions_breakdown.eobi_contribution}
                percentage={deductionsPct(deductions_breakdown.eobi_contribution)}
                barColorClass="bg-rose-400"
              />
              <BreakdownRow
                label="Loan EMIs"
                value={deductions_breakdown.loan_emis}
                percentage={deductionsPct(deductions_breakdown.loan_emis)}
                barColorClass="bg-rose-400"
              />
              <BreakdownRow
                label="Other Recoveries"
                value={deductions_breakdown.other_recoveries}
                percentage={deductionsPct(deductions_breakdown.other_recoveries)}
                barColorClass="bg-rose-400"
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-sm font-semibold">
              <span className="text-gray-900">Total Deductions</span>
              <span className="font-mono tabular-nums text-rose-700">
                {formatPKR(deductions_breakdown.total)}
              </span>
            </div>
          </Card>
        </div>

        {/* Employer provisions */}
        <Card>
          <SectionHeader title="Employer Provisions" icon={Briefcase} />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile
              label="PF Employer"
              value={formatPKR(employer_provisions.pf_employer)}
              icon={Landmark}
            />
            <StatTile
              label="EOBI Employer"
              value={formatPKR(employer_provisions.eobi_employer)}
              icon={ShieldCheck}
            />
            <StatTile
              label="Gratuity"
              value={formatPKR(employer_provisions.gratuity)}
              icon={Users}
            />
          </div>
        </Card>

        {/* Variance report */}
        {variance_report.message && (
          <Card>
            <SectionHeader title="Variance Report" icon={BarChart4} />
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/60 p-3 text-sm text-gray-600">
              {variance_report.message}
            </div>
          </Card>
        )}
      </div>
    );
  }
);

export default Step4Review;