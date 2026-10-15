'use client';

import { showApiError } from "@/lib/error-toast";
import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Copy,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  Lock,
  ArrowRight,
  MoreVertical,
  Trash,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import type { TaxYear, TaxYearSlab } from '@/types/tax-year.types';
import {
  useTaxYears,
  useCreateTaxYear,
  useUpdateTaxYear,
  useActivateTaxYear,
  useCloseTaxYear,
  useCloneTaxYear,
  useCreateSlab,
  useUpdateSlab,
  useDeleteSlab,
} from '@/hooks/useTaxYears';

// ── Helpers ──────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
};

const formatCurrency = (value: number | null) =>
  value !== null ? `Rs ${new Intl.NumberFormat('en-PK').format(value)}` : 'No limit';

const formatCurrencyShort = (value: number) =>
  `Rs ${new Intl.NumberFormat('en-PK').format(value)}`;

export default function TaxYearsPage() {
  // ── Data fetching ────────────────────────────────────
  const { data: taxYears = [], isLoading, error, refetch } = useTaxYears();
  const createTaxYear = useCreateTaxYear();
  const updateTaxYear = useUpdateTaxYear();
  const activateTaxYear = useActivateTaxYear();
  const closeTaxYear = useCloseTaxYear();
  const cloneTaxYear = useCloneTaxYear();
  const createSlab = useCreateSlab();
  const updateSlab = useUpdateSlab();
  const deleteSlab = useDeleteSlab();

  // ── Local state ──────────────────────────────────────
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [activatingYearId, setActivatingYearId] = useState<string | null>(null);

  const [isYearDialogOpen, setIsYearDialogOpen] = useState(false);
  const [yearDialogMode, setYearDialogMode] = useState<'create' | 'edit' | 'clone'>('create');
  const [yearForm, setYearForm] = useState({
    label: '',
    start_date: '',
    end_date: '',
    notes: '',
  });
  const [editingYearId, setEditingYearId] = useState<string | null>(null);

  const [isSlabDialogOpen, setIsSlabDialogOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<TaxYearSlab | null>(null);
  const [slabForm, setSlabForm] = useState<Partial<TaxYearSlab>>({
    slab_number: 1,
    annual_income_from: 0,
    annual_income_to: null,
    fixed_tax: 0,
    tax_rate_percent: 0,
    taxpayer_category: 'salaried',
    surcharge_threshold: null,
    surcharge_rate: null,
    excess_over_amount: null,
    slab_label: null,
    sort_order: 1,
    is_active: true,
  });

  // ── Effects ──────────────────────────────────────────
  useEffect(() => {
    if (taxYears.length > 0 && !selectedYearId) {
      const active = taxYears.find((y) => y.is_active);
      setSelectedYearId((active ?? taxYears[0]).id);
    }
  }, [taxYears, selectedYearId]);

  // ── Computed ──────────────────────────────────────────
  const selectedYear = taxYears.find((y) => y.id === selectedYearId);
  const slabs = useMemo(
    () => [...(selectedYear?.slabs ?? [])].sort((a, b) => a.slab_number - b.slab_number),
    [selectedYear]
  );
  const isYearEditable = selectedYear?.is_active === true && selectedYear?.is_editable !== false;
  const isClosed = selectedYear?.is_active === false;
  const topRate = slabs.length > 0 ? Math.max(...slabs.map((s) => s.tax_rate_percent)) : 0;

  // ── Handlers: Tax Years ─────────────────────────────
  const handleCreateYear = async () => {
    if (!yearForm.label || !yearForm.start_date || !yearForm.end_date) {
      toast.error('Fill in the label and both dates');
      return;
    }
    try {
      const res = await createTaxYear.mutateAsync({
        label: yearForm.label,
        start_date: yearForm.start_date,
        end_date: yearForm.end_date,
        notes: yearForm.notes || null,
      });
      toast.success(`${res.data.data.label} created`);
      setIsYearDialogOpen(false);
      setYearForm({ label: '', start_date: '', end_date: '', notes: '' });
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Could not create tax year' });
    }
  };

  const handleUpdateYear = async () => {
    if (!editingYearId) return;
    try {
      await updateTaxYear.mutateAsync({
        uuid: editingYearId,
        payload: {
          label: yearForm.label,
          start_date: yearForm.start_date,
          end_date: yearForm.end_date,
          notes: yearForm.notes || null,
        },
      });
      toast.success('Tax year updated');
      setIsYearDialogOpen(false);
      setEditingYearId(null);
      setYearForm({ label: '', start_date: '', end_date: '', notes: '' });
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Could not update tax year' });
    }
  };

  const handleCloneYear = async () => {
    if (!editingYearId) return;
    if (!yearForm.label || !yearForm.start_date || !yearForm.end_date) {
      toast.error('Fill in the label and both dates');
      return;
    }
    try {
      const res = await cloneTaxYear.mutateAsync({
        uuid: editingYearId,
        payload: {
          label: yearForm.label,
          start_date: yearForm.start_date,
          end_date: yearForm.end_date,
          notes: yearForm.notes || null,
        },
      });
      toast.success(`${res.data.data.label} cloned successfully`);
      setIsYearDialogOpen(false);
      setEditingYearId(null);
      setYearForm({ label: '', start_date: '', end_date: '', notes: '' });
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Could not clone tax year' });
    }
  };

  const handleActivateYear = async (id: string) => {
    try {
      const res = await activateTaxYear.mutateAsync(id);
      toast.success(`${res.data.data.label} is now active`);
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Could not activate tax year' });
    }
  };

  const handleCloseYear = async (id: string) => {
    try {
      const res = await closeTaxYear.mutateAsync(id);
      toast.success(`${res.data.data.label} closed`);
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Could not close tax year' });
    }
  };

  // ── Click badge to activate (toggle) ─────────────────
  const handleBadgeActivate = async (yearId: string) => {
    setActivatingYearId(yearId);
    try {
      await activateTaxYear.mutateAsync(yearId);
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Could not activate' });
    } finally {
      setActivatingYearId(null);
    }
  };

  // ── Handlers: Slabs ──────────────────────────────
  const resetSlabForm = () => {
    setSlabForm({
      slab_number: 1,
      annual_income_from: 0,
      annual_income_to: null,
      fixed_tax: 0,
      tax_rate_percent: 0,
      taxpayer_category: 'salaried',
      surcharge_threshold: null,
      surcharge_rate: null,
      excess_over_amount: null,
      slab_label: null,
      sort_order: 1,
      is_active: true,
    });
    setEditingSlab(null);
  };

  const openSlabDialog = (slab?: TaxYearSlab) => {
    if (slab) {
      setEditingSlab(slab);
      setSlabForm({ ...slab });
    } else {
      const nextNumber = slabs.length > 0 ? Math.max(...slabs.map((s) => s.slab_number)) + 1 : 1;
      const lastSlab = slabs[slabs.length - 1];
      setSlabForm({
        slab_number: nextNumber,
        annual_income_from: lastSlab?.annual_income_to != null ? lastSlab.annual_income_to + 1 : 0,
        annual_income_to: null,
        fixed_tax: 0,
        tax_rate_percent: 0,
        taxpayer_category: 'salaried',
        surcharge_threshold: null,
        surcharge_rate: null,
        excess_over_amount: null,
        slab_label: null,
        sort_order: nextNumber,
        is_active: true,
      });
      setEditingSlab(null);
    }
    setIsSlabDialogOpen(true);
  };

  const handleSaveSlab = async () => {
    if (!selectedYear) return;

    if (slabForm.annual_income_from === undefined || slabForm.annual_income_from === null) {
      toast.error('Min income is required');
      return;
    }
    if (slabForm.tax_rate_percent === undefined || slabForm.tax_rate_percent === null) {
      toast.error('Rate is required');
      return;
    }

    const payload = {
      slab_number: slabForm.slab_number,
      annual_income_from: slabForm.annual_income_from,
      annual_income_to: slabForm.annual_income_to ?? undefined,
      fixed_tax: slabForm.fixed_tax ?? 0,
      tax_rate_percent: slabForm.tax_rate_percent,
      excess_over_amount: slabForm.excess_over_amount ?? undefined,
      slab_label: slabForm.slab_label ?? undefined,
      sort_order: slabForm.sort_order ?? slabForm.slab_number,
      is_active: slabForm.is_active ?? true,
      taxpayer_category: slabForm.taxpayer_category,
      surcharge_threshold: slabForm.surcharge_threshold ?? undefined,
      surcharge_rate: slabForm.surcharge_rate ?? undefined,
    };

    try {
      if (editingSlab) {
        await updateSlab.mutateAsync({
          taxYearUuid: selectedYear.id,
          slabUuid: editingSlab.id,
          payload,
        });
        toast.success('Slab updated');
      } else {
        await createSlab.mutateAsync({
          taxYearUuid: selectedYear.id,
          payload,
        });
        toast.success('Slab added');
      }
      setIsSlabDialogOpen(false);
      resetSlabForm();
      refetch();
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const messages = Object.values(errors).flat().join(' ');
        showApiError(err, { fallbackMessage: messages });
      } else {
        showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Failed to save slab' });
      }
    }
  };

  const handleDeleteSlab = async (slabUuid: string) => {
    if (!selectedYear) return;
    if (!confirm('Delete this slab?')) return;
    try {
      await deleteSlab.mutateAsync({
        taxYearUuid: selectedYear.id,
        slabUuid,
      });
      toast.success('Slab deleted');
      refetch();
    } catch (err: any) {
      showApiError(err, { fallbackMessage: err?.response?.data?.message || 'Could not delete slab' });
    }
  };

  // ── UI ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading tax years…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Failed to load tax years. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">FBR Compliance</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tax Years &amp; Slabs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define income tax brackets for each financial year and control which one is live.
          </p>
        </div>
        <Button
          onClick={() => {
            setYearDialogMode('create');
            setYearForm({ label: '', start_date: '', end_date: '', notes: '' });
            setIsYearDialogOpen(true);
          }}
          className="shrink-0"
          disabled={createTaxYear.isPending}
        >
          <Plus className="mr-1.5 h-4 w-4" /> New tax year
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left: Tax Year List */}
        <div className="space-y-3">
          {taxYears.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No tax years yet.
                <br />
                Create one to get started.
              </CardContent>
            </Card>
          )}

          {taxYears.map((year) => {
            const isSelected = selectedYearId === year.id;
            const isClosed = year.is_active === false;
            return (
              <button
                key={year.id}
                onClick={() => setSelectedYearId(year.id)}
                className={cn(
                  'w-full rounded-xl border p-4 text-left transition-all',
                  isSelected
                    ? 'border-foreground/15 bg-card shadow-sm ring-1 ring-foreground/10'
                    : 'border-transparent bg-muted/40 hover:bg-muted'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground tabular-nums">{year.label}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {year.start_date} → {year.end_date}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground truncate">
                      {year.legal_entity?.name || '—'}
                    </div>
                  </div>
                  {/* Clickable status badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      'shrink-0 text-[11px] font-medium capitalize',
                      STATUS_STYLES[year.is_active ? 'active' : 'inactive'],
                      !year.is_active && 'cursor-pointer hover:opacity-80'
                    )}
                    onClick={
                      !year.is_active
                        ? (e) => {
                            e.stopPropagation();
                            handleBadgeActivate(year.id);
                          }
                        : undefined
                    }
                  >
                    {year.is_active ? 'Active' : activatingYearId === year.id ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Activating...
                      </span>
                    ) : 'Inactive'}
                  </Badge>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {year.slabs.length} slab{year.slabs.length === 1 ? '' : 's'}
                  </span>
                  {!isClosed && year.is_active === true && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          onClick={() => {
                            setYearDialogMode('edit');
                            setEditingYearId(year.id);
                            setYearForm({
                              label: year.label,
                              start_date: year.start_date,
                              end_date: year.end_date,
                              notes: year.notes || '',
                            });
                            setIsYearDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setYearDialogMode('clone');
                            setEditingYearId(year.id);
                            setYearForm({
                              label: `${year.label} (Clone)`,
                              start_date: year.start_date,
                              end_date: year.end_date,
                              notes: `Cloned from ${year.label}`,
                            });
                            setIsYearDialogOpen(true);
                          }}
                        >
                          <Copy className="mr-2 h-3.5 w-3.5" /> Clone
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {isClosed && (
                    <span className="flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Slab Editor */}
        <Card className="overflow-hidden">
          {!selectedYear ? (
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              Select a tax year on the left to view or edit its slabs.
            </CardContent>
          ) : (
            <>
              <CardHeader className="flex flex-col gap-4 border-b bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {selectedYear.label}
                    <Badge
                      variant="outline"
                      className={cn('text-[11px] font-medium capitalize', STATUS_STYLES[selectedYear.is_active ? 'active' : 'inactive'])}
                    >
                      {selectedYear.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedYear.is_active === true && 'This year is live. Slabs are locked from editing.'}
                    {selectedYear.is_active === false && 'This year is archived and read-only.'}
                  </p>
                </div>

                {isYearEditable && (
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => openSlabDialog()}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add slab
                    </Button>
                    {slabs.length > 0 && (
                      <Button size="sm" onClick={() => handleActivateYear(selectedYear.id)}>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Activate
                      </Button>
                    )}
                  </div>
                )}
                {selectedYear.is_active === true && (
                  <Button variant="destructive" size="sm" onClick={() => handleCloseYear(selectedYear.id)}>
                    <XCircle className="mr-1.5 h-3.5 w-3.5" /> Close year
                  </Button>
                )}
              </CardHeader>

              <CardContent className="p-0">
                {slabs.length > 0 && (
                  <div className="grid grid-cols-2 divide-x border-b bg-card text-center">
                    <div className="px-4 py-3">
                      <div className="text-lg font-semibold tabular-nums">{slabs.length}</div>
                      <div className="text-xs text-muted-foreground">Slabs</div>
                    </div>
                    <div className="px-4 py-3">
                      <div className="text-lg font-semibold tabular-nums">{topRate}%</div>
                      <div className="text-xs text-muted-foreground">Top rate</div>
                    </div>
                  </div>
                )}

                {slabs.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <Layers className="h-8 w-8 text-muted-foreground/40" />
                    <div>
                      <p className="text-sm font-medium text-foreground">No slabs defined yet</p>
                      <p className="text-sm text-muted-foreground">Add the first income bracket to start building this year.</p>
                    </div>
                    {isYearEditable && (
                      <Button size="sm" onClick={() => openSlabDialog()}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add slab
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead>Income bracket</TableHead>
                          <TableHead className="text-right">Fixed tax</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead>Surcharge</TableHead>
                          {isYearEditable && <TableHead className="w-12 pr-4 text-right">{''}</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {slabs.map((slab) => (
                          <TableRow key={slab.id} className="group">
                            <TableCell className="text-center text-xs font-medium text-muted-foreground tabular-nums">
                              {slab.slab_number}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm tabular-nums">
                                <span>{formatCurrency(slab.annual_income_from)}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                                <span>{formatCurrency(slab.annual_income_to)}</span>
                              </div>
                              <Badge variant="secondary" className="mt-1 text-[10px] font-normal capitalize">
                                {slab.taxpayer_category?.replace('_', '-') || 'salaried'}
                              </Badge>
                              {slab.slab_label && (
                                <div className="text-xs text-muted-foreground mt-0.5">{slab.slab_label}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums">
                              {formatCurrencyShort(slab.fixed_tax)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="inline-flex min-w-10 justify-center rounded-md bg-muted px-2 py-0.5 text-sm font-medium tabular-nums">
                                {slab.tax_rate_percent}%
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground tabular-nums">
                              {slab.surcharge_threshold && slab.surcharge_rate
                                ? `+${slab.surcharge_rate}% over ${formatCurrencyShort(slab.surcharge_threshold)}`
                                : '—'}
                            </TableCell>
                            {isYearEditable && (
                              <TableCell className="pr-4 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openSlabDialog(slab)}>
                                      <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => handleDeleteSlab(slab.id)}
                                    >
                                      <Trash className="mr-2 h-3.5 w-3.5" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* Tax Year Dialog */}
      <Dialog open={isYearDialogOpen} onOpenChange={setIsYearDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {yearDialogMode === 'create' && 'New tax year'}
              {yearDialogMode === 'edit' && 'Edit tax year'}
              {yearDialogMode === 'clone' && 'Clone tax year'}
            </DialogTitle>
            {yearDialogMode === 'clone' && (
              <DialogDescription>
                Create a copy of this tax year with a new label and dates.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={yearForm.label}
                onChange={(e) => setYearForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., FY 2028-29"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start_date">Start date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={yearForm.start_date}
                  onChange={(e) => setYearForm((prev) => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_date">End date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={yearForm.end_date}
                  onChange={(e) => setYearForm((prev) => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={yearForm.notes}
                onChange={(e) => setYearForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsYearDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={
                yearDialogMode === 'create'
                  ? handleCreateYear
                  : yearDialogMode === 'edit'
                    ? handleUpdateYear
                    : handleCloneYear
              }
              disabled={createTaxYear.isPending || updateTaxYear.isPending || cloneTaxYear.isPending}
            >
              {yearDialogMode === 'create' && 'Create'}
              {yearDialogMode === 'edit' && 'Save changes'}
              {yearDialogMode === 'clone' && 'Clone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slab Dialog */}
      <Dialog open={isSlabDialogOpen} onOpenChange={setIsSlabDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSlab ? 'Edit slab' : 'Add slab'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="slab_number">Slab Number</Label>
                <Input
                  id="slab_number"
                  type="number"
                  value={slabForm.slab_number}
                  onChange={(e) =>
                    setSlabForm((prev) => ({ ...prev, slab_number: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxpayer_category">Category</Label>
                <Select
                  value={slabForm.taxpayer_category}
                  onValueChange={(val) =>
                    setSlabForm((prev) => ({ ...prev, taxpayer_category: val as any }))
                  }
                >
                  <SelectTrigger className="w-full" id="taxpayer_category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salaried">Salaried</SelectItem>
                    <SelectItem value="non_salaried">Non-salaried</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="annual_income_from">Income From (Rs)</Label>
                <Input
                  id="annual_income_from"
                  type="number"
                  value={slabForm.annual_income_from ?? ''}
                  onChange={(e) =>
                    setSlabForm((prev) => ({
                      ...prev,
                      annual_income_from: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="annual_income_to">Income To (Rs)</Label>
                <Input
                  id="annual_income_to"
                  type="number"
                  placeholder="No limit"
                  value={slabForm.annual_income_to ?? ''}
                  onChange={(e) =>
                    setSlabForm((prev) => ({
                      ...prev,
                      annual_income_to: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fixed_tax">Fixed Tax (Rs)</Label>
                <Input
                  id="fixed_tax"
                  type="number"
                  value={slabForm.fixed_tax ?? 0}
                  onChange={(e) =>
                    setSlabForm((prev) => ({ ...prev, fixed_tax: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax_rate_percent">Rate (%)</Label>
                <Input
                  id="tax_rate_percent"
                  type="number"
                  step="0.01"
                  value={slabForm.tax_rate_percent ?? 0}
                  onChange={(e) =>
                    setSlabForm((prev) => ({
                      ...prev,
                      tax_rate_percent: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="excess_over_amount">Excess Over Amount (optional)</Label>
                <Input
                  id="excess_over_amount"
                  type="number"
                  value={slabForm.excess_over_amount ?? ''}
                  onChange={(e) =>
                    setSlabForm((prev) => ({
                      ...prev,
                      excess_over_amount: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slab_label">Slab Label (optional)</Label>
                <Input
                  id="slab_label"
                  value={slabForm.slab_label ?? ''}
                  onChange={(e) =>
                    setSlabForm((prev) => ({ ...prev, slab_label: e.target.value || null }))
                  }
                  placeholder="e.g., Basic exemption"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={slabForm.sort_order ?? slabForm.slab_number}
                  onChange={(e) =>
                    setSlabForm((prev) => ({
                      ...prev,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={slabForm.is_active !== false}
                  onChange={(e) =>
                    setSlabForm((prev) => ({ ...prev, is_active: e.target.checked }))
                  }
                  className="h-4 w-4 accent-primary"
                />
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Active
                </Label>
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Surcharge (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="surcharge_threshold">Threshold (Rs)</Label>
                  <Input
                    id="surcharge_threshold"
                    type="number"
                    value={slabForm.surcharge_threshold ?? ''}
                    onChange={(e) =>
                      setSlabForm((prev) => ({
                        ...prev,
                        surcharge_threshold: e.target.value ? parseFloat(e.target.value) : null,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="surcharge_rate">Rate (%)</Label>
                  <Input
                    id="surcharge_rate"
                    type="number"
                    step="0.01"
                    value={slabForm.surcharge_rate ?? ''}
                    onChange={(e) =>
                      setSlabForm((prev) => ({
                        ...prev,
                        surcharge_rate: e.target.value ? parseFloat(e.target.value) : null,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSlabDialogOpen(false);
                resetSlabForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSlab}
              disabled={createSlab.isPending || updateSlab.isPending}
            >
              {editingSlab ? 'Save changes' : 'Add slab'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}