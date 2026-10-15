'use client';

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Check,
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
import type { PFPolicy } from '@/types/provident-fund.types';
import {
  usePFPolicies,
  useCreatePFPolicy,
  useUpdatePFPolicy,
  useDeletePFPolicy,
} from '@/hooks/useProvidentFund';
import { useStates } from '@/hooks/useStates';
import { useEmployeeTypes } from '@/hooks/useEmployeeTypes';
import { useDepartments } from '@/hooks/useDepartments';
import { useGradeBands } from '@/hooks/useGradeBands';

// ── Static options ────────────────────────────────────
const SALARY_BASIS = [
  { value: 'gross_salary', label: 'Gross Salary' },
  { value: 'basic_salary', label: 'Basic Salary' },
];

const CONTRIBUTION_TYPES = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
  { value: 'none', label: 'None' },
];

const MATCHING_RULES = [
  { value: 'no_matching', label: 'No Matching' },
  { value: 'match_employee_contribution', label: 'Match Employee Contribution' },
  { value: 'match_up_to_cap', label: 'Match Up to Cap' },
  { value: 'custom', label: 'Custom' },
];

const TAX_TREATMENTS = [
  { value: 'exempt', label: 'Exempt' },
  { value: 'taxable', label: 'Taxable' },
  { value: 'partially_exempt', label: 'Partially Exempt' },
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

// ── Multi-Select Component ────────────────────────────
interface MultiSelectProps {
  label: string;
  options: Array<{ id: string | number; name: string }>;
  selected: (string | number)[];
  onChange: (selected: (string | number)[]) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
}

function MultiSelect({
  options,
  selected,
  onChange,
  disabled = false,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleItem = (id: string | number) => {
    const newSelected = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(newSelected);
  };

  const selectedLabels = selected
    .map((id) => options.find((o) => o.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <span className="truncate">{selectedLabels || placeholder}</span>
          <ChevronLeft className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-[-90deg]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandEmpty>No items found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.id}
                value={option.name}
                onSelect={() => toggleItem(option.id)}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selected.includes(option.id) ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {option.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Main Component ────────────────────────────────────
const PFPoliciesPage: React.FC = () => {
  // ── Query params ────────────────────────────────────
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  // ── Fetch lookup data ──────────────────────────────
  const { data: statesData, isLoading: statesLoading } = useStates({
    country_id: 167,
    per_page: 1000,
  });
  const states = statesData?.data || [];

  const { data: employeeTypesData } = useEmployeeTypes({ per_page: 1000 });
  const employeeTypes = employeeTypesData?.data || [];

  const { data: departmentsData } = useDepartments({ per_page: 1000 });
  const departments = departmentsData?.data || [];

  const { data: gradeBandsData } = useGradeBands({ per_page: 1000 });
  const gradeBands = gradeBandsData?.data || [];

  // ── Fetch PF policies ──────────────────────────────
  const { data, isLoading, error, refetch } = usePFPolicies({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const configs = data?.data ?? [];
  const meta = data?.meta;
  const totalEntries = meta?.total ?? 0;
  const totalPages = meta?.last_page ?? 1;

  // ── Mutations ───────────────────────────────────────
  const createPolicy = useCreatePFPolicy();
  const updatePolicy = useUpdatePFPolicy();
  const deletePolicy = useDeletePFPolicy();

  // ── Modal state ─────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('create');
  const [selectedConfig, setSelectedConfig] = useState<PFPolicy | null>(null);

  const [formData, setFormData] = useState<Partial<PFPolicy>>({
    policy_name: '',
    employee_category: [],
    department: [],
    grade: [],
    state_id: undefined,
    salary_basis: 'basic_salary',
    employee_contribution_type: 'percentage',
    employee_contribution_value: 0,
    employee_contribution_cap: null,
    employer_contribution_type: 'percentage',
    employer_contribution_value: 0,
    employer_contribution_cap: null,
    matching_rule: 'no_matching',
    tax_treatment: 'exempt',
    include_in_tax_calculation: false,
    effective_from: null,
    effective_to: null,
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
    if (!stateId) return 'Company Default';
    const state = states.find((s) => s.id === stateId);
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

  // ── Handlers ────────────────────────────────────────
  const handleView = (config: PFPolicy) => {
    setSelectedConfig(config);
    setFormData({ ...config });
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEdit = (config: PFPolicy) => {
    setSelectedConfig(config);
    setFormData({ ...config });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedConfig(null);
    setFormData({
      policy_name: '',
      employee_category: [],
      department: [],
      grade: [],
      state_id: undefined,
      salary_basis: 'basic_salary',
      employee_contribution_type: 'percentage',
      employee_contribution_value: 0,
      employee_contribution_cap: null,
      employer_contribution_type: 'percentage',
      employer_contribution_value: 0,
      employer_contribution_cap: null,
      matching_rule: 'no_matching',
      tax_treatment: 'exempt',
      include_in_tax_calculation: false,
      effective_from: null,
      effective_to: null,
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
      await deletePolicy.mutateAsync(deleteId);
      toast.success('PF policy deleted.');
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to delete.' });
    } finally {
      setDeleteId(null);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.policy_name) {
      toast.error('Policy name is required.');
      return;
    }
    if (formData.effective_from && formData.effective_to &&
      new Date(formData.effective_to) <= new Date(formData.effective_from)) {
      toast.error('Effective to must be after effective from.');
      return;
    }

    const payload: any = {
      policy_name: formData.policy_name,
      employee_category: formData.employee_category || null,
      department: formData.department || null,
      grade: formData.grade || null,
      state_id: formData.state_id || null,
      salary_basis: formData.salary_basis,
      employee_contribution_type: formData.employee_contribution_type,
      employee_contribution_value: formData.employee_contribution_value || 0,
      employee_contribution_cap: formData.employee_contribution_cap || null,
      employer_contribution_type: formData.employer_contribution_type,
      employer_contribution_value: formData.employer_contribution_value || 0,
      employer_contribution_cap: formData.employer_contribution_cap || null,
      matching_rule: formData.matching_rule,
      tax_treatment: formData.tax_treatment,
      include_in_tax_calculation: formData.include_in_tax_calculation || false,
      effective_from: formData.effective_from || null,
      effective_to: formData.effective_to || null,
      status: formData.status || 'draft',
    };

    try {
      if (modalMode === 'create') {
        await createPolicy.mutateAsync(payload);
        toast.success('PF policy created.');
      } else if (modalMode === 'edit' && selectedConfig) {
        await updatePolicy.mutateAsync({
          uuid: selectedConfig.id,
          payload,
        });
        toast.success('PF policy updated.');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const messages = Object.values(errors).flat().join(' ');
        showApiError(err, { fallbackMessage: messages });
      } else {
        showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to save policy.' });
      }
    }
  };

  // ── Columns ──────────────────────────────────────────
  const columns: ColumnDef<PFPolicy & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: 'sr',
        header: 'SR. NO.',
        cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.sr}</div>,
      },
      {
        accessorKey: 'policy_name',
        header: 'POLICY NAME',
        cell: ({ row }) => <span className="font-medium">{row.original.policy_name}</span>,
      },
      {
        accessorKey: 'state_id',
        header: 'STATE',
        cell: ({ row }) => (
          <span className="capitalize">{getStateName(row.original.state_id)}</span>
        ),
      },
      {
        accessorKey: 'salary_basis',
        header: 'SALARY BASIS',
        cell: ({ row }) => (
          <span className="capitalize">{row.original.salary_basis.replace('_', ' ')}</span>
        ),
      },
      {
        accessorKey: 'employee_contribution_type',
        header: 'EMPLOYEE CONTRIBUTION',
        cell: ({ row }) => (
          <span>{row.original.employee_contribution_value}{row.original.employee_contribution_type === 'percentage' ? '%' : ''}</span>
        ),
      },
      {
        accessorKey: 'employer_contribution_type',
        header: 'EMPLOYER CONTRIBUTION',
        cell: ({ row }) => (
          <span>{row.original.employer_contribution_value}{row.original.employer_contribution_type === 'percentage' ? '%' : ''}</span>
        ),
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
        <div className="text-red-600">Failed to load PF policies. Please try again.</div>
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
                Provident Fund Policies
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} policies • PF rules & contributions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
                onClick={handleCreate}
                disabled={createPolicy.isPending}
              >
                <PlusIcon className="h-4 w-4" />
                New Policy
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
                placeholder="Search by policy name, state, or basis..."
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
                        <p className="text-gray-500 mt-2">Loading policies...</p>
                      </td>
                    </tr>
                  ) : rowsWithSr.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center">
                        <div className="text-gray-500">
                          <p className="font-medium">No policies found</p>
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'create' && 'Add PF Policy'}
              {modalMode === 'edit' && 'Edit PF Policy'}
              {modalMode === 'view' && 'View PF Policy'}
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'create' && 'Define provident fund rules for company or specific state.'}
              {modalMode === 'edit' && 'Update the PF policy parameters.'}
              {modalMode === 'view' && 'Policy details (read-only).'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Policy Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Policy Name *</label>
              <Input
                value={formData.policy_name || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, policy_name: e.target.value }))
                }
                disabled={modalMode === 'view'}
                placeholder="e.g., Company PF Policy"
              />
            </div>

            {/* Employee Category - Multi Select */}
            <div>
              <label className="block text-sm font-medium mb-1">Employee Category</label>
              <MultiSelect
              label="Employee Category"
                options={employeeTypes.map((et) => ({ id: et.name, name: et.name }))}
                selected={formData.employee_category || []}
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    employee_category: selected.map((s) => s.toString()),
                  }))
                }
                disabled={modalMode === 'view'}
                placeholder="Select employee categories..."
              />
            </div>

            {/* Department - Multi Select */}
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <MultiSelect
              label="Department"
                options={departments.map((d) => ({ id: d.id, name: d.name }))}
                selected={formData.department || []}
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    department: selected.map((s) => Number(s)),
                  }))
                }
                disabled={modalMode === 'view'}
                placeholder="Select departments..."
              />
            </div>

            {/* Grade - Multi Select */}
            <div>
              <label className="block text-sm font-medium mb-1">Grade</label>
              <MultiSelect
              label="Grade"
                options={gradeBands.map((g) => ({ id: g.id, name: g.name }))}
                selected={formData.grade || []}
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    grade: selected.map((s) => Number(s)),
                  }))
                }
                disabled={modalMode === 'view'}
                placeholder="Select grades..."
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              {modalMode === 'view' ? (
                <Input
                  value={getStateName(formData.state_id ?? null)}
                  disabled
                  className="bg-gray-50 capitalize"
                />
              ) : (
                <Select
                  value={formData.state_id?.toString() || 'none'}
                  onValueChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      state_id: val === 'none' ? undefined : parseInt(val),
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Company Default" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="none">Company Default</SelectItem>
                    {states.map((state) => (
                      <SelectItem key={state.id} value={state.id.toString()}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Salary Basis */}
            <div>
              <label className="block text-sm font-medium mb-1">Salary Basis *</label>
              {modalMode === 'view' ? (
                <Input
                  value={formData.salary_basis?.replace('_', ' ') || '—'}
                  disabled
                  className="bg-gray-50 capitalize"
                />
              ) : (
                <Select
                  value={formData.salary_basis || ''}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, salary_basis: val as any }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select basis" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {SALARY_BASIS.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Employee Contribution Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Employee Contribution Type</label>
              {modalMode === 'view' ? (
                <Input
                  value={formData.employee_contribution_type || 'none'}
                  disabled
                  className="bg-gray-50 capitalize"
                />
              ) : (
                <Select
                  value={formData.employee_contribution_type || 'none'}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, employee_contribution_type: val as any }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {CONTRIBUTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Employee Contribution Value */}
            <div>
              <label className="block text-sm font-medium mb-1">Employee Contribution Value</label>
              <Input
                type="number"
                step="0.01"
                value={formData.employee_contribution_value ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employee_contribution_value: parseFloat(e.target.value) || 0,
                  }))
                }
                disabled={modalMode === 'view'}
                placeholder="0"
              />
            </div>

            {/* Employee Contribution Cap */}
            <div>
              <label className="block text-sm font-medium mb-1">Employee Contribution Cap</label>
              <Input
                type="number"
                value={formData.employee_contribution_cap ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employee_contribution_cap: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                disabled={modalMode === 'view'}
                placeholder="No cap"
              />
            </div>

            {/* Employer Contribution Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Employer Contribution Type</label>
              {modalMode === 'view' ? (
                <Input
                  value={formData.employer_contribution_type || 'none'}
                  disabled
                  className="bg-gray-50 capitalize"
                />
              ) : (
                <Select
                  value={formData.employer_contribution_type || 'none'}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, employer_contribution_type: val as any }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {CONTRIBUTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Employer Contribution Value */}
            <div>
              <label className="block text-sm font-medium mb-1">Employer Contribution Value</label>
              <Input
                type="number"
                step="0.01"
                value={formData.employer_contribution_value ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employer_contribution_value: parseFloat(e.target.value) || 0,
                  }))
                }
                disabled={modalMode === 'view'}
                placeholder="0"
              />
            </div>

            {/* Employer Contribution Cap */}
            <div>
              <label className="block text-sm font-medium mb-1">Employer Contribution Cap</label>
              <Input
                type="number"
                value={formData.employer_contribution_cap ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employer_contribution_cap: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                disabled={modalMode === 'view'}
                placeholder="No cap"
              />
            </div>

            {/* Matching Rule */}
            <div>
              <label className="block text-sm font-medium mb-1">Matching Rule</label>
              {modalMode === 'view' ? (
                <Input
                  value={formData.matching_rule?.replace('_', ' ') || 'no_matching'}
                  disabled
                  className="bg-gray-50 capitalize"
                />
              ) : (
                <Select
                  value={formData.matching_rule || 'no_matching'}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, matching_rule: val as any }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select rule" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {MATCHING_RULES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Tax Treatment */}
            <div>
              <label className="block text-sm font-medium mb-1">Tax Treatment</label>
              {modalMode === 'view' ? (
                <Input
                  value={formData.tax_treatment || 'exempt'}
                  disabled
                  className="bg-gray-50 capitalize"
                />
              ) : (
                <Select
                  value={formData.tax_treatment || 'exempt'}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, tax_treatment: val as any }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select treatment" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {TAX_TREATMENTS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Include in Tax Calculation */}
            <div className="flex items-center space-x-2 mt-6">
              <Checkbox
                id="include_in_tax_calculation"
                checked={formData.include_in_tax_calculation ?? false}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, include_in_tax_calculation: !!checked }))
                }
                disabled={modalMode === 'view'}
              />
              <label htmlFor="include_in_tax_calculation" className="text-sm font-medium">
                Include in Tax Calculation
              </label>
            </div>

            {/* Effective From */}
            <div>
              <label className="block text-sm font-medium mb-1">Effective From</label>
              <Input
                type="date"
                value={formData.effective_from || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, effective_from: e.target.value || null }))
                }
                disabled={modalMode === 'view'}
                placeholder="Optional"
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
                  disabled={createPolicy.isPending || updatePolicy.isPending}
                >
                  {createPolicy.isPending || updatePolicy.isPending ? (
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
              This action cannot be undone. This will permanently delete the PF policy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePolicy.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletePolicy.isPending}
            >
              {deletePolicy.isPending ? (
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

export default PFPoliciesPage;