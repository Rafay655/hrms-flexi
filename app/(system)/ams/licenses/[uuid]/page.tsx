'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { amsService } from '@/services/ams.service';
import { employeeService } from '@/services/employee.service';
import { useAppSelector } from '@/store/hooks';

const EXPIRY_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
};

// License detail: capacity summary + combined active/revoked roster (design
// spec §8) — no separate reporting screen, no dashboard cards (§11).
export default function LicenseDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Permission-driven UI (design spec §8, final-review fix #5) — same pattern as
  // the list page and app/(system)/ams/handover-notes/[uuid]/page.tsx: view-only
  // permission renders the read-only detail/roster with no mutation controls.
  const permissions = useAppSelector((s) => s.auth.permissions);
  const canManage = permissions.includes('ams.license.manage');

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ employee_uuid: '', assigned_date: new Date().toISOString().slice(0, 10) });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', publisher_name: '', seats_purchased: '1', cost_per_seat: '',
    billing_term: 'annual', purchase_date: '', expiry_date: '', notes: '',
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignmentsPage, setAssignmentsPage] = useState(1);

  const { data: license, isLoading } = useQuery({
    queryKey: ['ams', 'licenses', uuid],
    queryFn: () => amsService.getLicense(uuid),
  });

  const { data: assignmentsRes } = useQuery({
    queryKey: ['ams', 'licenses', uuid, 'assignments', assignmentsPage],
    queryFn: () => amsService.getLicenseAssignments(uuid, { page: assignmentsPage, per_page: 15 }),
  });
  const assignments = assignmentsRes?.data ?? [];
  const assignmentsMeta = assignmentsRes?.meta;

  const { data: employees } = useQuery({
    queryKey: ['people-hub', 'employees', 'all'],
    queryFn: () => employeeService.getAll({ per_page: 500, detailed: 0 }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ams', 'licenses', uuid] });
    queryClient.invalidateQueries({ queryKey: ['ams', 'licenses', uuid, 'assignments'] });
    queryClient.invalidateQueries({ queryKey: ['ams', 'licenses'] });
  };

  const assign = useMutation({
    mutationFn: () => amsService.assignLicense(uuid, {
      employee_uuid: assignForm.employee_uuid, assigned_date: assignForm.assigned_date,
    }),
    onSuccess: () => {
      toast.success('Seat assigned.');
      setAssignOpen(false);
      setAssignForm({ employee_uuid: '', assigned_date: new Date().toISOString().slice(0, 10) });
      invalidate();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not assign seat.'),
  });

  const revoke = useMutation({
    mutationFn: (assignmentUuid: string) => amsService.revokeLicenseAssignment(assignmentUuid, new Date().toISOString().slice(0, 10)),
    onSuccess: () => {
      toast.success('Seat revoked.');
      invalidate();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not revoke seat.'),
  });

  const update = useMutation({
    mutationFn: () => amsService.updateLicense(uuid, {
      name: editForm.name,
      publisher_name: editForm.publisher_name || null,
      seats_purchased: Number(editForm.seats_purchased),
      cost_per_seat: editForm.cost_per_seat ? Number(editForm.cost_per_seat) : null,
      billing_term: editForm.billing_term,
      purchase_date: editForm.purchase_date || null,
      expiry_date: editForm.billing_term === 'perpetual' ? null : (editForm.expiry_date || null),
      notes: editForm.notes || null,
    }),
    onSuccess: () => {
      toast.success('License updated.');
      setEditOpen(false);
      invalidate();
    },
    // Server 422s (e.g. downsize-below-active-count, expiry-before-purchase) surfaced
    // verbatim rather than swallowed — design spec's invariants are only reachable
    // through the product if their rejection is visible here.
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not update license.'),
  });

  const remove = useMutation({
    mutationFn: () => amsService.deleteLicense(uuid),
    onSuccess: () => {
      toast.success('License deleted.');
      queryClient.invalidateQueries({ queryKey: ['ams', 'licenses'] });
      router.push('/ams/licenses');
    },
    // e.g. delete-with-active-assignments 422 — surfaced verbatim, matching
    // vendors/page.tsx's deleteMutation.onError convention.
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not delete license.'),
  });

  const openEdit = () => {
    if (!license) return;
    setEditForm({
      name: license.name,
      publisher_name: license.publisher_name ?? '',
      seats_purchased: String(license.seats_purchased),
      cost_per_seat: license.cost_per_seat ?? '',
      billing_term: license.billing_term,
      purchase_date: license.purchase_date ?? '',
      expiry_date: license.expiry_date ?? '',
      notes: license.notes ?? '',
    });
    setEditOpen(true);
  };

  if (isLoading || !license) {
    return <div className="p-6 text-center text-gray-500">Loading license...</div>;
  }

  const canAssign = canManage && license.available_seats > 0 && license.expiry_state === 'active';

  return (
    <div className="p-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{license.name}</CardTitle>
            <p className="text-sm text-gray-500">{license.publisher_name ?? '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={EXPIRY_COLORS[license.expiry_state]}>{license.expiry_date ?? 'Perpetual'}</Badge>
            {canManage && (
              <>
                <Button size="sm" variant="outline" onClick={openEdit}>Edit</Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setDeleteOpen(true)}>Delete</Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div><p className="text-sm text-gray-500">Seats Purchased</p><p className="text-xl font-semibold">{license.seats_purchased}</p></div>
            <div><p className="text-sm text-gray-500">Active Assignments</p><p className="text-xl font-semibold">{license.active_assignments}</p></div>
            <div><p className="text-sm text-gray-500">Available</p><p className="text-xl font-semibold">{license.available_seats}</p></div>
            <div><p className="text-sm text-gray-500">Cost / Seat</p><p className="text-xl font-semibold">{license.cost_per_seat ? `PKR ${license.cost_per_seat}` : '—'}</p></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Assignment Roster</h3>
              {canManage && (
                <Button size="sm" disabled={!canAssign} onClick={() => setAssignOpen(true)}>Assign Seat</Button>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-3 text-left">Target</th>
                    <th className="py-2 px-3 text-left">Assigned</th>
                    <th className="py-2 px-3 text-left">Revoked</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {assignments.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-gray-500">No assignments.</td></tr>
                  ) : (
                    assignments.map((a) => (
                      <tr key={a.uuid}>
                        <td className="py-2 px-3">{a.employee ? `Employee ${a.employee.uuid.slice(0, 8)}` : `${a.asset?.asset_tag} — ${a.asset?.name}`}</td>
                        <td className="py-2 px-3">{a.assigned_date}</td>
                        <td className="py-2 px-3">{a.revoked_date ?? '—'}</td>
                        <td className="py-2 px-3 text-right">
                          {canManage && !a.revoked_date && (
                            <Button size="sm" variant="outline" onClick={() => revoke.mutate(a.uuid)} disabled={revoke.isPending}>Revoke</Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {assignmentsMeta && assignmentsMeta.last_page > 1 && (
              <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                <span>Page {assignmentsMeta.current_page} of {assignmentsMeta.last_page}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={assignmentsPage === 1} onClick={() => setAssignmentsPage(assignmentsPage - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={assignmentsPage === assignmentsMeta.last_page} onClick={() => setAssignmentsPage(assignmentsPage + 1)}>Next</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Seat</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label className="mb-2">Employee</Label>
              <Select value={assignForm.employee_uuid} onValueChange={(uuid) => setAssignForm({ ...assignForm, employee_uuid: uuid })}>
                <SelectTrigger><SelectValue placeholder="Search employee" /></SelectTrigger>
                <SelectContent>
                  {(employees ?? []).map((e) => (
                    <SelectItem key={e.uuid} value={e.uuid}>{e.name ?? e.employee_code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="mb-2">Assigned Date</Label><Input type="date" value={assignForm.assigned_date} onChange={(e) => setAssignForm({ ...assignForm, assigned_date: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button disabled={!assignForm.employee_uuid || assign.isPending} onClick={() => assign.mutate()}>
              {assign.isPending ? 'Assigning...' : 'Assign Seat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit license master fields (design spec §8, final-review fix #6) ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit License</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label className="mb-2">Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><Label className="mb-2">Publisher (optional)</Label><Input value={editForm.publisher_name} onChange={(e) => setEditForm({ ...editForm, publisher_name: e.target.value })} /></div>
            <div><Label className="mb-2">Seats Purchased</Label><Input type="number" min={1} value={editForm.seats_purchased} onChange={(e) => setEditForm({ ...editForm, seats_purchased: e.target.value })} /></div>
            <div><Label className="mb-2">Cost per Seat (optional)</Label><Input type="number" min={0} value={editForm.cost_per_seat} onChange={(e) => setEditForm({ ...editForm, cost_per_seat: e.target.value })} /></div>
            <div>
              <Label className="mb-2">Billing Term</Label>
              <Select value={editForm.billing_term} onValueChange={(v) => setEditForm({ ...editForm, billing_term: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="perpetual">Perpetual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="mb-2">Purchase Date (optional)</Label><Input type="date" value={editForm.purchase_date} onChange={(e) => setEditForm({ ...editForm, purchase_date: e.target.value })} /></div>
            {editForm.billing_term !== 'perpetual' && (
              <div><Label className="mb-2">Expiry Date</Label><Input type="date" value={editForm.expiry_date} onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })} /></div>
            )}
            <div><Label className="mb-2">Notes (optional)</Label><Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button disabled={!editForm.name || update.isPending} onClick={() => update.mutate()}>
              {update.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation (final-review fix #6) ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete License?</AlertDialogTitle>
            <AlertDialogDescription>
              {license.name} will be permanently removed. This is only possible while the license has no active assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {remove.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
