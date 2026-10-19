'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { amsService } from '@/services/ams.service';
import type { AmsDisposal } from '@/types/ams.types';

const STATUS_COLORS: Record<string, string> = {
  pending_approval: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

// The cross-asset approval work queue (design spec §7) — genuinely necessary,
// not a nice-to-have: an approver needs to discover pending disposal requests
// without hunting asset-by-asset. Gated ams.disposal.approve on the backend.
export default function DisposalsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending_approval');
  const [rejectTarget, setRejectTarget] = useState<AmsDisposal | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['ams', 'disposals', 'queue', statusFilter],
    queryFn: () => amsService.getDisposalQueue({ status: statusFilter || undefined }),
  });
  const disposals = data?.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ams', 'disposals'] });

  const approve = useMutation({
    mutationFn: (uuid: string) => amsService.approveDisposal(uuid),
    onSuccess: () => { toast.success('Disposal approved.'); invalidate(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not approve disposal.'),
  });

  const reject = useMutation({
    mutationFn: () => amsService.rejectDisposal(rejectTarget!.uuid, rejectionReason),
    onSuccess: () => { toast.success('Disposal rejected.'); setRejectTarget(null); setRejectionReason(''); invalidate(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not reject disposal.'),
  });

  return (
    <div className="p-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Disposal Approvals</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Asset</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Method</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Effective Date</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-500">Loading...</td></tr>
                ) : disposals.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-500">No disposals.</td></tr>
                ) : (
                  disposals.map((d) => (
                    <tr key={d.uuid} className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-sm">{d.asset?.asset_tag} — {d.asset?.name}</td>
                      <td className="py-4 px-6 text-sm capitalize">{d.disposal_method}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{d.disposed_at}</td>
                      <td className="py-4 px-6 text-sm"><Badge className={STATUS_COLORS[d.status]}>{d.status.replace('_', ' ')}</Badge></td>
                      <td className="py-4 px-6 text-sm">
                        {d.status === 'pending_approval' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => approve.mutate(d.uuid)} disabled={approve.isPending}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => setRejectTarget(d)}>Reject</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={rejectTarget !== null} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Disposal</DialogTitle></DialogHeader>
          <Textarea placeholder="Reason for rejection" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectionReason || reject.isPending} onClick={() => reject.mutate()}>
              {reject.isPending ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
