"use client";
import { MetaActions, MetaAction } from "@/components/flexi-meta/meta-actions";

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DownloadIcon,
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

import { useCurrencies } from "@/hooks/useCurrencies";
import {
  useCostCenters,
  useCreateCostCenter,
  useUpdateCostCenter,
  useDeleteCostCenter,
} from "@/hooks/useCostCenters";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { CostCenter, CostCenterFormData } from "@/types/cost-center";

const DEFAULT_PER_PAGE = 10;

// Cost center type options
const TYPE_OPTIONS = [
  { value: "cost_center", label: "Cost Center" },
  { value: "profit_center", label: "Profit Center" },
  { value: "investment_center", label: "Investment Center" },
];

// Debounce hook
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const CostCenterListingPage: React.FC = () => {
  // Table state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Fetch currencies for dropdown
  const { data: currenciesData, isLoading: isLoadingCurrencies } = useCurrencies({ per_page: 1000 });
  const currencies = currenciesData?.data ?? [];

  const currencyOptions: Option[] = useMemo(
    () =>
      currencies.map((c) => ({
        value: String(c.id),
        label: `${c.iso_code} (${c.symbol}) - ${c.name}`,
      })),
    [currencies]
  );

  // Fetch all cost centers for parent dropdown
  const { data: allCostCentersData, isLoading: isLoadingParents } = useCostCenters({ per_page: 1000 });
  const allCostCenters = allCostCentersData?.data ?? [];

  const parentOptions: Option[] = useMemo(
    () => [
      { value: "", label: "None (Top Level)" },
      ...allCostCenters.map((cc) => ({
        value: String(cc.id),
        label: `${cc.name} (${cc.code})`,
      })),
    ],
    [allCostCenters]
  );

  // Fetch cost centers for table
  const { data, isLoading, isFetching, error } = useCostCenters({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const costCenters = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  // Mutations
  const createMutation = useCreateCostCenter();
  const updateMutation = useUpdateCostCenter();
  const deleteMutation = useDeleteCostCenter();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [formData, setFormData] = useState<CostCenterFormData>({
    code: "",
    name: "",
    parent_id: "",
    type: "",
    manager_employee_id: "",
    budget: "",
    currency_id: "",
    status: "active",
  });

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch]);

  // Show error toast if fetch fails
  useEffect(() => {
    if (error) {
      showApiError(error, { fallbackMessage: "Failed to load cost centers. Please try again." });
    }
  }, [error]);

  // CRUD Handlers
  const handleView = (cc: CostCenter) => {
    setSelectedCostCenter(cc);
    setFormData({
      code: cc.code,
      name: cc.name,
      parent_id: cc.parent?.id ?? "",
      type: cc.type,
      manager_employee_id: cc.manager_employee_id ?? "",
      budget: cc.budget?.toString() ?? "",
      currency_id: cc.currency?.id ?? "",
      status: cc.status,
    });
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (cc: CostCenter) => {
    setSelectedCostCenter(cc);
    setFormData({
      code: cc.code,
      name: cc.name,
      parent_id: cc.parent?.id ?? "",
      type: cc.type,
      manager_employee_id: cc.manager_employee_id ?? "",
      budget: cc.budget?.toString() ?? "",
      currency_id: cc.currency?.id ?? "",
      status: cc.status,
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCostCenter(null);
    setFormData({
      code: "",
      name: "",
      parent_id: "",
      type: "",
      manager_employee_id: "",
      budget: "",
      currency_id: "",
      status: "active",
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
        onError: () => setDeleteId(null),
      });
    }
  };

  const handleSave = () => {
    const trimmedCode = formData.code.trim();
    const trimmedName = formData.name.trim();
    const trimmedBudget = formData.budget.trim();

    if (!trimmedCode) {
      toast.error("Code is required.");
      return;
    }
    if (trimmedCode.length > 20) {
      toast.error("Code cannot exceed 20 characters.");
      return;
    }
    if (!trimmedName) {
      toast.error("Name is required.");
      return;
    }
    if (trimmedName.length > 150) {
      toast.error("Name cannot exceed 150 characters.");
      return;
    }
    if (!formData.type) {
      toast.error("Type is required.");
      return;
    }
    if (trimmedBudget && parseFloat(trimmedBudget) < 0) {
      toast.error("Budget must be non-negative.");
      return;
    }

    const payload: CostCenterFormData = {
      code: trimmedCode,
      name: trimmedName,
      parent_id: formData.parent_id === "" ? "" : Number(formData.parent_id),
      type: formData.type as CostCenterFormData['type'],
      manager_employee_id: "", // always empty
      budget: trimmedBudget,
      currency_id: formData.currency_id === "" ? "" : Number(formData.currency_id),
      status: formData.status,
    };

    if (modalMode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
      });
    } else if (modalMode === "edit" && selectedCostCenter) {
      updateMutation.mutate(
        { id: selectedCostCenter.id, data: payload },
        {
          onSuccess: () => setIsModalOpen(false),
        }
      );
    }
  };

  const columns: ColumnDef<CostCenter & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "SR. NO.",
        cell: ({ row }) => (
          <div className="font-medium text-gray-900">{row.original.sr}</div>
        ),
      },
      {
        accessorKey: "code",
        header: "CODE",
        cell: ({ row }) => (
          <div className="font-mono font-semibold text-gray-900">{row.original.code}</div>
        ),
      },
      {
        accessorKey: "name",
        header: "NAME",
        cell: ({ row }) => (
          <div className="font-semibold text-gray-900">{row.original.name}</div>
        ),
      },
      {
        id: "parent",
        header: "PARENT",
        cell: ({ row }) => {
          const parent = allCostCenters.find((cc) => cc.id === row.original.parent?.id);
          return <div className="text-gray-700">{parent?.name ?? "—"}</div>;
        },
      },
      {
        accessorKey: "type",
        header: "TYPE",
        cell: ({ row }) => {
          const opt = TYPE_OPTIONS.find(o => o.value === row.original.type);
          return <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">{opt?.label || row.original.type}</Badge>;
        },
      },
      {
        accessorKey: "status",
        header: "STATUS",
        cell: ({ row }) => {
          const isActive = row.original.status === "active";
          return (
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={
                isActive
                  ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                  : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
              }
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="mx-auto">ACTIONS</div>,
        cell: ({ row }) => {
          const cc = row.original;
          return (
            <MetaActions>
              <MetaAction label="View" onSelect={() => handleView(cc)} >
                <Eye className="h-4 w-4" />
              </MetaAction>
              <MetaAction label="Edit" onSelect={() => handleEdit(cc)} >
                <Pencil className="h-4 w-4" />
              </MetaAction>
              <MetaAction label="Delete" onSelect={() => handleDelete(cc.id)} >
                <Trash2 className="h-4 w-4" />
              </MetaAction>
            </MetaActions>
          );
        },
      },
    ],
    [allCostCenters]
  );

  // Add serial number to rows for display
  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return costCenters.map((cc, idx) => ({
      ...cc,
      sr: startSr + idx + 1,
    }));
  }, [costCenters, page, perPage]);

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
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Cost Centers Directory
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} cost centers • Real-time data
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                <PlusIcon className="h-4 w-4" />
                Add Cost Center
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-blue-900 hover:bg-blue-50"
              >
                <DownloadIcon className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Search and Per Page */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#1E1B4B] focus:ring-[#1E1B4B]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select
                value={perPage.toString()}
                onValueChange={(value) => setPerPage(Number(value))}
              >
                <SelectTrigger className="w-20 border-gray-300">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-600">Showing</span>
                <span className="font-semibold mx-1 text-gray-900">
                  {showingFrom.toLocaleString()}
                </span>
                <span className="text-gray-600">to</span>
                <span className="font-semibold mx-1 text-gray-900">
                  {showingTo.toLocaleString()}
                </span>
                <span className="text-gray-600">of</span>
                <span className="font-semibold mx-1 text-gray-900">
                  {totalEntries.toLocaleString()}
                </span>
                <span className="text-gray-600">entries</span>
              </div>

              {(isLoading || isFetching) && (
                <Badge
                  variant="outline"
                  className="gap-1 border-blue-200 bg-blue-50"
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading...
                </Badge>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronLeft className="h-4 w-4" />
                            ) : null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">Loading cost centers...</p>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center">
                        <div className="text-gray-500">
                          <p className="font-medium">No cost centers found</p>
                          <p className="text-sm mt-1">
                            Try adjusting your search criteria
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-4 px-6 text-sm">
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
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page{" "}
                    <span className="font-semibold text-gray-900">{page}</span> of{" "}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="border-gray-300"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="border-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center space-x-1 mx-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (page <= 3) pageNum = i + 1;
                        else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = page - 2 + i;

                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className={
                              page === pageNum
                                ? "bg-[#1E1B4B] hover:bg-[#2A2675] border-[#1E1B4B]"
                                : "border-gray-300 hover:bg-gray-100"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="border-gray-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="border-gray-300"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">
                      {showingFrom.toLocaleString()}
                    </span>
                    {" - "}
                    <span className="font-semibold text-gray-900">
                      {showingTo.toLocaleString()}
                    </span>
                    {" of "}
                    <span className="font-semibold text-gray-900">
                      {totalEntries.toLocaleString()}
                    </span>
                    {" entries"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit/View Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto max-h-[90vh] overflow-y-auto rounded-xl text-sm text-slate-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {modalMode === "create" && "Add New Cost Center"}
              {modalMode === "edit" && "Edit Cost Center"}
              {modalMode === "view" && "View Cost Center"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create" && "Fill in the details to add a new cost center."}
              {modalMode === "edit" && "Make changes to the cost center below."}
              {modalMode === "view" && "Cost center details (read-only)."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Code Field */}
            <div className="space-y-2">
              <label htmlFor="code" className="block text-sm font-medium text-slate-700">
                Code *
              </label>
              <div className="w-full relative">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                  disabled={modalMode === "view"}
                  maxLength={20}
                  className="pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                  {formData.code.length}/20
                </span>
              </div>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Name *
              </label>
              <div className="w-full relative">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={modalMode === "view"}
                  maxLength={150}
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                  {formData.name.length}/150
                </span>
              </div>
            </div>

            {/* Parent Cost Center Field - Searchable Select */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Parent</label>
              <div className="w-full">
                <SearchableSelect
                  options={parentOptions}
                  value={formData.parent_id ? String(formData.parent_id) : ""}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      parent_id: val === "" ? "" : Number(val),
                    }))
                  }
                  placeholder="Select parent (optional)"
                  searchPlaceholder="Search cost centers..."
                  emptyText="No cost centers found."
                  groupLabel="Cost Centers"
                  allowAll={false}
                  widthClass="w-full"
                  disabled={modalMode === "view"}
                  isLoading={isLoadingParents}
                  multiple={false}
                />
              </div>
            </div>

            {/* Type Field */}
            <div className="space-y-2">
              <label htmlFor="type" className="block text-sm font-medium text-slate-700">
                Type *
              </label>
              <Select
                value={formData.type}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, type: val as CostCenterFormData['type'] }))
                }
                disabled={modalMode === "view"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Manager Field - Disabled */}
            <div className="space-y-2">
              <label htmlFor="manager" className="block text-sm font-medium text-slate-700">
                Manager
              </label>
              <div className="w-full">
                <Input
                  value="Not assigned"
                  disabled
                  className="bg-gray-100 text-gray-500"
                />
              </div>
            </div>

            {/* Budget Field */}
            <div className="space-y-2">
              <label htmlFor="budget" className="block text-sm font-medium text-slate-700">
                Budget
              </label>
              <div className="w-full">
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, budget: e.target.value }))
                  }
                  disabled={modalMode === "view"}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Currency Field - Searchable Select */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Currency</label>
              <div className="w-full">
                <SearchableSelect
                  options={currencyOptions}
                  value={formData.currency_id ? String(formData.currency_id) : ""}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      currency_id: val === "" ? "" : Number(val),
                    }))
                  }
                  placeholder="Select currency (optional)"
                  searchPlaceholder="Search currencies..."
                  emptyText="No currencies found."
                  groupLabel="Currencies"
                  allowAll={false}
                  widthClass="w-full"
                  disabled={modalMode === "view"}
                  isLoading={isLoadingCurrencies}
                  multiple={false}
                />
              </div>
            </div>

            {/* Status Field */}
            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium text-slate-700">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, status: val as "active" | "inactive" }))
                }
                disabled={modalMode === "view"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            {modalMode !== "view" && (
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </>
            )}
            {modalMode === "view" && (
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-slate-900">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the cost center
              from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CostCenterListingPage;