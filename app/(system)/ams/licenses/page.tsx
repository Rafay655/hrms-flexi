'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { amsService } from '@/services/ams.service';
import { useAppSelector } from '@/store/hooks';

const EXPIRY_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
};

// License register (design spec §8) — one flat, filterable list; no dashboard
// cards or utilization analytics in Phase 2C (deferred to Phase 2D per §11).
export default function LicensesPage() {
  const queryClient = useQueryClient();

  // Permission-driven UI (design spec §8, final-review fix #5) — mirrors the
  // established pattern in app/(system)/ams/handover-notes/[uuid]/page.tsx:
  // ams.license.view alone is read-only, ams.license.manage unlocks mutation UI.
  // This is a soft client-side gate only — the backend policy remains authoritative.
  const permissions = useAppSelector((s) => s.auth.permissions);
  const canManage = permissions.includes('ams.license.manage');

  const [search, setSearch] = useState('');
  const [expiryState, setExpiryState] = useState<string>('all');
  const [hasAvailableSeats, setHasAvailableSeats] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', publisher_name: '', seats_purchased: '1', cost_per_seat: '',
    billing_term: 'annual', purchase_date: '', expiry_date: '', notes: '',
  });

  // Reset to page 1 whenever a filter changes.
  useEffect(() => { setPage(1); }, [search, expiryState, hasAvailableSeats]);

  const { data, isLoading } = useQuery({
    queryKey: ['ams', 'licenses', { search, expiryState, hasAvailableSeats, page }],
    queryFn: () => amsService.getLicenses({
      search: search || undefined,
      expiry_state: expiryState === 'all' ? undefined : (expiryState as 'active' | 'expired'),
      has_available_seats: hasAvailableSeats === 'all' ? undefined : hasAvailableSeats === 'yes',
      page,
      per_page: 15,
    }),
  });
  const licenses = data?.data ?? [];
  const meta = data?.meta;

  const create = useMutation({
    mutationFn: () => amsService.createLicense({
      name: form.name,
      publisher_name: form.publisher_name || undefined,
      seats_purchased: Number(form.seats_purchased),
      cost_per_seat: form.cost_per_seat ? Number(form.cost_per_seat) : undefined,
      billing_term: form.billing_term,
      purchase_date: form.purchase_date || undefined,
      expiry_date: form.billing_term === 'perpetual' ? undefined : (form.expiry_date || undefined),
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      toast.success('License created.');
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['ams', 'licenses'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not create license.'),
  });

  return (
    <div className="p-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Software Licenses</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
            <Select value={expiryState} onValueChange={setExpiryState}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Expiry" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All expiry</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={hasAvailableSeats} onValueChange={setHasAvailableSeats}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Seats" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All seats</SelectItem>
                <SelectItem value="yes">Has available</SelectItem>
                <SelectItem value="no">Fully allocated</SelectItem>
              </SelectContent>
            </Select>
            {canManage && <Button onClick={() => setCreateOpen(true)}>Add License</Button>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Publisher</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Billing</th>
                  <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase">Seats</th>
                  <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase">Available</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Expiry</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-500">Loading...</td></tr>
                ) : licenses.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-500">No licenses.</td></tr>
                ) : (
                  licenses.map((l) => (
                    <tr key={l.uuid} className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-sm">
                        <Link href={`/ams/licenses/${l.uuid}`} className="text-blue-700 hover:underline font-medium">{l.name}</Link>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{l.publisher_name ?? '—'}</td>
                      <td className="py-4 px-6 text-sm capitalize">{l.billing_term}</td>
                      <td className="py-4 px-6 text-sm text-right">{l.seats_purchased}</td>
                      <td className="py-4 px-6 text-sm text-right">{l.available_seats}</td>
                      <td className="py-4 px-6 text-sm">
                        <Badge className={EXPIRY_COLORS[l.expiry_state]}>
                          {l.expiry_date ?? 'Perpetual'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <span>Page {meta.current_page} of {meta.last_page}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === meta.last_page} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add License</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label className="mb-2">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="mb-2">Publisher (optional)</Label><Input value={form.publisher_name} onChange={(e) => setForm({ ...form, publisher_name: e.target.value })} /></div>
            <div><Label className="mb-2">Seats Purchased</Label><Input type="number" min={1} value={form.seats_purchased} onChange={(e) => setForm({ ...form, seats_purchased: e.target.value })} /></div>
            <div><Label className="mb-2">Cost per Seat (optional)</Label><Input type="number" min={0} value={form.cost_per_seat} onChange={(e) => setForm({ ...form, cost_per_seat: e.target.value })} /></div>
            <div>
              <Label className="mb-2">Billing Term</Label>
              <Select value={form.billing_term} onValueChange={(v) => setForm({ ...form, billing_term: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="perpetual">Perpetual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="mb-2">Purchase Date (optional)</Label><Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
            {form.billing_term !== 'perpetual' && (
              <div><Label className="mb-2">Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={!form.name || create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? 'Saving...' : 'Add License'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
