'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { amsService } from '@/services/ams.service';
import type { ValuationStatus } from '@/types/ams.types';

const VALUATION_STATUS_MESSAGES: Record<ValuationStatus, string> = {
  available: '',
  none: 'No depreciation applies to this asset.',
  missing_data: 'Purchase information is incomplete.',
  invalid_configuration: 'Depreciation configuration requires correction.',
  pre_acquisition: 'This asset’s purchase date is in the future.',
};

function formatMoney(value: string | null): string {
  if (value === null) return '—';
  return `PKR ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Depreciation/Maintenance/Documents tabs from the Bible spec are Phase 2 —
// only Overview and Assignment tabs shipped in Phase 1. Phase 2A added the
// depreciation card to Overview itself. Phase 2B adds a real Maintenance tab
// (design spec §7) and a Disposal Pending badge + Initiate Disposal action on
// Overview — disposal has no dedicated tab since it's a terminal, one-time
// action, not an ongoing concern like maintenance history.
export default function AssetDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const queryClient = useQueryClient();
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  const [sendToRepairOpen, setSendToRepairOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [disposalOpen, setDisposalOpen] = useState(false);

  const [repairForm, setRepairForm] = useState({ description: '', started_date: new Date().toISOString().slice(0, 10), cost: '', notes: '' });
  const [completeForm, setCompleteForm] = useState({ cost: '', notes: '' });
  const [disposalForm, setDisposalForm] = useState({ disposal_method: 'sold', reason: '', disposed_at: new Date().toISOString().slice(0, 10), sale_proceeds: '' });

  const { data: asset, isLoading } = useQuery({
    queryKey: ['ams', 'assets', uuid],
    queryFn: () => amsService.getAsset(uuid),
  });

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['ams', 'assets', uuid, 'depreciation-schedule'],
    queryFn: () => amsService.getAssetDepreciationSchedule(uuid),
    enabled: scheduleExpanded,
  });

  const { data: maintenanceRes } = useQuery({
    queryKey: ['ams', 'assets', uuid, 'maintenance'],
    queryFn: () => amsService.getAssetMaintenance(uuid),
  });
  const maintenanceHistory = maintenanceRes?.data ?? [];
  const openMaintenance = maintenanceHistory.find((m) => m.is_open) ?? null;

  const invalidateAsset = () => {
    queryClient.invalidateQueries({ queryKey: ['ams', 'assets', uuid] });
    queryClient.invalidateQueries({ queryKey: ['ams', 'assets', uuid, 'maintenance'] });
  };

  const sendToRepair = useMutation({
    mutationFn: () => amsService.createMaintenance(uuid, {
      description: repairForm.description, started_date: repairForm.started_date,
      cost: repairForm.cost ? Number(repairForm.cost) : undefined, notes: repairForm.notes || undefined,
    }),
    onSuccess: () => {
      toast.success('Asset sent for repair.');
      setSendToRepairOpen(false);
      invalidateAsset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not send asset for repair.'),
  });

  const completeRepair = useMutation({
    mutationFn: () => amsService.completeMaintenance(openMaintenance!.uuid, {
      cost: completeForm.cost ? Number(completeForm.cost) : undefined, notes: completeForm.notes || undefined,
    }),
    onSuccess: () => {
      toast.success('Repair marked complete.');
      setCompleteOpen(false);
      invalidateAsset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not complete repair.'),
  });

  const cancelRepair = useMutation({
    mutationFn: () => amsService.cancelMaintenance(openMaintenance!.uuid),
    onSuccess: () => {
      toast.success('Maintenance record cancelled.');
      invalidateAsset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not cancel.'),
  });

  const initiateDisposal = useMutation({
    mutationFn: () => amsService.initiateDisposal(uuid, {
      disposal_method: disposalForm.disposal_method, reason: disposalForm.reason, disposed_at: disposalForm.disposed_at,
      sale_proceeds: disposalForm.disposal_method === 'sold' && disposalForm.sale_proceeds ? Number(disposalForm.sale_proceeds) : undefined,
    }),
    onSuccess: () => {
      toast.success('Disposal request submitted for approval.');
      setDisposalOpen(false);
      invalidateAsset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not initiate disposal.'),
  });

  if (isLoading || !asset) {
    return <div className="p-6 text-center text-gray-500">Loading asset...</div>;
  }

  const canSendToRepair = !openMaintenance && !['in_repair', 'lost', 'disposed'].includes(asset.status);
  const canInitiateDisposal = !asset.pending_disposal && !['lost', 'disposed'].includes(asset.status);

  return (
    <div className="p-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{asset.name}</CardTitle>
            <p className="text-sm text-gray-500 font-mono">{asset.asset_tag}</p>
          </div>
          <div className="flex items-center gap-2">
            {asset.pending_disposal && (
              <Badge className="bg-purple-100 text-purple-800">Disposal Pending</Badge>
            )}
            <Badge>{asset.status.replace('_', ' ')}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="pt-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Category</p><p className="font-medium">{asset.category?.name ?? '—'}</p></div>
                <div><p className="text-sm text-gray-500">Asset Type</p><p className="font-medium">{asset.asset_type?.name ?? '—'}</p></div>
                <div><p className="text-sm text-gray-500">Make / Model</p><p className="font-medium">{asset.make ?? '—'} {asset.model ?? ''}</p></div>
                <div><p className="text-sm text-gray-500">Serial Number</p><p className="font-medium">{asset.serial_number ?? '—'}</p></div>
                <div><p className="text-sm text-gray-500">Vendor</p><p className="font-medium">{asset.vendor?.name ?? '—'}</p></div>
                <div><p className="text-sm text-gray-500">Purchase Price</p><p className="font-medium">{asset.purchase_price ? `PKR ${asset.purchase_price.toLocaleString()}` : '—'}</p></div>
                <div><p className="text-sm text-gray-500">Warranty Expiry</p><p className="font-medium">{asset.warranty_expiry ?? '—'}</p></div>
              </div>

              <Card className="bg-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Depreciation</CardTitle>
                </CardHeader>
                <CardContent>
                  {asset.book_value === null ? (
                    <p className="text-sm text-gray-500">{VALUATION_STATUS_MESSAGES[asset.valuation_status]}</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-500">Current Book Value</p>
                          <p className="text-xl font-semibold">{formatMoney(asset.book_value)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Accumulated Depreciation</p>
                          <p className="text-xl font-semibold">{formatMoney(asset.accumulated_depreciation)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 capitalize">
                        {asset.depreciation_method.replace('_', ' ')} · {asset.useful_life_years} Years · Residual {asset.residual_value_pct}%
                      </p>

                      {asset.depreciation_method !== 'none' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setScheduleExpanded((v) => !v)}
                            className="flex items-center gap-1 text-sm text-blue-700 hover:underline"
                          >
                            View Depreciation Schedule
                            {scheduleExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>

                          {scheduleExpanded && (
                            <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                              {scheduleLoading || !schedule ? (
                                <p className="p-4 text-sm text-gray-500">Loading schedule…</p>
                              ) : schedule.valuation_status !== 'available' ? (
                                <p className="p-4 text-sm text-gray-500">{VALUATION_STATUS_MESSAGES[schedule.valuation_status]}</p>
                              ) : (
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="py-2 px-3 text-left">Year</th>
                                      <th className="py-2 px-3 text-right">Months</th>
                                      <th className="py-2 px-3 text-right">Opening</th>
                                      <th className="py-2 px-3 text-right">Depreciation</th>
                                      <th className="py-2 px-3 text-right">Accumulated</th>
                                      <th className="py-2 px-3 text-right">Closing</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 bg-white">
                                    {schedule.schedule.map((row) => (
                                      <tr key={row.year}>
                                        <td className="py-2 px-3">{row.year}</td>
                                        <td className="py-2 px-3 text-right">{row.months_depreciated}</td>
                                        <td className="py-2 px-3 text-right">{Number(row.opening_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="py-2 px-3 text-right">{Number(row.depreciation_charge).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="py-2 px-3 text-right">{Number(row.accumulated_depreciation).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="py-2 px-3 text-right">{Number(row.closing_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {canInitiateDisposal && (
                <Button variant="outline" onClick={() => setDisposalOpen(true)}>Initiate Disposal</Button>
              )}
            </TabsContent>
            <TabsContent value="assignment" className="pt-4">
              {asset.current_assignment ? (
                <div>
                  <p className="text-sm text-gray-500">Currently assigned to</p>
                  <p className="font-medium">{asset.current_assignment.employee_name}</p>
                  <p className="text-sm text-gray-500 mt-2">Since {asset.current_assignment.assigned_date}</p>
                </div>
              ) : (
                <p className="text-gray-500">Not currently assigned.</p>
              )}
            </TabsContent>
            <TabsContent value="maintenance" className="pt-4 space-y-4">
              {openMaintenance ? (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="font-medium">Currently in repair</p>
                  <p className="text-sm text-gray-600">{openMaintenance.description}</p>
                  <p className="text-sm text-gray-500 mt-1">Since {openMaintenance.started_date}{openMaintenance.vendor ? ` · ${openMaintenance.vendor.name}` : ''}</p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => setCompleteOpen(true)}>Mark Complete</Button>
                    <Button size="sm" variant="outline" onClick={() => cancelRepair.mutate()} disabled={cancelRepair.isPending}>Cancel</Button>
                  </div>
                </div>
              ) : (
                canSendToRepair && (
                  <Button size="sm" onClick={() => setSendToRepairOpen(true)}>Send to Repair</Button>
                )
              )}

              <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-3 text-left">Description</th>
                      <th className="py-2 px-3 text-left">Vendor</th>
                      <th className="py-2 px-3 text-left">Started</th>
                      <th className="py-2 px-3 text-left">Ended</th>
                      <th className="py-2 px-3 text-left">Outcome</th>
                      <th className="py-2 px-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {maintenanceHistory.length === 0 ? (
                      <tr><td colSpan={6} className="py-6 text-center text-gray-500">No maintenance history.</td></tr>
                    ) : (
                      maintenanceHistory.map((m) => (
                        <tr key={m.uuid}>
                          <td className="py-2 px-3">{m.description}</td>
                          <td className="py-2 px-3">{m.vendor?.name ?? '—'}</td>
                          <td className="py-2 px-3">{m.started_date}</td>
                          <td className="py-2 px-3">{m.ended_date ?? '—'}</td>
                          <td className="py-2 px-3 capitalize">{m.outcome ?? 'in progress'}</td>
                          <td className="py-2 px-3 text-right">{m.cost ? formatMoney(m.cost) : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={sendToRepairOpen} onOpenChange={setSendToRepairOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send to Repair</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label className="mb-2">Description</Label><Textarea value={repairForm.description} onChange={(e) => setRepairForm({ ...repairForm, description: e.target.value })} /></div>
            <div><Label className="mb-2">Started Date</Label><Input type="date" value={repairForm.started_date} onChange={(e) => setRepairForm({ ...repairForm, started_date: e.target.value })} /></div>
            <div><Label className="mb-2">Estimated Cost (optional)</Label><Input type="number" value={repairForm.cost} onChange={(e) => setRepairForm({ ...repairForm, cost: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendToRepairOpen(false)}>Cancel</Button>
            <Button disabled={!repairForm.description || sendToRepair.isPending} onClick={() => sendToRepair.mutate()}>
              {sendToRepair.isPending ? 'Submitting...' : 'Send to Repair'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Complete Repair</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label className="mb-2">Final Cost (optional)</Label><Input type="number" value={completeForm.cost} onChange={(e) => setCompleteForm({ ...completeForm, cost: e.target.value })} /></div>
            <div><Label className="mb-2">Notes (optional)</Label><Textarea value={completeForm.notes} onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>Cancel</Button>
            <Button disabled={completeRepair.isPending} onClick={() => completeRepair.mutate()}>
              {completeRepair.isPending ? 'Saving...' : 'Mark Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disposalOpen} onOpenChange={setDisposalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Initiate Disposal</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label className="mb-2">Method</Label>
              <Select value={disposalForm.disposal_method} onValueChange={(v) => setDisposalForm({ ...disposalForm, disposal_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="scrapped">Scrapped</SelectItem>
                  <SelectItem value="donated">Donated</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="mb-2">Reason</Label><Textarea value={disposalForm.reason} onChange={(e) => setDisposalForm({ ...disposalForm, reason: e.target.value })} /></div>
            <div><Label className="mb-2">Effective Disposal Date</Label><Input type="date" value={disposalForm.disposed_at} onChange={(e) => setDisposalForm({ ...disposalForm, disposed_at: e.target.value })} /></div>
            {disposalForm.disposal_method === 'sold' && (
              <div><Label className="mb-2">Sale Proceeds (optional)</Label><Input type="number" value={disposalForm.sale_proceeds} onChange={(e) => setDisposalForm({ ...disposalForm, sale_proceeds: e.target.value })} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisposalOpen(false)}>Cancel</Button>
            <Button disabled={!disposalForm.reason || initiateDisposal.isPending} onClick={() => initiateDisposal.mutate()}>
              {initiateDisposal.isPending ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
