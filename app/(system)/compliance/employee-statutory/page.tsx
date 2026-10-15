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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SearchIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  History,
  ArrowRight,
  Plus,
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
import type { EmployeeProfile, ProfileHistory, CreateEmployeeProfilePayload } from '@/types/employee-profile.types';
import {
  useEmployeeProfiles,
  useCreateEmployeeProfile,
  useUpdateEmployeeProfile,
  useTransferProvince,
  useEmployeeProfileHistory,
} from '@/hooks/useEmployeeProfiles';
import { useStates } from '@/hooks/useStates';
import { useBranches } from '@/hooks/useBranches';
import { useEmployees } from '@/hooks/useEmployees';

// ── Debounce hook ─────────────────────────────────────
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Helpers ────────────────────────────────────────────
const getFilerBadge = (isFiler: boolean) => {
  return isFiler ? (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Filer</Badge>
  ) : (
    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Non-Filer</Badge>
  );
};

const getStatusBadge = (status: string | null) => {
  if (!status) return <Badge variant="outline">—</Badge>;
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    case 'inactive':
      return <Badge variant="secondary">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Reusable field wrapper so every label + control lines up identically
const Field = ({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    <label className="text-sm font-medium text-gray-700 leading-none">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

// Reusable checkbox row so every checkbox aligns on the same baseline
const CheckboxField = ({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-gray-200 bg-gray-50/50">
    <Checkbox id={id} checked={checked} onCheckedChange={(c) => onCheckedChange(!!c)} />
    <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer select-none">
      {label}
    </label>
  </div>
);

// ── Main Component ────────────────────────────────────
export default function EmployeeProfilesPage() {
  // ── Query params ────────────────────────────────────
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  // ── Filters ─────────────────────────────────────────
  const [filters, setFilters] = useState({
    filer: '',
    state_id: '',
  });

  // ── Fetch lookup data ──────────────────────────────
  const { data: statesData } = useStates({ country_id: 167, per_page: 1000 });
  const states = statesData?.data || [];

  // ── Fetch branches ──────────────────────────────────
  const { data: branchesData, isLoading: branchesLoading } = useBranches({ per_page: 1000 });
  const branches = branchesData?.data?.data || [];

  const employees = useEmployees({ per_page: 1000, detailed: 0 });
  const employeeList = Array.isArray(employees) ? employees : employees?.data || [];

  // Label resolvers for the Select triggers below. We don't rely on
  // Radix/shadcn's built-in auto-resolution (it can fail to show the label
  // for a controlled value, leaving the trigger blank even though the id is
  // correctly selected) — instead we look the label up ourselves from the
  // loaded list, trying a couple of common field-name variants defensively.
  const findLabel = (
    list: any[],
    idValue: string | number | null | undefined,
    idKeys: string[],
    nameKeys: string[]
  ): string | undefined => {
    if (idValue === null || idValue === undefined || idValue === '') return undefined;
    const target = String(idValue);
    const match = list.find((item) => idKeys.some((k) => item?.[k] !== undefined && String(item[k]) === target));
    if (!match) return undefined;
    const nameKey = nameKeys.find((k) => match?.[k] !== undefined);
    return nameKey ? match[nameKey] : undefined;
  };

  const getStateLabel = (id: string | number | null | undefined) =>
    findLabel(states, id, ['id', 'state_id'], ['name', 'state_name']);

  const getBranchLabel = (id: string | number | null | undefined) =>
    findLabel(branches, id, ['id', 'branch_id'], ['name', 'branch_name']);

  const getEmployeeLabel = (uuid: string | null | undefined) =>
    findLabel(employeeList, uuid, ['uuid', 'id', 'employee_uuid'], ['name', 'employee_name', 'full_name']);

  // ── Fetch profiles ──────────────────────────────────
  const { data, isLoading, error, refetch } = useEmployeeProfiles({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    filer: filters.filer === '' ? undefined : filters.filer === 'true',
    state_id: filters.state_id ? parseInt(filters.state_id) : undefined,
  });

  const profiles = data?.data ?? [];
  const meta = data?.meta;
  const totalEntries = meta?.total ?? 0;
  const totalPages = meta?.last_page ?? 1;
  const filerCount = meta?.filer_count ?? 0;
  const nonFilerCount = meta?.non_filer_count ?? 0;

  // ── Mutations ───────────────────────────────────────
  const createProfile = useCreateEmployeeProfile();
  const updateProfile = useUpdateEmployeeProfile();
  const transferProvince = useTransferProvince();

  // ── State for modals ─────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [selectedEmployeeUuid, setSelectedEmployeeUuid] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<EmployeeProfile | null>(null);

  // ── Form state ──────────────────────────────────────
  const [formData, setFormData] = useState<Partial<CreateEmployeeProfilePayload>>({
    employee_uuid: '',
    state_id: undefined,
    eobi_applicable: true,
    social_security_applicable: true,
    provident_fund_applicable: false,
    gratuity_applicable: false,
    is_filer: false,
    filer_status: 'non_filer',
    effective_from: '',
    cnic: '',
    ntn: '',
    eobi_number: '',
    ss_number: '',
  });

  const [transferData, setTransferData] = useState({
    new_work_location_id: '' as string,
    new_state_id: 0,
    effective_from: '',
    transfer_reason: '',
    requires_new_ss_registration: false,
    new_ss_scheme: '',
    notes: '',
  });

  // ── History ─────────────────────────────────────────
  const { data: historyData, isLoading: historyLoading } = useEmployeeProfileHistory(
    selectedEmployeeUuid || ''
  );
  const history = historyData || [];

  // ── Reset page on filter change ─────────────────────
  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, filters]);

  // ── Handlers ────────────────────────────────────────
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  const handleCreate = () => {
    setFormData({
      employee_uuid: '',
      state_id: undefined,
      eobi_applicable: true,
      social_security_applicable: true,
      provident_fund_applicable: false,
      gratuity_applicable: false,
      is_filer: false,
      filer_status: 'non_filer',
      effective_from: '',
      cnic: '',
      ntn: '',
      eobi_number: '',
      ss_number: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (profile: EmployeeProfile) => {
    setSelectedProfile(profile);
    setFormData({
      employee_uuid: profile.employee_uuid,
      state_id: profile.state_id || undefined,
      eobi_applicable: profile.eobi_applicable,
      social_security_applicable: profile.social_security_applicable,
      provident_fund_applicable: profile.provident_fund_applicable,
      gratuity_applicable: profile.gratuity_applicable,
      is_filer: profile.is_filer,
      filer_status: profile.filer_status || 'non_filer',
      effective_from: profile.effective_from || '',
      cnic: profile.cnic || '',
      ntn: profile.ntn || '',
      eobi_number: profile.eobi_number || '',
      ss_number: profile.ss_number || '',
    });
    setIsEditModalOpen(true);
  };

  const handleTransfer = (employeeUuid: string) => {
    setSelectedEmployeeUuid(employeeUuid);
    setTransferData({
      new_work_location_id: '',
      new_state_id: 0,
      effective_from: '',
      transfer_reason: '',
      requires_new_ss_registration: false,
      new_ss_scheme: '',
      notes: '',
    });
    setIsTransferModalOpen(true);
  };

  const handleHistory = (employeeUuid: string) => {
    setSelectedEmployeeUuid(employeeUuid);
    setIsHistoryModalOpen(true);
  };

  const handleDeactivate = async (profile: EmployeeProfile) => {
    if (!confirm(`Deactivate profile for ${profile.employee_name}?`)) return;
    try {
      await updateProfile.mutateAsync({
        employeeUuid: profile.employee_uuid,
        payload: {
          status: 'inactive',
        },
      });
      toast.success('Profile deactivated.');
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to deactivate profile.' });
    }
  };

  const handleSaveCreate = async () => {
    if (!formData.employee_uuid) {
      toast.error('Please select an employee.');
      return;
    }
    try {
      await createProfile.mutateAsync(formData as CreateEmployeeProfilePayload);
      toast.success('Profile created.');
      setIsCreateModalOpen(false);
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to create profile.' });
    }
  };

  const handleSaveUpdate = async () => {
    if (!selectedProfile) return;
    try {
      await updateProfile.mutateAsync({
        employeeUuid: selectedProfile.employee_uuid,
        payload: {
          cnic: formData.cnic,
          ntn: formData.ntn,
          eobi_number: formData.eobi_number,
          ss_number: formData.ss_number,
          is_filer: formData.is_filer,
          filer_status: formData.filer_status,
          eobi_applicable: formData.eobi_applicable,
          social_security_applicable: formData.social_security_applicable,
          provident_fund_applicable: formData.provident_fund_applicable,
          gratuity_applicable: formData.gratuity_applicable,
        },
      });
      toast.success('Profile updated.');
      setIsEditModalOpen(false);
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to update profile.' });
    }
  };

  const handleSaveTransfer = async () => {
    if (!selectedEmployeeUuid) return;
    if (!transferData.new_work_location_id || !transferData.new_state_id || !transferData.effective_from) {
      toast.error('Please fill all required fields.');
      return;
    }
    try {
      await transferProvince.mutateAsync({
        employeeUuid: selectedEmployeeUuid,
        payload: {
          new_work_location_id: transferData.new_work_location_id,
          new_state_id: transferData.new_state_id,
          effective_from: transferData.effective_from,
          transfer_reason: transferData.transfer_reason || null,
          requires_new_ss_registration: transferData.requires_new_ss_registration,
          new_ss_scheme: transferData.new_ss_scheme || null,
          notes: transferData.notes || null,
        },
      });
      toast.success('Province transfer completed.');
      setIsTransferModalOpen(false);
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to transfer province.' });
    }
  };

  // ── Columns (CNIC removed) ──────────────────────────
  const columns: ColumnDef<EmployeeProfile & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: 'sr',
        header: 'SR. NO.',
        cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.sr}</div>,
      },
      {
        accessorKey: 'employee_name',
        header: 'EMPLOYEE',
        cell: ({ row }) => <span className="font-medium">{row.original.employee_name}</span>,
      },
      // CNIC column removed
      {
        accessorKey: 'ntn',
        header: 'NTN',
        cell: ({ row }) => <span>{row.original.ntn || '—'}</span>,
      },
      {
        accessorKey: 'is_filer',
        header: 'FILER STATUS',
        cell: ({ row }) => getFilerBadge(row.original.is_filer),
      },
      {
        accessorKey: 'state_id',
        header: 'PROVINCE',
        cell: ({ row }) => <span>{row.original.state?.name || '—'}</span>,
      },
      {
        accessorKey: 'eobi_applicable',
        header: () => <div className="text-center">EOBI</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge variant={row.original.eobi_applicable ? 'default' : 'secondary'}>
              {row.original.eobi_applicable ? 'Yes' : 'No'}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'social_security_applicable',
        header: () => <div className="text-center">SS</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge variant={row.original.social_security_applicable ? 'default' : 'secondary'}>
              {row.original.social_security_applicable ? 'Yes' : 'No'}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: () => <div className="text-center">STATUS</div>,
        cell: ({ row }) => <div className="flex justify-center">{getStatusBadge(row.original.status)}</div>,
      },
      {
        id: 'actions',
        header: () => <div className="text-center">ACTIONS</div>,
        cell: ({ row }) => {
          const profile = row.original;
          return (
            <div className="flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {profile.has_statutory_profile ? (
                    <>
                      <DropdownMenuItem onClick={() => handleEdit(profile)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTransfer(profile.employee_uuid)}>
                        <ArrowRight className="mr-2 h-3.5 w-3.5" /> Transfer Province
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeactivate(profile)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Deactivate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleHistory(profile.employee_uuid)}>
                        <History className="mr-2 h-3.5 w-3.5" /> History
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => handleEdit(profile)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Create Profile
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    []
  );

  // ── Table Data ──────────────────────────────────────
  const rowsWithSr = useMemo(() => {
    const start = (page - 1) * perPage;
    return profiles.map((profile, idx) => ({
      ...profile,
      sr: start + idx + 1,
    }));
  }, [profiles, page, perPage]);

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

  const isLoadingData = isLoading || branchesLoading;

  // ── UI ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Failed to load employee profiles. Please try again.</div>
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
                Employee Statutory Profiles
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} employees • {filerCount} filers, {nonFilerCount} non-filers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
                onClick={handleCreate}
                disabled={createProfile.isPending}
              >
                <Plus className="h-4 w-4" />
                New Profile
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters — every field shares the same Field wrapper so labels
              and controls sit on identical baselines regardless of column span */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 items-end">
            <Field label="Filer Status">
              <Select
                value={filters.filer || 'all'}
                onValueChange={(val) => handleFilterChange('filer', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Filer</SelectItem>
                  <SelectItem value="false">Non-Filer</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Province">
              <Select
                value={filters.state_id || 'all'}
                onValueChange={(val) => handleFilterChange('state_id', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All">
                    {filters.state_id ? (getStateLabel(filters.state_id) ?? 'All') : 'All'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Search" className="col-span-2">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Search by employee name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-[#1E1B4B] focus:ring-[#1E1B4B]"
                />
              </div>
            </Field>
          </div>

          {/* Stats Bar */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select
                value={perPage.toString()}
                onValueChange={(value) => setPerPage(Number(value))}
              >
                <SelectTrigger className="w-20 border-gray-300">
                  <SelectValue placeholder="25" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                          className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                          <p className="text-sm mt-1">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors group">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-4 px-6 text-sm align-middle whitespace-nowrap">
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
                  <div className="text-sm text-gray-600 md:w-1/3 text-center md:text-left">
                    Page <span className="font-semibold text-gray-900">{page}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </div>
                  <div className="flex items-center space-x-2 md:w-1/3 justify-center">
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
                            className={cn(
                              'w-9',
                              page === pageNum
                                ? 'bg-[#1E1B4B] hover:bg-[#2A2675] border-[#1E1B4B]'
                                : 'border-gray-300 hover:bg-gray-100'
                            )}
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
                  <div className="text-sm text-gray-600 md:w-1/3 text-center md:text-right">
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

      {/* ── Create Modal ────────────────────────────────── */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Employee Statutory Profile</DialogTitle>
            <DialogDescription>Enter employee statutory details.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <Field label="Employee" required>
              <Select
                value={formData.employee_uuid || ''}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, employee_uuid: val }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employee">
                    {formData.employee_uuid ? getEmployeeLabel(formData.employee_uuid) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {employeeList.map((emp: any) => (
                    <SelectItem key={emp.uuid} value={emp.uuid}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Province">
              <Select
                value={formData.state_id?.toString() || ''}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, state_id: parseInt(val) }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select province">
                    {formData.state_id ? getStateLabel(formData.state_id) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="CNIC (13 digits)">
              <Input
                value={formData.cnic || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, cnic: e.target.value }))}
                maxLength={13}
                placeholder="3520212345678"
              />
            </Field>

            <Field label="NTN">
              <Input
                value={formData.ntn || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, ntn: e.target.value }))}
                placeholder="1234567-8"
              />
            </Field>

            <Field label="EOBI Number">
              <Input
                value={formData.eobi_number || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, eobi_number: e.target.value }))}
                placeholder="Optional"
              />
            </Field>

            <Field label="Social Security Number">
              <Input
                value={formData.ss_number || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, ss_number: e.target.value }))}
                placeholder="Optional"
              />
            </Field>

            <Field label="Effective From">
              <Input
                type="date"
                value={formData.effective_from || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, effective_from: e.target.value }))}
              />
            </Field>

            <Field label="Filer Status">
              <Select
                value={formData.filer_status || 'non_filer'}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, filer_status: val as any }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active_filer">Active Filer</SelectItem>
                  <SelectItem value="non_filer">Non-Filer</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Checkboxes — own full-width row, evenly spaced, same height */}
            <div className="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <CheckboxField
                id="is_filer_create"
                label="Is Filer"
                checked={formData.is_filer}
                onCheckedChange={(c) => setFormData((prev) => ({ ...prev, is_filer: c }))}
              />
              <CheckboxField
                id="eobi_applicable_create"
                label="EOBI Applicable"
                checked={formData.eobi_applicable}
                onCheckedChange={(c) => setFormData((prev) => ({ ...prev, eobi_applicable: c }))}
              />
              <CheckboxField
                id="ss_applicable_create"
                label="SS Applicable"
                checked={formData.social_security_applicable}
                onCheckedChange={(c) => setFormData((prev) => ({ ...prev, social_security_applicable: c }))}
              />
              <CheckboxField
                id="pf_applicable_create"
                label="PF Applicable"
                checked={formData.provident_fund_applicable}
                onCheckedChange={(c) => setFormData((prev) => ({ ...prev, provident_fund_applicable: c }))}
              />
              <CheckboxField
                id="gratuity_applicable_create"
                label="Gratuity Applicable"
                checked={formData.gratuity_applicable}
                onCheckedChange={(c) => setFormData((prev) => ({ ...prev, gratuity_applicable: c }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCreate} disabled={createProfile.isPending}>
              {createProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ──────────────────────────────────── */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProfile?.has_statutory_profile ? 'Edit' : 'Create'} Profile</DialogTitle>
            <DialogDescription>{selectedProfile?.employee_name}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <Field label="Province">
              <Input value={selectedProfile?.state?.name || '—'} disabled className="bg-gray-50" />
            </Field>

            <Field label="CNIC (13 digits)">
              <Input
                value={formData.cnic || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, cnic: e.target.value }))}
                maxLength={13}
              />
            </Field>

            <Field label="NTN">
              <Input
                value={formData.ntn || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, ntn: e.target.value }))}
              />
            </Field>

            <Field label="EOBI Number">
              <Input
                value={formData.eobi_number || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, eobi_number: e.target.value }))}
              />
            </Field>

            <Field label="Social Security Number">
              <Input
                value={formData.ss_number || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, ss_number: e.target.value }))}
              />
            </Field>

            <Field label="Filer Status">
              <Select
                value={formData.filer_status || 'non_filer'}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, filer_status: val as any }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active_filer">Active Filer</SelectItem>
                  <SelectItem value="non_filer">Non-Filer</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <CheckboxField
                id="is_filer_edit"
                label="Is Filer"
                checked={formData.is_filer}
                onCheckedChange={(c) => setFormData((prev) => ({ ...prev, is_filer: c }))}
              />
              <CheckboxField
                id="eobi_applicable_edit"
                label="EOBI Applicable"
                checked={formData.eobi_applicable}
                onCheckedChange={(c) => setFormData((prev) => ({ ...prev, eobi_applicable: c }))}
              />
              <CheckboxField
                id="ss_applicable_edit"
                label="SS Applicable"
                checked={formData.social_security_applicable}
                onCheckedChange={(c) => setFormData((prev) => ({ ...prev, social_security_applicable: c }))}
              />
              <CheckboxField
                id="pf_applicable_edit"
                label="PF Applicable"
                checked={formData.provident_fund_applicable}
                onCheckedChange={(c) => setFormData((prev) => ({ ...prev, provident_fund_applicable: c }))}
              />
              <CheckboxField
                id="gratuity_applicable_edit"
                label="Gratuity Applicable"
                checked={formData.gratuity_applicable}
                onCheckedChange={(c) => setFormData((prev) => ({ ...prev, gratuity_applicable: c }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUpdate} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Transfer Province Modal ──────────────────────── */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transfer Province</DialogTitle>
            <DialogDescription>Transfer employee to a new province.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <Field label="New Work Location" required>
              <Select
                value={transferData.new_work_location_id || ''}
                onValueChange={(val) => setTransferData((prev) => ({ ...prev, new_work_location_id: val }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select work location">
                    {transferData.new_work_location_id ? getBranchLabel(transferData.new_work_location_id) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch: any) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="New Province" required>
              <Select
                value={transferData.new_state_id ? transferData.new_state_id.toString() : ''}
                onValueChange={(val) => setTransferData((prev) => ({ ...prev, new_state_id: parseInt(val) }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select province">
                    {transferData.new_state_id ? getStateLabel(transferData.new_state_id) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Effective From" required>
              <Input
                type="date"
                value={transferData.effective_from}
                onChange={(e) => setTransferData((prev) => ({ ...prev, effective_from: e.target.value }))}
              />
            </Field>

            <Field label="Transfer Reason">
              <Input
                value={transferData.transfer_reason}
                onChange={(e) => setTransferData((prev) => ({ ...prev, transfer_reason: e.target.value }))}
                placeholder="Optional"
              />
            </Field>

            <div className={cn('sm:col-span-2', transferData.requires_new_ss_registration ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : '')}>
              <div className="flex items-center h-9">
                <CheckboxField
                  id="requires_new_ss"
                  label="Requires New SS Registration"
                  checked={transferData.requires_new_ss_registration}
                  onCheckedChange={(c) => setTransferData((prev) => ({ ...prev, requires_new_ss_registration: c }))}
                />
              </div>

              {transferData.requires_new_ss_registration && (
                <Field label="New SS Scheme">
                  <Select
                    value={transferData.new_ss_scheme || ''}
                    onValueChange={(val) => setTransferData((prev) => ({ ...prev, new_ss_scheme: val }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PESSI">PESSI</SelectItem>
                      <SelectItem value="SESSI">SESSI</SelectItem>
                      <SelectItem value="KP-ESSI">KP-ESSI</SelectItem>
                      <SelectItem value="B-ESSI">B-ESSI</SelectItem>
                      <SelectItem value="ICT">ICT</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>

            <Field label="Notes" className="sm:col-span-2">
              <Input
                value={transferData.notes}
                onChange={(e) => setTransferData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional"
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTransfer} disabled={transferProvince.isPending}>
              {transferProvince.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── History Modal ────────────────────────────────── */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Province Transfer History</DialogTitle>
            <DialogDescription>History of province transfers for this employee.</DialogDescription>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No transfer history found.</div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2.5 px-4 font-semibold text-gray-700 whitespace-nowrap">From</th>
                      <th className="text-left py-2.5 px-4 font-semibold text-gray-700 whitespace-nowrap">To</th>
                      <th className="text-left py-2.5 px-4 font-semibold text-gray-700 whitespace-nowrap">Effective From</th>
                      <th className="text-left py-2.5 px-4 font-semibold text-gray-700 whitespace-nowrap">Reason</th>
                      <th className="text-left py-2.5 px-4 font-semibold text-gray-700 whitespace-nowrap">Transferred By</th>
                      <th className="text-left py-2.5 px-4 font-semibold text-gray-700 whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((h: ProfileHistory) => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-4 whitespace-nowrap">{h.from_state_name}</td>
                        <td className="py-2.5 px-4 whitespace-nowrap">{h.to_state_name}</td>
                        <td className="py-2.5 px-4 whitespace-nowrap">{h.effective_from}</td>
                        <td className="py-2.5 px-4">{h.transfer_reason || '—'}</td>
                        <td className="py-2.5 px-4 whitespace-nowrap">{h.transferred_by || '—'}</td>
                        <td className="py-2.5 px-4 whitespace-nowrap">{h.transferred_at ? new Date(h.transferred_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}