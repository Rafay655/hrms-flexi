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
import { currencyService } from '@/services/currency.service';
import type { MileageRate, VehicleType, Paginated } from '@/types/expense-hub';
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
type Form = Partial<MileageRate>;
const blank: Form = {
  vehicle_type: 'car',
  label: '',
  rate_per_km: '',
  fuel_card_offset: false,
  is_active: true,
  currency_id: undefined,
};

const VEHICLES: VehicleType[] = ['car', 'motorcycle', 'suv', 'van', 'other'];

// ── Helpers ────────────────────────────────────────────
const getStatusBadge = (isActive: boolean) => {
  return isActive ? (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
  ) : (
    <Badge variant="secondary">Inactive</Badge>
  );
};

const getVehicleLabel = (vehicle: string) => {
  return vehicle.charAt(0).toUpperCase() + vehicle.slice(1);
};

// ── Main Component ────────────────────────────────────
export default function MileageRatesPage() {
  const queryClient = useQueryClient();

  // ── Query params ────────────────────────────────────
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 400);
  const [vehicleFilter, setVehicleFilter] = useState('');

  // ── Fetch currencies ────────────────────────────────
  const { data: currenciesData } = useQuery({
    queryKey: ['currencies', 'all'],
    queryFn: () => currencyService.getAll({ per_page: 200 }),
  });
  const currencies = (currenciesData as any)?.data ?? [];

  // ── Fetch mileage rates ─────────────────────────────
  const { data, isLoading, isFetching, refetch } = useQuery<Paginated<MileageRate>>({
    queryKey: ['expense-hub', 'mileage-rates', { page, perPage, search: debouncedSearch, vehicle: vehicleFilter }],
    queryFn: () =>
      expenseHubService.getMileageRates({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        vehicle_type: vehicleFilter || undefined,
      }),
  });

  const rates = data?.items ?? [];
  const meta = data?.meta;
  const totalEntries = meta?.total ?? 0;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? 1;

  // ── Mutations ───────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['expense-hub', 'mileage-rates'] });

  const createMutation = useMutation({
    mutationFn: (payload: Form) => expenseHubService.createMileageRate(payload),
    onSuccess: () => { toast.success('Rate created.'); invalidate(); resetForm(); },
    onError: (e: any) => showApiError(e, { fallbackMessage: e?.response?.data?.message ?? 'Could not create rate.' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: Form }) =>
      expenseHubService.updateMileageRate(uuid, payload),
    onSuccess: () => { toast.success('Rate updated.'); invalidate(); resetForm(); },
    onError: (e: any) => showApiError(e, { fallbackMessage: e?.response?.data?.message ?? 'Could not update rate.' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => expenseHubService.deleteMileageRate(uuid),
    onSuccess: () => { toast.success('Rate deleted.'); invalidate(); setDeleteItem(null); },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Could not delete rate.' }),
  });

  // ── Modal state ─────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<MileageRate | null>(null);

  const [selectedRate, setSelectedRate] = useState<MileageRate | null>(null);
  const [form, setForm] = useState<Form>({ ...blank });
  const [editUuid, setEditUuid] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ ...blank, currency_id: currencies[0]?.id });
    setEditUuid(null);
    setSelectedRate(null);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
  };

  const openCreate = () => {
    setForm({ ...blank, currency_id: currencies[0]?.id });
    setEditUuid(null);
    setIsCreateModalOpen(true);
  };

  const openEdit = (rate: MileageRate) => {
    setSelectedRate(rate);
    setForm({ ...rate });
    setEditUuid(rate.uuid);
    setIsEditModalOpen(true);
  };

  const openView = (rate: MileageRate) => {
    setSelectedRate(rate);
    setIsViewModalOpen(true);
  };

  const handleSave = () => {
    if (!form.rate_per_km || !form.currency_id) {
      toast.error('Rate per km and currency are required.');
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
  }, [perPage, debouncedSearch, vehicleFilter]);

  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  // Helper to get currency ISO code
  const getCurrencyIso = (id: number) => {
    const found = currencies.find((c: any) => c.id === id);
    return found?.iso_code || '';
  };

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Mileage Rates
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} rates • Per-kilometre reimbursement by vehicle type
              </p>
            </div>
            <Button
              className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
              onClick={openCreate}
              disabled={createMutation.isPending}
            >
              <Plus className="h-4 w-4" /> New Rate
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by label or vehicle type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#1E1B4B] focus:ring-[#1E1B4B]"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-sm text-gray-600 whitespace-nowrap">Vehicle</span>
              <Select
                value={vehicleFilter || 'all'}
                onValueChange={(val) => setVehicleFilter(val === 'all' ? '' : val)}
              >
                <SelectTrigger className="w-full md:w-40 border-gray-300">
                  <SelectValue placeholder="All Vehicles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {VEHICLES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {getVehicleLabel(v)}
                    </SelectItem>
                  ))}
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
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">VEHICLE</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">LABEL</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">RATE / KM</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">FUEL OFFSET</th>
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
                          Loading rates...
                        </div>
                      </td>
                    </tr>
                  ) : rates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        No rates found. Try adjusting your filters.
                      </td>
                    </tr>
                  ) : (
                    rates.map((rate, index) => {
                      const sr = (currentPage - 1) * perPage + index + 1;
                      return (
                        <tr key={rate.uuid} className="hover:bg-gray-50 transition-colors group">
                          <td className="py-4 px-6 text-sm text-gray-500">{sr}</td>
                          <td className="py-4 px-6 text-sm font-medium capitalize text-[#1E1B4B]">
                            {getVehicleLabel(rate.vehicle_type)}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">{rate.label || '—'}</td>
                          <td className="py-4 px-6 text-sm text-right font-mono">
                            {getCurrencyIso(rate.currency_id)} {rate.rate_per_km}
                          </td>
                          <td className="py-4 px-6 text-sm">
                            <Badge variant={rate.fuel_card_offset ? 'default' : 'secondary'}>
                              {rate.fuel_card_offset ? 'Yes' : 'No'}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-sm">{getStatusBadge(rate.is_active)}</td>
                          <td className="py-4 px-6 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openView(rate)}>
                                  <Eye className="mr-2 h-3.5 w-3.5" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEdit(rate)}>
                                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteItem(rate)}
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
            {!isLoading && rates.length > 0 && (
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
            <DialogTitle>Add Mileage Rate</DialogTitle>
            <DialogDescription>Create a new mileage rate.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="create-vehicle" className="mb-2 block">Vehicle Type</Label>
                <Select
                  value={form.vehicle_type || 'car'}
                  onValueChange={(val) => setForm({ ...form, vehicle_type: val as VehicleType })}
                >
                  <SelectTrigger id="create-vehicle" className="w-full">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {getVehicleLabel(v)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create-currency" className="mb-2 block">Currency</Label>
                <Select
                  value={form.currency_id ? String(form.currency_id) : ''}
                  onValueChange={(val) => setForm({ ...form, currency_id: parseInt(val) })}
                >
                  <SelectTrigger id="create-currency" className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.iso_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="create-label" className="mb-2 block">Label (optional)</Label>
              <Input
                id="create-label"
                value={form.label || ''}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Standard Car Rate"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="create-rate" className="mb-2 block">Rate per km</Label>
              <Input
                id="create-rate"
                type="number"
                step="0.01"
                value={form.rate_per_km || ''}
                onChange={(e) => setForm({ ...form, rate_per_km: e.target.value })}
                placeholder="e.g. 15.50"
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <Label htmlFor="create-fuel" className="mb-0">Fuel-card offset</Label>
              <Switch
                id="create-fuel"
                checked={!!form.fuel_card_offset}
                onCheckedChange={(v) => setForm({ ...form, fuel_card_offset: v })}
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
              disabled={!form.rate_per_km || !form.currency_id || createMutation.isPending}
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
            <DialogTitle>Edit Mileage Rate</DialogTitle>
            <DialogDescription>Update the rate details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-vehicle" className="mb-2 block">Vehicle Type</Label>
                <Select
                  value={form.vehicle_type || 'car'}
                  onValueChange={(val) => setForm({ ...form, vehicle_type: val as VehicleType })}
                >
                  <SelectTrigger id="edit-vehicle" className="w-full">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {getVehicleLabel(v)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-currency" className="mb-2 block">Currency</Label>
                <Select
                  value={form.currency_id ? String(form.currency_id) : ''}
                  onValueChange={(val) => setForm({ ...form, currency_id: parseInt(val) })}
                >
                  <SelectTrigger id="edit-currency" className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.iso_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-label" className="mb-2 block">Label (optional)</Label>
              <Input
                id="edit-label"
                value={form.label || ''}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="edit-rate" className="mb-2 block">Rate per km</Label>
              <Input
                id="edit-rate"
                type="number"
                step="0.01"
                value={form.rate_per_km || ''}
                onChange={(e) => setForm({ ...form, rate_per_km: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <Label htmlFor="edit-fuel" className="mb-0">Fuel-card offset</Label>
              <Switch
                id="edit-fuel"
                checked={!!form.fuel_card_offset}
                onCheckedChange={(v) => setForm({ ...form, fuel_card_offset: v })}
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
              disabled={!form.rate_per_km || !form.currency_id || updateMutation.isPending}
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
            <DialogTitle>Rate Details</DialogTitle>
            <DialogDescription>Read-only view of the mileage rate.</DialogDescription>
          </DialogHeader>
          {selectedRate && (
            <div className="grid gap-3 py-4">
              <div>
                <Label className="text-muted-foreground mb-2 block">Vehicle Type</Label>
                <p className="font-medium">{getVehicleLabel(selectedRate.vehicle_type)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Currency</Label>
                <p className="font-medium">{getCurrencyIso(selectedRate.currency_id)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Label</Label>
                <p className="font-medium">{selectedRate.label || '—'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Rate per km</Label>
                <p className="font-medium">{getCurrencyIso(selectedRate.currency_id)} {selectedRate.rate_per_km}</p>
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Fuel-card offset</Label>
                <p className="font-medium">{selectedRate.fuel_card_offset ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Status</Label>
                <p className="font-medium">{getStatusBadge(selectedRate.is_active)}</p>
              </div>
              {selectedRate.valid_from && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Valid From</Label>
                  <p className="font-medium">{new Date(selectedRate.valid_from).toLocaleDateString()}</p>
                </div>
              )}
              {selectedRate.valid_to && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Valid To</Label>
                  <p className="font-medium">{new Date(selectedRate.valid_to).toLocaleDateString()}</p>
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
            <AlertDialogTitle>Delete Rate?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteItem?.label || deleteItem?.vehicle_type} will be permanently removed.
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