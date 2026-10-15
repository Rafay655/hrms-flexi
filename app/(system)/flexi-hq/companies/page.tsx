"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  DownloadIcon,
  Eye,
  GitBranch,
  Layers,
  Loader2,
  Pencil,
  PlusIcon,
  SearchIcon,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCompanies } from "@/hooks/useCompanies";
import type { Company } from "@/types/company";

const DEFAULT_PER_PAGE = 10;

type CompanyRow = Company & {
  sr: number;
};

function useDebounced<T>(value: T, delay = 400) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function CompanyListing() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounced(search, 400);

const {
  companies,
  meta,
  isLoading,
  isFetching,
  error,
} = useCompanies({
  page,
  per_page: perPage,
  search: debouncedSearch,
});
  React.useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch]);

  const totalEntries = meta?.total ?? 0;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;
  const showingFrom = meta?.from ?? 0;
  const showingTo = meta?.to ?? 0;

  const rows: CompanyRow[] = useMemo(() => {
    return companies.map((company, index) => ({
      ...company,
      sr: showingFrom ? showingFrom + index : index + 1,
    }));
  }, [companies, showingFrom]);

  const activeCount = companies.filter(
    (company) => company.status === "active"
  ).length;

  const inactiveCount = companies.filter(
    (company) => company.status !== "active"
  ).length;

  const totalEmployees = companies.reduce(
    (sum, company) => sum + Number(company.employees_count ?? 0),
    0
  );

  const openCreate = () => {
    router.push("/flexi-hq/companies/new");
  };

  const openView = (company: CompanyRow) => {
    router.push(`/flexi-hq/companies/${company.id}`);
  };

  const openEdit = (company: CompanyRow) => {
    router.push(`/flexi-hq/companies/${company.id}/edit`);
  };

  const handleExportCSV = () => {
    const headers = [
      "Sr",
      "Company Name",
      "Code",
      "Registration No",
      "Industry",
      "City",
      "Status",
      "Divisions",
      "Departments",
      "Employees",
    ];

    const csvRows = rows.map((company) => [
      company.sr,
      company.company_name,
      company.company_code,
      company.registration_number ?? "-",
      company.industry ?? "-",
      company.city ?? "-",
      company.status,
      company.divisions_count,
      company.departments_count,
      company.employees_count,
    ]);

    const csv = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv" })
    );
    anchor.download = "companies.csv";
    anchor.click();
  };

  const columns: ColumnDef<CompanyRow>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "Sr.",
        cell: ({ row }) => (
          <span className="font-medium text-brand-900 text-sm">
            {row.original.sr}
          </span>
        ),
      },
      {
        accessorKey: "company_name",
        header: "Name",
        cell: ({ row }) => {
          const company = row.original;

          return (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-white text-xs font-bold flex-shrink-0">
              
                 { company.company_name.charAt(0)}
              
              </div>

              <div>
                <div className="font-semibold text-brand-900 text-sm">
                  {company.company_name}
                </div>
                <div className="text-[11px] text-brand-700">
                  {[company.city.name, company.country.name].filter(Boolean).join(", ") ||
                    "-"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "company_code",
        header: "Code / Reg No.",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-mono bg-brand-100 border border-gray-200 px-2.5 py-0.5 rounded text-xs text-brand-900 inline-block font-semibold">
              {row.original.company_code}
            </div>

            <div className="text-[11px] text-brand-700">
              {row.original.registration_number ?? "-"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "industry",
        header: "Industry",
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-full bg-brand-100 text-brand-800 border border-gray-200 px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
            {row.original.industry ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.original.status === "active";

          return (
            <Badge
              className={
                isActive
                  ? "bg-brand-700 text-white border-transparent hover:bg-brand-700"
                  : "bg-brand-600 text-white border-transparent hover:bg-brand-600"
              }
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "divisions_count",
        header: () => <div className="text-center">Divisions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5 text-brand-700" />
            <span className="font-semibold text-brand-900 text-sm">
              {row.original.divisions_count}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "departments_count",
        header: () => <div className="text-center">Depts</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-brand-700" />
            <span className="font-semibold text-brand-900 text-sm">
              {row.original.departments_count}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "employees_count",
        header: () => <div className="text-center">Employees</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-brand-700" />
            <span className="font-semibold text-brand-900 text-sm">
              {row.original.employees_count.toLocaleString()}
            </span>
          </div>
        ),
      },
    {
  id: "actions",
  header: () => <div className="text-center">Actions</div>,
  cell: ({ row }) => {
    const company = row.original;

    return (
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-brand-50 hover:text-brand-900"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          >
            <DropdownMenuItem
              onClick={() => openView(company)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-900"
            >
              <Eye className="h-4 w-4" />
              View
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => openEdit(company)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
}
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <div className="p-3 bg-white min-h-screen">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <Building2 className="h-5 w-5 text-white" />
              </div>

              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Companies
                </CardTitle>
                <p className="text-sm text-brand-700 mt-0.5">
                  {totalEntries.toLocaleString()} companies · manage your group
                  entities
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                className="bg-brand-800 hover:bg-brand-900 text-white gap-2"
                onClick={openCreate}
              >
                <PlusIcon className="h-4 w-4" />
                Add Company
              </Button>

              <Button
                variant="outline"
                className="gap-2 border-gray-200 text-brand-800 hover:bg-brand-100"
                onClick={handleExportCSV}
                disabled={rows.length === 0}
              >
                <DownloadIcon className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />

              <Input
                placeholder="Search by name, code, registration no..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10 border-gray-200 focus:border-brand-800 focus:ring-brand-800 text-brand-900"
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
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

          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-brand-700">Showing </span>
                <span className="font-semibold text-brand-900">
                  {showingFrom.toLocaleString()}
                </span>
                <span className="text-brand-700"> to </span>
                <span className="font-semibold text-brand-900">
                  {showingTo.toLocaleString()}
                </span>
                <span className="text-brand-700"> of </span>
                <span className="font-semibold text-brand-900">
                  {totalEntries.toLocaleString()}
                </span>
                <span className="text-brand-700"> entries</span>
              </div>

              {isFetching && (
                <Badge className="gap-1 border-gray-200 bg-white text-brand-800 text-xs">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating...
                </Badge>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {activeCount}
                </span>
                Active
              </div>

              <div className="h-3 w-px bg-brand-300" />

              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {inactiveCount}
                </span>
                Inactive
              </div>

              <div className="h-3 w-px bg-brand-300" />

              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {totalEmployees.toLocaleString()}
                </span>
                Total Employees
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="py-3 px-5 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider hover:bg-brand-200 transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody className="bg-white divide-y divide-brand-300/50">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="py-16 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-brand-700" />
                          <p className="font-medium text-brand-800">
                            Loading companies...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="py-16 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Building2 className="h-10 w-10 text-brand-300" />
                          <p className="font-medium text-red-600">{error}</p>
                          <p className="text-sm text-brand-600">
                            Please check your API URL or server response.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="py-16 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Building2 className="h-10 w-10 text-brand-300" />
                          <p className="font-medium text-brand-800">
                            No companies found
                          </p>
                          <p className="text-sm text-brand-600">
                            Try adjusting your search criteria
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-brand-100 transition-colors group"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-3.5 px-5 text-sm">
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

            {rows.length > 0 && (
              <div className="border-t border-gray-200 px-5 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-brand-700">
                    Page{" "}
                    <span className="font-semibold text-brand-900">
                      {currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-brand-900">
                      {totalPages}
                    </span>
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
                      onClick={() =>
                        setPage((previous) => Math.max(1, previous - 1))
                      }
                      disabled={currentPage === 1}
                      className="border-gray-200 text-brand-800 hover:bg-brand-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center space-x-1 mx-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, index) => {
                          let pageNumber: number;

                          if (totalPages <= 5) {
                            pageNumber = index + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = index + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + index;
                          } else {
                            pageNumber = currentPage - 2 + index;
                          }

                          return (
                            <Button
                              key={pageNumber}
                              variant={
                                currentPage === pageNumber
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setPage(pageNumber)}
                              className={
                                currentPage === pageNumber
                                  ? "bg-brand-800 hover:bg-brand-900 border-brand-800 text-white"
                                  : "border-gray-200 text-brand-800 hover:bg-brand-200"
                              }
                            >
                              {pageNumber}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((previous) =>
                          Math.min(totalPages, previous + 1)
                        )
                      }
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
                    <span className="font-semibold text-brand-900">
                      {showingFrom.toLocaleString()}
                    </span>
                    {" – "}
                    <span className="font-semibold text-brand-900">
                      {showingTo.toLocaleString()}
                    </span>
                    {" of "}
                    <span className="font-semibold text-brand-900">
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
    </div>
  );
}