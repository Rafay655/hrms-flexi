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
  Eye,
  MoreVertical,
  FileText,
  RefreshCw,
  Send,
  Archive,
  FileDown,
  Printer,
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
import type { TaxCertificate } from '@/types/tax-certificate.types';
import {
  useTaxCertificates,
  useTaxCertificate,
  useGenerateCertificate,
  useBulkGenerateCertificate,
} from '@/hooks/useTaxCertificates';
import { useTaxYears } from '@/hooks/useTaxYears';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { useCompanies } from '@/hooks/useCompanies';

// ── PDF Components ─────────────────────────────────────
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { TaxCertificatePDF } from '@/components/TaxCertificatePDF';

// ── Debounce hook ─────────────────────────────────────
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Status Badge helper ──────────────────────────────
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'generated':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Generated</Badge>;
    case 'published':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>;
    case 'archived':
      return <Badge variant="secondary">Archived</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">Draft</Badge>;
  }
};

// ── Main Component ────────────────────────────────────
const TaxCertificatesPage: React.FC = () => {
  // ── Query params ────────────────────────────────────
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  // ── Filters ─────────────────────────────────────────
  const [filters, setFilters] = useState({
    tax_year_id: '',
    status: '',
    employee_uuid: '',
    department: '',
    legal_entity_id: '',
  });

  // ── Fetch lookup data ──────────────────────────────
  const { data: taxYears } = useTaxYears();
  const employees = useEmployees({ per_page: 1000, detailed: 0 });
  const employeeList = Array.isArray(employees) ? employees : employees?.data || [];

  const { data: departmentsData } = useDepartments({ per_page: 1000 });
  const departments = departmentsData?.data || [];

  const { companies } = useCompanies({ per_page: 1000 });

  // ── Fetch certificates ─────────────────────────────
  const { data, isLoading, error, refetch } = useTaxCertificates({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    tax_year_id: filters.tax_year_id || undefined,
    status: filters.status || undefined,
    employee_uuid: filters.employee_uuid || undefined,
    department: filters.department || undefined,
    legal_entity_id: filters.legal_entity_id || undefined,
  });

  const certificates = data?.data ?? [];
  const meta = data?.meta;
  const totalEntries = meta?.total ?? 0;
  const totalPages = meta?.last_page ?? 1;

  // ── Mutations ───────────────────────────────────────
  const generateMutation = useGenerateCertificate();
  const bulkGenerateMutation = useBulkGenerateCertificate();

  // ── State for modals ────────────────────────────────
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedCertificateUuid, setSelectedCertificateUuid] = useState<string | null>(null);
  const [isBulkGenerateOpen, setIsBulkGenerateOpen] = useState(false);
  const [bulkTaxYearId, setBulkTaxYearId] = useState('');

  // ── Fetch certificate detail for preview ────────────
  const { data: certificateDetail, isLoading: detailLoading } = useTaxCertificate(
    selectedCertificateUuid || ''
  );

  // ── Reset page on filter change ─────────────────────
  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, filters]);

  // ── Handlers ────────────────────────────────────────
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleViewCertificate = (uuid: string) => {
    setSelectedCertificateUuid(uuid);
    setIsPreviewOpen(true);
  };

  const handleGenerateSingle = async (employeeUuid: string, taxYearId: string) => {
    try {
      await generateMutation.mutateAsync({ employee_uuid: employeeUuid, tax_year_id: taxYearId });
      toast.success('Certificate generated.');
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to generate certificate.' });
    }
  };

  const handleBulkGenerate = async () => {
    if (!bulkTaxYearId) {
      toast.error('Please select a tax year.');
      return;
    }
    try {
      const res = await bulkGenerateMutation.mutateAsync({ tax_year_id: bulkTaxYearId });
      toast.success(`Bulk generation complete: ${res.data.data.generated} generated, ${res.data.data.skipped} skipped.`);
      setIsBulkGenerateOpen(false);
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to bulk generate.' });
    }
  };

  // ── Columns ──────────────────────────────────────────
  const columns: ColumnDef<TaxCertificate & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: 'sr',
        header: 'SR. NO.',
        cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.sr}</div>,
      },
      {
        accessorKey: 'employee_name',
        header: 'EMPLOYEE',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.employee_name}</div>
            <div className="text-xs text-muted-foreground">{row.original.employee_uuid}</div>
          </div>
        ),
      },
      {
        accessorKey: 'tax_year_label',
        header: 'TAX YEAR',
        cell: ({ row }) => <span>{row.original.tax_year_label}</span>,
      },
      {
        accessorKey: 'total_taxable_income',
        header: 'TAXABLE INCOME',
        cell: ({ row }) => (
          <span className="font-mono">
            {row.original.total_taxable_income.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'total_tax_deducted',
        header: 'TAX DEDUCTED',
        cell: ({ row }) => (
          <span className="font-mono">
            {row.original.total_tax_deducted.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'certificate_number',
        header: 'CERTIFICATE NO.',
        cell: ({ row }) => <span className="font-mono">{row.original.certificate_number}</span>,
      },
      {
        accessorKey: 'generated_at',
        header: 'GENERATED AT',
        cell: ({ row }) => (
          <span>{row.original.generated_at ? new Date(row.original.generated_at).toLocaleDateString() : '—'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'STATUS',
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        id: 'actions',
        header: () => <div className="mx-auto">ACTIONS</div>,
        cell: ({ row }) => {
          const cert = row.original;
          return (
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleViewCertificate(cert.id)}
                title="View/Download"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewCertificate(cert.id)}>
                    <FileText className="mr-2 h-3.5 w-3.5" /> View PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleGenerateSingle(cert.employee_uuid, cert.tax_year_id)}
                    disabled={generateMutation.isPending}
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" /> Regenerate
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Send className="mr-2 h-3.5 w-3.5" /> Publish to ESS
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="mr-2 h-3.5 w-3.5" /> Archive to DMS
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

  // ── Table Data ──────────────────────────────────────
  const rowsWithSr = useMemo(() => {
    const start = (page - 1) * perPage;
    return certificates.map((cert, idx) => ({
      ...cert,
      sr: start + idx + 1,
    }));
  }, [certificates, page, perPage]);

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
        <div className="text-red-600">Failed to load certificates. Please try again.</div>
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
                Tax Certificates
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} certificates • Generate and manage annual tax certificates
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
                onClick={() => setIsBulkGenerateOpen(true)}
                disabled={bulkGenerateMutation.isPending}
              >
                <FileText className="h-4 w-4" />
                Bulk Generate
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {/* Tax Year */}
            <div>
              <label className="text-xs font-medium">Tax Year</label>
              <Select
                value={filters.tax_year_id || 'all'}
                onValueChange={(val) => handleFilterChange('tax_year_id', val === 'all' ? '' : val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {taxYears?.map((ty) => (
                    <SelectItem key={ty.id} value={ty.id}>
                      {ty.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employee */}
            <div>
              <label className="text-xs font-medium">Employee</label>
              <Select
                value={filters.employee_uuid || 'all'}
                onValueChange={(val) => handleFilterChange('employee_uuid', val === 'all' ? '' : val)}
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

            {/* Department */}
            <div>
              <label className="text-xs font-medium">Department</label>
              <Select
                value={filters.department || 'all'}
                onValueChange={(val) => handleFilterChange('department', val === 'all' ? '' : val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Legal Entity */}
            <div>
              <label className="text-xs font-medium">Legal Entity</label>
              <Select
                value={filters.legal_entity_id || 'all'}
                onValueChange={(val) => handleFilterChange('legal_entity_id', val === 'all' ? '' : val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by employee, certificate number..."
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
                        <p className="text-gray-500 mt-2">Loading certificates...</p>
                      </td>
                    </tr>
                  ) : rowsWithSr.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center">
                        <div className="text-gray-500">
                          <p className="font-medium">No certificates found</p>
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

      {/* ── PDF Preview Modal ─────────────────────────────── */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tax Certificate</DialogTitle>
            <DialogDescription>
              {certificateDetail?.certificate_number || 'Certificate preview'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {detailLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : certificateDetail ? (
              <div className="space-y-4">
                {/* Quick actions */}
                <div className="flex gap-2">
                  <PDFDownloadLink
                    document={<TaxCertificatePDF data={certificateDetail} />}
                    fileName={`${certificateDetail.certificate_number}.pdf`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E1B4B] text-white rounded-md hover:bg-[#2A2675] transition-colors"
                  >
                    {({ loading }) => (
                      <>
                        <FileDown className="h-4 w-4" />
                        {loading ? 'Preparing PDF...' : 'Download PDF'}
                      </>
                    )}
                  </PDFDownloadLink>
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Print
                  </Button>
                </div>

                {/* PDF Viewer */}
                <div className="border rounded-lg overflow-hidden" style={{ height: '70vh' }}>
                  <PDFViewer width="100%" height="100%">
                    <TaxCertificatePDF data={certificateDetail} />
                  </PDFViewer>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">Certificate not found.</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Generate Dialog ──────────────────────────── */}
      <Dialog open={isBulkGenerateOpen} onOpenChange={setIsBulkGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Generate Certificates</DialogTitle>
            <DialogDescription>
              Generate certificates for all eligible employees for the selected tax year.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-1">Tax Year *</label>
            <Select
              value={bulkTaxYearId}
              onValueChange={setBulkTaxYearId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select tax year" />
              </SelectTrigger>
              <SelectContent>
                {taxYears?.map((ty) => (
                  <SelectItem key={ty.id} value={ty.id}>
                    {ty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkGenerateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkGenerate}
              disabled={bulkGenerateMutation.isPending}
            >
              {bulkGenerateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaxCertificatesPage;