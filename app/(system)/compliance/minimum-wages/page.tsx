'use client';

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DownloadIcon,
  SearchIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  PlusIcon,
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// ── Types & Hooks ──────────────────────────────────────
import type { MinimumWage } from '@/types/minimum-wage.types';
import {
  useMinimumWages,
  useCreateMinimumWage,
  useUpdateMinimumWage,
  useDeleteMinimumWage,
} from '@/hooks/useMinWages';
import { useStates } from '@/hooks/useStates';

// ── Static options ────────────────────────────────────
const WAGE_CATEGORIES = [
  { value: 'unskilled', label: 'Unskilled' },
  { value: 'semi_skilled', label: 'Semi-Skilled' },
  { value: 'skilled', label: 'Skilled' },
  { value: 'highly_skilled', label: 'Highly Skilled' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Other' },
];

const WAGE_BASIS = [
  { value: 'gross', label: 'Gross Salary' },
  { value: 'basic', label: 'Basic Salary' },
  { value: 'custom', label: 'Custom' },
];

const PAYROLL_BEHAVIORS = [
  { value: 'warning', label: 'Warning Only' },
  { value: 'block', label: 'Block Payroll' },
  { value: 'require_approval', label: 'Require Approval' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// ── Debounce hook ─────────────────────────────────────
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Main Component ────────────────────────────────────
const MinimumWagesPage: React.FC = () => {
  // ── Query params ────────────────────────────────────
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  // ── Filters ─────────────────────────────────────────
  const [filters, setFilters] = useState({
    state_id: '',
    status: '',
  });

  // ── Fetch states ────────────────────────────────────
  const { data: statesData, isLoading: statesLoading } = useStates({
    country_id: 167,
    per_page: 1000,
  });
  const states = statesData?.data || [];

  // ── Fetch minimum wage configs ──────────────────────
  const { data, isLoading, error, refetch } = useMinimumWages({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    state_id: filters.state_id ? parseInt(filters.state_id) : undefined,
    status: filters.status || undefined,
  });

  const configs = data?.data ?? [];
  const meta = data?.meta;
  const totalEntries = meta?.total ?? 0;
  const totalPages = meta?.last_page ?? 1;

  // ── Mutations ───────────────────────────────────────
  const createConfig = useCreateMinimumWage();
  const updateConfig = useUpdateMinimumWage();
  const deleteConfig = useDeleteMinimumWage();

  // ── Modal state ─────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('create');
  const [selectedConfig, setSelectedConfig] = useState<MinimumWage | null>(null);

  const [formData, setFormData] = useState<Partial<MinimumWage>>({
    state_id: undefined,
    region_city: null,
    wage_category: 'general',
    wage_basis: 'gross',
    minimum_wage_amount: 0,
    payroll_behavior: 'warning',
    effective_from: '',
    effective_to: null,
    source_document_path: null,
    status: 'draft',
  });

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, filters]);

  // ── Helpers ──────────────────────────────────────────
  const getStateName = (id: number) => {
    const state = states.find((s) => s.id === id);
    return state?.name || 'Unknown';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'draft':
        return 'outline';
      case 'inactive':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPayrollBehaviorLabel = (behavior: string) => {
    const found = PAYROLL_BEHAVIORS.find((b) => b.value === behavior);
    return found?.label || behavior;
  };

  // ── Handlers ────────────────────────────────────────
  const handleView = (config: MinimumWage) => {
    setSelectedConfig(config);
    setFormData({ ...config });
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEdit = (config: MinimumWage) => {
    setSelectedConfig(config);
    setFormData({ ...config });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedConfig(null);
    setFormData({
      state_id: undefined,
      region_city: null,
      wage_category: 'general',
      wage_basis: 'gross',
      minimum_wage_amount: 0,
      payroll_behavior: 'warning',
      effective_from: '',
      effective_to: null,
      source_document_path: null,
      status: 'draft',
    });
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleDelete = (uuid: string) => {
    setDeleteId(uuid);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteConfig.mutateAsync(deleteId);
      toast.success('Minimum wage config deleted.');
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to delete.' });
    } finally {
      setDeleteId(null);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.state_id) {
      toast.error('State is required.');
      return;
    }
    if (!formData.minimum_wage_amount || formData.minimum_wage_amount <= 0) {
      toast.error('Minimum wage amount must be greater than 0.');
      return;
    }
    if (!formData.effective_from) {
      toast.error('Effective from date is required.');
      return;
    }
    if (formData.effective_from && formData.effective_to &&
      new Date(formData.effective_to) <= new Date(formData.effective_from)) {
      toast.error('Effective to must be after effective from.');
      return;
    }

    const payload: any = {
      state_id: formData.state_id,
      region_city: formData.region_city || null,
      wage_category: formData.wage_category || 'general',
      wage_basis: formData.wage_basis || 'gross',
      minimum_wage_amount: formData.minimum_wage_amount,
      payroll_behavior: formData.payroll_behavior || 'warning',
      effective_from: formData.effective_from,
      effective_to: formData.effective_to || null,
      source_document_path: formData.source_document_path || null,
      status: formData.status || 'draft',
    };

    try {
      if (modalMode === 'create') {
        await createConfig.mutateAsync(payload);
        toast.success('Minimum wage config created.');
      } else if (modalMode === 'edit' && selectedConfig) {
        await updateConfig.mutateAsync({
          uuid: selectedConfig.id,
          payload,
        });
        toast.success('Minimum wage config updated.');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const messages = Object.values(errors).flat().join(' ');
        showApiError(err, { fallbackMessage: messages });
      } else {
        showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to save config.' });
      }
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // ── Columns ──────────────────────────────────────────
  const columns: ColumnDef<MinimumWage & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: 'sr',
        header: 'SR. NO.',
        cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.sr}</div>,
      },
      {
        accessorKey: 'state_id',
        header: 'STATE',
        cell: ({ row }) => <span>{getStateName(row.original.state_id)}</span>,
      },
      {
        accessorKey: 'region_city',
        header: 'REGION / CITY',
        cell: ({ row }) => <span>{row.original.region_city || '—'}</span>,
      },
      {
        accessorKey: 'wage_category',
        header: 'CATEGORY',
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.wage_category.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'minimum_wage_amount',
        header: 'AMOUNT (PKR)',
        cell: ({ row }) => (
          <span className="font-mono">{row.original.minimum_wage_amount.toLocaleString()}</span>
        ),
      },
      {
        accessorKey: 'payroll_behavior',
        header: 'PAYROLL BEHAVIOR',
        cell: ({ row }) => (
          <Badge variant="secondary" className="capitalize">
            {getPayrollBehaviorLabel(row.original.payroll_behavior)}
          </Badge>
        ),
      },
      {
        accessorKey: 'effective_from',
        header: 'EFFECTIVE FROM',
        cell: ({ row }) => <span>{row.original.effective_from}</span>,
      },
      {
        accessorKey: 'status',
        header: 'STATUS',
        cell: ({ row }) => (
          <Badge variant={getStatusBadgeVariant(row.original.status)} className="capitalize">
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="mx-auto">ACTIONS</div>,
        cell: ({ row }) => {
          const config = row.original;
          return (
            <div className="flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleView(config)}>
                    <Eye className="mr-2 h-4 w-4" /> View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(config)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(config.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [states]
  );

  // ── Table Data ──────────────────────────────────────
  const rowsWithSr = useMemo(() => {
    const start = (page - 1) * perPage;
    return configs.map((config, idx) => ({
      ...config,
      sr: start + idx + 1,
    }));
  }, [configs, page, perPage]);

  const table = useReactTable({
    data: rowsWithSr,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  const showingFrom = totalEntries > 0 ? (page - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(page * perPage, totalEntries) : 0;

  const isLoadingData = isLoading || statesLoading;

  // ── UI ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Failed to load minimum wage configs. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Minimum Wage Configuration
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} configurations • State‑specific minimum wage rules
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
                onClick={handleCreate}
                disabled={createConfig.isPending}
              >
                <PlusIcon className="h-4 w-4" />
                New Config
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-blue-900 hover:bg-blue-50"
              >
                <DownloadIcon className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-xs font-medium">State</label>
              <Select
                value={filters.state_id || 'all'}
                onValueChange={(val) => handleFilterChange('state_id', val === 'all' ? '' : val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.id.toString()}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Status</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(val) => handleFilterChange('status', val === 'all' ? '' : val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search and Per Page */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by state, region, or category..."
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
                <SelectContent className="bg-white">
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
              {isLoadingData && (
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
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronLeft className="h-4 w-4" />
                            ) : null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoadingData ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">Loading configurations...</p>
                      </td>
                    </tr>
                  ) : rowsWithSr.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center">
                        <div className="text-gray-500">
                          <p className="font-medium">No configurations found</p>
                          <p className="text-sm mt-1">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors group">
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
            {!isLoadingData && rowsWithSr.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-900">{page}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="border-gray-300"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="border-gray-300"
                    >
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
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className={
                              page === pageNum
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
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="border-gray-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
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

      {/* ── Modal ──────────────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'create' && 'Add Minimum Wage Config'}
              {modalMode === 'edit' && 'Edit Config'}
              {modalMode === 'view' && 'View Config'}
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'create' && 'Define minimum wage rules for a state or region.'}
              {modalMode === 'edit' && 'Update the minimum wage configuration.'}
              {modalMode === 'view' && 'Configuration details (read-only).'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* State */}
            <div>
              <label className="block text-sm font-medium mb-1">State *</label>
              {modalMode === 'view' ? (
                <Input
                  value={getStateName(formData.state_id || 0)}
                  disabled
                  className="bg-gray-50 capitalize"
                />
              ) : (
                <Select
                  value={formData.state_id?.toString() || ''}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, state_id: parseInt(val) }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {states.map((state) => (
                      <SelectItem key={state.id} value={state.id.toString()}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Region / City */}
            <div>
              <label className="block text-sm font-medium mb-1">Region / City</label>
              <Input
                value={formData.region_city || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, region_city: e.target.value || null }))
                }
                disabled={modalMode === 'view'}
                placeholder="Optional"
              />
            </div>

            {/* Wage Category */}
            <div>
              <label className="block text-sm font-medium mb-1">Wage Category</label>
              {modalMode === 'view' ? (
                <Input
                  value={formData.wage_category?.replace('_', ' ') || '—'}
                  disabled
                  className="bg-gray-50 capitalize"
                />
              ) : (
                <Select
                  value={formData.wage_category || 'general'}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, wage_category: val as any }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {WAGE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Wage Basis */}
            <div>
              <label className="block text-sm font-medium mb-1">Wage Basis</label>
              {modalMode === 'view' ? (
                <Input
                  value={formData.wage_basis || '—'}
                  disabled
                  className="bg-gray-50 capitalize"
                />
              ) : (
                <Select
                  value={formData.wage_basis || 'gross'}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, wage_basis: val as any }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select basis" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {WAGE_BASIS.map((basis) => (
                      <SelectItem key={basis.value} value={basis.value}>
                        {basis.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Minimum Wage Amount */}
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Wage Amount (PKR) *</label>
              <Input
                type="number"
                value={formData.minimum_wage_amount ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minimum_wage_amount: parseFloat(e.target.value) || 0,
                  }))
                }
                disabled={modalMode === 'view'}
              />
            </div>

            {/* Payroll Behavior */}
            <div>
              <label className="block text-sm font-medium mb-1">Payroll Behavior</label>
              {modalMode === 'view' ? (
                <Input
                  value={getPayrollBehaviorLabel(formData.payroll_behavior || 'warning')}
                  disabled
                  className="bg-gray-50 capitalize"
                />
              ) : (
                <Select
                  value={formData.payroll_behavior || 'warning'}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, payroll_behavior: val as any }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select behavior" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {PAYROLL_BEHAVIORS.map((behavior) => (
                      <SelectItem key={behavior.value} value={behavior.value}>
                        {behavior.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Effective From */}
            <div>
              <label className="block text-sm font-medium mb-1">Effective From *</label>
              <Input
                type="date"
                value={formData.effective_from || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, effective_from: e.target.value }))
                }
                disabled={modalMode === 'view'}
              />
            </div>

            {/* Effective To */}
            <div>
              <label className="block text-sm font-medium mb-1">Effective To</label>
              <Input
                type="date"
                value={formData.effective_to || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, effective_to: e.target.value || null }))
                }
                disabled={modalMode === 'view'}
                placeholder="Optional"
              />
            </div>

            {/* Source Document Path */}
            <div>
              <label className="block text-sm font-medium mb-1">Source Document</label>
              <Input
                value={formData.source_document_path || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, source_document_path: e.target.value || null }))
                }
                disabled={modalMode === 'view'}
                placeholder="URL or reference"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              {modalMode === 'view' ? (
                <Input
                  value={formData.status || 'draft'}
                  disabled
                  className="bg-gray-50 capitalize"
                />
              ) : (
                <Select
                  value={formData.status || 'draft'}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, status: val as any }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            {modalMode !== 'view' && (
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createConfig.isPending || updateConfig.isPending}
                >
                  {createConfig.isPending || updateConfig.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </>
            )}
            {modalMode === 'view' && (
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────────── */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the minimum wage configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteConfig.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteConfig.isPending}
            >
              {deleteConfig.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MinimumWagesPage;