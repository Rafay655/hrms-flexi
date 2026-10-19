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
import { Textarea } from '@/components/ui/textarea';
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
import type { AmsVendor, PageMeta } from '@/types/ams.types';

// ── Response type for vendors endpoint ─────────────────
interface VendorsResponse {
  data: AmsVendor[];
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
type Form = Partial<AmsVendor>;
const blank: Form = {
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  ntn_number: '',
  vendor_type: '',
  is_active: true,
};

// ── Helpers ────────────────────────────────────────────
const getStatusBadge = (isActive: boolean) => {
  if (isActive) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
  }
  return <Badge variant="secondary">Inactive</Badge>;
};

// ── Main Component ────────────────────────────────────
export default function AmsVendorsPage() {
  const queryClient = useQueryClient();

  // ── Query params ────────────────────────────────────
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 400);

  // ── Fetch data ──────────────────────────────────────
  const { data, isLoading, isFetching } = useQuery<VendorsResponse>({
    queryKey: ['ams', 'vendors', { page, perPage, search: debouncedSearch }],
    queryFn: async () => {
      const response = await amsService.getVendors({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
      });
      return response as VendorsResponse;
    },
  });

  const vendors = data?.data ?? [];
  const meta = data?.meta;
  const totalEntries = meta?.total ?? 0;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? 1;

  // ── Mutations ───────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ams', 'vendors'] });

  const createMutation = useMutation({
    mutationFn: (payload: Form) => amsService.createVendor(payload),
    onSuccess: () => { toast.success('Vendor created.'); invalidate(); resetForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not create vendor.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: Form }) =>
      amsService.updateVendor(uuid, payload),
    onSuccess: () => { toast.success('Vendor updated.'); invalidate(); resetForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not update vendor.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => amsService.deleteVendor(uuid),
    onSuccess: () => { toast.success('Vendor deleted.'); invalidate(); setDeleteItem(null); },
    onError: () => toast.error('Could not delete vendor.'),
  });

  // ── Modal state ─────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<AmsVendor | null>(null);

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

  const openEdit = (vendor: AmsVendor) => {
    setForm({ ...vendor });
    setEditUuid(vendor.uuid);
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name) {
      toast.error('Name is required.');
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
  }, [perPage, debouncedSearch]);

  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Vendors
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} vendors • Asset suppliers and service providers
              </p>
            </div>
            <Button
              className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
              onClick={openCreate}
              disabled={createMutation.isPending}
            >
              <Plus className="h-4 w-4" /> New Vendor
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, contact person or NTN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#1E1B4B] focus:ring-[#1E1B4B]"
              />
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
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NAME</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">CONTACT PERSON</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">PHONE</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">EMAIL</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">TYPE</th>
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
                          Loading vendors...
                        </div>
                      </td>
                    </tr>
                  ) : vendors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        No vendors found. Try adjusting your filters.
                      </td>
                    </tr>
                  ) : (
                    vendors.map((vendor, index) => {
                      const sr = (currentPage - 1) * perPage + index + 1;
                      return (
                        <tr key={vendor.uuid} className="hover:bg-gray-50 transition-colors group">
                          <td className="py-4 px-6 text-sm text-gray-500">{sr}</td>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900">
                            {vendor.name}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">
                            {vendor.contact_person || '—'}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">
                            {vendor.phone || '—'}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">
                            {vendor.email || '—'}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">
                            {vendor.vendor_type || '—'}
                          </td>
                          <td className="py-4 px-6 text-sm">{getStatusBadge(vendor.is_active)}</td>
                          <td className="py-4 px-6 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(vendor)}>
                                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteItem(vendor)}
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
            {!isLoading && vendors.length > 0 && (
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
            <DialogTitle>Add Vendor</DialogTitle>
            <DialogDescription>Create a new asset vendor.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="create-name" className="mb-2">Name</Label>
                <Input
                  id="create-name"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Dell Pakistan"
                />
              </div>
              <div>
                <Label htmlFor="create-contact-person" className="mb-2">Contact Person</Label>
                <Input
                  id="create-contact-person"
                  value={form.contact_person || ''}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="create-phone" className="mb-2">Phone</Label>
                <Input
                  id="create-phone"
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="create-email" className="mb-2">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="create-address" className="mb-2">Address</Label>
              <Textarea
                id="create-address"
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="create-ntn" className="mb-2">NTN Number</Label>
                <Input
                  id="create-ntn"
                  value={form.ntn_number || ''}
                  onChange={(e) => setForm({ ...form, ntn_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="create-vendor-type" className="mb-2">Vendor Type</Label>
                <Input
                  id="create-vendor-type"
                  value={form.vendor_type || ''}
                  onChange={(e) => setForm({ ...form, vendor_type: e.target.value })}
                  placeholder="e.g. Hardware"
                />
              </div>
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
            <DialogTitle>Edit Vendor</DialogTitle>
            <DialogDescription>Update the vendor details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-name" className="mb-2">Name</Label>
                <Input
                  id="edit-name"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-contact-person" className="mb-2">Contact Person</Label>
                <Input
                  id="edit-contact-person"
                  value={form.contact_person || ''}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-phone" className="mb-2">Phone</Label>
                <Input
                  id="edit-phone"
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email" className="mb-2">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-address" className="mb-2">Address</Label>
              <Textarea
                id="edit-address"
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-ntn" className="mb-2">NTN Number</Label>
                <Input
                  id="edit-ntn"
                  value={form.ntn_number || ''}
                  onChange={(e) => setForm({ ...form, ntn_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-vendor-type" className="mb-2">Vendor Type</Label>
                <Input
                  id="edit-vendor-type"
                  value={form.vendor_type || ''}
                  onChange={(e) => setForm({ ...form, vendor_type: e.target.value })}
                />
              </div>
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
              disabled={!form.name || updateMutation.isPending}
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
            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteItem?.name} will be permanently removed. Assets already linked to this vendor keep their historical reference.
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
