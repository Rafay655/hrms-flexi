// app/(system)/pay-edge/payroll-processing/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  Pencil,
  MoreVertical,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { usePayrollWorkflowsList } from "@/hooks/usePayrollWorkflows";
import type { PayrollWorkflow } from "@/types/payroll-workflow";

/* ----------------------------------------------------------------------- */
/* Helpers                                                                  */
/* ----------------------------------------------------------------------- */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "border-gray-300 bg-gray-50 text-gray-700",
    open: "border-blue-200 bg-blue-50 text-blue-700",
    processing: "border-amber-200 bg-amber-50 text-amber-700",
    review: "border-orange-200 bg-orange-50 text-orange-700",
    locked: "border-purple-200 bg-purple-50 text-purple-700",
    published: "border-green-200 bg-green-50 text-green-700",
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <Badge variant="outline" className={`text-xs capitalize ${map[status.toLowerCase()] ?? "border-gray-200"}`}>
      {status}
    </Badge>
  );
}

function formatPKRShort(val: number) {
  return `PKR ${Math.round(val).toLocaleString()}`;
}

/* ----------------------------------------------------------------------- */
/* Main Page Component                                                      */
/* ----------------------------------------------------------------------- */

export default function PayrollProcessingPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading, isFetching } = usePayrollWorkflowsList(page, perPage);
  const workflows: PayrollWorkflow[] = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  const isEditable = (status: string) =>
    ["draft", "open", "processing", "review"].includes(status.toLowerCase());

  // Both "Create New" and "View/Edit" redirect to the run page.
  const handleCreate = () => router.push("/pay-edge/payroll-processing/run");
  const handleOpenRun = (workflow: PayrollWorkflow) =>
    router.push(`/pay-edge/payroll-processing/run?workflowUuid=${workflow.workflow_uuid}`);

  const columns: ColumnDef<PayrollWorkflow & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "SR. NO.",
        cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.sr}</div>,
      },
      {
        accessorKey: "run_id",
        header: "Run ID",
        cell: ({ row }) => <span className="font-mono font-semibold text-gray-900">{row.original.run_id}</span>,
      },
      {
        accessorKey: "period",
        header: "Period",
        cell: ({ row }) => <span className="font-semibold text-gray-900">{row.original.period}</span>,
      },
     
      {
        accessorKey: "employees",
        header: "Employees",
        cell: ({ row }) => <span className="text-sm">{row.original.employees}</span>,
      },
      {
        id: "financials",
        header: "Gross / Net",
        cell: ({ row }) => (
          <div className="text-sm">
            <span className="text-gray-600">{formatPKRShort(row.original.gross_total)}</span>
            <span className="mx-1 text-gray-300">/</span>
            <span className="font-medium text-gray-900">{formatPKRShort(row.original.net_payout)}</span>
          </div>
        ),
      },
      {
        id: "exceptions",
        header: "Exceptions",
        cell: ({ row }) => {
          const total =
            row.original.exception_summary.missing_bank_details +
            row.original.exception_summary.tax_slab_discrepancy +
            row.original.exception_summary.negative_net_salary;
          return total > 0 ? (
            <Badge variant="outline" className="border-red-200 bg-red-50 text-xs text-red-700 gap-1">
              <AlertCircle className="h-3 w-3" />
              {total}
            </Badge>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const wf = row.original;
          return (
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenRun(wf)}>
                    <Eye className="mr-2 h-3.5 w-3.5" /> View
                  </DropdownMenuItem>
                  {isEditable(wf.status) && (
                    <DropdownMenuItem onClick={() => handleOpenRun(wf)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    []
  );

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return workflows.map((wf, idx) => ({ ...wf, sr: startSr + idx + 1 }));
  }, [workflows, page, perPage]);

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
                Payroll Processing Runs
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} runs · Manage payroll workflows
              </p>
            </div>
            <Button
              className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4" /> New Run
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by run ID, period, or group..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select
                value={perPage.toString()}
                onValueChange={(v) => {
                  setPerPage(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full border-gray-300">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
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
            <div className="text-sm">
              <span className="text-gray-600">Showing</span>
              <span className="font-semibold mx-1">{showingFrom}</span>
              <span className="text-gray-600">to</span>
              <span className="font-semibold mx-1">{showingTo}</span>
              <span className="text-gray-600">of</span>
              <span className="font-semibold mx-1">{totalEntries}</span>
              <span className="text-gray-600">entries</span>
            </div>
            {(isLoading || isFetching) && (
              <Badge className="ml-2">
                <Loader2 className="h-3 w-3 animate-spin" />
              </Badge>
            )}
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
                        <p className="text-gray-500 mt-2">Loading runs...</p>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center text-gray-500">
                        No payroll runs found.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-4 px-6 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                    Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1} className="border-gray-300">
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="border-gray-300">
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
                                ? "bg-[#1E1B4B] hover:bg-[#2A2675]"
                                : "border-gray-300 hover:bg-gray-100"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="border-gray-300">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages} className="border-gray-300">
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{showingFrom}</span> – <span className="font-semibold">{showingTo}</span> of{" "}
                    <span className="font-semibold">{totalEntries}</span> entries
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