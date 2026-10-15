"use client";

import React, { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Shield,
  CheckCircle,
  XCircle,
  DownloadIcon,
  SearchIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  PlusIcon,
  Trash2,
  Eye,
  Pencil,
  Key,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCreateValidationRule,
  useDeleteValidationRule,
  useUpdateValidationRule,
  useValidationRules,
} from "@/hooks/useValidationRules";
import type {
  ValidationRule,
  ValidationRuleCategory,
  ValidationRuleFormData,
  ValidationRuleParamType,
} from "@/types/validation-rule";

const DEFAULT_PER_PAGE = 10;

const CATEGORIES: ValidationRuleCategory[] = [
  "format",
  "string",
  "length",
  "numeric",
  "date",
  "file",
  "custom",
];

const PARAM_TYPES: ValidationRuleParamType[] = ["integer", "float", "string"];

const FIELD_TYPES = [
  "text",
  "email",
  "phone",
  "number",
  "select",
  "checkbox",
  "file",
  "date",
  "textarea",
];

const emptyFormData: ValidationRuleFormData = {
  key: "",
  label: "",
  description: "",
  applies_to: [],
  has_param: false,
  param_label: "",
  param_type: "",
  laravel_rule: "",
  category: "format",
  is_active: true,
};

function useDebounced<T>(value: T, delay = 400) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

const toFormData = (rule: ValidationRule): ValidationRuleFormData => ({
  key: rule.key,
  label: rule.label,
  description: rule.description ?? "",
  applies_to: rule.applies_to ?? [],
  has_param: rule.has_param,
  param_label: rule.param_label ?? "",
  param_type: rule.param_type ?? "",
  laravel_rule: rule.laravel_rule,
  category: rule.category,
  is_active: rule.is_active,
});

export default function ValidationRulesListing() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  const {
    data: rulesResponse,
    isLoading,
    isFetching,
    isError,
    error,
  } = useValidationRules({
    page,
    per_page: perPage,
    search: debouncedSearch,
  });

  const createMutation = useCreateValidationRule();
  const updateMutation = useUpdateValidationRule();
  const deleteMutation = useDeleteValidationRule();

  const rules = rulesResponse?.data ?? [];
  const meta = rulesResponse?.meta;

  const totalEntries = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.last_page ?? 1);
  const currentPage = meta?.current_page ?? page;

  const showingFrom =
    totalEntries > 0 ? meta?.from ?? (currentPage - 1) * perPage + 1 : 0;

  const showingTo =
    totalEntries > 0
      ? meta?.to ?? Math.min(currentPage * perPage, totalEntries)
      : 0;

  const rows: (ValidationRule & { sr: number })[] = useMemo(() => {
    return rules.map((rule, index) => ({
      sr: showingFrom + index,
      ...rule,
    }));
  }, [rules, showingFrom]);

  React.useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">(
    "create"
  );
  const [selectedRule, setSelectedRule] = useState<ValidationRule | null>(null);
  const [formData, setFormData] =
    useState<ValidationRuleFormData>(emptyFormData);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const isViewMode = modalMode === "view";
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const openCreate = () => {
    setSelectedRule(null);
    setFormData(emptyFormData);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const openView = (rule: ValidationRule) => {
    setSelectedRule(rule);
    setFormData(toFormData(rule));
    setModalMode("view");
    setIsModalOpen(true);
  };

  const openEdit = (rule: ValidationRule) => {
    setSelectedRule(rule);
    setFormData(toFormData(rule));
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleFieldTypeToggle = (type: string, checked: boolean) => {
    setFormData((previous) => ({
      ...previous,
      applies_to: checked
        ? [...previous.applies_to, type]
        : previous.applies_to.filter((item) => item !== type),
    }));
  };

  const validateForm = () => {
    if (!formData.key.trim()) return "Key is required.";
    if (!/^[a-z0-9_]+$/.test(formData.key.trim())) {
      return "Key must be lowercase letters, numbers, and underscores only.";
    }

    if (!formData.label.trim()) return "Label is required.";
    if (!formData.applies_to.length) return "Please select at least one field type.";
    if (!formData.laravel_rule.trim()) return "Laravel rule is required.";
    if (!formData.category) return "Category is required.";

    if (formData.has_param) {
      if (!formData.param_label.trim()) {
        return "Param label is required when has_param is true.";
      }

      if (!formData.param_type) {
        return "Param type is required when has_param is true.";
      }

      if (!formData.laravel_rule.includes("{value}")) {
        return "Laravel rule should include {value} when this rule has a parameter.";
      }
    }

    return null;
  };

  const handleSave = async () => {
    const errorMessage = validateForm();

    if (errorMessage) {
      alert(errorMessage);
      return;
    }

    if (modalMode === "create") {
      await createMutation.mutateAsync(formData);
      setIsModalOpen(false);
      return;
    }

    if (modalMode === "edit" && selectedRule) {
      await updateMutation.mutateAsync({
        id: selectedRule.id,
        payload: formData,
      });

      setIsModalOpen(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleExportCSV = () => {
    const headers = [
      "Sr",
      "Key",
      "Label",
      "Description",
      "Applies To",
      "Param",
      "Laravel Rule",
      "Category",
      "Active",
    ];

    const csvRows = rows.map((rule) => [
      rule.sr,
      rule.key,
      rule.label,
      rule.description ?? "",
      rule.applies_to?.join("; ") ?? "",
      rule.has_param
        ? `Yes (${rule.param_label ?? ""} : ${rule.param_type ?? ""})`
        : "No",
      rule.laravel_rule,
      rule.category,
      rule.is_active ? "Yes" : "No",
    ]);

    const csv = [headers, ...csvRows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    anchor.download = "validation-rules.csv";
    anchor.click();
  };

  const getErrorMessage = () => {
    return (
      (error as any)?.response?.data?.message ||
      (error as Error)?.message ||
      "Please try again."
    );
  };

  const columns: ColumnDef<(typeof rows)[0]>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "Sr.",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-brand-900">
            {row.original.sr}
          </span>
        ),
      },
      {
        accessorKey: "key",
        header: "Key / Label",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-white">
              <Key className="h-4 w-4" />
            </div>

            <div>
              <div className="text-sm font-semibold text-brand-900">
                {row.original.label}
              </div>
              <div className="text-[11px] text-brand-700">
                key: {row.original.key}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "applies_to",
        header: "Applies To",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {(row.original.applies_to ?? []).map((type) => (
              <Badge
                key={type}
                variant="outline"
                className="border-gray-200 bg-brand-100 px-2 py-0.5 text-[10px] text-brand-800"
              >
                {type}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "has_param",
        header: "Param?",
        cell: ({ row }) =>
          row.original.has_param ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-700">
              <CheckCircle className="h-3.5 w-3.5" />
              Yes
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <XCircle className="h-3.5 w-3.5" />
              No
            </span>
          ),
      },
      {
        accessorKey: "laravel_rule",
        header: "Laravel Rule",
        cell: ({ row }) => {
          const rule = row.original.laravel_rule ?? "";

          return (
            <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-brand-900">
              {rule.substring(0, 40)}
              {rule.length > 40 ? "..." : ""}
            </code>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge className="border-gray-200 bg-brand-100 text-brand-800">
            {row.original.category}
          </Badge>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Active",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.is_active
                ? "border-transparent bg-brand-700 text-white"
                : "border-transparent bg-gray-200 text-gray-500"
            }
          >
            {row.original.is_active ? "Yes" : "No"}
          </Badge>
        ),
      },
{
  id: "actions",
  header: () => <div className="text-center">Actions</div>,
  cell: ({ row }) => {
    const rule = row.original;

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
            className="w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          >
            <DropdownMenuItem
              onClick={() => openView(rule)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-900"
            >
              <Eye className="h-4 w-4" />
              View
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => openEdit(rule)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setDeleteId(rule.id)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
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
    state: {
      sorting,
    },
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
                <Shield className="h-5 w-5 text-white" />
              </div>

              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Validation Rules
                </CardTitle>
                <p className="mt-0.5 text-sm text-brand-700">
                  {totalEntries.toLocaleString()} rules · define reusable field
                  validation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                className="gap-2 bg-brand-800 text-white hover:bg-brand-900"
                onClick={openCreate}
              >
                <PlusIcon className="h-4 w-4" />
                Add Rule
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

        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />

              <Input
                placeholder="Search by key, label, rule, category..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="border-gray-200 pl-10 text-brand-900 focus:border-brand-800 focus:ring-brand-800"
              />
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="text-sm text-brand-700">Show</span>

              <Select
                value={perPage.toString()}
                onValueChange={(value) => setPerPage(Number(value))}
              >
                <SelectTrigger className="w-20 border-gray-200 text-brand-800">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {[10, 20, 25, 50, 100].map((value) => (
                    <SelectItem key={value} value={value.toString()}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-sm text-brand-700">entries</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
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

              {isFetching && !isLoading && (
                <Badge className="gap-1 border-gray-200 bg-white text-xs text-brand-800">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating...
                </Badge>
              )}
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {rules.filter((rule) => rule.is_active).length}
                </span>
                Active on this page
              </div>

              <div className="h-3 w-px bg-brand-300" />

              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {rules.filter((rule) => !rule.is_active).length}
                </span>
                Inactive on this page
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="cursor-pointer px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800 hover:bg-brand-200"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}

                            {header.column.getIsSorted() === "asc" && (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}

                            {header.column.getIsSorted() === "desc" && (
                              <ChevronLeft className="h-3.5 w-3.5" />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={columns.length} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-brand-700" />
                          <p className="font-medium text-brand-800">
                            Loading validation rules...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan={columns.length} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Shield className="h-10 w-10 text-red-300" />
                          <p className="font-medium text-red-700">
                            Failed to load validation rules
                          </p>
                          <p className="text-sm text-brand-600">
                            {getErrorMessage()}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Shield className="h-10 w-10 text-brand-300" />
                          <p className="font-medium text-brand-800">
                            No validation rules found
                          </p>
                          <p className="text-sm text-brand-600">
                            Try adjusting your search.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-brand-100"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-5 py-3.5 text-sm">
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
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
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
                      disabled={currentPage === 1 || isFetching}
                      className="border-gray-200 text-brand-800 hover:bg-brand-200"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || isFetching}
                      className="border-gray-200 text-brand-800 hover:bg-brand-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="mx-1 flex items-center space-x-1">
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
                              disabled={isFetching}
                              className={
                                currentPage === pageNumber
                                  ? "border-brand-800 bg-brand-800 text-white hover:bg-brand-900"
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
                        setPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages || isFetching}
                      className="border-gray-200 text-brand-800 hover:bg-brand-200"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={currentPage === totalPages || isFetching}
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="overflow-hidden border border-gray-200 bg-white p-0 sm:max-w-[720px]">
          <div className="bg-brand-900 px-6 py-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
                <Shield className="h-4 w-4 opacity-80" />
                {modalMode === "create" && "Add Validation Rule"}
                {modalMode === "edit" && "Edit Validation Rule"}
                {modalMode === "view" && "Validation Rule Details"}
              </DialogTitle>
            </DialogHeader>

            <DialogDescription className="mt-1 text-xs text-brand-300">
              {modalMode === "create" && "Create a reusable field validation rule."}
              {modalMode === "edit" && "Update this reusable validation rule."}
              {modalMode === "view" && "View validation rule details."}
            </DialogDescription>
          </div>

          <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-[180px_1fr] items-center gap-3">
              <Label className="text-right text-sm font-medium text-brand-800">
                Key <span className="text-red-500">*</span>
              </Label>

              <Input
                value={formData.key}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    key: event.target.value,
                  }))
                }
                disabled={isViewMode}
                placeholder="e.g. cnic_format"
                className="border-gray-200 focus:border-brand-800"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-3">
              <Label className="text-right text-sm font-medium text-brand-800">
                Label <span className="text-red-500">*</span>
              </Label>

              <Input
                value={formData.label}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    label: event.target.value,
                  }))
                }
                disabled={isViewMode}
                placeholder="e.g. CNIC Format"
                className="border-gray-200 focus:border-brand-800"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] items-start gap-3">
              <Label className="mt-2 text-right text-sm font-medium text-brand-800">
                Description
              </Label>

              <Textarea
                value={formData.description}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                disabled={isViewMode}
                placeholder="Optional description"
                className="border-gray-200 focus:border-brand-800"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] items-start gap-3">
              <Label className="mt-2 text-right text-sm font-medium text-brand-800">
                Applies To <span className="text-red-500">*</span>
              </Label>

              <div className="mt-1 flex flex-wrap gap-3">
                {FIELD_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={formData.applies_to.includes(type)}
                      disabled={isViewMode}
                      onCheckedChange={(checked) =>
                        handleFieldTypeToggle(type, Boolean(checked))
                      }
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-3">
              <Label className="text-right text-sm font-medium text-brand-800">
                Has Parameter?
              </Label>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.has_param}
                  disabled={isViewMode}
                  onCheckedChange={(checked) =>
                    setFormData((previous) => ({
                      ...previous,
                      has_param: checked,
                      param_label: checked ? previous.param_label : "",
                      param_type: checked ? previous.param_type : "",
                    }))
                  }
                />

                <span className="text-xs text-brand-700">
                  {formData.has_param
                    ? "Rule requires a parameter"
                    : "No parameter"}
                </span>
              </div>
            </div>

            {formData.has_param && (
              <>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-right text-sm font-medium text-brand-800">
                    Param Label <span className="text-red-500">*</span>
                  </Label>

                  <Input
                    value={formData.param_label}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        param_label: event.target.value,
                      }))
                    }
                    disabled={isViewMode}
                    placeholder="e.g. Minimum characters"
                    className="border-gray-200 focus:border-brand-800"
                  />
                </div>

                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-right text-sm font-medium text-brand-800">
                    Param Type <span className="text-red-500">*</span>
                  </Label>

                  <Select
                    value={formData.param_type || undefined}
                    disabled={isViewMode}
                    onValueChange={(value) =>
                      setFormData((previous) => ({
                        ...previous,
                        param_type: value as ValidationRuleParamType,
                      }))
                    }
                  >
                    <SelectTrigger className="border-gray-200 text-brand-800">
                      <SelectValue placeholder="Select param type" />
                    </SelectTrigger>

                    <SelectContent>
                      {PARAM_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid grid-cols-[180px_1fr] items-start gap-3">
              <Label className="mt-2 text-right text-sm font-medium text-brand-800">
                Laravel Rule <span className="text-red-500">*</span>
              </Label>

              <Textarea
                value={formData.laravel_rule}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    laravel_rule: event.target.value,
                  }))
                }
                disabled={isViewMode}
                placeholder="e.g. min:{value} or regex:/^[0-9]{13}$/"
                className="min-h-[80px] border-gray-200 font-mono text-xs focus:border-brand-800"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-3">
              <Label className="text-right text-sm font-medium text-brand-800">
                Category <span className="text-red-500">*</span>
              </Label>

              <Select
                value={formData.category || undefined}
                disabled={isViewMode}
                onValueChange={(value) =>
                  setFormData((previous) => ({
                    ...previous,
                    category: value as ValidationRuleCategory,
                  }))
                }
              >
                <SelectTrigger className="border-gray-200 text-brand-800">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>

                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-3">
              <Label className="text-right text-sm font-medium text-brand-800">
                Active
              </Label>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  disabled={isViewMode}
                  onCheckedChange={(checked) =>
                    setFormData((previous) => ({
                      ...previous,
                      is_active: checked,
                    }))
                  }
                />

                <span className="text-xs text-brand-700">
                  {formData.is_active ? "Rule is active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 px-6 pb-5">
            <Button
              variant="outline"
              className="border-gray-200 text-brand-800"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              {isViewMode ? "Close" : "Cancel"}
            </Button>

            {modalMode === "view" && selectedRule && (
              <Button
                className="bg-brand-800 text-white hover:bg-brand-900"
                onClick={() => setModalMode("edit")}
              >
                Edit
              </Button>
            )}

            {modalMode !== "view" && (
              <Button
                className="bg-brand-800 text-white hover:bg-brand-900"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {modalMode === "create" ? "Create Rule" : "Update Rule"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="border border-gray-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-brand-900">
              Delete Validation Rule?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-brand-700">
              This action cannot be undone. The validation rule will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-gray-200 text-brand-800 hover:bg-brand-100"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}