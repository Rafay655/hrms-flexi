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
  FileText,
  CheckCircle2,
  RefreshCw,
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
import type { LedgerEntry } from '@/types/ledger.types';
import {
  useLedger,
  useMarkIncluded,
  useMarkRemitted,
  useReconcile,
  useAdjust,
  useReverse,
  useUploadChallan,
} from '@/hooks/useLedger';
import { useStates } from '@/hooks/useStates';
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

// ── Static options ────────────────────────────────────
const CONTRIBUTION_TYPES = [
  { value: 'eobi_employee', label: 'EOBI Employee' },
  { value: 'eobi_employer', label: 'EOBI Employer' },
  { value: 'pessi_employee', label: 'PESSI Employee' },
  { value: 'pessi_employer', label: 'PESSI Employer' },
  { value: 'sessi_employee', label: 'SESSI Employee' },
  { value: 'sessi_employer', label: 'SESSI Employer' },
  { value: 'fbr_tax', label: 'FBR Tax' },
  { value: 'professional_tax', label: 'Professional Tax' },
  { value: 'wwf', label: 'WWF' },
  { value: 'wppf', label: 'WPPF' },
  { value: 'gratuity_provision', label: 'Gratuity Provision' },
];

const REMITTANCE_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'included_in_challan', label: 'Included in Challan' },
  { value: 'remitted', label: 'Remitted' },
  { value: 'reconciled', label: 'Reconciled' },
  { value: 'adjusted', label: 'Adjusted' },
  { value: 'reversed', label: 'Reversed' },
];

// ── Status badge helper ──────────────────────────────
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    case 'included_in_challan':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Included</Badge>;
    case 'remitted':
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Remitted</Badge>;
    case 'reconciled':
      return <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Reconciled</Badge>;
    case 'adjusted':
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Adjusted</Badge>;
    case 'reversed':
      return <Badge variant="destructive">Reversed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Columns whose header shouldn't get sort-cursor / click styling (utility columns)
const NON_SORTABLE_COLUMN_IDS = new Set(['select', 'actions']);
// Columns whose header + cell content should be centered rather than left-aligned
const CENTERED_COLUMN_IDS = new Set(['select', 'actions']);
// Columns holding monetary values — right-aligned like a ledger/spreadsheet
const NUMERIC_COLUMN_IDS = new Set(['employee_amount', 'employer_amount', 'total_amount']);

// ── Main Component ────────────────────────────────────
export default function LedgerPage() {
  // ── Query params ────────────────────────────────────
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  // ── Filters ─────────────────────────────────────────
  const [filters, setFilters] = useState({
    contribution_type: '',
    remittance_status: '',
    state_id: '',
    payroll_month: '',
    payroll_year: '',
    employee_uuid: '',
    challan_no: '',
    is_locked: '',
  });

  // ── Fetch lookup data ──────────────────────────────
  const { data: statesData } = useStates({ country_id: 167, per_page: 1000 });
  const states = statesData?.data || [];
  const employees = useEmployees({ per_page: 1000, detailed: 0 });
  const employeeList = Array.isArray(employees) ? employees : employees?.data || [];

  // ── Fetch ledger entries ────────────────────────────
  const { data: ledgerData, isLoading, error, refetch } = useLedger({
    page,
    per_page: perPage,
    contribution_type: filters.contribution_type || undefined,
    remittance_status: filters.remittance_status || undefined,
    state_id: filters.state_id ? parseInt(filters.state_id) : undefined,
    payroll_month: filters.payroll_month ? parseInt(filters.payroll_month) : undefined,
    payroll_year: filters.payroll_year ? parseInt(filters.payroll_year) : undefined,
    employee_uuid: filters.employee_uuid || undefined,
    challan_no: filters.challan_no || undefined,
    is_locked: filters.is_locked === '' ? undefined : filters.is_locked === 'true',
  });

  // ── Extract data ────────────────────────────────────
  const entries = Array.isArray(ledgerData?.data) ? ledgerData.data : [];
  const totalEntries = ledgerData?.meta?.total ?? 0;
  const totalPages = ledgerData?.meta?.last_page ?? 1;

  // ── Mutations ───────────────────────────────────────
  const markIncluded = useMarkIncluded();
  const markRemitted = useMarkRemitted();
  const reconcile = useReconcile();
  const adjust = useAdjust();
  const reverse = useReverse();
  const uploadChallan = useUploadChallan();

  // ── State for selections and modals ─────────────────
  const [selectedUuids, setSelectedUuids] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // ── Modal states ─────────────────────────────────────
  const [isRemittedModalOpen, setIsRemittedModalOpen] = useState(false);
  const [remittedData, setRemittedData] = useState({ challan_no: '', payment_date: '' });

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({ employee_amount: 0, employer_amount: 0, reason: '' });
  const [adjustUuid, setAdjustUuid] = useState<string | null>(null);

  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [reverseData, setReverseData] = useState({ reason: '' });
  const [reverseUuid, setReverseUuid] = useState<string | null>(null);

  const [isChallanModalOpen, setIsChallanModalOpen] = useState(false);
  const [challanData, setChallanData] = useState({ challan_no: '', description: '' });
  const [challanFile, setChallanFile] = useState<File | null>(null);
  const [challanUuid, setChallanUuid] = useState<string | null>(null);

  // ── Reset page on filter change ─────────────────────
  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, filters]);

  // ── Handlers ────────────────────────────────────────
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  const toggleSelect = (uuid: string) => {
    setSelectedUuids((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUuids([]);
    } else {
      setSelectedUuids(entries.map((e) => e.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkAction = (action: 'included' | 'remitted' | 'reconcile') => {
    if (selectedUuids.length === 0) {
      toast.error('Please select at least one entry.');
      return;
    }
    if (action === 'included') {
      markIncluded.mutate({ ledger_uuids: selectedUuids }, {
        onSuccess: () => {
          toast.success('Entries marked as included in challan.');
          setSelectedUuids([]);
          setSelectAll(false);
        },
        onError: (err: any) => showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to mark included.' }),
      });
    } else if (action === 'reconcile') {
      reconcile.mutate({ ledger_uuids: selectedUuids }, {
        onSuccess: () => {
          toast.success('Entries reconciled.');
          setSelectedUuids([]);
          setSelectAll(false);
        },
        onError: (err: any) => showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to reconcile.' }),
      });
    } else if (action === 'remitted') {
      setIsRemittedModalOpen(true);
    }
  };

  const handleMarkRemitted = () => {
    if (!remittedData.challan_no || !remittedData.payment_date) {
      toast.error('Please fill in both challan number and payment date.');
      return;
    }
    markRemitted.mutate({
      ledger_uuids: selectedUuids,
      challan_no: remittedData.challan_no,
      payment_date: remittedData.payment_date,
    }, {
      onSuccess: () => {
        toast.success('Entries marked as remitted.');
        setSelectedUuids([]);
        setSelectAll(false);
        setIsRemittedModalOpen(false);
        setRemittedData({ challan_no: '', payment_date: '' });
      },
      onError: (err: any) => showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to mark remitted.' }),
    });
  };

  const handleAdjust = () => {
    if (!adjustUuid) return;
    if (!adjustData.reason) {
      toast.error('Please provide a reason for adjustment.');
      return;
    }
    adjust.mutate({
      ledger_uuid: adjustUuid,
      employee_amount: adjustData.employee_amount,
      employer_amount: adjustData.employer_amount,
      reason: adjustData.reason,
    }, {
      onSuccess: () => {
        toast.success('Adjustment entry created.');
        setIsAdjustModalOpen(false);
        setAdjustUuid(null);
        setAdjustData({ employee_amount: 0, employer_amount: 0, reason: '' });
      },
      onError: (err: any) => showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to adjust.' }),
    });
  };

  const handleReverse = () => {
    if (!reverseUuid) return;
    if (!reverseData.reason) {
      toast.error('Please provide a reason for reversal.');
      return;
    }
    reverse.mutate({
      ledger_uuid: reverseUuid,
      reason: reverseData.reason,
    }, {
      onSuccess: () => {
        toast.success('Reversal entry created.');
        setIsReverseModalOpen(false);
        setReverseUuid(null);
        setReverseData({ reason: '' });
      },
      onError: (err: any) => showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to reverse.' }),
    });
  };

  const handleUploadChallan = () => {
    if (!challanUuid) return;
    if (!challanFile) {
      toast.error('Please select a file.');
      return;
    }
    if (!challanData.challan_no) {
      toast.error('Please enter challan number.');
      return;
    }
    uploadChallan.mutate({
      ledger_uuid: challanUuid,
      challan_file: challanFile,
      challan_no: challanData.challan_no,
      description: challanData.description || undefined,
    }, {
      onSuccess: () => {
        toast.success('Challan uploaded.');
        setIsChallanModalOpen(false);
        setChallanUuid(null);
        setChallanFile(null);
        setChallanData({ challan_no: '', description: '' });
      },
      onError: (err: any) => showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to upload challan.' }),
    });
  };

  // ── Columns ──────────────────────────────────────────
  const columns: ColumnDef<LedgerEntry & { sr: number }>[] = useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={selectAll}
              onCheckedChange={toggleSelectAll}
              disabled={entries.length === 0}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={selectedUuids.includes(row.original.id)}
              onCheckedChange={() => toggleSelect(row.original.id)}
              disabled={row.original.is_immutable || row.original.remittance_status === 'reversed'}
            />
          </div>
        ),
      },
      {
        accessorKey: 'sr',
        header: 'SR. NO.',
        cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.sr}</div>,
      },
      {
        accessorKey: 'employee_name',
        header: 'EMPLOYEE',
        cell: ({ row }) => <span>{row.original.employee_name}</span>,
      },
      {
        accessorKey: 'contribution_type',
        header: 'TYPE',
        cell: ({ row }) => {
          const label = CONTRIBUTION_TYPES.find((t) => t.value === row.original.contribution_type)?.label || row.original.contribution_type;
          return <Badge variant="secondary" className="capitalize whitespace-nowrap">{label}</Badge>;
        },
      },
      {
        accessorKey: 'employee_amount',
        header: 'EMPLOYEE AMOUNT',
        cell: ({ row }) => <span className="font-mono tabular-nums">{parseFloat(row.original.employee_amount).toLocaleString()}</span>,
      },
      {
        accessorKey: 'employer_amount',
        header: 'EMPLOYER AMOUNT',
        cell: ({ row }) => <span className="font-mono tabular-nums">{parseFloat(row.original.employer_amount).toLocaleString()}</span>,
      },
    //   {
    //     accessorKey: 'total_amount',
    //     header: 'TOTAL',
    //     cell: ({ row }) => <span className="font-mono tabular-nums font-bold">{parseFloat(row.original.total_amount).toLocaleString()}</span>,
    //   },
    //   {
    //     accessorKey: 'remittance_status',
    //     header: 'STATUS',
    //     cell: ({ row }) => getStatusBadge(row.original.remittance_status),
    //   },
    //   {
    //     accessorKey: 'challan_no',
    //     header: 'CHALLAN NO',
    //     cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.challan_no || '—'}</span>,
    //   },
      {
        accessorKey: 'created_at',
        header: 'CREATED',
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—'}</span>
        ),
      },
      {
        id: 'actions',
        header: 'ACTIONS',
        cell: ({ row }) => {
          const entry = row.original;
          const isImmutable = entry.is_immutable || entry.remittance_status === 'reversed' || entry.remittance_status === 'adjusted';
          return (
            <div className="flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isImmutable && (
                    <>
                      <DropdownMenuItem
                        onClick={() => {
                          setIsAdjustModalOpen(true);
                          setAdjustUuid(entry.id);
                          setAdjustData({ employee_amount: 0, employer_amount: 0, reason: '' });
                        }}
                      >
                        Adjust
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setIsReverseModalOpen(true);
                          setReverseUuid(entry.id);
                          setReverseData({ reason: '' });
                        }}
                      >
                        Reverse
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setIsChallanModalOpen(true);
                          setChallanUuid(entry.id);
                          setChallanFile(null);
                          setChallanData({ challan_no: '', description: '' });
                        }}
                      >
                        Upload Challan
                      </DropdownMenuItem>
                    </>
                  )}
                  {entry.challan_document_id && (
                    <DropdownMenuItem>View Challan</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [selectedUuids, selectAll, entries]
  );

  // ── Table Data ──────────────────────────────────────
  const rowsWithSr = useMemo(() => {
    if (!Array.isArray(entries)) return [];
    const start = (page - 1) * perPage;
    return entries.map((entry, idx) => ({
      ...entry,
      sr: start + idx + 1,
    }));
  }, [entries, page, perPage]);

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

  const isLoadingData = isLoading;

  // ── UI ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Failed to load ledger entries. Please try again.</div>
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
                Contribution Ledger
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} entries • Track contributions and remittances
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-blue-900 hover:bg-blue-50"
              >
                <FileText className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Contribution Type</label>
              <Select
                value={filters.contribution_type || 'all'}
                onValueChange={(val) => handleFilterChange('contribution_type', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {CONTRIBUTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Status</label>
              <Select
                value={filters.remittance_status || 'all'}
                onValueChange={(val) => handleFilterChange('remittance_status', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {REMITTANCE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">State</label>
              <Select
                value={filters.state_id || 'all'}
                onValueChange={(val) => handleFilterChange('state_id', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Payroll Month</label>
              <Input
                type="number"
                min="1"
                max="12"
                value={filters.payroll_month}
                onChange={(e) => handleFilterChange('payroll_month', e.target.value)}
                placeholder="1-12"
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Payroll Year</label>
              <Input
                type="number"
                value={filters.payroll_year}
                onChange={(e) => handleFilterChange('payroll_year', e.target.value)}
                placeholder="e.g. 2026"
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Employee</label>
              <Select
                value={filters.employee_uuid || 'all'}
                onValueChange={(val) => handleFilterChange('employee_uuid', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employeeList.map((emp: any) => (
                    <SelectItem key={emp.uuid} value={emp.uuid}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Challan No</label>
              <Input
                value={filters.challan_no}
                onChange={(e) => handleFilterChange('challan_no', e.target.value)}
                placeholder="Search by challan"
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Locked</label>
              <Select
                value={filters.is_locked || 'all'}
                onValueChange={(val) => handleFilterChange('is_locked', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Locked</SelectItem>
                  <SelectItem value="false">Unlocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search — own row so its icon aligns cleanly regardless of the filter labels above */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Search</label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by employee, challan, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#1E1B4B] focus:ring-[#1E1B4B]"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap items-center gap-2 mb-4 min-h-9">
            <span className="text-sm font-medium" style={{ color: '#49426E' }}>
              {selectedUuids.length} selected
            </span>
            {selectedUuids.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('included')}
                  disabled={markIncluded.isPending}
                >
                  {markIncluded.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                  Mark Included
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('remitted')}
                  disabled={markRemitted.isPending}
                >
                  {markRemitted.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                  Mark Remitted
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('reconcile')}
                  disabled={reconcile.isPending}
                >
                  {reconcile.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                  Reconcile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSelectedUuids([]); setSelectAll(false); }}
                >
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              </>
            )}
          </div>

          {/* Stats Bar */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
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
                      {headerGroup.headers.map((header) => {
                        const columnId = header.column.id;
                        const isSortable = !NON_SORTABLE_COLUMN_IDS.has(columnId);
                        const isCentered = CENTERED_COLUMN_IDS.has(columnId);
                        const isNumeric = NUMERIC_COLUMN_IDS.has(columnId);
                        return (
                          <th
                            key={header.id}
                            className={cn(
                              'py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap',
                              isCentered ? 'text-center' : isNumeric ? 'text-right' : 'text-left',
                              isSortable && 'cursor-pointer hover:bg-gray-100 transition-colors'
                            )}
                            onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                          >
                            <div
                              className={cn(
                                'flex items-center gap-1',
                                isCentered ? 'justify-center' : isNumeric ? 'justify-end' : 'justify-start'
                              )}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoadingData ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">Loading entries...</p>
                      </td>
                    </tr>
                  ) : rowsWithSr.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center">
                        <div className="text-gray-500">
                          <p className="font-medium">No entries found</p>
                          <p className="text-sm mt-1">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors group">
                        {row.getVisibleCells().map((cell) => {
                          const columnId = cell.column.id;
                          const isNumeric = NUMERIC_COLUMN_IDS.has(columnId);
                          return (
                            <td
                              key={cell.id}
                              className={cn(
                                'py-4 px-6 text-sm align-middle',
                                isNumeric && 'text-right'
                              )}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          );
                        })}
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
                  <div className="text-sm text-gray-600 order-1 md:order-none">
                    Page <span className="font-semibold text-gray-900">{page}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2 order-3 md:order-none">
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
                    <div className="flex items-center gap-1 mx-2">
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
                              'min-w-9',
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
                  <div className="text-sm text-gray-600 order-2 md:order-none">
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

      {/* ── Mark Remitted Modal ──────────────────────────── */}
      <Dialog open={isRemittedModalOpen} onOpenChange={setIsRemittedModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Remitted</DialogTitle>
            <DialogDescription>
              Enter challan details for {selectedUuids.length} selected entries.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Challan No *</label>
              <Input
                value={remittedData.challan_no}
                onChange={(e) => setRemittedData({ ...remittedData, challan_no: e.target.value })}
                placeholder="e.g. CH-001"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Payment Date *</label>
              <Input
                type="date"
                value={remittedData.payment_date}
                onChange={(e) => setRemittedData({ ...remittedData, payment_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemittedModalOpen(false)}>Cancel</Button>
            <Button onClick={handleMarkRemitted} disabled={markRemitted.isPending}>
              {markRemitted.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Mark Remitted
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Adjust Modal ──────────────────────────────────── */}
      <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Entry</DialogTitle>
            <DialogDescription>
              Create an adjustment entry to correct the amounts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Employee Amount</label>
              <Input
                type="number"
                step="0.01"
                value={adjustData.employee_amount}
                onChange={(e) => setAdjustData({ ...adjustData, employee_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Employer Amount</label>
              <Input
                type="number"
                step="0.01"
                value={adjustData.employer_amount}
                onChange={(e) => setAdjustData({ ...adjustData, employer_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Reason *</label>
              <Input
                value={adjustData.reason}
                onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                placeholder="e.g. Correction"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjust} disabled={adjust.isPending}>
              {adjust.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reverse Modal ──────────────────────────────────── */}
      <Dialog open={isReverseModalOpen} onOpenChange={setIsReverseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reverse Entry</DialogTitle>
            <DialogDescription>
              Create a reversal entry to cancel this entry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Reason *</label>
              <Input
                value={reverseData.reason}
                onChange={(e) => setReverseData({ ...reverseData, reason: e.target.value })}
                placeholder="e.g. Employee terminated"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReverseModalOpen(false)}>Cancel</Button>
            <Button onClick={handleReverse} disabled={reverse.isPending}>
              {reverse.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Reversal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Upload Challan Modal ──────────────────────────── */}
      <Dialog open={isChallanModalOpen} onOpenChange={setIsChallanModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Challan</DialogTitle>
            <DialogDescription>
              Upload a challan document for this entry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Challan No *</label>
              <Input
                value={challanData.challan_no}
                onChange={(e) => setChallanData({ ...challanData, challan_no: e.target.value })}
                placeholder="e.g. CH-001"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Challan File *</label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setChallanFile(file);
                }}
              />
              <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max 10MB)</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Description (optional)</label>
              <Input
                value={challanData.description}
                onChange={(e) => setChallanData({ ...challanData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChallanModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUploadChallan} disabled={uploadChallan.isPending}>
              {uploadChallan.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}