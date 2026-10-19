"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/store/hooks";
import { projectEdgeService } from "@/services/projectedge";
import { budgetMoney } from "@/lib/projectedge-budget";
import { boardFailure } from "@/lib/projectedge-board";
import type {
  BudgetCategory,
  BudgetLine,
  BudgetLineInput,
} from "@/types/projectedge-budget";
import { BudgetBurndown } from "./BudgetBurndown";
import { ProjectEdgeStatePanel } from "./StatePanel";

const categories: Record<BudgetCategory, string> = {
  labor: "Labor",
  material: "Material",
  overhead: "Overhead",
  other: "Other",
};
function failure(error: unknown): string {
  if (!isAxiosError(error))
    return "The budget line could not be saved. Please retry.";
  const parsed = boardFailure(error);
  return [parsed.message, ...parsed.reasons].filter(Boolean).join(" ");
}

export function BudgetDashboard({ projectId }: { projectId: number }) {
  const companyId = useAppSelector((state) => state.auth.company?.id);
  return (
    <BudgetWorkspace key={`${companyId}-${projectId}`} projectId={projectId} />
  );
}

function BudgetWorkspace({ projectId }: { projectId: number }) {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const company = useAppSelector((state) => state.auth.company);
  const canView =
    permissions.includes("projectedge.budget.view") &&
    permissions.includes("projectedge.project.view");
  const query = useQuery({
    queryKey: ["projectedge", "budget", company?.id, projectId],
    queryFn: ({ signal }) => projectEdgeService.budgetReport(projectId, signal),
    enabled: canView && Number.isInteger(projectId) && projectId > 0,
    retry: false,
  });
  const client = useQueryClient();
  const [editing, setEditing] = useState<BudgetLine | "new" | null>(null);
  const money = budgetMoney(company?.currency);
  if (!canView)
    return (
      <ProjectEdgeStatePanel
        kind="access"
        title="Budget access required"
        description="Project visibility and ProjectEdge budget-view access are required to see costs."
      />
    );
  if (!Number.isInteger(projectId) || projectId <= 0)
    return (
      <ProjectEdgeStatePanel
        kind="error"
        title="Invalid project"
        description="Choose a valid project to view its budget."
      />
    );
  if (query.isPending)
    return (
      <div role="status" aria-busy="true" className="pe-card min-h-56 p-6">
        Loading project budget…
      </div>
    );
  if (query.isError)
    return (
      <ProjectEdgeStatePanel
        kind={
          isAxiosError(query.error) && query.error.response?.status === 403
            ? "access"
            : "error"
        }
        title="Project budget unavailable"
        description="The project may be outside your access, or the budget request failed. No cached costs are shown."
        action={{
          label: "Retry budget",
          onClick: () => {
            void query.refetch();
          },
        }}
      />
    );
  const report = query.data;
  const summary = report.summary;
  const canManage =
    report.capabilities.manage &&
    permissions.includes("projectedge.budget.manage");
  const overBudget = Number(summary.remaining) < 0;
  const overPlanned = Number(summary.unallocated_planned) < 0;
  const chartMaximum = Math.max(
    1,
    ...summary.categories.flatMap((category) => [
      Number(category.planned),
      Number(category.actual),
    ]),
  );
  return (
    <section className="space-y-5" aria-label="Project budget dashboard">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Project budget</h2>
          <p className="text-sm text-slate-600">
            {money.label} · Approved time-cost snapshots only. Actuals are
            read-only.
          </p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button onClick={() => setEditing("new")}>Add budget line</Button>
          )}
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => {
              void query.refetch();
            }}
          >
            {query.isFetching ? "Refreshing…" : "Refresh budget"}
          </Button>
        </div>
      </div>
      {money.label === "Currency not configured" && (
        <p className="pe-state-warning rounded border p-3 text-sm">
          No company currency is configured. Amounts are shown without an
          inferred currency.
        </p>
      )}
      <div
        className="grid grid-cols-2 gap-3 lg:grid-cols-5"
        aria-label="Budget summary"
      >
        {[
          ["Planned ceiling", money.format(summary.planned)],
          ["Actual cost", money.format(summary.actual)],
          ["Remaining", money.format(summary.remaining)],
          [
            "Utilization",
            summary.utilization_pct === null
              ? "Undefined"
              : `${summary.utilization_pct}%`,
          ],
          ["Forecast", "Unavailable"],
        ].map(([label, value]) => (
          <div
            key={label}
            className={`pe-card min-w-0 p-4 ${overBudget && (label === "Remaining" || label === "Utilization") ? "pe-state-danger" : ""}`}
          >
            <p className="text-sm">{label}</p>
            <p className="mt-2 break-words text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      {overBudget && (
        <p role="status" className="pe-state-danger rounded border p-3 text-sm">
          Approved labor costs exceed the planned project ceiling. Remaining
          budget is negative; utilization is not capped at 100%.
        </p>
      )}
      {summary.utilization_pct === null && (
        <p className="pe-state-warning rounded border p-3 text-sm">
          Utilization is undefined because the planned ceiling is zero and
          approved costs are nonzero. No percentage is inferred.
        </p>
      )}
      <div className="pe-card space-y-2 p-4 text-sm">
        <p>
          Allocated category plan:{" "}
          <strong>{money.format(summary.allocated_planned)}</strong> ·
          Unallocated plan:{" "}
          <strong>{money.format(summary.unallocated_planned)}</strong> ·
          Approved hours: <strong>{summary.approved_hours} h</strong>
        </p>
        {overPlanned && (
          <p className="pe-state-warning rounded border p-2">
            Budget lines exceed the project ceiling. The category plan is not a
            second project budget.
          </p>
        )}
        <p className="text-slate-600">
          Forecast is unavailable because there is no authoritative
          cost-to-complete estimate. Material, overhead and other actuals remain
          untracked (zero) until an approved integration supplies them; zero
          does not confirm no spending.
        </p>
      </div>
      <section
        className="pe-card space-y-4 p-4 md:p-6"
        aria-label="Budget category breakdown"
      >
        <h3 className="text-lg font-semibold">Category breakdown</h3>
        <p className="text-sm text-slate-600">
          Category planned amounts allocate the project ceiling. Labor actual is
          the approved-time total, not a sum that double-counts labor lines.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {summary.categories.map((category) => (
            <div key={category.budget_type} className="space-y-2">
              <h4 className="font-semibold">
                {categories[category.budget_type]}
              </h4>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>Planned</span>
                <span>{money.format(category.planned)}</span>
              </div>
              <div className="h-3 rounded bg-slate-100" aria-hidden="true">
                <div
                  className="h-full rounded border-2 border-dashed"
                  style={{
                    width: `${(Number(category.planned) / chartMaximum) * 100}%`,
                    borderColor: "var(--pe-brand-500)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>Actual</span>
                <span>{money.format(category.actual)}</span>
              </div>
              <div className="h-3 rounded bg-slate-100" aria-hidden="true">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${(Number(category.actual) / chartMaximum) * 100}%`,
                    background: "var(--pe-brand-900)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <details>
          <summary className="min-h-11 cursor-pointer py-3 font-semibold">
            View category data table
          </summary>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Planned and actual budget by category
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="p-2 text-left">
                    Category
                  </th>
                  <th scope="col" className="p-2 text-right">
                    Planned
                  </th>
                  <th scope="col" className="p-2 text-right">
                    Actual
                  </th>
                  <th scope="col" className="p-2 text-right">
                    Lines
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.categories.map((category) => (
                  <tr key={category.budget_type} className="border-t">
                    <th scope="row" className="p-2 text-left">
                      {categories[category.budget_type]}
                    </th>
                    <td className="p-2 text-right">
                      {money.format(category.planned)}
                    </td>
                    <td className="p-2 text-right">
                      {money.format(category.actual)}
                    </td>
                    <td className="p-2 text-right">{category.line_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
      <BudgetBurndown summary={summary} money={money.format} />
      <section
        className="pe-card space-y-3 p-4 md:p-6"
        aria-label="Budget lines"
      >
        <h3 className="text-lg font-semibold">Budget lines</h3>
        {!report.lines.length ? (
          <p className="text-sm">
            No category budget lines yet. The planned ceiling still comes from
            the project budget.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {report.lines.map((line) => (
              <li
                key={line.id}
                className="min-w-0 space-y-2 rounded-lg border p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="break-words font-semibold">
                      {line.description}
                    </h4>
                    <p className="text-sm">
                      {categories[line.budget_type]}
                      {line.system_generated &&
                        " · System-managed approved-time rollup"}
                    </p>
                  </div>
                  {canManage && !line.system_generated && (
                    <Button
                      variant="outline"
                      aria-label={`Edit budget line ${line.description}`}
                      onClick={() => setEditing(line)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                <p className="text-sm">
                  Planned {money.format(line.planned_amount)} · Actual{" "}
                  {money.format(line.actual_amount)}
                </p>
                {line.cost_per_hour !== null && (
                  <p className="text-sm text-slate-600">
                    Planning rate: {money.format(line.cost_per_hour)} / h. This
                    is not the employee effective cost rate.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {editing && canManage && (
        <BudgetLineDialog
          key={editing === "new" ? "new" : editing.id}
          projectId={projectId}
          line={editing === "new" ? undefined : editing}
          currencyLabel={money.label}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await client.invalidateQueries({
              predicate: ({ queryKey }) =>
                queryKey[0] === "projectedge" &&
                ["budget", "project", "projects", "activity"].includes(
                  String(queryKey[1]),
                ),
            });
          }}
        />
      )}
    </section>
  );
}

const amount = z
  .string()
  .trim()
  .regex(
    /^\d{1,13}(\.\d{1,2})?$/,
    "Enter a non-negative amount with at most two decimal places.",
  );
const schema = z
  .object({
    budget_type: z.enum(["labor", "material", "overhead", "other"]),
    description: z
      .string()
      .trim()
      .min(1, "A description is required.")
      .max(255),
    planned_amount: amount,
    cost_per_hour: z.string().trim(),
  })
  .superRefine((values, context) => {
    if (
      values.budget_type === "labor" &&
      values.cost_per_hour !== "" &&
      !/^\d{1,8}(\.\d{1,2})?$/.test(values.cost_per_hour)
    ) {
      context.addIssue({
        code: "custom",
        path: ["cost_per_hour"],
        message:
          "Enter a non-negative planning rate with at most eight integer digits and two decimal places.",
      });
    }
  });
type Values = z.infer<typeof schema>;
function BudgetLineDialog({
  projectId,
  line,
  currencyLabel,
  onClose,
  onSaved,
}: {
  projectId: number;
  line?: BudgetLine;
  currencyLabel: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      budget_type: line?.budget_type ?? "labor",
      description: line?.description ?? "",
      planned_amount: line?.planned_amount ?? "0.00",
      cost_per_hour: line?.cost_per_hour ?? "",
    },
  });
  const type = form.watch("budget_type");
  const save = form.handleSubmit(async (values) => {
    if (busy) return;
    setBusy(true);
    setError("");
    const payload: BudgetLineInput = {
      budget_type: values.budget_type,
      description: values.description,
      planned_amount: values.planned_amount,
      ...(values.budget_type === "labor"
        ? { cost_per_hour: values.cost_per_hour || null }
        : line
          ? { cost_per_hour: null }
          : {}),
    };
    try {
      await projectEdgeService.saveBudgetLine(projectId, payload, line?.id);
      toast.success("Budget line saved");
      await onSaved();
      onClose();
    } catch (caught) {
      setError(failure(caught));
    } finally {
      setBusy(false);
    }
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        className="projectedge-shell max-h-[90vh] overflow-y-auto"
        showCloseButton={!busy}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          opener?.focus();
        }}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogTitle>
          {line ? "Edit budget line" : "Add budget line"}
        </DialogTitle>
        <DialogDescription>
          Amounts in {currencyLabel}. Actual cost is derived from approved time
          and cannot be edited.
        </DialogDescription>
        {error && (
          <p
            role="alert"
            className="pe-state-danger rounded border p-3 text-sm"
          >
            {error}
          </p>
        )}
        <form onSubmit={save} className="space-y-3">
          <fieldset disabled={busy} className="space-y-3">
            <label className="block">
              Category
              <select
                className="mt-1 min-h-11 w-full rounded border px-3"
                {...form.register("budget_type")}
              >
                {Object.entries(categories).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              Description
              <input
                className="mt-1 min-h-11 w-full rounded border px-3"
                maxLength={255}
                {...form.register("description")}
              />
            </label>
            {form.formState.errors.description && (
              <p role="alert">{form.formState.errors.description.message}</p>
            )}
            <label className="block">
              Planned amount
              <input
                inputMode="decimal"
                className="mt-1 min-h-11 w-full rounded border px-3"
                {...form.register("planned_amount")}
              />
            </label>
            {form.formState.errors.planned_amount && (
              <p role="alert">{form.formState.errors.planned_amount.message}</p>
            )}
            {type === "labor" && (
              <>
                <label className="block">
                  Planning hourly rate (optional)
                  <input
                    inputMode="decimal"
                    className="mt-1 min-h-11 w-full rounded border px-3"
                    {...form.register("cost_per_hour")}
                  />
                </label>
                {form.formState.errors.cost_per_hour && (
                  <p role="alert">
                    {form.formState.errors.cost_per_hour.message}
                  </p>
                )}
              </>
            )}
          </fieldset>
          <div className="flex gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save budget line"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
