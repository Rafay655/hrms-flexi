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

// ── Types & Hooks ──────────────────────────────────────
import type { SsConfig } from '@/types/ss-config.types';
import {
  useSsConfigs,
  useCreateSsConfig,
  useUpdateSsConfig,
  useDeleteSsConfig,
} from '@/hooks/useSsConfigs';
import { useStates } from '@/hooks/useStates';
import { useTaxYears } from '@/hooks/useTaxYears';

// ── Static options ────────────────────────────────────
const SCHEMES = [
  { value: 'PESSI', label: 'PESSI (Punjab)' },
  { value: 'SESSI', label: 'SESSI (Sindh)' },
  { value: 'KP-ESSI', label: 'KP-ESSI (Khyber Pakhtunkhwa)' },
  { value: 'B-ESSI', label: 'B-ESSI (Balochistan)' },
  { value: 'ICT', label: 'ICT / Federal' },
  { value: 'Other', label: 'Other' },
];

const WAGE_CEILING_TYPES = [
  { value: 'fixed_amount', label: 'Fixed Amount' },
  { value: 'minimum_wage_linked', label: 'Linked to Minimum Wage' },
  { value: 'no_ceiling', label: 'No Ceiling' },
];

const WAGE_BASIS = [
  { value: 'gross_salary', label: 'Gross Salary' },
  { value: 'basic_salary', label: 'Basic Salary' },
  { value: 'minimum_wage', label: 'Minimum Wage' },
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
const SocialSecurityConfigPage: React.FC = () => {
  // ── Query params ────────────────────────────────────
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  // ── Fetch states (Pakistan, country_id = 167) ──────
  const { data: statesData, isLoading: statesLoading } = useStates({
    country_id: 167,
    per_page: 1000,
  });
  const states = statesData?.data || [];

  // ── Fetch tax years ──────────────────────────────────
  const { data: taxYears, isLoading: taxYearsLoading } = useTaxYears();

  // ── Fetch SS configs ────────────────────────────────
  const { data, isLoading, error, refetch } = useSsConfigs({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const configs = data?.data ?? [];
  const meta = data?.meta;
  const totalEntries = meta?.total ?? 0;
  const totalPages = meta?.last_page ?? 1;

  // ── Mutations ───────────────────────────────────────
  const createConfig = useCreateSsConfig();
  const updateConfig = useUpdateSsConfig();
  const deleteConfig = useDeleteSsConfig();

  // ── Modal state ─────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('create');
  const [selectedConfig, setSelectedConfig] = useState<SsConfig | null>(null);

  const [formData, setFormData] = useState<Partial<SsConfig>>({
    tax_year_id: '',
    state_id: undefined,
    scheme: '',
    employer_registration_no: '',
    registration_office: null,
    wage_ceiling_type: 'fixed_amount',
    wage_ceiling_amount: 25000,
    wage_basis: 'gross_salary',
    employer_contribution_rate: 5.0,
    employee_contribution_rate: 0,
    effective_from: '',
    effective_to: null,
    source_document: null,
    status: 'draft',
  });

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch]);

  // ── Helpers ──────────────────────────────────────────
  const getStateName = (stateId: number | null) => {
    if (!stateId) return '—';
    const state = states.find((s) => s.id === stateId);
    return state?.name || 'Unknown';
  };

  const getTaxYearLabel = (id: string) => {
    const year = taxYears?.find((t) => t.id === id);
    return year?.label || '—';
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

  // ── Handlers ────────────────────────────────────────
  const handleView = (config: SsConfig) => {
    setSelectedConfig(config);
    setFormData({ ...config });
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEdit = (config: SsConfig) => {
    setSelectedConfig(config);
    setFormData({ ...config });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedConfig(null);
    setFormData({
      tax_year_id: '',
      state_id: undefined,
      scheme: '',
      employer_registration_no: '',
      registration_office: null,
      wage_ceiling_type: 'fixed_amount',
      wage_ceiling_amount: 25000,
      wage_basis: 'gross_salary',
      employer_contribution_rate: 5.0,
      employee_contribution_rate: 0,
      effective_from: '',
      effective_to: null,
      source_document: null,
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
      toast.success('Social security config deleted.');
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to delete.' });
    } finally {
      setDeleteId(null);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.tax_year_id) {
      toast.error('Tax year is required.');
      return;
    }
    if (!formData.state_id) {
      toast.error('State is required.');
      return;
    }
    if (!formData.scheme) {
      toast.error('Scheme is required.');
      return;
    }
    if (!formData.employer_registration_no) {
      toast.error('Employer registration number is required.');
      return;
    }
    if (!formData.effective_from) {
      toast.error('Effective from date is required.');
      return;
    }
    if (formData.employer_contribution_rate! < 0 || formData.employer_contribution_rate! > 100) {
      toast.error('Employer rate must be between 0 and 100.');
      return;
    }
    if (formData.employee_contribution_rate! < 0 || formData.employee_contribution_rate! > 100) {
      toast.error('Employee rate must be between 0 and 100.');
      return;
    }
    if (formData.wage_ceiling_amount! <= 0) {
      toast.error('Wage ceiling amount must be greater than 0.');
      return;
    }

    const payload: any = {
      tax_year_id: formData.tax_year_id,
      state_id: formData.state_id,
      scheme: formData.scheme,
      employer_registration_no: formData.employer_registration_no,
      registration_office: formData.registration_office || null,
      wage_ceiling_type: formData.wage_ceiling_type || 'fixed_amount',
      wage_ceiling_amount: formData.wage_ceiling_amount!,
      wage_basis: formData.wage_basis || 'gross_salary',
      employer_contribution_rate: formData.employer_contribution_rate!,
      employee_contribution_rate: formData.employee_contribution_rate || 0,
      effective_from: formData.effective_from,
      effective_to: formData.effective_to || null,
      source_document: formData.source_document || null,
      status: formData.status || 'draft',
    };

    try {
      if (modalMode === 'create') {
        await createConfig.mutateAsync(payload);
        toast.success('Social security config created.');
      } else if (modalMode === 'edit' && selectedConfig) {
        await updateConfig.mutateAsync({
          uuid: selectedConfig.id,
          payload,
        });
        toast.success('Social security config updated.');
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

  // ── Columns ──────────────────────────────────────────
  const columns: ColumnDef<SsConfig & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: 'sr',
        header: 'SR. NO.',
        cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.sr}</div>,
      },
      {
        accessorKey: 'tax_year_label',
        header: 'TAX YEAR',
        cell: ({ row }) => <div>{row.original.tax_year_label || '—'}</div>,
      },
      {
        accessorKey: 'state_id',
        header: 'STATE',
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {getStateName(row.original.state_id)}
          </Badge>
        ),
      },
      {
        accessorKey: 'scheme',
        header: 'SCHEME',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.scheme}</Badge>
        ),
      },
      {
        accessorKey: 'employer_registration_no',
        header: 'REGISTRATION NO',
        cell: ({ row }) => <div className="font-mono">{row.original.employer_registration_no}</div>,
      },
      {
        accessorKey: 'employer_contribution_rate',
        header: 'EMPLOYER RATE',
        cell: ({ row }) => <div className="font-mono">{row.original.employer_contribution_rate}%</div>,
      },
      {
        accessorKey: 'employee_contribution_rate',
        header: 'EMPLOYEE RATE',
        cell: ({ row }) => <div className="font-mono">{row.original.employee_contribution_rate}%</div>,
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
    [states, taxYears]
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

  const isLoadingData = isLoading || statesLoading || taxYearsLoading;

  // ── UI ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Failed to load social security configs. Please try again.</div>
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
                Social Security Configuration
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} configurations • State‑specific
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
          {/* Search and Per Page */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by tax year, state, or scheme..."
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

          {/* Table – only loading on tbody */}
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
                          <p className="text-sm mt-1">Try adjusting your search criteria</p>
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
              {modalMode === 'create' && 'Add Social Security Config'}
              {modalMode === 'edit' && 'Edit Config'}
              {modalMode === 'view' && 'View Config'}
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'create' && 'Fill in the details for a new social security configuration.'}
              {modalMode === 'edit' && 'Update the configuration parameters.'}
              {modalMode === 'view' && 'Configuration details (read-only).'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Tax Year */}
            <div>
              <label className="block text-sm font-medium mb-1">Tax Year *</label>
              {modalMode === 'view' ? (
                <Input
                  value={getTaxYearLabel(formData.tax_year_id || '')}
                  disabled
                  className="bg-gray-50"
                />
              ) : (
                <Select
                  value={formData.tax_year_id || ''}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, tax_year_id: val }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select tax year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {taxYears?.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.label} ({year.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium mb-1">State *</label>
              {modalMode === 'view' ? (
                <Input
                  value={getStateName(formData.state_id ?? null)}
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

            {/* Scheme */}
            <div>
              <label className="block text-sm font-medium mb-1">Scheme *</label>
              {modalMode === 'view' ? (
                <Input
                  value={formData.scheme || '—'}
                  disabled
                  className="bg-gray-50"
                />
              ) : (
                <Select
                  value={formData.scheme || ''}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, scheme: val }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select scheme" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {SCHEMES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Employer Registration No */}
            <div>
              <label className="block text-sm font-medium mb-1">Employer Registration No *</label>
              <Input
                value={formData.employer_registration_no || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, employer_registration_no: e.target.value }))
                }
                disabled={modalMode === 'view'}
                placeholder="Required"
              />
            </div>

            {/* Registration Office */}
            <div>
              <label className="block text-sm font-medium mb-1">Registration Office</label>
              <Input
                value={formData.registration_office || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, registration_office: e.target.value || null }))
                }
                disabled={modalMode === 'view'}
                placeholder="Optional"
              />
            </div>

            {/* Wage Ceiling Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Wage Ceiling Type</label>
              {modalMode === 'view' ? (
                <Input
                  value={formData.wage_ceiling_type?.replace('_', ' ') || '—'}
                  disabled
                  className="bg-gray-50 capitalize"
                />
              ) : (
                <Select
                  value={formData.wage_ceiling_type || 'fixed_amount'}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, wage_ceiling_type: val as any }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {WAGE_CEILING_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Wage Ceiling Amount */}
            <div>
              <label className="block text-sm font-medium mb-1">Wage Ceiling Amount *</label>
              <Input
                type="number"
                value={formData.wage_ceiling_amount ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    wage_ceiling_amount: parseFloat(e.target.value) || 0,
                  }))
                }
                disabled={modalMode === 'view'}
              />
            </div>

            {/* Wage Basis */}
            <div>
              <label className="block text-sm font-medium mb-1">Wage Basis</label>
              {modalMode === 'view' ? (
                <Input
                  value={formData.wage_basis?.replace('_', ' ') || '—'}
                  disabled
                  className="bg-gray-50 capitalize"
                />
              ) : (
                <Select
                  value={formData.wage_basis || 'gross_salary'}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, wage_basis: val as any }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select wage basis" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {WAGE_BASIS.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Employer Rate */}
            <div>
              <label className="block text-sm font-medium mb-1">Employer Rate (%) *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.employer_contribution_rate ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employer_contribution_rate: parseFloat(e.target.value) || 0,
                  }))
                }
                disabled={modalMode === 'view'}
              />
            </div>

            {/* Employee Rate */}
            <div>
              <label className="block text-sm font-medium mb-1">Employee Rate (%)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.employee_contribution_rate ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employee_contribution_rate: parseFloat(e.target.value) || 0,
                  }))
                }
                disabled={modalMode === 'view'}
                placeholder="Usually 0"
              />
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

            {/* Source Document */}
            <div>
              <label className="block text-sm font-medium mb-1">Source Document</label>
              <Input
                value={formData.source_document || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, source_document: e.target.value || null }))
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
              This action cannot be undone. This will permanently delete the social security configuration.
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

export default SocialSecurityConfigPage;