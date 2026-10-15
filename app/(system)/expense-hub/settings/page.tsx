"use client";

/**
 * app/(system)/expense-hub/settings/page.tsx — module settings.
 * Data: /expense-hub/settings. Gate: expense.settings.manage (backend-enforced).
 */

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { expenseHubService } from "@/services/expense-hub";
import type { ExpenseSetting } from "@/types/expense-hub";

/** The known settings the approval engine reads (see ExpenseApprovalService). */
const KNOWN = [
  { key: "auto_approve_below", label: "Auto-approve below (PKR)", type: "decimal" as const, group: "approval", help: "Claims at or below this total skip approval (0 = always require approval)." },
  { key: "l2_approval_threshold", label: "Level-2 approval threshold (PKR)", type: "decimal" as const, group: "approval", help: "Claims above this total need a second (senior) approval (0 = single level)." },
  { key: "block_duplicate_receipts", label: "Block duplicate receipts", type: "boolean" as const, group: "receipts", help: "Reject a receipt with the same number, date and amount." },
];

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["expense-hub", "settings"], queryFn: () => expenseHubService.getSettings() });

  // User edits override the server-derived defaults — no effect needed.
  const [edits, setEdits] = useState<Record<string, string | boolean>>({});

  const serverValues = useMemo(() => {
    const map: Record<string, string | boolean> = {};
    for (const k of KNOWN) {
      const found = data?.find((s: ExpenseSetting) => s.key === k.key);
      map[k.key] = k.type === "boolean" ? Boolean(found?.value) : String(found?.value ?? "");
    }
    return map;
  }, [data]);

  const valueOf = (key: string): string | boolean =>
    key in edits ? edits[key] : serverValues[key] ?? "";
  const setValue = (key: string, v: string | boolean) => setEdits((p) => ({ ...p, [key]: v }));

  const save = useMutation({
    mutationFn: () =>
      expenseHubService.saveSettings(
        KNOWN.map((k) => ({
          key: k.key,
          value: k.type === "boolean" ? (valueOf(k.key) ? "1" : "0") : valueOf(k.key),
          data_type: k.type,
          group: k.group,
        })),
      ),
    onSuccess: () => {
      toast.success("Settings saved.");
      qc.invalidateQueries({ queryKey: ["expense-hub", "settings"] });
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Could not save settings." }),
  });

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">ExpenseHub · Config</nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Module Settings</h1>
        <p className="text-sm text-gray-500">Approval thresholds and receipt controls for this company.</p>
      </div>

      <div className="flex max-w-2xl flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
        {KNOWN.map((k) => (
          <div key={k.key} className="flex flex-col gap-1 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor={`set-${k.key}`} className="text-sm font-medium text-gray-700">{k.label}</Label>
              {k.type === "boolean" ? (
                <Switch id={`set-${k.key}`} checked={!!valueOf(k.key)} onCheckedChange={(v) => setValue(k.key, v)} />
              ) : (
                <Input
                  id={`set-${k.key}`}
                  type="number"
                  value={String(valueOf(k.key) ?? "")}
                  onChange={(e) => setValue(k.key, e.target.value)}
                  className="w-40 text-right"
                />
              )}
            </div>
            <p className="text-xs text-gray-500">{k.help}</p>
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-1.5 bg-brand-800 text-white hover:bg-brand-900">
            <Save className="h-4 w-4" /> Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}
