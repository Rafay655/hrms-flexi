"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Loader2, Pencil, PlusIcon } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { engageboardPointsService } from "@/services/engageboard-points.service";
import {
  POINTS_PAGE_SIZE,
  type CreatePointBudgetPayload,
  type CreateRewardsCatalogItemPayload,
  type PointBudget,
  type PointEarningRule,
  type PointRedemption,
  type RewardCategory,
  type RewardsCatalogItem,
  type TierLevel,
  type TriggerType,
} from "@/types/engageboard-points.types";

/**
 * /engageboard/points/admin — dense admin UI (EB-PTS-033, 03-design-system.md §5:
 * "Dense admin screens ... follow ui-ux-pro-max's 'Data-Dense Dashboard' pattern
 * ... reusing this codebase's existing per-page useReactTable convention").
 *
 * 4 sections in one dense tab strip, per the brief: earning-rules table, budget
 * configuration, pending-redemptions approval queue, catalog CRUD.
 */

const TRIGGER_LABEL: Record<TriggerType, string> = {
  manager_recognition: "Manager Recognition",
  peer_recognition: "Peer Recognition",
  survey_completion: "Survey Completion",
  work_anniversary: "Work Anniversary",
  birthday: "Birthday",
  performance_rating: "Performance Rating",
  referral_hired: "Referral Hired",
  training_completed: "Training Completed",
  goal_achieved: "Goal Achieved",
  hr_bonus: "HR Bonus",
};

const CATEGORY_OPTIONS: { value: RewardCategory; label: string }[] = [
  { value: "voucher", label: "Voucher" },
  { value: "time_off", label: "Time Off" },
  { value: "gift", label: "Gift" },
  { value: "experience", label: "Experience" },
  { value: "recognition_item", label: "Recognition Item" },
];

const TIER_OPTIONS: { value: TierLevel; label: string }[] = [
  { value: "bronze", label: "Bronze" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "platinum", label: "Platinum" },
];

function errMsg(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response
    ?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(" ");
  return data?.message || fallback;
}

// ── Earning Rules ──────────────────────────────────────────────────────────

function EarningRulesTab() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PointEarningRule | null>(null);
  const [pointsAmount, setPointsAmount] = useState(0);
  const [active, setActive] = useState(true);

  const rulesQuery = useQuery({
    queryKey: ["engageboard", "points", "earning-rules"],
    queryFn: engageboardPointsService.getEarningRules,
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: () => engageboardPointsService.updateEarningRule(editing!.uuid, { points_amount: pointsAmount, active }),
    onSuccess: () => {
      toast.success("Earning rule updated.");
      queryClient.invalidateQueries({ queryKey: ["engageboard", "points", "earning-rules"] });
      setEditing(null);
    },
    onError: (err) => toast.error(errMsg(err, "Could not update this rule.")),
  });

  const openEdit = (rule: PointEarningRule) => {
    setEditing(rule);
    setPointsAmount(rule.points_amount);
    setActive(rule.active);
  };

  const rules = rulesQuery.data ?? [];

  return (
    <div className="rounded-xl border border-gray-100 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trigger</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-16 text-right">Edit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rulesQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-sm text-gray-500">
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              </TableCell>
            </TableRow>
          ) : rules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-sm text-gray-500">
                No earning rules configured yet.
              </TableCell>
            </TableRow>
          ) : (
            rules.map((rule) => (
              <TableRow key={rule.uuid}>
                <TableCell className="font-medium">{TRIGGER_LABEL[rule.trigger_type]}</TableCell>
                <TableCell className="tabular-nums">{rule.points_amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={rule.active ? "default" : "outline"}>{rule.active ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Earning Rule</DialogTitle>
            <DialogDescription>{editing && TRIGGER_LABEL[editing.trigger_type]}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Points Amount</label>
              <Input type="number" min={0} value={pointsAmount} onChange={(e) => setPointsAmount(Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={active} onCheckedChange={setActive} />
              <span className="text-sm">Active</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Budgets ─────────────────────────────────────────────────────────────────

const emptyBudgetForm: CreatePointBudgetPayload = {
  name: "",
  period: "quarterly",
  department_scope: null,
  period_start: "",
  period_end: "",
  total_points_allocated: 0,
  per_manager_cap: null,
  per_employee_gift_cap: null,
  rollover_policy: "expire",
};

function BudgetsTab() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreatePointBudgetPayload>(emptyBudgetForm);
  const [utilizationUuid, setUtilizationUuid] = useState<string | null>(null);

  const budgetsQuery = useQuery({
    queryKey: ["engageboard", "points", "budgets"],
    queryFn: engageboardPointsService.getBudgets,
    staleTime: 30_000,
  });

  const utilizationQuery = useQuery({
    queryKey: ["engageboard", "points", "budgets", utilizationUuid, "utilization"],
    queryFn: () => engageboardPointsService.getBudgetUtilization(utilizationUuid!),
    enabled: !!utilizationUuid,
  });

  const createMutation = useMutation({
    mutationFn: () => engageboardPointsService.createBudget(form),
    onSuccess: () => {
      toast.success("Budget created.");
      queryClient.invalidateQueries({ queryKey: ["engageboard", "points", "budgets"] });
      setCreating(false);
      setForm(emptyBudgetForm);
    },
    onError: (err) => toast.error(errMsg(err, "Could not create this budget — check for an overlapping period.")),
  });

  const budgets: PointBudget[] = budgetsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => setCreating(true)}>
          <PlusIcon className="h-4 w-4" /> New Budget
        </Button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Allocated</TableHead>
              <TableHead>Disbursed</TableHead>
              <TableHead className="w-28 text-right">Utilization</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budgetsQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : budgets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-gray-500">
                  No budgets yet. Create one to cap points disbursement for a period.
                </TableCell>
              </TableRow>
            ) : (
              budgets.map((b) => (
                <TableRow key={b.uuid}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="capitalize">{b.period}</TableCell>
                  <TableCell>{b.department_scope ?? "Company-wide"}</TableCell>
                  <TableCell className="tabular-nums">{b.total_points_allocated.toLocaleString()}</TableCell>
                  <TableCell className="tabular-nums">{b.points_disbursed.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setUtilizationUuid(b.uuid)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Budget</DialogTitle>
            <DialogDescription>Configure a points budget for a period.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-2 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Period</label>
              <Select value={form.period} onValueChange={(v) => setForm((f) => ({ ...f, period: v as CreatePointBudgetPayload["period"] }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Department Scope (optional)</label>
              <Input
                value={form.department_scope ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, department_scope: e.target.value || null }))}
                placeholder="Company-wide if blank"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Period Start</label>
              <Input type="date" value={form.period_start} onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Period End</label>
              <Input type="date" value={form.period_end} onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Total Points Allocated</label>
              <Input
                type="number"
                min={0}
                value={form.total_points_allocated}
                onChange={(e) => setForm((f) => ({ ...f, total_points_allocated: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Rollover Policy</label>
              <Select value={form.rollover_policy} onValueChange={(v) => setForm((f) => ({ ...f, rollover_policy: v as CreatePointBudgetPayload["rollover_policy"] }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="expire">Expire</SelectItem>
                  <SelectItem value="rollover">Rollover</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Per-Manager Cap (optional)</label>
              <Input
                type="number"
                min={0}
                value={form.per_manager_cap ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, per_manager_cap: e.target.value ? Number(e.target.value) : null }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Per-Employee Gift Cap (optional)</label>
              <Input
                type="number"
                min={0}
                value={form.per_employee_gift_cap ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, per_employee_gift_cap: e.target.value ? Number(e.target.value) : null }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.name || !form.period_start || !form.period_end}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!utilizationUuid} onOpenChange={(open) => !open && setUtilizationUuid(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Budget Utilization</DialogTitle>
            <DialogDescription>{utilizationQuery.data?.budget.name}</DialogDescription>
          </DialogHeader>
          {utilizationQuery.isLoading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scope</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Utilized</TableHead>
                  <TableHead>Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(utilizationQuery.data?.allocations ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-sm text-gray-500">
                      No allocations recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  utilizationQuery.data?.allocations.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell>{a.scope_type} #{a.scope_id}</TableCell>
                      <TableCell className="tabular-nums">{a.allocated.toLocaleString()}</TableCell>
                      <TableCell className="tabular-nums">{a.utilized.toLocaleString()}</TableCell>
                      <TableCell className="tabular-nums">{a.remaining.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Pending Redemptions ──────────────────────────────────────────────────────

function PendingRedemptionsTab() {
  const queryClient = useQueryClient();
  const [pages, setPages] = useState(1);
  const [approving, setApproving] = useState<PointRedemption | null>(null);
  const [rejecting, setRejecting] = useState<PointRedemption | null>(null);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");

  const pendingQuery = useQuery({
    queryKey: ["engageboard", "points", "redemptions", "pending", pages],
    queryFn: async () => {
      const results = await Promise.all(
        Array.from({ length: pages }, (_, i) => engageboardPointsService.getPendingRedemptions(i + 1)),
      );
      return results.flat();
    },
    staleTime: 10_000,
  });

  const approveMutation = useMutation({
    mutationFn: () => engageboardPointsService.approveRedemption(approving!.uuid, { fulfillment_notes: notes }),
    onSuccess: () => {
      toast.success("Redemption approved and fulfilled.");
      queryClient.invalidateQueries({ queryKey: ["engageboard", "points", "redemptions"] });
      setApproving(null);
      setNotes("");
    },
    onError: (err) => toast.error(errMsg(err, "Could not approve this redemption.")),
  });

  const rejectMutation = useMutation({
    mutationFn: () => engageboardPointsService.rejectRedemption(rejecting!.uuid, { reason }),
    onSuccess: () => {
      toast.success("Redemption rejected — points released.");
      queryClient.invalidateQueries({ queryKey: ["engageboard", "points", "redemptions"] });
      setRejecting(null);
      setReason("");
    },
    onError: (err) => toast.error(errMsg(err, "Could not reject this redemption.")),
  });

  const rows = pendingQuery.data ?? [];
  const columns = useMemo<ColumnDef<PointRedemption>[]>(
    () => [
      { accessorKey: "reward", header: "Reward", cell: ({ row }) => row.original.reward?.name ?? "—" },
      {
        accessorKey: "points_deducted",
        header: "Points",
        cell: ({ row }) => <span className="tabular-nums">{row.original.points_deducted.toLocaleString()}</span>,
      },
      {
        accessorKey: "requested_at",
        header: "Requested",
        cell: ({ row }) =>
          row.original.requested_at ? new Date(row.original.requested_at).toLocaleDateString() : "—",
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setApproving(row.original)}>Approve</Button>
            <Button size="sm" variant="outline" className="text-red-600" onClick={() => setRejecting(row.original)}>
              Reject
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  const hasMore = !pendingQuery.isLoading && rows.length - (pages - 1) * POINTS_PAGE_SIZE >= POINTS_PAGE_SIZE;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {pendingQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-gray-500">
                  No redemptions waiting for approval.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <Button variant="outline" onClick={() => setPages((p) => p + 1)} className="self-center">
          Load more
        </Button>
      )}

      <Dialog open={!!approving} onOpenChange={(open) => !open && setApproving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Redemption</DialogTitle>
            <DialogDescription>{approving?.reward?.name} — fulfillment notes are required (EB-PTS-049).</DialogDescription>
          </DialogHeader>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Voucher code emailed to employee on 2026-08-28" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(null)}>Cancel</Button>
            <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending || !notes.trim()}>
              {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve & Fulfill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Redemption</DialogTitle>
            <DialogDescription>{rejecting?.reward?.name} — a reason is required.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending || !reason.trim()}>
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Catalog CRUD ──────────────────────────────────────────────────────────

const emptyCatalogForm: CreateRewardsCatalogItemPayload = {
  name: "",
  category: "voucher",
  description: "",
  points_required: 0,
  monetary_value_pkr: null,
  stock: null,
  eligible_tiers: ["bronze", "silver", "gold", "platinum"],
  requires_approval: true,
  active: true,
};

function CatalogCrudTab() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<RewardsCatalogItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateRewardsCatalogItemPayload>(emptyCatalogForm);

  const catalogQuery = useQuery({
    queryKey: ["engageboard", "points", "catalog", "admin"],
    queryFn: engageboardPointsService.getCatalog,
    staleTime: 15_000,
  });

  const createMutation = useMutation({
    mutationFn: () => engageboardPointsService.createCatalogItem(form),
    onSuccess: () => {
      toast.success("Catalog item created.");
      queryClient.invalidateQueries({ queryKey: ["engageboard", "points", "catalog"] });
      setCreating(false);
      setForm(emptyCatalogForm);
    },
    onError: (err) => toast.error(errMsg(err, "Could not create this catalog item.")),
  });

  const updateMutation = useMutation({
    mutationFn: () => engageboardPointsService.updateCatalogItem(editing!.uuid, form),
    onSuccess: () => {
      toast.success("Catalog item updated.");
      queryClient.invalidateQueries({ queryKey: ["engageboard", "points", "catalog"] });
      setEditing(null);
    },
    onError: (err) => toast.error(errMsg(err, "Could not update this catalog item.")),
  });

  const deactivateMutation = useMutation({
    mutationFn: (uuid: string) => engageboardPointsService.deactivateCatalogItem(uuid),
    onSuccess: () => {
      toast.success("Item deactivated.");
      queryClient.invalidateQueries({ queryKey: ["engageboard", "points", "catalog"] });
    },
    onError: (err) => toast.error(errMsg(err, "Could not deactivate this item.")),
  });

  const openEdit = (item: RewardsCatalogItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description ?? "",
      points_required: item.points_required,
      monetary_value_pkr: item.monetary_value_pkr,
      stock: item.stock,
      eligible_tiers: item.eligible_tiers,
      requires_approval: item.requires_approval,
      active: item.active,
    });
  };

  const toggleTier = (tier: TierLevel) => {
    setForm((f) => ({
      ...f,
      eligible_tiers: f.eligible_tiers.includes(tier)
        ? f.eligible_tiers.filter((t) => t !== tier)
        : [...f.eligible_tiers, tier],
    }));
  };

  const items = catalogQuery.data ?? [];
  const dialogOpen = creating || !!editing;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800">
        This table lists catalog items eligible for your own account&apos;s tier — the
        backend&apos;s <code>GET /points/catalog</code> filters by the caller&apos;s tier for every
        caller, admins included, so higher-tier-only items may not appear here even for HR
        Admin. See docs/engageboard/graph/20b-integration-snippet.md.
      </div>

      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => { setForm(emptyCatalogForm); setCreating(true); }}>
          <PlusIcon className="h-4 w-4" /> New Item
        </Button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Tiers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {catalogQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-gray-500">
                  No catalog items yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.uuid}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="capitalize">{item.category.replace("_", " ")}</TableCell>
                  <TableCell className="tabular-nums">{item.points_required.toLocaleString()}</TableCell>
                  <TableCell>{item.stock === null ? "Unlimited" : item.stock}</TableCell>
                  <TableCell className="text-xs">{item.eligible_tiers.join(", ")}</TableCell>
                  <TableCell>
                    <Badge variant={item.active ? "default" : "outline"}>{item.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {item.active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          disabled={deactivateMutation.isPending}
                          onClick={() => deactivateMutation.mutate(item.uuid)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setCreating(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Catalog Item" : "New Catalog Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-2 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as RewardCategory }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Points Required</label>
              <Input
                type="number"
                min={1}
                value={form.points_required}
                onChange={(e) => setForm((f) => ({ ...f, points_required: Number(e.target.value) }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <Textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Monetary Value (PKR, optional)</label>
              <Input
                type="number"
                min={0}
                value={form.monetary_value_pkr ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, monetary_value_pkr: e.target.value ? Number(e.target.value) : null }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Stock (blank = unlimited)</label>
              <Input
                type="number"
                min={0}
                value={form.stock ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value ? Number(e.target.value) : null }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Eligible Tiers</label>
              <div className="flex flex-wrap gap-4">
                {TIER_OPTIONS.map((t) => (
                  <label key={t.value} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.eligible_tiers.includes(t.value)} onCheckedChange={() => toggleTier(t.value)} />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.requires_approval} onCheckedChange={(v) => setForm((f) => ({ ...f, requires_approval: v }))} />
              <span className="text-sm">Requires HR approval</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
              <span className="text-sm">Active</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button>
            <Button
              onClick={() => (editing ? updateMutation.mutate() : createMutation.mutate())}
              disabled={createMutation.isPending || updateMutation.isPending || !form.name || form.eligible_tiers.length === 0}
            >
              {createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function PointsAdminPage() {
  return (
    <div className="flex flex-col gap-4 p-1">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
          EngageBoard · Points &amp; Rewards
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Points Administration</h1>
        <p className="text-sm text-gray-500">Earning rules, budgets, pending redemptions, and the rewards catalog.</p>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Earning Rules</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="pending">Pending Redemptions</TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
        </TabsList>
        <TabsContent value="rules"><EarningRulesTab /></TabsContent>
        <TabsContent value="budgets"><BudgetsTab /></TabsContent>
        <TabsContent value="pending"><PendingRedemptionsTab /></TabsContent>
        <TabsContent value="catalog"><CatalogCrudTab /></TabsContent>
      </Tabs>
    </div>
  );
}
