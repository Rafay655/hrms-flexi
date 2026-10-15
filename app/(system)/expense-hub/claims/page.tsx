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
  FileText,
  Loader2,
  Calendar,
  Wallet,
  Clock,
  Receipt,
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
import { CLAIM_STATUS_LABEL, claimStatusTone, pkr } from '@/lib/expense-hub';
import { useExpenseList } from '@/lib/use-expense-list';
import type { ClaimType, ClaimLinePayload, ExpenseClaim } from '@/types/expense-hub';

// ── Status & Type option constants ──────────────────
const STATUS_OPTIONS = (Object.keys(CLAIM_STATUS_LABEL) as (keyof typeof CLAIM_STATUS_LABEL)[]).map((k) => ({
  value: k,
  label: CLAIM_STATUS_LABEL[k],
}));
const TYPE_OPTIONS = [
  { value: 'regular', label: 'Regular' },
  { value: 'travel', label: 'Travel' },
  { value: 'medical', label: 'Medical' },
  { value: 'project_based', label: 'Project-based' },
];

// ── Draft line type ──────────────────────────────────
interface DraftLine {
  category_id: string;
  expense_date: string;
  description: string;
  amount_claimed: string;
  payment_method: ClaimLinePayload['payment_method'];
}

const emptyLine = (): DraftLine => ({
  category_id: '',
  expense_date: new Date().toISOString().slice(0, 10),
  description: '',
  amount_claimed: '',
  payment_method: 'cash',
});

// Small helper for consistently-styled section labels inside the form
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </Label>
  );
}

// ── Main Component ──────────────────────────────────
export default function ClaimsListPage() {
  const queryClient = useQueryClient();

  const {
    items: claims,
    meta,
    isLoading,
    isFetching,
    isError,
    search,
    setSearch,
    setPage,
    resetPage,
  } = useExpenseList(['expense-hub', 'claims'], expenseHubService.getClaims, {
    filters: {},
  });

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // ── Categories ───────────────────────────────────
  const { data: catData } = useQuery({
    queryKey: ['expense-hub', 'categories', 'active'],
    queryFn: () => expenseHubService.getCategories({ active_only: 1, per_page: 200 }),
    staleTime: 60_000,
  });
  const categories = catData?.items ?? [];

  // ── Employees (for dropdown) ─────────────────────
  const { data: employeesData } = useEmployees({ per_page: 1000, detailed: 0 });
  const employees = employeesData ?? [];

  // ── Modal states ────────────────────────────────
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isReimburseDialogOpen, setIsReimburseDialogOpen] = useState(false);

  const [selectedClaim, setSelectedClaim] = useState<ExpenseClaim | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // ── Form state ──────────────────────────────────
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<ClaimType>('regular');
  const [formEmployeeUuid, setFormEmployeeUuid] = useState<string>('');   // store selected employee UUID
  const [formLines, setFormLines] = useState<DraftLine[]>([emptyLine()]);

  // Schedule month state
  const [scheduleMonth, setScheduleMonth] = useState(new Date().toISOString().slice(0, 7));

  // Total claimed amount
  const totalClaimed = useMemo(
    () => formLines.reduce((sum, l) => sum + (parseFloat(l.amount_claimed) || 0), 0),
    [formLines],
  );

  // ── Fetch claim detail for edit/view ────────────
  const { data: editClaim } = useQuery({
    queryKey: ['expense-hub', 'claim', selectedClaim?.uuid],
    queryFn: () => expenseHubService.getClaim(selectedClaim!.uuid),
    enabled: !!selectedClaim?.uuid && (isEditMode || isViewModalOpen),
  });

  // ── Populate form when editing ──────────────────
  useEffect(() => {
    if (editClaim && isEditMode) {
      setFormTitle(editClaim.title);
      setFormType(editClaim.claim_type);

      // Try to find matching employee by UUID (api returns employee?.uuid)
      if (editClaim.employee?.uuid) {
        setFormEmployeeUuid(editClaim.employee.uuid);
      } else {
        setFormEmployeeUuid(''); // fallback (should not happen)
      }

      setFormLines(
        editClaim.line_items?.map((li) => ({
          // The Select options use category UUIDs as their value, but
          // li.category_id is the numeric DB id — use li.category.uuid instead
          // so the dropdown can actually match and pre-select the category.
          category_id: li.category?.uuid ?? '',
          expense_date: li.expense_date,
          description: li.description ?? '',
          amount_claimed: li.amount_claimed?.toString() ?? '',
          payment_method: li.payment_method,
        })) ?? [],
      );
    }
  }, [editClaim, isEditMode]);

  // ── Reset form ──────────────────────────────────
  const resetForm = () => {
    setFormTitle('');
    setFormType('regular');
    setFormEmployeeUuid('');
    setFormLines([emptyLine()]);
    setIsEditMode(false);
    setSelectedClaim(null);
  };

  // ── Mutations ───────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['expense-hub', 'claims'] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: formTitle,
        claim_type: formType,
        employee_id: formEmployeeUuid,   // UUID
        line_items: formLines
          .filter((l) => l.category_id && l.amount_claimed)
          .map<ClaimLinePayload>((l) => ({
            category_id: l.category_id,
            line_type: 'expense',
            expense_date: l.expense_date,
            description: l.description || undefined,
            amount_claimed: parseFloat(l.amount_claimed),
            payment_method: l.payment_method,
          })),
      };
      return expenseHubService.createClaim(payload);
    },
    onSuccess: () => { toast.success('Draft created.'); invalidate(); setIsFormModalOpen(false); resetForm(); },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Could not create claim.' }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClaim) throw new Error('No claim selected');
      const payload = {
        title: formTitle,
        claim_type: formType,
        employee_id: formEmployeeUuid,
        line_items: formLines
          .filter((l) => l.category_id && l.amount_claimed)
          .map<ClaimLinePayload>((l) => ({
            category_id: l.category_id,
            line_type: 'expense',
            expense_date: l.expense_date,
            description: l.description || undefined,
            amount_claimed: parseFloat(l.amount_claimed),
            payment_method: l.payment_method,
          })),
      };
      return expenseHubService.updateClaim(selectedClaim.uuid, payload);
    },
    onSuccess: () => { toast.success('Claim updated.'); invalidate(); setIsFormModalOpen(false); resetForm(); },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Could not update claim.' }),
  });

  const submitMutation = useMutation({
    mutationFn: (uuid: string) => expenseHubService.submitClaim(uuid),
    onSuccess: () => { toast.success('Claim submitted.'); invalidate(); setIsSubmitDialogOpen(false); },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Could not submit claim.' }),
  });
  const cancelMutation = useMutation({
    mutationFn: (uuid: string) => expenseHubService.cancelClaim(uuid),
    onSuccess: () => { toast.success('Claim cancelled.'); invalidate(); setIsDeleteDialogOpen(false); },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Could not cancel claim.' }),
  });
  const verifyMutation = useMutation({
    mutationFn: (uuid: string) => expenseHubService.verifyClaim(uuid),
    onSuccess: () => { toast.success('Claim verified.'); invalidate(); setIsVerifyDialogOpen(false); },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Could not verify claim.' }),
  });
  const scheduleMutation = useMutation({
    mutationFn: ({ uuid, month }: { uuid: string; month: string }) => expenseHubService.scheduleClaim(uuid, month),
    onSuccess: () => { toast.success('Reimbursement scheduled.'); invalidate(); setIsScheduleModalOpen(false); },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Could not schedule claim.' }),
  });
  const reimburseMutation = useMutation({
    mutationFn: (uuid: string) => expenseHubService.reimburseClaim(uuid),
    onSuccess: () => { toast.success('Reimbursed.'); invalidate(); setIsReimburseDialogOpen(false); },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: 'Could not mark as reimbursed.' }),
  });

  // ── Line item helpers ───────────────────────────
  const addLine = () => setFormLines((prev) => [...prev, emptyLine()]);
  const removeLine = (index: number) => setFormLines((prev) => prev.filter((_, i) => i !== index));
  const updateLine = (index: number, patch: Partial<DraftLine>) =>
    setFormLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  // ── Handlers ───────────────────────────────────
  const openCreate = () => { resetForm(); setIsFormModalOpen(true); };
  const openEdit = (claim: ExpenseClaim) => { setSelectedClaim(claim); setIsEditMode(true); setIsFormModalOpen(true); };
  const openView = (claim: ExpenseClaim) => { setSelectedClaim(claim); setIsViewModalOpen(true); };
  const openSchedule = (claim: ExpenseClaim) => { setSelectedClaim(claim); setIsScheduleModalOpen(true); };

  const handleSave = () => {
    if (!formEmployeeUuid) { toast.error('Please select an employee.'); return; }
    if (!formTitle.trim()) { toast.error('Title is required.'); return; }
    if (isEditMode) updateMutation.mutate();
    else createMutation.mutate();
  };

  // Get selected employee name for display
  const selectedEmployee = employees.find(emp => emp.uuid === formEmployeeUuid);
  const employeeDisplayName = selectedEmployee
    ? `${selectedEmployee.name} (${selectedEmployee.employee_code})`
    : formEmployeeUuid
      ? `Employee #${formEmployeeUuid}`
      : 'Select employee';

  // Pagination helpers
  const showingFrom = meta?.from ?? 0;
  const showingTo = meta?.to ?? 0;
  const totalEntries = meta?.total ?? 0;

  // Quick summary counts for the stats strip
  const pendingCount = claims.filter(
    (c) => c.status !== 'reimbursed' && c.status !== 'cancelled' && c.status !== 'draft',
  ).length;
  const draftCount = claims.filter((c) => c.status === 'draft').length;
  const pageClaimedTotal = claims.reduce((sum, c) => sum + (Number(c.total_amount_pkr) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50/60 p-4 md:p-6">
      <Card className="border border-gray-200/80 shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-white px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">Expense Claims</CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                {totalEntries.toLocaleString()} claims on file · manage submissions and approvals
              </p>
            </div>
            <Button
              className="gap-2 rounded-lg bg-[#1E1B4B] px-4 shadow-sm transition-colors hover:bg-[#2A2675]"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" /> New Claim
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Summary strip */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[#1E1B4B]">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">This page · claimed</p>
                <p className="truncate text-lg font-semibold text-gray-900">{pkr(pageClaimedTotal)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">In the pipeline</p>
                <p className="text-lg font-semibold text-gray-900">{pendingCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Drafts</p>
                <p className="text-lg font-semibold text-gray-900">{draftCount}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-5 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search claim # or title…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                className="rounded-lg border-gray-200 pl-9 focus-visible:ring-[#1E1B4B]/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-sm text-gray-500">Status</span>
              <Select value={statusFilter || 'all'} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); resetPage(); }}>
                <SelectTrigger className="w-40 rounded-lg border-gray-200"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-sm text-gray-500">Type</span>
              <Select value={typeFilter || 'all'} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); resetPage(); }}>
                <SelectTrigger className="w-40 rounded-lg border-gray-200"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {TYPE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="w-12 px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Claim #</th>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Claimed</th>
                    <th className="px-4 py-3 text-right">Approved</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading && !claims.length ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-gray-400">
                        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                        Loading claims…
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-red-500">
                        Something went wrong loading claims. Try refreshing the page.
                      </td>
                    </tr>
                  ) : claims.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <FileText className="mx-auto mb-3 h-9 w-9 text-gray-300" />
                        <p className="font-medium text-gray-600">No claims yet</p>
                        <p className="mt-1 text-sm text-gray-400">Create a new claim to get started.</p>
                      </td>
                    </tr>
                  ) : (
                    claims.map((claim, i) => (
                      <tr key={claim.uuid} className="transition-colors hover:bg-gray-50/70">
                        <td className="px-4 py-3.5 text-gray-400">{showingFrom + i}</td>
                        <td className="px-4 py-3.5 font-medium text-gray-900">{claim.claim_number || '—'}</td>
                        <td className="px-4 py-3.5 text-gray-700">{claim.title}</td>
                        <td className="px-4 py-3.5 capitalize text-gray-600">{claim.claim_type.replace('_', ' ')}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-gray-900">{pkr(claim.total_amount_pkr)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-gray-600">{pkr(claim.total_amount_approved)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${claimStatusTone(claim.status)}`}>
                            {CLAIM_STATUS_LABEL[claim.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => openView(claim)}>
                                <Eye className="mr-2 h-3.5 w-3.5" /> View
                              </DropdownMenuItem>
                              {(claim.status === 'draft' || claim.status === 'revision_requested') && (
                                <>
                                  <DropdownMenuItem onClick={() => openEdit(claim)}>
                                    <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedClaim(claim); setIsSubmitDialogOpen(true); }}>
                                    <Send className="mr-2 h-3.5 w-3.5" /> Submit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => { setSelectedClaim(claim); setIsDeleteDialogOpen(true); }}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Ban className="mr-2 h-3.5 w-3.5" /> Cancel
                                  </DropdownMenuItem>
                                </>
                              )}
                              {claim.status === 'approved' && (
                                <DropdownMenuItem onClick={() => { setSelectedClaim(claim); setIsVerifyDialogOpen(true); }}>
                                  <CheckCircle className="mr-2 h-3.5 w-3.5" /> Verify
                                </DropdownMenuItem>
                              )}
                              {claim.status === 'finance_verified' && (
                                <DropdownMenuItem onClick={() => openSchedule(claim)}>
                                  <Calendar className="mr-2 h-3.5 w-3.5" /> Schedule
                                </DropdownMenuItem>
                              )}
                              {claim.status === 'reimbursement_scheduled' && (
                                <DropdownMenuItem onClick={() => { setSelectedClaim(claim); setIsReimburseDialogOpen(true); }}>
                                  <CheckCircle className="mr-2 h-3.5 w-3.5" /> Mark Reimbursed
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && claims.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50/60 px-6 py-4">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                  <div className="text-sm text-gray-500">
                    Page <span className="font-semibold text-gray-900">{meta?.current_page ?? 1}</span> of{' '}
                    <span className="font-semibold text-gray-900">{meta?.last_page ?? 1}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Button variant="outline" size="icon" onClick={() => setPage(1)} disabled={(meta?.current_page ?? 1) === 1} className="rounded-lg border-gray-200">
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setPage(Math.max(1, (meta?.current_page ?? 1) - 1))} disabled={(meta?.current_page ?? 1) === 1} className="rounded-lg border-gray-200">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="mx-1 flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, meta?.last_page ?? 1) }, (_, i) => {
                        const current = meta?.current_page ?? 1;
                        const last = meta?.last_page ?? 1;
                        let pageNum;
                        if (last <= 5) pageNum = i + 1;
                        else if (current <= 3) pageNum = i + 1;
                        else if (current >= last - 2) pageNum = last - 4 + i;
                        else pageNum = current - 2 + i;
                        return (
                          <Button
                            key={pageNum}
                            variant={current === pageNum ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setPage(pageNum)}
                            className={
                              current === pageNum
                                ? 'rounded-lg bg-[#1E1B4B] hover:bg-[#2A2675]'
                                : 'rounded-lg border-gray-200'
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setPage(Math.min(meta?.last_page ?? 1, (meta?.current_page ?? 1) + 1))} disabled={(meta?.current_page ?? 1) === (meta?.last_page ?? 1)} className="rounded-lg border-gray-200">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setPage(meta?.last_page ?? 1)} disabled={(meta?.current_page ?? 1) === (meta?.last_page ?? 1)} className="rounded-lg border-gray-200">
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{showingFrom}</span> – <span className="font-semibold text-gray-900">{showingTo}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalEntries}</span> entries
                    {(isLoading || isFetching) && <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin text-gray-400" />}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Create/Edit Claim Modal ──────────────────────── */}
      <Dialog open={isFormModalOpen} onOpenChange={(open) => { if (!open) { resetForm(); setIsFormModalOpen(false); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{isEditMode ? 'Edit Claim' : 'New Expense Claim'}</DialogTitle>
            <DialogDescription>{isEditMode ? 'Update claim details and line items.' : 'Build a new expense claim.'}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Title & Type */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Title *</FieldLabel>
                <Input
                  id="claim-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Karachi client visit"
                  className="rounded-lg border-gray-200"
                />
              </div>
              <div>
                <FieldLabel>Type</FieldLabel>
                <Select value={formType} onValueChange={(v) => setFormType(v as ClaimType)}>
                  <SelectTrigger id="claim-type" className="rounded-lg border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Employee */}
            <div>
              <FieldLabel>Employee *</FieldLabel>
              <Select value={formEmployeeUuid} onValueChange={setFormEmployeeUuid}>
                <SelectTrigger id="claim-employee" className="w-full rounded-lg border-gray-200">
                  <SelectValue placeholder="Select employee">
                    {employeeDisplayName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.uuid} value={emp.uuid}>
                      {emp.name} ({emp.employee_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Line items */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <FieldLabel>Line Items</FieldLabel>
                <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1 rounded-lg border-gray-200">
                  <Plus className="h-3.5 w-3.5" /> Add line
                </Button>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {formLines.map((line, idx) => (
                  <div key={idx} className="grid items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/40 p-3 transition-colors hover:border-gray-300 sm:grid-cols-12">
                    <div className="sm:col-span-3">
                      <Select value={line.category_id} onValueChange={(val) => updateLine(idx, { category_id: val })}>
                        <SelectTrigger className="w-full rounded-lg border-gray-200 bg-white"><SelectValue placeholder="Category…" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.uuid} value={cat.uuid}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <input
                      type="date"
                      value={line.expense_date}
                      onChange={(e) => updateLine(idx, { expense_date: e.target.value })}
                      className="col-span-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
                    />
                    <input
                      value={line.description}
                      onChange={(e) => updateLine(idx, { description: e.target.value })}
                      placeholder="Description"
                      className="col-span-3 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
                    />
                    <div className="sm:col-span-2">
                      <Select value={line.payment_method} onValueChange={(val) => updateLine(idx, { payment_method: val as any })}>
                        <SelectTrigger className="w-full rounded-lg border-gray-200 bg-white"><SelectValue placeholder="Method" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="corporate_card">Corporate card</SelectItem>
                          <SelectItem value="personal_card">Personal card</SelectItem>
                          <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.amount_claimed}
                        onChange={(e) => updateLine(idx, { amount_claimed: e.target.value })}
                        placeholder="Amount"
                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-right text-sm tabular-nums"
                      />
                      {formLines.length > 1 && (
                        <button
                          onClick={() => removeLine(idx)}
                          className="shrink-0 rounded-md p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-indigo-50/60 px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Receipt className="h-4 w-4 text-[#1E1B4B]" /> Total claimed
                </span>
                <span className="text-lg font-semibold text-gray-900">{pkr(totalClaimed)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsFormModalOpen(false); }} className="rounded-lg border-gray-200">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formEmployeeUuid || !formTitle.trim() || createMutation.isPending || updateMutation.isPending}
              className="rounded-lg bg-[#1E1B4B] hover:bg-[#2A2675]"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                isEditMode ? 'Update Claim' : 'Save Draft'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Claim Modal ──────────────────── */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Claim Details</DialogTitle>
          </DialogHeader>
          {selectedClaim && editClaim ? (
            <div className="space-y-5">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${claimStatusTone(editClaim.status)}`}>
                {CLAIM_STATUS_LABEL[editClaim.status]}
              </span>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Claim #</FieldLabel>
                  <p className="font-medium text-gray-900">{editClaim.claim_number || '—'}</p>
                </div>
                <div>
                  <FieldLabel>Title</FieldLabel>
                  <p className="font-medium text-gray-900">{editClaim.title}</p>
                </div>
                <div>
                  <FieldLabel>Type</FieldLabel>
                  <p className="capitalize text-gray-700">{editClaim.claim_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <FieldLabel>Employee ID</FieldLabel>
                  <p className="text-gray-700">{editClaim.employee_id}</p>
                </div>
                <div>
                  <FieldLabel>Claimed</FieldLabel>
                  <p className="font-semibold text-gray-900">{pkr(editClaim.total_amount_claimed)}</p>
                </div>
                <div>
                  <FieldLabel>Approved</FieldLabel>
                  <p className="font-semibold text-gray-900">{pkr(editClaim.total_amount_approved)}</p>
                </div>
              </div>

              {editClaim.line_items && editClaim.line_items.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <th className="px-3 py-2.5 text-left">Category</th>
                          <th className="px-3 py-2.5 text-left">Date</th>
                          <th className="px-3 py-2.5 text-left">Description</th>
                          <th className="px-3 py-2.5 text-right">Claimed</th>
                          <th className="px-3 py-2.5 text-right">Approved</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {editClaim.line_items.map((li) => (
                          <tr key={li.uuid}>
                            <td className="px-3 py-2.5 text-gray-700">{li.category?.name || '—'}</td>
                            <td className="px-3 py-2.5 text-gray-600">{li.expense_date}</td>
                            <td className="px-3 py-2.5 text-gray-600">{li.description || '—'}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-gray-900">{pkr(li.amount_pkr)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">
                              {li.amount_approved ? pkr(li.amount_approved) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="rounded-lg border-gray-200">
              Close
            </Button>
            {(selectedClaim?.status === 'draft' || selectedClaim?.status === 'revision_requested') && (
              <Button
                onClick={() => { setIsViewModalOpen(false); openEdit(selectedClaim); }}
                className="rounded-lg bg-[#1E1B4B] hover:bg-[#2A2675]"
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Schedule Modal ────────────────────────────────── */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Schedule Reimbursement</DialogTitle>
            <DialogDescription>Choose a payroll month.</DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <FieldLabel>Payroll Month</FieldLabel>
            <Input
              id="schedule-month"
              type="month"
              value={scheduleMonth}
              onChange={(e) => setScheduleMonth(e.target.value)}
              className="rounded-lg border-gray-200"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)} className="rounded-lg border-gray-200">
              Cancel
            </Button>
            <Button
              onClick={() => selectedClaim && scheduleMutation.mutate({ uuid: selectedClaim.uuid, month: scheduleMonth })}
              disabled={scheduleMutation.isPending}
              className="rounded-lg bg-[#1E1B4B] hover:bg-[#2A2675]"
            >
              {scheduleMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...</>
              ) : (
                'Schedule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmation Dialogs (Submit, Cancel, Verify, Reimburse) ── */}
      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Claim?</AlertDialogTitle>
            <AlertDialogDescription>{selectedClaim?.claim_number} will be submitted for approval.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedClaim && submitMutation.mutate(selectedClaim.uuid)}
              className="rounded-lg bg-[#1E1B4B] hover:bg-[#2A2675]"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Claim?</AlertDialogTitle>
            <AlertDialogDescription>{selectedClaim?.claim_number} will be cancelled. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Keep claim</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedClaim && cancelMutation.mutate(selectedClaim.uuid)}
              className="rounded-lg bg-red-600 hover:bg-red-700"
            >
              Cancel Claim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Claim?</AlertDialogTitle>
            <AlertDialogDescription>{selectedClaim?.claim_number} will be marked as finance verified.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedClaim && verifyMutation.mutate(selectedClaim.uuid)}
              className="rounded-lg bg-[#1E1B4B] hover:bg-[#2A2675]"
            >
              Verify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isReimburseDialogOpen} onOpenChange={setIsReimburseDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Reimbursed?</AlertDialogTitle>
            <AlertDialogDescription>{selectedClaim?.claim_number} will be marked reimbursed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedClaim && reimburseMutation.mutate(selectedClaim.uuid)}
              className="rounded-lg bg-green-600 hover:bg-green-700"
            >
              Mark Reimbursed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}