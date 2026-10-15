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
  Send,
  Ban,
  CheckCircle,
  Plane,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { expenseHubService } from '@/services/expense-hub';
import { useEmployees } from '@/hooks/useEmployees';
import { useCountries } from '@/hooks/useCountries';
import { useCities } from '@/hooks/useCities';
import type { Paginated, TravelRequest, TravelStatus, SettleTravelPayload } from '@/types/expense-hub';
import { cn } from '@/lib/utils';
import { pkr } from '@/lib/expense-hub';

// ── Debounce hook ─────────────────────────────────────
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Status helpers ────────────────────────────────────
const TONE: Record<TravelStatus, string> = {
  draft: 'bg-gray-100 text-gray-600 ring-gray-200',
  submitted: 'bg-amber-50 text-amber-700 ring-amber-200',
  under_review: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-blue-50 text-blue-700 ring-blue-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
  settled: 'bg-green-50 text-green-700 ring-green-200',
};

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'settled', label: 'Settled' },
];

const TRIP_OPTIONS = [
  { value: 'domestic', label: 'Domestic' },
  { value: 'international', label: 'International' },
];

// ── Main Component ────────────────────────────────────
export default function TravelListPage() {
  const queryClient = useQueryClient();

  // ── Query params ────────────────────────────────────
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 400);
  const [statusFilter, setStatusFilter] = useState('');
  const [tripTypeFilter, setTripTypeFilter] = useState('');

  // ── Fetch travel requests ──────────────────────────
  const { data, isLoading, isFetching } = useQuery<Paginated<TravelRequest>>({
    queryKey: ['expense-hub', 'travel', { page, perPage, search: debouncedSearch, status: statusFilter, tripType: tripTypeFilter }],
    queryFn: () =>
      expenseHubService.getTravelRequests({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        trip_type: tripTypeFilter || undefined,
      }).then(res => ({
        items: res.data.data,
        meta: res.data.meta,
      })),
  });

  const items = data?.items ?? [];
  const meta = data?.meta;
  const totalEntries = meta?.total ?? 0;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? 1;

  // ── Fetch employees for dropdown ────────────────────
  const { data: employeesData } = useEmployees({ per_page: 1000, detailed: 0 });
  const employees = employeesData ?? [];

  // ── Fetch countries & cities for destination ────────
  const { data: countriesResponse } = useCountries({ per_page: 500 });
  const countries = countriesResponse?.data ?? [];

  const [selectedCountryName, setSelectedCountryName] = useState('');
  const selectedCountry = countries.find((c: any) => c.name === selectedCountryName);
  const { data: citiesResponse } = useCities(
    selectedCountry ? { country_id: selectedCountry.id, per_page: 500 } : undefined
  );
  const cities = citiesResponse?.data ?? [];

  // ── Modal states ────────────────────────────────────
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [deleteItem, setDeleteItem] = useState<TravelRequest | null>(null);
  const [submitItem, setSubmitItem] = useState<TravelRequest | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // ── Form state (no state field, country + city) ─────
  const [form, setForm] = useState({
    employee_id: undefined as number | undefined,
    trip_type: 'domestic' as 'domestic' | 'international',
    country: '',             // selected country name
    destination_city: '',    // selected city name (from city dropdown)
    purpose: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    estimated_amount: '',
    advance_amount: '',
    itinerary: [] as { date: string; plan: string }[],
  });

  // ── Settle form state ──────────────────────────────
  const [settleForm, setSettleForm] = useState<SettleTravelPayload>({
    settlement_claim_id: '',
    advance_used: 0,
    shortfall_recovered: 0,
    surplus_payable: 0,
  });

  // ── Fetch request details for edit ──────────────────
  const { data: editRequest } = useQuery({
    queryKey: ['expense-hub', 'travel', selectedRequest?.uuid],
    queryFn: () => expenseHubService.getTravelRequest(selectedRequest!.uuid).then(res => res.data.data),
    enabled: !!selectedRequest?.uuid && isEditMode && isFormModalOpen,
  });

  // ── Populate form on edit ────────────────────────────
  useEffect(() => {
    if (editRequest) {
      setForm({
        employee_id: editRequest.employee_id,
        trip_type: editRequest.trip_type,
        country: editRequest.destination_country || '',
        destination_city: editRequest.destination_city || '',
        purpose: editRequest.purpose,
        start_date: editRequest.start_date,
        end_date: editRequest.end_date,
        estimated_amount: editRequest.estimated_amount || '',
        advance_amount: editRequest.advance_amount || '',
        itinerary: Array.isArray(editRequest.itinerary) ? editRequest.itinerary : [],
      });
      setSelectedCountryName(editRequest.destination_country || '');
    }
  }, [editRequest]);

  // ── Reset form ──────────────────────────────────────
  const resetForm = () => {
    setForm({
      employee_id: undefined,
      trip_type: 'domestic',
      country: '',
      destination_city: '',
      purpose: '',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date().toISOString().slice(0, 10),
      estimated_amount: '',
      advance_amount: '',
      itinerary: [],
    });
    setIsEditMode(false);
    setSelectedRequest(null);
    setSelectedCountryName('');
  };

  // ── Mutations ───────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['expense-hub', 'travel'] });

  const submitMutation = useMutation({
    mutationFn: (uuid: string) => expenseHubService.submitTravel(uuid),
    onSuccess: () => {
      toast.success('Travel request submitted.');
      invalidate();
      setIsSubmitDialogOpen(false);
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Could not submit request.' }),
  });

  const cancelMutation = useMutation({
    mutationFn: (uuid: string) => expenseHubService.cancelTravel(uuid),
    onSuccess: () => {
      toast.success('Travel request cancelled.');
      invalidate();
      setIsDeleteDialogOpen(false);
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Could not cancel request.' }),
  });

  const settleMutation = useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: SettleTravelPayload }) =>
      expenseHubService.settleTravel(uuid, payload),
    onSuccess: () => {
      toast.success('Travel request settled.');
      invalidate();
      setIsSettleModalOpen(false);
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Could not settle request.' }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.employee_id) throw new Error('Employee is required.');
      const payload = {
        employee_id: form.employee_id,
        trip_type: form.trip_type,
        destination_country: form.country || undefined,
        destination_city: form.destination_city || undefined,
        purpose: form.purpose,
        start_date: form.start_date,
        end_date: form.end_date,
        estimated_amount: form.estimated_amount ? parseFloat(form.estimated_amount) : undefined,
        advance_amount: form.advance_amount ? parseFloat(form.advance_amount) : undefined,
        itinerary: form.itinerary.length > 0 ? form.itinerary : undefined,
      };

      if (isEditMode && selectedRequest) {
        await expenseHubService.updateTravelRequest(selectedRequest.uuid, payload);
      } else {
        await expenseHubService.createTravelRequest(payload);
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Travel request updated.' : 'Travel request created.');
      invalidate();
      setIsFormModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error?.response?.data?.message || 'Could not save the travel request.' });
    },
  });

  // ── Handlers ────────────────────────────────────────
  const openCreate = () => {
    resetForm();
    setIsEditMode(false);
    setSelectedRequest(null);
    setIsFormModalOpen(true);
  };

  const openEdit = (request: TravelRequest) => {
    setSelectedRequest(request);
    setIsEditMode(true);
    setIsFormModalOpen(true);
  };

  const openView = (request: TravelRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const openSettle = (request: TravelRequest) => {
    setSelectedRequest(request);
    setSettleForm({
      settlement_claim_id: '',
      advance_used: parseFloat(request.advance_amount || '0'),
      shortfall_recovered: 0,
      surplus_payable: 0,
    });
    setIsSettleModalOpen(true);
  };

  const handleSubmitClick = (request: TravelRequest) => {
    setSubmitItem(request);
    setIsSubmitDialogOpen(true);
  };

  const confirmSubmit = () => {
    if (submitItem) submitMutation.mutate(submitItem.uuid);
  };

  const handleCancel = (request: TravelRequest) => {
    setDeleteItem(request);
    setIsDeleteDialogOpen(true);
  };

  const confirmCancel = () => {
    if (deleteItem) cancelMutation.mutate(deleteItem.uuid);
  };

  const handleSave = () => {
    if (!form.employee_id) {
      toast.error('Please select an employee.');
      return;
    }
    if (!form.purpose.trim()) {
      toast.error('Purpose is required.');
      return;
    }
    saveMutation.mutate();
  };

  const handleSettle = () => {
    if (!selectedRequest) return;
    if (!settleForm.settlement_claim_id) {
      toast.error('Settlement claim ID is required.');
      return;
    }
    settleMutation.mutate({ uuid: selectedRequest.uuid, payload: settleForm });
  };

  // ── Itinerary helpers ───────────────────────────────
  const addItineraryItem = () => {
    setForm(prev => ({
      ...prev,
      itinerary: [...prev.itinerary, { date: '', plan: '' }],
    }));
  };

  const removeItineraryItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index),
    }));
  };

  const updateItineraryItem = (index: number, field: 'date' | 'plan', value: string) => {
    setForm(prev => {
      const updated = [...prev.itinerary];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, itinerary: updated };
    });
  };

  // ── Reset page on filter change ─────────────────────
  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, statusFilter, tripTypeFilter]);

  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        {/* ── Header, Filters, Table, Pagination – unchanged ── */}
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Travel Requests</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} requests • Manage travel approvals
              </p>
            </div>
            <Button className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New Request
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by request #, destination, or purpose…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#1E1B4B] focus:ring-[#1E1B4B]"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-sm text-gray-600 whitespace-nowrap">Status</span>
              <Select value={statusFilter || 'all'} onValueChange={(val) => setStatusFilter(val === 'all' ? '' : val)}>
                <SelectTrigger className="w-full md:w-36 border-gray-300">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-sm text-gray-600 whitespace-nowrap">Trip Type</span>
              <Select value={tripTypeFilter || 'all'} onValueChange={(val) => setTripTypeFilter(val === 'all' ? '' : val)}>
                <SelectTrigger className="w-full md:w-36 border-gray-300">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {TRIP_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 ml-auto w-full md:w-auto">
              <span className="text-sm text-gray-600 whitespace-nowrap">Show</span>
              <Select value={perPage.toString()} onValueChange={(value) => { setPerPage(Number(value)); setPage(1); }}>
                <SelectTrigger className="w-20 border-gray-300">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
          </div>

          {/* Stats Bar & Table – exactly as before */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-600">Showing</span>
                <span className="font-semibold mx-1 text-gray-900">{showingFrom.toLocaleString()}</span>
                <span className="text-gray-600">to</span>
                <span className="font-semibold mx-1 text-gray-900">{showingTo.toLocaleString()}</span>
                <span className="text-gray-600">of</span>
                <span className="font-semibold mx-1 text-gray-900">{totalEntries.toLocaleString()}</span>
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

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">SR. NO.</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">REQUEST #</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DESTINATION</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DATES</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">ADVANCE</th>
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
                          Loading requests...
                        </div>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <Plane className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                        No travel requests found. Try adjusting your filters.
                      </td>
                    </tr>
                  ) : (
                    items.map((request, index) => {
                      const sr = (currentPage - 1) * perPage + index + 1;
                      const status = request.status;
                      return (
                        <tr key={request.uuid} className="hover:bg-gray-50 transition-colors group">
                          <td className="py-4 px-6 text-sm text-gray-500">{sr}</td>
                          <td className="py-4 px-6 text-sm font-medium text-[#1E1B4B]">{request.request_number || '—'}</td>
                          <td className="py-4 px-6 text-sm text-gray-700">
                            {request.destination_city || request.destination_country || '—'}
                            <span className="text-xs capitalize text-gray-400 ml-1">· {request.trip_type}</span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-500">{request.start_date} → {request.end_date}</td>
                          <td className="py-4 px-6 text-sm text-right font-mono">{pkr(request.advance_amount)}</td>
                          <td className="py-4 px-6 text-sm">
                            <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', TONE[status])}>
                              {status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openView(request)}>
                                  <Eye className="mr-2 h-3.5 w-3.5" /> View
                                </DropdownMenuItem>
                                {status === 'draft' && (
                                  <>
                                    <DropdownMenuItem onClick={() => openEdit(request)}>
                                      <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSubmitClick(request)}>
                                      <Send className="mr-2 h-3.5 w-3.5" /> Submit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCancel(request)} className="text-red-600">
                                      <Ban className="mr-2 h-3.5 w-3.5" /> Cancel
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(status === 'approved' || status === 'settled') && (
                                  <DropdownMenuItem onClick={() => openSettle(request)}>
                                    <CheckCircle className="mr-2 h-3.5 w-3.5" /> Settle
                                  </DropdownMenuItem>
                                )}
                                {(status === 'under_review' || status === 'submitted') && (
                                  <DropdownMenuItem onClick={() => handleCancel(request)} className="text-red-600">
                                    <Ban className="mr-2 h-3.5 w-3.5" /> Cancel
                                  </DropdownMenuItem>
                                )}
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

            {!isLoading && items.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={currentPage === 1} className="border-gray-300">
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="border-gray-300">
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
                            className={currentPage === pageNum ? 'bg-[#1E1B4B] hover:bg-[#2A2675] border-[#1E1B4B]' : 'border-gray-300 hover:bg-gray-100'}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="border-gray-300">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} className="border-gray-300">
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

      {/* ── View Modal (unchanged) ─────────────────────── */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Travel Request Details</DialogTitle>
            <DialogDescription>Read-only view of the travel request.</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Request #</Label>
                  <p className="font-medium">{selectedRequest.request_number || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', TONE[selectedRequest.status])}>
                      {selectedRequest.status.replace('_', ' ')}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Purpose</Label>
                <p className="font-medium">{selectedRequest.purpose}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Trip Type</Label>
                  <p className="font-medium capitalize">{selectedRequest.trip_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Destination</Label>
                  <p className="font-medium">{selectedRequest.destination_city || selectedRequest.destination_country || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{selectedRequest.start_date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">End Date</Label>
                  <p className="font-medium">{selectedRequest.end_date}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Estimated Amount</Label>
                  <p className="font-medium">{pkr(selectedRequest.estimated_amount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Advance Amount</Label>
                  <p className="font-medium">{pkr(selectedRequest.advance_amount)}</p>
                </div>
              </div>
              {selectedRequest.rejection_reason && (
                <div>
                  <Label className="text-muted-foreground">Rejection Reason</Label>
                  <p className="font-medium text-red-600">{selectedRequest.rejection_reason}</p>
                </div>
              )}
              {selectedRequest.created_at && (
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
            {selectedRequest && selectedRequest.status === 'draft' && (
              <Button
                onClick={() => { setIsViewModalOpen(false); openEdit(selectedRequest); }}
                className="bg-[#1E1B4B] hover:bg-[#2A2675]"
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create/Edit Modal (with country & city only) ── */}
      <Dialog open={isFormModalOpen} onOpenChange={(open) => { if (!open) { resetForm(); setIsFormModalOpen(false); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Travel Request' : 'New Travel Request'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the travel request details.' : 'Create a new travel request.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Employee */}
            <div>
              <Label htmlFor="modal-employee" className="mb-2 block">Employee *</Label>
              <Select
                value={form.employee_id?.toString() || ''}
                onValueChange={(val) => setForm({ ...form, employee_id: parseInt(val) })}
              >
                <SelectTrigger id="modal-employee" className="w-full">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name} ({emp.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trip Type */}
            <div>
              <Label htmlFor="modal-trip_type" className="mb-2 block">Trip Type *</Label>
              <Select
                value={form.trip_type}
                onValueChange={(val) => setForm({ ...form, trip_type: val as 'domestic' | 'international' })}
              >
                <SelectTrigger id="modal-trip_type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domestic">Domestic</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Country / City (no state) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="modal-country" className="mb-2 block">Country</Label>
                <Select
                  value={form.country}
                  onValueChange={(val) => {
                    setForm(prev => ({ ...prev, country: val, destination_city: '' }));
                    setSelectedCountryName(val);
                  }}
                >
                  <SelectTrigger id="modal-country" className="w-full">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c: any) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="modal-city" className="mb-2 block">City</Label>
                <Select
                  value={form.destination_city}
                  onValueChange={(val) => setForm(prev => ({ ...prev, destination_city: val }))}
                  disabled={!form.country}
                >
                  <SelectTrigger id="modal-city" className="w-full">
                    <SelectValue placeholder={form.country ? 'Select city' : 'Choose country first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c: any) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Purpose */}
            <div>
              <Label htmlFor="modal-purpose" className="mb-2 block">Purpose *</Label>
              <Input
                id="modal-purpose"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="e.g. Client meeting"
                className="w-full"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="modal-start_date" className="mb-2 block">Start Date *</Label>
                <Input
                  id="modal-start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="modal-end_date" className="mb-2 block">End Date *</Label>
                <Input
                  id="modal-end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="modal-estimated" className="mb-2 block">Estimated Amount</Label>
                <Input
                  id="modal-estimated"
                  type="number"
                  step="0.01"
                  value={form.estimated_amount}
                  onChange={(e) => setForm({ ...form, estimated_amount: e.target.value })}
                  placeholder="e.g. 50000"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="modal-advance" className="mb-2 block">Advance Requested</Label>
                <Input
                  id="modal-advance"
                  type="number"
                  step="0.01"
                  value={form.advance_amount}
                  onChange={(e) => setForm({ ...form, advance_amount: e.target.value })}
                  placeholder="e.g. 20000"
                  className="w-full"
                />
              </div>
            </div>

            {/* Itinerary Builder (unchanged) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Itinerary</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItineraryItem} className="gap-1 border-gray-300 text-gray-700 hover:bg-gray-100">
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              </div>
              {form.itinerary.length === 0 && (
                <p className="text-sm text-gray-400 italic">No itinerary items added yet.</p>
              )}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {form.itinerary.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="flex-1 grid grid-cols-5 gap-2">
                      <div className="col-span-2">
                        <Label htmlFor={`itin-date-${idx}`} className="sr-only">Date</Label>
                        <Input
                          id={`itin-date-${idx}`}
                          type="date"
                          value={item.date}
                          onChange={(e) => updateItineraryItem(idx, 'date', e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor={`itin-plan-${idx}`} className="sr-only">Plan</Label>
                        <Input
                          id={`itin-plan-${idx}`}
                          value={item.plan}
                          onChange={(e) => updateItineraryItem(idx, 'plan', e.target.value)}
                          placeholder="e.g. Travel to Lahore"
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItineraryItem(idx)} className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsFormModalOpen(false); }}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.employee_id || !form.purpose.trim() || saveMutation.isPending}
              className="bg-[#1E1B4B] hover:bg-[#2A2675] text-white"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isEditMode ? 'Saving...' : 'Creating...'}</>
              ) : (
                isEditMode ? 'Save Changes' : 'Create Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Settle Modal (unchanged) ──────────────────── */}
      <Dialog open={isSettleModalOpen} onOpenChange={setIsSettleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Settle Travel Request</DialogTitle>
            <DialogDescription>Enter settlement details for this trip.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="settle-claim" className="mb-2 block">Settlement Claim ID *</Label>
              <Input id="settle-claim" value={settleForm.settlement_claim_id} onChange={(e) => setSettleForm({ ...settleForm, settlement_claim_id: e.target.value })} placeholder="e.g. CLM-001" className="w-full" />
            </div>
            <div>
              <Label htmlFor="settle-used" className="mb-2 block">Advance Used</Label>
              <Input id="settle-used" type="number" step="0.01" value={settleForm.advance_used} onChange={(e) => setSettleForm({ ...settleForm, advance_used: parseFloat(e.target.value) || 0 })} className="w-full" />
            </div>
            <div>
              <Label htmlFor="settle-shortfall" className="mb-2 block">Shortfall Recovered</Label>
              <Input id="settle-shortfall" type="number" step="0.01" value={settleForm.shortfall_recovered} onChange={(e) => setSettleForm({ ...settleForm, shortfall_recovered: parseFloat(e.target.value) || 0 })} className="w-full" />
            </div>
            <div>
              <Label htmlFor="settle-surplus" className="mb-2 block">Surplus Payable</Label>
              <Input id="settle-surplus" type="number" step="0.01" value={settleForm.surplus_payable} onChange={(e) => setSettleForm({ ...settleForm, surplus_payable: parseFloat(e.target.value) || 0 })} className="w-full" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettleModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSettle} disabled={!settleForm.settlement_claim_id || settleMutation.isPending} className="bg-[#1E1B4B] hover:bg-[#2A2675] text-white">
              {settleMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Settling...</> : 'Settle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Submit Confirmation Modal (new) ──────────── */}
      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Travel Request?</AlertDialogTitle>
            <AlertDialogDescription>
              {submitItem?.request_number} will be submitted for approval. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit} className="bg-[#1E1B4B] hover:bg-[#2A2675]">
              {submitMutation.isPending ? 'Submitting...' : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Cancel Confirmation Modal (unchanged) ────── */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Request?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteItem?.request_number} will be cancelled. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-red-600 hover:bg-red-700">
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}