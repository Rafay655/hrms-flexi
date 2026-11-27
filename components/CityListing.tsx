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
  X,
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
import { useStateOptions } from "@/hooks/useStates";
import {
  useCities,
  useCreateCity,
  useUpdateCity,
  useDeleteCity,
} from "@/hooks/useCities";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { City, CityFormData } from "@/types/city";

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

const CityListingPage: React.FC = () => {
  // Table state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Fetch countries for dropdown (all, up to 1000)
  const { data: countriesData, isLoading: isLoadingCountries } = useCountries({ per_page: 1000 });
  const countries = countriesData?.data ?? [];

  const filterStates = useStateOptions(countryFilter === "all" ? undefined : Number(countryFilter));

  // Country options for searchable select
  const countryOptions: Option[] = useMemo(
    () =>
      countries.map((c) => ({
        value: String(c.id),
        label: `${c.name} (${c.iso2})`,
      })),
    [countries]
  );

  // Fetch cities with filters
  const { data, isLoading, isFetching, error } = useCities({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    country_id: countryFilter !== "all" ? Number(countryFilter) : undefined,
    state_id: stateFilter !== "all" ? Number(stateFilter) : undefined,
  });

  const cities = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  // Mutations
  const createMutation = useCreateCity();
  const updateMutation = useUpdateCity();
  const deleteMutation = useDeleteCity();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [formData, setFormData] = useState<CityFormData>({
    name: "",
    state_id: "",
    state_code: "",
    country_id: "",
    country_code: "",
    latitude: "",
    longitude: "",
    status: "active",
  });

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, countryFilter, stateFilter]);

  // Show error toast if fetch fails
  useEffect(() => {
    if (error) {
      showApiError(error, { fallbackMessage: "Failed to load cities. Please try again." });
    }
  }, [error]);

  const formStates = useStateOptions(formData.country_id ? Number(formData.country_id) : undefined, isModalOpen);
  const filteredStatesForFilter = useMemo(() => filterStates.data ?? [], [filterStates.data]);

  const stateOptionsForFilter: Option[] = useMemo(
    () =>
      filteredStatesForFilter.map((s) => ({
        value: String(s.id),
        label: `${s.name}${s.code ? ` (${s.code})` : ""}`,
      })),
    [filteredStatesForFilter]
  );

  const filteredStatesForForm = useMemo(() => formStates.data ?? [], [formStates.data]);
  useEffect(() => {
    const stateError = filterStates.error || formStates.error;
    if (stateError) showApiError(stateError, {fallbackMessage: "Unable to load state options. Please try again."});
  }, [filterStates.error, formStates.error]);


  const stateOptionsForForm: Option[] = useMemo(
    () =>
      filteredStatesForForm.map((s) => ({
        value: String(s.id),
        label: `${s.name}${s.code ? ` (${s.code})` : ""}`,
      })),
    [filteredStatesForForm]
  );

  // Helper to get selected country's ISO2
  const getCountryIso2 = (countryId: number | ""): string => {
    if (!countryId) return "";
    const country = countries.find((c) => c.id === Number(countryId));
    return country?.iso2 || "";
  };

  // Helper to get selected state's code
  const getStateCode = (stateId: number | ""): string => {
    if (!stateId) return "";
    const state = filteredStatesForForm.find((s) => String(s.id) === String(stateId));
    return state?.code || "";
  };

  // CRUD Handlers
  const handleView = (city: City) => {
    setSelectedCity(city);
    setFormData({
      name: city.name,
      state_id: city.state_id,
      state_code: city.state_code ?? "",
      country_id: city.country_id,
      country_code: city.country_code,
      latitude: city.latitude?.toString() ?? "",
      longitude: city.longitude?.toString() ?? "",
      status: city.status,
    });
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (city: City) => {
    setSelectedCity(city);
    setFormData({
      name: city.name,
      state_id: city.state_id,
      state_code: city.state_code ?? "",
      country_id: city.country_id,
      country_code: city.country_code,
      latitude: city.latitude?.toString() ?? "",
      longitude: city.longitude?.toString() ?? "",
      status: city.status,
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCity(null);
    setFormData({
      name: "",
      state_id: "",
      state_code: "",
      country_id: "",
      country_code: "",
      latitude: "",
      longitude: "",
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
    const trimmedName = formData.name.trim();
    const trimmedLat = formData.latitude.trim();
    const trimmedLng = formData.longitude.trim();

    if (!trimmedName) {
      toast.error("City name is required.");
      return;
    }
    if (trimmedName.length > 255) {
      toast.error("City name cannot exceed 255 characters.");
      return;
    }
    if (!formData.country_id) {
      toast.error("Country is required.");
      return;
    }
    if (!formData.state_id) {
      toast.error("State is required.");
      return;
    }

    // Validate latitude
    let lat: number | null = null;
    if (trimmedLat) {
      lat = parseFloat(trimmedLat);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        toast.error("Latitude must be a number between -90 and 90.");
        return;
      }
    }

    // Validate longitude
    let lng: number | null = null;
    if (trimmedLng) {
      lng = parseFloat(trimmedLng);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        toast.error("Longitude must be a number between -180 and 180.");
        return;
      }
    }

    const payload: CityFormData = {
      name: trimmedName,
      state_id: Number(formData.state_id),
      state_code: getStateCode(formData.state_id),
      country_id: Number(formData.country_id),
      country_code: getCountryIso2(formData.country_id),
      latitude: trimmedLat,
      longitude: trimmedLng,
      status: formData.status,
    };

    if (modalMode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
      });
    } else if (modalMode === "edit" && selectedCity) {
      updateMutation.mutate(
        { id: selectedCity.id, data: payload },
        {
          onSuccess: () => setIsModalOpen(false),
        }
      );
    }
  };

  const columns: ColumnDef<City & { sr: number }>[] = useMemo(
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
        header: "CITY",
        cell: ({ row }) => (
          <div className="font-semibold text-gray-900">{row.original.name}</div>
        ),
      },
      {
        id: "state",
        header: "STATE",
        cell: ({ row }) => {
          const state = row.original.state ?? filteredStatesForFilter.find((s) => String(s.id) === String(row.original.state_id));
          return <div className="text-gray-700">{state?.name ?? "—"}</div>;
        },
      },
      {
        id: "country",
        header: "COUNTRY",
        cell: ({ row }) => {
          const country = row.original.country ?? countries.find((c) => String(c.id) === String(row.original.country_id));
          return <div className="text-gray-700">{country?.name ?? "—"}</div>;
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
          const city = row.original;
          return (
            <MetaActions>
              <MetaAction label="View" onSelect={() => handleView(city)} >
                <Eye className="h-4 w-4" />
              </MetaAction>
              <MetaAction label="Edit" onSelect={() => handleEdit(city)} >
                <Pencil className="h-4 w-4" />
              </MetaAction>
              <MetaAction label="Delete" onSelect={() => handleDelete(city.id)} >
                <Trash2 className="h-4 w-4" />
              </MetaAction>
            </MetaActions>
          );
        },
      },
    ],
    [countries, filteredStatesForFilter]
  );

  // Add serial number to rows for display
  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return cities.map((city, idx) => ({
      ...city,
      sr: startSr + idx + 1,
    }));
  }, [cities, page, perPage]);

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
                Cities Directory
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} cities • Real-time data
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                <PlusIcon className="h-4 w-4" />
                Add City
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
          {/* Filters: Search, Country Filter, State Filter, Per Page */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by city name, state, or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#1E1B4B] focus:ring-[#1E1B4B]"
              />
            </div>

            {/* Country Filter */}
            <div className="w-full md:w-56">
              <SearchableSelect
                options={countryOptions}
                value={countryFilter}
                onChange={value => { setCountryFilter(value); setStateFilter("all"); setPage(1); }}
                placeholder="All Countries"
                searchPlaceholder="Search countries..."
                emptyText="No countries found."
                groupLabel="Countries"
                allowAll={true}
                allLabel="All Countries"
                allValue="all"
                icon={SearchIcon}
                widthClass="w-full"
                isLoading={isLoadingCountries}
                multiple={false}
              />
            </div>

            {/* State Filter - dependent on country filter */}
            <div className="w-full md:w-56">
              <SearchableSelect
                options={stateOptionsForFilter}
                value={stateFilter}
                onChange={setStateFilter}
                placeholder={countryFilter === "all" ? "Select a country first" : "All States"}
                searchPlaceholder="Search states..."
                emptyText="No states found."
                groupLabel="States"
                allowAll={true}
                allLabel="All States"
                allValue="all"
                icon={SearchIcon}
                widthClass="w-full"
                disabled={countryFilter === "all" || filterStates.isFetching || !!filterStates.error}
                isLoading={filterStates.isFetching}
                multiple={false}
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

          {/* Stats Bar with clear filter buttons */}
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
            <div className="flex items-center gap-2">
              {countryFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setCountryFilter("all"); setStateFilter("all"); setPage(1); }}
                  className="h-8 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear country
                </Button>
              )}
              {stateFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStateFilter("all")}
                  className="h-8 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear state
                </Button>
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
                        <p className="text-gray-500 mt-2">Loading cities...</p>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center">
                        <div className="text-gray-500">
                          <p className="font-medium">No cities found</p>
                          <p className="text-sm mt-1">
                            Try adjusting your search or filters
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
              {modalMode === "create" && "Add New City"}
              {modalMode === "edit" && "Edit City"}
              {modalMode === "view" && "View City"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create" && "Fill in the details to add a new city."}
              {modalMode === "edit" && "Make changes to the city below."}
              {modalMode === "view" && "City details (read-only)."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                City Name *
              </label>
              <div className="w-full relative">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={modalMode === "view"}
                  maxLength={255}
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                  {formData.name.length}/255
                </span>
              </div>
            </div>

            {/* Country Field - Searchable Select */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Country *</label>
              <div className="w-full">
                <SearchableSelect
                  options={countryOptions}
                  value={formData.country_id ? String(formData.country_id) : ""}
                  onChange={(val) => {
                    const newCountryId = val === "" ? "" : Number(val);
                    setFormData((prev) => ({
                      ...prev,
                      country_id: newCountryId,
                      country_code: getCountryIso2(newCountryId),
                      state_id: "", // Reset state when country changes
                      state_code: "",
                    }));
                  }}
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
            </div>

            {/* State Field - Searchable Select (filtered by country) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">State *</label>
              <div className="w-full">
                <SearchableSelect
                  options={stateOptionsForForm}
                  value={formData.state_id ? String(formData.state_id) : ""}
                  onChange={(val) => {
                    const newStateId = val === "" ? "" : Number(val);
                    setFormData((prev) => ({
                      ...prev,
                      state_id: newStateId,
                      state_code: getStateCode(newStateId),
                    }));
                  }}
                  placeholder={formData.country_id ? "Select state..." : "Select a country first"}
                  searchPlaceholder="Search states..."
                  emptyText="No states found for selected country."
                  groupLabel="States"
                  allowAll={false}
                  widthClass="w-full"
                  disabled={modalMode === "view" || !formData.country_id || formStates.isFetching || !!formStates.error}
                  isLoading={formStates.isFetching}
                  multiple={false}
                />
              </div>
            </div>

            {/* Country Code (read-only) */}
            <div className="space-y-2">
              <label htmlFor="country_code" className="block text-sm font-medium text-slate-700">
                Country Code *
              </label>
              <Input
                id="country_code"
                value={formData.country_code}
                disabled
                className="w-full bg-gray-100"
              />
            </div>

            {/* State Code (read-only) */}
            <div className="space-y-2">
              <label htmlFor="state_code" className="block text-sm font-medium text-slate-700">
                State Code
              </label>
              <Input
                id="state_code"
                value={formData.state_code}
                disabled
                className="w-full bg-gray-100"
              />
            </div>

            {/* Latitude Field */}
            <div className="space-y-2">
              <label htmlFor="latitude" className="block text-sm font-medium text-slate-700">
                Latitude
              </label>
              <div className="w-full">
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, latitude: e.target.value }))
                  }
                  disabled={modalMode === "view"}
                  placeholder="e.g., 24.8607"
                />
                <p className="text-xs text-gray-500 mt-1">Range: -90 to 90</p>
              </div>
            </div>

            {/* Longitude Field */}
            <div className="space-y-2">
              <label htmlFor="longitude" className="block text-sm font-medium text-slate-700">
                Longitude
              </label>
              <div className="w-full">
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, longitude: e.target.value }))
                  }
                  disabled={modalMode === "view"}
                  placeholder="e.g., 67.0011"
                />
                <p className="text-xs text-gray-500 mt-1">Range: -180 to 180</p>
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
              This action cannot be undone. This will permanently delete the city
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

export default CityListingPage;