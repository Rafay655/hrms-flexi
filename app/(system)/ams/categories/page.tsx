'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
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
import { amsService } from '@/services/ams.service';
import type { AmsCategory, PageMeta } from '@/types/ams.types';

// ── Response type for categories endpoint ─────────────
interface CategoriesResponse {
  data: AmsCategory[];
  meta: PageMeta;
}

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
type Form = Partial<AmsCategory>;
const blank: Form = {
  code: '',
  name: '',
  depreciation_method: 'straight_line',
  useful_life_years: 3,
  residual_value_pct: 10,
  requires_serial: true,
  is_active: true,
};

const DEPRECIATION_LABELS: Record<string, string> = {
  straight_line: 'Straight Line',
  wdv: 'Written Down Value',
  none: 'None',
};

// ── Helpers ────────────────────────────────────────────
const getStatusBadge = (isActive: boolean) => {
  if (isActive) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
  }
  return <Badge variant="secondary">Inactive</Badge>;
};

// ── Main Component ────────────────────────────────────
export default function AmsCategoriesPage() {
  const queryClient = useQueryClient();

  // ── Query params ────────────────────────────────────
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 400);
  const [statusFilter, setStatusFilter] = useState('');

  // ── Fetch data ──────────────────────────────────────
  const { data, isLoading, isFetching } = useQuery<CategoriesResponse>({
    queryKey: ['ams', 'categories', { page, perPage, search: debouncedSearch, status: statusFilter }],
    queryFn: async () => {
      const response = await amsService.getCategories({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        active_only: statusFilter === 'active' ? true : undefined,
      });
      return response as CategoriesResponse;
    },
  });

  const categories = data?.data ?? [];
  const meta = data?.meta;
  const totalEntries = meta?.total ?? 0;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? 1;

  // ── Mutations ───────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ams', 'categories'] });

  const createMutation = useMutation({
    mutationFn: (payload: Form) => amsService.createCategory(payload),
    onSuccess: () => { toast.success('Category created.'); invalidate(); resetForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not create category.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: Form }) =>
      amsService.updateCategory(uuid, payload),
    onSuccess: () => { toast.success('Category updated.'); invalidate(); resetForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not update category.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => amsService.deleteCategory(uuid),
    onSuccess: () => { toast.success('Category deleted.'); invalidate(); setDeleteItem(null); },
    onError: () => toast.error('Could not delete category.'),
  });

  // ── Modal state ─────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<AmsCategory | null>(null);

  const [form, setForm] = useState<Form>({ ...blank });
  const [editUuid, setEditUuid] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ ...blank });
    setEditUuid(null);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  const openCreate = () => {
    setForm({ ...blank });
    setEditUuid(null);
    setIsCreateModalOpen(true);
  };

  const openEdit = (category: AmsCategory) => {
    setForm({ ...category });
    setEditUuid(category.uuid);
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    if (!form.code || !form.name) {
      toast.error('Code and name are required.');
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
                Asset Categories
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} categories • Depreciation rules and asset classification
              </p>
            </div>
            <Button
              className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
              onClick={openCreate}
              disabled={createMutation.isPending}
            >
              <Plus className="h-4 w-4" /> New Category
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#1E1B4B] focus:ring-[#1E1B4B]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status</span>
              <Select value={statusFilter || 'all'} onValueChange={(val) => setStatusFilter(val === 'all' ? '' : val)}>
                <SelectTrigger className="w-36 border-gray-300">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">Show</span>
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
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">CODE</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NAME</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DEPRECIATION</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">USEFUL LIFE</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">REQUIRES SERIAL</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">STATUS</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <div className="h-5 w-5 border-2 border-[#1E1B4B] border-t-transparent rounded-full animate-spin" />
                          Loading categories...
                        </div>
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        No categories found. Try adjusting your filters.
                      </td>
                    </tr>
                  ) : (
                    categories.map((category, index) => {
                      const sr = (currentPage - 1) * perPage + index + 1;
                      return (
                        <tr key={category.uuid} className="hover:bg-gray-50 transition-colors group">
                          <td className="py-4 px-6 text-sm text-gray-500">{sr}</td>
                          <td className="py-4 px-6 text-sm font-mono font-medium text-[#1E1B4B]">
                            {category.code}
                          </td>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900">
                            {category.name}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">
                            {DEPRECIATION_LABELS[category.depreciation_method] ?? category.depreciation_method}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">
                            {category.useful_life_years} yrs
                          </td>
                          <td className="py-4 px-6 text-sm">
                            <Badge variant={category.requires_serial ? 'default' : 'secondary'}>
                              {category.requires_serial ? 'Required' : 'Optional'}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-sm">{getStatusBadge(category.is_active)}</td>
                          <td className="py-4 px-6 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(category)}>
                                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteItem(category)}
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
            {!isLoading && categories.length > 0 && (
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
            <DialogTitle>Add Asset Category</DialogTitle>
            <DialogDescription>Create a new asset category.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="create-code" className="mb-2">Code</Label>
                <Input
                  id="create-code"
                  value={form.code || ''}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. LAPTOP"
                />
              </div>
              <div>
                <Label htmlFor="create-name" className="mb-2">Name</Label>
                <Input
                  id="create-name"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Laptops"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="create-icon" className="mb-2">Icon</Label>
              <Input
                id="create-icon"
                value={form.icon || ''}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="e.g. laptop"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="create-depreciation" className="mb-2">Depreciation Method</Label>
                <Select
                  value={form.depreciation_method || 'straight_line'}
                  onValueChange={(v) => setForm({ ...form, depreciation_method: v as Form['depreciation_method'] })}
                >
                  <SelectTrigger id="create-depreciation" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="straight_line">Straight Line</SelectItem>
                    <SelectItem value="wdv">Written Down Value</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create-useful-life" className="mb-2">Useful Life (Years)</Label>
                <Input
                  id="create-useful-life"
                  type="number"
                  min={1}
                  max={50}
                  value={form.useful_life_years ?? ''}
                  onChange={(e) => setForm({ ...form, useful_life_years: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="create-residual" className="mb-2">Residual Value (%)</Label>
                <Input
                  id="create-residual"
                  type="number"
                  min={0}
                  max={100}
                  value={form.residual_value_pct ?? ''}
                  onChange={(e) => setForm({ ...form, residual_value_pct: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <Label htmlFor="create-requires-serial">Requires Serial Number</Label>
              <Switch
                id="create-requires-serial"
                checked={!!form.requires_serial}
                onCheckedChange={(v) => setForm({ ...form, requires_serial: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <Label htmlFor="create-active">Active</Label>
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
              disabled={!form.code || !form.name || createMutation.isPending}
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
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-code" className="mb-2">Code</Label>
                <Input
                  id="edit-code"
                  value={form.code || ''}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-name" className="mb-2">Name</Label>
                <Input
                  id="edit-name"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-icon" className="mb-2">Icon</Label>
              <Input
                id="edit-icon"
                value={form.icon || ''}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="edit-depreciation" className="mb-2">Depreciation Method</Label>
                <Select
                  value={form.depreciation_method || 'straight_line'}
                  onValueChange={(v) => setForm({ ...form, depreciation_method: v as Form['depreciation_method'] })}
                >
                  <SelectTrigger id="edit-depreciation" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="straight_line">Straight Line</SelectItem>
                    <SelectItem value="wdv">Written Down Value</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-useful-life" className="mb-2">Useful Life (Years)</Label>
                <Input
                  id="edit-useful-life"
                  type="number"
                  min={1}
                  max={50}
                  value={form.useful_life_years ?? ''}
                  onChange={(e) => setForm({ ...form, useful_life_years: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="edit-residual" className="mb-2">Residual Value (%)</Label>
                <Input
                  id="edit-residual"
                  type="number"
                  min={0}
                  max={100}
                  value={form.residual_value_pct ?? ''}
                  onChange={(e) => setForm({ ...form, residual_value_pct: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <Label htmlFor="edit-requires-serial">Requires Serial Number</Label>
              <Switch
                id="edit-requires-serial"
                checked={!!form.requires_serial}
                onCheckedChange={(v) => setForm({ ...form, requires_serial: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <Label htmlFor="edit-active">Active</Label>
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
              disabled={!form.code || !form.name || updateMutation.isPending}
              className="bg-[#1E1B4B] hover:bg-[#2A2675]"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────── */}
      <AlertDialog open={deleteItem !== null} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteItem?.name} will be permanently removed. Existing assets keep their category reference.
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
