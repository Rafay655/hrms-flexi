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

import {
  useDivisions,
  useCreateDivision,
  useUpdateDivision,
  useDeleteDivision,
} from "@/hooks/useDivisions";
import type { Division, DivisionFormData } from "@/types/division";

const DEFAULT_PER_PAGE = 10;

// Debounce hook
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function getDivisionHeadLabel(head: Division["head_employee_id"]) {
  return typeof head === "object" && head !== null
    ? head.name
    : head ?? "Not assigned";
}

function getDivisionHeadId(head: Division["head_employee_id"]) {
  return typeof head === "object" && head !== null ? head.id : head ?? "";
}

const DivisionListingPage: React.FC = () => {
  // Table state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Fetch data
  const { data, isLoading, isFetching, error } = useDivisions({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const divisions = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  // Mutations
  const createMutation = useCreateDivision();
  const updateMutation = useUpdateDivision();
  const deleteMutation = useDeleteDivision();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [formData, setFormData] = useState<DivisionFormData>({
    code: "",
    name: "",
    head_employee_id: "",
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
      showApiError(error, { fallbackMessage: "Failed to load divisions. Please try again." });
    }
  }, [error]);

  // CRUD Handlers
  const handleView = (division: Division) => {
    setSelectedDivision(division);
    setFormData({
      code: division.code,
      name: division.name,
      head_employee_id: getDivisionHeadId(division.head_employee_id),
      effective_from: division.effective_from,
      effective_to: division.effective_to,
      status: division.status,
    });
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (division: Division) => {
    setSelectedDivision(division);
    setFormData({
      code: division.code,
      name: division.name,
      head_employee_id: getDivisionHeadId(division.head_employee_id),
      effective_from: division.effective_from,
      effective_to: division.effective_to,
      status: division.status,
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedDivision(null);
    setFormData({
      code: "",
      name: "",
      head_employee_id: "",
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
    const trimmedCode = formData.code.trim();
    const trimmedName = formData.name.trim();

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
    if (!formData.effective_from) {
      toast.error("Effective from date is required.");
      return;
    }

    const payload: DivisionFormData = {
      ...formData,
      code: trimmedCode,
      name: trimmedName,
      head_employee_id: "", // always empty as requested
    };

    if (modalMode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
      });
    } else if (modalMode === "edit" && selectedDivision) {
      updateMutation.mutate(
        { id: selectedDivision.id, data: payload },
        {
          onSuccess: () => setIsModalOpen(false),
        }
      );
    }
  };

  const columns: ColumnDef<Division & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "SR. NO.",
        cell: ({ row }) => (
          <div className="font-medium text-gray-900">{row.original.sr}</div>
        ),
      },
      {
        accessorKey: "name",
        header: "DIVISION NAME",
        cell: ({ row }) => (
          <div className="font-semibold text-gray-900">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "code",
        header: "CODE",
        cell: ({ row }) => (
          <div className="font-mono text-gray-900">{row.original.code}</div>
        ),
      },
      {
        accessorKey: "head_employee_id",
        header: "HEAD",
        cell: ({ row }) => (
          <div className="text-gray-500 italic">
            {getDivisionHeadLabel(row.original.head_employee_id)}
          </div>
        ),
      },
      {
        accessorKey: "effective_from",
        header: "EFFECTIVE FROM",
        cell: ({ row }) => (
          <div className="text-gray-700">{row.original.effective_from}</div>
        ),
      },
      {
        accessorKey: "effective_to",
        header: "EFFECTIVE TO",
        cell: ({ row }) => {
          const to = row.original.effective_to;
          return (
            <div className="text-gray-700">
              {to ? to : <span className="text-gray-400 italic">Ongoing</span>}
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
          const division = row.original;
          return (
            <MetaActions>
              <MetaAction label="View" onSelect={() => handleView(division)} >
                <Eye className="h-4 w-4" />
              </MetaAction>
              <MetaAction label="Edit" onSelect={() => handleEdit(division)} >
                <Pencil className="h-4 w-4" />
              </MetaAction>
              <MetaAction label="Delete" onSelect={() => handleDelete(division.id)} >
                <Trash2 className="h-4 w-4" />
              </MetaAction>
            </MetaActions>
          );
        },
      },
    ],
    []
  );

  // Add serial number to rows for display
  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return divisions.map((div, idx) => ({
      ...div,
      sr: startSr + idx + 1,
    }));
  }, [divisions, page, perPage]);

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
                Divisions Directory
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} divisions • Real-time data
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                <PlusIcon className="h-4 w-4" />
                Add Division
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
                        <p className="text-gray-500 mt-2">Loading divisions...</p>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center">
                        <div className="text-gray-500">
                          <p className="font-medium">No divisions found</p>
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
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-xl text-sm text-slate-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {modalMode === "create" && "Add New Division"}
              {modalMode === "edit" && "Edit Division"}
              {modalMode === "view" && "View Division"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create" && "Fill in the details to add a new division."}
              {modalMode === "edit" && "Make changes to the division below."}
              {modalMode === "view" && "Division details (read-only)."}
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

            {/* Head Employee - Disabled */}
            <div className="space-y-2">
              <label htmlFor="head_employee_id" className="block text-sm font-medium text-slate-700">
                Head
              </label>
              <div className="w-full">
                <Input
                  value={getDivisionHeadLabel(selectedDivision?.head_employee_id ?? null)}
                  disabled
                  className="bg-gray-100 text-gray-500"
                />
              </div>
            </div>

            {/* Description (Optional) */}
           

            {/* Effective From */}
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

            {/* Effective To */}
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
                min={formData.effective_from} // ensure to >= from
              />
            </div>

            {/* Status */}
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
              This action cannot be undone. This will permanently delete the division
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

export default DivisionListingPage;