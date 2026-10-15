"use client";

import { showApiError } from "@/lib/error-toast";
import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Eye,
  Pencil,
  Plus,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loanHubService } from "@/services/loan-hub";
import type { LoanType } from "@/types/loan-hub";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";   // already imported, but ensure it's there
// ── Form data type ──────────────────────────────────
interface LoanTypeFormData {
  code: string;
  name: string;
  name_ur: string;
  category: string;
  description: string;
  is_active: boolean;
}

const emptyForm = (): LoanTypeFormData => ({
  code: "",
  name: "",
  name_ur: "",
  category: "",
  description: "",
  is_active: true,
});

// ── Debounce hook ────────────────────────────────────
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Component ────────────────────────────────────────
export default function LoanTypesManager() {
  const qc = useQueryClient();
  const { data: allTypes = [], isLoading } = useQuery({
    queryKey: ["loan-hub", "types"],
    queryFn: () => loanHubService.getTypes(),
  });

  // ── Filters & Pagination ──────────────────────────
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<keyof LoanType | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ── Client-side filtering / sorting / pagination ──
  const filtered = useMemo(() => {
    let list = allTypes as LoanType[];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (t) =>
          t.code.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
      );
    }
    if (sortField) {
      list = [...list].sort((a, b) => {
        const aVal = (a[sortField] ?? "") as string;
        const bVal = (b[sortField] ?? "") as string;
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [allTypes, debouncedSearch, sortField, sortDir]);

  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / perPage);
  const safePage = Math.max(1, Math.min(page, totalPages || 1));
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const showingFrom = totalEntries > 0 ? (safePage - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(safePage * perPage, totalEntries) : 0;

  // ── Modal states ──────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedItem, setSelectedItem] = useState<LoanType | null>(null);
  const [viewItem, setViewItem] = useState<LoanType | null>(null);
  const [deleteItem, setDeleteItem] = useState<LoanType | null>(null);
  const [form, setForm] = useState<LoanTypeFormData>(emptyForm());

  // ── Mutations ─────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: LoanTypeFormData) => loanHubService.createType(data as Partial<LoanType>),
    onSuccess: () => {
      toast.success("Loan type created.");
      qc.invalidateQueries({ queryKey: ["loan-hub", "types"] });
      setIsFormOpen(false);
      setForm(emptyForm());
    },
    onError: (e: any) => showApiError(e, { fallbackMessage: e?.response?.data?.message ?? "Could not create loan type." }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: LoanTypeFormData }) =>
      loanHubService.updateType(uuid, data as Partial<LoanType>),
    onSuccess: () => {
      toast.success("Loan type updated.");
      qc.invalidateQueries({ queryKey: ["loan-hub", "types"] });
      setIsFormOpen(false);
      setSelectedItem(null);
      setForm(emptyForm());
    },
    onError: (e: any) => showApiError(e, { fallbackMessage: e?.response?.data?.message ?? "Could not update loan type." }),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => loanHubService.deleteType(uuid),
    onSuccess: () => {
      toast.success("Loan type deleted.");
      qc.invalidateQueries({ queryKey: ["loan-hub", "types"] });
      setDeleteItem(null);
    },
    onError: (e: any) => {
      showApiError(e, { fallbackMessage: e?.response?.data?.message ?? "Could not delete loan type." });
      setDeleteItem(null);
    },
  });

  // ── Handlers ──────────────────────────────────────
  const openCreate = () => {
    setFormMode("create");
    setSelectedItem(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };

  const openEdit = (item: LoanType) => {
    setFormMode("edit");
    setSelectedItem(item);
    setForm({
      code: item.code,
      name: item.name,
      name_ur: item.name_ur ?? "",
      category: item.category ?? "",
      description: item.description ?? "",
      is_active: item.is_active,
    });
    setIsFormOpen(true);
  };

  const openView = (item: LoanType) => setViewItem(item);

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim() || !form.category.trim()) {
      toast.error("Code, Name and Category are required.");
      return;
    }
    if (formMode === "create") {
      createMutation.mutate(form);
    } else if (selectedItem) {
      updateMutation.mutate({ uuid: selectedItem.uuid, data: form });
    }
  };

  const handleSort = (field: keyof LoanType) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // Reset page when search or perPage changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, perPage]);

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Loan Types
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} types · Configure loan & advance products
              </p>
            </div>
            <Button
              className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" /> Add Loan Type
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by code, name or category…"
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
              {isLoading && (
                <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50">
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
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
                      SR. NO.
                    </th>
                    <th
                      className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("code")}
                    >
                      CODE{" "}
                      {sortField === "code" && (sortDir === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("name")}
                    >
                      NAME{" "}
                      {sortField === "name" && (sortDir === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      CATEGORY
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      SCOPE
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="py-3 px-6 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">Loading loan types...</p>
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        No loan types found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((type, idx) => (
                      <tr key={type.uuid} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 text-sm text-gray-500">
                          {showingFrom + idx}
                        </td>
                        <td className="py-4 px-6 text-sm font-mono font-semibold text-gray-900">
                          {type.code}
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-900">
                          {type.name}
                        </td>
                        <td className="py-4 px-6 text-sm capitalize text-gray-700">
                          {type.category}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              type.is_system
                                ? "bg-gray-100 text-gray-500"
                                : "bg-brand-100 text-brand-700"
                            }`}
                          >
                            {type.is_system ? "System" : "Company"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              type.is_active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {type.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      <td className="py-4 px-6 text-center">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => openView(type)}>
        <Eye className="mr-2 h-3.5 w-3.5" /> View
      </DropdownMenuItem>
      {!type.is_system && (
        <>
          <DropdownMenuItem onClick={() => openEdit(type)}>
            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteItem(type)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && totalEntries > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-900">{safePage}</span> of{" "}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={safePage === 1}
                      className="border-gray-300"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, safePage - 1))}
                      disabled={safePage === 1}
                      className="border-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center space-x-1 mx-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (safePage <= 3) pageNum = i + 1;
                        else if (safePage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = safePage - 2 + i;
                        return (
                          <Button
                            key={pageNum}
                            variant={safePage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className={
                              safePage === pageNum
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
                      onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                      disabled={safePage === totalPages}
                      className="border-gray-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={safePage === totalPages}
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

      {/* ── Create / Edit Modal ────────────────────────── */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setSelectedItem(null);
            setForm(emptyForm());
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Add Loan Type" : "Edit Loan Type"}
            </DialogTitle>
            <DialogDescription>
              {formMode === "create"
                ? "Fill in the details to add a new loan type."
                : "Make changes to the loan type below."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Code */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right font-medium">
                Code *
              </Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="col-span-3"
                maxLength={20}
              />
            </div>

            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right font-medium">
                Name *
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="col-span-3"
                maxLength={150}
              />
            </div>

            {/* Urdu Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name_ur" className="text-right font-medium">
                Urdu Name
              </Label>
              <Input
                id="name_ur"
                value={form.name_ur}
                onChange={(e) => setForm({ ...form, name_ur: e.target.value })}
                className="col-span-3"
              />
            </div>

            {/* Category */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right font-medium">
                Category *
              </Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="col-span-3"
              />
            </div>

            {/* Description */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right font-medium pt-2">
                Description
              </Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="col-span-3 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#1E1B4B]/20"
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Status</Label>
              <Select
                value={form.is_active ? "active" : "inactive"}
                onValueChange={(val) =>
                  setForm({ ...form, is_active: val === "active" })
                }
              >
                <SelectTrigger className="col-span-3">
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
            <Button
              variant="outline"
              onClick={() => {
                setIsFormOpen(false);
                setSelectedItem(null);
                setForm(emptyForm());
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[#1E1B4B] hover:bg-[#2A2675] text-white"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : formMode === "create" ? (
                "Create Type"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Modal ──────────────────────────────────── */}
      <Dialog open={viewItem !== null} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-brand-900">{viewItem?.name}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Code" value={viewItem.code} />
              <Field label="Category" value={viewItem.category} />
              <Field
                label="Scope"
                value={viewItem.is_system ? "System default" : "Company"}
              />
              <Field
                label="Status"
                value={viewItem.is_active ? "Active" : "Inactive"}
              />
              {viewItem.name_ur && <Field label="Urdu name" value={viewItem.name_ur} />}
              {viewItem.description && (
                <div className="col-span-2">
                  <Field label="Description" value={viewItem.description} />
                </div>
              )}
            </dl>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewItem(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────── */}
      <AlertDialog open={deleteItem !== null} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteItem?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This loan type will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItem && deleteMutation.mutate(deleteItem.uuid)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
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
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="font-medium capitalize text-brand-900">{value}</dd>
    </div>
  );
}