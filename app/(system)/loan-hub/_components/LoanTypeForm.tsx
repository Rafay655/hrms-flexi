"use client";

/**
 * LoanTypeForm — create / edit a loan type inside the DataTable modal.
 */

import { showApiError } from "@/lib/error-toast";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loanHubService } from "@/services/loan-hub";
import type { LoanCategory, LoanType } from "@/types/loan-hub";

type ApiErr = { response?: { data?: { message?: string } } };

export function LoanTypeForm({
  mode,
  item,
  onClose,
}: {
  mode: "create" | "edit";
  item?: LoanType;
  onClose?: () => void;
}) {
  const qc = useQueryClient();
  const [code, setCode] = useState(item?.code ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [nameUr, setNameUr] = useState(item?.name_ur ?? "");
  const [category, setCategory] = useState<LoanCategory>(item?.category ?? "loan");
  const [description, setDescription] = useState(item?.description ?? "");
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [displayOrder, setDisplayOrder] = useState(item?.display_order ?? 0);

  const isSystem = item?.is_system ?? false;

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        code,
        name,
        name_ur: nameUr || undefined,
        category,
        description: description || undefined,
        is_active: isActive,
        display_order: displayOrder,
      };
      return mode === "create"
        ? loanHubService.createType(payload)
        : loanHubService.updateType(item!.uuid, payload);
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Loan type created." : "Loan type updated.");
      qc.invalidateQueries({ queryKey: ["loan-hub", "types"] });
      onClose?.();
    },
    onError: (e: ApiErr) => showApiError(e, { fallbackMessage: e.response?.data?.message ?? "Could not save loan type." }),
  });

  if (isSystem) {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
        This is a system-default loan type and cannot be edited. Create a company-specific type instead.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lt-code">Code</Label>
          <Input id="lt-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. BIKE_ADV" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lt-category">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as LoanCategory)}>
            <SelectTrigger id="lt-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="loan">Loan</SelectItem>
              <SelectItem value="advance">Advance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lt-name">Display name</Label>
          <Input id="lt-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Personal Loan" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lt-name-ur">Urdu name (optional)</Label>
          <Input id="lt-name-ur" value={nameUr} onChange={(e) => setNameUr(e.target.value)} dir="rtl" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lt-desc">Description (optional)</Label>
        <Textarea id="lt-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="lt-order">Display order</Label>
          <Input id="lt-order" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} className="w-28" />
        </div>
        <label className="flex items-center gap-2 text-sm text-brand-800">
          <Switch checked={isActive} onCheckedChange={setIsActive} /> Active
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!code || !name || save.isPending} className="bg-brand-800 text-white hover:bg-brand-900">
          {save.isPending ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
