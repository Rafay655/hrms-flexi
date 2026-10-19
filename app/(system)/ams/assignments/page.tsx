'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { amsService } from '@/services/ams.service';
import { employeeService } from '@/services/employee.service';

export default function AssignmentManagerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'active' | 'returned' | 'overdue'>('active');
  const [returnUuid, setReturnUuid] = useState<string | null>(null);
  const [returnCondition, setReturnCondition] = useState('good');

  // ── Apply Bundle (Phase 3B) ──────────────────────────────
  // Lets IT provision a new hire's full onboarding kit in one action instead
  // of assigning each asset individually via /ams/assignments/new. Applying
  // creates an AmsBundleApplication (not immediate assignments) — the user is
  // routed to its detail/confirm-fulfillment page to serialize actual units
  // against each requested line, matching how amsService.applyBundle/
  // getBundleApplication (Task 8) and the bundles settings page (Task 9) are
  // already wired.
  const [applyBundleOpen, setApplyBundleOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({ employee_uuid: '', bundle_uuid: '' });

  const { data: employees } = useQuery({
    queryKey: ['people-hub', 'employees', 'all'],
    queryFn: () => employeeService.getAll({ per_page: 500, detailed: 0 }),
  });

  const { data: bundlesRes } = useQuery({
    queryKey: ['ams', 'bundles', 'active'],
    queryFn: () => amsService.getBundles({ active_only: true, per_page: 100 }),
  });
  const activeBundles = bundlesRes?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['ams', 'assignments', tab],
    queryFn: () => amsService.getAssignments({
      active_only: tab === 'active' ? true : undefined,
      overdue_only: tab === 'overdue' ? true : undefined,
    }),
  });

  const returnMutation = useMutation({
    mutationFn: () => amsService.returnAssignment(returnUuid!, { condition_at_return: returnCondition }),
    onSuccess: () => {
      toast.success('Return recorded.');
      queryClient.invalidateQueries({ queryKey: ['ams', 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['ams', 'assets'] });
      setReturnUuid(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not record return.'),
  });

  const applyBundleMutation = useMutation({
    mutationFn: () => amsService.applyBundle({
      bundle_uuid: applyForm.bundle_uuid,
      employee_uuid: applyForm.employee_uuid,
    }),
    onSuccess: (application) => {
      toast.success('Bundle applied. Confirm fulfillment for each item.');
      queryClient.invalidateQueries({ queryKey: ['ams', 'assignments'] });
      setApplyBundleOpen(false);
      setApplyForm({ employee_uuid: '', bundle_uuid: '' });
      router.push(`/ams/bundle-applications/${application.uuid}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not apply bundle.'),
  });

  const assignments = (data?.data ?? []).filter((a) =>
    tab === 'returned' ? !!a.returned_date : !a.returned_date,
  );

  return (
    <div className="p-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Assignment Manager</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setApplyBundleOpen(true)}>
              <Package className="h-4 w-4" /> Apply Bundle
            </Button>
            <Button className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2" onClick={() => router.push('/ams/assignments/new')}>
              <Plus className="h-4 w-4" /> Assign Asset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="returned">Returned</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Asset</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Assigned Date</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-500">Loading...</td></tr>
                ) : assignments.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-500">No assignments in this view.</td></tr>
                ) : (
                  assignments.map((a) => (
                    <tr key={a.uuid} className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-sm font-medium">{a.asset?.asset_tag} — {a.asset?.name}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{a.assigned_date}</td>
                      <td className="py-4 px-6 text-sm text-gray-600 capitalize">{a.assignment_type}</td>
                      <td className="py-4 px-6 text-sm">
                        {a.is_overdue && <Badge className="bg-red-100 text-red-800">Overdue</Badge>}
                        {!a.is_overdue && !a.returned_date && <Badge className="bg-blue-100 text-blue-800">Active</Badge>}
                        {a.returned_date && <Badge className="bg-gray-100 text-gray-600">Returned</Badge>}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {!a.returned_date && (
                          <Button size="sm" variant="outline" onClick={() => setReturnUuid(a.uuid)}>Record Return</Button>
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

      <Dialog open={applyBundleOpen} onOpenChange={(open) => { setApplyBundleOpen(open); if (!open) setApplyForm({ employee_uuid: '', bundle_uuid: '' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Bundle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label className="mb-2">Employee</Label>
              <Select value={applyForm.employee_uuid} onValueChange={(uuid) => setApplyForm({ ...applyForm, employee_uuid: uuid })}>
                <SelectTrigger><SelectValue placeholder="Search employee" /></SelectTrigger>
                <SelectContent>
                  {(employees ?? []).map((e) => (
                    <SelectItem key={e.uuid} value={e.uuid}>{e.name ?? e.employee_code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2">Bundle</Label>
              <Select value={applyForm.bundle_uuid} onValueChange={(uuid) => setApplyForm({ ...applyForm, bundle_uuid: uuid })}>
                <SelectTrigger><SelectValue placeholder="Select a bundle" /></SelectTrigger>
                <SelectContent>
                  {activeBundles.map((b) => (
                    <SelectItem key={b.uuid} value={b.uuid}>{b.name} ({b.items.length} item{b.items.length === 1 ? '' : 's'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyBundleOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#1E1B4B] hover:bg-[#2A2675]"
              disabled={!applyForm.employee_uuid || !applyForm.bundle_uuid || applyBundleMutation.isPending}
              onClick={() => applyBundleMutation.mutate()}
            >
              {applyBundleMutation.isPending ? 'Applying...' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {returnUuid && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setReturnUuid(null)}>
          <div className="bg-white rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Record Asset Return</h3>
            <label className="text-sm text-gray-600 mb-2 block">Condition at Return</label>
            <Select value={returnCondition} onValueChange={setReturnCondition}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setReturnUuid(null)}>Cancel</Button>
              <Button
                className="bg-[#1E1B4B] hover:bg-[#2A2675]"
                disabled={returnMutation.isPending}
                onClick={() => returnMutation.mutate()}
              >
                {returnMutation.isPending ? 'Saving...' : 'Confirm Return'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
