"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  DownloadIcon,
  Eye,
  FileText,
  Layers,
  Loader2,
  MoreHorizontal,
  Pencil,
  SearchIcon,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

import { useCompanies } from "@/hooks/useCompanies";
import { useFormBuilders } from "@/hooks/useFormBuilders";
import type { FormBuildersQueryParams } from "@/types/form-builder";
import toast from "react-hot-toast";

const DEFAULT_PER_PAGE = 10;

type FormStatus = "active" | "inactive";

type OnboardingFormRow = {
  sr: number;
  id: string;
  name: string;
  code: string;
  type: string;
  description: string;
  status: FormStatus;
  totalSteps: number;
  totalFields: number;
  quickFields: number;
  detailFields: number;
  lastUpdated: string;
  updatedBy: string;
};

function useDebounced<T>(value: T, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function OnboardingSettingsListingPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FormBuildersQueryParams["status"]>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<OnboardingFormRow | null>(null);

  const [selectedCompanyUuid, setSelectedCompanyUuid] = useState<string | undefined>(undefined);

  const {
    companies,
    isLoading: companiesLoading,
    error: companiesError,
  } = useCompanies({ per_page: 200, page: 1 });

  useEffect(() => {
    if (!companiesLoading && companies.length > 0 && !selectedCompanyUuid) {
      setSelectedCompanyUuid(companies[0].id);
    }
  }, [companies, companiesLoading, selectedCompanyUuid]);

  const q = useDebounced(search, 400);

  const {
    data: apiResponse,
    isLoading: formsLoading,
    isFetching,
  } = useFormBuilders({
    page,
    per_page: perPage,
    search: q || undefined,
    status: statusFilter,
    company_uuid: selectedCompanyUuid,
  });

  const totalEntries = apiResponse?.meta.pagination.total ?? 0;
  const totalPages = apiResponse?.meta.pagination.last_page ?? 1;
  const showingFrom = apiResponse?.meta.pagination.from ?? 0;
  const showingTo = apiResponse?.meta.pagination.to ?? 0;
  const currentPage = apiResponse?.meta.pagination.current_page ?? 1;

  React.useEffect(() => {
    if (apiResponse && currentPage !== page) {
      setPage(currentPage);
    }
  }, [apiResponse, currentPage, page]);

  React.useEffect(() => {
    setPage(1);
  }, [perPage, q, statusFilter, selectedCompanyUuid]);

  const rows: OnboardingFormRow[] = useMemo(() => {
    if (!apiResponse?.data) return [];

    return apiResponse.data.map((form, index) => ({
      sr: showingFrom + index,
      id: form.id.toString(),
      name: form.name,
      code: `F-${form.id}`,
      type: form.is_default ? "Default" : "Custom",
      description: form.description ?? "",
      status: form.is_active ? "active" : "inactive",
      totalSteps: form.steps_count,
      totalFields: form.fields_count,
      quickFields: 0,
      detailFields: 0,
      lastUpdated: new Date(form.updated_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      updatedBy: "System",
    }));
  }, [apiResponse, showingFrom]);

  const activeForms = rows.filter((r) => r.status === "active").length;
  const totalFields = rows.reduce((sum, row) => sum + row.totalFields, 0);

  // ✅ Wrapped in useCallback so columns can depend on it without stale closure
  const openView = useCallback((form: OnboardingFormRow) => {
    setSelectedForm(form);
    setIsViewOpen(true);
  }, []);

  // ✅ Wrapped in useCallback with selectedCompanyUuid as dependency
  const openEdit = useCallback(
    (form: OnboardingFormRow) => {
      if (!selectedCompanyUuid) {
        toast.error("Please select a company first");
        return;
      }
      router.push(
        `/flexi-hq/settings?company_uuid=${selectedCompanyUuid}&form_builder_id=${form.id}`
      );
    },
    [selectedCompanyUuid, router]
  );

  const handleExportCSV = () => {
    const headers = [
      "Sr", "Name", "Code", "Type", "Status", "Steps",
      "Total Fields", "Quick Fields", "Detail Fields", "Last Updated", "Updated By",
    ];

    const csvRows = rows.map((form) => [
      form.sr,
      form.name,
      form.code,
      form.type,
      form.status,
      form.totalSteps,
      form.totalFields,
      form.quickFields,
      form.detailFields,
      form.lastUpdated,
      form.updatedBy,
    ]);

    const csv = [headers, ...csvRows].map((row) => row.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = "onboarding-form-settings.csv";
    link.click();
  };

  // ✅ columns now depends on openView and openEdit (both stable via useCallback)
  const columns: ColumnDef<OnboardingFormRow>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "Sr.",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-brand-900">{row.original.sr}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Form Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-800 text-xs font-bold text-white">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-brand-900">{row.original.name}</div>
              <div className="max-w-[360px] text-[11px] text-brand-700">
                {row.original.description?.length > 20
                  ? `${row.original.description.substring(0, 20)}...`
                  : row.original.description}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <div className="inline-block rounded border border-gray-200 bg-brand-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-brand-900">
            {row.original.code}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <span className="inline-flex items-center whitespace-nowrap rounded-full border border-gray-200 bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
            {row.original.type}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.status === "active"
                ? "border-transparent bg-brand-700 text-white hover:bg-brand-700"
                : "border-transparent bg-brand-600 text-white hover:bg-brand-600"
            }
          >
            {row.original.status === "active" ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "totalSteps",
        header: () => <div className="text-center">Steps</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-brand-700" />
            <span className="text-sm font-semibold text-brand-900">{row.original.totalSteps}</span>
          </div>
        ),
      },
      {
        accessorKey: "totalFields",
        header: () => <div className="text-center">Fields</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <div className="text-sm font-semibold text-brand-900">{row.original.totalFields}</div>
          </div>
        ),
      },
      {
        accessorKey: "lastUpdated",
        header: "Last Updated",
        cell: ({ row }) => (
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-900">
              <Clock3 className="h-3.5 w-3.5 text-brand-700" />
              {row.original.lastUpdated}
            </div>
            <div className="text-[11px] text-brand-700">by {row.original.updatedBy}</div>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const form = row.original;
          return (
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-lg p-0 text-brand-800 hover:bg-brand-100 hover:text-brand-900"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 border border-gray-200 bg-white">
                  <DropdownMenuItem
                    onClick={() => openView(form)}
                    className="cursor-pointer text-brand-800 focus:bg-brand-100 focus:text-brand-900"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openEdit(form)}
                    className="cursor-pointer text-brand-800 focus:bg-brand-100 focus:text-brand-900"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [openView, openEdit] // ✅ stable references, no stale closure
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  return (
    <div className="min-h-screen bg-white p-3">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <Settings2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Forms Builder
                </CardTitle>
                <p className="mt-0.5 text-sm text-brand-700">
                  {totalEntries.toLocaleString()} existing form{totalEntries !== 1 ? "s" : ""} · manage HR forms setup
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-2 border-gray-200 text-brand-800 hover:bg-brand-100"
                onClick={handleExportCSV}
              >
                <DownloadIcon className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <Input
                placeholder="Search by form name, code, type, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-gray-200 pl-10 text-brand-900 focus:border-brand-800 focus:ring-brand-800"
              />
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <Select
                value={selectedCompanyUuid ?? ""}
                onValueChange={(value) => setSelectedCompanyUuid(value || undefined)}
                disabled={companiesLoading}
              >
                <SelectTrigger className="w-48 border-gray-200 text-brand-800">
                  <SelectValue placeholder={companiesLoading ? "Loading..." : "Select company"} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="text-sm text-brand-700">Status</span>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
              >
                <SelectTrigger className="w-32 border-gray-200 text-brand-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <span className="text-sm text-brand-700">Show</span>
              <Select
                value={perPage.toString()}
                onValueChange={(value) => setPerPage(Number(value))}
              >
                <SelectTrigger className="w-20 border-gray-200 text-brand-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {[10, 25, 50, 100].map((number) => (
                    <SelectItem key={number} value={number.toString()}>
                      {number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-brand-700">entries</span>
            </div>
          </div>

          {/* Summary bar */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-brand-700">Showing </span>
                <span className="font-semibold text-brand-900">{showingFrom.toLocaleString()}</span>
                <span className="text-brand-700"> to </span>
                <span className="font-semibold text-brand-900">{showingTo.toLocaleString()}</span>
                <span className="text-brand-700"> of </span>
                <span className="font-semibold text-brand-900">{totalEntries.toLocaleString()}</span>
                <span className="text-brand-700"> entries</span>
              </div>

              {(isFetching || formsLoading) ? (
                <Badge className="gap-1 border-gray-200 bg-white text-xs text-brand-800">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading...
                </Badge>
              ) : null}
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{activeForms}</span> Active
              </div>
              <div className="h-3 w-px bg-brand-300" />
              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{rows.length - activeForms}</span> Inactive
              </div>
              <div className="h-3 w-px bg-brand-300" />
              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{totalFields}</span> Total Fields
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="cursor-pointer px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800 transition-colors hover:bg-brand-200"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronRight className="h-3.5 w-3.5" />
                            ) : null}
                            {header.column.getIsSorted() === "desc" ? (
                              <ChevronLeft className="h-3.5 w-3.5" />
                            ) : null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody className="divide-y divide-brand-300/50 bg-white">
                  {rows.length === 0 && !formsLoading ? (
                    <tr>
                      <td colSpan={columns.length} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-10 w-10 text-brand-300" />
                          <p className="font-medium text-brand-800">No onboarding form found</p>
                          <p className="text-sm text-brand-600">Try adjusting your search criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="group transition-colors hover:bg-brand-100">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-5 py-3.5 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {rows.length > 0 ? (
              <div className="border-t border-gray-200 px-5 py-4">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                  <div className="text-sm text-brand-700">
                    Page <span className="font-semibold text-brand-900">{currentPage}</span> of{" "}
                    <span className="font-semibold text-brand-900">{totalPages}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={currentPage === 1}
                      className="border-gray-200 text-brand-800 hover:bg-brand-200"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="border-gray-200 text-brand-800 hover:bg-brand-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="mx-1 flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                        let pageNumber: number;
                        if (totalPages <= 5) pageNumber = index + 1;
                        else if (currentPage <= 3) pageNumber = index + 1;
                        else if (currentPage >= totalPages - 2) pageNumber = totalPages - 4 + index;
                        else pageNumber = currentPage - 2 + index;

                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNumber)}
                            className={
                              currentPage === pageNumber
                                ? "border-brand-800 bg-brand-800 text-white hover:bg-brand-900"
                                : "border-gray-200 text-brand-800 hover:bg-brand-200"
                            }
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="border-gray-200 text-brand-800 hover:bg-brand-200"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="border-gray-200 text-brand-800 hover:bg-brand-200"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-brand-700">
                    <span className="font-semibold text-brand-900">{showingFrom.toLocaleString()}</span>{" "}
                    {" – "}
                    <span className="font-semibold text-brand-900">{showingTo.toLocaleString()}</span>{" "}
                    of <span className="font-semibold text-brand-900">{totalEntries.toLocaleString()}</span> entries
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* View dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="overflow-hidden border border-gray-200 bg-white p-0 sm:max-w-[560px]">
          <div className="bg-brand-900 px-6 py-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
                <FileText className="h-4 w-4 opacity-80" />
                Onboarding Form Details
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-brand-300">
                Viewing onboarding form configuration.
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedForm ? (
            <div className="space-y-4 px-6 py-5">
              <div className="rounded-lg border border-gray-200 bg-brand-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-brand-900">{selectedForm.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-brand-700">{selectedForm.description}</p>
                  </div>
                  <Badge className="bg-brand-700 text-white hover:bg-brand-700">
                    {selectedForm.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700">
                    <Layers className="h-3.5 w-3.5" />
                    Steps
                  </div>
                  <p className="mt-2 text-lg font-bold text-brand-900">{selectedForm.totalSteps}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700">
                    <Users className="h-3.5 w-3.5" />
                    Fields
                  </div>
                  <p className="mt-2 text-lg font-bold text-brand-900">{selectedForm.totalFields}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Quick Fields
                  </div>
                  <p className="mt-2 text-lg font-bold text-brand-900">{selectedForm.quickFields}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Detail Fields
                  </div>
                  <p className="mt-2 text-lg font-bold text-brand-900">{selectedForm.detailFields}</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Last Updated
                </p>
                <p className="mt-2 text-sm font-semibold text-brand-900">{selectedForm.lastUpdated}</p>
                <p className="text-xs text-brand-700">by {selectedForm.updatedBy}</p>
              </div>
            </div>
          ) : null}

          <DialogFooter className="flex justify-end gap-2 px-6 pb-5">
            <Button
              variant="outline"
              className="border-gray-200 text-brand-800 hover:bg-brand-100"
              onClick={() => setIsViewOpen(false)}
            >
              Close
            </Button>
            {selectedForm ? (
              <Button
                className="bg-brand-800 text-white hover:bg-brand-900"
                onClick={() => openEdit(selectedForm)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}