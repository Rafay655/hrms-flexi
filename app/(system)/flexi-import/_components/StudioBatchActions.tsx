"use client";

import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Gap = {
  value: string;
  row_count: number;
  parent_id: number | null;
  parent_label?: string;
  decision?: unknown;
  suggestion?: { id: number; value: string; label?: string };
};
type Group = { source_key: string; blocked_reason?: string; values: Gap[] };

function errorMessage(error: unknown) {
  const failure = error as { response?: { data?: { message?: string; error?: { message?: string } } } };
  return failure.response?.data?.error?.message ?? failure.response?.data?.message ?? "The request failed. Refresh the batch and try again.";
}

export const batchReviewMutationKey = (uuid: string | null) => ["flexi-import", "review-action", uuid];

export function StudioReferenceReview({ uuid, editable }: { uuid: string; editable: boolean }) {
  const client = useQueryClient();
  const path = `/flexi-import/batches/${uuid}`;
  const reviewBusy = useIsMutating({ mutationKey: batchReviewMutationKey(uuid) }) > 0;
  const gaps = useQuery<Group[]>({
    queryKey: ["flexi-import", "studio-gaps", uuid],
    enabled: editable,
    queryFn: async () => (await api.get(`${path}/gaps`)).data.data.tables,
  });
  const action = useMutation({
    mutationKey: batchReviewMutationKey(uuid),
    mutationFn: async ({ group, gap }: { group: Group; gap: Gap }) => {
      if (!gap.suggestion) return;
      const response = await api.post(`${path}/gaps/resolve`, { decisions: [{
        source_key: group.source_key,
        value: gap.value,
        parent_id: gap.parent_id,
        action: "use_existing",
        existing_id: gap.suggestion.id,
      }] });
      const failure = response.data.data?.failed?.[0];
      if (failure) throw new Error(failure.reason ?? "The reference decision was rejected.");
    },
    onSettled: () => client.invalidateQueries({ queryKey: ["flexi-import"] }),
  });
  if (!editable) return null;
  return (
    <section className="space-y-3 rounded-xl border bg-white p-5">
      <h2 className="font-semibold">Reference data</h2>
      {action.isSuccess && <p role="status" className="text-sm text-muted-foreground">Reference decision saved. Re-check the batch after editing.</p>}
      {gaps.isPending && <p className="text-sm">Checking reference data…</p>}
      {gaps.isError && <p role="alert" className="text-sm text-red-700">{errorMessage(gaps.error)}</p>}
      {action.isError && <p role="alert" className="text-sm text-red-700">{action.error instanceof Error && !("response" in action.error) ? action.error.message : errorMessage(action.error)}</p>}
      {gaps.data?.length === 0 && <p className="text-sm text-muted-foreground">No missing reference values.</p>}
      {gaps.data?.map((group) => (
        <div key={group.source_key} className="space-y-2 border-t pt-3">
          <h3 className="text-sm font-medium capitalize">{group.source_key.replaceAll("_", " ")}</h3>
          <p className="text-sm text-muted-foreground">{group.blocked_reason ?? "Add genuinely new values in the owning module, then re-check this batch."}</p>
          {group.values.map((gap) => (
            <div key={JSON.stringify([gap.value, gap.parent_id])} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{gap.value}{gap.parent_label ? ` · ${gap.parent_label}` : ""} · {gap.row_count} rows</span>
              {gap.suggestion && !gap.decision && <Button type="button" variant="outline" size="sm" disabled={reviewBusy} onClick={() => {
                if (!client.isMutating({ mutationKey: batchReviewMutationKey(uuid) })) action.mutate({ group, gap });
              }}>
                Use existing {gap.suggestion.label ?? gap.suggestion.value}
              </Button>}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

export function StudioRetry({ uuid, enabled }: { uuid: string; enabled: boolean }) {
  const client = useQueryClient();
  const path = `/flexi-import/batches/${uuid}`;
  const failures = useQuery<unknown[]>({
    queryKey: ["flexi-import", "studio-processing-failures", uuid],
    enabled,
    queryFn: async () => {
      const payload = (await api.get(`${path}/rows`, { params: { status: "failed" } })).data.data;
      return Array.isArray(payload) ? payload : payload?.data ?? [];
    },
  });
  const retry = useMutation({
    mutationFn: async () => { await api.post(`${path}/retry-failed`); },
    onSettled: () => client.invalidateQueries({ queryKey: ["flexi-import"] }),
  });
  if (!enabled || !failures.data?.length) return null;
  return (
    <section className="space-y-2 rounded-xl border bg-white p-5">
      <h2 className="font-semibold">Recovery</h2>
      <p className="text-sm text-muted-foreground">Fix the processing error before retrying these rows.</p>
      <Button variant="outline" disabled={retry.isPending} onClick={() => retry.mutate()}>Retry failed rows</Button>
      {retry.isError && <p role="alert" className="text-sm text-red-700">{errorMessage(retry.error)}</p>}
    </section>
  );
}
