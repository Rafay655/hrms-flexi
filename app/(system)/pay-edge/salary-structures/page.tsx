"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SearchIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  PlusIcon,
  Eye,
  Pencil,
  Trash2,
  FolderOpen,
  Calculator,
  ListTree,
  Sparkles,
  Info,
  MoreHorizontal,
  Banknote,
  Receipt,
  Building2,
  Copy, // ← added for clone icon
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
import { useSimulateSalaryStructure } from '@/hooks/useSalaryStructures';

import { useCurrencies } from "@/hooks/useCurrencies";
import { usePayHeads } from "@/hooks/usePayHeads";
import {
  useSalaryStructures,
  useSalaryStructureDetail,
  useCreateSalaryStructure,
  useUpdateSalaryStructure,
  useDeleteSalaryStructure,
  useCreateSalaryStructureComponent,
  useCloneSalaryStructure, // ← added
} from "@/hooks/useSalaryStructures";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type {
  SalaryStructure,
  SalaryStructureFormData,
  SalaryStructureComponent,
  SalaryStructureComponentFormData,
} from "@/types/salary-structure";

const DEFAULT_PER_PAGE = 25;

const CALCULATION_TYPES = [
  { value: "fixed", label: "Fixed" },
  { value: "percentage_of_basic", label: "% of Basic" },
  { value: "percentage_of_gross", label: "% of Gross" },
  { value: "formula", label: "Formula" },
];

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SalaryStructuresPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  // ── Currencies ──────────────────────────────────────────
  const { data: currenciesData, isLoading: isLoadingCurrencies } = useCurrencies({ per_page: 1000 });
  const currencies = currenciesData?.data ?? [];
  const currencyOptions: Option[] = useMemo(
    () => currencies.map((c: any) => ({ value: c.iso_code, label: `${c.iso_code} – ${c.name}` })),
    [currencies]
  );

  // ── Pay heads ───────────────────────────────────────────
  const { data: payHeadsData, isLoading: isLoadingPayHeads } = usePayHeads({ per_page: 1000 });
  const payHeads = payHeadsData?.data ?? [];
  const payHeadOptions: Option[] = useMemo(
    () => payHeads.map((ph: any) => ({ value: ph.id, label: `${ph.name} (${ph.code})` })),
    [payHeads]
  );

  // ── Salary structures data ─────────────────────────────
  const { data, isLoading, isFetching, error } = useSalaryStructures({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });
  const structures = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  // ── Mutations ──────────────────────────────────────────
  const createMutation = useCreateSalaryStructure();
  const updateMutation = useUpdateSalaryStructure();
  const deleteMutation = useDeleteSalaryStructure();
  const createComponentMutation = useCreateSalaryStructureComponent();
  const cloneMutation = useCloneSalaryStructure(); // ← added

  // ── Simulation mutation ────────────────────────────────
  const simulateMutation = useSimulateSalaryStructure();

  // ── Main modal (create / edit / view) ──────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedItem, setSelectedItem] = useState<SalaryStructure | null>(null);
  const [formData, setFormData] = useState<SalaryStructureFormData>({
    name: "",
    description: "",
    currency_code: "",
    is_default: false,
    is_active: true,
  });

  // ── Clone modal state ──────────────────────────────────
  const [cloneUuid, setCloneUuid] = useState<string | null>(null);
  const [cloneNewName, setCloneNewName] = useState("");

  // ── Detail modal (components) ──────────────────────────
  const [detailUuid, setDetailUuid] = useState<string | null>(null);
  const { data: detailData, isLoading: isLoadingDetail } = useSalaryStructureDetail(detailUuid ?? undefined);

  const [showAddComponent, setShowAddComponent] = useState(false);
  const [componentForm, setComponentForm] = useState<SalaryStructureComponentFormData>({
    pay_head_id: "",
    calculation_type: "fixed",
    default_value: "",
    percentage: "",
    formula_expression: "",
    min_amount: "",
    max_amount: "",
    is_mandatory: false,
    display_order: 0,
  });

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  // ── Simulation modal state ─────────────────────────────
  const [simulateUuid, setSimulateUuid] = useState<string | null>(null);
  const [grossSalary, setGrossSalary] = useState<number>(0);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch]);
  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load salary structures" });
  }, [error]);

  // ── Handlers (main CRUD) ──────────────────────────────
  const populateForm = (item: SalaryStructure) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description ?? "",
      currency_code: item.currency_code ?? "",
      is_default: item.is_default,
      is_active: item.is_active,
    });
  };

  const handleView = (item: SalaryStructure) => {
    populateForm(item);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (item: SalaryStructure) => {
    populateForm(item);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({ name: "", description: "", currency_code: "", is_default: false, is_active: true });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleDelete = (uuid: string) => setDeleteUuid(uuid);
  const confirmDelete = () => {
    if (deleteUuid) deleteMutation.mutate(deleteUuid, { onSuccess: () => setDeleteUuid(null) });
  };

  const handleSave = () => {
    if (!formData.name.trim()) { toast.error("Name is required"); return; }
    if (formData.name.trim().length > 100) { toast.error("Name must be 100 characters or fewer"); return; }
    if (!formData.currency_code) { toast.error("Currency is required"); return; }
    const payload = { ...formData, name: formData.name.trim() };
    if (modalMode === "create") createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    else if (selectedItem) updateMutation.mutate({ uuid: selectedItem.id, data: payload }, { onSuccess: () => setIsModalOpen(false) });
  };

  // ── Detail modal handlers ─────────────────────────────
  const openDetail = (uuid: string) => {
    setDetailUuid(uuid);
    setShowAddComponent(false);
    setComponentForm({
      pay_head_id: "",
      calculation_type: "fixed",
      default_value: "",
      percentage: "",
      formula_expression: "",
      min_amount: "",
      max_amount: "",
      is_mandatory: false,
      display_order: 0,
    });
  };

  const assignedPayHeadIds = useMemo(() => {
    if (!detailData?.components) return new Set<string>();
    return new Set(
      detailData.components
        .filter(c => c.pay_head_id)
        .map(c => String(c.pay_head_id))
    );
  }, [detailData?.components]);

  const availablePayHeadOptions = useMemo(() => {
    return payHeadOptions.filter(opt => !assignedPayHeadIds.has(String(opt.value)));
  }, [payHeadOptions, assignedPayHeadIds]);

  const handleAddComponent = () => {
    if (!detailUuid) return;
    if (!componentForm.pay_head_id) { toast.error("Pay Head is required"); return; }
    if (!componentForm.calculation_type) { toast.error("Calculation type is required"); return; }

    const isPercentageType = componentForm.calculation_type.includes("percentage");
    if (isPercentageType) {
      const percentageValue = parseFloat(componentForm.percentage);
      if (isNaN(percentageValue) || percentageValue < 0 || percentageValue > 100) {
        toast.error("Percentage must be a number between 0 and 100");
        return;
      }
    }
    if (componentForm.calculation_type === "formula" && !componentForm.formula_expression.trim()) {
      toast.error("Formula expression is required when calculation type is formula");
      return;
    }

    createComponentMutation.mutate(
      { structureUuid: detailUuid, data: componentForm },
      {
        onSuccess: () => {
          setShowAddComponent(false);
          setComponentForm({
            pay_head_id: "",
            calculation_type: "fixed",
            default_value: "",
            percentage: "",
            formula_expression: "",
            min_amount: "",
            max_amount: "",
            is_mandatory: false,
            display_order: 0,
          });
        },
      }
    );
  };

  const handleSimulate = () => {
    if (!simulateUuid || grossSalary <= 0) {
      toast.error("Please enter a valid gross salary");
      return;
    }
    simulateMutation.mutate({ uuid: simulateUuid, gross_salary: grossSalary });
  };

  // ── Table columns ─────────────────────────────────────
  const columns: ColumnDef<SalaryStructure & { sr: number }>[] = useMemo(() => [
    { accessorKey: "sr", header: "#", cell: ({ row }) => <div className="font-medium">{row.original.sr}</div> },
    { accessorKey: "name", header: "Name", cell: ({ row }) => <div className="font-semibold">{row.original.name}</div> },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="text-sm text-gray-600 max-w-xs truncate">{row.original.description ?? "—"}</div>,
    },
    {
      accessorKey: "currency_code",
      header: "Currency",
      cell: ({ row }) => <span className="font-mono">{row.original.currency_code ?? "—"}</span>,
    },
    {
      accessorKey: "is_default",
      header: "Default",
      cell: ({ row }) => (row.original.is_default ? <Badge className="bg-blue-100 text-blue-800">Default</Badge> : "—"),
    },
    {
      accessorKey: "components_count",
      header: "Components",
      cell: ({ row }) => <span>{row.original.components_count}</span>,
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={row.original.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => openDetail(row.original.id)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                View Components
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleView(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {/* ── Clone action added ── */}
              <DropdownMenuItem
                onClick={() => {
                  setCloneUuid(row.original.id);
                  setCloneNewName(`${row.original.name} - Copy`);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Clone
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(row.original.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSimulateUuid(row.original.id);
                  setGrossSalary(0);
                  simulateMutation.reset();
                }}
              >
                <Calculator className="mr-2 h-4 w-4" />
                Simulate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], []);

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return structures.map((s, idx) => ({ ...s, sr: startSr + idx + 1 }));
  }, [structures, page, perPage]);

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
              <CardTitle className="text-2xl font-bold text-gray-900">Salary Structures</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{totalEntries.toLocaleString()} structures</p>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Structure
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select value={perPage.toString()} onValueChange={v => setPerPage(Number(v))}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">{[10,15,25,50,100].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4 flex justify-between items-center">
            <span className="text-sm">Showing {showingFrom} to {showingTo} of {totalEntries} entries</span>
            {(isLoading || isFetching) && <Loader2 className="animate-spin h-5 w-5" />}
          </div>

          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id} className="py-3 px-4 text-left text-xs font-semibold uppercase cursor-pointer" onClick={h.column.getToggleSortingHandler()}>
                        <div className="flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getIsSorted() === 'asc' ? <ChevronRight className="h-4 w-4" /> : h.column.getIsSorted() === 'desc' ? <ChevronLeft className="h-4 w-4" /> : null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={columns.length} className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={columns.length} className="py-12 text-center">No salary structures found</td></tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="py-4 px-4 text-sm">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
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
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let num;
                  if (totalPages <= 5) num = i + 1;
                  else if (page <= 3) num = i + 1;
                  else if (page >= totalPages - 2) num = totalPages - 4 + i;
                  else num = page - 2 + i;
                  return <Button key={num} variant={page === num ? "default" : "outline"} size="sm" onClick={() => setPage(num)}>{num}</Button>;
                })}
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Modal (Create/Edit/View) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Add Salary Structure" : modalMode === "edit" ? "Edit Salary Structure" : "View Salary Structure"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "view" ? "Read-only view." : "Fill in the details."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name *</label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} disabled={modalMode === "view"} maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} disabled={modalMode === "view"} rows={3} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Currency *</label>
              <SearchableSelect
                options={currencyOptions}
                value={formData.currency_code}
                onChange={(v) => setFormData(p => ({ ...p, currency_code: v as string }))}
                placeholder="Select currency"
                groupLabel="Currencies"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode === "view" || isLoadingCurrencies}
                multiple={false}
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={formData.is_default} onCheckedChange={(c) => setFormData(p => ({ ...p, is_default: !!c }))} disabled={modalMode === "view"} />
                Default
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={formData.is_active} onCheckedChange={(c) => setFormData(p => ({ ...p, is_active: !!c }))} disabled={modalMode === "view"} />
                Active
              </label>
            </div>
          </div>
          <DialogFooter>
            {modalMode !== "view" ? (
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Clone Modal ──────────────────────────────────── */}
      <Dialog open={!!cloneUuid} onOpenChange={(open) => { if (!open) setCloneUuid(null); }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Clone Salary Structure</DialogTitle>
            <DialogDescription>
              Enter a new name for the cloned structure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">New Name *</label>
              <Input
                value={cloneNewName}
                onChange={(e) => setCloneNewName(e.target.value)}
                placeholder="Enter new name"
                maxLength={100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCloneUuid(null)}
              disabled={cloneMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!cloneNewName.trim()) {
                  toast.error("Name is required");
                  return;
                }
                cloneMutation.mutate(
                  { uuid: cloneUuid!, new_name: cloneNewName.trim() },
                  { onSuccess: () => setCloneUuid(null) }
                );
              }}
              disabled={cloneMutation.isPending}
            >
              {cloneMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal (Components) */}
      <Dialog open={!!detailUuid} onOpenChange={(open) => { if (!open) setDetailUuid(null); }}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailData?.name ?? "Structure Details"}</DialogTitle>
            <DialogDescription>{detailData?.description}</DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Pay Head</TableHead>
                      <TableHead>Calc Type</TableHead>
                      <TableHead>Default Value</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Formula</TableHead>
                      <TableHead>Min</TableHead>
                      <TableHead>Max</TableHead>
                      <TableHead>Mandatory</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailData?.components?.length ? (
                      detailData.components.map((comp: SalaryStructureComponent) => (
                        <TableRow key={comp.id}>
                          <TableCell>{comp.display_order}</TableCell>
                          <TableCell>
                            {comp.pay_head_name ? (
                              <span className="font-medium">{comp.pay_head_name}</span>
                            ) : (
                              <span className="italic text-gray-400">Custom</span>
                            )}
                          </TableCell>
                          <TableCell>{comp.calculation_type}</TableCell>
                          <TableCell>{comp.default_value || "—"}</TableCell>
                          <TableCell>{comp.percentage ?? "—"}</TableCell>
                          <TableCell className="max-w-[120px] truncate">{comp.formula_expression ?? "—"}</TableCell>
                          <TableCell>{comp.min_amount ?? "—"}</TableCell>
                          <TableCell>{comp.max_amount ?? "—"}</TableCell>
                          <TableCell>{comp.is_mandatory ? "Yes" : "No"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-6 text-gray-500">No components added yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {!showAddComponent ? (
                <Button variant="outline" className="mt-4" onClick={() => setShowAddComponent(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" /> Add Component
                </Button>
              ) : (
                <div className="mt-4 p-4 border rounded-lg space-y-4">
                  <h4 className="font-semibold text-sm">New Component</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Pay Head *</label>
                      <SearchableSelect
                        options={availablePayHeadOptions}
                        value={componentForm.pay_head_id}
                        onChange={(v) => setComponentForm(p => ({ ...p, pay_head_id: v as string }))}
                        placeholder={availablePayHeadOptions.length === 0 ? "All pay heads assigned" : "Select pay head"}
                        groupLabel="Pay Heads"
                        allowAll={false}
                        widthClass="w-full"
                        disabled={isLoadingPayHeads || availablePayHeadOptions.length === 0}
                        multiple={false}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Calculation Type *</label>
                      <Select value={componentForm.calculation_type} onValueChange={(v) => setComponentForm(p => ({ ...p, calculation_type: v }))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>{CALCULATION_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        {componentForm.calculation_type.includes("percentage") ? "Percentage *" : "Percentage"}
                      </label>
                      <Input value={componentForm.percentage} onChange={e => setComponentForm(p => ({ ...p, percentage: e.target.value }))} placeholder="45" type="number" min={0} max={100} step="0.01" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        {componentForm.calculation_type === "formula" ? "Formula Expression *" : "Formula Expression"}
                      </label>
                      <Input value={componentForm.formula_expression} onChange={e => setComponentForm(p => ({ ...p, formula_expression: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Default Value</label>
                      <Input value={componentForm.default_value} onChange={e => setComponentForm(p => ({ ...p, default_value: e.target.value }))} placeholder="0.00" type="number" step="0.01" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Min Amount</label>
                      <Input value={componentForm.min_amount} onChange={e => setComponentForm(p => ({ ...p, min_amount: e.target.value }))} type="number" step="0.01" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Max Amount</label>
                      <Input value={componentForm.max_amount} onChange={e => setComponentForm(p => ({ ...p, max_amount: e.target.value }))} type="number" step="0.01" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Display Order</label>
                      <Input type="number" min={0} value={componentForm.display_order} onChange={e => setComponentForm(p => ({ ...p, display_order: Number(e.target.value) }))} />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <Checkbox checked={componentForm.is_mandatory} onCheckedChange={(c) => setComponentForm(p => ({ ...p, is_mandatory: !!c }))} />
                      <label className="text-xs font-medium">Mandatory</label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddComponent(false)}>Cancel</Button>
                    <Button onClick={handleAddComponent} disabled={createComponentMutation.isPending}>
                      {createComponentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailUuid(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Simulation Modal (new response structure) ── */}
      <Dialog
        open={!!simulateUuid}
        onOpenChange={(open) => {
          if (!open) {
            setSimulateUuid(null);
            setGrossSalary(0);
            simulateMutation.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 shadow-2xl">
          {/* Gradient header with inline input on larger screens */}
          <div
            className="relative overflow-hidden px-7 pt-6 pb-7"
            style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 55%, #4338CA 100%)" }}
          >
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-violet-400/15 blur-2xl" />
            <div className="relative z-10 flex items-center justify-between gap-6">
              <DialogHeader>
                <DialogTitle className="text-white text-xl flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 text-white" />
                  </span>
                  Simulate Salary Structure
                </DialogTitle>
                <DialogDescription className="text-indigo-100/85">
                  Enter the gross salary to see a detailed breakdown.
                </DialogDescription>
              </DialogHeader>

              <div className="hidden sm:flex items-end gap-2 shrink-0">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-indigo-100/90">Gross Salary *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">PKR</span>
                    <Input
                      type="number"
                      value={grossSalary || ""}
                      onChange={(e) => setGrossSalary(Number(e.target.value))}
                      placeholder="80000"
                      min={0}
                      step="any"
                      className="pl-12 w-44 bg-white border-gray-200 focus-visible:ring-indigo-600"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSimulate}
                  disabled={simulateMutation.isPending}
                  className="text-white shadow-md hover:opacity-90 bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/20"
                >
                  {simulateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Simulate
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile input row */}
          <div className="sm:hidden relative z-10 bg-white mx-6 -mt-4 rounded-xl shadow-lg border border-gray-100 p-4 flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Gross Salary *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">PKR</span>
                <Input
                  type="number"
                  value={grossSalary || ""}
                  onChange={(e) => setGrossSalary(Number(e.target.value))}
                  placeholder="80000"
                  min={0}
                  step="any"
                  className="pl-12 border-gray-200 focus-visible:ring-indigo-600"
                />
              </div>
            </div>
            <Button
              onClick={handleSimulate}
              disabled={simulateMutation.isPending}
              className="text-white shadow-md hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #312E81, #4338CA)" }}
            >
              {simulateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Simulate
            </Button>
          </div>

          <div className="px-7 pt-6 space-y-5 pb-2">
            {simulateMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-14 text-gray-400 gap-2">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#4338CA" }} />
                <p className="text-sm">Crunching the numbers…</p>
              </div>
            )}

            {simulateMutation.data && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Summary: Net Pay + tiles */}
                <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4 items-stretch">
                  <div
                    className="relative overflow-hidden rounded-xl p-5 text-white shadow-lg flex flex-col justify-center"
                    style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)" }}
                  >
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                    <p className="text-indigo-100/80 text-xs uppercase tracking-wide font-medium">Net Pay</p>
                    <p className="text-3xl font-bold mt-1">
                      {simulateMutation.data.data.summary.net_pay.toLocaleString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 auto-rows-fr">
                    <StatTile label="Gross Salary" value={grossSalary} accentColor="#6366F1" />
                    <StatTile label="Basic Salary" value={simulateMutation.data.data.summary.basic_salary} accentColor="#4338CA" />
                    <StatTile label="Gross Earnings" value={simulateMutation.data.data.earnings.gross_earnings} accentColor="#7C3AED" />
                    <StatTile label="Total Deductions" value={simulateMutation.data.data.summary.total_deductions} accentColor="#D85A30" />
                    <StatTile label="Emp Contribution" value={simulateMutation.data.data.employer.employer_contributions} accentColor="#1D9E75" />
                    <StatTile label="Total CTC" value={simulateMutation.data.data.summary.total_ctc} accentColor="#312E81" />
                  </div>
                </div>

                {/* Tax Breakdown (full width) */}
                {simulateMutation.data.data.tax && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 flex items-center gap-2">
                      <Info className="h-4 w-4 text-indigo-600" />
                      <h5 className="font-semibold text-sm text-gray-700">Tax Breakdown</h5>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm">
                      <InfoItem label="Net Taxable Income" value={simulateMutation.data.data.tax.net_taxable_income} />
                      <InfoItem label="Projected Annual" value={simulateMutation.data.data.tax.projected_annual} />
                      <InfoItem label="Annual Tax" value={simulateMutation.data.data.tax.annual_tax} />
                      <InfoItem label="Monthly Tax" value={simulateMutation.data.data.tax.monthly_tax} />
                      <InfoItem label="Slab" value={simulateMutation.data.data.tax.slab_label} />
                      <InfoItem label="Rate" value={`${simulateMutation.data.data.tax.slab_rate_pct}%`} />
                      {simulateMutation.data.data.tax.remaining_months && (
                        <InfoItem label="Remaining Months" value={simulateMutation.data.data.tax.remaining_months} />
                      )}
                    </div>

                    {simulateMutation.data.data.tax.slab_breakdown?.length > 0 && (
                      <div className="border-t">
                        <div className="px-4 py-2 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase">
                          Slab-wise Breakdown
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Slab</TableHead>
                                <TableHead>Range</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead className="text-right">Income</TableHead>
                                <TableHead className="text-right">Tax</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {simulateMutation.data.data.tax.slab_breakdown.map((slab: any, i: number) => (
                                <TableRow key={i} className="hover:bg-indigo-50/50">
                                  <TableCell className="font-medium">{slab.slab_number}</TableCell>
                                  <TableCell className="text-xs whitespace-nowrap">{slab.label}</TableCell>
                                  <TableCell>{slab.rate_pct}%</TableCell>
                                  <TableCell className="text-right">{slab.income_in_slab.toLocaleString()}</TableCell>
                                  <TableCell className="text-right">{slab.tax_in_slab.toLocaleString()}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                      {slab.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Three-column layout: Earnings, Deductions, Employer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  {/* Earnings */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-emerald-600" />
                      <h5 className="font-semibold text-sm text-gray-700">Earnings</h5>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2 text-xs">
                      <InfoItem label="Gross Earnings" value={simulateMutation.data.data.earnings.gross_earnings} />
                      <InfoItem label="Taxable Earnings" value={simulateMutation.data.data.earnings.taxable_earnings} />
                    </div>
                    <div className="flex-1 min-h-0 overflow-auto max-h-60">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pay Head</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {simulateMutation.data.data.earnings.lines.map((line, idx) => (
                            <TableRow key={idx} className="hover:bg-emerald-50/50">
                              <TableCell className="font-medium text-gray-700 text-xs">{line.pay_head_name}</TableCell>
                              <TableCell className="text-right font-mono text-gray-700 text-xs">{line.amount.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-rose-600" />
                      <h5 className="font-semibold text-sm text-gray-700">Deductions</h5>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2 text-xs">
                      <InfoItem label="Pre-tax Ded." value={simulateMutation.data.data.deductions.pre_tax_deductions} />
                      <InfoItem label="Income Tax" value={simulateMutation.data.data.deductions.income_tax_monthly} />
                      <InfoItem label="Post-tax Ded." value={simulateMutation.data.data.deductions.post_tax_deductions} />
                      <InfoItem label="Total Ded." value={simulateMutation.data.data.deductions.total_deductions} />
                    </div>
                    <div className="flex-1 min-h-0 overflow-auto max-h-60">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pay Head</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {simulateMutation.data.data.deductions.lines.map((line, idx) => (
                            <TableRow key={idx} className="hover:bg-rose-50/50">
                              <TableCell className="font-medium text-gray-700 text-xs">{line.pay_head_name}</TableCell>
                              <TableCell className="text-right font-mono text-gray-700 text-xs">{line.amount.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Employer */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-amber-600" />
                      <h5 className="font-semibold text-sm text-gray-700">Employer</h5>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2 text-xs">
                      <InfoItem label="Contribution" value={simulateMutation.data.data.employer.employer_contributions} />
                      <InfoItem label="EOBI" value={simulateMutation.data.data.employer.eobi_employer} />
                      <InfoItem label="Total CTC" value={simulateMutation.data.data.employer.total_ctc} />
                    </div>
                    <div className="flex-1 min-h-0 overflow-auto max-h-60">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pay Head</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {simulateMutation.data.data.employer.lines.map((line, idx) => (
                            <TableRow key={idx} className="hover:bg-amber-50/50">
                              <TableCell className="font-medium text-gray-700 text-xs">{line.pay_head_name}</TableCell>
                              <TableCell className="text-right font-mono text-gray-700 text-xs">{line.amount.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!simulateMutation.data && !simulateMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-14 text-gray-300 gap-2">
                <Calculator className="h-8 w-8" />
                <p className="text-sm text-gray-400">Enter a salary above and hit Simulate</p>
              </div>
            )}
          </div>

          <DialogFooter className="px-7 py-4 border-t border-gray-100 mt-4">
            <Button variant="outline" onClick={() => setSimulateUuid(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUuid} onOpenChange={() => setDeleteUuid(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Structure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Helper components (unchanged) ────────────────────────────────────
function StatTile({ label, value, accentColor, className }: { label: string; value: number; accentColor: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-gray-100 p-3 bg-white shadow-sm ${className || ''}`}>
      <div className="h-1 w-8 rounded-full mb-2" style={{ backgroundColor: accentColor }} />
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800 mt-0.5">{value.toLocaleString()}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}