"use client";

import { showApiError } from "@/lib/error-toast";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SearchIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Eye,
  Pencil,
  PlusIcon,
  MoreHorizontal,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import toast from "react-hot-toast";
import {
  useGratuityPolicies,
  useCreateGratuityPolicy,
  useUpdateGratuityPolicy,
} from "@/hooks/useGratuityPolicies";
import type {
  GratuityPolicy,
  CreateGratuityPolicyPayload,
  UpdateGratuityPolicyPayload,
} from "@/types/gratuity-policy";

const DEFAULT_PER_PAGE = 25;

const CALCULATION_BASIS_OPTIONS = [
  { value: "last_drawn_basic", label: "Last Drawn Basic" },
  { value: "last_drawn_gross", label: "Last Drawn Gross" },
  { value: "average_last_3_months", label: "Average Last 3 Months" },
  { value: "average_last_6_months", label: "Average Last 6 Months" },
];

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function GratuityPoliciesPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading, isFetching, error } = useGratuityPolicies({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const policies = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  const createMutation = useCreateGratuityPolicy();
  const updateMutation = useUpdateGratuityPolicy();

  const [viewItem, setViewItem] = useState<GratuityPolicy | null>(null);
  const [editItem, setEditItem] = useState<GratuityPolicy | null>(null);

  // ── Create form state ─────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateGratuityPolicyPayload>({
    entity_id: "",
    min_service_years: 1,
    calculation_basis: "last_drawn_basic",
    multiplier_per_year: 1,
    max_gratuity_amount: 0,
    prorate_partial_year: false,
    partial_year_threshold_months: 6,
    is_taxable: false,
    effective_from: new Date().toISOString().slice(0, 10),
    is_active: true,
  });

  // ── Edit form state ───────────────────────────────
  const [editForm, setEditForm] = useState<UpdateGratuityPolicyPayload>({});

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load gratuity policies" });
  }, [error]);

  const openCreateDialog = () => {
    setCreateForm({
      entity_id: "",
      min_service_years: 1,
      calculation_basis: "last_drawn_basic",
      multiplier_per_year: 1,
      max_gratuity_amount: 0,
      prorate_partial_year: false,
      partial_year_threshold_months: 6,
      is_taxable: false,
      effective_from: new Date().toISOString().slice(0, 10),
      is_active: true,
    });
    setCreateOpen(true);
  };

  const handleCreate = () => {
    if (!createForm.calculation_basis) return toast.error("Calculation basis is required");
    if (!createForm.effective_from) return toast.error("Effective from is required");

    createMutation.mutate(createForm, {
      onSuccess: () => setCreateOpen(false),
    });
  };

  const openEditDialog = (policy: GratuityPolicy) => {
    setEditItem(policy);
    setEditForm({
      entity_id: policy.entity_id || "",
      min_service_years: Number(policy.min_service_years),
      calculation_basis: policy.calculation_basis,
      multiplier_per_year: Number(policy.multiplier_per_year),
      max_gratuity_amount: Number(policy.max_gratuity_amount),
      prorate_partial_year: policy.prorate_partial_year,
      partial_year_threshold_months: policy.partial_year_threshold_months,
      is_taxable: policy.is_taxable,
      effective_from: policy.effective_from,
      is_active: policy.is_active,
    });
  };

  const handleEditSubmit = () => {
    if (!editItem) return;
    updateMutation.mutate(
      { uuid: editItem.id, data: editForm },
      { onSuccess: () => setEditItem(null) }
    );
  };

  // ── Table columns ─────────────────────────────────
  const columns: ColumnDef<GratuityPolicy & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "#",
        cell: ({ row }) => <div className="font-medium">{row.original.sr}</div>,
      },
      {
        accessorKey: "calculation_basis",
        header: "Calculation Basis",
        cell: ({ row }) => (
          <span className="capitalize">{row.original.calculation_basis.replace(/_/g, " ")}</span>
        ),
      },
      {
        accessorKey: "min_service_years",
        header: "Min Years",
        cell: ({ row }) => <span>{row.original.min_service_years}</span>,
      },
      {
        accessorKey: "multiplier_per_year",
        header: "Multiplier/Year",
        cell: ({ row }) => <span>{row.original.multiplier_per_year}</span>,
      },
      {
        accessorKey: "max_gratuity_amount",
        header: "Max Amount",
        cell: ({ row }) => (
          <span className="font-mono">
            {Number(row.original.max_gratuity_amount).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "effective_from",
        header: "Effective From",
        cell: ({ row }) => <span>{row.original.effective_from}</span>,
      },
      {
        accessorKey: "is_active",
        header: "Active",
        cell: ({ row }) => (
          <Badge className={row.original.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {row.original.is_active ? "Yes" : "No"}
          </Badge>
        ),
      },
      {
        accessorKey: "prorate_partial_year",
        header: "Prorate",
        cell: ({ row }) => <span>{row.original.prorate_partial_year ? "Yes" : "No"}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setViewItem(row.original)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openEditDialog(row.original)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    []
  );

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return policies.map((p, idx) => ({ ...p, sr: startSr + idx + 1 }));
  }, [policies, page, perPage]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  const showingFrom = totalEntries > 0 ? (page - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(page * perPage, totalEntries) : 0;

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Gratuity Policies
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} policies
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Policy
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search policies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select
                value={perPage.toString()}
                onValueChange={(v) => setPerPage(Number(v))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {[10, 15, 25, 50, 100].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4 flex justify-between items-center">
            <span className="text-sm">
              Showing {showingFrom} to {showingTo} of {totalEntries} entries
            </span>
            {(isLoading || isFetching) && (
              <Loader2 className="animate-spin h-5 w-5" />
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="py-3 px-4 text-left text-xs font-semibold uppercase cursor-pointer"
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(
                            h.column.columnDef.header,
                            h.getContext()
                          )}
                          {h.column.getIsSorted() === "asc" ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : h.column.getIsSorted() === "desc" ? (
                            <ChevronLeft className="h-4 w-4" />
                          ) : null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length} className="py-12 text-center">
                      <Loader2 className="animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-12 text-center">
                      No gratuity policies found
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-4 px-4 text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && rows.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from(
                  { length: Math.min(5, totalPages) },
                  (_, i) => {
                    let num;
                    if (totalPages <= 5) num = i + 1;
                    else if (page <= 3) num = i + 1;
                    else if (page >= totalPages - 2)
                      num = totalPages - 4 + i;
                    else num = page - 2 + i;
                    return (
                      <Button
                        key={num}
                        variant={page === num ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(num)}
                      >
                        {num}
                      </Button>
                    );
                  }
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
   {/* View Modal */}
<Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
  <DialogContent className="sm:max-w-[520px]">
    <DialogHeader>
      <DialogTitle>Gratuity policy details</DialogTitle>
      <DialogDescription>Read-only view</DialogDescription>
    </DialogHeader>
    {viewItem && (
      <div className="py-2">
        <div className="divide-y divide-border">
          {[
            ["Calculation basis", viewItem.calculation_basis.replace(/_/g, " ")],
            ["Min service years", viewItem.min_service_years],
            ["Multiplier / year", viewItem.multiplier_per_year],
            ["Max gratuity amount", Number(viewItem.max_gratuity_amount).toLocaleString()],
            ["Prorate partial year", viewItem.prorate_partial_year ? "Yes" : "No"],
            ...(viewItem.prorate_partial_year
              ? [["Threshold months", viewItem.partial_year_threshold_months]]
              : []),
            ["Taxable", viewItem.is_taxable ? "Yes" : "No"],
            ["Effective from", viewItem.effective_from],
          ].map(([key, val]) => (
            <div key={key} className="grid grid-cols-[160px_1fr] gap-2 py-2.5 text-sm">
              <span className="font-medium text-muted-foreground">{key}</span>
              <span className="text-foreground capitalize">{val}</span>
            </div>
          ))}
          <div className="grid grid-cols-[160px_1fr] gap-2 py-2.5 text-sm">
            <span className="font-medium text-muted-foreground">Status</span>
            <span>
              <Badge
                className={
                  viewItem.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {viewItem.is_active ? "Active" : "Inactive"}
              </Badge>
            </span>
          </div>
        </div>
      </div>
    )}
    <DialogFooter>
      <Button variant="outline" onClick={() => setViewItem(null)}>
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* Create Dialog */}
<Dialog open={createOpen} onOpenChange={setCreateOpen}>
  <DialogContent className="sm:max-w-[560px]">
    <DialogHeader>
      <DialogTitle>Create gratuity policy</DialogTitle>
      <DialogDescription>Define a new gratuity policy.</DialogDescription>
    </DialogHeader>
    <div className="flex flex-col gap-4 py-2">
      {/* Calculation Basis */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Calculation basis <span className="text-destructive">*</span>
        </label>
        <Select
          value={createForm.calculation_basis}
          onValueChange={(v) =>
            setCreateForm((prev) => ({ ...prev, calculation_basis: v }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CALCULATION_BASIS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Section: Policy Parameters */}
      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground border-b pb-1">
        Policy parameters
      </p>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Min service years
          </label>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="e.g. 1"
            value={createForm.min_service_years ?? ""}
            onChange={(e) =>
              setCreateForm((prev) => ({
                ...prev,
                min_service_years: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Multiplier / year
          </label>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="e.g. 21"
            value={createForm.multiplier_per_year ?? ""}
            onChange={(e) =>
              setCreateForm((prev) => ({
                ...prev,
                multiplier_per_year: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Effective from <span className="text-destructive">*</span>
          </label>
          <Input
            type="date"
            value={createForm.effective_from}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, effective_from: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Max gratuity amount
        </label>
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="e.g. 2,000,000"
          value={createForm.max_gratuity_amount ?? ""}
          onChange={(e) =>
            setCreateForm((prev) => ({
              ...prev,
              max_gratuity_amount: e.target.value ? Number(e.target.value) : undefined,
            }))
          }
        />
      </div>

      {/* Section: Options */}
      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground border-b pb-1">
        Options
      </p>

     {/* Prorate Section */}
<div className="flex flex-col gap-3">
  <label className="flex items-center gap-2 text-sm cursor-pointer">
    <Checkbox
      checked={createForm.prorate_partial_year}
      onCheckedChange={(checked) =>
        setCreateForm((prev) => ({ ...prev, prorate_partial_year: !!checked }))
      }
    />
    Prorate partial year
  </label>

  {createForm.prorate_partial_year && (
    <div className="flex flex-col gap-1.5 ml-6">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Threshold months
      </label>
      <Input
        type="number"
        min={0}
        max={12}
        placeholder="e.g. 6"
        className="w-36"
        value={createForm.partial_year_threshold_months ?? ""}
        onChange={(e) =>
          setCreateForm((prev) => ({
            ...prev,
            partial_year_threshold_months: Number(e.target.value),
          }))
        }
      />
    </div>
  )}
</div>

{/* Taxable + Active */}
<div className="grid grid-cols-2 gap-3">
  <label className="flex items-center gap-2 text-sm cursor-pointer border rounded-md px-3 py-2.5">
    <Checkbox
      checked={createForm.is_taxable}
      onCheckedChange={(checked) =>
        setCreateForm((prev) => ({ ...prev, is_taxable: !!checked }))
      }
    />
    Taxable
  </label>
  <label className="flex items-center gap-2 text-sm cursor-pointer border rounded-md px-3 py-2.5">
    <Checkbox
      checked={createForm.is_active}
      onCheckedChange={(checked) =>
        setCreateForm((prev) => ({ ...prev, is_active: !!checked }))
      }
    />
    Active
  </label>
</div>
    </div>

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setCreateOpen(false)}
        disabled={createMutation.isPending}
      >
        Cancel
      </Button>
      <Button onClick={handleCreate} disabled={createMutation.isPending}>
        {createMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Create policy
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* Edit Dialog */}
<Dialog
  open={!!editItem}
  onOpenChange={(open) => { if (!open) setEditItem(null); }}
>
  <DialogContent className="sm:max-w-[560px]">
    <DialogHeader>
      <DialogTitle>Edit gratuity policy</DialogTitle>
      <DialogDescription>Update the fields you want to change.</DialogDescription>
    </DialogHeader>
    {editItem && (
      <div className="flex flex-col gap-4 py-2">
        {/* Calculation Basis */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Calculation basis
          </label>
          <Select
            value={editForm.calculation_basis || ""}
            onValueChange={(v) =>
              setEditForm((prev) => ({ ...prev, calculation_basis: v }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select basis" />
            </SelectTrigger>
            <SelectContent>
              {CALCULATION_BASIS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Section: Policy Parameters */}
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground border-b pb-1">
          Policy parameters
        </p>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Min service years
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={editForm.min_service_years ?? ""}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  min_service_years: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Multiplier / year
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={editForm.multiplier_per_year ?? ""}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  multiplier_per_year: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Effective from
            </label>
            <Input
              type="date"
              value={editForm.effective_from || ""}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, effective_from: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Max gratuity amount
          </label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={editForm.max_gratuity_amount ?? ""}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                max_gratuity_amount: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </div>

        {/* Section: Options */}
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground border-b pb-1">
          Options
        </p>

      {/* Prorate Section */}
<div className="flex flex-col gap-3">
  <label className="flex items-center gap-2 text-sm cursor-pointer">
    <Checkbox
      checked={editForm.prorate_partial_year ?? false}
      onCheckedChange={(checked) =>
        setEditForm((prev) => ({ ...prev, prorate_partial_year: !!checked }))
      }
    />
    Prorate partial year
  </label>

  {editForm.prorate_partial_year && (
    <div className="flex flex-col gap-1.5 ml-6">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Threshold months
      </label>
      <Input
        type="number"
        min={0}
        max={12}
        placeholder="e.g. 6"
        className="w-36"
        value={editForm.partial_year_threshold_months ?? ""}
        onChange={(e) =>
          setEditForm((prev) => ({
            ...prev,
            partial_year_threshold_months: Number(e.target.value),
          }))
        }
      />
    </div>
  )}
</div>

{/* Taxable + Active */}
<div className="grid grid-cols-2 gap-3">
  <label className="flex items-center gap-2 text-sm cursor-pointer border rounded-md px-3 py-2.5">
    <Checkbox
      checked={editForm.is_taxable ?? false}
      onCheckedChange={(checked) =>
        setEditForm((prev) => ({ ...prev, is_taxable: !!checked }))
      }
    />
    Taxable
  </label>
  <label className="flex items-center gap-2 text-sm cursor-pointer border rounded-md px-3 py-2.5">
    <Checkbox
      checked={editForm.is_active ?? false}
      onCheckedChange={(checked) =>
        setEditForm((prev) => ({ ...prev, is_active: !!checked }))
      }
    />
    Active
  </label>
</div>
      </div>
    )}

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setEditItem(null)}
        disabled={updateMutation.isPending}
      >
        Cancel
      </Button>
      <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
        {updateMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Save changes
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
}