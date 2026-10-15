"use client";

/**
 * LoanPolicyForm — create / edit a loan policy inside the DataTable modal.
 * loan_type is fixed on edit (it defines the policy's identity).
 */

import { showApiError } from "@/lib/error-toast";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loanHubService } from "@/services/loan-hub";
import { INTEREST_TYPE_LABELS, num } from "@/lib/loan-hub";
import type { InterestType, LoanPolicy } from "@/types/loan-hub";

type ApiErr = { response?: { data?: { message?: string } } };

export function LoanPolicyForm({
  mode,
  item,
  onClose,
}: {
  mode: "create" | "edit";
  item?: LoanPolicy;
  onClose?: () => void;
}) {
  const qc = useQueryClient();
  const types = useQuery({ queryKey: ["loan-hub", "types", "active"], queryFn: () => loanHubService.getTypes({ is_active: true }) });

  const [f, setF] = useState({
    loan_type_id: item?.loan_type_id ?? 0,
    min_amount: num(item?.min_amount) || 1000,
    max_amount_absolute: num(item?.max_amount_absolute) || 500000,
    min_tenure: item?.min_tenure ?? 1,
    max_tenure: item?.max_tenure ?? 36,
    interest_type: (item?.interest_type ?? "interest_free") as InterestType,
    interest_rate: num(item?.interest_rate),
    max_concurrent_loans: item?.max_concurrent_loans ?? 2,
    max_concurrent_same_type: item?.max_concurrent_same_type ?? 1,
    cooling_period_months: item?.cooling_period_months ?? 0,
    min_tenure_months: item?.min_tenure_months ?? 0,
    max_emi_pct_of_gross: num(item?.max_emi_pct_of_gross) || 50,
    prepayment_penalty_pct: num(item?.prepayment_penalty_pct),
    requires_guarantor: item?.requires_guarantor ?? false,
    requires_documents: item?.requires_documents ?? false,
    allow_prepayment: item?.allow_prepayment ?? true,
    is_active: item?.is_active ?? true,
  });
  const set = (k: keyof typeof f, v: number | string | boolean) => setF((s) => ({ ...s, [k]: v }));

  const isSystem = item?.is_system ?? false;

  const save = useMutation({
    mutationFn: () =>
      mode === "create"
        ? loanHubService.createPolicy(f)
        // loan_type_id is not in the update whitelist server-side, so it's ignored.
        : loanHubService.updatePolicy(item!.uuid, f),
    onSuccess: () => {
      toast.success(mode === "create" ? "Policy created." : "Policy updated.");
      qc.invalidateQueries({ queryKey: ["loan-hub", "policies"] });
      onClose?.();
    },
    onError: (e: ApiErr) => showApiError(e, { fallbackMessage: e.response?.data?.message ?? "Could not save policy." }),
  });

  if (isSystem) {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
        This is a system-default policy and cannot be edited. Create a company-specific policy instead.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-3">
          <Label>Loan type</Label>
          <Select
            value={f.loan_type_id ? String(f.loan_type_id) : ""}
            onValueChange={(v) => set("loan_type_id", Number(v))}
            disabled={mode === "edit"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a loan type…" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {(types.data ?? []).map((t) => (
                <SelectItem key={t.uuid} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Num label="Min amount" v={f.min_amount} on={(v) => set("min_amount", v)} />
        <Num label="Max amount" v={f.max_amount_absolute} on={(v) => set("max_amount_absolute", v)} />
        <Num label="Min service (months)" v={f.min_tenure_months} on={(v) => set("min_tenure_months", v)} />
        <Num label="Min tenure (months)" v={f.min_tenure} on={(v) => set("min_tenure", v)} />
        <Num label="Max tenure (months)" v={f.max_tenure} on={(v) => set("max_tenure", v)} />
        <Num label="Max installment % of gross" v={f.max_emi_pct_of_gross} on={(v) => set("max_emi_pct_of_gross", v)} />

        <div className="space-y-1.5">
          <Label>Interest type</Label>
          <Select value={f.interest_type} onValueChange={(v) => set("interest_type", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {Object.entries(INTEREST_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Num label="Interest rate (%)" v={f.interest_rate} on={(v) => set("interest_rate", v)} disabled={f.interest_type === "interest_free"} />
        <Num label="Prepayment penalty (%)" v={f.prepayment_penalty_pct} on={(v) => set("prepayment_penalty_pct", v)} />

        <Num label="Max concurrent loans" v={f.max_concurrent_loans} on={(v) => set("max_concurrent_loans", v)} />
        <Num label="Max of this type" v={f.max_concurrent_same_type} on={(v) => set("max_concurrent_same_type", v)} />
        <Num label="Cooling period (months)" v={f.cooling_period_months} on={(v) => set("cooling_period_months", v)} />
      </div>

      <div className="flex flex-wrap gap-5 border-t border-gray-100 pt-3">
        <Toggle label="Requires guarantor" v={f.requires_guarantor} on={(v) => set("requires_guarantor", v)} />
        <Toggle label="Requires documents" v={f.requires_documents} on={(v) => set("requires_documents", v)} />
        <Toggle label="Allow prepayment" v={f.allow_prepayment} on={(v) => set("allow_prepayment", v)} />
        <Toggle label="Active" v={f.is_active} on={(v) => set("is_active", v)} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!f.loan_type_id || save.isPending} className="bg-brand-800 text-white hover:bg-brand-900">
          {save.isPending ? "Saving…" : mode === "create" ? "Create policy" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function Num({ label, v, on, disabled }: { label: string; v: number; on: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" step="any" value={v} onChange={(e) => on(Number(e.target.value))} disabled={disabled} />
    </div>
  );
}

function Toggle({ label, v, on }: { label: string; v: boolean; on: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-brand-800">
      <Switch checked={v} onCheckedChange={on} /> {label}
    </label>
  );
}
