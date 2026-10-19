'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { amsService } from '@/services/ams.service';
import type { AmsBundleApplicationLineItem, BundleApplicationStatus } from '@/types/ams.types';

// Status color map — same object-literal pattern as EXPIRY_COLORS in
// app/(system)/ams/licenses/[uuid]/page.tsx.
const STATUS_COLORS: Record<BundleApplicationStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  partially_fulfilled: 'bg-yellow-100 text-yellow-800',
  fulfilled: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<BundleApplicationStatus, string> = {
  open: 'Open',
  partially_fulfilled: 'Partially Fulfilled',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

interface LineFormState {
  asset_uuid: string;
  condition_at_issue: string;
}

export default function BundleApplicationDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const queryClient = useQueryClient();

  const queryKey = ['ams', 'bundle-application', uuid];

  const { data: application, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => amsService.getBundleApplication(uuid),
  });

  // Per-line-item confirm form (asset picked from that line's own
  // eligible_assets + condition_at_issue, defaulting to 'good' per the brief).
  const [lineForms, setLineForms] = useState<Record<string, LineFormState>>({});
  const getLineForm = (item: AmsBundleApplicationLineItem): LineFormState =>
    lineForms[item.uuid] ?? { asset_uuid: '', condition_at_issue: 'good' };
  const updateLineForm = (itemUuid: string, patch: Partial<LineFormState>) =>
    setLineForms((f) => ({ ...f, [itemUuid]: { ...(f[itemUuid] ?? { asset_uuid: '', condition_at_issue: 'good' }), ...patch } }));

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['ams', 'assignments'] });
    queryClient.invalidateQueries({ queryKey: ['ams', 'assets'] });
  };

  const confirmMutation = useMutation({
    mutationFn: ({ itemUuid, payload }: { itemUuid: string; payload: { asset_uuid: string; condition_at_issue: string } }) =>
      amsService.confirmFulfillment(uuid, itemUuid, payload),
    onSuccess: (_data, variables) => {
      toast.success('Fulfillment confirmed.');
      setLineForms((f) => {
        const next = { ...f };
        delete next[variables.itemUuid];
        return next;
      });
      invalidate();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not confirm fulfillment.'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => amsService.cancelApplication(uuid, cancelReason || undefined),
    onSuccess: () => {
      toast.success('Remaining lines cancelled.');
      setCancelOpen(false);
      setCancelReason('');
      invalidate();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not cancel application.'),
  });

  if (isError) {
    return <div className="p-6 text-center text-gray-500">Could not load this application.</div>;
  }

  if (isLoading || !application) {
    return <div className="p-6 text-center text-gray-500">Loading application...</div>;
  }

  const canCancel = application.status === 'open' || application.status === 'partially_fulfilled';

  return (
    <div className="p-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{application.bundle_name_snapshot}</CardTitle>
            <p className="text-sm text-gray-500">
              {application.employee?.name ?? `Employee ${application.employee?.uuid.slice(0, 8) ?? '—'}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={STATUS_COLORS[application.status]}>{STATUS_LABELS[application.status]}</Badge>
            {canCancel && (
              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setCancelOpen(true)}>
                Cancel Remaining
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {application.cancellation_reason && (
            <p className="text-sm text-gray-500">Cancellation reason: {application.cancellation_reason}</p>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-3 text-left">Asset Type</th>
                  <th className="py-2 px-3 text-right">Requested</th>
                  <th className="py-2 px-3 text-right">Fulfilled</th>
                  <th className="py-2 px-3 text-right">Outstanding</th>
                  <th className="py-2 px-3 text-left">Confirm Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(application.items ?? []).map((item) => {
                  const form = getLineForm(item);
                  const eligible = item.eligible_assets ?? [];
                  const isConfirming = confirmMutation.isPending && confirmMutation.variables?.itemUuid === item.uuid;

                  return (
                    <tr key={item.uuid}>
                      <td className="py-2 px-3">{item.asset_type_name_snapshot}</td>
                      <td className="py-2 px-3 text-right">{item.quantity_requested}</td>
                      <td className="py-2 px-3 text-right">{item.fulfilled}</td>
                      <td className="py-2 px-3 text-right">{item.outstanding}</td>
                      <td className="py-2 px-3">
                        {item.outstanding > 0 ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={form.asset_uuid}
                              onValueChange={(v) => updateLineForm(item.uuid, { asset_uuid: v })}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder={eligible.length ? 'Select unit' : 'No units in stock'} />
                              </SelectTrigger>
                              <SelectContent>
                                {eligible.map((a) => (
                                  <SelectItem key={a.uuid} value={a.uuid}>{a.asset_tag} — {a.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={form.condition_at_issue}
                              onValueChange={(v) => updateLineForm(item.uuid, { condition_at_issue: v })}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="fair">Fair</SelectItem>
                                <SelectItem value="poor">Poor</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              disabled={!form.asset_uuid || confirmMutation.isPending}
                              onClick={() => confirmMutation.mutate({
                                itemUuid: item.uuid,
                                payload: { asset_uuid: form.asset_uuid, condition_at_issue: form.condition_at_issue },
                              })}
                            >
                              {isConfirming ? 'Confirming...' : 'Confirm'}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400">Fully issued</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={cancelOpen} onOpenChange={(open) => { setCancelOpen(open); if (!open) setCancelReason(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Remaining Lines?</AlertDialogTitle>
            <AlertDialogDescription>
              Any outstanding, unfulfilled lines on this application will be cancelled. Lines already fulfilled and
              their asset assignments are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Reason (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Remaining'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
