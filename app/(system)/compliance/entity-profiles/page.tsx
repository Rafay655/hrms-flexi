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
  X,
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
import type { EntityProfile, EntityProfileFormData, SSRegistration } from '@/types/entity-profile.types';
import {
  useEntityProfiles,
  useCreateEntityProfile,
  useUpdateEntityProfile,
  useDeleteEntityProfile,
} from '@/hooks/useEntityProfiles';
import { useStates } from '@/hooks/useStates';
import { useCompanies } from '@/hooks/useCompanies';

// ── Static options ────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const SS_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];

const SCHEMES = [
  { value: 'PESSI', label: 'PESSI (Punjab)' },
  { value: 'SESSI', label: 'SESSI (Sindh)' },
  { value: 'KP-ESSI', label: 'KP-ESSI (KPK)' },
  { value: 'B-ESSI', label: 'B-ESSI (Balochistan)' },
  { value: 'ICT', label: 'ICT / Federal' },
  { value: 'Other', label: 'Other' },
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
  options: Array<{ id: number; name: string }>;
  selected: number[];
  onChange: (selected: number[]) => void;
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

  const toggleItem = (id: number) => {
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
const EntityProfilesPage: React.FC = () => {
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

  const {
    companies,
    isLoading: companiesLoading,
    error: companiesError,
  } = useCompanies({ per_page: 1000 });

  // ── Fetch Entity Profiles ──────────────────────────
  const { data, isLoading, error, refetch } = useEntityProfiles({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const configs = data?.data ?? [];
  const meta = data?.meta;
  const totalEntries = meta?.total ?? 0;
  const totalPages = meta?.last_page ?? 1;

  // ── Mutations ───────────────────────────────────────
  const createProfile = useCreateEntityProfile();
  const updateProfile = useUpdateEntityProfile();
  const deleteProfile = useDeleteEntityProfile();

  // ── Modal state ─────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('create');
  const [selectedConfig, setSelectedConfig] = useState<EntityProfile | null>(null);

  const [ssRegistrations, setSsRegistrations] = useState<SSRegistration[]>([]);

  const [formData, setFormData] = useState<EntityProfileFormData>({
    legal_entity_id: null,
    default_state_id: undefined,
    operating_state_ids: [],
    ntn: null,
    strn: null,
    eobi_applicable: true,
    eobi_employer_registration_no: null,
    eobi_registration_office: null,
    eobi_effective_from: null,
    ss_applicable: true,
    wwf_applicable: true,
    wppf_applicable: false,
    professional_tax_applicable: false,
    effective_from: '',
    effective_to: null,
    status: 'draft',
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch]);

  // ── Helpers ──────────────────────────────────────────
  const getStateName = (id: number | null) => {
    if (!id) return 'Unknown';
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

  const getCompanyName = (config: EntityProfile | null) => {
    if (config?.legal_entity?.name) {
      return config.legal_entity.name;
    }
    const company = companies.find((c) => c.id === config?.company_id);
    return company?.company_name || '—';
  };

  // ── Helper: Convert API response to form data ──────
  const convertConfigToFormData = (config: EntityProfile): EntityProfileFormData => {
    const operatingStateIds = (config.operating_state_ids || []).map((s: any) => s.id);
    return {
      legal_entity_id: config.legal_entity?.id || null,
      default_state_id: config.default_state_id ?? undefined,
      operating_state_ids: operatingStateIds,
      ntn: config.ntn_masked || null,
      strn: config.strn_masked || null,
      eobi_applicable: config.eobi_applicable,
      eobi_employer_registration_no: config.eobi_employer_registration_no || null,
      eobi_registration_office: config.eobi_registration_office || null,
      eobi_effective_from: config.eobi_effective_from || null,
      ss_applicable: config.ss_applicable,
      wwf_applicable: config.wwf_applicable,
      wppf_applicable: config.wppf_applicable,
      professional_tax_applicable: config.professional_tax_applicable,
      effective_from: config.effective_from,
      effective_to: config.effective_to,
      status: config.status,
    };
  };

  // ── Handlers ────────────────────────────────────────
  const handleView = (config: EntityProfile) => {
    setSelectedConfig(config);
    setFormData(convertConfigToFormData(config));
    setSsRegistrations(config.ss_registrations || []);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEdit = (config: EntityProfile) => {
    setSelectedConfig(config);
    setFormData(convertConfigToFormData(config));
    setSsRegistrations(config.ss_registrations || []);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedConfig(null);
    setFormData({
      legal_entity_id: null,
      default_state_id: undefined,
      operating_state_ids: [],
      ntn: null,
      strn: null,
      eobi_applicable: true,
      eobi_employer_registration_no: null,
      eobi_registration_office: null,
      eobi_effective_from: null,
      ss_applicable: true,
      wwf_applicable: true,
      wppf_applicable: false,
      professional_tax_applicable: false,
      effective_from: '',
      effective_to: null,
      status: 'draft',
    });
    setSsRegistrations([]);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleDelete = (uuid: string) => {
    setDeleteId(uuid);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProfile.mutateAsync(deleteId);
      toast.success('Entity profile deleted.');
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to delete.' });
    } finally {
      setDeleteId(null);
    }
  };

  const addSSRegistration = () => {
    setSsRegistrations([
      ...ssRegistrations,
      {
        state_id: 0,
        scheme: '',
        employer_registration_no: '',
        registration_office: null,
        effective_from: '',
        status: 'active',
      },
    ]);
  };

  const removeSSRegistration = (index: number) => {
    setSsRegistrations(ssRegistrations.filter((_, i) => i !== index));
  };

  const updateSSRegistration = (index: number, field: keyof SSRegistration, value: any) => {
    const updated = [...ssRegistrations];
    updated[index] = { ...updated[index], [field]: value };
    setSsRegistrations(updated);
  };

  const handleSave = async () => {
    if (!formData.default_state_id) {
      toast.error('Default state is required.');
      return;
    }
    if (!formData.operating_state_ids || formData.operating_state_ids.length === 0) {
      toast.error('At least one operating state is required.');
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
    if (formData.ss_applicable && ssRegistrations.length === 0) {
      toast.error('SS is applicable but no registrations added.');
      return;
    }
    for (const reg of ssRegistrations) {
      if (!reg.state_id || !reg.scheme || !reg.employer_registration_no || !reg.effective_from) {
        toast.error('All SS registration fields are required.');
        return;
      }
    }

    const payload: any = {
      default_state_id: formData.default_state_id,
      operating_state_ids: formData.operating_state_ids,
      ntn: formData.ntn || null,
      strn: formData.strn || null,
      eobi_applicable: formData.eobi_applicable,
      eobi_employer_registration_no: formData.eobi_employer_registration_no || null,
      eobi_registration_office: formData.eobi_registration_office || null,
      eobi_effective_from: formData.eobi_effective_from || null,
      ss_applicable: formData.ss_applicable,
      ss_registrations: ssRegistrations,
      wwf_applicable: formData.wwf_applicable,
      wppf_applicable: formData.wppf_applicable,
      professional_tax_applicable: formData.professional_tax_applicable,
      effective_from: formData.effective_from,
      effective_to: formData.effective_to || null,
      status: formData.status || 'draft',
    };

    try {
      if (modalMode === 'create') {
        await createProfile.mutateAsync(payload);
        toast.success('Entity profile created.');
      } else if (modalMode === 'edit' && selectedConfig) {
        await updateProfile.mutateAsync({
          uuid: selectedConfig.id,
          payload,
        });
        toast.success('Entity profile updated.');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const messages = Object.values(errors).flat().join(' ');
        showApiError(err, { fallbackMessage: messages });
      } else {
        showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to save profile.' });
      }
    }
  };

  // ── Columns ──────────────────────────────────────────
  const columns: ColumnDef<EntityProfile & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: 'sr',
        header: 'SR. NO.',
        cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.sr}</div>,
      },
      {
        accessorKey: 'legal_entity',
        header: 'LEGAL ENTITY',
        cell: ({ row }) => <span>{row.original.legal_entity?.name || '—'}</span>,
      },
      {
        accessorKey: 'default_state',
        header: 'DEFAULT STATE',
        cell: ({ row }) => <span>{row.original.default_state?.name || '—'}</span>,
      },
      {
        accessorKey: 'operating_state_ids',
        header: 'OPERATING STATES',
        cell: ({ row }) => {
          const states = row.original.operating_state_ids || [];
          if (states.length === 0) return <span className="text-muted-foreground text-sm">—</span>;
          const names = states.map((s: any) => s.name).filter(Boolean);
          return (
            <div className="flex flex-wrap gap-1">
              {names.slice(0, 3).map((name: string) => (
                <Badge key={name} variant="secondary" className="text-xs">
                  {name}
                </Badge>
              ))}
              {names.length > 3 && <Badge variant="outline" className="text-xs">+{names.length - 3}</Badge>}
            </div>
          );
        },
      },
      {
        accessorKey: 'eobi_applicable',
        header: 'EOBI',
        cell: ({ row }) => (
          <Badge variant={row.original.eobi_applicable ? 'default' : 'secondary'}>
            {row.original.eobi_applicable ? 'Yes' : 'No'}
          </Badge>
        ),
      },
      {
        accessorKey: 'ss_applicable',
        header: 'SS',
        cell: ({ row }) => (
          <Badge variant={row.original.ss_applicable ? 'default' : 'secondary'}>
            {row.original.ss_applicable ? 'Yes' : 'No'}
          </Badge>
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
    []
  );

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

  const isLoadingData = isLoading || statesLoading || companiesLoading;

  if (error || companiesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Failed to load data. Please try again.</div>
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
                Entity Compliance Profiles
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} profiles • Statutory compliance settings per legal entity
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
                onClick={handleCreate}
                disabled={createProfile.isPending}
              >
                <PlusIcon className="h-4 w-4" />
                New Profile
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
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by legal entity, state, or status..."
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
                        <p className="text-gray-500 mt-2">Loading profiles...</p>
                      </td>
                    </tr>
                  ) : rowsWithSr.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center">
                        <div className="text-gray-500">
                          <p className="font-medium">No profiles found</p>
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'create' && 'Add Entity Profile'}
              {modalMode === 'edit' && 'Edit Entity Profile'}
              {modalMode === 'view' && 'View Entity Profile'}
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'create' && 'Configure statutory compliance for a legal entity.'}
              {modalMode === 'edit' && 'Update compliance settings.'}
              {modalMode === 'view' && 'Profile details (read-only).'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* ── Basic Info ────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Legal Entity - READ ONLY */}
              <div>
                <label className="block text-sm font-medium mb-1">Legal Entity</label>
                <Input
                  value={
                    modalMode === 'create'
                      ? (() => {
                          if (typeof window !== 'undefined') {
                            try {
                              const authCompany = localStorage.getItem('authCompany');
                              if (authCompany) {
                                const parsed = JSON.parse(authCompany);
                                return parsed?.name || 'Current Company';
                              }
                            } catch (e) {
                              // ignore
                            }
                          }
                          return 'Current Company';
                        })()
                      : getCompanyName(selectedConfig)
                  }
                  disabled
                  className="bg-gray-50 font-medium"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Determined by your current company selection
                </p>
              </div>

              {/* Default State */}
              <div>
                <label className="block text-sm font-medium mb-1">Default State *</label>
                {modalMode === 'view' ? (
                  <Input
                    value={getStateName(formData.default_state_id || 0)}
                    disabled
                    className="bg-gray-50 capitalize"
                  />
                ) : (
                  <Select
                    value={formData.default_state_id?.toString() || ''}
                    onValueChange={(val) =>
                      setFormData((prev) => ({ ...prev, default_state_id: parseInt(val) }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select default state" />
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

              {/* Operating States */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Operating States *</label>
                {modalMode === 'view' ? (
                  <Input
                    value={(formData.operating_state_ids || []).map((id) => getStateName(id)).join(', ')}
                    disabled
                    className="bg-gray-50"
                  />
                ) : (
                  <MultiSelect
                    options={states}
                    selected={formData.operating_state_ids || []}
                    onChange={(selected) =>
                      setFormData((prev) => ({ ...prev, operating_state_ids: selected }))
                    }
                    placeholder="Select operating states..."
                  />
                )}
              </div>

              {/* NTN */}
              <div>
                <label className="block text-sm font-medium mb-1">NTN</label>
                <Input
                  value={formData.ntn || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, ntn: e.target.value || null }))
                  }
                  disabled={modalMode === 'view'}
                  placeholder="Optional"
                />
              </div>

              {/* STRN */}
              <div>
                <label className="block text-sm font-medium mb-1">STRN</label>
                <Input
                  value={formData.strn || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, strn: e.target.value || null }))
                  }
                  disabled={modalMode === 'view'}
                  placeholder="Optional"
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

            {/* ── EOBI Section ───────────────────────────────── */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">EOBI Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="eobi_applicable"
                    checked={formData.eobi_applicable ?? true}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, eobi_applicable: !!checked }))
                    }
                    disabled={modalMode === 'view'}
                  />
                  <label htmlFor="eobi_applicable" className="text-sm font-medium">
                    EOBI Applicable
                  </label>
                </div>
                {formData.eobi_applicable && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">EOBI Employer Registration No</label>
                      <Input
                        value={formData.eobi_employer_registration_no || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, eobi_employer_registration_no: e.target.value || null }))
                        }
                        disabled={modalMode === 'view'}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">EOBI Registration Office</label>
                      <Input
                        value={formData.eobi_registration_office || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, eobi_registration_office: e.target.value || null }))
                        }
                        disabled={modalMode === 'view'}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">EOBI Effective From</label>
                      <Input
                        type="date"
                        value={formData.eobi_effective_from || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, eobi_effective_from: e.target.value || null }))
                        }
                        disabled={modalMode === 'view'}
                        placeholder="Optional"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Social Security Section ───────────────────── */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Social Security Settings</h3>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="ss_applicable"
                  checked={formData.ss_applicable ?? true}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, ss_applicable: !!checked }))
                  }
                  disabled={modalMode === 'view'}
                />
                <label htmlFor="ss_applicable" className="text-sm font-medium">
                  SS Applicable
                </label>
              </div>

              {formData.ss_applicable && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">SS Registrations</span>
                    {modalMode !== 'view' && (
                      <Button variant="outline" size="sm" onClick={addSSRegistration}>
                        <PlusIcon className="h-3.5 w-3.5 mr-1" /> Add Registration
                      </Button>
                    )}
                  </div>
                  {ssRegistrations.length === 0 && (
                    <div className="text-sm text-muted-foreground">No registrations added.</div>
                  )}
                  {ssRegistrations.map((reg, index) => (
                    <div key={index} className="border p-3 rounded-lg space-y-3 relative">
                      {modalMode !== 'view' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 text-red-500 hover:text-red-700"
                          onClick={() => removeSSRegistration(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-0.5">State *</label>
                          {modalMode === 'view' ? (
                            <Input
                              value={getStateName(reg.state_id)}
                              disabled
                              className="bg-gray-50 text-sm"
                            />
                          ) : (
                            <Select
                              value={reg.state_id?.toString() || ''}
                              onValueChange={(val) =>
                                updateSSRegistration(index, 'state_id', parseInt(val))
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
                        <div>
                          <label className="block text-xs font-medium mb-0.5">Scheme *</label>
                          {modalMode === 'view' ? (
                            <Input
                              value={reg.scheme}
                              disabled
                              className="bg-gray-50 text-sm"
                            />
                          ) : (
                            <Select
                              value={reg.scheme}
                              onValueChange={(val) =>
                                updateSSRegistration(index, 'scheme', val)
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
                        <div>
                          <label className="block text-xs font-medium mb-0.5">Employer Reg No *</label>
                          <Input
                            value={reg.employer_registration_no}
                            onChange={(e) =>
                              updateSSRegistration(index, 'employer_registration_no', e.target.value)
                            }
                            disabled={modalMode === 'view'}
                            className="text-sm"
                            placeholder="Required"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-0.5">Registration Office</label>
                          <Input
                            value={reg.registration_office || ''}
                            onChange={(e) =>
                              updateSSRegistration(index, 'registration_office', e.target.value || null)
                            }
                            disabled={modalMode === 'view'}
                            className="text-sm"
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-0.5">Effective From *</label>
                          <Input
                            type="date"
                            value={reg.effective_from}
                            onChange={(e) =>
                              updateSSRegistration(index, 'effective_from', e.target.value)
                            }
                            disabled={modalMode === 'view'}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-0.5">Status</label>
                          {modalMode === 'view' ? (
                            <Input
                              value={reg.status || 'active'}
                              disabled
                              className="bg-gray-50 text-sm capitalize"
                            />
                          ) : (
                            <Select
                              value={reg.status || 'active'}
                              onValueChange={(val) =>
                                updateSSRegistration(index, 'status', val)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {SS_STATUS_OPTIONS.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Other Compliance ────────────────────────────── */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Other Compliance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wwf_applicable"
                    checked={formData.wwf_applicable ?? true}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, wwf_applicable: !!checked }))
                    }
                    disabled={modalMode === 'view'}
                  />
                  <label htmlFor="wwf_applicable" className="text-sm font-medium">
                    WWF Applicable
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wppf_applicable"
                    checked={formData.wppf_applicable ?? false}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, wppf_applicable: !!checked }))
                    }
                    disabled={modalMode === 'view'}
                  />
                  <label htmlFor="wppf_applicable" className="text-sm font-medium">
                    WPPF Applicable
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="professional_tax_applicable"
                    checked={formData.professional_tax_applicable ?? false}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, professional_tax_applicable: !!checked }))
                    }
                    disabled={modalMode === 'view'}
                  />
                  <label htmlFor="professional_tax_applicable" className="text-sm font-medium">
                    Professional Tax Applicable
                  </label>
                </div>
              </div>
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
                  disabled={createProfile.isPending || updateProfile.isPending}
                >
                  {createProfile.isPending || updateProfile.isPending ? (
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
              This action cannot be undone. This will permanently delete the entity profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProfile.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteProfile.isPending}
            >
              {deleteProfile.isPending ? (
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

export default EntityProfilesPage;