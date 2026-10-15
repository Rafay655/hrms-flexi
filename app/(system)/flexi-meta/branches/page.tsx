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

import { useCountries } from "@/hooks/useCountries";
import { useStates } from "@/hooks/useStates";
import { useCities } from "@/hooks/useCities";
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from "@/hooks/useBranches";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { Branch, BranchFormData } from "@/types/branch";

const DEFAULT_PER_PAGE = 15;

const BRANCH_TYPES = [
  { value: "head_office", label: "Head Office" },
  { value: "regional_office", label: "Regional Office" },
  { value: "branch", label: "Branch" },
  { value: "factory", label: "Factory" },
  { value: "warehouse", label: "Warehouse" },
  { value: "field_office", label: "Field Office" },
];

const COMPLIANCE_REGIONS = [
  { value: "punjab", label: "Punjab" },
  { value: "sindh", label: "Sindh" },
  { value: "kpk", label: "KPK" },
  { value: "balochistan", label: "Balochistan" },
  { value: "federal", label: "Federal" },
];

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

const BranchListingPage = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">(
    "create",
  );
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<BranchFormData>({
    name: "",
    code: "",
    branch_type: "",
    is_active: true,
    address_line_1: "",
    address_line_2: "",
    country_id: "",
    state_id: "",
    city_id: "",
    postal_code: "",
    latitude: "",
    longitude: "",
    geofence_radius_meters: "",
    timezone: "",
    compliance_region: "",
    phone: "",
    email: "",
    branch_head_employee_id: "",
  });

  const isActiveParam =
    activeFilter === "all" ? undefined : activeFilter === "active" ? 1 : 0;

  const selectedCountryId = formData.country_id
    ? Number(formData.country_id)
    : undefined;

  const selectedStateId = formData.state_id
    ? Number(formData.state_id)
    : undefined;

  const { data: countriesData, isLoading: isLoadingCountries } = useCountries({
    per_page: 1000,
  });

  const countries = countriesData?.data ?? [];

  const countryOptions: Option[] = useMemo(
    () => countries.map((c) => ({ value: String(c.id), label: c.name })),
    [countries],
  );

  const { data: statesData, isLoading: isLoadingStates } = useStates({
    per_page: 1000,
    country_id: selectedCountryId,
  });

  const states = statesData?.data ?? [];

  const stateOptions: Option[] = useMemo(
    () => states.map((s) => ({ value: String(s.id), label: s.name })),
    [states],
  );

  const { data: citiesData, isLoading: isLoadingCitiesData } = useCities({
    per_page: 1000,
    state_id: selectedStateId,
  });

  const cities = citiesData?.data ?? [];

  const cityOptions: Option[] = useMemo(
    () => cities.map((c) => ({ value: String(c.id), label: c.name })),
    [cities],
  );

  const { data, isLoading, isFetching, error } = useBranches({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    is_active: isActiveParam,
  });

  const branches = data?.data?.data ?? [];
  const totalEntries = data?.data?.meta?.total ?? 0;
  const totalPages = data?.data?.meta?.last_page ?? 1;

  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, activeFilter]);

  useEffect(() => {
    if (error) {
      showApiError(error, { fallbackMessage: "Failed to load branches. Please try again." });
    }
  }, [error]);

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      branch_type: "",
      is_active: true,
      address_line_1: "",
      address_line_2: "",
      country_id: "",
      state_id: "",
      city_id: "",
      postal_code: "",
      latitude: "",
      longitude: "",
      geofence_radius_meters: "",
      timezone: "",
      compliance_region: "",
      phone: "",
      email: "",
      branch_head_employee_id: "",
    });
  };

  const fillFormFromBranch = (branch: Branch) => {
    setFormData({
      name: branch.name ?? "",
      code: branch.code ?? "",
      branch_type: branch.branch_type ?? "",
      is_active: Boolean(branch.is_active),
      address_line_1: branch.address_line_1 ?? "",
      address_line_2: branch.address_line_2 ?? "",
      country_id: branch.country?.id ? branch.country.id : "",
      state_id: branch.state?.id ? branch.state.id : "",
      city_id: branch.city?.id ? branch.city.id : "",
      postal_code: branch.postal_code ?? "",
      latitude: branch.latitude?.toString() ?? "",
      longitude: branch.longitude?.toString() ?? "",
      geofence_radius_meters: branch.geofence_radius_meters?.toString() ?? "",
      timezone: branch.timezone ?? "",
      compliance_region: branch.compliance_region ?? "",
      phone: branch.phone ?? "",
      email: branch.email ?? "",
      branch_head_employee_id: branch.branch_head_employee_id ?? "",
    });
  };

  const handleView = (branch: Branch) => {
    setSelectedBranch(branch);
    fillFormFromBranch(branch);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    fillFormFromBranch(branch);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedBranch(null);
    resetForm();
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleDelete = (uuid: string) => {
    setDeleteId(uuid);
  };

  const confirmDelete = () => {
    if (!deleteId) return;

    deleteMutation.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
      onError: () => setDeleteId(null),
    });
  };

  const handleSave = () => {
    const trimmedName = formData.name.trim();
    const trimmedCode = formData.code.trim();
    const trimmedLat = formData.latitude.trim();
    const trimmedLng = formData.longitude.trim();
    const trimmedGeofence = formData.geofence_radius_meters.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      toast.error("Name is required.");
      return;
    }

    if (trimmedName.length > 150) {
      toast.error("Name cannot exceed 150 characters.");
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

    if (!formData.branch_type) {
      toast.error("Branch type is required.");
      return;
    }

    if (trimmedLat) {
      const lat = parseFloat(trimmedLat);
      if (Number.isNaN(lat) || lat < -90 || lat > 90) {
        toast.error("Latitude must be between -90 and 90.");
        return;
      }
    }

    if (trimmedLng) {
      const lng = parseFloat(trimmedLng);
      if (Number.isNaN(lng) || lng < -180 || lng > 180) {
        toast.error("Longitude must be between -180 and 180.");
        return;
      }
    }

    if (trimmedGeofence) {
      const radius = parseInt(trimmedGeofence, 10);
      if (Number.isNaN(radius) || radius < 50 || radius > 5000) {
        toast.error("Geofence radius must be between 50 and 5000.");
        return;
      }
    }

    if (trimmedPhone && trimmedPhone.length > 20) {
      toast.error("Phone cannot exceed 20 characters.");
      return;
    }

    if (trimmedEmail && trimmedEmail.length > 100) {
      toast.error("Email cannot exceed 100 characters.");
      return;
    }

    const payload: BranchFormData = {
      ...formData,
      name: trimmedName,
      code: trimmedCode,
      branch_type: formData.branch_type as BranchFormData["branch_type"],
      latitude: trimmedLat,
      longitude: trimmedLng,
      geofence_radius_meters: trimmedGeofence,
      phone: trimmedPhone,
      email: trimmedEmail,
      country_id: formData.country_id ? Number(formData.country_id) : "",
      state_id: formData.state_id ? Number(formData.state_id) : "",
      city_id: formData.city_id ? Number(formData.city_id) : "",
      branch_head_employee_id: "",
    };

    if (modalMode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
      });
      return;
    }

    if (modalMode === "edit" && selectedBranch) {
      updateMutation.mutate(
        { uuid: selectedBranch.id, data: payload },
        { onSuccess: () => setIsModalOpen(false) },
      );
    }
  };

  const columns: ColumnDef<Branch & { sr: number }>[] = useMemo(
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
        header: "NAME",
        cell: ({ row }) => (
          <div className="font-semibold text-gray-900">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "code",
        header: "CODE",
        cell: ({ row }) => (
          <div className="font-mono text-gray-700">{row.original.code}</div>
        ),
      },
      {
        id: "branch_type",
        header: "TYPE",
        cell: ({ row }) => {
          const opt = BRANCH_TYPES.find(
            (o) => o.value === row.original.branch_type,
          );

          return (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-800 border-blue-200"
            >
              {opt?.label || row.original.branch_type}
            </Badge>
          );
        },
      },
      {
        id: "city",
        header: "CITY",
        cell: ({ row }) => (
          <div className="text-gray-700">{row.original.city?.name ?? "—"}</div>
        ),
      },
      {
        id: "is_active",
        header: "STATUS",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.is_active
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-red-100 text-red-800 border-red-200"
            }
          >
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
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
    [],
  );

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
  const showingTo =
    totalEntries > 0 ? Math.min(page * perPage, totalEntries) : 0;

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Branches Directory
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
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, code, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#1E1B4B] focus:ring-[#1E1B4B]"
              />
            </div>

            <div className="w-full md:w-48">
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="border-gray-300 w-full">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select
                value={perPage.toString()}
                onValueChange={(value) => setPerPage(Number(value))}
              >
                <SelectTrigger className="w-20 border-gray-300">
                  <SelectValue placeholder="15" />
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
                              header.getContext(),
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
                      <td
                        colSpan={columns.length}
                        className="py-12 text-center"
                      >
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">
                          Loading branches...
                        </p>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="py-12 text-center"
                      >
                        <div className="text-gray-500">
                          <p className="font-medium">No branches found</p>
                          <p className="text-sm mt-1">
                            Try adjusting your search or filter
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
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isLoading && rows.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page{" "}
                    <span className="font-semibold text-gray-900">{page}</span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">
                      {totalPages}
                    </span>
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
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;

                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }

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
                        },
                      )}
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
                    </span>{" "}
                    -{" "}
                    <span className="font-semibold text-gray-900">
                      {showingTo.toLocaleString()}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">
                      {totalEntries.toLocaleString()}
                    </span>{" "}
                    entries
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto max-h-[90vh] overflow-y-auto rounded-xl text-sm text-slate-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {modalMode === "create"
                ? "Add New Branch"
                : modalMode === "edit"
                  ? "Edit Branch"
                  : "View Branch"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Fill in the details to add a new branch."
                : modalMode === "edit"
                  ? "Make changes to the branch below."
                  : "Branch details (read-only)."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Name *</label>
              <div className="relative">
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  disabled={modalMode === "view"}
                  maxLength={150}
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {formData.name.length}/150
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Code *</label>
              <div className="relative">
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, code: e.target.value }))
                  }
                  disabled={modalMode === "view"}
                  maxLength={20}
                  className="pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {formData.code.length}/20
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Type *</label>
              <Select
                value={formData.branch_type}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, branch_type: v as any }))
                }
                disabled={modalMode === "view"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCH_TYPES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <Select
                value={formData.is_active ? "active" : "inactive"}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, is_active: v === "active" }))
                }
                disabled={modalMode === "view"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Address Line 1</label>
              <Input
                value={formData.address_line_1}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, address_line_1: e.target.value }))
                }
                disabled={modalMode === "view"}
                maxLength={255}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Address Line 2</label>
              <Input
                value={formData.address_line_2}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, address_line_2: e.target.value }))
                }
                disabled={modalMode === "view"}
                maxLength={255}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Country</label>
              <SearchableSelect
                options={countryOptions}
                value={formData.country_id ? String(formData.country_id) : ""}
                onChange={(val) =>
                  setFormData((p) => ({
                    ...p,
                    country_id: val === "" ? "" : Number(val),
                    state_id: "",
                    city_id: "",
                  }))
                }
                placeholder="Select country..."
                searchPlaceholder="Search countries..."
                emptyText="No countries found."
                groupLabel="Countries"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode === "view"}
                isLoading={isLoadingCountries}
                multiple={false}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">State</label>
              <SearchableSelect
                options={stateOptions}
                value={formData.state_id ? String(formData.state_id) : ""}
                onChange={(val) =>
                  setFormData((p) => ({
                    ...p,
                    state_id: val === "" ? "" : Number(val),
                    city_id: "",
                  }))
                }
                placeholder={
                  formData.country_id
                    ? "Select state..."
                    : "Select country first"
                }
                searchPlaceholder="Search states..."
                emptyText={
                  formData.country_id
                    ? "No states found."
                    : "Please select country first."
                }
                groupLabel="States"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode === "view" || !formData.country_id}
                isLoading={isLoadingStates}
                multiple={false}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">City</label>
              <SearchableSelect
                options={cityOptions}
                value={formData.city_id ? String(formData.city_id) : ""}
                onChange={(val) =>
                  setFormData((p) => ({
                    ...p,
                    city_id: val === "" ? "" : Number(val),
                  }))
                }
                placeholder={
                  formData.state_id ? "Select city..." : "Select state first"
                }
                searchPlaceholder="Search cities..."
                emptyText={
                  formData.state_id
                    ? "No cities found."
                    : "Please select state first."
                }
                groupLabel="Cities"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode === "view" || !formData.state_id}
                isLoading={isLoadingCitiesData}
                multiple={false}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Postal Code</label>
              <Input
                value={formData.postal_code}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, postal_code: e.target.value }))
                }
                disabled={modalMode === "view"}
                maxLength={10}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Latitude</label>
              <Input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, latitude: e.target.value }))
                }
                disabled={modalMode === "view"}
                placeholder="e.g. 24.8607"
              />
              <p className="text-xs text-gray-500">Range: -90 to 90</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Longitude</label>
              <Input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, longitude: e.target.value }))
                }
                disabled={modalMode === "view"}
                placeholder="e.g. 67.0011"
              />
              <p className="text-xs text-gray-500">Range: -180 to 180</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Geofence Radius (m)
              </label>
              <Input
                type="number"
                min={50}
                max={5000}
                value={formData.geofence_radius_meters}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    geofence_radius_meters: e.target.value,
                  }))
                }
                disabled={modalMode === "view"}
                placeholder="50-5000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Timezone</label>
              <Input
                value={formData.timezone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, timezone: e.target.value }))
                }
                disabled={modalMode === "view"}
                maxLength={50}
                placeholder="e.g. Asia/Karachi"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Compliance Region</label>
              <Select
                value={formData.compliance_region as string}
                onValueChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    compliance_region:
                      v as BranchFormData["compliance_region"],
                  }))
                }
                disabled={modalMode === "view"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {COMPLIANCE_REGIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, phone: e.target.value }))
                }
                disabled={modalMode === "view"}
                maxLength={20}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
                disabled={modalMode === "view"}
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Branch Head</label>
              <Input
                value="Not assigned"
                disabled
                className="bg-gray-100 text-gray-500"
              />
            </div>
          </div>

          <DialogFooter>
            {modalMode !== "view" ? (
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-slate-900">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              branch.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BranchListingPage;