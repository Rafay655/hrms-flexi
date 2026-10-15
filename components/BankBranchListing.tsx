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

import { useBanks } from "@/hooks/useBanks";
import {
  useBankBranches,
  useCreateBankBranch,
  useUpdateBankBranch,
  useDeleteBankBranch,
} from "@/hooks/useBankBranches";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { BankBranch, BankBranchFormData } from "@/types/bank-branch";

const DEFAULT_PER_PAGE = 10;

// Predefined country/city lists (can be replaced with API later)
const COUNTRIES = [
  "Pakistan",
  "United Arab Emirates",
  "Saudi Arabia",
  "United Kingdom",
  "United States",
  "Singapore",
  "Switzerland",
  "Other",
];

const CITIES: Record<string, string[]> = {
  Pakistan: ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", "Multan"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Dammam"],
  "United Kingdom": ["London", "Manchester", "Birmingham"],
  "United States": ["New York", "Los Angeles", "Chicago"],
  Singapore: ["Singapore"],
  Switzerland: ["Zurich", "Geneva", "Basel"],
  Other: ["Other"],
};

// Debounce hook
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const BankBranchListingPage: React.FC = () => {
  // Table state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Fetch banks for dropdown (all, up to 1000)
  const { data: banksData, isLoading: isLoadingBanks } = useBanks({ per_page: 1000 });
  const banks = banksData?.data ?? [];

  const bankOptions: Option[] = useMemo(
    () =>
      banks.map((b) => ({
        value: String(b.id),
        label: `${b.name} (${b.code})`,
      })),
    [banks]
  );

  // Fetch bank branches
  const { data, isLoading, isFetching, error } = useBankBranches({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const branches = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  // Mutations
  const createMutation = useCreateBankBranch();
  const updateMutation = useUpdateBankBranch();
  const deleteMutation = useDeleteBankBranch();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedBranch, setSelectedBranch] = useState<BankBranch | null>(null);
  const [formData, setFormData] = useState<BankBranchFormData>({
    bank_id: "",
    code: "",
    name: "",
    country: "Pakistan",
    city: "Karachi",
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
      showApiError(error, { fallbackMessage: "Failed to load bank branches. Please try again." });
    }
  }, [error]);

  // CRUD Handlers
  const handleView = (branch: BankBranch) => {
    setSelectedBranch(branch);
    setFormData({
      bank_id: branch.bank_id,
      code: branch.code,
      name: branch.name,
      country: branch.country ?? "Pakistan",
      city: branch.city ?? "Karachi",
      status: branch.status,
    });
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (branch: BankBranch) => {
    setSelectedBranch(branch);
    setFormData({
      bank_id: branch.bank_id,
      code: branch.code,
      name: branch.name,
      country: branch.country ?? "Pakistan",
      city: branch.city ?? "Karachi",
      status: branch.status,
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedBranch(null);
    setFormData({
      bank_id: "",
      code: "",
      name: "",
      country: "Pakistan",
      city: "Karachi",
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
    const trimmedCountry = formData.country.trim();
    const trimmedCity = formData.city.trim();

    if (!formData.bank_id) {
      toast.error("Bank is required.");
      return;
    }
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
    if (trimmedCountry.length > 100) {
      toast.error("Country cannot exceed 100 characters.");
      return;
    }
    if (trimmedCity.length > 100) {
      toast.error("City cannot exceed 100 characters.");
      return;
    }

    const payload: BankBranchFormData = {
      bank_id: Number(formData.bank_id),
      code: trimmedCode,
      name: trimmedName,
      country: trimmedCountry,
      city: trimmedCity,
      status: formData.status,
    };

    if (modalMode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
      });
    } else if (modalMode === "edit" && selectedBranch) {
      updateMutation.mutate(
        { id: selectedBranch.id, data: payload },
        {
          onSuccess: () => setIsModalOpen(false),
        }
      );
    }
  };

  const columns: ColumnDef<BankBranch & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "SR. NO.",
        cell: ({ row }) => (
          <div className="font-medium text-gray-900">{row.original.sr}</div>
        ),
      },
      {
        id: "bank",
        header: "BANK",
        cell: ({ row }) => {
          const bank = banks.find((b) => b.id === row.original.bank_id);
          return <div className="text-gray-900">{bank?.name ?? "—"}</div>;
        },
      },
      {
        accessorKey: "code",
        header: "BRANCH CODE",
        cell: ({ row }) => (
          <div className="font-mono font-semibold text-gray-900">{row.original.code}</div>
        ),
      },
      {
        accessorKey: "name",
        header: "BRANCH NAME",
        cell: ({ row }) => (
          <div className="font-semibold text-gray-900">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "city",
        header: "CITY",
        cell: ({ row }) => (
          <div className="text-gray-700">{row.original.city ?? "—"}</div>
        ),
      },
      {
        accessorKey: "country",
        header: "COUNTRY",
        cell: ({ row }) => (
          <div className="text-gray-700">{row.original.country ?? "—"}</div>
        ),
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
          const branch = row.original;
          return (
            <MetaActions>
              <MetaAction label="View" onSelect={() => handleView(branch)} >
                <Eye className="h-4 w-4" />
              </MetaAction>
              <MetaAction label="Edit" onSelect={() => handleEdit(branch)} >
                <Pencil className="h-4 w-4" />
              </MetaAction>
              <MetaAction label="Delete" onSelect={() => handleDelete(branch.id)} >
                <Trash2 className="h-4 w-4" />
              </MetaAction>
            </MetaActions>
          );
        },
      },
    ],
    [banks]
  );

  // Add serial number to rows for display
  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return branches.map((branch, idx) => ({
      ...branch,
      sr: startSr + idx + 1,
    }));
  }, [branches, page, perPage]);

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
                Bank Branches Directory
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} branches • Real-time data
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                <PlusIcon className="h-4 w-4" />
                Add Branch
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
                placeholder="Search by branch code, name, or city..."
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
                <SelectTrigger className="w-20 border-gray-300 ">
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
                        <p className="text-gray-500 mt-2">Loading bank branches...</p>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center">
                        <div className="text-gray-500">
                          <p className="font-medium">No bank branches found</p>
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
              {modalMode === "create" && "Add New Bank Branch"}
              {modalMode === "edit" && "Edit Bank Branch"}
              {modalMode === "view" && "View Bank Branch"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create" && "Fill in the details to add a new bank branch."}
              {modalMode === "edit" && "Make changes to the bank branch below."}
              {modalMode === "view" && "Bank branch details (read-only)."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Bank Field - Searchable Select */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Bank *</label>
              <div className="w-full">
                <SearchableSelect
                  options={bankOptions}
                  value={formData.bank_id ? String(formData.bank_id) : ""}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      bank_id: val === "" ? "" : Number(val),
                    }))
                  }
                  placeholder="Select bank..."
                  searchPlaceholder="Search banks..."
                  emptyText="No banks found."
                  groupLabel="Banks"
                  allowAll={false}
                  widthClass="w-full"
                  disabled={modalMode === "view"}
                  isLoading={isLoadingBanks}
                  multiple={false}
                />
              </div>
            </div>

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

            {/* Country Field */}
            <div className="space-y-2">
              <label htmlFor="country" className="block text-sm font-medium text-slate-700">
                Country
              </label>
              {modalMode === "view" ? (
                <Input
                  value={formData.country || "—"}
                  disabled
                  className="w-full bg-gray-50"
                />
              ) : (
                <Select
                  value={formData.country}
                  onValueChange={(val) =>
                    setFormData((prev) => {
                      // Reset city if country changes
                      const newCity =
                        CITIES[val]?.includes(prev.city) ? prev.city : CITIES[val]?.[0] || "";
                      return { ...prev, country: val, city: newCity };
                    })
                  }
                >
                  <SelectTrigger className="w-full w-full">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* City Field */}
            <div className="space-y-2">
              <label htmlFor="city" className="block text-sm font-medium text-slate-700">
                City
              </label>
              {modalMode === "view" ? (
                <Input
                  value={formData.city || "—"}
                  disabled
                  className="w-full bg-gray-50"
                />
              ) : (
                <Select
                  value={formData.city}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, city: val }))}
                >
                  <SelectTrigger className="w-full w-full">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {(CITIES[formData.country] || ["Other"]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
              This action cannot be undone. This will permanently delete the bank branch
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

export default BankBranchListingPage;