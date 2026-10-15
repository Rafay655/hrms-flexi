'use client';

import { showApiError } from "@/lib/error-toast";
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  MoreVertical,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { expenseHubService } from '@/services/expense-hub';
import type { ExpensePolicy, ExpenseCategory, Paginated } from '@/types/expense-hub';
import { cn } from '@/lib/utils';

// ── Debounce hook ─────────────────────────────────────
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Types ──────────────────────────────────────────────
type Form = Partial<ExpensePolicy> & { category_uuid?: string | null };
const blank: Form = {
  name: '',
  is_active: true,
  is_blackout: false,
  max_amount_per_line: null,
  max_amount_per_claim: null,
  auto_approve_below: null,
  receipt_required_above: null,
  category_uuid: null,
};

const numField = (v: string | null | undefined): string => (v === null || v === undefined ? '' : String(v));

// ── Helpers ────────────────────────────────────────────
const getStatusBadge = (isActive: boolean) => {
  return isActive ? (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
  ) : (
    <Badge variant="secondary">Inactive</Badge>
  );
};

const formatCurrency = (value: string | null) => {
  if (!value) return '—';
  return `PKR ${parseFloat(value).toLocaleString()}`;
};

// ── Main Component ────────────────────────────────────
export default function PoliciesPage() {
  const queryClient = useQueryClient();

  // ── Query params ────────────────────────────────────
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 400);
  const [statusFilter, setStatusFilter] = useState('');

  // ── Fetch categories for dropdown ───────────────────
  const { data: catData } = useQuery<Paginated<ExpenseCategory>>({
    queryKey: ['expense-hub', 'categories', 'active'],
    queryFn: () => expenseHubService.getCategories({ active_only: 1, per_page: 200 }),
  });
  const categories = catData?.items ?? [];

  // ── Build category map for name lookup by UUID ──────
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((cat) => {
      map[cat.uuid] = cat.name;
    });
    return map;
  }, [categories]);

  const getCategoryName = (uuid: string | null) => {
    if (!uuid) return 'All categories';
    return categoryMap[uuid] || 'Unknown';
  };

  // ── Fetch policies ──────────────────────────────────
  const { data, isLoading, isFetching, refetch } = useQuery<Paginated<ExpensePolicy>>({
    queryKey: ['expense-hub', 'policies', { page, perPage, search: debouncedSearch, status: statusFilter }],
    queryFn: () =>
      expenseHubService.getPolicies({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        is_active: statusFilter || undefined,
      }),
  });

  const policies = data?.items ?? [];
  const meta = data?.meta;
  const totalEntries = meta?.total ?? 0;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? 1;

  // ── Mutations ───────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['expense-hub', 'policies'] });

  const createMutation = useMutation({
    mutationFn: (payload: Form) => {
      const body: Record<string, unknown> = {
        name: payload.name,
        category_id: payload.category_uuid || undefined, // service expects category_id as UUID
        max_amount_per_line: payload.max_amount_per_line || undefined,
        max_amount_per_claim: payload.max_amount_per_claim || undefined,
        auto_approve_below: payload.auto_approve_below || undefined,
        receipt_required_above: payload.receipt_required_above || undefined,
        is_blackout: payload.is_blackout,
        is_active: payload.is_active,
      };
      return expenseHubService.createPolicy(body);
    },
    onSuccess: () => { toast.success('Policy created.'); invalidate(); resetForm(); },
    onError: (e: any) => showApiError(e, { fallbackMessage: e?.response?.data?.message ?? 'Could not create policy.' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: Form }) => {
      const body: Record<string, unknown> = {
        name: payload.name,
        category_id: payload.category_uuid || undefined,
        max_amount_per_line: payload.max_amount_per_line || undefined,
        max_amount_per_claim: payload.max_amount_per_claim || undefined,
        auto_approve_below: payload.auto_approve_below || undefined,
        receipt_required_above: payload.receipt_required_above || undefined,
        is_blackout: payload.is_blackout,
        is_active: payload.is_active,
      };
      return expenseHubService.updatePolicy(uuid, body);
    },
    onSuccess: () => { toast.success('Policy updated.'); invalidate(); resetForm(); },
    onError: (e: any) => showApiError(e, { fallbackMessage: e?.response?.data?.message ?? 'Could not update policy.' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => expenseHubService.deletePolicy(uuid),
    onSuccess: () => { toast.success('Policy deleted.'); invalidate(); setDeleteItem(null); },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Could not delete policy.' }),
  });

  // ── Modal state ─────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ExpensePolicy | null>(null);

  const [selectedPolicy, setSelectedPolicy] = useState<ExpensePolicy | null>(null);
  const [form, setForm] = useState<Form>({ ...blank });
  const [editUuid, setEditUuid] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ ...blank });
    setEditUuid(null);
    setSelectedPolicy(null);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
  };

  const openCreate = () => {
    setForm({ ...blank });
    setEditUuid(null);
    setIsCreateModalOpen(true);
  };

  const openEdit = (policy: ExpensePolicy) => {
    setSelectedPolicy(policy);
    // For edit, we need to find the category UUID if there's a category_id.
    // Since we only have category_id (number) in the policy, we need to look it up.
    // But the policy type has category_id as number; we need to find the corresponding UUID.
    // We'll look up by the numeric id if available.
    // However, the categoryMap is by UUID, not by numeric id.
    // We'll build a map from numeric id to UUID if the API returns it.
    // The categories response may include 'id' as a numeric field.
    // We'll handle this by trying to find the category by matching the numeric id.
    // For simplicity, we'll store the category_uuid directly if we can find it.
    // We can search in categories for the matching id.
    const categoryId = policy.category_id;
    let categoryUuid: string | null = null;
    if (categoryId) {
      const found = categories.find((cat) => (cat as any).id === categoryId);
      if (found) categoryUuid = found.uuid;
    }
    setForm({
      ...policy,
      category_uuid: categoryUuid,
    });
    setEditUuid(policy.uuid);
    setIsEditModalOpen(true);
  };

  const openView = (policy: ExpensePolicy) => {
    setSelectedPolicy(policy);
    setIsViewModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name) {
      toast.error('Policy name is required.');
      return;
    }
    if (editUuid) {
      updateMutation.mutate({ uuid: editUuid, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  // ── Reset page on filter change ─────────────────────
  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, statusFilter]);

  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Expense Policies
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} policies • Limits, auto‑approval thresholds & receipt rules
              </p>
            </div>
            <Button
              className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
              onClick={openCreate}
              disabled={createMutation.isPending}
            >
              <Plus className="h-4 w-4" /> New Policy
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by policy name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#1E1B4B] focus:ring-[#1E1B4B]"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-sm text-gray-600 whitespace-nowrap">Status</span>
              <Select
                value={statusFilter || 'all'}
                onValueChange={(val) => setStatusFilter(val === 'all' ? '' : val)}
              >
                <SelectTrigger className="w-full md:w-36 border-gray-300">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 ml-auto w-full md:w-auto">
              <span className="text-sm text-gray-600 whitespace-nowrap">Show</span>
              <Select
                value={perPage.toString()}
                onValueChange={(value) => {
                  setPerPage(Number(value));
                  setPage(1);
                }}
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
              {(isLoading || isFetching) && (
                <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50">
                  <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">SR. NO.</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NAME</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">PER LINE</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">PER CLAIM</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">AUTO-APPROVE</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">STATUS</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <div className="h-5 w-5 border-2 border-[#1E1B4B] border-t-transparent rounded-full animate-spin" />
                          Loading policies...
                        </div>
                      </td>
                    </tr>
                  ) : policies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        No policies found. Try adjusting your filters.
                      </td>
                    </tr>
                  ) : (
                    policies.map((policy, index) => {
                      const sr = (currentPage - 1) * perPage + index + 1;
                      return (
                        <tr key={policy.uuid} className="hover:bg-gray-50 transition-colors group">
                          <td className="py-4 px-6 text-sm text-gray-500">{sr}</td>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900">
                            {policy.name}
                          </td>
                          <td className="py-4 px-6 text-sm text-right font-mono text-gray-700">
                            {formatCurrency(policy.max_amount_per_line)}
                          </td>
                          <td className="py-4 px-6 text-sm text-right font-mono text-gray-700">
                            {formatCurrency(policy.max_amount_per_claim)}
                          </td>
                          <td className="py-4 px-6 text-sm text-right font-mono text-gray-700">
                            {formatCurrency(policy.auto_approve_below)}
                          </td>
                          <td className="py-4 px-6 text-sm">{getStatusBadge(policy.is_active)}</td>
                          <td className="py-4 px-6 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openView(policy)}>
                                  <Eye className="mr-2 h-3.5 w-3.5" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEdit(policy)}>
                                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteItem(policy)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && policies.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={currentPage === 1}
                      className="border-gray-300"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="border-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center space-x-1 mx-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className={
                              currentPage === pageNum
                                ? 'bg-[#1E1B4B] hover:bg-[#2A2675] border-[#1E1B4B]'
                                : 'border-gray-300 hover:bg-gray-100'
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
                      onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="border-gray-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="border-gray-300"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{showingFrom.toLocaleString()}</span>
                    {' - '}
                    <span className="font-semibold text-gray-900">{showingTo.toLocaleString()}</span>
                    {' of '}
                    <span className="font-semibold text-gray-900">{totalEntries.toLocaleString()}</span>
                    {' entries'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Create Modal ──────────────────────────────────── */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense Policy</DialogTitle>
            <DialogDescription>Create a new expense policy.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="create-name" className="mb-2 block">Name</Label>
              <Input
                id="create-name"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Travel Policy"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="create-category" className="mb-2 block">Category (optional)</Label>
              <Select
                value={form.category_uuid || 'all'}
                onValueChange={(val) => {
                  setForm({
                    ...form,
                    category_uuid: val === 'all' ? null : val,
                  });
                }}
              >
                <SelectTrigger id="create-category" className="w-full">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.uuid} value={cat.uuid}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="create-line" className="mb-2 block">Max per line</Label>
                <Input
                  id="create-line"
                  type="number"
                  value={numField(form.max_amount_per_line)}
                  onChange={(e) => setForm({ ...form, max_amount_per_line: e.target.value || null })}
                  placeholder="e.g. 50000"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="create-claim" className="mb-2 block">Max per claim</Label>
                <Input
                  id="create-claim"
                  type="number"
                  value={numField(form.max_amount_per_claim)}
                  onChange={(e) => setForm({ ...form, max_amount_per_claim: e.target.value || null })}
                  placeholder="e.g. 200000"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="create-auto" className="mb-2 block">Auto-approve below</Label>
                <Input
                  id="create-auto"
                  type="number"
                  value={numField(form.auto_approve_below)}
                  onChange={(e) => setForm({ ...form, auto_approve_below: e.target.value || null })}
                  placeholder="e.g. 10000"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="create-receipt" className="mb-2 block">Receipt required above</Label>
                <Input
                  id="create-receipt"
                  type="number"
                  value={numField(form.receipt_required_above)}
                  onChange={(e) => setForm({ ...form, receipt_required_above: e.target.value || null })}
                  placeholder="e.g. 5000"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <Label htmlFor="create-blackout" className="mb-0">Blackout (not claimable)</Label>
              <Switch
                id="create-blackout"
                checked={!!form.is_blackout}
                onCheckedChange={(v) => setForm({ ...form, is_blackout: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <Label htmlFor="create-active" className="mb-0">Active</Label>
              <Switch
                id="create-active"
                checked={!!form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || createMutation.isPending}
              className="bg-[#1E1B4B] hover:bg-[#2A2675]"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ────────────────────────────────────── */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>Update the policy details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-name" className="mb-2 block">Name</Label>
              <Input
                id="edit-name"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="edit-category" className="mb-2 block">Category (optional)</Label>
              <Select
                value={form.category_uuid || 'all'}
                onValueChange={(val) => {
                  setForm({
                    ...form,
                    category_uuid: val === 'all' ? null : val,
                  });
                }}
              >
                <SelectTrigger id="edit-category" className="w-full">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.uuid} value={cat.uuid}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-line" className="mb-2 block">Max per line</Label>
                <Input
                  id="edit-line"
                  type="number"
                  value={numField(form.max_amount_per_line)}
                  onChange={(e) => setForm({ ...form, max_amount_per_line: e.target.value || null })}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="edit-claim" className="mb-2 block">Max per claim</Label>
                <Input
                  id="edit-claim"
                  type="number"
                  value={numField(form.max_amount_per_claim)}
                  onChange={(e) => setForm({ ...form, max_amount_per_claim: e.target.value || null })}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="edit-auto" className="mb-2 block">Auto-approve below</Label>
                <Input
                  id="edit-auto"
                  type="number"
                  value={numField(form.auto_approve_below)}
                  onChange={(e) => setForm({ ...form, auto_approve_below: e.target.value || null })}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="edit-receipt" className="mb-2 block">Receipt required above</Label>
                <Input
                  id="edit-receipt"
                  type="number"
                  value={numField(form.receipt_required_above)}
                  onChange={(e) => setForm({ ...form, receipt_required_above: e.target.value || null })}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <Label htmlFor="edit-blackout" className="mb-0">Blackout (not claimable)</Label>
              <Switch
                id="edit-blackout"
                checked={!!form.is_blackout}
                onCheckedChange={(v) => setForm({ ...form, is_blackout: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <Label htmlFor="edit-active" className="mb-0">Active</Label>
              <Switch
                id="edit-active"
                checked={!!form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || updateMutation.isPending}
              className="bg-[#1E1B4B] hover:bg-[#2A2675]"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Modal ────────────────────────────────────── */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Policy Details</DialogTitle>
            <DialogDescription>Read-only view of the policy.</DialogDescription>
          </DialogHeader>
          {selectedPolicy && (
            <div className="grid gap-3 py-4">
              <div>
                <Label className="text-muted-foreground mb-2 block">Name</Label>
                <p className="font-medium">{selectedPolicy.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Category</Label>
                <p className="font-medium">{getCategoryName(selectedPolicy.uuid)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground mb-2 block">Max per line</Label>
                  <p className="font-medium">{formatCurrency(selectedPolicy.max_amount_per_line)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground mb-2 block">Max per claim</Label>
                  <p className="font-medium">{formatCurrency(selectedPolicy.max_amount_per_claim)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground mb-2 block">Auto-approve below</Label>
                  <p className="font-medium">{formatCurrency(selectedPolicy.auto_approve_below)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground mb-2 block">Receipt required above</Label>
                  <p className="font-medium">{formatCurrency(selectedPolicy.receipt_required_above)}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Blackout</Label>
                <p className="font-medium">{selectedPolicy.is_blackout ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Status</Label>
                <p className="font-medium">{getStatusBadge(selectedPolicy.is_active)}</p>
              </div>
              {selectedPolicy.valid_from && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Valid From</Label>
                  <p className="font-medium">{new Date(selectedPolicy.valid_from).toLocaleDateString()}</p>
                </div>
              )}
              {selectedPolicy.valid_to && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Valid To</Label>
                  <p className="font-medium">{new Date(selectedPolicy.valid_to).toLocaleDateString()}</p>
                </div>
              )}
          
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────── */}
      <AlertDialog open={deleteItem !== null} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteItem?.name} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItem && deleteMutation.mutate(deleteItem.uuid)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}