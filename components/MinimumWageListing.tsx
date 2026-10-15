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
import { format, parseISO } from "date-fns";

import { useCurrencies } from "@/hooks/useCurrencies";
import { useLocations } from "@/hooks/useLocations";
import {
  useMinimumWages,
  useCreateMinimumWage,
  useUpdateMinimumWage,
  useDeleteMinimumWage,
} from "@/hooks/useMinimumWages";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { MinimumWage, MinimumWageFormData } from "@/types/minimum-wage";

const DEFAULT_PER_PAGE = 10;

// Wage basis options
const WAGE_BASIS_OPTIONS = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
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

// Robust date input formatter
const toDateInputValue = (dateString: string | null): string => {
  if (!dateString) return "";
  const parts = dateString.includes('T') ? dateString.split('T') : dateString.split(' ');
  return parts[0];
};

const MinimumWageListingPage: React.FC = () => {
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

  // Fetch locations for dropdown
  const { data: locationsData, isLoading: isLoadingLocations } = useLocations({ per_page: 1000 });
  const locations = locationsData?.data ?? [];

  const locationOptions: Option[] = useMemo(
    () =>
      locations.map((loc) => ({
        value: String(loc.id),
        label: loc.name,
      })),
    [locations]
  );

  // Fetch minimum wages
  const { data, isLoading, isFetching, error } = useMinimumWages({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const minimumWages = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  // Mutations
  const createMutation = useCreateMinimumWage();
  const updateMutation = useUpdateMinimumWage();
  const deleteMutation = useDeleteMinimumWage();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedWage, setSelectedWage] = useState<MinimumWage | null>(null);
  const [formData, setFormData] = useState<MinimumWageFormData>({
    location: "",
    wage_amount: 0,
    wage_basis: "",
    currency_id: "",
    effective_from: "",
    effective_to: null,
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
      showApiError(error, { fallbackMessage: "Failed to load minimum wages. Please try again." });
    }
  }, [error]);

  // CRUD Handlers
  const handleView = (wage: MinimumWage) => {
    setSelectedWage(wage);
    setFormData({
      location: wage.location?.id ?? "",
      wage_amount: typeof wage.wage_amount === 'string' ? parseFloat(wage.wage_amount) : wage.wage_amount,
      wage_basis: wage.wage_basis,
      currency_id: wage.currency.id,
      effective_from: toDateInputValue(wage.effective_from),
      effective_to: toDateInputValue(wage.effective_to),
      status: wage.status,
    });
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (wage: MinimumWage) => {
    setSelectedWage(wage);
    setFormData({
      location: wage.location?.id ?? "",
      wage_amount: typeof wage.wage_amount === 'string' ? parseFloat(wage.wage_amount) : wage.wage_amount,
      wage_basis: wage.wage_basis,
      currency_id: wage.currency.id,
      effective_from: toDateInputValue(wage.effective_from),
      effective_to: toDateInputValue(wage.effective_to),
      status: wage.status,
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedWage(null);
    setFormData({
      location: "",
      wage_amount: 0,
      wage_basis: "",
      currency_id: "",
      effective_from: "",
      effective_to: null,
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
    if (!formData.location) {
      toast.error("Location is required.");
      return;
    }
    if (formData.wage_amount < 0) {
      toast.error("Wage amount must be non-negative.");
      return;
    }
    if (!formData.wage_basis) {
      toast.error("Wage basis is required.");
      return;
    }
    if (!formData.currency_id) {
      toast.error("Currency is required.");
      return;
    }
    if (!formData.effective_from) {
      toast.error("Effective from date is required.");
      return;
    }
    if (formData.effective_to && formData.effective_to < formData.effective_from) {
      toast.error("Effective to date must be after effective from date.");
      return;
    }

    const payload: MinimumWageFormData = {
      ...formData,
      location: Number(formData.location),
      currency_id: Number(formData.currency_id),
    };

    if (modalMode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
      });
    } else if (modalMode === "edit" && selectedWage) {
      updateMutation.mutate(
        { id: selectedWage.id, data: payload },
        {
          onSuccess: () => setIsModalOpen(false),
        }
      );
    }
  };

  const columns: ColumnDef<MinimumWage & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "SR. NO.",
        cell: ({ row }) => (
          <div className="font-medium text-gray-900">{row.original.sr}</div>
        ),
      },
      {
        id: "location",
        header: "LOCATION",
        cell: ({ row }) => (
          <div className="font-semibold text-gray-900">{row.original.location?.name ?? "—"}</div>
        ),
      },
      {
        id: "wage",
        header: "WAGE",
        cell: ({ row }) => {
          const currency = currencies.find((c) => c.id === row.original.currency.id);
          const amount = typeof row.original.wage_amount === 'string'
            ? parseFloat(row.original.wage_amount)
            : row.original.wage_amount;
          return (
            <div className="text-gray-900">
              {currency?.symbol || ""} {amount.toLocaleString()} / {row.original.wage_basis}
            </div>
          );
        },
      },
      {
        accessorKey: "effective_from",
        header: "EFFECTIVE FROM",
        cell: ({ row }) => (
          <div className="text-gray-700">
            {format(parseISO(row.original.effective_from), "PPP")}
          </div>
        ),
      },
      {
        accessorKey: "effective_to",
        header: "EFFECTIVE TO",
        cell: ({ row }) => {
          const to = row.original.effective_to;
          return (
            <div className="text-gray-700">
              {to ? format(parseISO(to), "PPP") : <span className="text-gray-400 italic">Ongoing</span>}
            </div>
          );
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
          const wage = row.original;
          return (
            <MetaActions>
              <MetaAction label="View" onSelect={() => handleView(wage)} >
                <Eye className="h-4 w-4" />
              </MetaAction>
              <MetaAction label="Edit" onSelect={() => handleEdit(wage)} >
                <Pencil className="h-4 w-4" />
              </MetaAction>
              <MetaAction label="Delete" onSelect={() => handleDelete(wage.id)} >
                <Trash2 className="h-4 w-4" />
              </MetaAction>
            </MetaActions>
          );
        },
      },
    ],
    [currencies]
  );

  // Add serial number to rows for display
  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return minimumWages.map((wage, idx) => ({
      ...wage,
      sr: startSr + idx + 1,
    }));
  }, [minimumWages, page, perPage]);

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
                Minimum Wages Directory
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} wages • Real-time data
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                <PlusIcon className="h-4 w-4" />
                Add Minimum Wage
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
                placeholder="Search by location..."
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
                        <p className="text-gray-500 mt-2">Loading minimum wages...</p>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center">
                        <div className="text-gray-500">
                          <p className="font-medium">No minimum wages found</p>
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-xl text-sm text-slate-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {modalMode === "create" && "Add New Minimum Wage"}
              {modalMode === "edit" && "Edit Minimum Wage"}
              {modalMode === "view" && "View Minimum Wage"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create" && "Fill in the details to add a new minimum wage."}
              {modalMode === "edit" && "Make changes to the minimum wage below."}
              {modalMode === "view" && "Minimum wage details (read-only)."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Location Field - Searchable Select */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Location *</label>
              <div className="w-full">
                <SearchableSelect
                  options={locationOptions}
                  value={formData.location ? String(formData.location) : ""}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: val === "" ? "" : Number(val),
                    }))
                  }
                  placeholder="Select location..."
                  searchPlaceholder="Search locations..."
                  emptyText="No locations found."
                  groupLabel="Locations"
                  allowAll={false}
                  widthClass="w-full"
                  disabled={modalMode === "view"}
                  isLoading={isLoadingLocations}
                  multiple={false}
                />
              </div>
            </div>

            {/* Wage Amount Field */}
            <div className="space-y-2">
              <label htmlFor="wage_amount" className="block text-sm font-medium text-slate-700">
                Wage Amount *
              </label>
              <div className="w-full">
                <Input
                  id="wage_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.wage_amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, wage_amount: parseFloat(e.target.value) || 0 }))
                  }
                  disabled={modalMode === "view"}
                />
              </div>
            </div>

            {/* Wage Basis Field */}
            <div className="space-y-2">
              <label htmlFor="wage_basis" className="block text-sm font-medium text-slate-700">
                Wage Basis *
              </label>
              <Select
                value={formData.wage_basis}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, wage_basis: val as MinimumWageFormData['wage_basis'] }))
                }
                disabled={modalMode === "view"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select wage basis" />
                </SelectTrigger>
                <SelectContent>
                  {WAGE_BASIS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Currency Field - Searchable Select */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Currency *</label>
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
                  placeholder="Select currency..."
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

            {/* Effective From Field */}
            <div className="space-y-2">
              <label htmlFor="effective_from" className="block text-sm font-medium text-slate-700">
                Effective From *
              </label>
              <Input
                id="effective_from"
                type="date"
                value={formData.effective_from}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, effective_from: e.target.value }))
                }
                className="w-full"
                disabled={modalMode === "view"}
              />
            </div>

            {/* Effective To Field */}
            <div className="space-y-2">
              <label htmlFor="effective_to" className="block text-sm font-medium text-slate-700">
                Effective To
              </label>
              <Input
                id="effective_to"
                type="date"
                value={formData.effective_to ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, effective_to: e.target.value || null }))
                }
                className="w-full"
                disabled={modalMode === "view"}
                min={formData.effective_from}
              />
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
              This action cannot be undone. This will permanently delete the minimum wage
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

export default MinimumWageListingPage;